import "dotenv/config";
import { db } from "../db";
import { symptoms } from "../../shared/schema";
import { eq } from "drizzle-orm";

const testNames = [
  "itching", "skin rash", "joint pain", "fatigue", "chest pain",
  "back pain", "nausea", "high fever", "breathlessness", "cough",
  "headache", "dizziness", "shivering", "Fever", "Sore Throat",
  "Shortness of Breath"
];

for (const n of testNames) {
  const r = await db.select().from(symptoms).where(eq(symptoms.name, n));
  console.log(`${n.padEnd(30)} -> ${r.length > 0 ? "FOUND id=" + r[0].id : "NOT FOUND"}`);
}
