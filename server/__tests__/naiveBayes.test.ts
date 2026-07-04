import { describe, it, expect } from "vitest";
import { NaiveBayesClassifier } from "../naiveBayes";

const trainData = [
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

function makeClassifier() {
  const nb = new NaiveBayesClassifier();
  nb.train(trainData);
  return nb;
}

describe("NaiveBayesClassifier", () => {
  it("predicts Flu for [fever, cough]", () => {
    const nb = makeClassifier();
    const r = nb.predict(["fever", "cough"]);
    expect(r.disease).toBe("Flu");
  });

  it("predicts Allergy for [sneezing, itchy eyes]", () => {
    const nb = makeClassifier();
    const r = nb.predict(["sneezing", "itchy eyes"]);
    expect(r.disease).toBe("Allergy");
  });

  it("predicts Chicken pox for [rash, blisters]", () => {
    const nb = makeClassifier();
    const r = nb.predict(["rash", "blisters"]);
    expect(r.disease).toBe("Chicken pox");
  });

  it("predicts Food Poisoning for [nausea, vomiting]", () => {
    const nb = makeClassifier();
    const r = nb.predict(["nausea", "vomiting"]);
    expect(r.disease).toBe("Food Poisoning");
  });

  it("returns confidence > 0", () => {
    const nb = makeClassifier();
    const r = nb.predict(["fever"]);
    expect(r.confidence).toBeGreaterThan(0);
  });

  it("returns topCandidates with entries", () => {
    const nb = makeClassifier();
    const r = nb.predict(["fever"]);
    expect(r.topCandidates.length).toBeGreaterThan(0);
  });

  it("handles empty input without crashing", () => {
    const nb = makeClassifier();
    const r = nb.predict([]);
    expect(typeof r.disease).toBe("string");
    expect(r.disease.length).toBeGreaterThan(0);
  });

  it("returns confidenceCategory as one of high/medium/low", () => {
    const nb = makeClassifier();
    const r = nb.predict(["fever", "cough"]);
    expect(["high", "medium", "low"]).toContain(r.confidenceCategory);
  });

  it("isReady returns false before training", () => {
    const nb = new NaiveBayesClassifier();
    expect(nb.isReady()).toBe(false);
  });

  it("isReady returns true after training", () => {
    const nb = makeClassifier();
    expect(nb.isReady()).toBe(true);
  });

  it("retrain does not throw", () => {
    const nb = makeClassifier();
    expect(() => nb.retrain(trainData)).not.toThrow();
  });

  it("returns normalizedEntropy between 0 and 1", () => {
    const nb = makeClassifier();
    const r = nb.predict(["fever", "cough"]);
    expect(r.normalizedEntropy).toBeGreaterThanOrEqual(0);
    expect(r.normalizedEntropy).toBeLessThanOrEqual(1);
  });

  it("returns relativeConfidence between 0 and 1", () => {
    const nb = makeClassifier();
    const r = nb.predict(["fever", "cough"]);
    expect(r.relativeConfidence).toBeGreaterThanOrEqual(0);
    expect(r.relativeConfidence).toBeLessThanOrEqual(1);
  });
});
