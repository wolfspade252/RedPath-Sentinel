import { pgTable, serial, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scansTable } from "./scans";

export const hostsTable = pgTable("hosts", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  hostname: text("hostname"),
  status: text("status").notNull().default("up"),
  osGuess: text("os_guess"),
  macAddress: text("mac_address"),
  hostType: text("host_type").notNull().default("unknown"),
  difficultyScore: text("difficulty_score").notNull().default("medium"),
  services: jsonb("services").notNull().default([]),
  scanId: integer("scan_id").references(() => scansTable.id, { onDelete: "cascade" }),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const insertHostSchema = createInsertSchema(hostsTable).omit({ id: true });
export type InsertHost = z.infer<typeof insertHostSchema>;
export type Host = typeof hostsTable.$inferSelect;
