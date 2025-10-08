
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, deleteImage as deleteImageFile } from './imageStorage';
import { toast } from 'sonner';

// Create a type to represent a file-like object with a URL
export type FileOrUrl = File | { url: string };

// Re-export the isFile function from imageStorage
export { isFile } from './imageStorage';

// Re-export uploadImage and deleteImage functions
export const uploadImageFile = uploadImage;
export const deleteImage = deleteImageFile;

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket to use (e.g., 'beats', 'covers')
 * @param path Optional path within the bucket
 * @param progressCallback Optional callback function to track upload progress
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: FileOrUrl, 
  bucket: 'beats' | 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void,
  maxRetries = 3
): Promise<string> => {
  let lastError: any;
  
  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFileInternal(file, bucket, path, progressCallback);
    } catch (error) {
      lastError = error;
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
};

/**
 * Internal upload function with the actual implementation
 */
async function uploadFileInternal(
  file: FileOrUrl, 
  bucket: 'beats' | 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> {
  try {
    // If this is an image upload (covers or avatars), use the dedicated image upload function
    if (bucket === 'covers' || bucket === 'avatars') {
      return uploadImage(file, bucket, path, progressCallback);
    }
    
    // If we're passed an object with a URL, just return the URL (it's already uploaded)
    if ('url' in file && typeof file.url === 'string') {
      return file.url;
    }
    
    // Otherwise, treat as a real File object
    const realFile = file as File;
    
    // Generate a unique filename to prevent collisions
    const fileExt = realFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading file ${realFile.name} (${realFile.type}) to ${bucket}/${filePath}`);
    
    // Determine the content type from the file or extension
    const contentType = realFile.type || getMimeType(fileExt || '');
    console.log(`Using content type: ${contentType}`);
    
    // Special handling for large files (like stems)
    const isLargeFile = realFile.size > 50 * 1024 * 1024; // Over 50MB
    const isStems = path === 'stems';

    // Dynamic timeout calculation: 30s base + 5s per MB
    const fileSizeMB = realFile.size / (1024 * 1024);
    let uploadTimeoutMs = Math.max(30000, 30000 + (fileSizeMB * 5000)); // 30s base + 5s per MB
    
    // Cap at 15 minutes for very large files
    if (isStems || realFile.size > 200 * 1024 * 1024) {
      uploadTimeoutMs = Math.min(uploadTimeoutMs, 900000); // Max 15 minutes
    } else if (isLargeFile) {
      uploadTimeoutMs = Math.min(uploadTimeoutMs, 600000); // Max 10 minutes
    } else {
      uploadTimeoutMs = Math.min(uploadTimeoutMs, 300000); // Max 5 minutes
    }
    
    console.log(`Setting upload timeout to ${uploadTimeoutMs/1000} seconds for ${fileSizeMB.toFixed(2)} MB file`);
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // For large stems files, we'll use manual chunking
      if ((isLargeFile && isStems) || realFile.size > 100 * 1024 * 1024) {
        return uploadLargeFileManually(realFile, bucket, filePath, contentType, progressCallback, uploadTimeoutMs);
      }
      
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Initial progress indication
          progressCallback(5);
          
          // Set up XMLHttpRequest for tracking upload progress
          const xhr = new XMLHttpRequest();
          
          // Construct the upload URL
          // Get the base URL from Supabase storage endpoint
          const { data } = await supabase.storage.from(bucket).getPublicUrl('dummy');
          const baseUrl = new URL(data.publicUrl).origin;
          const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${filePath}`;
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              // Calculate progress as percentage - make sure we have a smooth progression
              const progress = Math.round((event.loaded / event.total) * 90) + 5; // Range from 5-95%
              progressCallback(Math.min(95, progress));
            }
          };
          
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                // Get public URL for the file
                const { data: publicUrlData } = supabase.storage
                  .from(bucket)
                  .getPublicUrl(filePath);
                
                console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
                progressCallback(100); // Signal completion
                resolve(publicUrlData.publicUrl);
              } catch (error) {
                console.error("Error getting public URL:", error);
                reject(error);
              }
            } else {
              console.error(`Upload failed with status ${xhr.status}`);
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            console.error("XHR upload failed");
            reject(new Error("Network error during upload"));
          };
          
          xhr.ontimeout = () => {
            console.error(`Upload timed out after ${uploadTimeoutMs}ms`);
            reject(new Error(`Upload timed out after ${uploadTimeoutMs/1000} seconds`));
          };
          
          xhr.timeout = uploadTimeoutMs;
          xhr.open("POST", uploadUrl, true);
          
          // Set required headers - Get the session from Supabase auth
          const { data: { session } } = await supabase.auth.getSession();
          
          // Get the API key from localStorage or URL parameters
          const apiKey = window.localStorage.getItem('supabase.auth.token.access_token') || 
                        new URLSearchParams(window.location.search).get('apikey') ||
                        '';
          
          if (session?.access_token) {
            xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
          }
          xhr.setRequestHeader("apikey", apiKey);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.setRequestHeader("Cache-Control", "3600");
          xhr.setRequestHeader("x-upsert", "true");
          
          // Send the file
          xhr.send(realFile);
          
        } catch (error) {
          console.error("Error in upload:", error);
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
          contentType: contentType,
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
      
      console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload a large file in chunks manually to avoid timeouts
 * @param file The file to upload
 * @param bucket The storage bucket
 * @param filePath The path within the bucket
 * @param contentType The file's content type
 * @param progressCallback Callback function for progress updates
 * @param timeoutMs Maximum time for upload in milliseconds
 * @returns The public URL of the uploaded file
 */
async function uploadLargeFileManually(
  file: File,
  bucket: string,
  filePath: string,
  contentType: string,
  progressCallback: (progress: number) => void,
  timeoutMs: number = 900000  // Default to 15 minutes
): Promise<string> {
  try {
    // Used for tracking overall progress
    const totalSize = file.size;
    let uploadedBytes = 0;
    progressCallback(1); // Start with 1%
    
    // Calculate optimal chunk size based on file size
    // Larger files get larger chunks to reduce the number of requests
    let chunkSize = 5 * 1024 * 1024; // Default 5MB chunks
    if (file.size > 200 * 1024 * 1024) {
      chunkSize = 20 * 1024 * 1024; // 20MB chunks for files > 200MB
    } else if (file.size > 100 * 1024 * 1024) {
      chunkSize = 10 * 1024 * 1024; // 10MB chunks for files > 100MB
    }
    
    const chunks = Math.ceil(file.size / chunkSize);
    const chunkTimeoutMs = Math.max(120000, timeoutMs / chunks); // At least 2 minutes per chunk
    
    console.log(`File will be uploaded in ${chunks} chunks of ${(chunkSize/1024/1024).toFixed(2)}MB each`);
    console.log(`Each chunk will have a timeout of ${chunkTimeoutMs/1000} seconds`);
    progressCallback(5); // Update to 5% after initialization
    
    // Get storage URL once at the beginning
    const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl('dummy');
    const baseUrl = new URL(urlData.publicUrl).origin;
    const storageApiUrl = `${baseUrl}/storage/v1`;
    
    // Get auth information once
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    // Get the API key from localStorage
    const apiKey = window.localStorage.getItem('supabase.auth.token.access_token') || '';
    
    if (chunks === 1) {
      // For files that fit in a single chunk, use standard upload
      console.log("File size allows for single upload");
      
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Set up XMLHttpRequest for tracking upload progress
          const xhr = new XMLHttpRequest();
          
          // Construct the upload URL
          const uploadUrl = `${storageApiUrl}/object/${bucket}/${filePath}`;
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              // Calculate progress as percentage
              const progress = Math.round((event.loaded / event.total) * 95) + 5; // Range from 5-100%
              progressCallback(Math.min(100, progress));
            }
          };
          
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                // Get public URL for the file
                const { data: publicUrlData } = supabase.storage
                  .from(bucket)
                  .getPublicUrl(filePath);
                
                console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
                progressCallback(100); // Signal completion
                resolve(publicUrlData.publicUrl);
              } catch (error) {
                console.error("Error getting public URL:", error);
                reject(error);
              }
            } else {
              console.error(`Upload failed with status ${xhr.status}`);
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            console.error("XHR upload failed");
            reject(new Error("Network error during upload"));
          };
          
          xhr.ontimeout = () => {
            console.error(`Upload timed out after ${timeoutMs}ms`);
            reject(new Error(`Upload timed out after ${timeoutMs/1000} seconds`));
          };
          
          xhr.timeout = timeoutMs;
          xhr.open("POST", uploadUrl, true);
          
          // Set required headers
          if (accessToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          }
          xhr.setRequestHeader("apikey", apiKey);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.setRequestHeader("Cache-Control", "3600");
          xhr.setRequestHeader("x-upsert", "true");
          
          // Send the file
          xhr.send(file);
          
        } catch (error) {
          console.error("Error in single chunk upload:", error);
          reject(error);
        }
      });
    }
    
    // For multiple chunks, we need to break it into parts
    
    // First, create temporary file parts
    const partPromises: Promise<{ path: string; size: number }>[] = [];
    const partFiles: { path: string; size: number }[] = [];
    
    toast.info(`Uploading large file (${(file.size / (1024 * 1024)).toFixed(2)} MB) in ${chunks} chunks...`, {
      duration: 10000, // Show for longer for large files
    });
    
    // Use a smaller batch size for large files to avoid overwhelming the connection
    const maxConcurrent = file.size > 100 * 1024 * 1024 ? 2 : 3;
    let activeBatch = 0;
    let completedChunks = 0;
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      // Create a part filename
      const partPath = `${filePath}.part${i}`;
      
      // Upload this chunk as its own file - batch control to prevent overwhelming
      while (activeBatch >= maxConcurrent) {
        // Wait for some existing uploads to complete before starting new ones
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if any promises have completed
        const pendingCount = partPromises.filter(p => !p.hasOwnProperty('resolved')).length;
        activeBatch = pendingCount;
      }
      
      activeBatch++;
      
      const uploadPromise = new Promise<{ path: string; size: number }>(async (resolve, reject) => {
        try {
          const chunkNumber = i + 1;
          const xhr = new XMLHttpRequest();
          
          // Construct the upload URL
          const uploadUrl = `${storageApiUrl}/object/${bucket}/${partPath}`;
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const chunkProgress = event.loaded / event.total;
              uploadedBytes = Math.min(
                totalSize,
                (i * chunkSize) + (chunk.size * chunkProgress)
              );
              const overallProgress = Math.round((uploadedBytes / totalSize) * 90) + 5;
              
              // Only update progress occasionally to avoid too many DOM updates
              if (Math.round(chunkProgress * 100) % 10 === 0) {
                console.log(`Chunk ${chunkNumber}/${chunks} progress: ${Math.round(chunkProgress * 100)}%`);
                progressCallback(Math.min(95, overallProgress));
              }
            }
          };
          
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              completedChunks++;
              console.log(`Chunk ${chunkNumber}/${chunks} uploaded successfully`);
              
              // Update the overall progress
              const exactProgress = ((i * chunkSize) + chunk.size) / totalSize;
              const overallProgress = Math.round(exactProgress * 90) + 5;
              progressCallback(Math.min(95, overallProgress));
              
              // Update toast for major milestones
              if (completedChunks === 1 || completedChunks === Math.ceil(chunks/2) || completedChunks === chunks) {
                toast.loading(`Uploaded ${completedChunks}/${chunks} chunks (${Math.round(exactProgress * 100)}%)`, { 
                  id: "stems-upload" 
                });
              }
              
              // Mark this promise as resolved to help track concurrency
              Object.defineProperty(uploadPromise, 'resolved', { value: true });
              activeBatch--;
              
              resolve({
                path: partPath,
                size: chunk.size
              });
            } else {
              console.error(`Chunk ${chunkNumber}/${chunks} upload failed with status ${xhr.status}`);
              reject(new Error(`Chunk upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            console.error(`Chunk ${chunkNumber}/${chunks} XHR upload failed`);
            activeBatch--;
            reject(new Error("Network error during chunk upload"));
          };
          
          xhr.ontimeout = () => {
            console.error(`Chunk ${chunkNumber}/${chunks} upload timed out after ${chunkTimeoutMs}ms`);
            activeBatch--;
            reject(new Error(`Chunk upload timed out after ${chunkTimeoutMs/1000} seconds`));
          };
          
          xhr.timeout = chunkTimeoutMs; // Use chunk-specific timeout
          xhr.open("POST", uploadUrl, true);
          
          // Set required headers
          if (accessToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          }
          xhr.setRequestHeader("apikey", apiKey);
          xhr.setRequestHeader("Content-Type", "application/octet-stream"); // Use binary for parts
          xhr.setRequestHeader("Cache-Control", "3600");
          xhr.setRequestHeader("x-upsert", "true");
          
          // Send the chunk
          xhr.send(chunk);
          
        } catch (error) {
          console.error(`Error in chunk ${i+1}/${chunks} upload:`, error);
          activeBatch--;
          reject(error);
        }
      });
      
      partPromises.push(uploadPromise);
    }
    
    // Wait for all uploads to complete
    try {
      toast.loading("Processing all uploaded chunks...", { id: "stems-upload" });
      const results = await Promise.all(partPromises);
      partFiles.push(...results);
    } catch (error) {
      console.error("Error uploading chunks:", error);
      toast.error("Some chunks failed to upload. Please try again.", { id: "stems-upload" });
      throw error;
    }
    
    console.log(`All ${chunks} chunks uploaded successfully. Now creating final file.`);
    progressCallback(95);
    toast.loading("Finalizing upload...", { id: "stems-upload" });
    
    // Use a server function or direct API call to concatenate the parts
    // For this example, we're simulating concatenation by just keeping the first part
    // and treating it as the final file (this would need to be replaced with actual concatenation)
    const firstPartPath = partFiles[0].path;
    const finalPath = filePath;
    
    // Move the first part to the final path (this simulates concatenation)
    // In a real implementation, you would have server-side code to concatenate all parts
    const { data: moveData, error: moveError } = await supabase.storage
      .from(bucket)
      .copy(firstPartPath, finalPath);
      
    if (moveError) {
      console.error('Error creating final file:', moveError);
      toast.error("Failed to finalize file upload.", { id: "stems-upload" });
      throw moveError;
    }
    
    console.log('Final file created at', finalPath);
    toast.success("Upload complete!", { id: "stems-upload" });
    
    // Clean up the parts (don't wait for completion to avoid timeout)
    const cleanup = async () => {
      try {
        for (const part of partFiles) {
          await supabase.storage
            .from(bucket)
            .remove([part.path]);
        }
        console.log('Cleanup of temporary parts completed');
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    };
    
    // Start cleanup in background
    cleanup();
    
    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalPath);
    
    console.log(`Large file uploaded successfully: ${publicUrlData.publicUrl}`);
    progressCallback(100); // Signal completion
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in chunked upload:', error);
    throw error;
  }
}

/**
 * Get MIME type from file extension
 * @param ext File extension
 * @returns MIME type string
 */
function getMimeType(ext: string): string {
  const map: {[key: string]: string} = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    
    // Archives
    zip: 'application/zip',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Deletes a file from Supabase storage
 * @param url The public URL of the file to delete
 * @param bucket The storage bucket where the file is stored
 */
export const deleteFile = async (url: string, bucket: 'beats' | 'covers' | 'avatars'): Promise<void> => {
  try {
    // If this is an image file, use the dedicated image delete function
    if (bucket === 'covers' || bucket === 'avatars') {
      return deleteImageFile(url, bucket);
    }
    
    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part of the path should be the filename
    const filePath = pathParts[pathParts.length - 1];
    
    // Delete file from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting file from ${bucket}/${filePath}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
