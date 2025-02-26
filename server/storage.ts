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
  updateSkillProgress(skillId: number, taskId: string, completed: boolean): Promise<Skill>;
  deleteSkill(skillId: number): Promise<void>;
  getUserGoals(userId: number): Promise<CareerGoal[]>;
  createGoal(userId: number, goal: { title: string; description: string }): Promise<CareerGoal>;
  updateGoal(goalId: number, tasks: any[]): Promise<CareerGoal>;
  deleteGoal(goalId: number): Promise<void>;
  // New project methods
  getUserProjects(userId: number): Promise<Project[]>;
  getProjectByGoal(goalId: number): Promise<Project | undefined>;
  createProject(userId: number, goalId: number, goal: { title: string; description: string }): Promise<Project>;
  updateProjectContext(projectId: number, context: string): Promise<Project>;
  updateProjectTask(projectId: number, taskId: number, completed: boolean): Promise<Project>;
  deleteProject(projectId: number): Promise<void>;
  deleteProjectTask(projectId: number, taskId: number): Promise<Project>;
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
      { id: 1, userId: 1, name: "React", progress: 75, level: 2, completedTasks: [] },
      { id: 2, userId: 1, name: "TypeScript", progress: 60, level: 1, completedTasks: [] },
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
    const newSkill: Skill = { id, userId, ...skill, completedTasks: [] };
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async updateSkillProgress(skillId: number, taskId: string, completed: boolean): Promise<Skill> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error("Skill not found");

    // Only update progress if:
    // 1. Task is being completed AND
    // 2. Task hasn't been counted before
    if (completed && !skill.completedTasks.includes(taskId)) {
      let newProgress = skill.progress + 10;
      let newLevel = skill.level;

      if (newProgress >= 100) {
        newLevel++;
        newProgress = 0;
      }

      const updatedSkill = {
        ...skill,
        progress: newProgress,
        level: newLevel,
        completedTasks: [...skill.completedTasks, taskId]
      };
      this.skills.set(skillId, updatedSkill);
      return updatedSkill;
    }

    // If task is being uncompleted, don't change progress
    return skill;
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

  private generateProjectTasks(goalTitle: string, goalDescription: string): Project['tasks'] {
    // Create more specific and actionable tasks based on the goal
    const commonTasks = [
      { title: "Research best practices and current trends", skillName: "Research" },
      { title: "Create a detailed implementation plan", skillName: "Planning" },
      { title: "Set up development environment and tools", skillName: "Development" },
    ];

    if (goalTitle.toLowerCase().includes("react")) {
      return [
        ...commonTasks,
        { title: "Build reusable component library", skillName: "React" },
        { title: "Implement state management with Context/Redux", skillName: "React" },
        { title: "Create unit tests with React Testing Library", skillName: "Testing" },
      ].map((task, index) => ({ ...task, id: index + 1, completed: false }));
    }

    if (goalTitle.toLowerCase().includes("typescript")) {
      return [
        ...commonTasks,
        { title: "Define core type definitions and interfaces", skillName: "TypeScript" },
        { title: "Implement generic utility types", skillName: "TypeScript" },
        { title: "Add strict type checking to async operations", skillName: "TypeScript" },
      ].map((task, index) => ({ ...task, id: index + 1, completed: false }));
    }

    // Default project structure with planning and execution focus
    return [
      { title: "Research and analyze requirements", skillName: "Research" },
      { title: "Create project timeline and milestones", skillName: "Planning" },
      { title: "Set up development environment", skillName: "Development" },
      { title: "Implement core functionality", skillName: "Development" },
      { title: "Write documentation and tests", skillName: "Documentation" },
    ].map((task, index) => ({ ...task, id: index + 1, completed: false }));
  }

  async createProject(
    userId: number,
    goalId: number,
    goal: { title: string; description: string },
  ): Promise<Project> {
    const id = this.currentProjectId++;

    // Generate a project based on the career goal context
    const projectTitle = `Project: ${goal.title}`;
    const projectDescription =
      `This project is designed to help you achieve your career goal: ${goal.description}. ` +
      `It's structured with bite-sized, actionable tasks that will build your skills progressively over time.`;

    const tasks = this.generateProjectTasks(goal.title, goal.description);

    // Auto-create skills for any new skill mentioned in tasks
    const uniqueSkills = [...new Set(tasks.map(task => task.skillName))];
    for (const skillName of uniqueSkills) {
      const existingSkill = Array.from(this.skills.values()).find(
        s => s.userId === userId && s.name === skillName
      );
      if (!existingSkill) {
        await this.createSkill(userId, {
          name: skillName,
          progress: 0,
          level: 1,
        });
      }
    }

    const newProject: Project = {
      id,
      userId,
      goalId,
      title: projectTitle,
      description: projectDescription,
      context: "",
      tasks,
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

  async deleteProject(projectId: number): Promise<void> {
    this.projects.delete(projectId);
  }

  async deleteProjectTask(projectId: number, taskId: number): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const updatedTasks = project.tasks.filter(task => task.id !== taskId);
    const updatedProject = { ...project, tasks: updatedTasks };
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
}

export const storage = new MemStorage();