// server/syncDoctorSymptoms.ts
// Links all symptoms in the DB to the right doctors via specialty matching.
// Run after seed + syncSymptoms:  npx tsx server/syncDoctorSymptoms.ts

import "dotenv/config";
import { db } from "../db";
import { doctors, symptoms, doctorSymptoms } from "../../shared/schema";
import { and, eq, inArray } from "drizzle-orm";

// ── Keyword → specialty heuristics (mirrors syncSymptoms.ts) ────────────────────
function guessSpecialties(name: string): string[] {
  const lc = name.toLowerCase();
  const specs: string[] = [];

  if (/itch|skin|rash|pimple|blackhead|blister|crust|peeling|scur|denting|nail|sore|nodal|red.?spots|dischromic/.test(lc))
    specs.push("Dermatology");
  if (/headache|dizziness|vertigo|spinning|unsteadiness|balance|paralysis|slurred|sensorium/.test(lc))
    specs.push("Neurology");
  if (/cough|breathless|phlegm|sputum|congestion|sinus|runny.?nose|wheeze/.test(lc))
    specs.push("Pulmonology");
  if (/chest|heart|palpitation|fast.?heart/.test(lc))
    specs.push("Cardiology");
  if (/stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation|gastro|ulcer/.test(lc))
    specs.push("Gastroenterology");
  if (/joint|knee|hip|muscle|back|neck|stiff|swelling.?joint|movement/.test(lc))
    specs.push("Orthopedics");
  if (/eye|vision|blurred|redness.?eye|watering.?eye/.test(lc))
    specs.push("Ophthalmology");
  if (/throat|sneeze|ear|sinus|runny.?nose/.test(lc))
    specs.push("ENT");
  if (/urine|urination|micturition|bladder/.test(lc))
    specs.push("Urology");
  if (/fever|chill|shivering|sweating|dehydration/.test(lc))
    specs.push("Internal Medicine");
  if (/fatigue|lethargy|weakness|malaise|weight|obesity|appetite|hunger|thyroid|sugar|diabetes/.test(lc))
    specs.push("Internal Medicine");
  if (/mood|anxiety|depression|restlessness|irritability|concentration/.test(lc))
    specs.push("Psychiatry");
  if (/menstruation|pregnancy/.test(lc))
    specs.push("Gynecology");
  if (/blood|anemia|transfusion/.test(lc))
    specs.push("Internal Medicine");
  if (/liver|jaundice|yellow|hepatitis/.test(lc))
    specs.push("Gastroenterology");
  if (/kidney|renal/.test(lc))
    specs.push("Nephrology");
  if (/cancer|tumor/.test(lc))
    specs.push("Oncology");
  if (/child|infant|pediatric/.test(lc))
    specs.push("Pediatrics");
  if (/bone|fracture|spine/.test(lc))
    specs.push("Orthopedics");
  if (/allerg|runny.?nose|sneeze|rash/.test(lc))
    specs.push("Internal Medicine");

  if (specs.length === 0) specs.push("General Practice", "Internal Medicine");
  return [...new Set(specs)];
}

async function syncDoctorSymptoms() {
  // 1. Load all symptoms + doctors
  const allSymptoms = await db.select().from(symptoms);
  const allDoctors = await db.select().from(doctors);
  console.log(`Loaded ${allSymptoms.length} symptoms, ${allDoctors.length} doctors`);

  // 2. Fetch existing links to avoid duplicates
  const existingLinks = await db.select({
    doctorId: doctorSymptoms.doctorId,
    symptomId: doctorSymptoms.symptomId,
  }).from(doctorSymptoms);
  const existingSet = new Set(existingLinks.map((l: { doctorId: number; symptomId: number }) => `${l.doctorId}:${l.symptomId}`));
  console.log(`Existing associations: ${existingLinks.length}`);

  // 3. Build new links
  interface NewLink {
    doctorId: number;
    symptomId: number;
    expertise: number;
  }
  const toInsert: NewLink[] = [];

  for (const symptom of allSymptoms) {
    const specialties = guessSpecialties(symptom.name);
    for (const specialty of specialties) {
      const matchedDoctors = allDoctors.filter(
        (d: { specialty: string }) => d.specialty.toLowerCase() === specialty.toLowerCase()
      );
      const isPrimary = specialties.indexOf(specialty) === 0;
      const expertise = isPrimary ? 5 : 3;

      for (const doc of matchedDoctors) {
        const key = `${doc.id}:${symptom.id}`;
        if (!existingSet.has(key)) {
          toInsert.push({
            doctorId: doc.id,
            symptomId: symptom.id,
            expertise,
          });
          existingSet.add(key); // prevent duplicates within this run
        }
      }
    }
  }

  if (toInsert.length === 0) {
    console.log("No new associations to create.");
    return;
  }

  console.log(`Creating ${toInsert.length} new doctor-symptom associations...`);

  // 4. Insert in batches
  const BATCH = 100;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    await db.insert(doctorSymptoms).values(batch);
    console.log(`  Inserted ${Math.min(i + BATCH, toInsert.length)} / ${toInsert.length}`);
  }

  console.log("\nDone! All symptoms now linked to appropriate doctors.");
  console.log(`Total associations: ${existingLinks.length + toInsert.length}`);
}

syncDoctorSymptoms().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
