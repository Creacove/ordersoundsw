import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface TaskSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  onSubmit: (screenshotUrl: string) => void;
  isSubmitting: boolean;
}

export const TaskSubmissionDialog = ({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  onSubmit,
  isSubmitting,
}: TaskSubmissionDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileName = `${user.id}/${taskId}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-screenshots')
        .getPublicUrl(uploadData.path);

      // Submit task
      onSubmit(publicUrl);
      
      // Reset form
      setFile(null);
      setPreview(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Task: {taskTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="screenshot">Upload Screenshot</Label>
            <div className="mt-2">
              {!preview ? (
                <label
                  htmlFor="screenshot"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG (max 5MB)</span>
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || uploading || isSubmitting}
              className="flex-1"
            >
              {uploading || isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
