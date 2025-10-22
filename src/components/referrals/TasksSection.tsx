import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  actionUrl?: string;
}

// Placeholder tasks - will be connected to backend later
const TASKS: Task[] = [
  {
    id: "follow-twitter",
    title: "Follow us on X (Twitter)",
    description: "Stay updated with our latest beats and features",
    points: 5,
    completed: false,
    actionUrl: "https://x.com/ordersounds"
  },
  {
    id: "join-discord",
    title: "Join our Discord community",
    description: "Connect with producers and buyers worldwide",
    points: 10,
    completed: false,
    actionUrl: "https://discord.gg/ordersounds"
  },
  {
    id: "like-post",
    title: "Like our latest post",
    description: "Show some love on our social media",
    points: 3,
    completed: false,
    actionUrl: "https://x.com/ordersounds"
  },
  {
    id: "complete-profile",
    title: "Complete your profile",
    description: "Add a bio and profile picture",
    points: 15,
    completed: false
  }
];

export const TasksSection = () => {
  return (
    <Card className="p-6 mb-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Daily Tasks</h3>
        <p className="text-sm text-muted-foreground">
          Complete tasks to earn additional points
        </p>
      </div>

      <div className="space-y-3">
        {TASKS.map((task) => (
          <div 
            key={task.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    +{task.points} pts
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            </div>

            {!task.completed && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 ml-4"
                onClick={() => {
                  if (task.actionUrl) {
                    window.open(task.actionUrl, '_blank');
                  }
                }}
              >
                {task.actionUrl ? (
                  <>
                    Go <ExternalLink className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  "Complete"
                )}
              </Button>
            )}
            
            {task.completed && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/20 ml-4">
                Completed
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
