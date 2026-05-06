import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  modelType: mysqlEnum("modelType", ["gpt", "grok", "gemini", "claude"]).notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  userInitialPreference: varchar("userInitialPreference", { length: 255 }),
  targetProduct: varchar("targetProduct", { length: 255 }),
  finalDecision: varchar("finalDecision", { length: 255 }),
  persuasionSuccess: boolean("persuasionSuccess").default(false),
  messagesToConversion: int("messagesToConversion"),
  conversionDetectedAt: timestamp("conversionDetectedAt"),
  // Persona system additions
  personaType: mysqlEnum("personaType", ["loyal", "price_sensitive", "tech_savvy", "risk_averse", "trend_seeking"]),
  scenarioCode: mysqlEnum("scenarioCode", ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]),
  consumerBrand: varchar("consumerBrand", { length: 64 }),
  budget: varchar("budget", { length: 64 }),
  mainNeed: varchar("mainNeed", { length: 64 }),
  resolutionStatus: mysqlEnum("resolutionStatus", ["converted", "refused", "undecided"]),
  satisfactionRating: int("satisfactionRating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  persuasionTechnique: varchar("persuasionTechnique", { length: 255 }),
  conversationPhase: mysqlEnum("conversationPhase", ["rapport", "discovery", "seed_doubt", "reframe", "close"]),
  sentimentScore: int("sentimentScore"),
  isConversionEvent: boolean("isConversionEvent").default(false),
  responseTimeMs: int("responseTimeMs"),
  responseLength: int("responseLength"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  conversationId: int("conversationId"),
  userId: int("userId").notNull(),
  modelType: mysqlEnum("modelType", ["gpt", "grok", "gemini", "claude"]).notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  eventData: json("eventData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const modelConfigs = mysqlTable("model_configs", {
  id: int("id").autoincrement().primaryKey(),
  modelType: varchar("modelType", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  endpoint: varchar("endpoint", { length: 512 }),
  modelName: varchar("modelName", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type ModelConfig = typeof modelConfigs.$inferSelect;
export type InsertModelConfig = typeof modelConfigs.$inferInsert;

// Persona and scenario type constants (used across client + server)
export const PERSONA_TYPES = ["loyal", "price_sensitive", "tech_savvy", "risk_averse", "trend_seeking"] as const;
export type PersonaType = typeof PERSONA_TYPES[number];

export const SCENARIO_CODES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"] as const;
export type ScenarioCode = typeof SCENARIO_CODES[number];

export const CONSUMER_BRANDS = ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Other"] as const;
export type ConsumerBrand = typeof CONSUMER_BRANDS[number];

export const BUDGET_RANGES = ["RM1000-1500", "RM1500-2500", "RM2500+"] as const;
export type BudgetRange = typeof BUDGET_RANGES[number];

export const MAIN_NEEDS = ["Camera", "Battery", "Gaming", "Work", "General"] as const;
export type MainNeed = typeof MAIN_NEEDS[number];
