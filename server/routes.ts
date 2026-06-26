import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import express from "express";
import { z } from "zod";
import { insertUserSchema, insertPatientSchema, insertDoctorSchema, insertAppointmentSchema, insertHealthRecordSchema, insertReminderSchema, insertAvailabilitySchema, users } from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import https from "https";
import { URL } from "url";
// ── NEW v2 imports ────────────────────────────────────────────────────────────
import { classifier } from "./naiveBayes";
import { resolveSpecialty } from "./specialtyMapping";
// ─────────────────────────────────────────────────────────────────────────────

// Development-only logger — no-ops in production
const log = process.env.NODE_ENV === 'production' ? () => {} : console.log;

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file storage
const uploadsDir = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, 'profiles');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// Serve uploads directory statically
export function serveUploads(app: Express) {
  app.use('/uploads', express.static(uploadsDir));
  log('Static file serving set up for uploads directory:', uploadsDir);
}

// Create multer instance with file filter
const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication middleware and routes
  setupAuth(app);
  
  // Serve uploads directory statically
  serveUploads(app);

  // Authentication check middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    log('Checking authentication for route:', req.originalUrl);
    log('Is authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
      log('User from session:', req.user?.id, req.user?.email);
      return next();
    }
    log('Authentication failed for path:', req.originalUrl);
    res.status(401).json({ message: "Not authenticated" });
  };

  // Check user type middleware
  const checkUserType = (userType: string) => {
    return async (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.userType !== userType) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    };
  };

  // Shared appointment conflict checker — prevents double bookings
  async function checkAppointmentConflict(doctorId: number, date: Date, duration: number): Promise<boolean> {
    const existingAppointments = await storage.getAppointmentsByDoctorId(doctorId);
    const appointmentStart = new Date(date).getTime();
    const appointmentEnd = appointmentStart + (duration * 60000);

    return existingAppointments.some(appointment => {
      if (appointment.status === 'cancelled') return false;
      const existingStart = new Date(appointment.date).getTime();
      const existingEnd = existingStart + (appointment.duration * 60000);
      return appointmentStart < existingEnd && appointmentEnd > existingStart;
    });
  }

  // API Routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);
  
  // Neon database proxy endpoint for more resilient connections
  apiRouter.use("/neon-proxy", (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    
    // Extract the database URL from environment variable
    if (!process.env.DATABASE_URL) {
      return res.status(500).send('Database URL not configured');
    }
    
    try {
      // Parse the database URL
      const dbUrl = new URL(process.env.DATABASE_URL);
      
      // Forward the request to the actual database endpoint
      const proxyReq = https.request({
        hostname: dbUrl.hostname,
        port: dbUrl.port || 443,
        path: req.url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${dbUrl.username}:${dbUrl.password}`).toString('base64')}`
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      });
      
      // Handle proxy request errors
      proxyReq.on('error', (error) => {
        console.error('Neon proxy error:', error);
        res.status(502).send('Database Proxy Error');
      });
      
      // Forward the request body
      if (req.body) {
        proxyReq.write(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      }
      
      proxyReq.end();
    } catch (error) {
      console.error('Error processing Neon proxy request:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Symptoms routes
  apiRouter.get("/symptoms", async (req, res) => {
    try {
      const symptoms = await storage.getAllSymptoms();
      log(`GET /symptoms returning ${symptoms.length} symptoms`);
      res.status(200).json(symptoms);
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/hospitals", async (_req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.status(200).json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Doctors routes
  apiRouter.get("/doctors", async (req, res) => {
    try {
      let doctors;
      const { specialty, symptoms } = req.query;
      
      if (specialty) {
        doctors = await storage.getDoctorsBySpecialty(specialty as string);
      } else if (symptoms) {
        const symptomIds = Array.isArray(symptoms) 
          ? symptoms.map(s => parseInt(s as string)) 
          : [parseInt(symptoms as string)];
        doctors = await storage.getDoctorsBySymptomIds(symptomIds);
      } else {
        doctors = await storage.getAllDoctors();
      }
      
      // Get user data for each doctor
      const doctorsWithUserData = await Promise.all(
        doctors.map(async (doctor) => {
          const user = await storage.getUser(doctor.userId);
          return {
            ...doctor,
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email
          };
        })
      );
      
      res.status(200).json(doctorsWithUserData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Content-based doctor recommendation endpoint
  apiRouter.get("/doctor-recommendations", async (req, res) => {
    try {
      const { symptoms, page = "1", limit = "10" } = req.query;
      
      if (!symptoms) {
        log("No symptoms provided in request");
        return res.status(400).json({ message: "Symptoms are required for recommendations" });
      }
      
      log("Finding doctors for symptoms:", symptoms);
      
      // Parse symptom IDs and pagination parameters
      let symptomIds: number[] = [];
      
      try {
        if (Array.isArray(symptoms)) {
          log("Handling array of symptoms:", symptoms);
          symptomIds = symptoms
            .filter(s => s) // Filter out empty values
            .map(s => {
              const parsed = parseInt(s.toString());
              log(`Parsing symptom ID: ${s} -> ${parsed}`);
              return parsed;
            })
            .filter(id => !isNaN(id) && id > 0);
        } else if (typeof symptoms === 'string') {
          // Handle comma-separated list of symptom IDs
          log("Handling comma-separated symptoms:", symptoms);
          
          if (symptoms.trim() === '') {
            log("Empty symptoms string provided");
            return res.status(400).json({ message: "No valid symptom IDs provided" });
          }
          
          symptomIds = symptoms.split(',')
            .filter(s => s.trim() !== '') // Filter out empty entries
            .map(s => {
              const parsed = parseInt(s.trim());
              log(`Parsing symptom ID: ${s.trim()} -> ${parsed}`);
              return parsed;
            })
            .filter(id => !isNaN(id) && id > 0);
        }
      } catch (parseError) {
        console.error("Error parsing symptom IDs:", parseError);
        return res.status(400).json({ message: "Invalid symptom IDs format" });
      }
      
      if (symptomIds.length === 0) {
        log("No valid symptom IDs found in request");
        return res.status(400).json({ message: "No valid symptom IDs provided" });
      }
      
      log("Processed symptom IDs:", symptomIds);
      
      const pageNumber = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 10;
      
      // Get recommendations using fallback mechanism that handles database errors
      let recommendations;
      try {
        // First try to get all doctors for debugging
        try {
          const allDoctors = await storage.getAllDoctors();
          log(`Database has ${allDoctors.length} doctors total`);
        } catch (dbError) {
          console.error("Error getting all doctors:", dbError);
        }
        
        // Get ranked doctor recommendations using our Content-Based Filtering algorithm
        recommendations = await storage.getDoctorsBySymptomIdsRanked(symptomIds);
      } catch (dbError) {
        console.error("Database error in doctor recommendations:", dbError);
        
        // Use fallback data if database fails
        log("Using fallback data for doctor recommendations");
        
        // Import fallback data
        const { fallbackSymptoms, fallbackDoctors, fallbackUsers, fallbackDoctorSymptoms } = await import("./fallbackData");
        
        // Filter doctor-symptom relations to find matches
        const matchingDoctorSymptoms = fallbackDoctorSymptoms.filter(ds => 
          symptomIds.includes(ds.symptomId)
        );
        
        log(`Found ${matchingDoctorSymptoms.length} matching doctor-symptom relations in fallback data`);
        
        // Map to count symptom matches and expertise per doctor
        const doctorSymptomMatchesMap = new Map<number, number>();
        const doctorExpertiseMap = new Map<number, number>();
        
        // Tally up symptom matches and expertise scores
        for (const ds of matchingDoctorSymptoms) {
          // Count symptom matches
          const currentMatches = doctorSymptomMatchesMap.get(ds.doctorId) || 0;
          doctorSymptomMatchesMap.set(ds.doctorId, currentMatches + 1);

          // Sum expertise scores
          const currentExpertise = doctorExpertiseMap.get(ds.doctorId) || 0;
          doctorExpertiseMap.set(ds.doctorId, currentExpertise + (ds.expertise || 3));
        }
        
        // Get all unique doctor IDs with matches
        const doctorIds = Array.from(doctorSymptomMatchesMap.keys());
        
        // Calculate match scores for each matching doctor
        recommendations = [];
        
        for (const doctorId of doctorIds) {
          // Find doctor and user info
          const doctor = fallbackDoctors.find(d => d.id === doctorId);
          if (!doctor) continue;
          
          const user = fallbackUsers.find(u => u.id === doctor.userId);
          if (!user) continue;
          
          // Calculate match score
          const symptomMatches = doctorSymptomMatchesMap.get(doctorId) || 0;
          const expertise = doctorExpertiseMap.get(doctorId) || 0;
          const experienceScore = Math.min(doctor.experience / 30, 1); // Normalize to 0-1 (max 30 years)
          const ratingScore = doctor.rating ? (doctor.rating / 5) : 0.5; // Normalize to 0-1, default to 0.5 if no rating

          // Normalize symptom matches (0-1 scale)
          const maxPossibleMatches = symptomIds.length;
          const normalizedMatches = symptomMatches / maxPossibleMatches;

          // Normalize expertise (0-1 scale, assuming expertise ranges from 1-5)
          const maxPossibleExpertise = 5 * symptomMatches; // Perfect expertise score
          const normalizedExpertise = maxPossibleExpertise > 0 ? expertise / maxPossibleExpertise : 0;

          // Calculate final score (0-100 scale) — must match storage.ts weights
          const matchScore = (
            (normalizedMatches * 0.35) + 
            (normalizedExpertise * 0.25) + 
            (experienceScore * 0.20) + 
            (ratingScore * 0.20)
          ) * 100;
          
          recommendations.push({
            doctor,
            user,
            matchScore: Math.round(matchScore * 10) / 10, // Round to 1 decimal place
            symptomMatches
          });
        }
        
        // Sort recommendations by match score
        recommendations.sort((a, b) => b.matchScore - a.matchScore);
      }
      
      log(`Found ${recommendations.length} doctor recommendations`);
      
      // For debugging, log doctor IDs and match scores
      if (recommendations.length > 0) {
        log("Top matches:");
        recommendations.slice(0, 3).forEach((rec, i) => {
          log(`  ${i+1}. Doctor ID ${rec.doctor.id} (${rec.user.firstName} ${rec.user.lastName}): ${rec.matchScore} score, ${rec.symptomMatches} symptom matches`);
        });
      }
      
      // Implement pagination
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = pageNumber * pageSize;
      const paginatedResults = recommendations.slice(startIndex, endIndex);
      
      // Format the response with pagination metadata
      const response = {
        results: paginatedResults,
        pagination: {
          total: recommendations.length,
          pages: Math.ceil(recommendations.length / pageSize),
          currentPage: pageNumber,
          pageSize: pageSize
        }
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error getting doctor recommendations:', error);
      res.status(500).json({ message: "Server error: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Debug endpoint for testing doctor ID routing
  apiRouter.get("/debug/doctor-id/:id", async (req, res) => {
    log(`Debug doctor-id received: ${req.params.id}, type: ${typeof req.params.id}`);
    res.status(200).json({ doctorId: req.params.id, type: typeof req.params.id });
  });

  apiRouter.get("/doctors/:id", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      const user = await storage.getUser(doctor.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      // Only include email for authenticated users
      if (!req.isAuthenticated?.()) {
        const { email, ...publicData } = userWithoutPassword;
        res.status(200).json({
          ...doctor,
          ...publicData
        });
      } else {
        res.status(200).json({
          ...doctor,
          ...userWithoutPassword
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Appointments routes
  apiRouter.post("/appointments", isAuthenticated, async (req, res) => {
    log('POST /appointments request received with body:', req.body);
    try {
      let appointmentData = {...req.body};
      
      // Convert date string to Date object
      if (appointmentData.date && typeof appointmentData.date === 'string') {
        log('Converting date string to Date object:', appointmentData.date);
        appointmentData.date = new Date(appointmentData.date);
        log('Date after conversion:', appointmentData.date);
      }
      
      // Symptoms are stored as JSONB — objects with name and duration are passed directly
      
      // Auto-detect patient ID from the logged-in user
      if (!appointmentData.patientId) {
        const patientProfile = await storage.getPatientByUserId(req.user.id);
        if (patientProfile) {
          appointmentData.patientId = patientProfile.id;
        }
      }
      
      // Verify the patient exists
      const patient = await storage.getPatient(appointmentData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Verify the doctor exists
      const doctor = await storage.getDoctor(appointmentData.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Check for appointment conflicts - PREVENT DOUBLE BOOKINGS
      log('Checking for appointment conflicts...');
      const hasConflict = await checkAppointmentConflict(appointmentData.doctorId, appointmentData.date, appointmentData.duration);
      
      if (hasConflict) {
        log('Appointment conflict detected - rejecting booking');
        return res.status(409).json({ 
          message: "This time slot is already booked. Please choose a different time." 
        });
      }
      
      log('No conflicts found - proceeding with appointment creation');
      
      // Validate the transformed data
      log('Validating appointment data:', appointmentData);
      appointmentData = insertAppointmentSchema.parse(appointmentData);
      
      log("Creating appointment with data:", appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      log("Created appointment:", appointment);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Appointment validation error:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Appointment creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin routes
  
  // Get all users (admin only)
  apiRouter.get("/admin/users", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Remove password from response
      const users = allUsers.map(({ password, ...user }) => user);
      
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update doctor profile (admin only)
  apiRouter.patch("/admin/doctors/:id", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      const updatedDoctor = await storage.updateDoctor(doctorId, req.body);
      
      if (!updatedDoctor) {
        return res.status(500).json({ message: "Failed to update doctor profile" });
      }
      
      res.status(200).json(updatedDoctor);
    } catch (error) {
      console.error("Error updating doctor profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update patient profile (admin only)
  apiRouter.patch("/admin/patients/:id", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Split body into user fields and patient fields
      const { firstName, lastName, email, ...patientFields } = req.body;
      
      let updatedPatient;
      
      // Update patient table fields (only if there are patient-specific fields)
      if (Object.keys(patientFields).length > 0) {
        updatedPatient = await storage.updatePatient(patientId, patientFields);
        if (!updatedPatient) {
          return res.status(500).json({ message: "Failed to update patient profile" });
        }
      } else {
        updatedPatient = patient;
      }
      
      // Update user table fields if provided
      if (firstName || lastName || email) {
        const userUpdate: Record<string, any> = {};
        if (firstName) userUpdate.firstName = firstName;
        if (lastName) userUpdate.lastName = lastName;
        if (email) userUpdate.email = email;
        await storage.updateUser(patient.userId, userUpdate);
      }
      
      res.status(200).json(updatedPatient);
    } catch (error) {
      console.error("Error updating patient profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user (admin only)
  apiRouter.patch("/admin/users/:id", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent updating password, email, or userType directly through this endpoint
      const { password, email, userType, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update current user profile (name, email)
  apiRouter.patch("/user", isAuthenticated, async (req, res) => {
    try {
      const { password, userType, email, ...updateData } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get all patients (admin only)
  apiRouter.get("/admin/patients", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const allPatients = await storage.getAllPatients();
      
      const enrichedPatients = await Promise.all(
        allPatients.map(async (patient) => {
          const user = await storage.getUser(patient.userId);
          if (!user) return null;
          const { password, ...userWithoutPassword } = user;
          return { ...userWithoutPassword, ...patient };
        })
      );
      
      res.status(200).json(enrichedPatients.filter(Boolean));
    } catch (error) {
      console.error("Error fetching all patients:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get all doctors with details (admin only)
  apiRouter.get("/admin/doctors", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      
      // Enrich doctor data with user details
      const enrichedDoctors = await Promise.all(
        doctors.map(async (doctor) => {
          const user = await storage.getUser(doctor.userId);
          if (!user) return null;
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          return {
            ...userWithoutPassword,
            ...doctor
          };
        })
      );
      
      // Filter out any null values
      const validDoctors = enrichedDoctors.filter(d => d !== null);
      
      res.status(200).json(validDoctors);
    } catch (error) {
      console.error("Error fetching all doctors:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create doctor (admin only)
  apiRouter.post("/admin/doctors", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const { firstName, lastName, email, password, specialty, experience, hospitalAffiliation } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(409).json({ message: "Email already in use" });

      const hashedPassword = await hashPassword(password);
      const [user] = await db.insert(users).values({
        email, password: hashedPassword, firstName, lastName, userType: "doctor"
      }).returning();

      const doctor = await storage.createDoctor({
        userId: user.id,
        specialty: specialty || "General Practice",
        experience: experience || 0,
        hospitalAffiliation: hospitalAffiliation || null,
        education: null,
        licenseNumber: `MD${Math.floor(100000 + Math.random() * 900000)}`,
        acceptingNewPatients: true,
        about: null,
        profilePicture: null,
        rating: 5,
        reviewCount: 0,
      });

      res.status(201).json({ ...doctor, firstName, lastName, email });
    } catch (error) {
      console.error("Error creating doctor:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create patient (admin only)
  apiRouter.post("/admin/patients", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const { firstName, lastName, email, password, phone } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(409).json({ message: "Email already in use" });

      const hashedPassword = await hashPassword(password);
      const [user] = await db.insert(users).values({
        email, password: hashedPassword, firstName, lastName, userType: "patient"
      }).returning();

      const patient = await storage.createPatient({
        userId: user.id,
        phone: phone || null,
        dateOfBirth: null,
        gender: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        insuranceProvider: null,
        insurancePolicyNumber: null,
        bloodType: null,
        profilePicture: null,
      });

      res.status(201).json({ ...patient, firstName, lastName, email, phone });
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete doctor (admin only)
  apiRouter.delete("/admin/doctors/:id", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });

      await storage.deleteDoctor(doctorId);
      await storage.deleteUser(doctor.userId);
      res.status(200).json({ message: "Doctor deleted" });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete patient (admin only)
  apiRouter.delete("/admin/patients/:id", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      if (!patient) return res.status(404).json({ message: "Patient not found" });

      await storage.deletePatient(patientId);
      await storage.deleteUser(patient.userId);
      res.status(200).json({ message: "Patient deleted" });
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Admin: Disease-Symptom training data management ──
  apiRouter.get("/admin/disease-symptoms", isAuthenticated, checkUserType("admin"), async (_req, res) => {
    try {
      const data = await storage.getDiseaseSymptoms();
      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching disease symptoms:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/admin/disease-symptoms", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const { diseaseName, symptomId, relevanceScore } = req.body;
      if (!diseaseName || !symptomId) {
        return res.status(400).json({ message: "diseaseName and symptomId are required" });
      }
      const created = await storage.createDiseaseSymptom({
        diseaseName,
        symptomId,
        relevanceScore: relevanceScore || 3,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating disease symptom:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/admin/disease-symptoms/:id", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDiseaseSymptom(id);
      res.status(200).json({ message: "Disease-symptom mapping deleted" });
    } catch (error) {
      console.error("Error deleting disease symptom:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Trigger Naive Bayes retraining
  apiRouter.post("/admin/retrain-model", isAuthenticated, checkUserType("admin"), async (_req, res) => {
    try {
      const dbRecords = await storage.getTrainingData();
      if (dbRecords.length > 0) {
        classifier.retrainFromDB(dbRecords);
        res.status(200).json({
          message: `Model retrained with ${dbRecords.length} records, ${classifier.getDiseaseCount()} diseases`,
        });
      } else {
        res.status(400).json({ message: "No training data found in database" });
      }
    } catch (error) {
      console.error("Error retraining model:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all appointments (admin only)
  apiRouter.get("/appointments", isAuthenticated, checkUserType("admin"), async (req, res) => {
    try {
      // Hack: Get patient and doctor IDs first to get all appointments
      const doctors = await storage.getAllDoctors();
      const doctorIds = doctors.map(doctor => doctor.id);
      
      // Get appointments for each doctor
      const appointmentsByDoctor = await Promise.all(
        doctorIds.map(async (doctorId) => {
          return await storage.getAppointmentsByDoctorId(doctorId);
        })
      );
      
      // Flatten the array of arrays
      const allAppointments = appointmentsByDoctor.flat();
      
      // Enrich appointments with doctor and patient data
      const enrichedAppointments = await Promise.all(
        allAppointments.map(async (appointment) => {
          const doctor = await storage.getDoctor(appointment.doctorId);
          const doctorUser = doctor ? await storage.getUser(doctor.userId) : null;
          const patient = await storage.getPatient(appointment.patientId);
          const patientUser = patient ? await storage.getUser(patient.userId) : null;

          return {
            ...appointment,
            doctor: doctor ? {
              ...doctor,
              firstName: doctorUser?.firstName,
              lastName: doctorUser?.lastName
            } : null,
            patient: patient ? {
              ...patient,
              firstName: patientUser?.firstName,
              lastName: patientUser?.lastName
            } : null
          };
        })
      );

      res.status(200).json(enrichedAppointments);
    } catch (error) {
      console.error("Error fetching all appointments:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/appointments/patient", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      const appointments = await storage.getAppointmentsByPatientId(patient.id);
      
      // Get doctor details for each appointment
      const appointmentsWithDoctorData = await Promise.all(
        appointments.map(async (appointment) => {
          const doctor = await storage.getDoctor(appointment.doctorId);
          const user = doctor ? await storage.getUser(doctor.userId) : null;
          
          return {
            ...appointment,
            doctor: doctor ? {
              ...doctor,
              firstName: user?.firstName,
              lastName: user?.lastName
            } : null
          };
        })
      );
      
      res.status(200).json(appointmentsWithDoctorData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/appointments/doctor", isAuthenticated, checkUserType("doctor"), async (req, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      const appointments = await storage.getAppointmentsByDoctorId(doctor.id);
      
      // Get patient details for each appointment
      const appointmentsWithPatientData = await Promise.all(
        appointments.map(async (appointment) => {
          const patient = await storage.getPatient(appointment.patientId);
          const user = patient ? await storage.getUser(patient.userId) : null;
          
          return {
            ...appointment,
            patient: patient ? {
              ...patient,
              firstName: user?.firstName,
              lastName: user?.lastName
            } : null
          };
        })
      );
      
      res.status(200).json(appointmentsWithPatientData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/appointments/:id", isAuthenticated, async (req, res) => {
    log('PATCH /appointments/:id with ID:', req.params.id);
    log('Request body:', req.body);
    try {
      const appointmentId = parseInt(req.params.id);
      log('Looking up appointment with ID:', appointmentId);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        log('Appointment not found:', appointmentId);
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      log('Found appointment:', appointment);
      
      // Check authorization based on user type
      const user = req.user;
      if (!user) {
        log('User not found in request');
        return res.status(401).json({ message: "User not found" });
      }
      
      log('User from session:', user.id, user.email, user.userType);
      
      if (user.userType === "patient") {
        log('Checking patient authorization');
        const patient = await storage.getPatientByUserId(user.id);
        log('Patient profile:', patient);
        if (!patient || patient.id !== appointment.patientId) {
          log('Patient not authorized. Patient ID:', patient?.id, 'Appointment patient ID:', appointment.patientId);
          return res.status(403).json({ message: "Forbidden" });
        }
      } else if (user.userType === "doctor") {
        log('Checking doctor authorization');
        const doctor = await storage.getDoctorByUserId(user.id);
        log('Doctor profile:', doctor);
        if (!doctor || doctor.id !== appointment.doctorId) {
          log('Doctor not authorized. Doctor ID:', doctor?.id, 'Appointment doctor ID:', appointment.doctorId);
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      log('Authorization passed, updating appointment');
      
      // Process the update data — strip fields that shouldn't change
      const updateData = { ...req.body };
      delete updateData.doctorId; // Don't allow reassigning doctors
      delete updateData.patientId; // Don't allow reassigning patients
      
      // Convert date string to Date object if provided
      if (updateData.date && typeof updateData.date === 'string') {
        try {
          log('Converting date string to Date object:', updateData.date);
          updateData.date = new Date(updateData.date);
          log('Date after conversion:', updateData.date);
        } catch (error) {
          console.error('Failed to convert date:', error);
          return res.status(400).json({ 
            message: "Invalid date format", 
            details: error instanceof Error ? error.message : String(error) 
          });
        }
      }
      
      // Check for appointment conflicts if date or duration is being updated
      if (updateData.date || updateData.duration) {
        log('Checking for appointment conflicts during reschedule...');
        const newDate = updateData.date || appointment.date;
        const newDuration = updateData.duration || appointment.duration;
        
        const existingAppointments = await storage.getAppointmentsByDoctorId(appointment.doctorId);
        const appointmentStart = new Date(newDate).getTime();
        const appointmentEnd = appointmentStart + (newDuration * 60000);
        
        const hasConflict = existingAppointments.some(existingApp => {
          if (existingApp.status === 'cancelled') return false;
          if (existingApp.id === appointmentId) return false; // skip self
          const existingStart = new Date(existingApp.date).getTime();
          const existingEnd = existingStart + (existingApp.duration * 60000);
          return appointmentStart < existingEnd && appointmentEnd > existingStart;
        });
        
        if (hasConflict) {
          log('Appointment reschedule conflict detected - rejecting update');
          return res.status(409).json({ 
            message: "This time slot is already booked. Please choose a different time." 
          });
        }
        
        log('No reschedule conflicts found - proceeding with appointment update');
      }
      
      // Update appointment
      const updatedAppointment = await storage.updateAppointment(appointmentId, updateData);
      if (!updatedAppointment) {
        log('Failed to update appointment');
        return res.status(404).json({ message: "Failed to update appointment" });
      }
      
      log('Appointment updated successfully:', updatedAppointment);
      res.status(200).json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: "Server error", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Health Records routes
  apiRouter.post("/health-records", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      log("Received health record request:", req.body);
      
      // Handle the patientId automatically from the authenticated user
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      // Prepare the data with correct patientId
      const requestData = { 
        ...req.body,
        patientId: patient.id 
      };
      
      // Special handling for date field to support various formats
      if (requestData.date) {
        try {
          if (typeof requestData.date === 'string') {
            // Try to parse the date string correctly
            const dateObj = new Date(requestData.date);
            log("Parsed date from string:", dateObj);
            
            if (!isNaN(dateObj.getTime())) {
              requestData.date = dateObj;
            } else {
              throw new Error("Invalid date format");
            }
          } else if (requestData.date instanceof Date) {
            // Date object directly passed
            log("Using date object directly:", requestData.date);
          } else {
            // Unknown format
            log("Unknown date format:", typeof requestData.date, requestData.date);
            throw new Error("Unsupported date format");
          }
        } catch (dateErr) {
          console.error("Date parsing error:", dateErr);
          return res.status(400).json({ 
            message: "Invalid date format",
            details: "The date must be in a valid format (YYYY-MM-DD)"
          });
        }
      } else if (requestData.date === undefined) {
        // Only default to now when date was not provided at all
        requestData.date = new Date();
      }
      // If null was explicitly passed, keep it null
      
      log("Validated health record data:", requestData);
      // Use the schema to validate (it now accepts string or Date for date field)
      const healthRecordData = insertHealthRecordSchema.parse(requestData);
      
      // Create the health record
      log("Creating health record:", healthRecordData);
      const healthRecord = await storage.createHealthRecord(healthRecordData);
      
      res.status(201).json(healthRecord);
    } catch (error) {
      console.error("Health record creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          details: "Validation failed for the health record data"
        });
      }
      res.status(500).json({ 
        message: "Server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  apiRouter.get("/health-records", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      const healthRecords = await storage.getHealthRecordsByPatientId(patient.id);
      res.status(200).json(healthRecords);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get health records for a specific patient (doctor access)
  apiRouter.get("/health-records/:patientId", isAuthenticated, checkUserType("doctor"), async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const healthRecords = await storage.getHealthRecordsByPatientId(patientId);
      res.status(200).json(healthRecords);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create patient profile for existing users
  apiRouter.post("/patient-profile", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (user.userType !== "patient") {
        return res.status(403).json({ message: "Only patient accounts can create patient profiles" });
      }
      
      log("Initializing patient profile for user:", user?.id);
      
      // First check if a patient profile already exists
      const existingPatient = await storage.getPatientByUserId(user.id);
      if (existingPatient) {
        log("Patient profile already exists:", existingPatient.id);
        return res.status(200).json({ patient: existingPatient, message: "Patient profile already exists" });
      }
      
      // Create a new patient profile
      const patientData = {
        userId: user.id,
        // Use default values or those from the request
        gender: req.body?.gender || null,
        dateOfBirth: req.body?.dateOfBirth || null,
        phone: req.body?.phone || null,
        address: req.body?.address || null,
        city: req.body?.city || null,
        state: req.body?.state || null,
        zipCode: req.body?.zipCode || null,
        bloodType: req.body?.bloodType || null,
      };
      
      log("Creating patient profile with data:", patientData);
      const patient = await storage.createPatient(patientData);
      log("Patient profile created:", patient.id);
      
      res.status(201).json({ 
        patient,
        message: "Patient profile created successfully" 
      });
    } catch (error) {
      console.error("Error initializing patient profile:", error);
      res.status(500).json({ 
        message: "Failed to create patient profile: " + (error instanceof Error ? error.message : String(error)) 
      });
    }
  });
  
  // Get patient profile for current logged-in user
  apiRouter.get("/patient-profile", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const patient = await storage.getPatientByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      res.status(200).json(patient);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update patient profile for current logged-in user
  apiRouter.patch("/patient-profile", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const patient = await storage.getPatientByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      // Prepare update data, format date if needed
      const updateData = { ...req.body };
      
      // Convert string date to Date object if present
      if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
        try {
          updateData.dateOfBirth = new Date(updateData.dateOfBirth);
          // Validate that it's a valid date
          if (isNaN(updateData.dateOfBirth.getTime())) {
            updateData.dateOfBirth = null;
          }
        } catch (err) {
          console.error("Invalid date format:", updateData.dateOfBirth);
          updateData.dateOfBirth = null;
        }
      }
      
      // Update the patient profile
      const updatedPatient = await storage.updatePatient(patient.id, updateData);
      
      if (!updatedPatient) {
        return res.status(500).json({ message: "Failed to update patient profile" });
      }
      
      res.status(200).json(updatedPatient);
    } catch (error) {
      console.error("Error updating patient profile:", error);
      res.status(500).json({ message: "Failed to update patient profile" });
    }
  });
  
  // Patient profile image upload/delete routes
  apiRouter.post("/patient/:id/image", isAuthenticated, upload.single('profileImage'), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Verify that the authenticated user is the patient's user or an admin
      if (req.user.id !== patient.userId && req.user.userType !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this patient's profile" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Create the image URL path
      const imagePath = `/uploads/profiles/${req.file.filename}`;
      
      // Delete old profile picture if it exists
      if (patient.profilePicture) {
        try {
          const oldImagePath = path.join(__dirname, '..', patient.profilePicture);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            log(`Deleted old profile image: ${oldImagePath}`);
          }
        } catch (deleteError) {
          console.error('Error deleting old profile image:', deleteError);
        }
      }
      
      // Update patient profile with new image path
      const updatedPatient = await storage.updatePatient(patientId, {
        profilePicture: imagePath
      });
      
      if (!updatedPatient) {
        return res.status(500).json({ message: "Failed to update patient profile" });
      }
      
      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePicture: imagePath
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  apiRouter.delete("/patient/:id/image", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Verify that the authenticated user is the patient's user or an admin
      if (req.user.id !== patient.userId && req.user.userType !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this patient's profile" });
      }
      
      // If patient already has no profile picture
      if (!patient.profilePicture) {
        return res.status(200).json({ message: "No profile picture to delete" });
      }
      
      // Delete the profile picture file
      try {
        const imagePath = path.join(__dirname, '..', patient.profilePicture);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          log(`Deleted profile image: ${imagePath}`);
        }
      } catch (deleteError) {
        console.error('Error deleting profile image:', deleteError);
      }
      
      // Update patient profile to remove image path
      const updatedPatient = await storage.updatePatient(patientId, {
        profilePicture: null
      });
      
      if (!updatedPatient) {
        return res.status(500).json({ message: "Failed to update patient profile" });
      }
      
      res.status(200).json({
        message: "Profile picture deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting profile image:", error);
      res.status(500).json({ message: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Doctor profile routes
  apiRouter.post("/doctor-profile", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (user.userType !== "doctor") {
        return res.status(403).json({ message: "Only doctor accounts can create doctor profiles" });
      }
      
      log("Initializing doctor profile for user:", user?.id);
      
      // First check if a doctor profile already exists
      const existingDoctor = await storage.getDoctorByUserId(user.id);
      if (existingDoctor) {
        log("Doctor profile already exists:", existingDoctor.id);
        return res.status(200).json({ doctor: existingDoctor, message: "Doctor profile already exists" });
      }
      
      // Create a new doctor profile
      const doctorData = {
        userId: user.id,
        specialty: req.body?.specialty || "General Practice",
        hospitalAffiliation: req.body?.hospitalAffiliation || req.body?.hospital || null,
        education: req.body?.education || null,
        experience: req.body?.experience || 0,
        about: req.body?.about || req.body?.bio || null,
        licenseNumber: req.body?.licenseNumber || `MD${Math.floor(100000 + Math.random() * 900000)}`,
        acceptingNewPatients: true,
        rating: req.body?.rating || null,
        profilePicture: null,
        reviewCount: 0,
      };
      
      log("Creating doctor profile with data:", doctorData);
      const doctor = await storage.createDoctor(doctorData);
      log("Doctor profile created:", doctor.id);
      
      res.status(201).json({ 
        doctor,
        message: "Doctor profile created successfully" 
      });
    } catch (error) {
      console.error("Error initializing doctor profile:", error);
      res.status(500).json({ 
        message: "Failed to create doctor profile: " + (error instanceof Error ? error.message : String(error)) 
      });
    }
  });
  
  // Get doctor profile for current logged-in user
  apiRouter.get("/doctor-profile", isAuthenticated, checkUserType("doctor"), async (req, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      res.status(200).json(doctor);
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update doctor profile for current logged-in user
  apiRouter.patch("/doctor-profile", isAuthenticated, checkUserType("doctor"), async (req, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      // Update the doctor profile
      const updatedDoctor = await storage.updateDoctor(doctor.id, req.body);
      
      if (!updatedDoctor) {
        return res.status(500).json({ message: "Failed to update doctor profile" });
      }
      
      res.status(200).json(updatedDoctor);
    } catch (error) {
      console.error("Error updating doctor profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Doctor patients list
  apiRouter.get("/doctor/patients", isAuthenticated, checkUserType("doctor"), async (req, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.id);
      if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

      const appointments = await storage.getAppointmentsByDoctorId(doctor.id);

      const patientMap = new Map<number, { id: number; firstName: string; lastName: string; email: string; phone: string; lastVisit: string }>();

      for (const apt of appointments) {
        if (patientMap.has(apt.patientId)) {
          const existing = patientMap.get(apt.patientId)!;
          const aptDate = apt.date instanceof Date ? apt.date.toISOString().split("T")[0] : String(apt.date).split("T")[0];
          if (aptDate > existing.lastVisit) existing.lastVisit = aptDate;
          continue;
        }
        const patient = await storage.getPatient(apt.patientId);
        if (!patient) continue;
        const user = await storage.getUser(patient.userId);
        if (!user) continue;
        const aptDate = apt.date instanceof Date ? apt.date.toISOString().split("T")[0] : String(apt.date).split("T")[0];
        patientMap.set(apt.patientId, {
          id: patient.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: patient.phone ?? "",
          lastVisit: aptDate,
        });
      }

      const patients = Array.from(patientMap.values());
      patients.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
      res.status(200).json(patients);
    } catch (error) {
      console.error("Error fetching doctor patients:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Doctor profile image upload/delete routes
  apiRouter.post("/doctor/:id/image", isAuthenticated, upload.single('profileImage'), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Verify that the authenticated user is the doctor's user or an admin
      if (req.user.id !== doctor.userId && req.user.userType !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this doctor's profile" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Create the image URL path
      const imagePath = `/uploads/profiles/${req.file.filename}`;
      
      // Delete old profile picture if it exists
      if (doctor.profilePicture) {
        try {
          const oldImagePath = path.join(__dirname, '..', doctor.profilePicture);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            log(`Deleted old profile image: ${oldImagePath}`);
          }
        } catch (deleteError) {
          console.error('Error deleting old profile image:', deleteError);
        }
      }
      
      // Update doctor profile with new image path
      const updatedDoctor = await storage.updateDoctor(doctorId, {
        profilePicture: imagePath
      });
      
      if (!updatedDoctor) {
        return res.status(500).json({ message: "Failed to update doctor profile" });
      }
      
      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePicture: imagePath
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  apiRouter.delete("/doctor/:id/image", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Verify that the authenticated user is the doctor's user or an admin
      if (req.user.id !== doctor.userId && req.user.userType !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this doctor's profile" });
      }
      
      // If doctor already has no profile picture
      if (!doctor.profilePicture) {
        return res.status(200).json({ message: "No profile picture to delete" });
      }
      
      // Delete the profile picture file
      try {
        const imagePath = path.join(__dirname, '..', doctor.profilePicture);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          log(`Deleted profile image: ${imagePath}`);
        }
      } catch (deleteError) {
        console.error('Error deleting profile image:', deleteError);
      }
      
      // Update doctor profile to remove image path
      const updatedDoctor = await storage.updateDoctor(doctorId, {
        profilePicture: null
      });
      
      if (!updatedDoctor) {
        return res.status(500).json({ message: "Failed to update doctor profile" });
      }
      
      res.status(200).json({
        message: "Profile picture deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting profile image:", error);
      res.status(500).json({ message: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  });

  // Reminders routes
  apiRouter.post("/reminders", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const reminderData = insertReminderSchema.parse(req.body);
      
      // Make sure the authenticated user is the patient
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient || patient.id !== reminderData.patientId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const reminder = await storage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/reminders", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      const reminders = await storage.getRemindersByPatientId(patient.id);
      res.status(200).json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/reminders/:id", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      const reminder = await storage.getReminder(reminderId);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      // Make sure the authenticated user is the patient
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient || patient.id !== reminder.patientId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedReminder = await storage.updateReminder(reminderId, req.body);
      if (!updatedReminder) {
        return res.status(404).json({ message: "Failed to update reminder" });
      }
      
      res.status(200).json(updatedReminder);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Doctor availability routes
  apiRouter.get("/doctors/:id/availability", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Get availability for the doctor
      const availability = await storage.getAvailabilityByDoctorId(doctorId);
      
      // Format the response by day of week for easier client-side processing
      const availabilityByDay: Record<number, { id: number; startTime: string; endTime: string }[]> = {};
      for (const slot of availability) {
        // Initialize the day array if it doesn't exist
        if (!availabilityByDay[slot.dayOfWeek]) {
          availabilityByDay[slot.dayOfWeek] = [];
        }
        
        // Only include available slots
        if (slot.isAvailable) {
          availabilityByDay[slot.dayOfWeek].push({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      }
      
      res.status(200).json(availabilityByDay);
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Set availability slots for doctor
  apiRouter.post("/doctors/:id/availability", isAuthenticated, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
      if (req.user.id !== doctor.userId && req.user.userType !== "admin")
        return res.status(403).json({ message: "Not authorized" });

      const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
      const slot = await storage.createAvailability({
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: isAvailable !== false,
      });
      res.status(201).json(slot);
    } catch (error) {
      console.error('Error creating availability:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update availability slot
  apiRouter.patch("/doctors/:id/availability/:slotId", isAuthenticated, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const doctorId = parseInt(req.params.id);
      const slotId = parseInt(req.params.slotId);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
      if (req.user.id !== doctor.userId && req.user.userType !== "admin")
        return res.status(403).json({ message: "Not authorized" });

      const updated = await storage.updateAvailability(slotId, req.body);
      if (!updated) return res.status(404).json({ message: "Availability slot not found" });
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete availability slot
  apiRouter.delete("/doctors/:id/availability/:slotId", isAuthenticated, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const doctorId = parseInt(req.params.id);
      const slotId = parseInt(req.params.slotId);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
      if (req.user.id !== doctor.userId && req.user.userType !== "admin")
        return res.status(403).json({ message: "Not authorized" });

      const deleted = await storage.deleteAvailability(slotId);
      if (!deleted) return res.status(404).json({ message: "Availability slot not found" });
      res.status(200).json({ message: "Availability slot deleted" });
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get full patient details by ID (for doctors)
  apiRouter.get("/patients/:id", isAuthenticated, checkUserType("doctor"), async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      if (!patient) return res.status(404).json({ message: "Patient not found" });

      const user = await storage.getUser(patient.userId);
      if (!user) return res.status(404).json({ message: "Patient user not found" });

      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ ...patient, email: userWithoutPassword.email, firstName: userWithoutPassword.firstName, lastName: userWithoutPassword.lastName });
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Telemedicine appointment booking with calendar integration
  apiRouter.post("/appointments/telemedicine", isAuthenticated, checkUserType("patient"), async (req, res) => {
    try {
      // Validate appointment data
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // Auto-detect patient ID from the logged-in user
      if (!appointmentData.patientId) {
        const patientProfile = await storage.getPatientByUserId(req.user.id);
        if (patientProfile) {
          appointmentData.patientId = patientProfile.id;
        }
      }
      
      // Make sure the authenticated user is the patient
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient || patient.id !== appointmentData.patientId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Make sure the requested time slot is available
      const doctor = await storage.getDoctor(appointmentData.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Check for appointment conflicts - PREVENT DOUBLE BOOKINGS
      log('Checking for telemedicine appointment conflicts...');
      const hasConflict = await checkAppointmentConflict(appointmentData.doctorId, appointmentData.date, appointmentData.duration);
      
      if (hasConflict) {
        log('Telemedicine appointment conflict detected - rejecting booking');
        return res.status(409).json({ 
          message: "This time slot is already booked. Please choose a different time." 
        });
      }
      
      log('No telemedicine conflicts found - proceeding with appointment creation');
      
      // Extract day of week and time from the appointment date
      const appointmentDate = new Date(appointmentData.date);
      const dayOfWeek = appointmentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const hours = appointmentDate.getHours().toString().padStart(2, '0');
      const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
      const appointmentTime = `${hours}:${minutes}`;
      
      // Check if this time slot is available in the doctor's schedule
      const availability = await storage.getAvailabilityByDoctorId(appointmentData.doctorId);
      const availableSlot = availability.find(slot => 
        slot.dayOfWeek === dayOfWeek && 
        slot.startTime === appointmentTime && 
        slot.isAvailable
      );
      
      if (!availableSlot) {
        return res.status(400).json({ message: "This time slot is not available" });
      }
      
      // Generate a unique meeting link for telemedicine
      const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const meetingLink = `/telemedicine/meeting/${meetingId}`;
      
      // In a real-world implementation, we would integrate with a calendar provider API here
      // For demonstration purposes, we'll generate a mock calendar event ID
      const calendarEventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Create the appointment with telemedicine details
      const appointmentWithTelemedicine = {
        ...appointmentData,
        meetingLink,
        calendarEventId,
        type: "video" // Ensure it's a video appointment type
      };
      
      const appointment = await storage.createAppointment(appointmentWithTelemedicine);
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error booking telemedicine appointment:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── AI RECOMMENDATIONS ──────────────────────────────────────────────────────
  // Lazy retrain flag — retrain Naive Bayes from DB once on first request
  // POST /api/ai-recommendations
  // Full pipeline: symptom names → model (NB) → specialty → ranked doctors
  apiRouter.post("/ai-recommendations", isAuthenticated, async (req, res) => {
    try {
      const { symptomNames } = req.body as { symptomNames: string[] };

      if (!symptomNames || !Array.isArray(symptomNames) || symptomNames.length === 0) {
        return res.status(400).json({ message: "symptomNames array is required" });
      }

      const nbResult = classifier.predict(symptomNames);
      const prediction = {
        disease: nbResult.disease,
        confidence: nbResult.confidence,
        relativeConfidence: nbResult.relativeConfidence,
        normalizedEntropy: nbResult.normalizedEntropy,
        confidenceCategory: nbResult.confidenceCategory,
        topCandidates: nbResult.topCandidates,
      };

      log(`AI prediction [NB]: ${prediction.disease} (conf: ${prediction.confidence}, cat: ${prediction.confidenceCategory})`);

      // Stage 2 — Resolve predicted disease to medical specialty
      const specialty = resolveSpecialty(prediction.disease);
      log(`Resolved specialty: ${specialty}`);

      // Stage 3 — Fetch symptom IDs for the ranking step
      const symptomRecords = await Promise.all(
        symptomNames.map((name: string) => storage.getSymptomByName(name))
      );
      const symptomIds = symptomRecords
        .filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined)
        .map(s => s.id);

      // Get patient city for location-based ranking (if logged in as patient)
      let patientCity: string | undefined;
      if (req.user?.userType === "patient") {
        try {
          const patientProfile = await storage.getPatientByUserId(req.user.id);
          if (patientProfile?.city) patientCity = patientProfile.city;
        } catch { /* ignore */ }
      }

      // Stage 4 — Rank doctors filtered by specialty with location + availability
      const rankedDoctors = await storage.getDoctorsBySpecialtyRanked(symptomIds, specialty, {
        patientCity,
        checkAvailability: true,
      });

      // Format output
      const formattedDoctors = rankedDoctors.map(({ doctor, user, matchScore, symptomMatches }) => ({
        ...doctor,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        matchScore,
        symptomMatches,
      }));

      return res.status(200).json({
        prediction: {
          disease:           prediction.disease,
          confidence:        prediction.confidence,
          relativeConfidence: prediction.relativeConfidence,
          normalizedEntropy: prediction.normalizedEntropy,
          confidenceCategory: prediction.confidenceCategory,
          topCandidates:     prediction.topCandidates,
        },
        resolvedSpecialty: specialty,
        confidenceCategory: prediction.confidenceCategory,
        doctors: formattedDoctors,
      });

    } catch (error) {
      console.error("AI recommendation error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  // ── END AI RECOMMENDATIONS ────────────────────────────────────────────────

  const httpServer = createServer(app);
  return httpServer;
}