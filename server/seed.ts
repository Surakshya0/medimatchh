import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';
import { users, patients, doctors, symptoms, doctorSymptoms, availability, specialties, diseaseSymptoms } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// ── CSV symptom helpers ────────────────────────────────────────────────────────
function readCSVHeaders(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const firstLine = fs.readFileSync(filePath, "utf-8").split("\n")[0];
  const headers = firstLine.split(",").map(h => h.trim().replace(/"/g, "")).filter(Boolean);
  return headers.slice(0, -1); // drop the "prognosis" label column
}

function normaliseSymptomName(snake: string): string {
  return snake.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function guessBodyPart(name: string): string {
  const lc = name.toLowerCase();
  if (/itch|skin|rash|pimple|blackhead|blister|crust|peeling|denting|scur|sore|nodal|red.?spots/.test(lc)) return "Skin";
  if (/headache|dizziness|vertigo|spinning|unsteadiness/.test(lc)) return "Head";
  if (/cough|breathless|phlegm|sputum|congestion|sinus|runny.?nose|throat|sneeze/.test(lc)) return "Respiratory";
  if (/chest|heart|palpitation/.test(lc)) return "Chest";
  if (/stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation/.test(lc)) return "Digestive";
  if (/joint|knee|hip|muscle|back|neck|limb|stiff|swelling.?joint/.test(lc)) return "Musculoskeletal";
  if (/eye|vision|blurred|redness.?eye|watering.?eye/.test(lc)) return "Eyes";
  if (/urine|urination|micturition|bladder|kidney/.test(lc)) return "Urinary";
  if (/leg|ankle|vein|calf/.test(lc)) return "Legs";
  if (/fever|chill|shivering|sweating|dehydration|malaise/.test(lc)) return "Whole Body";
  if (/fatigue|lethargy|weakness|malaise|lack.?concentration/.test(lc)) return "Whole Body";
  if (/weight|obesity|appetite|hunger/.test(lc)) return "Metabolic";
  if (/mood|anxiety|depression|restlessness|irritability/.test(lc)) return "Mental Health";
  return "General";
}

function guessSeverity(name: string): string {
  const lc = name.toLowerCase();
  if (/high.?fever|severe|acute|coma|bleeding|bloody|paralysis|failure|rusty|toxic/.test(lc)) return "severe";
  if (/mild|irritation|discomfort|slight/.test(lc)) return "mild";
  return "moderate";
}

function guessSpecialties(name: string): string[] {
  const lc = name.toLowerCase();
  const specs: string[] = [];
  if (/itch|skin|rash|pimple|blackhead|blister|crust|peeling|scur|denting|nail|sore|nodal|red.?spots|dischromic/.test(lc)) specs.push("Dermatology");
  if (/headache|dizziness|vertigo|spinning|unsteadiness|balance|paralysis|slurred|sensorium|fainting|numbness|tingling|memory/.test(lc)) specs.push("Neurology");
  if (/cough|breathless|phlegm|sputum|congestion|sinus|runny.?nose|wheeze/.test(lc)) specs.push("Pulmonology");
  if (/chest|heart|palpitation|fast.?heart|leg.?cramp|swollen.?leg|vein/.test(lc)) specs.push("Cardiology");
  if (/stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation|gastro|ulcer/.test(lc)) specs.push("Gastroenterology");
  if (/joint|knee|hip|shoulder|wrist|foot|back|neck|muscle|stiff|swelling.?joint|movement|deformity|morning.?stiff/.test(lc)) specs.push("Orthopedics", "Rheumatology");
  if (/eye|vision|blurred|redness.?eye|watering.?eye/.test(lc)) specs.push("Ophthalmology");
  if (/throat|sneeze|ear|sinus|runny.?nose|hearing|tinnitus/.test(lc)) specs.push("ENT");
  if (/vertigo|spinning|unsteadiness|balance/.test(lc)) specs.push("ENT", "Neurology");
  if (/urine|urination|micturition|bladder/.test(lc)) specs.push("Urology");
  if (/fever|chill|shivering|sweating|dehydration/.test(lc)) specs.push("Internal Medicine");
  if (/fatigue|lethargy|weakness|malaise/.test(lc)) specs.push("Internal Medicine");
  if (/thyroid|sugar|diabetes|insulin|weight|obesity|appetite|hunger|hair|nail|intolerance/i.test(lc)) specs.push("Endocrinology", "Internal Medicine");
  if (/mood|anxiety|depression|restlessness|irritability|concentration|insomnia/.test(lc)) specs.push("Psychiatry");
  if (/menstruation|pregnancy/.test(lc)) specs.push("Gynecology");
  if (/blood|anemia|transfusion/.test(lc)) specs.push("Internal Medicine");
  if (/liver|jaundice|yellow|hepatitis/.test(lc)) specs.push("Gastroenterology");
  if (/kidney|renal/.test(lc)) specs.push("Nephrology");
  if (/cancer|tumor/.test(lc)) specs.push("Oncology");
  if (/child|infant|pediatric/.test(lc)) specs.push("Pediatrics");
  if (/allerg|runny.?nose|sneeze|rash/.test(lc)) specs.push("Internal Medicine");
  if (specs.length === 0) specs.push("General Practice", "Internal Medicine");
  return [...new Set(specs)];
}

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  // Check if we already have users
  const existingUsers = await db.select().from(users);
  const existingDoctors = await db.select().from(doctors);
  
  if (existingUsers.length > 0) {
    console.log('Database already has users, skipping user creation');
  }
  
  // Check if we need to add more doctors
  if (existingDoctors.length < 25) {
    console.log(`Found ${existingDoctors.length} existing doctors. Will add more to reach 25...`);
    
    // First get existing emails so we don't try to create duplicates
    const existingEmails = new Set(existingUsers.map((user: { email: string }) => user.email));
    
    // Create the doctor specialties data
    const doctorSpecialties = [
      // Primary care doctors (highly relevant for common symptoms)
      { firstName: 'Pradeep', lastName: 'Bajracharya', email: 'pradeep.bajracharya@example.com', specialty: 'Internal Medicine', hospitalAffiliation: 'Bir Hospital', education: 'Tribhuvan University Institute of Medicine', experience: 16 },
      { firstName: 'Anita', lastName: 'Gurung', email: 'anita.gurung@example.com', specialty: 'Internal Medicine', hospitalAffiliation: 'Patan Hospital', education: 'Kathmandu University School of Medical Sciences', experience: 12 },
      { firstName: 'Suresh', lastName: 'Prajapati', email: 'suresh.prajapati@example.com', specialty: 'Family Medicine', hospitalAffiliation: 'Nepal Medical College and Teaching Hospital', education: 'Nepal Medical College', experience: 9 },
      { firstName: 'Kabita', lastName: 'Bhandari', email: 'kabita.bhandari@example.com', specialty: 'Family Medicine', hospitalAffiliation: 'KIST Medical College and Teaching Hospital', education: 'KIST Medical College', experience: 11 },
      { firstName: 'Roshan', lastName: 'Thapa', email: 'roshan.thapa@example.com', specialty: 'General Practice', hospitalAffiliation: 'Kathmandu Model Hospital', education: 'Patan Academy of Health Sciences', experience: 8 },
      { firstName: 'Sabina', lastName: 'Tamang', email: 'sabina.tamang@example.com', specialty: 'Pulmonology', hospitalAffiliation: 'Patan Hospital', education: 'Nobel Medical College', experience: 9 },
      
      // Specialists for various symptoms
      { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@example.com', specialty: 'Cardiology', hospitalAffiliation: 'Norvic International Hospital', education: 'Tribhuvan University Institute of Medicine', experience: 12 },
      { firstName: 'Nisha', lastName: 'Thapa', email: 'nisha.thapa@example.com', specialty: 'Neurology', hospitalAffiliation: 'Grande International Hospital', education: 'Kathmandu Medical College', experience: 8 },
      { firstName: 'Ramesh', lastName: 'Chhetri', email: 'ramesh.chhetri@example.com', specialty: 'ENT', hospitalAffiliation: 'Nepal Eye Hospital', education: 'Patan Academy of Health Sciences', experience: 14 },
      { firstName: 'Rajesh', lastName: 'Poudel', email: 'rajesh.poudel@example.com', specialty: 'Dermatology', hospitalAffiliation: 'HAMS Hospital', education: 'BP Koirala Institute of Health Sciences', experience: 15 },
      { firstName: 'Gita', lastName: 'Lama', email: 'gita.lama@example.com', specialty: 'Dermatology', hospitalAffiliation: 'Om Hospital & Research Center', education: 'Nepal Medical College', experience: 7 },
      { firstName: 'Sarita', lastName: 'Adhikari', email: 'sarita.adhikari@example.com', specialty: 'Pediatrics', hospitalAffiliation: 'Kanti Children\'s Hospital', education: 'Nepal Medical College', experience: 10 },
      { firstName: 'Dipak', lastName: 'KC', email: 'dipak.kc@example.com', specialty: 'Orthopedics', hospitalAffiliation: 'B&B Hospital', education: 'Manipal College of Medical Sciences', experience: 14 },
      { firstName: 'Anjali', lastName: 'Shrestha', email: 'anjali.shrestha@example.com', specialty: 'Gynecology', hospitalAffiliation: 'Paropakar Maternity Hospital', education: 'KIST Medical College', experience: 9 },
      { firstName: 'Prakash', lastName: 'Gurung', email: 'prakash.gurung@example.com', specialty: 'Ophthalmology', hospitalAffiliation: 'Tilganga Institute of Ophthalmology', education: 'Tribhuvan University Institute of Medicine', experience: 11 },
      { firstName: 'Suman', lastName: 'Rai', email: 'suman.rai@example.com', specialty: 'Psychiatry', hospitalAffiliation: 'Mental Hospital, Lagankhel', education: 'Patan Academy of Health Sciences', experience: 7 },
      { firstName: 'Mamata', lastName: 'Basnet', email: 'mamata.basnet@example.com', specialty: 'Endocrinology', hospitalAffiliation: 'Medicare National Hospital', education: 'Universal College of Medical Sciences', experience: 13 },
      { firstName: 'Bikash', lastName: 'Maharjan', email: 'bikash.maharjan@example.com', specialty: 'Gastroenterology', hospitalAffiliation: 'Civil Service Hospital', education: 'Kathmandu University School of Medical Sciences', experience: 10 },
      { firstName: 'Nabin', lastName: 'Karki', email: 'nabin.karki@example.com', specialty: 'Urology', hospitalAffiliation: 'Nepal Mediciti Hospital', education: 'Tribhuvan University Institute of Medicine', experience: 12 },
      { firstName: 'Sunita', lastName: 'Neupane', email: 'sunita.neupane@example.com', specialty: 'Rheumatology', hospitalAffiliation: 'Star Hospital', education: 'Manipal College of Medical Sciences', experience: 8 },
      { firstName: 'Deepak', lastName: 'Bhattarai', email: 'deepak.bhattarai@example.com', specialty: 'Nephrology', hospitalAffiliation: 'National Kidney Center', education: 'BP Koirala Institute of Health Sciences', experience: 11 },
      { firstName: 'Ranju', lastName: 'Magar', email: 'ranju.magar@example.com', specialty: 'Hematology', hospitalAffiliation: 'Bhaktapur Cancer Hospital', education: 'Kathmandu Medical College', experience: 10 },
      { firstName: 'Kamal', lastName: 'Acharya', email: 'kamal.acharya@example.com', specialty: 'Oncology', hospitalAffiliation: 'Nepal Cancer Hospital', education: 'Tribhuvan University Institute of Medicine', experience: 15 },
      { firstName: 'Binod', lastName: 'Dahal', email: 'binod.dahal@example.com', specialty: 'Cardiology', hospitalAffiliation: 'Shahid Gangalal National Heart Centre', education: 'Kathmandu University School of Medical Sciences', experience: 13 },
      { firstName: 'Pramila', lastName: 'Pandey', email: 'pramila.pandey@example.com', specialty: 'Neurology', hospitalAffiliation: 'Grande International Hospital', education: 'KIST Medical College', experience: 9 },
      { firstName: 'Reena', lastName: 'Shahi', email: 'reena.shahi@example.com', specialty: 'General Practice', experience: 10, hospitalAffiliation: 'Alka Hospital', education: 'BP Koirala Institute of Health Sciences' }
    ];
    
    // Calculate how many more doctors we need to add
    const doctorsToAdd = Math.min(doctorSpecialties.length, 25 - existingDoctors.length);
    
    // Filter out doctors with emails that already exist
    const doctorsToCreate = doctorSpecialties
      .filter(doctor => !existingEmails.has(doctor.email))
      .slice(0, doctorsToAdd);
    
    console.log(`Will create ${doctorsToCreate.length} new doctors`);
    
    // Create the new doctors
    for (const doctorData of doctorsToCreate) {
      const doctorPassword = await hashPassword('doctor123');
      const [doctorUser] = await db.insert(users).values({
        email: doctorData.email,
        password: doctorPassword,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        userType: 'doctor',
      }).returning();
      
      // Use specialty directly as it's a text field in the database
      const [doctorProfile] = await db.insert(doctors).values({
        userId: doctorUser.id,
        specialty: doctorData.specialty,
        experience: doctorData.experience,
        hospitalAffiliation: doctorData.hospitalAffiliation,
        education: doctorData.education,
        licenseNumber: `MD${Math.floor(100000 + Math.random() * 900000)}`,
        acceptingNewPatients: true,
        about: `Dr. ${doctorUser.lastName} is a board-certified ${doctorData.specialty.toLowerCase()} specialist with over ${doctorData.experience} years of experience.`,
        profilePicture: null,
        rating: 5, // Integer rating from 1-5
        reviewCount: 120,
      }).returning();
      
      console.log(`Created doctor user: ${doctorUser.email} with specialty ${doctorData.specialty}`);
    }
  }
  
  // Get all doctors for availability
  const allDoctors = await db.select().from(doctors);
  
  // ── Symptoms ──
  const existingSymptoms = await db.select().from(symptoms);
  console.log(`Found ${existingSymptoms.length} existing symptoms`);

  if (existingSymptoms.length < 132) {
    console.log('Loading all 132 symptoms from Kaggle dataset...');

    // 3 unique original symptoms not in Kaggle CSV
    const manualSymptoms = [
      { name: 'fever', description: 'Body temperature above the normal range', bodyPart: 'Whole Body', severity: 'moderate' },
      { name: 'sore throat', description: 'Pain or irritation in the throat', bodyPart: 'Throat', severity: 'mild' },
      { name: 'shortness of breath', description: 'Difficulty breathing or catching breath', bodyPart: 'Chest', severity: 'severe' },
    ];

    // Read CSV symptom names
    const csvPath = path.join(__dirname, '..', 'data', 'Training.csv');
    const rawHeaders = readCSVHeaders(csvPath);

    // Keep existing symptom names so we don't re-insert duplicates
    const existingNames = new Set(existingSymptoms.map((s: { name: string }) => s.name.toLowerCase()));

    const toInsert: { name: string; description: null; bodyPart: string; severity: string }[] = [];

    // Add manual symptoms if not already present
    for (const s of manualSymptoms) {
      if (!existingNames.has(s.name)) {
        toInsert.push({ name: s.name, description: s.description as any, bodyPart: s.bodyPart, severity: s.severity });
        existingNames.add(s.name);
      }
    }

    // Dedup and add CSV-derived symptoms
    const seen = new Set<string>();
    for (const raw of rawHeaders) {
      const name = normaliseSymptomName(raw);
      const key = name.toLowerCase();
      if (!seen.has(key) && !existingNames.has(key)) {
        seen.add(key);
        toInsert.push({
          name,
          description: null,
          bodyPart: guessBodyPart(raw),
          severity: guessSeverity(raw),
        });
      }
    }

    if (toInsert.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < toInsert.length; i += BATCH) {
        await db.insert(symptoms).values(toInsert.slice(i, i + BATCH));
      }
      console.log(`Inserted ${toInsert.length} new symptoms (total now: ${existingSymptoms.length + toInsert.length})`);
    } else {
      console.log('All symptoms already present.');
    }
  }

  // Refresh symptom list
  const allSymptoms = await db.select().from(symptoms);
  console.log(`Total symptoms available: ${allSymptoms.length}`);

  // ── Doctor-Symptom Associations ──
  const existingDoctorSymptoms = await db.select().from(doctorSymptoms);
  console.log(`Found ${existingDoctorSymptoms.length} existing doctor-symptom associations`);

  // If we added new symptoms above, create links for them
  if (existingDoctorSymptoms.length < allSymptoms.length * 2) {
    console.log('Creating doctor-symptom associations for all symptoms...');

    const existingLinkSet = new Set(existingDoctorSymptoms.map((l: { doctorId: number; symptomId: number }) => `${l.doctorId}:${l.symptomId}`));
    const symptomMap = new Map(allSymptoms.map((s: { name: string; id: number }) => [s.name, s]));
    const toLink: { doctorId: number; symptomId: number; expertise: number }[] = [];

    for (const doctor of allDoctors) {
      const docSpec = doctor.specialty;
      const isPrimaryCare = ['Internal Medicine', 'Family Medicine', 'General Practice'].includes(docSpec);

      for (const symptom of allSymptoms) {
        const key = `${doctor.id}:${symptom.id}`;
        if (existingLinkSet.has(key)) continue;

        const specialties = guessSpecialties(symptom.name);
        const idx = specialties.findIndex(s => s.toLowerCase() === docSpec.toLowerCase());

        let expertise = 1;
        if (isPrimaryCare && /fever|sore throat|shortness of breath|fatigue|cough|headache|chest pain|nausea|dizziness|back pain/.test(symptom.name)) {
          expertise = 4;
        } else if (idx === 0) {
          expertise = 5;
        } else if (idx > 0) {
          expertise = 3;
        }

        if (expertise >= 3) {
          toLink.push({ doctorId: doctor.id, symptomId: symptom.id, expertise });
          existingLinkSet.add(key);
        }
      }
    }

    // Add a few low-expertise random links for variety
    const uncovered = allSymptoms.filter((s: { id: number }) => {
      const key = `${allDoctors[0]?.id}:${s.id}`;
      return !existingLinkSet.has(key);
    });
    for (const symptom of uncovered) {
      const randomDoctor = allDoctors[Math.floor(Math.random() * allDoctors.length)];
      const key = `${randomDoctor.id}:${symptom.id}`;
      if (!existingLinkSet.has(key)) {
        toLink.push({ doctorId: randomDoctor.id, symptomId: symptom.id, expertise: 1 + Math.floor(Math.random() * 2) });
        existingLinkSet.add(key);
      }
    }

    if (toLink.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < toLink.length; i += BATCH) {
        await db.insert(doctorSymptoms).values(toLink.slice(i, i + BATCH));
      }
      console.log(`Created ${toLink.length} new doctor-symptom associations`);
    } else {
      console.log('All associations already exist.');
    }

    const totalLinks = await db.select().from(doctorSymptoms);
    console.log(`Total doctor-symptom associations: ${totalLinks.length}`);
  }
  
  // ── Disease-Symptom training data ──
  const existingDiseaseSymptoms = await db.select().from(diseaseSymptoms);
  if (existingDiseaseSymptoms.length === 0) {
    console.log('Seeding disease-symptom training data...');

    const diseaseSymptomMap: Record<string, string[]> = {
      "Influenza":              ["fever", "cough", "fatigue", "headache", "sore throat", "chills", "muscle pain", "runny nose", "sneezing", "dehydration"],
      "Common Cold":            ["runny nose", "sore throat", "cough", "sneezing", "congestion", "mild fever", "headache"],
      "Migraine":              ["severe headache", "nausea", "vomiting", "light sensitivity", "sound sensitivity", "dizziness", "blurred vision", "throbbing headache"],
      "Pneumonia":             ["fever", "cough", "shortness of breath", "fatigue", "chest pain", "high fever", "chills", "sweating"],
      "Myocardial Infarction":  ["chest pain", "shortness of breath", "sweating", "nausea", "dizziness", "severe chest pain", "palpitations"],
      "Hypertension":          ["headache", "dizziness", "blurred vision", "fatigue", "palpitations", "chest pain", "shortness of breath"],
      "Asthma":                ["shortness of breath", "wheezing", "cough", "chest tightness", "congestion", "fatigue"],
      "Gastroenteritis":       ["nausea", "vomiting", "diarrhea", "stomach cramps", "fever", "dehydration", "abdominal pain"],
      "Diabetes":              ["frequent urination", "excessive thirst", "fatigue", "blurred vision", "weight gain", "hunger", "dehydration"],
      "Hypothyroidism":        ["fatigue", "weight gain", "cold intolerance", "dry skin", "lethargy", "depression", "muscle pain"],
      "Arthritis":             ["joint pain", "joint stiffness", "swollen joints", "fatigue", "muscle pain", "back pain", "neck pain"],
      "Musculoskeletal Pain":  ["back pain", "muscle pain", "fatigue", "stiffness", "neck pain", "joint pain"],
      "Anemia":                ["fatigue", "pale skin", "shortness of breath", "dizziness", "weakness", "lethargy", "headache"],
      "Urinary Tract Infection": ["burning urination", "frequent urination", "pelvic pain", "abdominal pain", "fever"],
      "Malaria":               ["fever", "high fever", "chills", "headache", "muscle pain", "sweating", "fatigue", "nausea"],
      "Dengue Fever":          ["high fever", "severe headache", "joint pain", "rash", "muscle pain", "nausea", "pain behind eyes"],
      "COVID-19":              ["fever", "dry cough", "fatigue", "loss of taste", "loss of smell", "shortness of breath", "sore throat", "congestion"],
      "Depression":            ["persistent sadness", "loss of interest", "fatigue", "sleep disturbance", "lethargy", "anxiety", "irritability", "mood swings"],
      "Anxiety Disorder":      ["excessive worry", "restlessness", "fatigue", "palpitations", "irritability", "sleep disturbance", "sweating"],

      // From Kaggle specialty mapping
      "Fungal infection":       ["itching", "skin rash", "nodal skin eruptions", "blister", "red spots", "scur", "peeling skin"],
      "Acne":                   ["pimples", "blackheads", "pus filled pimples", "skin rash", "redness"],
      "Allergy":                ["runny nose", "sneezing", "skin rash", "red spots", "watery eyes", "itching"],
      "Chicken pox":            ["blister", "red spots", "fever", "fatigue", "itching", "loss of appetite"],
      "GERD":                   ["heartburn", "acidity", "indigestion", "nausea", "chest pain", "belly pain"],
      "Peptic ulcer disease":   ["stomach pain", "indigestion", "nausea", "vomiting", "loss of appetite", "belly pain"],
      "Heart attack":           ["chest pain", "shortness of breath", "sweating", "nausea", "dizziness", "palpitations"],
      "Bronchial Asthma":       ["wheezing", "shortness of breath", "cough", "chest tightness", "congestion"],
      "Tuberculosis":           ["cough", "fever", "weight loss", "fatigue", "sweating", "chest pain", "coughing blood"],
      "(vertigo) Paroxysmal Positional Vertigo": ["dizziness", "vertigo", "nausea", "vomiting", "headache", "unsteadiness"],
      "Cervical spondylosis":   ["neck pain", "back pain", "stiffness", "headache", "numbness", "muscle pain"],
      "Hyperthyroidism":        ["weight loss", "palpitations", "sweating", "irritability", "fatigue", "hunger"],
      "Hypoglycemia":           ["dizziness", "sweating", "hunger", "fatigue", "blurred vision", "weakness"],
      "Osteoarthritis":         ["joint pain", "knee pain", "back pain", "stiffness", "swollen joints", "muscle pain"],
      "Typhoid":                ["high fever", "headache", "fatigue", "abdominal pain", "constipation", "loss of appetite"],
      "Jaundice":               ["yellow skin", "yellow eyes", "fatigue", "nausea", "vomiting", "abdominal pain"],

      // Additional combinations for better training coverage
      "General Illness":        ["fatigue", "headache", "mild fever", "muscle pain", "loss of appetite", "weakness"],
    };

    const toInsertDisease: { diseaseName: string; symptomId: number; relevanceScore: number }[] = [];
    const insertedDiseaseSet = new Set<string>();
    const symptomNameToId = new Map<string, number>(allSymptoms.map((s: { name: string; id: number }) => [s.name.toLowerCase(), s.id]));

    for (const [disease, symNames] of Object.entries(diseaseSymptomMap)) {
      for (const symName of symNames) {
        const symId = symptomNameToId.get(symName.toLowerCase());
        if (symId) {
          toInsertDisease.push({
            diseaseName: disease,
            symptomId: symId,
            relevanceScore: 4 + Math.floor(Math.random() * 2), // 4-5
          });
          insertedDiseaseSet.add(disease);
        }
      }
    }

    // Add secondary (lower relevance) symptoms for each disease
    const allDiseaseNames = Object.keys(diseaseSymptomMap);
    for (const disease of allDiseaseNames) {
      const primarySymptoms = new Set(diseaseSymptomMap[disease].map(s => s.toLowerCase()));
      const primaryIds = new Set(
        [...primarySymptoms]
          .map(s => symptomNameToId.get(s))
          .filter((id): id is number => id !== undefined)
      );

      // Add 2-3 random lower relevance symptoms per disease
      const candidates = allSymptoms.filter((s: { id: number }) => !primaryIds.has(s.id) && Math.random() < 0.15);
      for (const candidate of candidates.slice(0, 3)) {
        toInsertDisease.push({
          diseaseName: disease,
          symptomId: candidate.id,
          relevanceScore: 1 + Math.floor(Math.random() * 2), // 1-2, low relevance
        });
      }
    }

    if (toInsertDisease.length > 0) {
      await db.insert(diseaseSymptoms).values(toInsertDisease);
      console.log(`Inserted ${toInsertDisease.length} disease-symptom training records`);
    }
  }

  // Seed availability for all doctors
  console.log('Seeding doctor availability...');
  
  // 6. Create doctor availability for telemedicine appointments
  const timeSlots = [
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' },
    { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '11:30', end: '12:00' },
    { start: '13:00', end: '13:30' },
    { start: '13:30', end: '14:00' },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
    { start: '15:00', end: '15:30' },
    { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' },
    { start: '16:30', end: '17:00' },
  ];

  // Add availability for each doctor for the next 5 weekdays
  for (const doctor of allDoctors) {
    // Add slots for weekdays (Monday-Friday: 1-5)
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      // Each doctor gets a random set of available slots (50%-80% of all slots)
      const availableSlotCount = Math.floor(timeSlots.length * (0.5 + Math.random() * 0.3));
      const randomSlots = [...timeSlots].sort(() => 0.5 - Math.random()).slice(0, availableSlotCount);
      
      for (const slot of randomSlots) {
        await db.insert(availability).values({
          doctorId: doctor.id,
          dayOfWeek,
          startTime: slot.start,
          endTime: slot.end,
          isAvailable: true
        });
      }
    }
    console.log(`Created availability for doctor ${doctor.id}`);
  }
  
  console.log('Created doctor availability');
  console.log('Database seeding completed successfully');
}

// Call the seed function immediately
seedDatabase()
  .then(() => {
    console.log('Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
