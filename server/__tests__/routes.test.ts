import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const mockSymptoms = vi.hoisted(() => [
  { id: 1, name: "Fever", description: null, bodyPart: null, severity: null },
  { id: 2, name: "Cough", description: null, bodyPart: null, severity: null },
]);

const mockDoctors = vi.hoisted(() => [
  { id: 1, userId: 1, specialty: "Cardiology", experience: 10, hospitalAffiliation: "City Hospital", location: null, education: null, licenseNumber: "MD123", acceptingNewPatients: true, about: null, profilePicture: null, rating: 4, reviewCount: 10 },
]);

const mockUsers = vi.hoisted(() => [
  { id: 1, email: "doctor@test.com", password: "hash", firstName: "John", lastName: "Doe", userType: "doctor", createdAt: new Date() },
]);

const mockHospitals = vi.hoisted(() => ["City Hospital", "General Hospital"]);

const mockAvailability = vi.hoisted(() => [
  { id: 1, doctorId: 1, dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
]);

vi.mock("../db", () => ({
  db: { insert: vi.fn(), select: vi.fn() },
  pool: { query: vi.fn(), end: vi.fn() },
}));

vi.mock("../storage", () => ({
  storage: {
    getAllSymptoms: vi.fn().mockResolvedValue(mockSymptoms),
    getAllDoctors: vi.fn().mockResolvedValue(mockDoctors),
    getDoctor: vi.fn().mockResolvedValue(mockDoctors[0]),
    getDoctorByUserId: vi.fn(),
    getUser: vi.fn().mockResolvedValue(mockUsers[0]),
    getUserByEmail: vi.fn(),
    getAllHospitals: vi.fn().mockResolvedValue(mockHospitals),
    getAvailabilityByDoctorId: vi.fn().mockResolvedValue(mockAvailability),
    getDoctorsBySpecialty: vi.fn(),
    getDoctorsBySymptomIds: vi.fn(),
    getDoctorsBySymptomIdsRanked: vi.fn(),
    getDoctorsBySpecialtyRanked: vi.fn(),
    getSymptomByName: vi.fn(),
    getPatientByUserId: vi.fn(),
    getPatient: vi.fn(),
    getAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    getAppointmentsByDoctorId: vi.fn().mockResolvedValue([]),
    getAppointmentsByPatientId: vi.fn(),
    createAppointment: vi.fn(),
    createDoctor: vi.fn(),
    createPatient: vi.fn(),
    updateDoctor: vi.fn(),
    updatePatient: vi.fn(),
    updateUser: vi.fn(),
    deleteDoctor: vi.fn(),
    deletePatient: vi.fn(),
    deleteUser: vi.fn(),
    createReminder: vi.fn(),
    getReminder: vi.fn(),
    updateReminder: vi.fn(),
    getRemindersByPatientId: vi.fn(),
    createHealthRecord: vi.fn(),
    getHealthRecordsByPatientId: vi.fn(),
    createAvailability: vi.fn(),
    updateAvailability: vi.fn(),
    deleteAvailability: vi.fn(),
    createDiseaseSymptom: vi.fn(),
    deleteDiseaseSymptom: vi.fn(),
    getDiseaseSymptoms: vi.fn(),
    getTrainingData: vi.fn(),
    getAllUsers: vi.fn(),
    getAllPatients: vi.fn(),
  },
}));

import express from "express";
import request from "supertest";
import { registerRoutes } from "../routes";

let app: express.Express;
let server: Awaited<ReturnType<typeof registerRoutes>>;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
}, 15000);

afterAll(() => {
  server.close();
});

describe("GET /api/symptoms", () => {
  it("returns 200 with symptoms array", async () => {
    const res = await request(app).get("/api/symptoms");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });
});

describe("GET /api/doctors", () => {
  it("returns 200 with doctors array", async () => {
    const res = await request(app).get("/api/doctors");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/doctors/:id", () => {
  it("returns 404 for non-existent doctor", async () => {
    const { storage } = await import("../storage");
    vi.mocked(storage.getDoctor).mockResolvedValueOnce(undefined);
    const res = await request(app).get("/api/doctors/99999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/hospitals", () => {
  it("returns 200 with hospitals array", async () => {
    const res = await request(app).get("/api/hospitals");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockHospitals);
  });
});

describe("GET /api/doctors/:id/availability", () => {
  it("returns 200 with availability grouped by day", async () => {
    const res = await request(app).get("/api/doctors/1/availability");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("1");
    expect(res.body["1"]).toHaveLength(1);
  });
});

describe("POST /api/ai-recommendations (unauthenticated)", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/ai-recommendations")
      .send({ symptomNames: ["fever", "cough"] });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/appointments (unauthenticated)", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/appointments");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/patient-profile (unauthenticated)", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/patient-profile");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/doctor-profile (unauthenticated)", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/doctor-profile");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users (unauthenticated)", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/debug/doctor-id/:id", () => {
  it("returns the id back", async () => {
    const res = await request(app).get("/api/debug/doctor-id/42");
    expect(res.status).toBe(200);
    expect(res.body.doctorId).toBe("42");
  });
});
