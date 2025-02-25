import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, LogOut } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [newSkill, setNewSkill] = useState({ name: "", progress: 0 });
  const [newGoal, setNewGoal] = useState({ title: "", description: "" });

  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills"],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["/api/goals"],
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skill: typeof newSkill) => {
      const res = await apiRequest("POST", "/api/skills", skill);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setNewSkill({ name: "", progress: 0 });
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: async ({
      id,
      progress,
    }: {
      id: number;
      progress: number;
    }) => {
      const res = await apiRequest("PATCH", `/api/skills/${id}`, { progress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goal: typeof newGoal) => {
      const res = await apiRequest("POST", "/api/goals", goal);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewGoal({ title: "", description: "" });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">GoalBridgeAI</h1>
          <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[300px,1fr] gap-8">
          <aside>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback>
                      {user?.fullName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{user?.fullName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {user?.currentPosition}
                  </p>
                  <p className="mt-4 text-sm">{user?.bio}</p>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Skills</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Skill</DialogTitle>
                      <DialogDescription>
                        Track a new skill and your progress in it
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addSkillMutation.mutate(newSkill);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="skill-name">Skill Name</Label>
                        <Input
                          id="skill-name"
                          value={newSkill.name}
                          onChange={(e) =>
                            setNewSkill({ ...newSkill, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="skill-progress">Initial Progress (%)</Label>
                        <Input
                          id="skill-progress"
                          type="number"
                          min="0"
                          max="100"
                          value={newSkill.progress}
                          onChange={(e) =>
                            setNewSkill({
                              ...newSkill,
                              progress: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Skill
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {skills.map((skill) => (
                  <Card key={skill.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{skill.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSkillMutation.mutate(skill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={skill.progress}
                        onChange={(e) =>
                          updateSkillMutation.mutate({
                            id: skill.id,
                            progress: parseInt(e.target.value),
                          })
                        }
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Career Goals</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Career Goal</DialogTitle>
                      <DialogDescription>
                        Define a new career goal and get AI-generated tasks
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addGoalMutation.mutate(newGoal);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="goal-title">Goal Title</Label>
                        <Input
                          id="goal-title"
                          value={newGoal.title}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="goal-description">Description</Label>
                        <Textarea
                          id="goal-description"
                          value={newGoal.description}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Goal
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {goals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{goal.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>{goal.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium mb-2">AI-Generated Tasks:</h4>
                      <ul className="space-y-2">
                        {goal.tasks.map((task: any) => (
                          <li
                            key={task.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              readOnly
                            />
                            <span>{task.title}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
