import {
  User, Doctor, Symptom, DoctorSymptom
} from "@shared/schema";

// Fallback in-memory data for doctor recommendations
export const fallbackSymptoms: Symptom[] = [
  { id: 11, name: "Headache", description: "Pain in the head", bodyPart: "Head", severity: "Varies" },
  { id: 12, name: "Fever", description: "Elevated body temperature", bodyPart: "Whole body", severity: "Varies" },
  { id: 13, name: "Cough", description: "Expulsion of air from lungs", bodyPart: "Chest", severity: "Varies" },
  { id: 14, name: "Nausea", description: "Feeling of sickness with urge to vomit", bodyPart: "Stomach", severity: "Moderate" },
  { id: 15, name: "Fatigue", description: "Feeling of tiredness and low energy", bodyPart: "Whole body", severity: "Mild" },
  { id: 16, name: "Sore Throat", description: "Pain in the throat", bodyPart: "Throat", severity: "Mild" },
  { id: 17, name: "Dizziness", description: "Feeling lightheaded or unsteady", bodyPart: "Head", severity: "Moderate" },
  { id: 18, name: "Rash", description: "Area of irritated or swollen skin", bodyPart: "Skin", severity: "Mild" },
  { id: 19, name: "Chest Pain", description: "Pain in the chest area", bodyPart: "Chest", severity: "Severe" },
  { id: 20, name: "Shortness of Breath", description: "Difficulty breathing", bodyPart: "Chest", severity: "Severe" }
];

export const fallbackDoctors: Doctor[] = [
  {
    id: 101,
    userId: 101,
    specialty: "Cardiology",
    experience: 15,
    about: "Experienced cardiologist specializing in heart conditions",
    hospitalAffiliation: "Kathmandu Medical College",
    education: "Nepal Medical University",
    licenseNumber: "NMC-1001",
    profilePicture: null,
    acceptingNewPatients: true,
    rating: 4.8,
    reviewCount: 32
  },
  {
    id: 102,
    userId: 102,
    specialty: "Neurology",
    experience: 12,
    about: "Specializing in headaches and neurological disorders",
    hospitalAffiliation: "Nepal Medical College",
    education: "Kathmandu Medical College",
    licenseNumber: "NMC-1002",
    profilePicture: null,
    acceptingNewPatients: true,
    rating: 4.5,
    reviewCount: 28
  },
  {
    id: 103,
    userId: 103,
    specialty: "ENT",
    experience: 10,
    about: "Specializing in ear, nose, and throat conditions",
    hospitalAffiliation: "Bir Hospital",
    education: "Tribhuvan University",
    licenseNumber: "NMC-1003",
    profilePicture: null,
    acceptingNewPatients: true,
    rating: 4.3,
    reviewCount: 22
  },
  {
    id: 104,
    userId: 104,
    specialty: "Internal Medicine",
    experience: 8,
    about: "General internist with focus on infectious diseases",
    hospitalAffiliation: "Patan Hospital",
    education: "BPKIHS",
    licenseNumber: "NMC-1004",
    profilePicture: null,
    acceptingNewPatients: true,
    rating: 4.0,
    reviewCount: 15
  },
  {
    id: 105,
    userId: 105,
    specialty: "Dermatology",
    experience: 7,
    about: "Specialist in skin conditions and disorders",
    hospitalAffiliation: "Nepal Medical College",
    education: "Manipal College of Medical Sciences",
    licenseNumber: "NMC-1005",
    profilePicture: null,
    acceptingNewPatients: true,
    rating: 4.2,
    reviewCount: 18
  }
];

export const fallbackUsers: User[] = [
  {
    id: 101,
    email: "cardio.doctor@example.com",
    password: "hashedPassword",
    firstName: "Dr. Rajesh",
    lastName: "Shrestha",
    userType: "doctor",
    createdAt: new Date()
  },
  {
    id: 102,
    email: "neuro.doctor@example.com",
    password: "hashedPassword",
    firstName: "Dr. Anita",
    lastName: "Gurung",
    userType: "doctor",
    createdAt: new Date()
  },
  {
    id: 103,
    email: "ent.doctor@example.com",
    password: "hashedPassword",
    firstName: "Dr. Sunil",
    lastName: "Kayastha",
    userType: "doctor",
    createdAt: new Date()
  },
  {
    id: 104,
    email: "internist.doctor@example.com",
    password: "hashedPassword",
    firstName: "Dr. Priya",
    lastName: "Sharma",
    userType: "doctor",
    createdAt: new Date()
  },
  {
    id: 105,
    email: "derm.doctor@example.com",
    password: "hashedPassword",
    firstName: "Dr. Bikash",
    lastName: "Poudel",
    userType: "doctor",
    createdAt: new Date()
  }
];

export const fallbackDoctorSymptoms: DoctorSymptom[] = [
  // Cardiologist (Doctor 101) specialties
  { id: 1001, doctorId: 101, symptomId: 19, expertise: 5 }, // Chest Pain
  { id: 1002, doctorId: 101, symptomId: 20, expertise: 5 }, // Shortness of Breath
  { id: 1003, doctorId: 101, symptomId: 15, expertise: 4 }, // Fatigue
  
  // Neurologist (Doctor 102) specialties
  { id: 1004, doctorId: 102, symptomId: 11, expertise: 5 }, // Headache
  { id: 1005, doctorId: 102, symptomId: 17, expertise: 5 }, // Dizziness
  { id: 1006, doctorId: 102, symptomId: 15, expertise: 3 }, // Fatigue
  
  // ENT Specialist (Doctor 103) specialties
  { id: 1007, doctorId: 103, symptomId: 16, expertise: 5 }, // Sore Throat
  { id: 1008, doctorId: 103, symptomId: 13, expertise: 4 }, // Cough
  { id: 1009, doctorId: 103, symptomId: 11, expertise: 3 }, // Headache
  
  // Internist (Doctor 104) specialties
  { id: 1010, doctorId: 104, symptomId: 12, expertise: 5 }, // Fever
  { id: 1011, doctorId: 104, symptomId: 14, expertise: 4 }, // Nausea
  { id: 1012, doctorId: 104, symptomId: 15, expertise: 4 }, // Fatigue
  { id: 1013, doctorId: 104, symptomId: 13, expertise: 3 }, // Cough
  
  // Dermatologist (Doctor 105) specialties
  { id: 1014, doctorId: 105, symptomId: 18, expertise: 5 }, // Rash
  { id: 1015, doctorId: 105, symptomId: 15, expertise: 2 }  // Fatigue
];