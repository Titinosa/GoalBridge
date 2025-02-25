import { User, Skill, CareerGoal, Project, InsertUser } from "@shared/schema";
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
  createSkill(userId: number, skill: { name: string; progress: number; level: number }): Promise<Skill>;
  updateSkillProgress(skillId: number, taskCompleted: boolean): Promise<Skill>;
  deleteSkill(skillId: number): Promise<void>;
  getUserGoals(userId: number): Promise<CareerGoal[]>;
  createGoal(userId: number, goal: { title: string; description: string }): Promise<CareerGoal>;
  updateGoal(goalId: number, tasks: any[]): Promise<CareerGoal>;
  deleteGoal(goalId: number): Promise<void>;
  // New project methods
  getUserProjects(userId: number): Promise<Project[]>;
  getProjectByGoal(goalId: number): Promise<Project | undefined>;
  createProject(userId: number, goalId: number, project: { title: string; description: string }): Promise<Project>;
  updateProjectContext(projectId: number, context: string): Promise<Project>;
  updateProjectTask(projectId: number, taskId: number, completed: boolean): Promise<Project>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private goals: Map<number, CareerGoal>;
  private projects: Map<number, Project>;
  currentId: number;
  currentSkillId: number;
  currentGoalId: number;
  currentProjectId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.goals = new Map();
    this.projects = new Map();
    this.currentId = 2; 
    this.currentSkillId = 3; 
    this.currentGoalId = 2; 
    this.currentProjectId = 2; 
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.initializeDemoData();
  }

  private async initializeDemoData() {
    const passwordHash = await createPasswordHash("demo123");

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

    const demoSkills: Skill[] = [
      { id: 1, userId: 1, name: "React", progress: 75, level: 2 },
      { id: 2, userId: 1, name: "TypeScript", progress: 60, level: 1 },
    ];
    demoSkills.forEach(skill => this.skills.set(skill.id, skill));

    const demoGoal: CareerGoal = {
      id: 1,
      userId: 1,
      title: "Learn Advanced React Patterns",
      description: "Master advanced React concepts and design patterns",
      completed: false,
      tasks: [
        { id: 1, title: "Study React hooks in depth", completed: true, relatedSkills: ["React"] },
        { id: 2, title: "Learn about React Context", completed: false, relatedSkills: ["React"] },
        { id: 3, title: "Practice TypeScript with hooks", completed: false, relatedSkills: ["React", "TypeScript"] },
      ],
    };
    this.goals.set(demoGoal.id, demoGoal);

    const demoProject: Project = {
      id: 1,
      goalId: 1,
      userId: 1,
      title: "Build a Custom Hook Library",
      description: "Create a collection of reusable React hooks",
      context: "Working on a project that needs state management and data fetching patterns",
      tasks: [
        { id: 1, title: "Create useLocalStorage hook", completed: false, skillName: "React" },
        { id: 2, title: "Implement useFetch with TypeScript", completed: false, skillName: "TypeScript" },
        { id: 3, title: "Add useAsync hook for async operations", completed: false, skillName: "React" },
      ],
    };
    this.projects.set(demoProject.id, demoProject);
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

  async createSkill(userId: number, skill: { name: string; progress: number; level: number }): Promise<Skill> {
    const id = this.currentSkillId++;
    const newSkill: Skill = { id, userId, ...skill };
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async updateSkillProgress(skillId: number, taskCompleted: boolean): Promise<Skill> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error("Skill not found");

    let newProgress = skill.progress + (taskCompleted ? 10 : -10);
    newProgress = Math.max(0, Math.min(100, newProgress));
    let newLevel = skill.level;
    if (newProgress >= 100) {
      newLevel++;
      newProgress = 0;
    }
    const updatedSkill = { ...skill, progress: newProgress, level: newLevel };
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

  async getUserProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }

  async getProjectByGoal(goalId: number): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(
      (project) => project.goalId === goalId,
    );
  }

  async createProject(
    userId: number,
    goalId: number,
    project: { title: string; description: string },
  ): Promise<Project> {
    const id = this.currentProjectId++;
    const newProject: Project = {
      id,
      userId,
      goalId,
      ...project,
      context: "",
      tasks: [
        { id: 1, title: "Research and planning", completed: false, skillName: "Planning" },
        { id: 2, title: "Initial implementation", completed: false, skillName: "Development" },
        { id: 3, title: "Testing and refinement", completed: false, skillName: "Testing" },
      ],
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProjectContext(projectId: number, context: string): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const updatedProject = { ...project, context };
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }

  async updateProjectTask(projectId: number, taskId: number, completed: boolean): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, completed } : task
    );

    const updatedProject = { ...project, tasks: updatedTasks };
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
}

export const storage = new MemStorage();