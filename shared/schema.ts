import { z } from "zod";

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  fullName: z.string(),
  currentPosition: z.string().nullish(),
  bio: z.string().nullish(),
  avatarUrl: z.string().nullish(),
});

export const insertSkillSchema = z.object({
  name: z.string(),
  progress: z.number().min(0).max(100),
  level: z.number().default(1),
});

export const insertCareerGoalSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface User extends InsertUser {
  id: number;
}

export interface Skill {
  id: number;
  userId: number;
  name: string;
  progress: number;
  level: number;
  completedTasks: string[]; // Array of taskIds that have contributed to progress
}

export interface CareerGoal {
  id: number;
  userId: number;
  title: string;
  description: string;
  completed: boolean;
  tasks: Array<{
    id: number;
    title: string;
    completed: boolean;
    relatedSkills?: string[]; // Skills that this task helps improve
  }>;
}

export interface Project {
  id: number;
  goalId: number;
  userId: number;
  title: string;
  description: string;
  context: string; // Additional context that can be edited
  tasks: Array<{
    id: number;
    title: string;
    completed: boolean;
    skillName: string; // The skill this task helps improve 
  }>;
}