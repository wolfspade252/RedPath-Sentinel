import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rawXml: text("raw_xml"),
  hostCount: integer("host_count").notNull().default(0),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, uploadedAt: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
