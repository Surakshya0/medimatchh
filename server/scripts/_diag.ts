import "dotenv/config";
import { db } from "./db";
import { doctors, symptoms, doctorSymptoms, users } from "../shared/schema";
import { eq, count } from "drizzle-orm";

// Count doctors per specialty
const docs = await db.select({
  id: doctors.id,
  specialty: doctors.specialty,
  userId: doctors.userId,
}).from(doctors);

const bySpec = new Map<string, number>();
for (const d of docs) {
  bySpec.set(d.specialty, (bySpec.get(d.specialty) || 0) + 1);
}

console.log("=== DOCTORS ===");
console.log("Total doctors:", docs.length);
console.log("By specialty:");
for (const [s, c] of [...bySpec.entries()].sort()) {
  console.log(`  ${s}: ${c}`);
}

// Count doctor-symptom associations
const linkCount = await db.select({ c: count() }).from(doctorSymptoms);
console.log("\n=== DOCTOR-SYMPTOM LINKS ===");
console.log("Total associations:", linkCount[0].c);

// Count symptoms
const symCount = await db.select({ c: count() }).from(symptoms);
console.log("\nTotal symptoms:", symCount[0].c);

// Show sample associations (first 10)
const sampleLinks = await db.select({
  doctorId: doctorSymptoms.doctorId,
  symptomId: doctorSymptoms.symptomId,
  expertise: doctorSymptoms.expertise,
}).from(doctorSymptoms).limit(10);

const docMap = new Map(docs.map(d => [d.id, d]));
const allSyms = await db.select().from(symptoms);
const symMap = new Map(allSyms.map(s => [s.id, s]));

console.log("\n=== SAMPLE ASSOCIATIONS ===");
for (const l of sampleLinks) {
  const d = docMap.get(l.doctorId);
  const s = symMap.get(l.symptomId);
  console.log(`  Dr ${d?.specialty} → "${s?.name}" (expertise: ${l.expertise})`);
}
