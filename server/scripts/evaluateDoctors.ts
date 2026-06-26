import { resolveSpecialty } from "../specialtyMapping";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DoctorInfo { id: number; specialty: string; experience: number; rating: number; }

const seedDoctors: DoctorInfo[] = [
  { id: 201, specialty: "Internal Medicine",  experience: 16, rating: 5 },
  { id: 202, specialty: "Internal Medicine",  experience: 12, rating: 5 },
  { id: 203, specialty: "Family Medicine",    experience: 9,  rating: 5 },
  { id: 204, specialty: "Family Medicine",    experience: 11, rating: 5 },
  { id: 205, specialty: "General Practice",   experience: 8,  rating: 5 },
  { id: 206, specialty: "Pulmonology",        experience: 9,  rating: 5 },
  { id: 207, specialty: "Cardiology",         experience: 12, rating: 5 },
  { id: 208, specialty: "Neurology",          experience: 8,  rating: 5 },
  { id: 209, specialty: "ENT",                experience: 14, rating: 5 },
  { id: 210, specialty: "Dermatology",        experience: 15, rating: 5 },
  { id: 211, specialty: "Dermatology",        experience: 7,  rating: 5 },
  { id: 212, specialty: "Pediatrics",         experience: 10, rating: 5 },
  { id: 213, specialty: "Orthopedics",        experience: 14, rating: 5 },
  { id: 214, specialty: "Gynecology",         experience: 9,  rating: 5 },
  { id: 215, specialty: "Ophthalmology",      experience: 11, rating: 5 },
  { id: 216, specialty: "Psychiatry",         experience: 7,  rating: 5 },
  { id: 217, specialty: "Endocrinology",      experience: 13, rating: 5 },
  { id: 218, specialty: "Gastroenterology",   experience: 10, rating: 5 },
  { id: 219, specialty: "Urology",            experience: 12, rating: 5 },
  { id: 220, specialty: "Rheumatology",       experience: 8,  rating: 5 },
  { id: 221, specialty: "Nephrology",         experience: 11, rating: 5 },
  { id: 222, specialty: "Hematology",         experience: 10, rating: 5 },
  { id: 223, specialty: "Oncology",           experience: 15, rating: 5 },
  { id: 224, specialty: "Cardiology",         experience: 13, rating: 5 },
  { id: 225, specialty: "Neurology",          experience: 9,  rating: 5 },
];

function guessSpecialties(name: string): string[] {
  const lc = name.toLowerCase();
  const specs: string[] = [];
  if (/itch|skin|rash|pimple|blackhead|blister|crust|peeling|scur|denting|nail|sore|nodal|red\.spots|dischromic/.test(lc)) specs.push("Dermatology");
  if (/headache|dizziness|vertigo|spinning|unsteadiness|balance|paralysis|slurred|sensorium/.test(lc)) specs.push("Neurology");
  if (/cough|breathless|phlegm|sputum|congestion|sinus|runny nose|wheeze/.test(lc)) specs.push("Pulmonology");
  if (/chest|heart|palpitation|fast heart/.test(lc)) specs.push("Cardiology");
  if (/stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation|gastro|ulcer/.test(lc)) specs.push("Gastroenterology");
  if (/joint|knee|hip|muscle|back|neck|stiff|swelling joint|movement/.test(lc)) specs.push("Orthopedics");
  if (/eye|vision|blurred|redness eye|watering eye/.test(lc)) specs.push("Ophthalmology");
  if (/throat|sneeze|ear|sinus|runny nose/.test(lc)) specs.push("ENT");
  if (/urine|urination|micturition|bladder/.test(lc)) specs.push("Urology");
  if (/fever|chill|shivering|sweating|dehydration/.test(lc)) specs.push("Internal Medicine");
  if (/fatigue|lethargy|weakness|malaise|weight|obesity|appetite|hunger|thyroid|sugar|diabetes/.test(lc)) specs.push("Internal Medicine");
  if (/mood|anxiety|depression|restlessness|irritability|concentration/.test(lc)) specs.push("Psychiatry");
  if (/menstruation|pregnancy/.test(lc)) specs.push("Gynecology");
  if (/blood|anemia|transfusion/.test(lc)) specs.push("Internal Medicine");
  if (/liver|jaundice|yellow|hepatitis/.test(lc)) specs.push("Gastroenterology");
  if (/kidney|renal/.test(lc)) specs.push("Nephrology");
  if (/cancer|tumor/.test(lc)) specs.push("Oncology");
  if (/child|infant|pediatric/.test(lc)) specs.push("Pediatrics");
  if (/allerg|runny nose|sneeze|rash/.test(lc)) specs.push("Internal Medicine");
  if (specs.length === 0) specs.push("General Practice", "Internal Medicine");
  return [...new Set(specs)];
}

function generateDoctorSymptomLinks(doctors: DoctorInfo[], symptomNames: string[]): Map<number, Map<string, number>> {
  const links = new Map<number, Map<string, number>>();
  const primaryCare = new Set(["Internal Medicine", "Family Medicine", "General Practice"]);
  const highMatch = /fever|sore throat|shortness of breath|fatigue|cough|headache|chest pain|nausea|dizziness|back pain/;
  for (const doc of doctors) {
    const docLinks = new Map<string, number>();
    for (const sym of symptomNames) {
      const specialties = guessSpecialties(sym);
      const idx = specialties.findIndex(s => s.toLowerCase() === doc.specialty.toLowerCase());
      let expertise = 1;
      if (primaryCare.has(doc.specialty) && highMatch.test(sym)) expertise = 4;
      else if (idx === 0) expertise = 5;
      else if (idx > 0) expertise = 3;
      if (expertise >= 3) docLinks.set(sym, expertise);
    }
    links.set(doc.id, docLinks);
  }
  for (const sym of symptomNames) {
    let hasLink = false;
    for (const [, docLinks] of links) { if (docLinks.has(sym)) { hasLink = true; break; } }
    if (!hasLink) {
      const rd = doctors[Math.floor(Math.random() * doctors.length)];
      links.get(rd.id)!.set(sym, 2);
    }
  }
  return links;
}

interface ScoredDoctor { doctor: DoctorInfo; matchScore: number; symptomMatches: number; scoreBreakdown: string; }

function scoreAllDoctors(doctors: DoctorInfo[], symptomNames: string[], links: Map<number, Map<string, number>>): ScoredDoctor[] {
  return doctors.map(doctor => {
    const docLinks = links.get(doctor.id) || new Map();
    let symMatches = 0, expertiseTotal = 0;
    const matched: string[] = [];
    for (const sym of symptomNames) {
      if (docLinks.has(sym)) { symMatches++; const e = docLinks.get(sym) || 3; expertiseTotal += e; matched.push(sym + "(" + e + ")"); }
    }
    const symptomScore = symptomNames.length > 0 ? symMatches / symptomNames.length : 0;
    const expertiseScore = symMatches > 0 ? expertiseTotal / (5 * symMatches) : 0;
    const experienceScore = Math.min(doctor.experience / 30, 1);
    const ratingScore = doctor.rating / 5;
    const finalScore = (symptomScore * 0.30 + expertiseScore * 0.20 + experienceScore * 0.15 + ratingScore * 0.15 + 0.5 * 0.10 + 0.5 * 0.10) * 100;
    return {
      doctor,
      matchScore: Math.round(finalScore * 10) / 10,
      symptomMatches: symMatches,
      scoreBreakdown: "sym=" + (symptomScore * 100).toFixed(0) + "% exp=" + (expertiseScore * 100).toFixed(0) + "% expYrs=" + (experienceScore * 100).toFixed(0) + "%"
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function loadDiseaseSymptomPatterns(csvPath: string): Map<string, string[]> {
  if (!fs.existsSync(csvPath)) return new Map();
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n").filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim());
  const prognosisIdx = headers.findIndex(h => h.toLowerCase() === "prognosis");
  if (prognosisIdx === -1) return new Map();
  const symptomHeaders = headers.slice(0, prognosisIdx).map(h => h.replace(/_/g, " "));
  const ds = new Map<string, Set<string>>();
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map(c => c.trim());
    if (cols.length <= prognosisIdx) continue;
    const disease = cols[prognosisIdx];
    if (!disease) continue;
    if (!ds.has(disease)) ds.set(disease, new Set());
    for (let i = 0; i < prognosisIdx; i++) { if (cols[i] === "1") ds.get(disease)!.add(symptomHeaders[i]); }
  }
  const result = new Map<string, string[]>();
  for (const [d, syms] of ds) result.set(d, [...syms]);
  return result;
}

function loadAllSymptoms(csvPath: string): string[] {
  if (!fs.existsSync(csvPath)) return [];
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n").filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim());
  const prognosisIdx = headers.findIndex(h => h.toLowerCase() === "prognosis");
  if (prognosisIdx === -1) return [];
  return headers.slice(0, prognosisIdx).map(h => h.replace(/_/g, " "));
}

function evaluate(): void {
  const csvPath = path.join(__dirname, "..", "..", "data", "Training.csv");
  const diseasePatterns = loadDiseaseSymptomPatterns(csvPath);
  const allSymptoms = loadAllSymptoms(csvPath);
  if (diseasePatterns.size === 0) { console.log("No disease-symptom patterns found."); return; }

  const specialties = new Set(seedDoctors.map(d => d.specialty));
  console.log("\n" + "=".repeat(72));
  console.log("  MEDIMATCH \u2014 Doctor Ranking Evaluation");
  console.log("=".repeat(72));
  console.log("  Doctors: " + seedDoctors.length + " across " + specialties.size + " specialties");
  console.log("  Diseases: " + diseasePatterns.size + " test cases");
  console.log("  Symptoms: " + allSymptoms.length);

  const links = generateDoctorSymptomLinks(seedDoctors, allSymptoms);
  let totalLinks = 0;
  for (const [, dl] of links) totalLinks += dl.size;
  console.log("  Associations: " + totalLinks + " (avg " + (totalLinks/seedDoctors.length).toFixed(0) + "/doctor)");

  let endToEndCorrect = 0, endToEndCorrect3 = 0;
  let specRankSum = 0;
  const wrongCases: { disease: string; expected: string; got: string; rank: number; top3: string }[] = [];

  for (const [disease, symptoms] of diseasePatterns) {
    if (symptoms.length === 0) continue;
    const expectedSpec = resolveSpecialty(disease);
    const allRanked = scoreAllDoctors(seedDoctors, symptoms, links);
    const correctSpecDocs = seedDoctors.filter(d => d.specialty.toLowerCase() === expectedSpec.toLowerCase());
    if (correctSpecDocs.length === 0) continue;

    const top1 = allRanked[0];
    const top3 = allRanked.slice(0, 3);
    const topSpecRank = allRanked.findIndex(d => d.doctor.specialty.toLowerCase() === expectedSpec.toLowerCase());

    if (top1.doctor.specialty.toLowerCase() === expectedSpec.toLowerCase()) endToEndCorrect++;
    if (top3.some(d => d.doctor.specialty.toLowerCase() === expectedSpec.toLowerCase())) endToEndCorrect3++;
    specRankSum += (topSpecRank + 1);

    if (top1.doctor.specialty.toLowerCase() !== expectedSpec.toLowerCase()) {
      wrongCases.push({
        disease, expected: expectedSpec,
        got: top1.doctor.specialty,
        rank: topSpecRank + 1,
        top3: top3.map(d => d.doctor.specialty + "(" + d.matchScore + ")").join(", ")
      });
    }
  }
  const n = diseasePatterns.size;
  const avgSpecRank = specRankSum / n;

  console.log("\n  " + "\u2500".repeat(70));
  console.log("  END-TO-END: All 25 doctors scored (no specialty pre-filter)");
  console.log("  " + "\u2500".repeat(70));
  console.log("  Top-1 correct specialty : " + endToEndCorrect + "/" + n + "  (" + (endToEndCorrect/n*100).toFixed(1) + "%)");
  console.log("  Top-3 correct specialty : " + endToEndCorrect3 + "/" + n + "  (" + (endToEndCorrect3/n*100).toFixed(1) + "%)");
  console.log("  Avg rank of 1st correct-specialty doctor: " + avgSpecRank.toFixed(1));

  const correct1Pct = (endToEndCorrect / n * 100).toFixed(1);
  const correct3Pct = (endToEndCorrect3 / n * 100).toFixed(1);

  console.log("\n  Top misclassifications (correct specialty rank > 1):");
  wrongCases.sort((a, b) => b.rank - a.rank).slice(0, 8).forEach(w => {
    console.log("  [" + w.disease.padEnd(35) + " expected " + w.expected.padEnd(20) + " rank " + w.rank + " | top: " + w.top3);
  });

  console.log("\n  " + "\u2500".repeat(70));
  console.log("  WITHIN-SPECIALTY: Doctors differentiated by scoring?");
  console.log("  " + "\u2500".repeat(70));
  let diffCount = 0, multiCount = 0;
  for (const disease of diseasePatterns.keys()) {
    const expectedSpec = resolveSpecialty(disease);
    const specDocs = seedDoctors.filter(d => d.specialty.toLowerCase() === expectedSpec.toLowerCase());
    if (specDocs.length < 2) continue;
    multiCount++;
    const syms = diseasePatterns.get(disease)!;
    if (syms.length === 0) continue;
    const ranked = scoreAllDoctors(specDocs, syms, links);
    const uniqueScores = new Set(ranked.map(r => r.matchScore));
    if (uniqueScores.size > 1) diffCount++;
  }
  console.log("  Diseases with multi-doctor specialties: " + multiCount);
  console.log("  Differentiated scores: " + diffCount + "/" + multiCount + " (" + (multiCount > 0 ? (diffCount/multiCount*100).toFixed(0) : 0) + "%)");

  console.log("\n  Example: Fungal infection (expected: Dermatology)");
  const fungalSyms = diseasePatterns.get("Fungal infection") || [];
  if (fungalSyms.length > 0) {
    const fungalRanked = scoreAllDoctors(seedDoctors, fungalSyms, links);
    fungalRanked.slice(0, 5).forEach((d, i) => {
      console.log("    " + (i+1) + ". " + d.doctor.specialty.padEnd(22) + " score=" + d.matchScore + "  matches=" + d.symptomMatches + "/" + fungalSyms.length + "  " + d.scoreBreakdown);
    });
  }

  console.log("\n" + "=".repeat(72));
  console.log("  Doctor ranking evaluation complete.");
  console.log("=".repeat(72) + "\n");
}

evaluate();
