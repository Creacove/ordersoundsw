
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Type for file-like objects
export type FileOrUrl = File | { url: string };

// Type guard to check if an object is a File
export function isFile(obj: any): obj is File {
  return obj instanceof File || 
         (obj && typeof obj === 'object' && 'name' in obj && 'type' in obj && 'size' in obj);
}

/**
 * Clean, simple image upload to Supabase storage
 * Returns the public URL to store in database
 */
export const uploadImage = async (
  fileOrUrl: FileOrUrl, 
  bucket: 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // If it's already a URL, return it
    if ('url' in fileOrUrl && typeof fileOrUrl.url === 'string') {
      if (!fileOrUrl.url.startsWith('data:')) {
        return fileOrUrl.url;
      }
      throw new Error('Base64 data URLs are no longer supported. Please upload a file.');
    }
    
    const file = fileOrUrl as File;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    if (progressCallback) {
      progressCallback(10);
    }
    
    console.log(`Uploading image to ${bucket}/${filePath}`);
    
    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Upload failed for ${bucket}/${filePath}:`, error);
      throw error;
    }
    
    if (progressCallback) {
      progressCallback(90);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log(`Upload successful: ${publicUrlData.publicUrl}`);
    
    if (progressCallback) {
      progressCallback(100);
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase storage
 */
export const deleteImage = async (url: string, bucket: 'covers' | 'avatars'): Promise<void> => {
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts[pathParts.length - 1];
    
    console.log(`Deleting image from ${bucket}/${filePath}`);
    
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
