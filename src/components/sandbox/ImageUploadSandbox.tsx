import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface for the state of each uploaded image
interface UploadedImage {
  url: string;
  publicUrl: string; // The URL for the <img> tag
  filename: string;
  size: number;
  uploadedAt: Date;
}

export const ImageUpload = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generates a unique filename to prevent overwriting files in the bucket
  const generateUniqueFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || 'tmp';
    return `sandbox-${timestamp}-${random}.${extension}`;
  };

  // Validates the file before uploading
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file.';
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  // --- The Core Upload Function ---
  const uploadImage = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // --- CRUCIAL DEBUGGING STEP ---
    // Check your browser console for this output when you upload.
    console.log('--- DEBUGGING FILE UPLOAD ---');
    console.log('File Object:', file);
    console.log('File.type property:', file.type); // This should be 'image/jpeg', 'image/png', etc.
    // ------------------------------------

    setIsUploading(true);
    setUploadProgress(0);

    const filename = generateUniqueFilename(file.name);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase Storage, letting the library auto-detect content type
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        toast.error(`Upload failed: ${uploadError.message}`);
        throw uploadError;
      }

      // Get the public URL for the newly uploaded file
      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(uploadData.path);

      if (!urlData.publicUrl) {
          throw new Error("Could not get public URL for the image.");
      }

      const newImage: UploadedImage = {
        url: urlData.publicUrl,
        publicUrl: `${urlData.publicUrl}?t=${new Date().getTime()}`, // Add timestamp to break cache
        filename: filename,
        size: file.size,
        uploadedAt: new Date(),
      };

      setUploadedImages(prev => [newImage, ...prev]);
      toast.success('Image uploaded successfully!');

    } catch (error) {
      console.error('An exception occurred during upload:', error);
      toast.error('Upload failed. Please check the console for details.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // --- Enhanced Remove Function ---
  const removeImage = async (imageToRemove: UploadedImage, index: number) => {
    // Optimistically remove from UI
    setUploadedImages(prev => prev.filter((_, i) => i !== index));

    try {
        // Attempt to remove from Supabase Storage
        const { error } = await supabase.storage
            .from('covers')
            .remove([imageToRemove.filename]);
        
        if (error) {
            toast.error(`Failed to delete from storage: ${error.message}`);
            // Optional: Add the image back to the list if deletion fails
        } else {
            toast.success('Image removed from storage.');
        }
    } catch (err) {
        toast.error('An error occurred while deleting the image.');
    }
  };

  // --- Event Handlers ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && !isUploading) {
      uploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Helper to format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isUploading
                ? 'border-primary bg-primary/5 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary hover:bg-primary/5 cursor-pointer'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Uploading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your image here or click to browse</p>
                </div>
                <Button variant="outline" className="mt-4 pointer-events-none">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Image
                </Button>
                <p className="text-xs text-muted-foreground pt-2">
                  Supports PNG, JPEG, GIF, WebP • Max 5MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images List */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Uploaded Images ({uploadedImages.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-1">
            {uploadedImages.map((image, index) => (
              <Card key={image.filename} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <img
                      src={image.publicUrl}
                      alt={`Preview of ${image.filename}`}
                      className="w-full md:w-32 h-32 object-cover rounded-lg border bg-gray-100"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/128?text=Error'; }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="break-all">
                          <p className="font-medium text-sm pr-2">{image.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)} • {image.uploadedAt.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImage(image, index)}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="bg-muted rounded p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Public URL:</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-mono break-all flex-1">{image.url}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(image.url);
                                toast.success('URL copied to clipboard!');
                              }}
                            >
                              Copy
                            </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};