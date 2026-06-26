// server/naiveBayes.ts
// Naive Bayes Classifier — loads from Kaggle CSV dataset
// Dataset: https://www.kaggle.com/datasets/kaushil268/disease-prediction-using-machine-learning
// Place Training.csv and Testing.csv in: medinew/data/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConfidenceCategory = "high" | "medium" | "low";

export interface PredictionResult {
  disease: string;
  confidence: number;
  relativeConfidence: number;
  normalizedEntropy: number;
  confidenceCategory: ConfidenceCategory;
  topCandidates: { disease: string; probability: number }[];
}

export interface TrainingRecord {
  symptoms: string[];
  disease: string;
}

// ── Classifier ────────────────────────────────────────────────────────────────

export class NaiveBayesClassifier {
  private classPriors: Map<string, number> = new Map();
  private conditionalProbs: Map<string, Map<string, number>> = new Map();
  private classes: string[] = [];
  private vocabulary: string[] = [];
  private trained = false;

  train(dataset: TrainingRecord[]): void {
    if (!dataset || dataset.length === 0) {
      console.warn("NaiveBayes: empty dataset, skipping training");
      return;
    }

    const classCounts    = new Map<string, number>();
    const symptomCounts  = new Map<string, Map<string, number>>();
    const vocabSet       = new Set<string>();

    for (const record of dataset) {
      classCounts.set(record.disease, (classCounts.get(record.disease) || 0) + 1);
      if (!symptomCounts.has(record.disease))
        symptomCounts.set(record.disease, new Map());

      for (const symptom of record.symptoms) {
        const n = symptom.toLowerCase().trim().replace(/\s+/g, " ");
        vocabSet.add(n);
        const map = symptomCounts.get(record.disease)!;
        map.set(n, (map.get(n) || 0) + 1);
      }
    }

    this.vocabulary = Array.from(vocabSet);
    this.classes    = Array.from(classCounts.keys());
    const total     = dataset.length;

    for (const cls of this.classes) {
      this.classPriors.set(cls, (classCounts.get(cls) || 0) / total);
      const counts   = symptomCounts.get(cls)!;
      const clsTotal = classCounts.get(cls)!;
      const probMap  = new Map<string, number>();

      for (const symptom of this.vocabulary) {
        // Laplace smoothing
        probMap.set(symptom,
          ((counts.get(symptom) || 0) + 1) / (clsTotal + this.vocabulary.length)
        );
      }
      this.conditionalProbs.set(cls, probMap);
    }

    this.trained = true;
    console.log(
      `NaiveBayes: trained — ${this.classes.length} diseases, ` +
      `${this.vocabulary.length} symptoms, ${dataset.length} records`
    );
  }

  predict(symptoms: string[]): PredictionResult {
    if (!this.trained || this.classes.length === 0) {
      return {
        disease: "General Illness",
        confidence: 0.5,
        relativeConfidence: 1,
        normalizedEntropy: 1,
        confidenceCategory: "low",
        topCandidates: [{ disease: "General Illness", probability: 0.5 }],
      };
    }

    const norm      = symptoms.map(s => s.toLowerCase().trim().replace(/\s+/g, " "));
    const logScores = new Map<string, number>();

    for (const cls of this.classes) {
      let logProb     = Math.log(this.classPriors.get(cls) || 1e-10);
      const probMap   = this.conditionalProbs.get(cls)!;
      for (const symptom of norm) {
        const prob = probMap.get(symptom) || 1 / (this.vocabulary.length + 1);
        logProb += Math.log(prob);
      }
      logScores.set(cls, logProb);
    }

    // Log-sum-exp trick for numerical stability
    const maxScore = Math.max(...logScores.values());
    const expMap   = new Map<string, number>();
    let expTotal   = 0;

    for (const [cls, score] of logScores) {
      const exp = Math.exp(score - maxScore);
      expMap.set(cls, exp);
      expTotal += exp;
    }

    const sorted = Array.from(expMap.entries())
      .map(([disease, exp]) => ({
        disease,
        probability: Math.round((exp / expTotal) * 1000) / 1000,
      }))
      .sort((a, b) => b.probability - a.probability);

    // Relative confidence: how much more likely is top vs runner-up
    // 1 - (P(second) / P(first)) → 0 if tied, → 1 if top dominates
    const topProb = sorted[0]?.probability || 0;
    const secondProb = sorted[1]?.probability || 0;
    const relativeConfidence = topProb > 0
      ? Math.round((1 - secondProb / topProb) * 100) / 100
      : 0;

    // Normalized entropy: 0 = completely certain, 1 = uniform distribution
    // Measures how spread out the probability mass is across all classes
    const numClasses = this.classes.length;
    const entropy = -Array.from(expMap.values())
      .reduce((sum, exp) => {
        const p = exp / expTotal;
        return sum + (p > 0 ? p * Math.log(p) : 0);
      }, 0) / Math.log(numClasses);
    const normalizedEntropy = Math.round(Math.min(entropy, 1) * 100) / 100;
    const entropyScore = 1 - normalizedEntropy;

    // Confidence category based on entropy score
    let confidenceCategory: ConfidenceCategory;
    if (entropyScore >= 0.9) confidenceCategory = "high";
    else if (entropyScore >= 0.65) confidenceCategory = "medium";
    else confidenceCategory = "low";

    return {
      disease:           sorted[0].disease,
      confidence:        Math.round(topProb * 100) / 100,
      relativeConfidence,
      normalizedEntropy,
      confidenceCategory,
      topCandidates:     sorted.slice(0, 3),
    };
  }

  isReady():        boolean { return this.trained; }
  getDiseaseCount():number  { return this.classes.length; }
  getSymptomCount():number  { return this.vocabulary.length; }

  retrain(dataset: TrainingRecord[]): void {
    if (!dataset || dataset.length === 0) {
      console.warn("NaiveBayes.retrain: empty dataset, keeping existing model");
      return;
    }
    this.train(dataset);
  }

  retrainFromDB(dbRecords: TrainingRecord[]): boolean {
    if (!dbRecords || dbRecords.length === 0) return false;
    this.retrain(dbRecords);
    console.log(
      `NaiveBayes: retrained from DB — ${this.classes.length} diseases, ` +
      `${this.vocabulary.length} symptoms, ${dbRecords.length} records`
    );
    return true;
  }
}

// ── CSV Loader ────────────────────────────────────────────────────────────────
// Reads the Kaggle format:
//   itching,skin_rash,nodal_skin_eruptions,...,prognosis
//   1,1,0,...,Fungal infection
//   0,0,1,...,Allergy

export function loadKaggleCSV(filePath: string): TrainingRecord[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`NaiveBayes: CSV not found at ${filePath}, falling back to built-in dataset`);
    return [];
  }

  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(l => l.trim());
  let headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));

  // Remove a trailing empty header if the CSV ends with an extra comma.
  if (headers[headers.length - 1] === "") {
    headers = headers.slice(0, -1);
  }

  const prognosisIndex = headers.findIndex(h => h.toLowerCase() === "prognosis");
  if (prognosisIndex === -1) {
    console.warn(`NaiveBayes: prognosis column not found in ${filePath}`);
    return [];
  }

  const symptomHeaders = headers.slice(0, prognosisIndex);
  const records: TrainingRecord[] = [];

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));

    // Remove a trailing empty value from lines ending with a comma.
    if (cols.length > headers.length && cols[cols.length - 1] === "") {
      cols.pop();
    }

    if (cols.length <= prognosisIndex) continue;
    const disease = cols[prognosisIndex];
    if (!disease) continue;

    const symptoms: string[] = [];
    for (let i = 0; i < prognosisIndex; i++) {
      if (cols[i] === "1") {
        symptoms.push(symptomHeaders[i].replace(/_/g, " "));
      }
    }

    if (symptoms.length > 0) {
      records.push({ symptoms, disease });
    }
  }

  console.log(`NaiveBayes: loaded ${records.length} records from ${path.basename(filePath)}`);
  return records;
}

// ── Fallback built-in dataset (used if CSV files are missing) ─────────────────

export const builtInDataset: TrainingRecord[] = [
  { symptoms: ["fever", "cough", "fatigue", "headache", "sore throat"], disease: "Influenza" },
  { symptoms: ["fever", "cough", "headache", "fatigue", "chills"],      disease: "Influenza" },
  { symptoms: ["fever", "sore throat", "fatigue", "cough"],             disease: "Influenza" },
  { symptoms: ["runny nose", "sore throat", "cough", "sneezing"],       disease: "Common Cold" },
  { symptoms: ["sore throat", "cough", "fatigue", "runny nose"],        disease: "Common Cold" },
  { symptoms: ["severe headache", "nausea", "vomiting", "light sensitivity", "dizziness"], disease: "Migraine" },
  { symptoms: ["throbbing headache", "nausea", "sound sensitivity"],    disease: "Migraine" },
  { symptoms: ["fever", "cough", "shortness of breath", "fatigue"],     disease: "Pneumonia" },
  { symptoms: ["cough", "fever", "chest pain", "shortness of breath"],  disease: "Pneumonia" },
  { symptoms: ["chest pain", "shortness of breath", "sweating", "nausea"], disease: "Myocardial Infarction" },
  { symptoms: ["severe chest pain", "shortness of breath", "dizziness"], disease: "Myocardial Infarction" },
  { symptoms: ["headache", "dizziness", "blurred vision", "fatigue"],   disease: "Hypertension" },
  { symptoms: ["shortness of breath", "wheezing", "cough", "chest tightness"], disease: "Asthma" },
  { symptoms: ["nausea", "vomiting", "diarrhea", "stomach cramps", "fever"], disease: "Gastroenteritis" },
  { symptoms: ["frequent urination", "excessive thirst", "fatigue", "blurred vision"], disease: "Diabetes" },
  { symptoms: ["fatigue", "weight gain", "cold intolerance", "dry skin"], disease: "Hypothyroidism" },
  { symptoms: ["joint pain", "joint stiffness", "swollen joints", "fatigue"], disease: "Arthritis" },
  { symptoms: ["back pain", "muscle aches", "fatigue", "stiffness"],    disease: "Musculoskeletal Pain" },
  { symptoms: ["fatigue", "pale skin", "shortness of breath", "dizziness"], disease: "Anemia" },
  { symptoms: ["burning urination", "frequent urination", "pelvic pain"], disease: "Urinary Tract Infection" },
  { symptoms: ["fever", "high fever", "chills", "headache", "muscle pain"], disease: "Malaria" },
  { symptoms: ["high fever", "severe headache", "joint pain", "rash"],  disease: "Dengue Fever" },
  { symptoms: ["fever", "dry cough", "fatigue", "loss of taste", "loss of smell"], disease: "COVID-19" },
  { symptoms: ["persistent sadness", "loss of interest", "fatigue", "sleep disturbance"], disease: "Depression" },
  { symptoms: ["excessive worry", "restlessness", "fatigue", "palpitations"], disease: "Anxiety Disorder" },
];

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Training data → trains the classifier
// Testing  data → held out for evaluation (never seen during training)

const trainingCSVPath = path.join(__dirname, "../data/Training.csv");
const testingCSVPath  = path.join(__dirname, "../data/Testing.csv");

let dataset: TrainingRecord[] = loadKaggleCSV(trainingCSVPath);
export const testingRecords: TrainingRecord[] = loadKaggleCSV(testingCSVPath);

console.log(
  `NaiveBayes: ${dataset.length} training records (${testingRecords.length} held out for evaluation)`
);

// Fall back to built-in if CSV not available
if (dataset.length === 0) {
  console.log("NaiveBayes: using built-in dataset (25 diseases)");
  dataset = builtInDataset;
}

export const classifier = new NaiveBayesClassifier();
classifier.train(dataset);

console.log();