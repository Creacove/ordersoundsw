
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadedImage {
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

export const ImageUploadSandbox = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUniqueFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `sandbox-${timestamp}-${random}.${extension}`;
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return 'Supported formats: JPEG, PNG, GIF, WebP';
    }

    return null;
  };

  const uploadImage = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filename = generateUniqueFilename(file.name);
      console.log('Starting upload:', filename);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error('Upload error:', error);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(filename);

      const newImage: UploadedImage = {
        url: urlData.publicUrl,
        filename: filename,
        size: file.size,
        uploadedAt: new Date()
      };

      setUploadedImages(prev => [newImage, ...prev]);
      toast.success('Image uploaded successfully!');

    } catch (error) {
      console.error('Upload exception:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isUploading 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary hover:bg-primary/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Uploading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
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
                  <p className="text-lg font-medium">Drop your image here</p>
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-4"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Image
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, GIF, WebP • Max 5MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Uploaded Images ({uploadedImages.length})
          </h3>
          
          <div className="grid gap-4">
            {uploadedImages.map((image, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <img
                        src={image.url}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full md:w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Image failed to load:', image.url);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    {/* Image Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{image.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)} • Uploaded {image.uploadedAt.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Public URL */}
                      <div className="bg-muted rounded p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Public URL:</p>
                        <p className="text-xs font-mono break-all">{image.url}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            navigator.clipboard.writeText(image.url);
                            toast.success('URL copied to clipboard');
                          }}
                        >
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">How it works:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• Images are uploaded directly to Supabase 'covers' bucket</li>
                <li>• Files are stored with unique names to prevent conflicts</li>
                <li>• Public URLs are generated for immediate access</li>
                <li>• No base64 encoding - files are stored as actual images</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
