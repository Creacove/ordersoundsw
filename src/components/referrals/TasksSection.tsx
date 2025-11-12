import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { useDailyTasks } from "@/hooks/useDailyTasks";
import { TaskSubmissionDialog } from "./TaskSubmissionDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const TasksSection = () => {
  const { tasks, isLoading, submitTask, isSubmitting } = useDailyTasks();
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <Card className="p-6 mb-8">
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Daily Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Complete tasks to earn additional points
          </p>
        </div>

        <div className="space-y-3">
          {tasks?.map((task) => {
            const submission = task.submission;
            const isPending = submission?.status === 'pending';
            const isApproved = submission?.status === 'approved';
            const isRejected = submission?.status === 'rejected';

            return (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                {/* Task Info Section */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {isApproved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm sm:text-base">{task.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        +{task.points} pts
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons Section */}
                {!submission && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                    {task.action_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full sm:w-auto justify-center text-muted-foreground hover:text-foreground min-h-[44px] sm:min-h-[36px]"
                        onClick={() => {
                          const url = task.action_url.match(/^https?:\/\//) 
                            ? task.action_url 
                            : `https://${task.action_url}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Go to Task
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto justify-center min-h-[44px] sm:min-h-[36px]"
                      onClick={() => setSelectedTask({ id: task.id, title: task.title })}
                    >
                      Complete
                    </Button>
                  </div>
                )}

                {/* Status Badges Section */}
                {isPending && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-600/20 w-full sm:w-auto justify-center py-2 sm:py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    Under Review
                  </Badge>
                )}

                {isApproved && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/20 w-full sm:w-auto justify-center py-2 sm:py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}

                {isRejected && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto justify-center text-orange-600 border-orange-600/20 hover:bg-orange-500/10 min-h-[44px] sm:min-h-[36px]"
                          onClick={() => setSelectedTask({ id: task.id, title: task.title })}
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Try Again
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{submission.admin_notes || 'Submission was rejected'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {selectedTask && (
        <TaskSubmissionDialog
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          onSubmit={(screenshotUrl) => {
            submitTask({ taskId: selectedTask.id, screenshotUrl });
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
};
