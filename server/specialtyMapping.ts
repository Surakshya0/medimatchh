// server/specialtyMapping.ts
// Covers all 41 diseases in the Kaggle Training.csv dataset

export const diseaseSpecialtyMap: Record<string, string[]> = {
  // Skin / Dermatology
  "Fungal infection":                        ["Dermatology", "General Practice"],
  "Acne":                                    ["Dermatology", "General Practice"],
  "Psoriasis":                               ["Dermatology", "Rheumatology"],
  "Impetigo":                                ["Dermatology", "General Practice"],
  "Drug Reaction":                           ["Dermatology", "Internal Medicine"],
  "Allergy":                                 ["Dermatology", "General Practice"],
  "Chicken pox":                             ["General Practice", "Internal Medicine"],

  // Liver / Hepatology
  "Hepatitis B":                             ["Gastroenterology", "Internal Medicine"],
  "Hepatitis C":                             ["Gastroenterology", "Internal Medicine"],
  "Hepatitis D":                             ["Gastroenterology", "Internal Medicine"],
  "Hepatitis E":                             ["Gastroenterology", "Internal Medicine"],
  "hepatitis A":                             ["Gastroenterology", "Internal Medicine"],
  "Alcoholic hepatitis":                     ["Gastroenterology", "Internal Medicine"],
  "Chronic cholestasis":                     ["Gastroenterology", "Internal Medicine"],
  "Jaundice":                                ["Gastroenterology", "Internal Medicine"],

  // Gastrointestinal
  "Gastroenteritis":                         ["Gastroenterology", "Internal Medicine"],
  "GERD":                                    ["Gastroenterology", "Internal Medicine"],
  "Peptic ulcer diseae":                     ["Gastroenterology", "Internal Medicine"],
  "Dimorphic hemmorhoids(piles)":            ["Gastroenterology", "General Surgery"],

  // Cardiovascular
  "Heart attack":                            ["Cardiology", "Internal Medicine"],
  "Hypertension":                            ["Cardiology", "Internal Medicine"],
  "Varicose veins":                          ["Cardiology", "General Surgery"],

  // Respiratory
  "Common Cold":                             ["General Practice", "Family Medicine", "ENT"],
  "Pneumonia":                               ["Pulmonology", "Internal Medicine"],
  "Bronchial Asthma":                        ["Pulmonology", "Internal Medicine"],
  "Tuberculosis":                            ["Pulmonology", "Internal Medicine"],

  // Neurological
  "Migraine":                                ["Neurology", "Internal Medicine"],
  "(vertigo) Paroymsal  Positional Vertigo": ["ENT", "Neurology"],
  "Paralysis (brain hemorrhage)":            ["Neurology", "Internal Medicine"],
  "Cervical spondylosis":                    ["Orthopedics", "Neurology"],

  // Endocrine / Metabolic
  "Diabetes":                                ["Endocrinology", "Internal Medicine"],
  "Hypothyroidism":                          ["Endocrinology", "Internal Medicine"],
  "Hyperthyroidism":                         ["Endocrinology", "Internal Medicine"],
  "Hypoglycemia":                            ["Endocrinology", "Internal Medicine"],

  // Musculoskeletal
  "Arthritis":                               ["Rheumatology", "Orthopedics"],
  "Osteoarthristis":                         ["Orthopedics", "Rheumatology"],

  // Infectious
  "Malaria":                                 ["Internal Medicine", "Infectious Disease"],
  "Dengue":                                  ["Internal Medicine", "Infectious Disease"],
  "Typhoid":                                 ["Internal Medicine", "Infectious Disease"],
  "AIDS":                                    ["Internal Medicine", "Infectious Disease"],

  // Urology
  "Urinary tract infection":                 ["Urology", "Internal Medicine", "General Practice"],

  // Fallback
  "General Illness":                         ["Internal Medicine", "Family Medicine", "General Practice"],
};

export function resolveSpecialty(disease: string): string {
  const specialties = diseaseSpecialtyMap[disease];
  if (!specialties || specialties.length === 0) return "Internal Medicine";
  return specialties[0];
}

export function resolveAllSpecialties(disease: string): string[] {
  return diseaseSpecialtyMap[disease] || ["Internal Medicine", "General Practice"];
}