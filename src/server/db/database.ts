import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  ChildProfile,
  DinnerResult,
  FoodPreference,
  FoodPreferenceStatus,
  Meal,
  ShoppingList
} from "./types.js";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function nowIso(): string {
  return new Date().toISOString();
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function stringifyJson(value: Json): string {
  return JSON.stringify(value);
}

export class AppDatabase {
  private readonly db: DatabaseSync;

  constructor(filename: string) {
    mkdirSync(path.dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec("PRAGMA journal_mode = WAL");
    this.db.exec("PRAGMA foreign_keys = ON");
    this.migrate();
    this.seedHousehold();
  }

  static fromEnvironment(): AppDatabase {
    const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
    return new AppDatabase(path.join(dataDir, "meal-planner.sqlite"));
  }

  migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        notes TEXT NOT NULL DEFAULT '',
        is_archived INTEGER NOT NULL DEFAULT 0,
        default_plating_preference TEXT NOT NULL,
        allergies_or_restrictions TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS food_preferences (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        food_name TEXT NOT NULL,
        status TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        accepted_formats TEXT NOT NULL DEFAULT '[]',
        rejected_formats TEXT NOT NULL DEFAULT '[]',
        notes TEXT NOT NULL DEFAULT '',
        is_safe_fallback INTEGER NOT NULL DEFAULT 0,
        is_hard_no INTEGER NOT NULL DEFAULT 0,
        last_offered_at TEXT,
        last_outcome TEXT,
        exposure_count INTEGER NOT NULL DEFAULT 0,
        accepted_count INTEGER NOT NULL DEFAULT 0,
        refused_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dinner_results (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shopping_lists (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  seedHousehold(): void {
    const count = this.db.prepare("SELECT COUNT(*) AS count FROM children").get() as { count: number };
    if (count.count > 0) return;

    const insert = this.db.prepare(`
      INSERT INTO children (
        id, name, age, notes, is_archived, default_plating_preference,
        allergies_or_restrictions, created_at, updated_at
      ) VALUES (
        @id, @name, @age, @notes, @isArchived, @defaultPlatingPreference,
        @allergiesOrRestrictions, @createdAt, @updatedAt
      )
    `);

    const createdAt = nowIso();
    for (const name of ["Charlotte", "James"]) {
      insert.run({
        id: randomUUID(),
        name,
        age: null,
        notes: "",
        isArchived: 0,
        defaultPlatingPreference: "separateComponents",
        allergiesOrRestrictions: "[]",
        createdAt,
        updatedAt: createdAt
      });
    }
  }

  listChildren(includeArchived = false): ChildProfile[] {
    const rows = this.db
      .prepare(`SELECT * FROM children ${includeArchived ? "" : "WHERE is_archived = 0"} ORDER BY name`)
      .all() as ChildRow[];

    return rows.map((row) => this.hydrateChild(row));
  }

  getChild(id: string): ChildProfile | null {
    const row = this.db.prepare("SELECT * FROM children WHERE id = ?").get(id) as ChildRow | undefined;
    return row ? this.hydrateChild(row) : null;
  }

  upsertChild(input: {
    id?: string;
    name: string;
    age: number | null;
    notes: string;
    defaultPlatingPreference: ChildProfile["defaultPlatingPreference"];
    allergiesOrRestrictions: string[];
  }): ChildProfile {
    const timestamp = nowIso();
    const id = input.id ?? randomUUID();
    const existing = input.id ? this.getChild(input.id) : null;

    if (existing) {
      this.db
        .prepare(`
          UPDATE children
          SET name = @name,
              age = @age,
              notes = @notes,
              default_plating_preference = @defaultPlatingPreference,
              allergies_or_restrictions = @allergiesOrRestrictions,
              updated_at = @updatedAt
          WHERE id = @id
        `)
        .run({
          id,
          name: input.name,
          age: input.age,
          notes: input.notes,
          defaultPlatingPreference: input.defaultPlatingPreference,
          allergiesOrRestrictions: stringifyJson(input.allergiesOrRestrictions),
          updatedAt: timestamp
        });
    } else {
      this.db
        .prepare(`
          INSERT INTO children (
            id, name, age, notes, is_archived, default_plating_preference,
            allergies_or_restrictions, created_at, updated_at
          ) VALUES (
            @id, @name, @age, @notes, 0, @defaultPlatingPreference,
            @allergiesOrRestrictions, @createdAt, @updatedAt
          )
        `)
        .run({
          id,
          name: input.name,
          age: input.age,
          notes: input.notes,
          defaultPlatingPreference: input.defaultPlatingPreference,
          allergiesOrRestrictions: stringifyJson(input.allergiesOrRestrictions),
          createdAt: timestamp,
          updatedAt: timestamp
        });
    }

    const child = this.getChild(id);
    if (!child) throw new Error("Unable to load saved child");
    return child;
  }

  archiveChild(id: string): void {
    this.db.prepare("UPDATE children SET is_archived = 1, updated_at = ? WHERE id = ?").run(nowIso(), id);
  }

  addFoodPreference(input: {
    childId: string;
    foodName: string;
    status: FoodPreferenceStatus;
    tags: FoodPreference["tags"];
    acceptedFormats: string[];
    rejectedFormats: string[];
    notes: string;
    isSafeFallback: boolean;
    isHardNo: boolean;
  }): FoodPreference {
    const timestamp = nowIso();
    const preference: FoodPreference = {
      id: randomUUID(),
      childId: input.childId,
      foodName: input.foodName,
      status: input.status,
      tags: input.tags,
      acceptedFormats: input.acceptedFormats,
      rejectedFormats: input.rejectedFormats,
      notes: input.notes,
      isSafeFallback: input.isSafeFallback,
      isHardNo: input.isHardNo,
      lastOfferedAt: null,
      lastOutcome: null,
      exposureCount: 0,
      acceptedCount: 0,
      refusedCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.db
      .prepare(`
        INSERT INTO food_preferences (
          id, child_id, food_name, status, tags, accepted_formats, rejected_formats,
          notes, is_safe_fallback, is_hard_no, last_offered_at, last_outcome,
          exposure_count, accepted_count, refused_count, created_at, updated_at
        ) VALUES (
          @id, @childId, @foodName, @status, @tags, @acceptedFormats, @rejectedFormats,
          @notes, @isSafeFallback, @isHardNo, @lastOfferedAt, @lastOutcome,
          @exposureCount, @acceptedCount, @refusedCount, @createdAt, @updatedAt
        )
      `)
      .run({
        ...preference,
        tags: stringifyJson(preference.tags),
        acceptedFormats: stringifyJson(preference.acceptedFormats),
        rejectedFormats: stringifyJson(preference.rejectedFormats),
        isSafeFallback: preference.isSafeFallback ? 1 : 0,
        isHardNo: preference.isHardNo ? 1 : 0
      });

    return preference;
  }

  updateFoodPreferenceCounters(input: {
    childId: string;
    foodName: string;
    outcome: FoodPreference["lastOutcome"];
    servedAt: string;
  }): void {
    if (!input.outcome || input.outcome === "notOffered") return;

    const existing = this.db
      .prepare(
        "SELECT * FROM food_preferences WHERE child_id = ? AND lower(food_name) = lower(?) LIMIT 1"
      )
      .get(input.childId, input.foodName) as FoodPreferenceRow | undefined;

    const acceptedIncrement = input.outcome === "ateHappily" || input.outcome === "ateSome" ? 1 : 0;
    const refusedIncrement = input.outcome === "refused" || input.outcome === "meltdown" ? 1 : 0;

    if (existing) {
      this.db
        .prepare(`
          UPDATE food_preferences
          SET last_offered_at = @servedAt,
              last_outcome = @outcome,
              exposure_count = exposure_count + 1,
              accepted_count = accepted_count + @acceptedIncrement,
              refused_count = refused_count + @refusedIncrement,
              updated_at = @updatedAt
          WHERE id = @id
        `)
        .run({
          id: existing.id,
          servedAt: input.servedAt,
          outcome: input.outcome,
          acceptedIncrement,
          refusedIncrement,
          updatedAt: nowIso()
        });
      return;
    }

    this.addFoodPreference({
      childId: input.childId,
      foodName: input.foodName,
      status: "unknown",
      tags: [],
      acceptedFormats: [],
      rejectedFormats: [],
      notes: "Created from dinner logging.",
      isSafeFallback: false,
      isHardNo: false
    });
    this.updateFoodPreferenceCounters(input);
  }

  listMeals(): Meal[] {
    const rows = this.db.prepare("SELECT payload FROM meals ORDER BY created_at DESC").all() as PayloadRow[];
    return rows.map((row) => parseJson<Meal>(row.payload));
  }

  getMeal(id: string): Meal | null {
    const row = this.db.prepare("SELECT payload FROM meals WHERE id = ?").get(id) as PayloadRow | undefined;
    return row ? parseJson<Meal>(row.payload) : null;
  }

  saveMeal(meal: Meal): Meal {
    const timestamp = nowIso();
    const saved: Meal = {
      ...meal,
      createdAt: meal.createdAt || timestamp,
      updatedAt: timestamp
    };

    this.db
      .prepare(`
        INSERT INTO meals (id, payload, created_at, updated_at)
        VALUES (@id, @payload, @createdAt, @updatedAt)
        ON CONFLICT(id) DO UPDATE SET
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `)
      .run({
        id: saved.id,
        payload: stringifyJson(saved as unknown as Json),
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt
      });

    return saved;
  }

  saveDinnerResult(result: DinnerResult): DinnerResult {
    this.db.exec("BEGIN");
    try {
      this.db
        .prepare("INSERT INTO dinner_results (id, payload, created_at) VALUES (?, ?, ?)")
        .run(result.id, stringifyJson(result as unknown as Json), result.createdAt);

      for (const exposure of result.exposureResults) {
        this.updateFoodPreferenceCounters({
          childId: exposure.childProfileId,
          foodName: exposure.foodName,
          outcome: exposure.outcome,
          servedAt: result.servedAt
        });
      }

      if (result.mealId) {
        const meal = this.getMeal(result.mealId);
        if (meal) {
          const updatedMeal: Meal = {
            ...meal,
            lastServedAt: result.servedAt,
            workedWellCount: meal.workedWellCount + (result.workedWell ? 1 : 0),
            updatedAt: nowIso()
          };
          this.saveMeal(updatedMeal);
        }
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return result;
  }

  listDinnerResults(): DinnerResult[] {
    const rows = this.db
      .prepare("SELECT payload FROM dinner_results ORDER BY created_at DESC LIMIT 25")
      .all() as PayloadRow[];
    return rows.map((row) => parseJson<DinnerResult>(row.payload));
  }

  saveShoppingList(list: ShoppingList): ShoppingList {
    this.db
      .prepare(`
        INSERT INTO shopping_lists (id, payload, created_at, updated_at)
        VALUES (@id, @payload, @createdAt, @updatedAt)
        ON CONFLICT(id) DO UPDATE SET
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `)
      .run({
        id: list.id,
        payload: stringifyJson(list as unknown as Json),
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      });
    return list;
  }

  listShoppingLists(): ShoppingList[] {
    const rows = this.db
      .prepare("SELECT payload FROM shopping_lists ORDER BY updated_at DESC")
      .all() as PayloadRow[];
    return rows.map((row) => parseJson<ShoppingList>(row.payload));
  }

  toggleShoppingListItem(listId: string, itemId: string): ShoppingList | null {
    const row = this.db.prepare("SELECT payload FROM shopping_lists WHERE id = ?").get(listId) as
      | PayloadRow
      | undefined;
    if (!row) return null;

    const list = parseJson<ShoppingList>(row.payload);
    const updated: ShoppingList = {
      ...list,
      updatedAt: nowIso(),
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      )
    };
    return this.saveShoppingList(updated);
  }

  private hydrateChild(row: ChildRow): ChildProfile {
    const preferences = this.db
      .prepare("SELECT * FROM food_preferences WHERE child_id = ? ORDER BY food_name")
      .all(row.id) as FoodPreferenceRow[];

    return {
      id: row.id,
      name: row.name,
      age: row.age,
      notes: row.notes,
      isArchived: Boolean(row.is_archived),
      defaultPlatingPreference: row.default_plating_preference as ChildProfile["defaultPlatingPreference"],
      allergiesOrRestrictions: parseJson<string[]>(row.allergies_or_restrictions),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      foodPreferences: preferences.map((preference) => ({
        id: preference.id,
        childId: preference.child_id,
        foodName: preference.food_name,
        status: preference.status as FoodPreference["status"],
        tags: parseJson<FoodPreference["tags"]>(preference.tags),
        acceptedFormats: parseJson<string[]>(preference.accepted_formats),
        rejectedFormats: parseJson<string[]>(preference.rejected_formats),
        notes: preference.notes,
        isSafeFallback: Boolean(preference.is_safe_fallback),
        isHardNo: Boolean(preference.is_hard_no),
        lastOfferedAt: preference.last_offered_at,
        lastOutcome: preference.last_outcome as FoodPreference["lastOutcome"],
        exposureCount: preference.exposure_count,
        acceptedCount: preference.accepted_count,
        refusedCount: preference.refused_count,
        createdAt: preference.created_at,
        updatedAt: preference.updated_at
      }))
    };
  }
}

type ChildRow = {
  id: string;
  name: string;
  age: number | null;
  notes: string;
  is_archived: number;
  default_plating_preference: string;
  allergies_or_restrictions: string;
  created_at: string;
  updated_at: string;
};

type FoodPreferenceRow = {
  id: string;
  child_id: string;
  food_name: string;
  status: string;
  tags: string;
  accepted_formats: string;
  rejected_formats: string;
  notes: string;
  is_safe_fallback: number;
  is_hard_no: number;
  last_offered_at: string | null;
  last_outcome: string | null;
  exposure_count: number;
  accepted_count: number;
  refused_count: number;
  created_at: string;
  updated_at: string;
};

type PayloadRow = {
  payload: string;
};
