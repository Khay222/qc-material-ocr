import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("Warehouse Operator"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull(),
  targetQty: integer("target_qty").notNull().default(50),
  completedQty: integer("completed_qty").notNull().default(0),
  mismatchCount: integer("mismatch_count").notNull().default(0),
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'aborted'
  operatorName: text("operator_name").notNull().default("Operator"),
  operatorEmail: text("operator_email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const scanItems = pgTable("scan_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => batches.id),
  itemIndex: integer("item_index").notNull(),
  material1: text("material_1").notNull(),
  material2: text("material_2").notNull(),
  isMatch: boolean("is_match").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  errorReason: text("error_reason"),
});
