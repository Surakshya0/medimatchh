import { resolveAllSpecialties } from "../specialtyMapping";
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
  { id: 226, specialty: "Endocrinology",      experience: 14, rating: 5 },
  { id: 227, specialty: "Endocrinology",      experience: 9,  rating: 5 },
  { id: 228, specialty: "Rheumatology",       experience: 11, rating: 5 },
];

function guessSpecialties(name: string): string[] {
  const lc = name.toLowerCase();
  const specs: string[] = [];
  if (/itch|skin|rash|pimple|blackhead|blister|crust|peeling|scur|denting|nail|sore|nodal|red\.spots|dischromic/.test(lc)) specs.push("Dermatology");
  if (/headache|dizziness|vertigo|spinning|unsteadiness|balance|paralysis|slurred|sensorium|fainting|numbness|tingling|memory/.test(lc)) specs.push("Neurology");
  if (/cough|breathless|phlegm|sputum|congestion|sinus|runny nose|wheeze/.test(lc)) specs.push("Pulmonology");
  if (/chest|heart|palpitation|fast heart|leg cramp|swollen leg|vein/.test(lc)) specs.push("Cardiology");
  if (/stomach|abdominal|belly|indigestion|acidity|nausea|vomiting|diarrhoea|constipation|gastro|ulcer/.test(lc)) specs.push("Gastroenterology");
  if (/joint|knee|hip|shoulder|wrist|foot|back|neck|muscle|stiff|swelling joint|movement|deformity|morning.?stiffness/.test(lc)) specs.push("Orthopedics", "Rheumatology");
  if (/eye|vision|blurred|redness eye|watering eye/.test(lc)) specs.push("Ophthalmology");
  if (/throat|sneeze|ear|sinus|runny nose|hearing|tinnitus/.test(lc)) specs.push("ENT");
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

interface ScoredDoctor { doctor: DoctorInfo; matchScore: number; symptomMatches: number; }

function scoreAllDoctors(doctors: DoctorInfo[], symptomNames: string[], links: Map<number, Map<string, number>>, disease?: string): ScoredDoctor[] {
  const targetSpecialties = disease ? resolveAllSpecialties(disease) : [];
  const primarySpecialty = targetSpecialties[0] || "";

  return doctors.map(doctor => {
    const docLinks = links.get(doctor.id) || new Map();
    let symMatches = 0, expertiseTotal = 0;
    for (const sym of symptomNames) {
      if (docLinks.has(sym)) { symMatches++; expertiseTotal += docLinks.get(sym) || 3; }
    }
    const symptomScore = symptomNames.length > 0 ? symMatches / symptomNames.length : 0;
    const expertiseScore = symMatches > 0 ? expertiseTotal / (5 * symMatches) : 0;
    const experienceScore = Math.min(doctor.experience / 30, 1);
    const ratingScore = doctor.rating / 5;

    let relevanceMultiplier = 1.0;
    if (disease) {
      if (doctor.specialty === primarySpecialty) relevanceMultiplier = 1.3;
      else if (targetSpecialties.includes(doctor.specialty)) relevanceMultiplier = 1.1;
    }

    const finalScore = (symptomScore * 0.30 + expertiseScore * 0.20 + experienceScore * 0.15 + ratingScore * 0.15 + 0.5 * 0.10 + 0.5 * 0.10) * 100 * relevanceMultiplier;
    return { doctor, matchScore: Math.round(finalScore * 10) / 10, symptomMatches: symMatches };
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

  console.log("\n" + "=".repeat(72));
  console.log("  MEDIMATCH \u2014 Doctor Ranking Evaluation (with relevance multiplier)");
  console.log("=".repeat(72));
  console.log("  Doctors: " + seedDoctors.length + " across " + new Set(seedDoctors.map(d => d.specialty)).size + " specialties");
  console.log("  Diseases: " + diseasePatterns.size + " test cases");
  console.log("  Symptoms: " + allSymptoms.length);

  const links = generateDoctorSymptomLinks(seedDoctors, allSymptoms);
  let totalLinks = 0;
  for (const [, dl] of links) totalLinks += dl.size;
  console.log("  Associations: " + totalLinks + " (avg " + (totalLinks/seedDoctors.length).toFixed(0) + "/doctor)");

  // Evaluate WITHOUT relevance multiplier (baseline)
  let oldCorrect1 = 0, oldCorrect3 = 0;
  for (const [disease, symptoms] of diseasePatterns) {
    if (symptoms.length === 0) continue;
    const allRanked = scoreAllDoctors(seedDoctors, symptoms, links);
    const expectedSpec = resolveAllSpecialties(disease)[0];
    const top3 = allRanked.slice(0, 3);
    if (allRanked[0].doctor.specialty.toLowerCase() === expectedSpec.toLowerCase()) oldCorrect1++;
    if (top3.some(d => d.doctor.specialty.toLowerCase() === expectedSpec.toLowerCase())) oldCorrect3++;
  }

  // Evaluate WITH relevance multiplier
  let newCorrect1 = 0, newCorrect3 = 0, specRankSum = 0;
  const wrongCases: string[] = [];

  for (const [disease, symptoms] of diseasePatterns) {
    if (symptoms.length === 0) continue;
    const allRanked = scoreAllDoctors(seedDoctors, symptoms, links, disease);
    const expectedSpec = resolveAllSpecialties(disease)[0];
    const top3 = allRanked.slice(0, 3);
    const topSpecRank = allRanked.findIndex(d => d.doctor.specialty.toLowerCase() === expectedSpec.toLowerCase());

    if (allRanked[0].doctor.specialty.toLowerCase() === expectedSpec.toLowerCase()) newCorrect1++;
    if (top3.some(d => d.doctor.specialty.toLowerCase() === expectedSpec.toLowerCase())) newCorrect3++;
    specRankSum += (topSpecRank + 1);

    if (allRanked[0].doctor.specialty.toLowerCase() !== expectedSpec.toLowerCase()) {
      wrongCases.push("  [" + disease.padEnd(35) + " expected " + expectedSpec.padEnd(20) + " rank " + (topSpecRank + 1) + " | top: " + top3.map(d => d.doctor.specialty).join(", "));
    }
  }

  const n = diseasePatterns.size;
  const avgSpecRank = specRankSum / n;

  console.log("\n  " + "\u2500".repeat(70));
  console.log("  BEFORE (no relevance multiplier)  vs  AFTER (with multiplier)");
  console.log("  " + "\u2500".repeat(70));
  console.log("  Top-1 correct:  " + oldCorrect1 + "/" + n + " (" + (oldCorrect1/n*100).toFixed(1) + "%)      " + newCorrect1 + "/" + n + " (" + (newCorrect1/n*100).toFixed(1) + "%)");
  console.log("  Top-3 correct:  " + oldCorrect3 + "/" + n + " (" + (oldCorrect3/n*100).toFixed(1) + "%)      " + newCorrect3 + "/" + n + " (" + (newCorrect3/n*100).toFixed(1) + "%)");
  console.log("  Avg spec rank:  N/A                          " + avgSpecRank.toFixed(1));

  if (wrongCases.length > 0) {
    console.log("\n  Remaining misclassifications (" + wrongCases.length + "):");
    wrongCases.sort((a, b) => {
      const rankA = parseInt(a.match(/rank (\d+)/)?.[1] || "99");
      const rankB = parseInt(b.match(/rank (\d+)/)?.[1] || "99");
      return rankB - rankA;
    }).slice(0, 8).forEach(w => console.log(w));
  }

  console.log("\n  " + "\u2500".repeat(70));
  console.log("  Example: Arthritis (expected: Rheumatology)");
  const arthritisSyms = diseasePatterns.get("Arthritis") || [];
  if (arthritisSyms.length > 0) {
    const aranked = scoreAllDoctors(seedDoctors, arthritisSyms, links, "Arthritis");
    aranked.slice(0, 5).forEach((d, i) => {
      const spec = d.doctor.specialty;
      const isCorrect = spec === "Rheumatology";
      console.log("    " + (i+1) + ". " + spec.padEnd(22) + " score=" + d.matchScore + "  matches=" + d.symptomMatches + "/" + arthritisSyms.length + (isCorrect ? "  <-- expected" : ""));
    });
  }

  
  console.log("\n  Example: Fungal infection (expected: Dermatology)");
  const fungalSyms = diseasePatterns.get("Fungal infection") || [];
  if (fungalSyms.length > 0) {
    const franked = scoreAllDoctors(seedDoctors, fungalSyms, links, "Fungal infection");
    franked.slice(0, 5).forEach((d, i) => {
      const isCorrect = d.doctor.specialty === "Dermatology";
      console.log("    " + (i+1) + ". " + d.doctor.specialty.padEnd(22) + " score=" + d.matchScore + "  matches=" + d.symptomMatches + "/" + fungalSyms.length + (isCorrect ? "  <-- expected" : ""));
    });
  }
console.log("\n" + "=".repeat(72));
  console.log("  Doctor ranking evaluation complete.");
  console.log("=".repeat(72) + "\n");
}

evaluate();

