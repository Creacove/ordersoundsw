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
  const slug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
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
  onProgress?: (fileIndex: number, progress: number) => void
) => {
  const uploadedBeats = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const meta = filesMeta[i];
    
    try {
      // Upload audio file
      const audioUrl = await uploadFile(file, 'beats', `soundpacks/${packId}`, (progress) => {
        onProgress?.(i, progress);
      });
      
      // Create beat record
      const { data: beat, error } = await supabase
        .from('beats')
        .insert({
          title: meta.name.replace(/\.[^/.]+$/, ''), // Remove extension
          soundpack_id: packId,
          type: 'soundpack_item',
          status: 'published',
          audio_file: audioUrl,
          cover_image: coverImageUrl,
          genre: 'soundpack',
          track_type: 'sample',
          bpm: 0,
          producer_id: producerId
        })
        .select()
        .single();
        
      if (error) throw error;
      uploadedBeats.push(beat);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }
  
  // Update soundpack file count
  await supabase
    .from('soundpacks')
    .update({ file_count: files.length })
    .eq('id', packId);
    
  return uploadedBeats;
};
