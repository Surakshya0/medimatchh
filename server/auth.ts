import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, Patient, Doctor } from "@shared/schema";

declare global {
  namespace Express {
    // Define User interface for req.user without extending
    interface User {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      userType: string;
      password: string;
      createdAt?: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

function normalizeUser(user: any): User | undefined {
  if (!user) return user;
  if (user.createdAt === null) user.createdAt = undefined;
  return user;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const log = process.env.NODE_ENV === 'production' ? () => {} : console.log;

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomUUID(),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = normalizeUser(await storage.getUserByEmail(email));
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done: (err: any, user?: User | false | null) => void) => {
    try {
      const user = normalizeUser(await storage.getUser(id));
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      log("Registration request body:", JSON.stringify(req.body, null, 2));
      const { email, password, firstName, lastName, userType } = req.body;
      
      // Check if user already exists
      const existingUser = normalizeUser(await storage.getUserByEmail(email));
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      try {
        // Create the new user - use await directly to catch errors immediately
        const hashedPassword = await hashPassword(password);
        
        log("Creating user with data:", { email, firstName, lastName, userType });
        const user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          userType,
        });

        log("User created:", user.id);

        // Create profile based on user type
        let profile: Patient | Doctor | null = null;
        try {
          if (userType === "patient") {
            // Explicitly create patient profile
            const patientData = {
              userId: user.id,
              gender: req.body.profile?.gender || null,
              dateOfBirth: req.body.profile?.dateOfBirth || null,
              phone: req.body.profile?.phone || null,
              address: req.body.profile?.address || null,
              city: req.body.profile?.city || null,
              state: req.body.profile?.state || null,
              zipCode: req.body.profile?.zipCode || null,
              bloodType: req.body.profile?.bloodType || null,
            };
            log("Creating patient profile with data:", patientData);
            profile = await storage.createPatient(patientData);
          } else if (userType === "doctor") {
            // Explicitly create doctor profile
            const doctorData = {
              userId: user.id,
              specialty: req.body.profile?.specialty || "",
              hospitalAffiliation: req.body.profile?.hospitalAffiliation || "",
              experience: parseInt(req.body.profile?.experience || "0", 10),
              rating: 0,
              reviewCount: 0,
              acceptingNewPatients: true,
              education: req.body.profile?.education || null,
              licenseNumber: req.body.profile?.licenseNumber || null,
              about: req.body.profile?.about || null,
            };
            log("Creating doctor profile with data:", doctorData);
            profile = await storage.createDoctor(doctorData);
          }
          log("Profile created:", profile?.id);
          
          // Log the user in after successful profile creation
          req.login(user as User, (err: Error | null) => {
            if (err) {
              console.error("Login error:", err);
              return res.status(500).json({ message: "Registration successful but login failed" });
            }
            return res.status(201).json({ user, profile });
          });
        } catch (profileErr) {
          console.error("Error creating profile:", profileErr);
          // If profile creation fails, we should still login the user
          // but return an error message
          req.login(user as User, (loginErr: Error | null) => {
            if (loginErr) {
              console.error("Login error after profile creation failed:", loginErr);
              return res.status(500).json({ message: "Registration partially successful, but profile setup and login failed" });
            }
            return res.status(201).json({ 
              user, 
              profile: null, 
              warning: "Account created but profile setup failed. Please update your profile." 
            });
          });
        }
      } catch (userErr) {
        console.error("Error creating user:", userErr);
        return res.status(500).json({ 
          message: "Failed to create user account: " + (userErr instanceof Error ? userErr.message : String(userErr)) 
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      // Return a more helpful error message
      return res.status(500).json({ 
        message: "Registration failed: " + (err instanceof Error ? err.message : String(err)) 
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      if (user && user.createdAt === null) user.createdAt = undefined;
      
      req.login(user as User, async (err: Error | null) => {
        if (err) return next(err);
        
        // Get profile data
        let profile: Patient | Doctor | null = null;
        if (user.userType === "patient") {
          profile = await storage.getPatientByUserId(user.id);
        } else if (user.userType === "doctor") {
          profile = await storage.getDoctorByUserId(user.id);
        }
        
        res.json({ user, profile });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user;
    (async () => {
      let profile: Patient | Doctor | null = null;
      if (user.userType === "patient") {
        profile = await storage.getPatientByUserId(user.id);
      } else if (user.userType === "doctor") {
        profile = await storage.getDoctorByUserId(user.id);
      }
      
      if (user && user.createdAt === null) user.createdAt = undefined;
      
      res.json({ user, profile });
    })().catch(err => {
      console.error("Error fetching profile:", err);
      res.status(500).json({ message: "Error fetching profile" });
    });
  });
}
