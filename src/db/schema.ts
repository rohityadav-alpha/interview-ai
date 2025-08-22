import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  text,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

// ✅ Keep existing leaderboard table structure
export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 255 }).notNull(),
  user_email: varchar("user_email", { length: 255 }),
  user_first_name: varchar("user_first_name", { length: 255 }),
  user_last_name: varchar("user_last_name", { length: 255 }),
  user_username: varchar("user_username", { length: 255 }),
  skill: varchar("skill", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { length: 50 }).notNull(),
  total_score: integer("total_score").notNull(),
  avg_score: numeric("avg_score", { precision: 4, scale: 2 }).notNull(),
  questions_attempted: integer("questions_attempted").default(0),
  is_completed: boolean("is_completed").default(false),
  quit_reason: varchar("quit_reason", { length: 255 }),
  interview_duration: integer("interview_duration").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ✅ Keep existing interview_responses table structure
export const interview_responses = pgTable("interview_responses", {
  id: serial("id").primaryKey(),
  interview_id: integer("interview_id").notNull(),
  user_id: varchar("user_id", { length: 255 }).notNull(),
  question_number: integer("question_number").notNull(),
  question_text: text("question_text").notNull(),
  user_answer: text("user_answer").default(""),
  ai_score: integer("ai_score"),
  ai_feedback: text("ai_feedback"),
  confidence: varchar("confidence", { length: 20 }).default("medium"),
  response_time: integer("response_time").default(0),
  created_at: timestamp("created_at").defaultNow(),
  improvements: text("improvements"),
  confidence_tips: text("confidence_tips"),
  final_score: integer("final_score").default(0),
  avg_score: numeric("avg_score", { precision: 4, scale: 2 }).notNull(),
  skills: text("skills").default(""),
  user_first_name: varchar("user_first_name", { length: 255 }),
  user_last_name: varchar("user_last_name", { length: 255 }),
  user_email: varchar("user_email", { length: 255 }),
});

// ✅ Add attempts table (optional - for new workflow)
