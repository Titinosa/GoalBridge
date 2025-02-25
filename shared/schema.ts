import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  currentPosition: text("current_position"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  progress: integer("progress").notNull().default(0),
});

export const careerGoals = pgTable("career_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  tasks: jsonb("tasks").notNull().default([]),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  currentPosition: true,
  bio: true,
  avatarUrl: true,
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  name: true,
  progress: true,
});

export const insertCareerGoalSchema = createInsertSchema(careerGoals).pick({
  title: true,
  description: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type CareerGoal = typeof careerGoals.$inferSelect;
