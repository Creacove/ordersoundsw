
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Type guard to check if an object is a File
export function isFile(obj: any): obj is File {
  return obj instanceof File || 
         (obj && typeof obj === 'object' && 'name' in obj && 'type' in obj && 'size' in obj);
}

// Type for file-like objects
export type FileOrUrl = File | { url: string };

/**
 * Converts a data URL to a Blob
 * @param dataUrl The data URL to convert
 * @returns A Blob object
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads an image to Supabase storage
 * @param fileOrUrl The image file or a data URL
 * @param bucket The storage bucket to use (e.g., 'avatars', 'covers')
 * @param path Optional path within the bucket
 * @param progressCallback Optional callback function to track upload progress
 * @returns The public URL of the uploaded image
 */
export const uploadImage = async (
  fileOrUrl: FileOrUrl, 
  bucket: 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // Remove authentication check - allow anyone to upload images
    
    // If we're passed an object with a URL, and it's a data URL, convert it to a file
    if ('url' in fileOrUrl && typeof fileOrUrl.url === 'string') {
      // If it's a plain URL (not a data URL), just return it
      if (!fileOrUrl.url.startsWith('data:')) {
        return fileOrUrl.url;
      }
      
      // Convert data URL to file
      const blob = dataURLtoBlob(fileOrUrl.url);
      const fileExt = fileOrUrl.url.split(';')[0].split('/')[1] || 'png';
      const fileName = `${uuidv4()}.${fileExt}`;
      const file = new File([blob], fileName, { type: `image/${fileExt}` });
      
      // Now we have a proper file, proceed with upload
      fileOrUrl = file;
    }
    
    // Now we should have a File object
    const file = fileOrUrl as File;
    
    // Generate a unique filename to prevent collisions
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading image ${file.name} to ${bucket}/${filePath}`);
    
    if (progressCallback) {
      progressCallback(10); // Start with some initial progress
    }
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading to ${bucket}/${filePath}:`, error);
      throw error;
    }
    
    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log(`Image uploaded successfully: ${publicUrlData.publicUrl}`);
    
    if (progressCallback) {
      progressCallback(100); // Signal completion
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase storage
 * @param url The public URL of the image to delete
 * @param bucket The storage bucket where the image is stored
 */
export const deleteImage = async (url: string, bucket: 'covers' | 'avatars'): Promise<void> => {
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part of the path should be the filename
    const filePath = pathParts[pathParts.length - 1];
    
    console.log(`Deleting image from ${bucket}/${filePath}`);
    
    // Delete file from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting image from ${bucket}/${filePath}:`, error);
      throw error;
    }
    
    console.log(`Image deleted successfully from ${bucket}/${filePath}`);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
