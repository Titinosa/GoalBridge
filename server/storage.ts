import { User, Skill, CareerGoal, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Helper to create a proper password hash in the same format as auth.ts
async function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

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
    this.currentId = 2; // Start from 2 since we have one hardcoded user
    this.currentSkillId = 3; // Start from 3 since we have two hardcoded skills
    this.currentGoalId = 2; // Start from 2 since we have one hardcoded goal
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize demo data
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Create a proper password hash for the demo user
    const passwordHash = await createPasswordHash("demo123");

    // Add a demo user with some initial data
    const demoUser: User = {
      id: 1,
      username: "demo",
      password: passwordHash,
      fullName: "Demo User",
      currentPosition: "Software Developer",
      bio: "Passionate about learning and growing in tech",
      avatarUrl: null,
    };
    this.users.set(demoUser.id, demoUser);

    // Add some demo skills
    const demoSkills: Skill[] = [
      { id: 1, userId: 1, name: "React", progress: 75 },
      { id: 2, userId: 1, name: "TypeScript", progress: 60 },
    ];
    demoSkills.forEach(skill => this.skills.set(skill.id, skill));

    // Add a demo goal
    const demoGoal: CareerGoal = {
      id: 1,
      userId: 1,
      title: "Learn Advanced React Patterns",
      description: "Master advanced React concepts and design patterns",
      completed: false,
      tasks: [
        { id: 1, title: "Study React hooks in depth", completed: true },
        { id: 2, title: "Learn about React Context", completed: false },
        { id: 3, title: "Practice custom hooks", completed: false },
      ],
    };
    this.goals.set(demoGoal.id, demoGoal);
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