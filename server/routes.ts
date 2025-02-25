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
    const skill = await storage.updateSkillProgress(
      parseInt(req.params.id),
      req.body.taskId,
      req.body.completed
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
    const project = await storage.createProject(req.user.id, goal.id, {
      title: goal.title,
      description: goal.description,
    });

    // Get updated skills after project creation
    const skills = await storage.getUserSkills(req.user.id);

    res.json({ goal, project, skills });
  });

  app.delete("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteGoal(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const projects = await storage.getUserProjects(req.user.id);
    res.json(projects);
  });

  app.get("/api/goals/:goalId/project", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const project = await storage.getProjectByGoal(parseInt(req.params.goalId));
    if (!project) return res.sendStatus(404);
    res.json(project);
  });

  app.patch("/api/projects/:id/context", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const project = await storage.updateProjectContext(
      parseInt(req.params.id),
      req.body.context
    );
    res.json(project);
  });

  app.patch("/api/projects/:id/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const project = await storage.updateProjectTask(
      parseInt(req.params.id),
      parseInt(req.params.taskId),
      req.body.completed
    );

    // If task was completed, update related skill progress
    if (req.body.completed) {
      const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
      if (task) {
        const skills = await storage.getUserSkills(req.user.id);
        const relatedSkill = skills.find(s => s.name === task.skillName);
        if (relatedSkill) {
          await storage.updateSkillProgress(
            relatedSkill.id,
            `${project.id}-${task.id}`, // Use unique task identifier
            true
          );
        }
      }
    }

    res.json(project);
  });

  // Add new routes for project and task deletion
  app.delete("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteProject(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.delete("/api/projects/:id/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const project = await storage.deleteProjectTask(
      parseInt(req.params.id),
      parseInt(req.params.taskId)
    );
    res.json(project);
  });


  const httpServer = createServer(app);
  return httpServer;
}