import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileAudio, Upload, X, GripVertical, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type SoundFileMeta = {
  id: string;
  name: string;
  size: number;
  duration: number | null;
  uploadProgress?: number;
};

type SoundpackFilesUploadProps = {
  soundFiles: File[];
  soundFilesMeta: SoundFileMeta[];
  onFilesAdd: (files: FileList) => void;
  onFileRemove: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  onFilesReorder: (fromIndex: number, toIndex: number) => void;
  onClearAll: () => void;
  uploadProgress?: { [key: string]: number };
};

export const SoundpackFilesUpload = ({
  soundFiles,
  soundFilesMeta,
  onFilesAdd,
  onFileRemove,
  onFileRename,
  onFilesReorder,
  onClearAll,
  uploadProgress = {}
}: SoundpackFilesUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdd(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdd(e.target.files);
    }
  };

  const startEditing = (file: SoundFileMeta) => {
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const saveEdit = (id: string) => {
    if (editingName.trim()) {
      onFileRename(id, editingName.trim());
    }
    setEditingFileId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingFileId(null);
    setEditingName("");
  };

  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    onFilesReorder(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalSize = (): string => {
    const total = soundFilesMeta.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  };

  const getTotalDuration = (): string => {
    const total = soundFilesMeta.reduce((sum, file) => sum + (file.duration || 0), 0);
    return formatDuration(total);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-1">Soundpack Files *</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload up to 50 audio files (MP3/WAV). Maximum 500MB total.
        </p>
        
        {/* Upload Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50",
            soundFilesMeta.length >= 50 && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => soundFilesMeta.length < 50 && fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium mb-1">
            {soundFilesMeta.length >= 50 ? "Maximum files reached" : "Drop audio files here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            {soundFilesMeta.length >= 50 
              ? "You've reached the maximum of 50 files"
              : `MP3 or WAV files • ${soundFilesMeta.length}/50 files • ${getTotalSize()} total`
            }
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="audio/mp3,audio/wav,audio/mpeg"
            multiple
            onChange={handleFileSelect}
            disabled={soundFilesMeta.length >= 50}
          />
        </div>
      </div>

      {/* Files List */}
      {soundFilesMeta.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h4 className="text-sm font-medium">
                {soundFilesMeta.length} file{soundFilesMeta.length !== 1 ? 's' : ''}
              </h4>
              <span className="text-xs text-muted-foreground">
                {getTotalSize()} • {getTotalDuration()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Clear All
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {soundFilesMeta.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, index)}
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDragEnd={handleItemDragEnd}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors",
                    draggedIndex === index && "opacity-50",
                    "hover:bg-accent cursor-move"
                  )}
                >
                  <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
                  <FileAudio size={20} className="text-primary flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    {editingFileId === file.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(file.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => saveEdit(file.id)} className="h-7 px-2">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 px-2">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <button
                            onClick={() => startEditing(file)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          {file.duration && <span>{formatDuration(file.duration)}</span>}
                        </div>
                      </>
                    )}
                    
                    {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                      <div className="mt-2">
                        <Progress value={file.uploadProgress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading: {file.uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(file.id)}
                    className="text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};