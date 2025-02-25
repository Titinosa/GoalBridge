import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/chat", { message: input });
      const result = await response.json();

      // Add assistant's response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: result.message,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // If there was an action that modified data, invalidate relevant queries
      if (result.type === "success" && result.data) {
        if (result.data.goal) queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
        if (result.data.project) queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        if (result.data.skill) queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-[400px] h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">GoalBridge Assistant</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.sender === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%]",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </CardContent>
          <form
            onSubmit={handleSubmit}
            className="border-t p-4 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}