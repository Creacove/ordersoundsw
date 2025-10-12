import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from './storage';
import type { SoundFileMeta } from '@/components/upload/SoundpackFilesUpload';

type CreateSoundpackParams = {
  title: string;
  description?: string;
  genre: string;
  category: string;
  producerId: string;
  coverImageUrl: string;
  basicLicensePriceLocal: number;
  basicLicensePriceDiaspora: number;
  premiumLicensePriceLocal: number;
  premiumLicensePriceDiaspora: number;
  exclusiveLicensePriceLocal: number;
  exclusiveLicensePriceDiaspora: number;
  customLicensePriceLocal: number;
  customLicensePriceDiaspora: number;
  licenseType: string;
  licenseTerms?: string;
};

export const createSoundpack = async (params: CreateSoundpackParams) => {
  // Generate unique slug to avoid conflicts
  const baseSlug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slug = `${baseSlug}-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('soundpacks')
    .insert({
      title: params.title,
      slug,
      description: params.description || '',
      producer_id: params.producerId,
      category: params.category,
      cover_art_url: params.coverImageUrl,
      basic_license_price_local: params.basicLicensePriceLocal,
      basic_license_price_diaspora: params.basicLicensePriceDiaspora,
      premium_license_price_local: params.premiumLicensePriceLocal,
      premium_license_price_diaspora: params.premiumLicensePriceDiaspora,
      exclusive_license_price_local: params.exclusiveLicensePriceLocal,
      exclusive_license_price_diaspora: params.exclusiveLicensePriceDiaspora,
      custom_license_price_local: params.customLicensePriceLocal,
      custom_license_price_diaspora: params.customLicensePriceDiaspora,
      license_type: params.licenseType,
      license_terms: params.licenseTerms || '',
      published: false,
      file_count: 0
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const uploadSoundpackFiles = async (
  packId: string,
  producerId: string,
  files: File[],
  filesMeta: SoundFileMeta[],
  coverImageUrl: string,
  status: 'draft' | 'published',
  onProgress?: (fileIndex: number, progress: number) => void
) => {
  // Deduplication: Check for duplicate files
  const fileHashes = new Map<string, number>();
  const uniqueFiles: File[] = [];
  const uniqueMeta: SoundFileMeta[] = [];
  
  files.forEach((file, index) => {
    const hash = `${file.name}-${file.size}-${file.lastModified}`;
    if (!fileHashes.has(hash)) {
      fileHashes.set(hash, index);
      uniqueFiles.push(file);
      uniqueMeta.push(filesMeta[index]);
    } else {
      console.warn(`Duplicate file detected and skipped: ${file.name}`);
    }
  });
  
  const uploadedBeats = [];
  
  // Upload files in parallel batches of 3 for better performance
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < uniqueFiles.length; i += BATCH_SIZE) {
    const batch = uniqueFiles.slice(i, i + BATCH_SIZE);
    const batchMeta = uniqueMeta.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (file, batchIndex) => {
      const fileIndex = i + batchIndex;
      const meta = batchMeta[batchIndex];
      
      try {
        // Upload audio file with throttled progress updates
        let lastProgressUpdate = 0;
        const audioUrl = await uploadFile(file, 'beats', `soundpacks/${packId}`, (progress) => {
          // Throttle progress updates to every 10% or when complete
          if (progress === 100 || progress - lastProgressUpdate >= 10) {
            onProgress?.(fileIndex, progress);
            lastProgressUpdate = progress;
          }
        });
        
        // Create beat record
        const { data: beat, error } = await supabase
          .from('beats')
          .insert({
            title: meta.name.replace(/\.[^/.]+$/, ''),
            soundpack_id: packId,
            type: 'soundpack_item',
            status: status,
            audio_file: audioUrl,
            audio_preview: audioUrl, // Set preview to same URL for playback
            cover_image: coverImageUrl,
            genre: 'soundpack',
            track_type: 'sample',
            bpm: null,
            producer_id: producerId
          })
          .select()
          .single();
          
        if (error) throw error;
        return beat;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    });
    
    // Wait for current batch to complete before starting next batch
    const batchResults = await Promise.all(batchPromises);
    uploadedBeats.push(...batchResults);
  }
  
  // Update soundpack file count with actual uploaded count
  await supabase
    .from('soundpacks')
    .update({ file_count: uniqueFiles.length })
    .eq('id', packId);
    
  return uploadedBeats;
};
