import { db } from "./db";
import { users, type User, type InsertUser, skills, type Skill, careerGoals, type CareerGoal } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserSkills(userId: number): Promise<Skill[]>;
  createSkill(userId: number, skill: { name: string; progress: number }): Promise<Skill>;
  updateSkill(skillId: number, progress: number): Promise<Skill>;
  deleteSkill(skillId: number): Promise<void>;
  getUserGoals(userId: number): Promise<CareerGoal[]>;
  createGoal(userId: number, goal: { title: string; description: string }): Promise<CareerGoal>;
  updateGoal(goalId: number, tasks: any[]): Promise<CareerGoal>;
  deleteGoal(goalId: number): Promise<void>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserSkills(userId: number): Promise<Skill[]> {
    return await db.select().from(skills).where(eq(skills.userId, userId));
  }

  async createSkill(userId: number, skill: { name: string; progress: number }): Promise<Skill> {
    const [newSkill] = await db
      .insert(skills)
      .values({ userId, ...skill })
      .returning();
    return newSkill;
  }

  async updateSkill(skillId: number, progress: number): Promise<Skill> {
    const [skill] = await db
      .update(skills)
      .set({ progress })
      .where(eq(skills.id, skillId))
      .returning();
    if (!skill) throw new Error("Skill not found");
    return skill;
  }

  async deleteSkill(skillId: number): Promise<void> {
    await db.delete(skills).where(eq(skills.id, skillId));
  }

  async getUserGoals(userId: number): Promise<CareerGoal[]> {
    return await db.select().from(careerGoals).where(eq(careerGoals.userId, userId));
  }

  async createGoal(userId: number, goal: { title: string; description: string }): Promise<CareerGoal> {
    const [newGoal] = await db
      .insert(careerGoals)
      .values({
        userId,
        ...goal,
        completed: false,
        tasks: [],
      })
      .returning();
    return newGoal;
  }

  async updateGoal(goalId: number, tasks: any[]): Promise<CareerGoal> {
    const [goal] = await db
      .update(careerGoals)
      .set({ tasks })
      .where(eq(careerGoals.id, goalId))
      .returning();
    if (!goal) throw new Error("Goal not found");
    return goal;
  }

  async deleteGoal(goalId: number): Promise<void> {
    await db.delete(careerGoals).where(eq(careerGoals.id, goalId));
  }
}

export const storage = new DatabaseStorage();