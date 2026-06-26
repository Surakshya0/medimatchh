import {
  User, InsertUser, users,
  Patient, InsertPatient, patients,
  Doctor, InsertDoctor, doctors,
  Symptom, InsertSymptom, symptoms,
  DoctorSymptom, InsertDoctorSymptom, doctorSymptoms,
  DiseaseSymptom, InsertDiseaseSymptom, diseaseSymptoms,
  Appointment, InsertAppointment, appointments,
  HealthRecord, InsertHealthRecord, healthRecords,
  Availability, InsertAvailability, availability,
  Reminder, InsertReminder, reminders
} from "@shared/schema";
import { eq, and, gte, lt, ne, sql, inArray } from "drizzle-orm";
import { db, pool } from "./db";
import type { TrainingRecord } from "./naiveBayes";
import { resolveAllSpecialties } from "./specialtyMapping";

// modify the interface with any CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<void>;

  // Doctor methods
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctorData: Partial<Doctor>): Promise<Doctor | undefined>;
  getAllDoctors(): Promise<Doctor[]>;
  deleteDoctor(id: number): Promise<void>;
  getDoctorsBySpecialty(specialty: string): Promise<Doctor[]>;
  getAllHospitals(): Promise<string[]>;

  // Symptom methods
  getSymptom(id: number): Promise<Symptom | undefined>;
  getSymptomByName(name: string): Promise<Symptom | undefined>;
  createSymptom(symptom: InsertSymptom): Promise<Symptom>;
  getAllSymptoms(): Promise<Symptom[]>;

  // Doctor-Symptom methods
  createDoctorSymptom(doctorSymptom: InsertDoctorSymptom): Promise<DoctorSymptom>;
  getDoctorSymptomsByDoctorId(doctorId: number): Promise<DoctorSymptom[]>;
  getDoctorsBySymptomIds(symptomIds: number[]): Promise<Doctor[]>;
  getDoctorsBySymptomIdsRanked(symptomIds: number[], options?: { patientCity?: string; checkAvailability?: boolean }): Promise<{doctor: Doctor, user: User, matchScore: number, symptomMatches: number}[]>;
  getDoctorsBySpecialtyRanked(symptomIds: number[], specialty: string, options?: { patientCity?: string; checkAvailability?: boolean }): Promise<{doctor: Doctor, user: User, matchScore: number, symptomMatches: number}[]>;

  // Disease-Symptom methods (for Naive Bayes training)
  getDiseaseSymptoms(): Promise<(DiseaseSymptom & { symptomName: string })[]>;
  createDiseaseSymptom(data: InsertDiseaseSymptom): Promise<DiseaseSymptom>;
  deleteDiseaseSymptom(id: number): Promise<void>;
  getTrainingData(): Promise<TrainingRecord[]>;

  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  checkAppointmentConflict(doctorId: number, date: Date, duration: number, excludeAppointmentId?: number): Promise<boolean>;
  getAppointmentsByPatientId(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;

  // Health Record methods
  getHealthRecord(id: number): Promise<HealthRecord | undefined>;
  createHealthRecord(healthRecord: InsertHealthRecord): Promise<HealthRecord>;
  getHealthRecordsByPatientId(patientId: number): Promise<HealthRecord[]>;

  // Availability methods
  getAvailability(id: number): Promise<Availability | undefined>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, data: Partial<InsertAvailability>): Promise<Availability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;
  getAvailabilityByDoctorId(doctorId: number): Promise<Availability[]>;

  // Reminder methods
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getRemindersByPatientId(patientId: number): Promise<Reminder[]>;
  updateReminder(id: number, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
}

// In-memory storage for development and testing
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private doctors: Map<number, Doctor>;
  private symptoms: Map<number, Symptom>;
  private doctorSymptoms: Map<number, DoctorSymptom>;
  private appointments: Map<number, Appointment>;
  private healthRecords: Map<number, HealthRecord>;
  private availabilities: Map<number, Availability>;
  private reminders: Map<number, Reminder>;

  private userId: number;
  private patientId: number;
  private doctorId: number;
  private symptomId: number;
  private doctorSymptomId: number;
  private appointmentId: number;
  private healthRecordId: number;
  private availabilityId: number;
  private reminderId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.doctors = new Map();
    this.symptoms = new Map();
    this.doctorSymptoms = new Map();
    this.appointments = new Map();
    this.healthRecords = new Map();
    this.availabilities = new Map();
    this.reminders = new Map();

    this.userId = 1;
    this.patientId = 1;
    this.doctorId = 1;
    this.symptomId = 1;
    this.doctorSymptomId = 1;
    this.appointmentId = 1;
    this.healthRecordId = 1;
    this.availabilityId = 1;
    this.reminderId = 1;

    // Initialize with some symptom data
    this.initializeSymptoms();
  }

  private initializeSymptoms() {
    const commonSymptoms = [
      { name: "Headache", description: "Pain in the head or upper neck", bodyPart: "Head", severity: "moderate" },
      { name: "Cough", description: "Sudden expulsion of air from the lungs", bodyPart: "Chest", severity: "mild" },
      { name: "Fever", description: "Body temperature above the normal range", bodyPart: "Whole body", severity: "moderate" },
      { name: "Sore Throat", description: "Pain or irritation in the throat", bodyPart: "Throat", severity: "mild" },
      { name: "Fatigue", description: "Feeling of tiredness or exhaustion", bodyPart: "Whole body", severity: "moderate" },
      { name: "Chest Pain", description: "Pain or discomfort in the chest", bodyPart: "Chest", severity: "severe" },
      { name: "Shortness of Breath", description: "Difficulty breathing or catching breath", bodyPart: "Chest", severity: "severe" },
      { name: "Nausea", description: "Feeling of sickness with an inclination to vomit", bodyPart: "Stomach", severity: "moderate" },
      { name: "Dizziness", description: "Feeling lightheaded or unsteady", bodyPart: "Head", severity: "moderate" },
      { name: "Back Pain", description: "Pain in the back", bodyPart: "Back", severity: "moderate" }
    ];

    for (const symptom of commonSymptoms) {
      this.createSymptom(symptom);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.userId === userId);
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.patientId++;
    const newPatient: Patient = { ...patient, id };
    this.patients.set(id, newPatient);
    return newPatient;
  }
  
  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...patientData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<void> {
    this.patients.delete(id);
  }

  // Doctor methods
  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.userId === userId);
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorId++;
    const newDoctor: Doctor = { ...doctor, id };
    this.doctors.set(id, newDoctor);
    return newDoctor;
  }
  
  async updateDoctor(id: number, doctorData: Partial<Doctor>): Promise<Doctor | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;
    
    const updatedDoctor = { ...doctor, ...doctorData };
    this.doctors.set(id, updatedDoctor);
    return updatedDoctor;
  }

  async deleteDoctor(id: number): Promise<void> {
    this.doctors.delete(id);
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(doctor => doctor.specialty === specialty);
  }

  async getAllHospitals(): Promise<string[]> {
    const set = new Set<string>();
    for (const doctor of this.doctors.values()) {
      if (doctor.hospitalAffiliation) set.add(doctor.hospitalAffiliation);
    }
    return Array.from(set).sort();
  }

  // Symptom methods
  async getSymptom(id: number): Promise<Symptom | undefined> {
    return this.symptoms.get(id);
  }

  async getSymptomByName(name: string): Promise<Symptom | undefined> {
    return Array.from(this.symptoms.values()).find(symptom => symptom.name.toLowerCase() === name.toLowerCase());
  }

  async createSymptom(symptom: InsertSymptom): Promise<Symptom> {
    const id = this.symptomId++;
    const newSymptom: Symptom = { ...symptom, id };
    this.symptoms.set(id, newSymptom);
    return newSymptom;
  }

  async getAllSymptoms(): Promise<Symptom[]> {
    return Array.from(this.symptoms.values());
  }

  // Doctor-Symptom methods
  async createDoctorSymptom(doctorSymptom: InsertDoctorSymptom): Promise<DoctorSymptom> {
    const id = this.doctorSymptomId++;
    const newDoctorSymptom: DoctorSymptom = { ...doctorSymptom, id };
    this.doctorSymptoms.set(id, newDoctorSymptom);
    return newDoctorSymptom;
  }

  async getDoctorSymptomsByDoctorId(doctorId: number): Promise<DoctorSymptom[]> {
    return Array.from(this.doctorSymptoms.values()).filter(ds => ds.doctorId === doctorId);
  }

  async getDoctorsBySymptomIds(symptomIds: number[]): Promise<Doctor[]> {
    // Get all doctor symptoms that match the provided symptom IDs
    const matchingDoctorSymptoms = Array.from(this.doctorSymptoms.values()).filter(ds => 
      symptomIds.includes(ds.symptomId)
    );

    // Create a map to track expertise by doctor ID
    const doctorExpertiseMap = new Map<number, number>();

    // Tally up expertise scores for matching doctors
    for (const ds of matchingDoctorSymptoms) {
      const currentExpertise = doctorExpertiseMap.get(ds.doctorId) || 0;
      doctorExpertiseMap.set(ds.doctorId, currentExpertise + ds.expertise);
    }

    // Get the matching doctors
    const doctorIds = Array.from(doctorExpertiseMap.keys());
    const matchingDoctors = doctorIds
      .map(id => this.doctors.get(id))
      .filter((doctor): doctor is Doctor => !!doctor);

    // Sort doctors by their expertise score (highest first)
    return matchingDoctors.sort((a, b) => {
      const expertiseA = doctorExpertiseMap.get(a.id) || 0;
      const expertiseB = doctorExpertiseMap.get(b.id) || 0;
      return expertiseB - expertiseA;
    });
  }

  async getDoctorsBySymptomIdsRanked(symptomIds: number[]): Promise<{doctor: Doctor, user: User, matchScore: number, symptomMatches: number}[]> {
    console.log(`getDoctorsBySymptomIdsRanked called with symptomIds:`, symptomIds);
    
    // Log all doctors in the system
    const allDoctors = Array.from(this.doctors.values());
    console.log(`Total doctors in database: ${allDoctors.length}`);
    
    // Log all doctor-symptom relations
    const allDoctorSymptoms = Array.from(this.doctorSymptoms.values());
    console.log(`Total doctor-symptom relations in database: ${allDoctorSymptoms.length}`);
    
    // Ensure we have valid input
    if (!symptomIds || symptomIds.length === 0) {
      console.log("No symptom IDs provided, returning empty array");
      return [];
    }
    
    // If no doctor-symptom relations exist, automatically create some for testing
    if (allDoctorSymptoms.length === 0) {
      console.log("No doctor-symptom relations found in database, initializing for testing");
      this.initializeDoctorSymptoms();
    }
    
    // Log symptoms that we're searching for
    const symptoms = symptomIds.map(id => this.symptoms.get(id));
    console.log(`Searching for symptoms:`, symptoms.map(s => s ? `${s.id}: ${s.name}` : 'Unknown'));
    
    // Get all doctor symptoms that match the provided symptom IDs
    const matchingDoctorSymptoms = Array.from(this.doctorSymptoms.values()).filter(ds => {
      const isMatch = symptomIds.includes(ds.symptomId);
      if (isMatch) {
        console.log(`Found match: Doctor ${ds.doctorId} specializes in symptom ${ds.symptomId}`);
      }
      return isMatch;
    });
    
    console.log(`Found ${matchingDoctorSymptoms.length} matching doctor-symptom relations`);

    // Create maps to track symptom matches and scores
    const doctorSymptomMatchesMap = new Map<number, number>(); // Number of matching symptoms
    const doctorExpertiseMap = new Map<number, number>(); // Sum of expertise scores

    // Tally up symptom matches and expertise scores
    for (const ds of matchingDoctorSymptoms) {
      // Count symptom matches
      const currentMatches = doctorSymptomMatchesMap.get(ds.doctorId) || 0;
      doctorSymptomMatchesMap.set(ds.doctorId, currentMatches + 1);

      // Sum expertise scores (default to 3 if null)
      const currentExpertise = doctorExpertiseMap.get(ds.doctorId) || 0;
      doctorExpertiseMap.set(ds.doctorId, currentExpertise + (ds.expertise || 3));
    }

    // Log doctor matches
    console.log("Doctor matches:");
    for (const [doctorId, matches] of doctorSymptomMatchesMap.entries()) {
      console.log(`- Doctor ID ${doctorId}: ${matches} symptom matches`);
    }

    // Get all unique doctor IDs with matches
    const doctorIds = Array.from(doctorSymptomMatchesMap.keys());
    console.log(`Found ${doctorIds.length} doctors with matching symptoms`);

    // If no matches, return empty array
    if (doctorIds.length === 0) {
      console.log("No doctors matched the symptom criteria");
      return [];
    }

    // Calculate match scores for each doctor and combine with user data
    const results = await Promise.all(
      doctorIds.map(async (doctorId) => {
        const doctor = this.doctors.get(doctorId);
        if (!doctor) {
          console.log(`Doctor ${doctorId} not found in database`);
          return null;
        }

        const user = this.users.get(doctor.userId);
        if (!user) {
          console.log(`User not found for doctor ${doctorId} (userId: ${doctor.userId})`);
          return null;
        }

        // Calculate match score based on:
        // 1. Number of symptom matches (35%)
        // 2. Doctor's expertise in those symptoms (25%)
        // 3. Doctor's experience (20%)
        // 4. Doctor's rating (20%)

        const symptomMatches = doctorSymptomMatchesMap.get(doctorId) || 0;
        const expertise = doctorExpertiseMap.get(doctorId) || 0;
        const experienceScore = Math.min(doctor.experience / 30, 1);
        const ratingScore = doctor.rating ? (doctor.rating / 5) : 0.5;

        const maxPossibleMatches = symptomIds.length;
        const normalizedMatches = maxPossibleMatches > 0 ? symptomMatches / maxPossibleMatches : 0;

        const maxPossibleExpertise = 5 * symptomMatches;
        const normalizedExpertise = maxPossibleExpertise > 0 ? expertise / maxPossibleExpertise : 0;

        const matchScore = (
          (normalizedMatches * 0.35) + 
          (normalizedExpertise * 0.25) + 
          (experienceScore * 0.20) + 
          (ratingScore * 0.20)
        ) * 100;

        console.log(`Doctor ${doctor.id} (${user.firstName} ${user.lastName}) score components:
        - Symptom matches: ${symptomMatches}/${maxPossibleMatches} (normalized: ${normalizedMatches.toFixed(2)})
        - Expertise: ${expertise}/${maxPossibleExpertise} (normalized: ${normalizedExpertise.toFixed(2)})
        - Experience: ${doctor.experience} years (score: ${experienceScore.toFixed(2)})
        - Rating: ${doctor.rating || 'N/A'} (score: ${ratingScore.toFixed(2)})
        - TOTAL MATCH SCORE: ${matchScore.toFixed(1)}`);

        return {
          doctor,
          user,
          matchScore: Math.round(matchScore * 10) / 10, // Round to 1 decimal place
          symptomMatches
        };
      })
    );

    // Filter out null results and sort by match score (highest first)
    const filteredResults = results
      .filter((result): result is {doctor: Doctor, user: User, matchScore: number, symptomMatches: number} => result !== null)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`Returning ${filteredResults.length} ranked doctor recommendations`);
    
    return filteredResults;
  }

  async getDoctorsBySpecialtyRanked(
    symptomIds: number[],
    specialty: string
  ): Promise<{doctor: Doctor, user: User, matchScore: number, symptomMatches: number}[]> {
    const specialtyDoctors = Array.from(this.doctors.values()).filter(
      (d) => d.specialty === specialty
    );
    if (specialtyDoctors.length === 0) return [];

    const specialtyDoctorIds = new Set(specialtyDoctors.map((d) => d.id));
    const matchMap = new Map<number, number>();
    const expertiseMap = new Map<number, number>();
    if (symptomIds.length > 0) {
      for (const ds of this.doctorSymptoms.values()) {
        if (!specialtyDoctorIds.has(ds.doctorId) || !symptomIds.includes(ds.symptomId)) continue;
        matchMap.set(ds.doctorId, (matchMap.get(ds.doctorId) || 0) + 1);
        expertiseMap.set(ds.doctorId, (expertiseMap.get(ds.doctorId) || 0) + (ds.expertise || 3));
      }
    }

    const results = specialtyDoctors
      .map((doctor) => {
        const user = this.users.get(doctor.userId);
        if (!user) return null;

        const symMatches = matchMap.get(doctor.id) || 0;
        const expertise = expertiseMap.get(doctor.id) || 0;
        const symptomScore = symptomIds.length > 0 ? symMatches / symptomIds.length : 0;
        const expertiseScore = symMatches > 0 ? expertise / (5 * symMatches) : 0;
        const experienceScore = Math.min(parseInt(doctor.experience.toString()) / 30, 1);
        const ratingScore = doctor.rating ? doctor.rating / 5 : 0.5;

        const finalScore = (
          (symptomScore * 0.35) +
          (expertiseScore * 0.25) +
          (experienceScore * 0.20) +
          (ratingScore * 0.20)
        ) * 100;

        return {
          doctor,
          user,
          matchScore: Math.round(finalScore * 10) / 10,
          symptomMatches: symMatches,
        };
      })
      .filter((r): r is {doctor: Doctor, user: User, matchScore: number, symptomMatches: number} => r !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    return results;
  }
  
  // Helper method to ensure we have doctor-symptom relations for testing
  private initializeDoctorSymptoms() {
    console.log("Initializing doctor-symptom test data");
    
    // Get all doctors and symptoms
    const doctors = Array.from(this.doctors.values());
    const symptoms = Array.from(this.symptoms.values());
    
    if (doctors.length === 0 || symptoms.length === 0) {
      console.log("Can't initialize: no doctors or symptoms in database");
      return;
    }
    
    // For each doctor, assign 5-10 symptoms based on their specialty
    let relationCount = 0;
    
    for (const doctor of doctors) {
      // How many symptoms to assign (5-10)
      const symptomCount = 5 + Math.floor(Math.random() * 6);
      
      // Select symptoms - prefer ones related to specialty
      const selectedSymptoms = new Set<number>();
      
      // Helper function to get keywords for specialty
      const getSpecialtyKeywords = (specialty: string): string[] => {
        const specialtyMap: Record<string, string[]> = {
          'Cardiology': ['heart', 'chest', 'blood', 'pressure', 'pain'],
          'Dermatology': ['skin', 'rash', 'itch', 'acne', 'mole'],
          'Neurology': ['head', 'brain', 'nerve', 'headache', 'dizziness'],
          'Orthopedics': ['bone', 'joint', 'back', 'pain', 'fracture'],
          'Pediatrics': ['child', 'fever', 'ear', 'throat', 'cough'],
          'Psychiatry': ['mood', 'anxiety', 'depression', 'sleep', 'stress'],
          'Internal Medicine': ['abdomen', 'pain', 'nausea', 'fatigue', 'fever'],
          'Ophthalmology': ['eye', 'vision', 'blind', 'blur', 'pain'],
          'ENT': ['ear', 'nose', 'throat', 'hearing', 'voice'],
          'Pulmonology': ['lung', 'breath', 'cough', 'chest', 'respiratory'],
          'Gastroenterology': ['stomach', 'abdomen', 'digest', 'nausea', 'diarrhea'],
          'Endocrinology': ['hormone', 'thyroid', 'diabetes', 'weight', 'fatigue'],
          'OB/GYN': ['pregnancy', 'menstrual', 'vaginal', 'pelvic', 'birth'],
          'Urology': ['urinate', 'bladder', 'kidney', 'prostate', 'urine'],
          'Rheumatology': ['joint', 'arthritis', 'inflammation', 'pain', 'swelling'],
          'Oncology': ['cancer', 'tumor', 'mass', 'growth', 'lump'],
          'Allergy': ['allergy', 'asthma', 'rash', 'itch', 'immune'],
          'Family Medicine': ['general', 'check-up', 'routine', 'preventive', 'primary'],
          'General Practice': ['general', 'check-up', 'routine', 'preventive', 'primary']
        };
        
        // Return keywords for the specialty or default to generic keywords
        return specialtyMap[specialty] || ['pain', 'discomfort', 'fever', 'fatigue', 'general'];
      };
      
      const specialtyKeywords = getSpecialtyKeywords(doctor.specialty);
      
      // First try to add symptoms related to specialty
      for (const symptom of symptoms) {
        // Check if symptom name or description contains any keyword
        const matchesSpecialty = specialtyKeywords.some(keyword => 
          (symptom.name.toLowerCase().includes(keyword) || 
          (symptom.description && symptom.description.toLowerCase().includes(keyword)))
        );
        
        if (matchesSpecialty && selectedSymptoms.size < symptomCount) {
          selectedSymptoms.add(symptom.id);
        }
        
        // Break if we have enough symptoms
        if (selectedSymptoms.size >= symptomCount) break;
      }
      
      // If we still need more symptoms, add random ones
      if (selectedSymptoms.size < symptomCount) {
        const remainingCount = symptomCount - selectedSymptoms.size;
        const availableSymptoms = symptoms
          .filter(s => !selectedSymptoms.has(s.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, remainingCount);
        
        for (const symptom of availableSymptoms) {
          selectedSymptoms.add(symptom.id);
        }
      }
      
      // Create doctor-symptom relations
      for (const symptomId of selectedSymptoms) {
        // Random expertise level (1-5)
        const expertise = 1 + Math.floor(Math.random() * 5);
        
        const id = ++this.doctorSymptomId;
        const doctorSymptom: DoctorSymptom = {
          id,
          doctorId: doctor.id,
          symptomId,
          expertise
        };
        
        this.doctorSymptoms.set(id, doctorSymptom);
        relationCount++;
      }
    }
    
    console.log(`Created ${relationCount} doctor-symptom relations for ${doctors.length} doctors`);
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const hasConflict = await this.checkAppointmentConflict(appointment.doctorId, appointment.date, appointment.duration);
    if (hasConflict) {
      throw new Error('Time slot is already booked for this doctor');
    }

    const id = this.appointmentId++;
    const newAppointment: Appointment = {
      ...appointment,
      symptoms: appointment.symptoms ?? [],
      reasonForVisit: appointment.reasonForVisit ?? null,
      notes: appointment.notes ?? null,
      meetingLink: appointment.meetingLink ?? null,
      calendarEventId: appointment.calendarEventId ?? null,
      id,
      createdAt: new Date()
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async checkAppointmentConflict(doctorId: number, date: Date, duration: number, excludeAppointmentId?: number): Promise<boolean> {
    const startTime = date.getTime();
    const endTime = startTime + (duration * 60000);

    return Array.from(this.appointments.values()).some(existing => {
      if (existing.doctorId !== doctorId) return false;
      if (existing.status === 'cancelled') return false;
      if (excludeAppointmentId && existing.id === excludeAppointmentId) return false;

      const existingStart = existing.date instanceof Date ? existing.date.getTime() : new Date(existing.date).getTime();
      const existingEnd = existingStart + (existing.duration * 60000);
      return startTime < existingEnd && endTime > existingStart;
    });
  }

  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.doctorId === doctorId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updatedAppointment = { ...appointment, ...appointmentUpdate };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  // Health Record methods
  async getHealthRecord(id: number): Promise<HealthRecord | undefined> {
    return this.healthRecords.get(id);
  }

  async createHealthRecord(healthRecord: InsertHealthRecord): Promise<HealthRecord> {
    const id = this.healthRecordId++;
    
    // Ensure date is properly handled
    let processedDate: Date | null = null;
    
    if (healthRecord.date) {
      // Handle different date formats
      if (typeof healthRecord.date === 'string') {
        processedDate = new Date(healthRecord.date);
      } else if (healthRecord.date instanceof Date) {
        processedDate = healthRecord.date;
      }
      
      // Validate the date is valid
      if (processedDate && isNaN(processedDate.getTime())) {
        processedDate = null;
      }
    }
    
    // Create a sanitized health record with proper date type
    const sanitizedRecord = {
      ...healthRecord,
      date: processedDate,
    };
    
    const newHealthRecord: HealthRecord = { ...sanitizedRecord, id };
    this.healthRecords.set(id, newHealthRecord);
    return newHealthRecord;
  }

  async getHealthRecordsByPatientId(patientId: number): Promise<HealthRecord[]> {
    return Array.from(this.healthRecords.values())
      .filter(record => record.patientId === patientId);
  }

  // Availability methods
  async getAvailability(id: number): Promise<Availability | undefined> {
    return this.availabilities.get(id);
  }

  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const id = this.availabilityId++;
    const newAvailability: Availability = { ...availabilityData, id };
    this.availabilities.set(id, newAvailability);
    return newAvailability;
  }

  async getAvailabilityByDoctorId(doctorId: number): Promise<Availability[]> {
    return Array.from(this.availabilities.values())
      .filter(availability => availability.doctorId === doctorId);
  }

  async updateAvailability(id: number, data: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const existing = this.availabilities.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.availabilities.set(id, updated);
    return updated;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    return this.availabilities.delete(id);
  }

  // Reminder methods
  async getReminder(id: number): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const id = this.reminderId++;
    const newReminder: Reminder = { ...reminder, id };
    this.reminders.set(id, newReminder);
    return newReminder;
  }

  async getRemindersByPatientId(patientId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.patientId === patientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async updateReminder(id: number, reminderUpdate: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;

    const updatedReminder = { ...reminder, ...reminderUpdate };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }
  // ── Disease-Symptom methods (MemStorage) ──
  async getDiseaseSymptoms(): Promise<(DiseaseSymptom & { symptomName: string })[]> {
    return [];
  }

  async createDiseaseSymptom(data: InsertDiseaseSymptom): Promise<DiseaseSymptom> {
    const id = this.doctorSymptomId++; 
    const ds: DiseaseSymptom = { ...data, id };
    return ds;
  }

  async deleteDiseaseSymptom(id: number): Promise<void> {}

  async getTrainingData(): Promise<TrainingRecord[]> {
    return [];
  }
}

import connectPg from "connect-pg-simple";
import session from "express-session";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }
  
  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    try {
      // Create a clean copy of patientData to avoid mutating the original
      const updateData: Partial<Patient> = {...patientData};
      
      // Special handling for dateOfBirth
      if (updateData.dateOfBirth !== undefined) {
        // If it's null or a valid Date object, it's fine
        if (updateData.dateOfBirth === null) {
          // Keep as null
        } else if (updateData.dateOfBirth instanceof Date) {
          // Make sure it's a valid date
          if (isNaN(updateData.dateOfBirth.getTime())) {
            updateData.dateOfBirth = null;
          }
        } else if (typeof updateData.dateOfBirth === 'string') {
          // Parse date string (from the client)
          try {
            const parsedDate = new Date(updateData.dateOfBirth);
            if (!isNaN(parsedDate.getTime())) {
              updateData.dateOfBirth = parsedDate;
            } else {
              updateData.dateOfBirth = null;
            }
          } catch (e) {
            updateData.dateOfBirth = null;
          }
        } else {
          // Unknown format, set to null
          updateData.dateOfBirth = null;
        }
      }
      
      const [updatedPatient] = await db
        .update(patients)
        .set(updateData)
        .where(eq(patients.id, id))
        .returning();
      return updatedPatient;
    } catch (error) {
      console.error("Error updating patient:", error);
      return undefined;
    }
  }

  async deletePatient(id: number): Promise<void> {
    await db.delete(patients).where(eq(patients.id, id));
  }

  // Doctor methods
  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor;
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }
  
  async updateDoctor(id: number, doctorData: Partial<Doctor>): Promise<Doctor | undefined> {
    try {
      // Create a clean copy of doctorData to avoid mutating the original
      const updateData: Partial<Doctor> = {...doctorData};
      
      const [updatedDoctor] = await db
        .update(doctors)
        .set(updateData)
        .where(eq(doctors.id, id))
        .returning();
      return updatedDoctor;
    } catch (error) {
      console.error("Error updating doctor:", error);
      return undefined;
    }
  }

  async deleteDoctor(id: number): Promise<void> {
    await db.delete(doctors).where(eq(doctors.id, id));
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors);
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.specialty, specialty));
  }

  async getAllHospitals(): Promise<string[]> {
    const result = await db
      .select({ hospital: doctors.hospitalAffiliation })
      .from(doctors)
      .where(sql`${doctors.hospitalAffiliation} IS NOT NULL`)
      .groupBy(doctors.hospitalAffiliation)
      .orderBy(doctors.hospitalAffiliation);
    return result.map(r => r.hospital!);
  }

  // Symptom methods
  async getSymptom(id: number): Promise<Symptom | undefined> {
    const [symptom] = await db.select().from(symptoms).where(eq(symptoms.id, id));
    return symptom;
  }

  async getSymptomByName(name: string): Promise<Symptom | undefined> {
    const [symptom] = await db.select().from(symptoms).where(eq(symptoms.name, name));
    return symptom;
  }

  async createSymptom(symptom: InsertSymptom): Promise<Symptom> {
    const [newSymptom] = await db.insert(symptoms).values(symptom).returning();
    return newSymptom;
  }

  async getAllSymptoms(): Promise<Symptom[]> {
    return await db.select().from(symptoms);
  }

  // Doctor-Symptom methods
  async createDoctorSymptom(doctorSymptom: InsertDoctorSymptom): Promise<DoctorSymptom> {
    const [newDoctorSymptom] = await db.insert(doctorSymptoms).values(doctorSymptom).returning();
    return newDoctorSymptom;
  }

  async getDoctorSymptomsByDoctorId(doctorId: number): Promise<DoctorSymptom[]> {
    return await db.select().from(doctorSymptoms).where(eq(doctorSymptoms.doctorId, doctorId));
  }

  async getDoctorsBySymptomIds(symptomIds: number[]): Promise<Doctor[]> {
    // Get all doctor-symptom links that match the symptom IDs
    const doctorSymptomLinks = await db.select()
      .from(doctorSymptoms)
      .where(inArray(doctorSymptoms.symptomId, symptomIds));

    // Extract unique doctor IDs
    const doctorIds = [...new Set(doctorSymptomLinks.map(link => link.doctorId))];

    // If no matches, return empty array
    if (doctorIds.length === 0) return [];

    // Get doctor profiles
    return await db.select()
      .from(doctors)
      .where(inArray(doctors.id, doctorIds));
  }

  async getDoctorsBySymptomIdsRanked(
    symptomIds: number[],
    options?: { patientCity?: string; checkAvailability?: boolean }
  ): Promise<{doctor: Doctor, user: User, matchScore: number, symptomMatches: number}[]> {
    // Get all doctor symptoms that match the provided symptom IDs
    const doctorSymptomLinks = await db.select()
      .from(doctorSymptoms)
      .where(inArray(doctorSymptoms.symptomId, symptomIds));

    if (doctorSymptomLinks.length === 0) return [];

    // Create maps to track symptom matches and expertise scores
    const doctorSymptomMatchesMap = new Map<number, number>();
    const doctorExpertiseMap = new Map<number, number>();

    for (const ds of doctorSymptomLinks) {
      const currentMatches = doctorSymptomMatchesMap.get(ds.doctorId) || 0;
      doctorSymptomMatchesMap.set(ds.doctorId, currentMatches + 1);

      const expertiseValue = ds.expertise || 3;
      const currentExpertise = doctorExpertiseMap.get(ds.doctorId) || 0;
      doctorExpertiseMap.set(ds.doctorId, currentExpertise + expertiseValue);
    }

    const doctorIds = Array.from(doctorSymptomMatchesMap.keys());

    const matchingDoctors = await db.select()
      .from(doctors)
      .where(inArray(doctors.id, doctorIds));

    const doctorUserIds = matchingDoctors.map(doctor => doctor.userId);
    const doctorUsers = await db.select()
      .from(users)
      .where(inArray(users.id, doctorUserIds));

    const userMap = new Map<number, User>();
    for (const user of doctorUsers) {
      userMap.set(user.id, user);
    }

    // Fetch availability data if requested
    const hasAvailabilityMap = new Map<number, boolean>();
    if (options?.checkAvailability && doctorIds.length > 0) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const allSlots = await db
        .select()
        .from(availability)
        .where(
          and(
            inArray(availability.doctorId, doctorIds),
            eq(availability.isAvailable, true)
          )
        );
      for (const docId of doctorIds) {
        const docSlots = allSlots.filter(s => s.doctorId === docId);
        hasAvailabilityMap.set(docId, docSlots.some(s => {
          if (s.dayOfWeek < currentDay) return false;
          if (s.dayOfWeek === currentDay && s.startTime <= currentTime) return false;
          return true;
        }));
      }
    }

    const results = matchingDoctors.map(doctor => {
      const user = userMap.get(doctor.userId);
      if (!user) return null;

      const symptomMatches = doctorSymptomMatchesMap.get(doctor.id) || 0;
      const expertise = doctorExpertiseMap.get(doctor.id) || 0;
      const experienceScore = Math.min(parseInt(doctor.experience.toString()) / 30, 1);
      const ratingScore = doctor.rating ? (doctor.rating / 5) : 0.5;

      const maxPossibleMatches = symptomIds.length;
      const normalizedMatches = maxPossibleMatches > 0 ? symptomMatches / maxPossibleMatches : 0;

      const maxPossibleExpertise = 5 * symptomMatches;
      const normalizedExpertise = maxPossibleExpertise > 0 ? expertise / maxPossibleExpertise : 0;

      // Location score
      let locationScore = 0;
      if (options?.patientCity && doctor.location) {
        locationScore = doctor.location.toLowerCase() === options.patientCity.toLowerCase() ? 1.0 : 0.5;
      }

      // Availability score
      let availabilityScore = 0.5;
      if (options?.checkAvailability) {
        availabilityScore = hasAvailabilityMap.get(doctor.id) ? 1.0 : 0;
      }

      const matchScore = (
        (normalizedMatches * 0.30) + 
        (normalizedExpertise * 0.20) + 
        (experienceScore * 0.15) + 
        (ratingScore * 0.15) +
        (locationScore * 0.10) +
        (availabilityScore * 0.10)
      ) * 100;

      return {
        doctor,
        user,
        matchScore: Math.round(matchScore * 10) / 10,
        symptomMatches
      };
    });

    return results
      .filter((result): result is {doctor: Doctor, user: User, matchScore: number, symptomMatches: number} => result !== null)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  // ── NEW v2 METHOD ─────────────────────────────────────────────────────────
  // Stage 3 of the AI pipeline: rank doctors already filtered by specialty.
  // Called by POST /api/ai-recommendations after Naive Bayes + specialty mapping.
  async getDoctorsBySpecialtyRanked(
    symptomIds: number[],
    specialty: string,
    options?: { patientCity?: string; checkAvailability?: boolean; predictedDisease?: string }
  ): Promise<{doctor: Doctor, user: User, matchScore: number, symptomMatches: number}[]> {

    // Step 1 — determine which specialties to include
    // If predictedDisease is provided, use disease→specialty mapping
    // to include ALL relevant specialties with a relevance multiplier.
    // Otherwise, fall back to filtering by the single resolved specialty.
    const targetSpecialties = options?.predictedDisease
      ? resolveAllSpecialties(options.predictedDisease)
      : [specialty];

    const primarySpecialty = targetSpecialties[0];

    const specialtyDoctors = await db
      .select()
      .from(doctors)
      .where(inArray(doctors.specialty, targetSpecialties));

    if (specialtyDoctors.length === 0) {
      console.log(`No doctors found for specialties: ${targetSpecialties.join(", ")}`);
      return [];
    }

    const doctorIds = specialtyDoctors.map(d => d.id);

    // Step 2 — fetch symptom-doctor links for the filtered pool only
    let symptomLinks: { doctorId: number; symptomId: number; expertise: number | null }[] = [];
    if (symptomIds.length > 0) {
      symptomLinks = await db
        .select()
        .from(doctorSymptoms)
        .where(
          and(
            inArray(doctorSymptoms.doctorId, doctorIds),
            inArray(doctorSymptoms.symptomId, symptomIds)
          )
        );
    }

    // Build match and expertise maps
    const matchMap = new Map<number, number>();
    const expertiseMap = new Map<number, number>();
    for (const link of symptomLinks) {
      matchMap.set(link.doctorId, (matchMap.get(link.doctorId) || 0) + 1);
      expertiseMap.set(link.doctorId, (expertiseMap.get(link.doctorId) || 0) + (link.expertise || 3));
    }

    // Batch-fetch user data for all specialty doctors
    const userIds = specialtyDoctors.map(d => d.userId);
    const doctorUsers = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map<number, User>();
    for (const u of doctorUsers) userMap.set(u.id, u);

    // Step 2b — fetch availability data if requested
    const hasAvailabilityMap = new Map<number, boolean>();
    if (options?.checkAvailability) {
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sun, 6=Sat
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const allSlots = await db
        .select()
        .from(availability)
        .where(
          and(
            inArray(availability.doctorId, doctorIds),
            eq(availability.isAvailable, true)
          )
        );
      for (const docId of doctorIds) {
        const docSlots = allSlots.filter(s => s.doctorId === docId);
        hasAvailabilityMap.set(docId, docSlots.some(s => {
          if (s.dayOfWeek < currentDay) return false;
          if (s.dayOfWeek === currentDay && s.startTime <= currentTime) return false;
          return true;
        }));
      }
    }

    // Step 3 — score each doctor using the improved formula
    const results = specialtyDoctors
      .map(doctor => {
        const user = userMap.get(doctor.userId);
        if (!user) return null;

        const symMatches   = matchMap.get(doctor.id) || 0;
        const expertise    = expertiseMap.get(doctor.id) || 0;

        const symptomScore    = symptomIds.length > 0 ? symMatches / symptomIds.length : 0;
        const expertiseScore  = symMatches > 0 ? expertise / (5 * symMatches) : 0;
        const experienceScore = Math.min(parseInt(doctor.experience.toString()) / 30, 1);
        const ratingScore     = doctor.rating ? doctor.rating / 5 : 0.5;

        let locationScore = 0;
        if (options?.patientCity && doctor.location) {
          locationScore = doctor.location.toLowerCase() === options.patientCity.toLowerCase() ? 1.0 : 0.5;
        }

        let availabilityScore = 0.5;
        if (options?.checkAvailability) {
          availabilityScore = hasAvailabilityMap.get(doctor.id) ? 1.0 : 0;
        }

        // Disease-specialty relevance multiplier
        // Primary specialty gets 1.3x, secondary gets 1.1x, others get 1.0x
        let relevanceMultiplier = 1.0;
        if (options?.predictedDisease) {
          if (doctor.specialty === primarySpecialty) {
            relevanceMultiplier = 1.3;
          } else if (targetSpecialties.includes(doctor.specialty)) {
            relevanceMultiplier = 1.1;
          }
        }

        const finalScore = (
          (symptomScore      * 0.30) +
          (expertiseScore    * 0.20) +
          (experienceScore   * 0.15) +
          (ratingScore       * 0.15) +
          (locationScore     * 0.10) +
          (availabilityScore * 0.10)
        ) * 100 * relevanceMultiplier;

        return {
          doctor,
          user,
          matchScore: Math.round(finalScore * 10) / 10,
          symptomMatches: symMatches
        };
      })
      .filter((r): r is {doctor: Doctor, user: User, matchScore: number, symptomMatches: number} => r !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log(`getDoctorsBySpecialtyRanked: ${results.length} doctors ranked (specialties: ${targetSpecialties.join(", ")})`);
    return results;
  }
  // ── END NEW v2 METHOD ──────────────────────────────────────────────────────

  // ── Disease-Symptom methods (DatabaseStorage) ──
  async getDiseaseSymptoms(): Promise<(DiseaseSymptom & { symptomName: string })[]> {
    const rows = await db
      .select({
        id: diseaseSymptoms.id,
        diseaseName: diseaseSymptoms.diseaseName,
        symptomId: diseaseSymptoms.symptomId,
        relevanceScore: diseaseSymptoms.relevanceScore,
        symptomName: symptoms.name,
      })
      .from(diseaseSymptoms)
      .innerJoin(symptoms, eq(diseaseSymptoms.symptomId, symptoms.id));
    return rows;
  }

  async createDiseaseSymptom(data: InsertDiseaseSymptom): Promise<DiseaseSymptom> {
    const [created] = await db.insert(diseaseSymptoms).values(data).returning();
    return created;
  }

  async deleteDiseaseSymptom(id: number): Promise<void> {
    await db.delete(diseaseSymptoms).where(eq(diseaseSymptoms.id, id));
  }

  async getTrainingData(): Promise<TrainingRecord[]> {
    const rows = await this.getDiseaseSymptoms();
    const diseaseMap = new Map<string, string[]>();
    for (const row of rows) {
      if (!diseaseMap.has(row.diseaseName)) {
        diseaseMap.set(row.diseaseName, []);
      }
      diseaseMap.get(row.diseaseName)!.push(row.symptomName);
    }

    const records: TrainingRecord[] = [];
    for (const [disease, symptomList] of diseaseMap) {
      if (symptomList.length === 0) continue;
      // Generate multiple training records per disease by sampling different subsets
      // This gives the Naive Bayes classifier richer probability estimates
      const shuffled = [...symptomList].sort(() => 0.5 - Math.random());
      const mid = Math.max(2, Math.floor(shuffled.length / 2));
      records.push({ symptoms: shuffled.slice(0, mid), disease });
      if (shuffled.length > 3) {
        records.push({ symptoms: shuffled.slice(mid - 1), disease });
      }
      records.push({ symptoms: shuffled.slice(0, Math.min(4, shuffled.length)), disease });
    }
    return records;
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    // Use database transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Check for conflicts before creating
      const hasConflict = await this.checkAppointmentConflict(appointment.doctorId, appointment.date, appointment.duration);
      if (hasConflict) {
        throw new Error('Time slot is already booked for this doctor');
      }
      
      // Create the appointment
      const [newAppointment] = await tx.insert(appointments).values(appointment).returning();
      return newAppointment;
    });
  }

  async checkAppointmentConflict(doctorId: number, date: Date, duration: number, excludeAppointmentId?: number): Promise<boolean> {
    const startTime = date;
    const endTime = new Date(date.getTime() + (duration * 60000)); // Convert minutes to milliseconds
    
    // Query for overlapping appointments for the same doctor
    // Appointments overlap if: startTime < existing_end AND endTime > existing_start
    const conflictingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          ne(appointments.status, 'cancelled'),
          excludeAppointmentId ? ne(appointments.id, excludeAppointmentId) : undefined,
          // Check for time overlap using SQL interval logic
          lt(startTime, sql`${appointments.date} + INTERVAL '1 minute' * ${appointments.duration}`),
          gte(endTime, appointments.date)
        )
      );
    
    return conflictingAppointments.length > 0;
  }

  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.doctorId, doctorId));
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set(appointmentUpdate)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  // Health Record methods
  async getHealthRecord(id: number): Promise<HealthRecord | undefined> {
    const [healthRecord] = await db.select().from(healthRecords).where(eq(healthRecords.id, id));
    return healthRecord;
  }

  async createHealthRecord(healthRecord: InsertHealthRecord): Promise<HealthRecord> {
    try {
      console.log("DB storage: Creating health record with data:", healthRecord);
      
      // Ensure date is properly handled before DB insertion
      let processedRecord = { ...healthRecord };
      
      if (processedRecord.date) {
        // Handle different date formats
        if (typeof processedRecord.date === 'string') {
          processedRecord.date = new Date(processedRecord.date);
        }
        
        // Ensure date is valid
        if (processedRecord.date instanceof Date && isNaN(processedRecord.date.getTime())) {
          processedRecord.date = null;
        }
      }
      
      console.log("DB storage: Processed record for insertion:", processedRecord);
      const [newHealthRecord] = await db.insert(healthRecords).values(processedRecord).returning();
      return newHealthRecord;
    } catch (error) {
      console.error("Error creating health record in database:", error);
      throw error; // Re-throw for proper error handling upstream
    }
  }

  async getHealthRecordsByPatientId(patientId: number): Promise<HealthRecord[]> {
    return await db.select().from(healthRecords).where(eq(healthRecords.patientId, patientId));
  }

  // Availability methods
  async getAvailability(id: number): Promise<Availability | undefined> {
    const [availabilityRecord] = await db.select().from(availability).where(eq(availability.id, id));
    return availabilityRecord;
  }

  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const [newAvailability] = await db.insert(availability).values(availabilityData).returning();
    return newAvailability;
  }

  async getAvailabilityByDoctorId(doctorId: number): Promise<Availability[]> {
    return await db.select().from(availability).where(eq(availability.doctorId, doctorId));
  }

  async updateAvailability(id: number, data: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const [updated] = await db.update(availability).set(data).where(eq(availability.id, id)).returning();
    return updated;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const [deleted] = await db.delete(availability).where(eq(availability.id, id)).returning();
    return !!deleted;
  }

  // Reminder methods
  async getReminder(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async getRemindersByPatientId(patientId: number): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.patientId, patientId));
  }

  async updateReminder(id: number, reminderUpdate: Partial<Reminder>): Promise<Reminder | undefined> {
    const [updatedReminder] = await db.update(reminders)
      .set(reminderUpdate)
      .where(eq(reminders.id, id))
      .returning();
    return updatedReminder;
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();