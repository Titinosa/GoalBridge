import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSkillSchema, insertCareerGoalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Skills routes
  app.get("/api/skills", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const skills = await storage.getUserSkills(req.user.id);
    res.json(skills);
  });

  app.post("/api/skills", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertSkillSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const skill = await storage.createSkill(req.user.id, parsed.data);
    res.json(skill);
  });

  app.patch("/api/skills/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const skill = await storage.updateSkill(
      parseInt(req.params.id),
      req.body.progress
    );
    res.json(skill);
  });

  app.delete("/api/skills/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteSkill(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Career goals routes
  app.get("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const goals = await storage.getUserGoals(req.user.id);
    res.json(goals);
  });

  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertCareerGoalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const goal = await storage.createGoal(req.user.id, parsed.data);

    // Mock AI project generation
    const tasks = [
      { id: 1, title: "Research industry trends", completed: false },
      { id: 2, title: "Identify key skills needed", completed: false },
      { id: 3, title: "Create learning roadmap", completed: false },
      { id: 4, title: "Set milestone deadlines", completed: false },
    ];

    const updatedGoal = await storage.updateGoal(goal.id, tasks);
    res.json(updatedGoal);
  });

  app.delete("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteGoal(parseInt(req.params.id));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
