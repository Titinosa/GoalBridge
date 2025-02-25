import { User, Skill, CareerGoal, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private goals: Map<number, CareerGoal>;
  currentId: number;
  currentSkillId: number;
  currentGoalId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.goals = new Map();
    this.currentId = 1;
    this.currentSkillId = 1;
    this.currentGoalId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUserSkills(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.userId === userId,
    );
  }

  async createSkill(userId: number, skill: { name: string; progress: number }): Promise<Skill> {
    const id = this.currentSkillId++;
    const newSkill: Skill = { id, userId, ...skill };
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async updateSkill(skillId: number, progress: number): Promise<Skill> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error("Skill not found");
    const updatedSkill = { ...skill, progress };
    this.skills.set(skillId, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(skillId: number): Promise<void> {
    this.skills.delete(skillId);
  }

  async getUserGoals(userId: number): Promise<CareerGoal[]> {
    return Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId,
    );
  }

  async createGoal(userId: number, goal: { title: string; description: string }): Promise<CareerGoal> {
    const id = this.currentGoalId++;
    const newGoal: CareerGoal = {
      id,
      userId,
      ...goal,
      completed: false,
      tasks: [],
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(goalId: number, tasks: any[]): Promise<CareerGoal> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error("Goal not found");
    const updatedGoal = { ...goal, tasks };
    this.goals.set(goalId, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(goalId: number): Promise<void> {
    this.goals.delete(goalId);
  }
}

export const storage = new MemStorage();
