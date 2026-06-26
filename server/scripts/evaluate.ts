import { classifier, testingRecords, TrainingRecord } from "../naiveBayes";

interface ClassMetrics {
  disease: string;
  support: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1Score: number;
}

function computeMetrics(
  confusion: Record<string, Record<string, number>>,
  classes: string[]
): ClassMetrics[] {
  return classes.map((disease) => {
    const tp = confusion[disease]?.[disease] || 0;
    let fp = 0;
    let fn = 0;
    for (const a of classes) {
      if (a !== disease) fp += confusion[a]?.[disease] || 0;
    }
    for (const p of classes) {
      if (p !== disease) fn += confusion[disease]?.[p] || 0;
    }
    const support = tp + fn;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;
    return { disease, support, tp, fp, fn, precision, recall, f1Score };
  });
}

function evaluateModel(
  name: string,
  predictFn: (symptoms: string[]) => string,
  predictTop3Fn: (symptoms: string[]) => string[],
  records: TrainingRecord[]
): { accuracy: number; top3Accuracy: number; metrics: ClassMetrics[]; misclassified: { actual: string; predicted: string }[] } {
  let correct = 0;
  let top3Correct = 0;
  const total = records.length;
  const confusion: Record<string, Record<string, number>> = {};
  const actualSet = new Set<string>();

  const misclassified: { actual: string; predicted: string }[] = [];

  for (const record of records) {
    const actual = record.disease;
    const predicted = predictFn(record.symptoms);
    const top3 = predictTop3Fn(record.symptoms);

    actualSet.add(actual);
    if (!confusion[actual]) confusion[actual] = {};
    confusion[actual][predicted] = (confusion[actual][predicted] || 0) + 1;

    if (predicted === actual) correct++;
    if (top3.includes(actual)) top3Correct++;

    if (predicted !== actual) {
      misclassified.push({ actual, predicted });
    }
  }

  const classes = Array.from(actualSet).sort();
  const metrics = computeMetrics(confusion, classes);

  return {
    accuracy: correct / total,
    top3Accuracy: top3Correct / total,
    metrics,
    misclassified,
  };
}

function printModelResults(
  name: string,
  result: ReturnType<typeof evaluateModel>,
  total: number
): void {
  const { accuracy, top3Accuracy, metrics, misclassified } = result;

  console.log(`\n  ── ${name} ──`);
  console.log(`  Top-1 Accuracy  : ${(accuracy * 100).toFixed(2)}%  (${(accuracy * total).toFixed(0)}/${total})`);
  console.log(`  Top-3 Accuracy  : ${(top3Accuracy * 100).toFixed(2)}%  (${(top3Accuracy * total).toFixed(0)}/${total})`);
  console.log(`  Error Rate      : ${((1 - accuracy) * 100).toFixed(2)}%`);

  // Per-class metrics
  metrics.sort((a, b) => a.f1Score - b.f1Score);
  console.log(`\n  ${"Class".padEnd(38)} Sup  Prec   Rec    F1`);
  console.log("  " + "─".repeat(70));
  for (const m of metrics) {
    console.log(
      `  ${m.disease.padEnd(38)} ${String(m.support).padEnd(3)} ` +
      `${m.precision.toFixed(3)} ${m.recall.toFixed(3)} ${m.f1Score.toFixed(3)}`
    );
  }

  const avgPrecision = metrics.reduce((s, m) => s + m.precision, 0) / metrics.length;
  const avgRecall = metrics.reduce((s, m) => s + m.recall, 0) / metrics.length;
  const avgF1 = metrics.reduce((s, m) => s + m.f1Score, 0) / metrics.length;
  const totalSupport = metrics.reduce((s, m) => s + m.support, 0);
  const wAvgPrecision = metrics.reduce((s, m) => s + m.precision * m.support, 0) / totalSupport;
  const wAvgRecall = metrics.reduce((s, m) => s + m.recall * m.support, 0) / totalSupport;
  const wAvgF1 = metrics.reduce((s, m) => s + m.f1Score * m.support, 0) / totalSupport;

  console.log("  " + "─".repeat(70));
  console.log(`  ${"MACRO AVERAGE".padEnd(38)}      ${avgPrecision.toFixed(3)} ${avgRecall.toFixed(3)} ${avgF1.toFixed(3)}`);
  console.log(`  ${"WEIGHTED AVG".padEnd(38)}      ${wAvgPrecision.toFixed(3)} ${wAvgRecall.toFixed(3)} ${wAvgF1.toFixed(3)}`);

  if (misclassified.length > 0) {
    console.log(`\n  Misclassifications: ${misclassified.length}`);
    for (const m of misclassified) {
      console.log(`    ❌ ${m.actual} → ${m.predicted}`);
    }
  }
}

function evaluate(): void {
  if (testingRecords.length === 0) {
    console.log("\nNo testing records found. Make sure data/Testing.csv exists.");
    return;
  }

  console.log("\n" + "=".repeat(72));
  console.log("  MEDIMATCH — Naive Bayes Evaluation");
  console.log("=".repeat(72));

  console.log(`\n  Test set size: ${testingRecords.length} records`);

  if (!classifier.isReady()) {
    console.log("\n  Naive Bayes classifier is not trained. Skipping.");
    return;
  }

  const nbPredict = (symptoms: string[]) => classifier.predict(symptoms).disease;
  const nbTop3 = (symptoms: string[]) =>
    classifier.predict(symptoms).topCandidates.map((c) => c.disease);

  const nbResult = evaluateModel("Naive Bayes", nbPredict, nbTop3, testingRecords);
  printModelResults("Naive Bayes", nbResult, testingRecords.length);

  console.log("\n" + "=".repeat(72));
  console.log("  Evaluation complete.");
  console.log("=".repeat(72) + "\n");
}

evaluate();
