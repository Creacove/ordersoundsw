
import { supabase } from '@/integrations/supabase/client';

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

export interface StorageRepairResult {
  totalFiles: number;
  repairedFiles: number;
  failedFiles: number;
  errors: string[];
}

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

// Legacy functions for compatibility - deprecated
export const migrateBeatCoverImagesToStorage = async (): Promise<BeatMigrationResult> => {
  return {
    totalBeats: 0,
    migratedBeats: 0,
    failedBeats: 0,
    skippedBeats: 0,
    errors: ['Migration functions have been deprecated. Use the new direct upload system.']
  };
};

export const migrateBase64ImagesToStorage = async (): Promise<MigrationResult> => {
  return {
    totalUsers: 0,
    migratedUsers: 0,
    failedUsers: 0,
    skippedUsers: 0,
    errors: ['Migration functions have been deprecated. Use the new direct upload system.']
  };
};

export const cleanupMigrationBackups = async (): Promise<{ cleaned: number; errors: string[] }> => {
  return {
    cleaned: 0,
    errors: ['Backup cleanup is no longer needed - backup columns have been removed']
  };
};

export const cleanupCorruptedRecords = async (): Promise<{ cleaned: number; errors: string[] }> => {
  return await emergencyCleanupCorruptedStorage();
};

export const repairCorruptedStorageImages = async (): Promise<StorageRepairResult> => {
  return {
    totalFiles: 0,
    repairedFiles: 0,
    failedFiles: 0,
    errors: ['This function has been replaced by the new direct upload system']
  };
};
