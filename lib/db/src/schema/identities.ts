import { pgTable, serial, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const identityUsersTable = pgTable("identity_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  privilegeLevel: text("privilege_level").notNull().default("low"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  accountType: text("account_type").notNull().default("standard"),
  groups: jsonb("groups").notNull().default([]),
  linkedHosts: jsonb("linked_hosts").notNull().default([]),
  riskFlags: jsonb("risk_flags").notNull().default([]),
});

export const identityGroupsTable = pgTable("identity_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  accessLevel: text("access_level").notNull().default("standard"),
  members: jsonb("members").notNull().default([]),
  permissions: jsonb("permissions").notNull().default([]),
});

export const insertIdentityUserSchema = createInsertSchema(identityUsersTable).omit({ id: true });
export type InsertIdentityUser = z.infer<typeof insertIdentityUserSchema>;
export type IdentityUser = typeof identityUsersTable.$inferSelect;

export const insertIdentityGroupSchema = createInsertSchema(identityGroupsTable).omit({ id: true });
export type InsertIdentityGroup = z.infer<typeof insertIdentityGroupSchema>;
export type IdentityGroup = typeof identityGroupsTable.$inferSelect;
