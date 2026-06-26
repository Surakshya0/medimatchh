import "dotenv/config";
import { db } from "./db";
import { doctors, symptoms, doctorSymptoms, users } from "../shared/schema";
import { eq, inArray, count } from "drizzle-orm";

// verify some associations
const checks = [
  { symptom: "skin rash", expectedSpecialty: "Dermatology" },
  { symptom: "chest pain", expectedSpecialty: "Cardiology" },
  { symptom: "cough", expectedSpecialty: "Pulmonology" },
  { symptom: "joint pain", expectedSpecialty: "Orthopedics" },
  { symptom: "nausea", expectedSpecialty: "Gastroenterology" },
  { symptom: "headache", expectedSpecialty: "Neurology" },
  { symptom: "dizziness", expectedSpecialty: "Neurology" },
  { symptom: "blurred and distorted vision", expectedSpecialty: "Ophthalmology" },
  { symptom: "depression", expectedSpecialty: "Psychiatry" },
  { symptom: "burning micturition", expectedSpecialty: "Urology" },
];

const allDocLinks = await db.select({
  doctorId: doctorSymptoms.doctorId,
  symptomId: doctorSymptoms.symptomId,
  expertise: doctorSymptoms.expertise,
}).from(doctorSymptoms);

const allDocs = await db.select().from(doctors);
const docMap = new Map(allDocs.map(d => [d.id, d]));

const allSyms = await db.select().from(symptoms);
const symMap = new Map(allSyms.map(s => [s.id, s]));

console.log("=== VERIFICATION ===\n");
for (const check of checks) {
  const sym = allSyms.find(s => s.name === check.symptom);
  if (!sym) { console.log(`❌ symptom "${check.symptom}" not found in DB`); continue; }

  const links = allDocLinks.filter(l => l.symptomId === sym.id);
  if (links.length === 0) { console.log(`❌ "${check.symptom}" has NO doctor links`); continue; }

  const dermDocs = links.filter(l => {
    const d = docMap.get(l.doctorId);
    return d && d.specialty.toLowerCase() === check.expectedSpecialty.toLowerCase();
  });

  const specialties = [...new Set(links.map(l => docMap.get(l.doctorId)?.specialty).filter(Boolean))];

  if (dermDocs.length > 0) {
    console.log(`✅ "${check.symptom}" → ${links.length} doctors, includes ${check.expectedSpecialty} (${dermDocs.length} docs, expertise ${dermDocs[0]?.expertise})`);
  } else {
    console.log(`⚠️  "${check.symptom}" → ${links.length} doctors, specialties: ${specialties.join(", ")} (expected ${check.expectedSpecialty})`);
  }
}

// total stats
const linkStats = await db.select({ c: count() }).from(doctorSymptoms);
console.log(`\nTotal associations: ${linkStats[0].c}`);
