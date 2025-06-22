import { supabase } from '@/integrations/supabase/client';
import { uploadImage, preValidateBase64Image } from '@/lib/imageStorage';

export interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  failedUsers: number;
  skippedUsers: number;
  errors: string[];
}

export interface BeatMigrationResult {
  totalBeats: number;
  migratedBeats: number;
  failedBeats: number;
  skippedBeats: number;
  errors: string[];
}

export interface SingleBeatMigrationResult {
  success: boolean;
  beatId: string;
  beatTitle: string;
  originalUrl?: string;
  newUrl?: string;
  error?: string;
  usedBackup?: boolean;
}

export interface StorageRepairResult {
  totalFiles: number;
  repairedFiles: number;
  failedFiles: number;
  errors: string[];
}

/**
 * Detects image format from file header bytes
 */
const detectImageFormat = (buffer: ArrayBuffer): string | null => {
  const bytes = new Uint8Array(buffer);
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  
  // GIF: 47 49 46
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }
  
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  
  return null;
};

/**
 * Emergency cleanup function to remove corrupted storage files
 */
export const emergencyCleanupCorruptedStorage = async (): Promise<{ cleaned: number; errors: string[] }> => {
  const result = { cleaned: 0, errors: [] };
  
  try {
    console.log('Starting emergency cleanup of corrupted storage files...');
    
    // Get all files from covers bucket
    const { data: coverFiles, error: coverError } = await supabase.storage
      .from('covers')
      .list('', { limit: 1000 });
      
    if (coverError) {
      throw coverError;
    }
    
    // Get all files from avatars bucket  
    const { data: avatarFiles, error: avatarError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1000 });
      
    if (avatarError) {
      throw avatarError;
    }
    
    const allFiles = [
      ...(coverFiles || []).map(f => ({ ...f, bucket: 'covers' as const })),
      ...(avatarFiles || []).map(f => ({ ...f, bucket: 'avatars' as const }))
    ];
    
    console.log(`Found ${allFiles.length} total storage files to check`);
    
    // Delete files with suspicious metadata or invalid content types
    for (const file of allFiles) {
      try {
        const filePath = file.name;
        
        // Check if file has suspicious properties indicating corruption
        const shouldDelete = 
          !file.metadata ||
          (file.metadata as any)?.mimetype === 'application/json' ||
          (file.metadata as any)?.size === 0 ||
          filePath.includes('undefined') ||
          filePath.includes('null');
          
        if (shouldDelete) {
          console.log(`Deleting corrupted file: ${file.bucket}/${filePath}`);
          
          const { error: deleteError } = await supabase.storage
            .from(file.bucket)
            .remove([filePath]);
            
          if (deleteError) {
            result.errors.push(`Failed to delete ${file.bucket}/${filePath}: ${deleteError.message}`);
          } else {
            result.cleaned++;
          }
        }
      } catch (error) {
        result.errors.push(`Error processing file ${file.name}: ${error}`);
      }
    }
    
    console.log(`Emergency cleanup completed. Cleaned ${result.cleaned} files`);
    return result;
    
  } catch (error) {
    console.error('Emergency cleanup failed:', error);
    result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Reset database records that point to corrupted storage URLs
 */
export const resetCorruptedDatabaseRecords = async (): Promise<{ reset: number; errors: string[] }> => {
  const result = { reset: 0, errors: [] };
  
  try {
    console.log('Resetting database records with corrupted storage URLs...');
    
    // Get beats with storage URLs that might be corrupted
    const { data: beats, error: beatError } = await supabase
      .from('beats')
      .select('id, cover_image, title')
      .not('cover_image', 'is', null)
      .like('cover_image', '%supabase%');
      
    if (beatError) {
      throw beatError;
    }
    
    if (!beats || beats.length === 0) {
      console.log('No beats with storage URLs found');
      return result;
    }
    
    // Check each storage URL and reset if corrupted
    for (const beat of beats) {
      try {
        // Try to fetch the image to see if it's valid
        const response = await fetch(beat.cover_image, { method: 'HEAD' });
        
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
          console.log(`Resetting corrupted cover for beat ${beat.id}: ${beat.title}`);
          
          const { error: updateError } = await supabase
            .from('beats')
            .update({ cover_image: null })
            .eq('id', beat.id);
            
          if (updateError) {
            result.errors.push(`Failed to reset beat ${beat.id}: ${updateError.message}`);
          } else {
            result.reset++;
          }
        }
      } catch (error) {
        // If fetch fails, assume URL is corrupted and reset it
        console.log(`Resetting unreachable cover for beat ${beat.id}: ${beat.title}`);
        
        const { error: updateError } = await supabase
          .from('beats')
          .update({ cover_image: null })
          .eq('id', beat.id);
          
        if (updateError) {
          result.errors.push(`Failed to reset beat ${beat.id}: ${updateError.message}`);
        } else {
          result.reset++;
        }
      }
    }
    
    console.log(`Database reset completed. Reset ${result.reset} records`);
    return result;
    
  } catch (error) {
    console.error('Database reset failed:', error);
    result.errors.push(`Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Bulletproof migration of beat cover images from base64 to Supabase storage
 * 10x Engineer Version: No post-upload verification, just upload and update
 */
export const migrateBeatCoverImagesToStorage = async (): Promise<BeatMigrationResult> => {
  const result: BeatMigrationResult = {
    totalBeats: 0,
    migratedBeats: 0,
    failedBeats: 0,
    skippedBeats: 0,
    errors: []
  };

  try {
    console.log('Starting bulletproof beat cover image migration...');
    
    // Get all beats with base64 cover images
    const { data: beats, error } = await supabase
      .from('beats')
      .select('id, cover_image, title')
      .not('cover_image', 'is', null)
      .like('cover_image', 'data:image%');

    if (error) {
      throw error;
    }

    result.totalBeats = beats?.length || 0;
    console.log(`Found ${result.totalBeats} beats with base64 cover images`);

    if (!beats || beats.length === 0) {
      console.log('No beats with base64 cover images found');
      return result;
    }

    // Process beats in small batches for safety
    const batchSize = 3;
    for (let i = 0; i < beats.length; i += batchSize) {
      const batch = beats.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(beats.length / batchSize)}`);
      
      for (const beat of batch) {
        try {
          console.log(`Processing beat ${beat.id}: ${beat.title}`);
          
          // Step 1: Pre-validate the base64 image
          const validation = await preValidateBase64Image(beat.cover_image);
          if (!validation.isValid) {
            console.warn(`Skipping beat ${beat.id} - invalid base64: ${validation.error}`);
            result.skippedBeats++;
            result.errors.push(`Beat ${beat.id} (${beat.title}): ${validation.error}`);
            continue;
          }
          
          console.log(`Beat ${beat.id} validation passed - ${validation.type}, ${validation.size} bytes`);
          
          // Step 2: Create backup of original data
          const { error: backupError } = await supabase
            .from('beats')
            .update({ cover_image_backup: beat.cover_image })
            .eq('id', beat.id);
            
          if (backupError) {
            console.warn(`Failed to backup original data for beat ${beat.id}:`, backupError);
            // Continue anyway - this is just for safety
          }
          
          // Step 3: Upload to storage (no post-verification)
          const storageUrl = await uploadImage(
            { url: beat.cover_image }, 
            'covers', 
            'migrated'
          );
          
          console.log(`Beat ${beat.id} uploaded successfully to: ${storageUrl}`);
          
          // Step 4: Update database record immediately after successful upload
          const { error: updateError } = await supabase
            .from('beats')
            .update({ cover_image: storageUrl })
            .eq('id', beat.id);
            
          if (updateError) {
            throw updateError;
          }
          
          result.migratedBeats++;
          console.log(`Successfully migrated beat ${beat.id}`);
          
          // Add small delay between uploads to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Failed to migrate beat ${beat.id}:`, error);
          result.failedBeats++;
          result.errors.push(`Beat ${beat.id} (${beat.title}): ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Try to restore from backup if update failed
          try {
            const { data: backupData } = await supabase
              .from('beats')
              .select('cover_image_backup')
              .eq('id', beat.id)
              .single();
              
            if (backupData?.cover_image_backup) {
              await supabase
                .from('beats')
                .update({ cover_image: backupData.cover_image_backup })
                .eq('id', beat.id);
              console.log(`Restored backup for beat ${beat.id}`);
            }
          } catch (restoreError) {
            console.error(`Failed to restore backup for beat ${beat.id}:`, restoreError);
          }
        }
      }
    }
    
    console.log(`Beat migration completed. Migrated: ${result.migratedBeats}, Failed: ${result.failedBeats}, Skipped: ${result.skippedBeats}`);
    return result;
    
  } catch (error) {
    console.error('Beat migration failed:', error);
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Bulletproof migration of user profile pictures from base64 to Supabase storage
 * 10x Engineer Version: No post-upload verification, just upload and update
 */
export const migrateBase64ImagesToStorage = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    totalUsers: 0,
    migratedUsers: 0,
    failedUsers: 0,
    skippedUsers: 0,
    errors: []
  };

  try {
    console.log('Starting bulletproof user profile picture migration...');
    
    // Get all users with base64 profile pictures
    const { data: users, error } = await supabase
      .from('users')
      .select('id, profile_picture, full_name, stage_name')
      .not('profile_picture', 'is', null)
      .like('profile_picture', 'data:image%');

    if (error) {
      throw error;
    }

    result.totalUsers = users?.length || 0;
    console.log(`Found ${result.totalUsers} users with base64 profile pictures`);

    if (!users || users.length === 0) {
      console.log('No users with base64 profile pictures found');
      return result;
    }

    // Process users in small batches
    const batchSize = 3;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
      
      for (const user of batch) {
        try {
          console.log(`Processing user ${user.id}: ${user.full_name || user.stage_name}`);
          
          // Step 1: Pre-validate the base64 image
          const validation = await preValidateBase64Image(user.profile_picture);
          if (!validation.isValid) {
            console.warn(`Skipping user ${user.id} - invalid base64: ${validation.error}`);
            result.skippedUsers++;
            result.errors.push(`User ${user.id}: ${validation.error}`);
            continue;
          }
          
          // Step 2: Upload to storage (no post-verification)
          const storageUrl = await uploadImage(
            { url: user.profile_picture }, 
            'avatars', 
            'migrated'
          );
          
          // Step 3: Update database record immediately after successful upload
          const { error: updateError } = await supabase
            .from('users')
            .update({ profile_picture: storageUrl })
            .eq('id', user.id);
            
          if (updateError) {
            throw updateError;
          }
          
          result.migratedUsers++;
          console.log(`Successfully migrated user ${user.id} to ${storageUrl}`);
          
          // Small delay between uploads
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Failed to migrate user ${user.id}:`, error);
          result.failedUsers++;
          result.errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    console.log(`User migration completed. Migrated: ${result.migratedUsers}, Failed: ${result.failedUsers}, Skipped: ${result.skippedUsers}`);
    return result;
    
  } catch (error) {
    console.error('User migration failed:', error);
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Clean up backup columns after successful migration
 */
export const cleanupMigrationBackups = async (): Promise<{ cleaned: number; errors: string[] }> => {
  const result = { cleaned: 0, errors: [] };
  
  try {
    console.log('Cleaning up migration backup data...');
    
    // Clear backup column for successfully migrated beats
    const { data: beats, error: selectError } = await supabase
      .from('beats')
      .select('id')
      .not('cover_image_backup', 'is', null)
      .not('cover_image', 'is', null)
      .not('cover_image', 'like', 'data:image%');
      
    if (selectError) {
      throw selectError;
    }
    
    if (beats && beats.length > 0) {
      const beatIds = beats.map(b => b.id);
      const { error: updateError } = await supabase
        .from('beats')
        .update({ cover_image_backup: null })
        .in('id', beatIds);
        
      if (updateError) {
        result.errors.push(`Failed to clear backups: ${updateError.message}`);
      } else {
        result.cleaned = beats.length;
      }
    }
    
    console.log(`Cleanup completed. Cleared ${result.cleaned} backup records`);
    return result;
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Legacy functions for compatibility - keeping the existing interface
export const cleanupCorruptedRecords = async (): Promise<{ cleaned: number; errors: string[] }> => {
  // This now calls the new emergency cleanup function
  return await emergencyCleanupCorruptedStorage();
};

export const repairCorruptedStorageImages = async (): Promise<StorageRepairResult> => {
  // This function is no longer needed with the new bulletproof approach
  // But keeping for compatibility
  return {
    totalFiles: 0,
    repairedFiles: 0,
    failedFiles: 0,
    errors: ['This function has been replaced by the new bulletproof migration system']
  };
};

/**
 * Migrate a single beat cover image for testing purposes
 */
export const migrateSingleBeatCoverToStorage = async (beatId: string): Promise<SingleBeatMigrationResult> => {
  try {
    console.log(`Testing migration for beat ID: ${beatId}`);
    
    // Get the specific beat
    const { data: beat, error } = await supabase
      .from('beats')
      .select('id, cover_image, cover_image_backup, title')
      .eq('id', beatId)
      .single();

    if (error || !beat) {
      return {
        success: false,
        beatId,
        beatTitle: 'Unknown',
        error: `Beat not found: ${error?.message || 'No beat with this ID'}`
      };
    }

    let imageToMigrate = beat.cover_image;
    let usedBackup = false;

    // Check if current cover_image is a broken Supabase URL
    if (beat.cover_image && beat.cover_image.includes('supabase') && !beat.cover_image.startsWith('data:')) {
      console.log(`Beat ${beatId} has broken Supabase URL, checking backup...`);
      
      if (beat.cover_image_backup && beat.cover_image_backup.startsWith('data:image')) {
        imageToMigrate = beat.cover_image_backup;
        usedBackup = true;
        console.log(`Using backup image for beat ${beatId}`);
      } else {
        return {
          success: false,
          beatId,
          beatTitle: beat.title,
          originalUrl: beat.cover_image,
          error: 'No valid backup image found for broken Supabase URL'
        };
      }
    }

    // Check if we have a base64 image to migrate
    if (!imageToMigrate || !imageToMigrate.startsWith('data:image')) {
      return {
        success: false,
        beatId,
        beatTitle: beat.title,
        originalUrl: beat.cover_image,
        error: 'No base64 image found to migrate'
      };
    }

    // Pre-validate the base64 image
    const validation = await preValidateBase64Image(imageToMigrate);
    if (!validation.isValid) {
      return {
        success: false,
        beatId,
        beatTitle: beat.title,
        originalUrl: imageToMigrate.substring(0, 50) + '...',
        error: `Invalid base64 image: ${validation.error}`,
        usedBackup
      };
    }

    console.log(`Beat ${beatId} validation passed - ${validation.type}, ${validation.size} bytes`);

    // Create backup if we haven't already
    if (!usedBackup && !beat.cover_image_backup) {
      await supabase
        .from('beats')
        .update({ cover_image_backup: beat.cover_image })
        .eq('id', beatId);
    }

    // Upload to storage
    const storageUrl = await uploadImage(
      { url: imageToMigrate }, 
      'covers', 
      'test-migration'
    );

    console.log(`Beat ${beatId} uploaded successfully to: ${storageUrl}`);

    // Update database record
    const { error: updateError } = await supabase
      .from('beats')
      .update({ cover_image: storageUrl })
      .eq('id', beatId);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      beatId,
      beatTitle: beat.title,
      originalUrl: imageToMigrate.substring(0, 50) + '...',
      newUrl: storageUrl,
      usedBackup
    };

  } catch (error) {
    console.error(`Failed to migrate beat ${beatId}:`, error);
    return {
      success: false,
      beatId,
      beatTitle: 'Unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
