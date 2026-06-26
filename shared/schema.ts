import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  userType: text("user_type").notNull(), // 'patient' or 'doctor'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patient profile
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  bloodType: text("blood_type"),
  profilePicture: text("profile_picture"),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Specialties
export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"), // e.g., 'Primary Care', 'Surgery', 'Internal Medicine'
});

export const insertSpecialtySchema = createInsertSchema(specialties).omit({
  id: true,
});

export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialties.$inferSelect;

// Doctor profile
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  specialty: text("specialty").notNull(),
  experience: integer("experience").notNull(), // years of experience
  hospitalAffiliation: text("hospital_affiliation"),
  location: text("location"), // city/area for location-based ranking
  education: text("education"),
  licenseNumber: text("license_number"),
  acceptingNewPatients: boolean("accepting_new_patients").default(true),
  about: text("about"),
  profilePicture: text("profile_picture"),
  rating: integer("rating"),
  reviewCount: integer("review_count").default(0),
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;

// Symptoms
export const symptoms = pgTable("symptoms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  bodyPart: text("body_part"),
  severity: text("severity"), // mild, moderate, severe
});

export const insertSymptomSchema = createInsertSchema(symptoms).omit({
  id: true,
});

export type InsertSymptom = z.infer<typeof insertSymptomSchema>;
export type Symptom = typeof symptoms.$inferSelect;

// Doctor-Symptom mapping for matching algorithm
export const doctorSymptoms = pgTable("doctor_symptoms", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  symptomId: integer("symptom_id").notNull().references(() => symptoms.id),
  expertise: integer("expertise").default(1), // 1-5 scale, 5 being highest expertise
});

export const insertDoctorSymptomSchema = createInsertSchema(doctorSymptoms).omit({
  id: true,
});

export type InsertDoctorSymptom = z.infer<typeof insertDoctorSymptomSchema>;
export type DoctorSymptom = typeof doctorSymptoms.$inferSelect;

// Disease-Symptom mapping for Naive Bayes training data
export const diseaseSymptoms = pgTable("disease_symptoms", {
  id: serial("id").primaryKey(),
  diseaseName: text("disease_name").notNull(),
  symptomId: integer("symptom_id").notNull().references(() => symptoms.id),
  relevanceScore: integer("relevance_score").default(3), // 1-5, how strongly this symptom indicates the disease
});

export const insertDiseaseSymptomSchema = createInsertSchema(diseaseSymptoms).omit({
  id: true,
});

export type InsertDiseaseSymptom = z.infer<typeof insertDiseaseSymptomSchema>;
export type DiseaseSymptom = typeof diseaseSymptoms.$inferSelect;

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull(), // pending, confirmed, completed, cancelled
  type: text("type").notNull(), // in-person, video, phone
  reasonForVisit: text("reason_for_visit"),
  notes: text("notes"),
  symptoms: jsonb("symptoms").default([]), // Array of symptom objects with name and duration
  createdAt: timestamp("created_at").defaultNow(),
  meetingLink: text("meeting_link"),  // Link for telemedicine video call
  calendarEventId: text("calendar_event_id"), // ID from external calendar service
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Health Records
export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  recordType: text("record_type").notNull(), // medication, allergy, condition, vaccination, etc.
  name: text("name").notNull(),
  details: text("details"),
  date: timestamp("date"),
  isActive: boolean("is_active").default(true),
});

// Base schema without modifications
const baseHealthRecordSchema = createInsertSchema(healthRecords).omit({
  id: true,
});

// Create a custom schema that treats date as any type for better client-server compatibility
export const insertHealthRecordSchema = baseHealthRecordSchema.extend({
  // Allow the date to be passed as a string and transformed to a Date in the backend
  date: z.union([z.date(), z.string()]).optional(),
});

export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;
export type HealthRecord = typeof healthRecords.$inferSelect;

// Doctor Availability
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, Sunday-Saturday
  startTime: text("start_time").notNull(), // format: HH:MM in 24-hour
  endTime: text("end_time").notNull(), // format: HH:MM in 24-hour
  isAvailable: boolean("is_available").default(true),
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

// Reminders
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  type: text("type").notNull(), // medication, appointment, etc.
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
});

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
