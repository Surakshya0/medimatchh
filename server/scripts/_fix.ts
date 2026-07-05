import "dotenv/config";
import { db } from "../db";
import { symptoms } from "../../shared/schema";
import { sql } from "drizzle-orm";

const result = await db.execute(
  sql`UPDATE symptoms SET name = LOWER(name) WHERE name != LOWER(name)`
);
console.log("Updated", result.rowCount, "symptom names to lowercase");

const [{ c }] = await db.select({ c: sql`COUNT(*)` }).from(symptoms);
console.log("Total symptoms:", c);
