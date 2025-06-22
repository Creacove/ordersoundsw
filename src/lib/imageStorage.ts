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
 * Validates if a data URL is properly formatted and contains image data
 */
function validateDataURL(dataUrl: string): { isValid: boolean; mimeType: string | null; error?: string } {
  try {
    // Check basic data URL format
    if (!dataUrl.startsWith('data:')) {
      return { isValid: false, mimeType: null, error: 'Not a data URL' };
    }

    // Extract MIME type
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) {
      return { isValid: false, mimeType: null, error: 'Invalid data URL format' };
    }

    const mimeType = mimeMatch[1];
    
    // Validate it's an image MIME type
    if (!mimeType.startsWith('image/')) {
      return { isValid: false, mimeType: null, error: `Invalid MIME type: ${mimeType}` };
    }

    // Check if base64 data exists
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data || base64Data.length === 0) {
      return { isValid: false, mimeType: null, error: 'No base64 data found' };
    }

    // Validate base64 format (basic check)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      return { isValid: false, mimeType: null, error: 'Invalid base64 encoding' };
    }

    // Check minimum size (a valid image should be at least a few hundred bytes)
    if (base64Data.length < 100) {
      return { isValid: false, mimeType: null, error: 'Base64 data too small to be a valid image' };
    }

    return { isValid: true, mimeType };
  } catch (error) {
    return { isValid: false, mimeType: null, error: `Validation error: ${error}` };
  }
}

/**
 * Validates if a blob contains actual image data by checking file headers
 */
function validateImageBlob(blob: Blob): Promise<{ isValid: boolean; detectedType?: string; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        
        if (bytes.length < 4) {
          resolve({ isValid: false, error: 'Blob too small to contain image headers' });
          return;
        }

        // Check for image file signatures
        let detectedType = '';
        
        // JPEG: FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
          detectedType = 'image/jpeg';
        }
        // PNG: 89 50 4E 47
        else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          detectedType = 'image/jpeg'; // Force to JPEG
        }
        // GIF: 47 49 46
        else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          detectedType = 'image/jpeg'; // Force to JPEG
        }
        // WEBP: 52 49 46 46 ... 57 45 42 50
        else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                 bytes.length > 11 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
          detectedType = 'image/jpeg'; // Force to JPEG
        }
        else {
          resolve({ isValid: false, error: 'No valid image file signature found' });
          return;
        }

        resolve({ isValid: true, detectedType });
      } catch (error) {
        resolve({ isValid: false, error: `Blob validation error: ${error}` });
      }
    };
    
    reader.onerror = () => {
      resolve({ isValid: false, error: 'Failed to read blob data' });
    };
    
    // Read only the first 32 bytes for header validation
    reader.readAsArrayBuffer(blob.slice(0, 32));
  });
}

/**
 * Converts a data URL to a Blob with bulletproof validation
 * @param dataUrl The data URL to convert
 * @returns A validated Blob object
 */
export async function dataURLtoBlob(dataUrl: string): Promise<Blob> {
  // Step 1: Validate the data URL format
  const validation = validateDataURL(dataUrl);
  if (!validation.isValid) {
    throw new Error(`Invalid data URL: ${validation.error}`);
  }

  try {
    // Step 2: Extract and decode base64 data
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    // Step 3: Create blob with hardcoded JPEG type
    const blob = new Blob([u8arr], { type: 'image/jpeg' });
    
    // Step 4: Validate the blob contains actual image data
    const blobValidation = await validateImageBlob(blob);
    if (!blobValidation.isValid) {
      throw new Error(`Invalid image blob: ${blobValidation.error}`);
    }
    
    console.log(`Successfully created validated JPEG blob (${blob.size} bytes)`);
    return blob;
    
  } catch (error) {
    throw new Error(`Failed to convert data URL to blob: ${error}`);
  }
}

/**
 * Pre-validates a base64 image before attempting migration
 */
export async function preValidateBase64Image(dataUrl: string): Promise<{ isValid: boolean; error?: string; size?: number; type?: string }> {
  try {
    const validation = validateDataURL(dataUrl);
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }

    // Create a test blob to validate the image data
    const blob = await dataURLtoBlob(dataUrl);
    
    return {
      isValid: true,
      size: blob.size,
      type: 'image/jpeg' // Always return JPEG
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Uploads an image to Supabase storage with hardcoded JPEG handling
 */
export const uploadImage = async (
  fileOrUrl: FileOrUrl, 
  bucket: 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // If we're passed an object with a URL, and it's a data URL, convert it to a file
    if ('url' in fileOrUrl && typeof fileOrUrl.url === 'string') {
      // If it's a plain URL (not a data URL), just return it
      if (!fileOrUrl.url.startsWith('data:')) {
        return fileOrUrl.url;
      }
      
      // Pre-validate the data URL
      const preValidation = await preValidateBase64Image(fileOrUrl.url);
      if (!preValidation.isValid) {
        throw new Error(`Pre-validation failed: ${preValidation.error}`);
      }
      
      // Convert data URL to file with validation
      const blob = await dataURLtoBlob(fileOrUrl.url);
      
      // Hardcode everything to JPEG
      const fileName = `${uuidv4()}.jpeg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      console.log(`Created File object: ${fileName} with hardcoded type: image/jpeg (${file.size} bytes)`);
      
      // Now we have a properly validated file, proceed with upload
      fileOrUrl = file;
    }
    
    // Now we should have a File object
    const file = fileOrUrl as File;
    
    // Generate a unique filename with hardcoded JPEG extension
    const fileName = `${uuidv4()}.jpeg`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading hardcoded JPEG image ${file.name} (${file.size} bytes) to ${bucket}/${filePath}`);
    
    if (progressCallback) {
      progressCallback(10);
    }
    
    // Upload file to Supabase Storage with explicit JPEG content type
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: 'image/jpeg', // Hardcoded JPEG content type
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
    
    console.log(`JPEG image uploaded successfully: ${publicUrlData.publicUrl}`);
    
    if (progressCallback) {
      progressCallback(100);
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
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
