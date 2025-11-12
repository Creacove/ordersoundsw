import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminTasks } from "@/hooks/useDailyTasks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const TaskManagement = () => {
  const {
    pendingSubmissions,
    isLoading,
    createTask,
    isCreating,
    awardPoints,
    isAwarding,
    rejectSubmission,
    isRejecting,
  } = useAdminTasks();

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    points: 0,
    action_url: "",
    frequency: "once",
  });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    submissionId: string;
    notes: string;
  }>({
    open: false,
    submissionId: "",
    notes: "",
  });

  const [imagePreview, setImagePreview] = useState<{
    open: boolean;
    url: string;
  }>({
    open: false,
    url: "",
  });

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description || newTask.points <= 0) {
      return;
    }
    createTask(newTask);
    setNewTask({ title: "", description: "", points: 0, action_url: "", frequency: "once" });
  };

  const handleReject = () => {
    if (rejectDialog.submissionId) {
      rejectSubmission({
        submissionId: rejectDialog.submissionId,
        notes: rejectDialog.notes,
      });
      setRejectDialog({ open: false, submissionId: "", notes: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Task Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Follow us on Twitter"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Stay updated with our latest beats and features"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={newTask.points || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, points: parseInt(e.target.value) || 0 })
                  }
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newTask.frequency}
                  onValueChange={(value) => setNewTask({ ...newTask, frequency: value })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action_url">Action URL (Optional)</Label>
                <Input
                  id="action_url"
                  value={newTask.action_url}
                  onChange={(e) => setNewTask({ ...newTask, action_url: e.target.value })}
                  placeholder="https://x.com/ordersounds"
                />
              </div>
            </div>
            <Button onClick={handleCreateTask} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Submissions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Submissions ({pendingSubmissions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !pendingSubmissions || pendingSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending submissions
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Screenshot</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.user?.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {submission.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.task?.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">+{submission.task?.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setImagePreview({ open: true, url: submission.screenshot_url })
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(submission.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => awardPoints(submission.id)}
                          disabled={isAwarding}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRejectDialog({
                              open: true,
                              submissionId: submission.id,
                              notes: "",
                            })
                          }
                          disabled={isRejecting}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, submissionId: "", notes: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-notes">Reason for rejection</Label>
            <Textarea
              id="reject-notes"
              value={rejectDialog.notes}
              onChange={(e) =>
                setRejectDialog({ ...rejectDialog, notes: e.target.value })
              }
              placeholder="Please provide a reason for rejection..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, submissionId: "", notes: "" })}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={!rejectDialog.notes}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreview.open} onOpenChange={(open) => !open && setImagePreview({ open: false, url: "" })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Screenshot Preview</DialogTitle>
          </DialogHeader>
          <img
            src={imagePreview.url}
            alt="Task screenshot"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
