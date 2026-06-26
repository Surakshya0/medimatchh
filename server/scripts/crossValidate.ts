import "dotenv/config";
import { NaiveBayesClassifier, loadKaggleCSV, TrainingRecord } from "../naiveBayes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stratifiedKFold(records: TrainingRecord[], k: number): { train: TrainingRecord[]; test: TrainingRecord[] }[] {
  const groups = new Map<string, TrainingRecord[]>();
  for (const r of records) {
    if (!groups.has(r.disease)) groups.set(r.disease, []);
    groups.get(r.disease)!.push(r);
  }
  const folds: TrainingRecord[][] = Array.from({ length: k }, () => []);
  for (const [, group] of groups) {
    const shuffled = shuffle(group);
    const foldSize = Math.floor(shuffled.length / k);
    for (let i = 0; i < k; i++) {
      folds[i].push(...shuffled.slice(i * foldSize, (i + 1) * foldSize));
    }
  }
  const result: { train: TrainingRecord[]; test: TrainingRecord[] }[] = [];
  for (let i = 0; i < k; i++) {
    const test = folds[i];
    const train: TrainingRecord[] = [];
    for (let j = 0; j < k; j++) {
      if (j !== i) train.push(...folds[j]);
    }
    result.push({ train, test });
  }
  return result;
}

function crossValidate(): void {
  const dataDir = path.join(__dirname, "..", "data");
  const csvPath = path.join(dataDir, "Training.csv");
  const allRecords = loadKaggleCSV(csvPath);

  if (allRecords.length === 0) {
    console.log("No training data found.");
    return;
  }

  const classes = [...new Set(allRecords.map(r => r.disease))].sort();
  const K = 5;
  console.log(`\n${"=".repeat(72)}`);
  console.log("  5-FOLD STRATIFIED CROSS-VALIDATION — Naive Bayes");
  console.log(`  ${allRecords.length} records, ${classes.length} classes, ${K} folds`);
  console.log("=".repeat(72));

  const results: number[] = [];
  const splits = stratifiedKFold(allRecords, K);

  for (let i = 0; i < K; i++) {
    const { train, test } = splits[i];
    const nb = new NaiveBayesClassifier();
    nb.train(train);

    let correct = 0;
    for (const r of test) {
      const predicted = nb.predict(r.symptoms).disease;
      if (predicted === r.disease) correct++;
    }
    const acc = correct / test.length;
    results.push(acc);
    console.log(`  Fold ${i + 1}: ${(acc * 100).toFixed(2)}% (${correct}/${test.length})`);
  }

  const avg = results.reduce((s, r) => s + r, 0) / K;
  console.log(`\n  Average accuracy: ${(avg * 100).toFixed(2)}% over ${K} folds`);
  console.log(`\n${"=".repeat(72)}`);
  console.log("  Cross-validation complete.");
  console.log("=".repeat(72) + "\n");
}

crossValidate();
