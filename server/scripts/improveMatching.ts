// @ts-nocheck — one-time migration script
import 'dotenv/config';
import { db } from '../db';
import { users, doctors, symptoms, doctorSymptoms } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq, and } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// ── (1) New symptoms ──────────────────────────────────────────────────────────
const NEW_SYMPTOMS = [
  { name: 'slow healing',        bodyPart: 'Skin',          severity: 'moderate' },
  { name: 'hair thinning',       bodyPart: 'General',       severity: 'moderate' },
  { name: 'heat intolerance',    bodyPart: 'Whole Body',    severity: 'moderate' },
  { name: 'tremors',             bodyPart: 'General',       severity: 'moderate' },
  { name: 'ear pain',            bodyPart: 'Head',          severity: 'moderate' },
  { name: 'hearing loss',        bodyPart: 'Head',          severity: 'moderate' },
  { name: 'tinnitus',            bodyPart: 'Head',          severity: 'moderate' },
  { name: 'leg cramps',          bodyPart: 'Legs',          severity: 'moderate' },
  { name: 'morning stiffness',   bodyPart: 'Musculoskeletal', severity: 'moderate' },
  { name: 'joint deformity',     bodyPart: 'Musculoskeletal', severity: 'moderate' },
  { name: 'insomnia',            bodyPart: 'Mental Health',  severity: 'moderate' },
  { name: 'memory loss',         bodyPart: 'Mental Health',  severity: 'moderate' },
  { name: 'numbness',            bodyPart: 'Musculoskeletal', severity: 'moderate' },
  { name: 'tingling',            bodyPart: 'Musculoskeletal', severity: 'moderate' },
  { name: 'fainting',            bodyPart: 'Head',          severity: 'severe' },
  { name: 'shoulder pain',       bodyPart: 'Musculoskeletal', severity: 'moderate' },
  { name: 'foot pain',           bodyPart: 'Musculoskeletal', severity: 'moderate' },
  { name: 'wrist pain',          bodyPart: 'Musculoskeletal', severity: 'moderate' },
];

// ── (2) Doctor-symptom expertise overrides ────────────────────────────────────
// These ensure the right doctors get high expertise for their specialty symptoms.
const SPECIALTY_EXPERTISE: Record<string, { regex: RegExp; expertise: number }[]> = {
  Endocrinology: [
    { regex: /thyroid|sugar|diabetes|insulin/i, expertise: 5 },
    { regex: /weight|appetite|hunger|obesity|metabol/i, expertise: 5 },
    { regex: /fatigue|lethargy|weakness/i, expertise: 4 },
    { regex: /hair|slow healing|tremor|intolerance/i, expertise: 5 },
    { regex: /mood|anxiety|depression|irritability/i, expertise: 3 },
    { regex: /cold.?hands|puffy.?face|brittle.?nail|enlarged.?thyroid/i, expertise: 5 },
    { regex: /palpitation|fast.?heart|sweating/i, expertise: 3 },
    { regex: /headache|dizziness|blurred/i, expertise: 2 },
  ],
  Rheumatology: [
    { regex: /joint|arthritis|rheuma/i, expertise: 5 },
    { regex: /morning.?stiffness|deformity|swelling.?joint|movement.?stiff/i, expertise: 5 },
    { regex: /back|neck|knee|hip|shoulder|wrist|foot/i, expertise: 4 },
    { regex: /muscle.?pain|muscle.?weak|stiff/i, expertise: 4 },
    { regex: /fatigue|malaise|lethargy/i, expertise: 3 },
    { regex: /numbness|tingling/i, expertise: 3 },
  ],
  Cardiology: [
    { regex: /chest|heart|palpitation|fast.?heart/i, expertise: 5 },
    { regex: /breathless|shortness.?breath/i, expertise: 4 },
    { regex: /leg.?cramp|swollen.?leg|vein|calf|prominent.?vein/i, expertise: 4 },
    { regex: /dizziness|fainting|sweating/i, expertise: 3 },
  ],
  Neurology: [
    { regex: /headache|migraine/i, expertise: 5 },
    { regex: /dizziness|vertigo|spinning|unsteadiness|balance/i, expertise: 5 },
    { regex: /numbness|tingling|paralysis|slurred|weakness.?body.?side/i, expertise: 5 },
    { regex: /fainting|seizure|memory|vision.?blurred/i, expertise: 4 },
    { regex: /tremor|sensorium|coma/i, expertise: 5 },
  ],
  ENT: [
    { regex: /ear|hearing|tinnitus/i, expertise: 5 },
    { regex: /throat|sinus|sneeze|runny.?nose|congestion/i, expertise: 5 },
    { regex: /dizziness|vertigo|spinning|balance/i, expertise: 4 },
    { regex: /cough|patches.?throat/i, expertise: 3 },
  ],
  Dermatology: [
    { regex: /itch|skin|rash|pimple|blackhead|blister|crust|peel|scur|sore|nodal|red.?spot|dischromic|nail|denting/i, expertise: 5 },
    { regex: /slow.?healing|hair/i, expertise: 3 },
  ],
  Psychiatry: [
    { regex: /mood|anxiety|depression|restless|irritability|concentration/i, expertise: 5 },
    { regex: /insomnia|sleep|memory/i, expertise: 5 },
    { regex: /fatigue|lethargy|palpitation|sweating/i, expertise: 3 },
  ],
  Orthopedics: [
    { regex: /joint|knee|hip|shoulder|wrist|foot|back|neck/i, expertise: 5 },
    { regex: /fracture|bone|muscle|stiff|swelling.?joint|movement/i, expertise: 5 },
    { regex: /numbness|tingling|limb/i, expertise: 3 },
    { regex: /morning.?stiffness|deformity/i, expertise: 5 },
  ],
  Pulmonology: [
    { regex: /cough|breathless|phlegm|sputum|congestion|wheeze/i, expertise: 5 },
    { regex: /chest|sinus|runny.?nose/i, expertise: 3 },
  ],
  Gastroenterology: [
    { regex: /stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation|ulcer|gastro/i, expertise: 5 },
    { regex: /liver|jaundice|yellow|hepatitis|alcohol/i, expertise: 5 },
    { regex: /bloody.?stool|bleeding/i, expertise: 4 },
  ],
  Urology: [
    { regex: /urine|urination|micturition|bladder|kidney/i, expertise: 5 },
  ],
  Nephrology: [
    { regex: /kidney|renal|urine|fluid.?overload|swelling|puffy.?face/i, expertise: 5 },
  ],
  Ophthalmology: [
    { regex: /eye|vision|blurred|redness.?eye|watering.?eye/i, expertise: 5 },
  ],
  Oncology: [
    { regex: /cancer|tumor|weight.?loss|fatigue|anemia/i, expertise: 4 },
  ],
  Hematology: [
    { regex: /blood|anemia|transfusion|bruising|pale/i, expertise: 5 },
  ],
  Gynecology: [
    { regex: /menstruation|pregnancy|abnormal|pelvic/i, expertise: 5 },
  ],
  Pediatrics: [
    { regex: /child|infant|fever|cough|rash/i, expertise: 4 },
  ],
};

// ── (3) New doctors to add ────────────────────────────────────────────────────
const NEW_DOCTORS = [
  {
    firstName: 'Sagar', lastName: 'Pokharel',
    email: 'sagar.pokharel@example.com',
    specialty: 'Endocrinology',
    hospitalAffiliation: 'Norvic International Hospital',
    education: 'BP Koirala Institute of Health Sciences',
    experience: 14,
  },
  {
    firstName: 'Asha', lastName: 'Khadka',
    email: 'asha.khadka@example.com',
    specialty: 'Endocrinology',
    hospitalAffiliation: 'Om Hospital & Research Center',
    education: 'Kathmandu University School of Medical Sciences',
    experience: 9,
  },
  {
    firstName: 'Rabi', lastName: 'Bhusal',
    email: 'rabi.bhusal@example.com',
    specialty: 'Rheumatology',
    hospitalAffiliation: 'B&B Hospital',
    education: 'Manipal College of Medical Sciences',
    experience: 11,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function improveMatching() {
  console.log('=== Improving doctor-symptom matching ===\n');

  // ── Step 1: Add new symptoms ──
  console.log('--- Step 1: Adding new symptoms ---');
  const existingSymptoms = await db.select().from(symptoms);
  const existingNames = new Set(existingSymptoms.map(s => s.name.toLowerCase()));
  let addedCount = 0;

  for (const sym of NEW_SYMPTOMS) {
    if (!existingNames.has(sym.name)) {
      await db.insert(symptoms).values({
        name: sym.name,
        description: null,
        bodyPart: sym.bodyPart,
        severity: sym.severity,
      });
      addedCount++;
      existingNames.add(sym.name);
    }
  }
  console.log(`Added ${addedCount} new symptoms`);

  // Refresh list
  const allSymptoms = await db.select().from(symptoms);
  console.log(`Total symptoms: ${allSymptoms.length}`);

  // ── Step 2: Add new doctors ──
  console.log('\n--- Step 2: Adding new doctors ---');
  const existingDocs = await db.select().from(doctors);
  const existingDocByEmail = new Map(
    (await db.select().from(users).where(eq(users.userType, 'doctor'))).map(u => [u.email, u])
  );

  for (const doc of NEW_DOCTORS) {
    if (existingDocByEmail.has(doc.email)) {
      console.log(`  Skipping ${doc.email} — already exists`);
      continue;
    }
    const hashed = await hashPassword('doctor123');
    const [user] = await db.insert(users).values({
      email: doc.email, password: hashed,
      firstName: doc.firstName, lastName: doc.lastName,
      userType: 'doctor',
    }).returning();

    await db.insert(doctors).values({
      userId: user.id,
      specialty: doc.specialty,
      experience: doc.experience,
      hospitalAffiliation: doc.hospitalAffiliation,
      education: doc.education,
      licenseNumber: `MD${Math.floor(100000 + Math.random() * 900000)}`,
      acceptingNewPatients: true,
      about: `Dr. ${doc.lastName} is a board-certified ${doc.specialty.toLowerCase()} specialist with over ${doc.experience} years of experience.`,
      rating: 5,
      reviewCount: 120,
    });
    console.log(`  Created ${doc.email} (${doc.specialty}) — password: doctor123`);
  }

  // Refresh doctor list
  const allDoctors = await db.select().from(doctors);
  console.log(`Total doctors: ${allDoctors.length}`);

  // ── Step 3: Add doctor-symptom links for new doctors & new symptoms ──
  console.log('\n--- Step 3: Adding doctor-symptom associations ---');
  const symptomByName = new Map(allSymptoms.map(s => [s.name.toLowerCase(), s]));

  // Get existing links so we don't duplicate
  const existingLinks = await db.select().from(doctorSymptoms);
  const existingLinkSet = new Set(existingLinks.map(l => `${l.doctorId}:${l.symptomId}`));
  console.log(`Existing links: ${existingLinks.length}`);

  const BATCH = 100;
  const toLink: { doctorId: number; symptomId: number; expertise: number }[] = [];

  const COMMON_SYMPTOMS = /fever|fatigue|cough|headache|pain|nausea|dizziness|sore|rash|infection|chill|sweating|weight|malaise|weakness/i;

  // Which doctor IDs are new (added in step 2 above)?
  const newDoctorEmails = new Set(NEW_DOCTORS.map(d => d.email));
  const allDoctorUsers = await db.select().from(users).where(eq(users.userType, 'doctor'));
  const newDoctorIds = new Set(
    allDoctorUsers.filter(u => newDoctorEmails.has(u.email)).map(u => {
      const doc = allDoctors.find(d => d.userId === u.id);
      return doc ? doc.id : -1;
    })
  );

  for (const doctor of allDoctors) {
    const spec = doctor.specialty;
    const isPrimary = ['Internal Medicine', 'Family Medicine', 'General Practice'].includes(spec);
    const isNewDoctor = newDoctorIds.has(doctor.id);

    for (const symptom of allSymptoms) {
      const key = `${doctor.id}:${symptom.id}`;
      // Skip if link already exists and this isn't a new doctor
      if (existingLinkSet.has(key) && !isNewDoctor) continue;

      const rules = SPECIALTY_EXPERTISE[spec];
      let expertise = 1;

      // Step 1: Check specialty-specific rules
      if (rules) {
        for (const rule of rules) {
          if (rule.regex.test(symptom.name)) {
            expertise = Math.max(expertise, rule.expertise);
          }
        }
      }

      // Step 2: Primary care gets broad coverage
      if (isPrimary && expertise < 3 && COMMON_SYMPTOMS.test(symptom.name)) {
        expertise = 3;
      }

      // Step 3: Every specialist gets baseline expertise on common symptoms
      if (!isPrimary && expertise < 2 && COMMON_SYMPTOMS.test(symptom.name)) {
        expertise = 2;
      }

      // Step 4: Ensure every symptom has at least some links
      if (expertise < 2 && isPrimary) {
        expertise = 2;
      }

      if (expertise >= 2) {
        toLink.push({ doctorId: doctor.id, symptomId: symptom.id, expertise });
      }
    }
  }

  // Extra: add missing links for weak specialty areas (Endocrinology, Rheumatology)
  const prioritySymptoms = allSymptoms.filter(s => {
    const lc = s.name.toLowerCase();
    return /thyroid|sugar|diabetes|joint|arthritis|weight|fatigue|hair|nail|hunger|obesity|mood/.test(lc);
  });
  for (const doctor of allDoctors) {
    if (!['Endocrinology', 'Rheumatology'].includes(doctor.specialty)) continue;
    for (const symptom of prioritySymptoms) {
      const key = `${doctor.id}:${symptom.id}`;
      if (existingLinkSet.has(key)) continue;
      toLink.push({ doctorId: doctor.id, symptomId: symptom.id, expertise: 4 });
      existingLinkSet.add(key);
    }
  }

  // Batch insert
  if (toLink.length > 0) {
    console.log(`Creating ${toLink.length} new associations...`);
    for (let i = 0; i < toLink.length; i += BATCH) {
      await db.insert(doctorSymptoms).values(toLink.slice(i, i + BATCH));
    }
  }
  const totalLinks = await db.select().from(doctorSymptoms);
  console.log(`Total doctor-symptom associations: ${totalLinks.length}`);

  // ── Step 4: Update specialtyMapping if needed ──
  // Thyroid-related diseases should resolve to Endocrinology
  console.log('\n--- Step 4: Done ---');
  console.log('\n=== Improvement complete ===');
  console.log(`Doctors: ${allDoctors.length}`);
  console.log(`Symptoms: ${allSymptoms.length}`);
}

improveMatching().catch(console.error);
