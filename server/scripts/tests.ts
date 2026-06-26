import { classifier, NaiveBayesClassifier } from "../naiveBayes";

const B = "\x1b[1m", G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m", N = "\x1b[0m";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ${G}✓${N} ${msg}`); }
  else { failed++; console.log(`  ${R}✗${N} ${msg}`); }
}

const train = [
  { symptoms: ["fever", "cough", "fatigue"], disease: "Flu" },
  { symptoms: ["fever", "cough", "body ache"], disease: "Flu" },
  { symptoms: ["fever", "headache", "fatigue"], disease: "Flu" },
  { symptoms: ["sneezing", "runny nose", "itchy eyes"], disease: "Allergy" },
  { symptoms: ["sneezing", "runny nose", "watery eyes"], disease: "Allergy" },
  { symptoms: ["rash", "itching", "red spots"], disease: "Chicken pox" },
  { symptoms: ["rash", "fever", "blisters"], disease: "Chicken pox" },
  { symptoms: ["stomach pain", "nausea", "vomiting"], disease: "Food Poisoning" },
  { symptoms: ["nausea", "vomiting", "diarrhea"], disease: "Food Poisoning" },
];

console.log(`\n${B}Naive Bayes${N}`);
(() => {
  const nb = new NaiveBayesClassifier();
  nb.train(train);

  const r1 = nb.predict(["fever", "cough"]);
  assert(r1.disease === "Flu", `predicts Flu for [fever, cough] → ${r1.disease}`);

  const r2 = nb.predict(["sneezing", "itchy eyes"]);
  assert(r2.disease === "Allergy", `predicts Allergy for [sneezing, itchy eyes] → ${r2.disease}`);

  const r3 = nb.predict(["rash", "blisters"]);
  assert(r3.disease === "Chicken pox", `predicts Chicken pox for [rash, blisters] → ${r3.disease}`);

  const r4 = nb.predict(["nausea", "vomiting"]);
  assert(r4.disease === "Food Poisoning", `predicts Food Poisoning for [nausea, vomiting] → ${r4.disease}`);

  assert(r1.topCandidates.length > 0, "returns top candidates");
  assert(r1.confidence > 0, "returns confidence > 0");

  const r5 = nb.predict([]);
  assert(r5.disease !== "", "handles empty input (no crash)");
})();

console.log(`\n${B}Full Kaggle Integration${N}`);

const nbOk = classifier.isReady();
assert(nbOk, "Naive Bayes classifier is ready after loading Kaggle data");
if (nbOk) {
  const r = classifier.predict(["itching", "skin rash"]);
  assert(typeof r.disease === "string" && r.disease.length > 0, `NB can predict from Kaggle data → ${r.disease}`);
}

console.log(`\n${B}${"=".repeat(40)}${N}`);
console.log(`  ${passed + failed} tests: ${G}${passed} passed${N}${failed > 0 ? `, ${R}${failed} failed${N}` : ""}`);
console.log(`${B}${"=".repeat(40)}${N}\n`);
process.exit(failed > 0 ? 1 : 0);
