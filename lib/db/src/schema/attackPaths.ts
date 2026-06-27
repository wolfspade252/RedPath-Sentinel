import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attackPathsTable = pgTable("attack_paths", {
  id: serial("id").primaryKey(),
  startIdentity: text("start_identity").notNull(),
  targetHost: text("target_host").notNull(),
  steps: jsonb("steps").notNull().default([]),
  riskSummary: text("risk_summary").notNull().default(""),
  controlWeaknesses: jsonb("control_weaknesses").notNull().default([]),
  defensiveActions: jsonb("defensive_actions").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAttackPathSchema = createInsertSchema(attackPathsTable).omit({ id: true, createdAt: true });
export type InsertAttackPath = z.infer<typeof insertAttackPathSchema>;
export type AttackPath = typeof attackPathsTable.$inferSelect;
