// server/syncSymptoms.ts
// Syncs all 132 symptoms from Kaggle CSV to the database.
// Run once after initial seed: npx tsx server/syncSymptoms.ts

import 'dotenv/config';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { symptoms } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CSV header reader ────────────────────────────────────────────────────────────
function readCSVHeaders(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const firstLine = fs.readFileSync(filePath, "utf-8").split("\n")[0];
  const headers = firstLine.split(",").map((h) => h.trim().replace(/"/g, "")).filter(Boolean);
  return headers.slice(0, -1); // drop "prognosis"
}

// ── Normalise snake_case to frontend-matching lowercase ─────────────────────────
function normaliseName(snake: string): string {
  return snake
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ── Body-part heuristics ─────────────────────────────────────────────────────────
function guessBodyPart(name: string): string {
  const lc = name.toLowerCase();
  if (/itch|skin|rash|pimple|blackhead|blister|crust|peeling|denting|scur|sore|nodal|red.?spots/.test(lc))
    return "Skin";
  if (/headache|dizziness|vertigo|spinning|unsteadiness/.test(lc))
    return "Head";
  if (/cough|breathless|phlegm|sputum|congestion|sinus|runny.?nose|throat|sneeze/.test(lc))
    return "Respiratory";
  if (/chest|heart|palpitation/.test(lc))
    return "Chest";
  if (/stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation/.test(lc))
    return "Digestive";
  if (/joint|knee|hip|muscle|back|neck|limb|stiff|swelling.?joint/.test(lc))
    return "Musculoskeletal";
  if (/eye|vision|blurred|redness.?eye|watering.?eye/.test(lc))
    return "Eyes";
  if (/urine|urination|micturition|bladder|kidney/.test(lc))
    return "Urinary";
  if (/leg|ankle|vein|calf/.test(lc))
    return "Legs";
  if (/fever|chill|shivering|sweating|dehydration|malaise/.test(lc))
    return "Whole Body";
  if (/fatigue|lethargy|weakness|malaise|lack.?concentration/.test(lc))
    return "Whole Body";
  if (/weight|obesity|appetite|hunger/.test(lc))
    return "Metabolic";
  if (/mood|anxiety|depression|restlessness|irritability/.test(lc))
    return "Mental Health";
  return "General";
}

function guessSeverity(name: string): string {
  const lc = name.toLowerCase();
  if (/high.?fever|severe|acute|coma|bleeding|bloody|paralysis|failure|rusty|toxic/.test(lc))
    return "severe";
  if (/mild|irritation|discomfort|slight/.test(lc))
    return "mild";
  return "moderate";
}

// ── Symptom→Specialty mapping (keyword-based) ────────────────────────────────────
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

  if (specs.length === 0) specs.push("General Practice");
  return [...new Set(specs)];
}

// ── Main ─────────────────────────────────────────────────────────────────────────
async function syncSymptoms(): Promise<void> {
  const csvPath = path.join(__dirname, "..", "data", "Training.csv");
  const rawHeaders = readCSVHeaders(csvPath);

  if (rawHeaders.length === 0) {
    console.error("Could not read Training.csv. Make sure it exists in data/");
    process.exit(1);
  }

  console.log(`Found ${rawHeaders.length} symptom columns in CSV`);

  // Build symptom list with auto-assigned metadata & dedup
  const seen = new Set<string>();
  const newSymptoms = rawHeaders
    .map((h) => ({ raw: h, name: normaliseName(h) }))
    .filter(({ name }) => {
      const dup = seen.has(name.toLowerCase());
      seen.add(name.toLowerCase());
      return !dup;
    })
    .map(({ raw, name }) => ({
      name,
      description: null,
      bodyPart: guessBodyPart(raw),
      severity: guessSeverity(raw),
    }));

  // Fetch existing symptom names from DB (case-insensitive match)
  const existing = await db.select({ name: symptoms.name }).from(symptoms);
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

  // Filter to only those not already in DB
  const toInsert = newSymptoms.filter((s) => !existingNames.has(s.name.toLowerCase()));

  if (toInsert.length === 0) {
    console.log("All symptoms already synced. Nothing to do.");
    return;
  }

  console.log(`Inserting ${toInsert.length} new symptoms...`);

  // Insert in batches
  const BATCH = 50;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    await db.insert(symptoms).values(batch);
    console.log(`  Inserted ${Math.min(i + BATCH, toInsert.length)} / ${toInsert.length}`);
  }

  console.log("\nSync complete! All 132 symptoms are now in the database.");
}

syncSymptoms().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
