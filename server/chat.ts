import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to format skills for chat context
function formatSkills(skills: any[]) {
  return skills.map(s => 
    `${s.name}: Level ${s.level} (${s.progress}% progress to next level)`
  ).join('\n');
}

// Helper to format goals and projects
function formatGoalsAndProjects(goals: any[], projects: any[]) {
  const formatted = goals.map(goal => {
    const project = projects.find(p => p.goalId === goal.id);
    return `Goal: ${goal.title}\nDescription: ${goal.description}\n` +
           `Project: ${project?.title || 'No project yet'}\n` +
           `Project Context: ${project?.context || 'No context added'}\n` +
           `Tasks: ${project?.tasks.map((t: any) => 
             `\n- ${t.title} (${t.completed ? 'Completed' : 'Pending'}) - Improves: ${t.skillName}`
           ).join('') || 'No tasks yet'}\n`;
  }).join('\n');
  return formatted;
}

export async function processChatMessage(userId: number, message: string) {
  try {
    // Get current user context
    const skills = await storage.getUserSkills(userId);
    const goals = await storage.getUserGoals(userId);
    const projects = await storage.getUserProjects(userId);

    const systemPrompt = `You are GoalBridgeAI, an intelligent career development assistant. Your role is to help users manage their skills, goals, and projects.

Current User Context:
Skills:
${formatSkills(skills)}

Goals and Projects:
${formatGoalsAndProjects(goals, projects)}

You can:
1. Answer questions about the user's skills, goals, and projects
2. Suggest new goals based on their interests
3. Provide project ideas based on career goals
4. Help track progress and suggest next steps

When suggesting new goals or projects:
- Be specific and actionable
- Break down into bite-sized tasks
- Link tasks to relevant skills
- Consider user's current skill levels
- Suggest a realistic timeline

Please respond with JSON in this format:
{
  "type": "response" | "action",
  "content": string (for responses) or object (for actions),
  "actionType": "createGoal" | "createSkill" | "updateProject" | null,
  "data": object (action parameters if needed)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Handle actions if needed
    if (result.type === "action") {
      switch (result.actionType) {
        case "createGoal":
          const goal = await storage.createGoal(userId, result.data);
          const project = await storage.createProject(userId, goal.id, {
            title: result.data.title,
            description: result.data.description
          });
          return {
            type: "success",
            message: result.content,
            data: { goal, project }
          };

        case "createSkill":
          const skill = await storage.createSkill(userId, {
            name: result.data.name,
            progress: 0,
            level: 1
          });
          return {
            type: "success",
            message: result.content,
            data: { skill }
          };

        case "updateProject":
          const updatedProject = await storage.updateProjectContext(
            result.data.projectId,
            result.data.context
          );
          return {
            type: "success",
            message: result.content,
            data: { project: updatedProject }
          };
      }
    }

    return {
      type: "success",
      message: result.content
    };

  } catch (error) {
    console.error("Chat processing error:", error);
    return {
      type: "error",
      message: "I encountered an error processing your request. Please try again."
    };
  }
}
