import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const children = sqliteTable("children", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  notes: text("notes").notNull(),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull(),
  defaultPlatingPreference: text("default_plating_preference").notNull(),
  allergiesOrRestrictions: text("allergies_or_restrictions", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const foodPreferences = sqliteTable("food_preferences", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull(),
  foodName: text("food_name").notNull(),
  status: text("status").notNull(),
  tags: text("tags", { mode: "json" }).notNull(),
  acceptedFormats: text("accepted_formats", { mode: "json" }).notNull(),
  rejectedFormats: text("rejected_formats", { mode: "json" }).notNull(),
  notes: text("notes").notNull(),
  isSafeFallback: integer("is_safe_fallback", { mode: "boolean" }).notNull(),
  isHardNo: integer("is_hard_no", { mode: "boolean" }).notNull(),
  lastOfferedAt: text("last_offered_at"),
  lastOutcome: text("last_outcome"),
  exposureCount: integer("exposure_count").notNull(),
  acceptedCount: integer("accepted_count").notNull(),
  refusedCount: integer("refused_count").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const meals = sqliteTable("meals", {
  id: text("id").primaryKey(),
  payload: text("payload", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const dinnerResults = sqliteTable("dinner_results", {
  id: text("id").primaryKey(),
  payload: text("payload", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull()
});

export const shoppingLists = sqliteTable("shopping_lists", {
  id: text("id").primaryKey(),
  payload: text("payload", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});
