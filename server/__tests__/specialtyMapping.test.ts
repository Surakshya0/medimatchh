import { describe, it, expect } from "vitest";
import { resolveSpecialty, resolveAllSpecialties, diseaseSpecialtyMap } from "../specialtyMapping";

describe("resolveSpecialty", () => {
  it("returns Cardiology for Heart attack", () => {
    expect(resolveSpecialty("Heart attack")).toBe("Cardiology");
  });

  it("returns Dermatology for Acne", () => {
    expect(resolveSpecialty("Acne")).toBe("Dermatology");
  });

  it("returns Dermatology for Fungal infection", () => {
    expect(resolveSpecialty("Fungal infection")).toBe("Dermatology");
  });

  it("returns Gastroenterology for Hepatitis B", () => {
    expect(resolveSpecialty("Hepatitis B")).toBe("Gastroenterology");
  });

  it("returns Pulmonology for Tuberculosis", () => {
    expect(resolveSpecialty("Tuberculosis")).toBe("Pulmonology");
  });

  it("returns Neurology for Migraine", () => {
    expect(resolveSpecialty("Migraine")).toBe("Neurology");
  });

  it("returns Endocrinology for Diabetes", () => {
    expect(resolveSpecialty("Diabetes")).toBe("Endocrinology");
  });

  it("returns Rheumatology for Arthritis", () => {
    expect(resolveSpecialty("Arthritis")).toBe("Rheumatology");
  });

  it("returns Internal Medicine for unknown disease", () => {
    expect(resolveSpecialty("Unknown Disease XYZ")).toBe("Internal Medicine");
  });

  it("returns Internal Medicine for empty string", () => {
    expect(resolveSpecialty("")).toBe("Internal Medicine");
  });
});

describe("resolveAllSpecialties", () => {
  it("returns multiple specialties for Common Cold", () => {
    const specs = resolveAllSpecialties("Common Cold");
    expect(specs).toContain("General Practice");
    expect(specs).toContain("ENT");
  });

  it("returns multiple specialties for Heart attack", () => {
    const specs = resolveAllSpecialties("Heart attack");
    expect(specs).toContain("Cardiology");
    expect(specs).toContain("Internal Medicine");
  });

  it("returns fallback for unknown disease", () => {
    const specs = resolveAllSpecialties("Unknown");
    expect(specs).toEqual(["Internal Medicine", "General Practice"]);
  });
});

describe("diseaseSpecialtyMap coverage", () => {
  it("covers all 41 diseases", () => {
    const diseases = Object.keys(diseaseSpecialtyMap);
    expect(diseases.length).toBeGreaterThanOrEqual(41);
  });

  it("every disease maps to at least one specialty", () => {
    for (const [disease, specialties] of Object.entries(diseaseSpecialtyMap)) {
      expect(specialties.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all specialty names are properly capitalized", () => {
    for (const specialties of Object.values(diseaseSpecialtyMap)) {
      for (const s of specialties) {
        expect(s[0]).toBe(s[0].toUpperCase());
      }
    }
  });
});
