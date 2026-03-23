
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Info, ChevronRight, ChevronLeft, Save, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadBeat } from "@/lib/beatStorage";
import { createSoundpack, uploadSoundpackFiles } from "@/lib/soundpackStorage";
import { FileOrUrl, isFile } from "@/lib/storage";
import { DetailTab } from "@/components/upload/DetailTab";
import { FilesTab } from "@/components/upload/FilesTab";
import { LicensingTab } from "@/components/upload/LicensingTab";
import { PricingTab } from "@/components/upload/PricingTab";
import { RoyaltiesTab } from "@/components/upload/RoyaltiesTab";
import { useBeatUpload } from "@/hooks/useBeatUpload";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { uploadImage } from "@/lib/imageStorage";
import { supabase } from "@/integrations/supabase/client";
import { useUploadBeatTabs } from "@/hooks/useUploadBeatTabs";
import { validateCurrentTab } from "@/utils/uploadBeatValidation";
import { useOnboardingTracker } from "@/hooks/useOnboardingTracker";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils";

export default function UploadBeat() {
  const tabOrder = ["details", "licensing", "files", "pricing", "royalties"];

  const { 
    activeTab: activeTabFromHook, setActiveTab: setActiveTabFromHook,
    beatDetails, setBeatDetails,
    uploadedFile, setUploadedFile,
    previewFile, setPreviewFile,
    imageFile, setImageFile,
    imagePreview, setImagePreview,
    tags, setTags,
    tagInput, setTagInput,
    collaborators, setCollaborators,
    isPlaying, setIsPlaying,
    isSubmitting, setIsSubmitting,
    selectedLicenseTypes, setSelectedLicenseTypes, stems, setStems,
    processingFiles,
    previewUrl, setPreviewUrl,
    validateForm, handleLicenseTypeChange,
    handleCollaboratorChange, handleRemoveCollaborator, handleAddCollaborator,
    handleRemoveTag, handleAddTag,
    handleBeatChange, handleImageUpload, handlePreviewUpload, handleFullTrackUpload,
    handleStemsUpload, regeneratePreview, licenseOptions, uploadedFileUrl,
    uploadProgress,
    uploadError,
    stemsUrl,
    soundpackFiles,
    soundpackMeta,
    handleSoundpackFilesAdd,
    handleSoundpackFileRemove,
    handleSoundpackFileRename,
    handleSoundpackFilesReorder,
    handleSoundpackClearAll
  } = useBeatUpload();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAndCompleteOnboarding } = useOnboardingTracker();
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [beatId, setBeatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localStemsUrl, setLocalStemsUrl] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const editBeatId = queryParams.get('edit');
    
    if (editBeatId) {
      setBeatId(editBeatId);
      setIsEditMode(true);
      loadBeatDetails(editBeatId);
    }
    
    document.title = editBeatId ? "Edit Beat | OrderSOUNDS" : "Upload New Beat | OrderSOUNDS";
  }, [location]);

  const loadBeatDetails = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: beatData, error } = await supabase
        .from('beats')
        .select(`
          id, title, description, genre, track_type, bpm, key,
          producer_id, audio_file, audio_preview, cover_image, 
          tags, status, license_type, license_terms, stems_url, category,
          basic_license_price_local, basic_license_price_diaspora,
          premium_license_price_local, premium_license_price_diaspora,
          exclusive_license_price_local, exclusive_license_price_diaspora,
          custom_license_price_local, custom_license_price_diaspora
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!beatData) {
        toast.error("Beat not found");
        navigate('/producer/beats');
        return;
      }
      
      if (beatData.stems_url) {
        setLocalStemsUrl(beatData.stems_url);
        if (setStems && beatData.stems_url) {
          setStems({ url: beatData.stems_url });
        }
      }
      
      setBeatDetails({
        title: beatData.title || '',
        description: beatData.description || '',
        genre: beatData.genre || '',
        trackType: beatData.track_type || '',
        bpm: beatData.bpm || 0,
        key: beatData.key || '',
        priceLocal: 10000, 
        priceDiaspora: 25,
        status: beatData.status as "draft" | "published" || 'draft',
        licenseType: beatData.license_type?.split(',')[0] || 'basic',
        licenseTerms: beatData.license_terms || '',
        basicLicensePriceLocal: beatData.basic_license_price_local || 0,
        basicLicensePriceDiaspora: beatData.basic_license_price_diaspora || 0,
        premiumLicensePriceLocal: beatData.premium_license_price_local || 0,
        premiumLicensePriceDiaspora: beatData.premium_license_price_diaspora || 0,
        exclusiveLicensePriceLocal: beatData.exclusive_license_price_local || 0,
        exclusiveLicensePriceDiaspora: beatData.exclusive_license_price_diaspora || 0,
        customLicensePriceLocal: beatData.custom_license_price_local || 0,
        customLicensePriceDiaspora: beatData.custom_license_price_diaspora || 0,
        category: beatData.category || 'Music Beat',
      });
      
      if (beatData.tags && Array.isArray(beatData.tags)) setTags(beatData.tags);
      if (beatData.license_type) setSelectedLicenseTypes(beatData.license_type.split(','));
      if (beatData.audio_file) {
        setPreviewUrl(beatData.audio_preview || null);
        if (setUploadedFile) setUploadedFile({ url: beatData.audio_file });
      }
      if (beatData.cover_image) {
        setImagePreview(beatData.cover_image);
        setImageFile({ url: beatData.cover_image });
      }
      
      const { data: royaltyData, error: royaltyError } = await supabase
        .from('royalty_splits')
        .select('*')
        .eq('beat_id', id);
      
      if (!royaltyError && royaltyData) {
        const mappedCollaborators = royaltyData.map((royalty, index) => ({
          id: index + 1,
          name: royalty.party_name || '',
          role: royalty.party_role || '',
          email: royalty.party_email || '',
          percentage: royalty.percentage || 0
        }));
        if (mappedCollaborators.length > 0) setCollaborators(mappedCollaborators);
      }
    } catch (error) {
      console.error('Error loading beat details:', error);
      toast.error("Failed to load beat data");
    } finally {
      setIsLoading(false);
    }
  };

  const {
    activeTab,
    setActiveTab,
    nextTab,
    prevTab
  } = useUploadBeatTabs(tabOrder, () =>
    validateCurrentTab({
      activeTab: activeTabFromHook,
      beatDetails,
      selectedLicenseTypes,
      imageFile,
      uploadedFile,
      uploadedFileUrl,
      previewFile,
      previewUrl,
      stems,
      collaborators,
      setValidationErrors,
      toast
    })
  );

  const handlePublish = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      if (!imageFile) {
        toast.error("Cover image is required");
        setActiveTab("files");
        return;
      }

      const isSoundpack = beatDetails.category === 'Soundpack';
      if (isSoundpack && soundpackFiles.length === 0) {
        toast.error("Soundpack requires at least one file");
        setActiveTab("files");
        return;
      } else if (!isSoundpack && !uploadedFile && !uploadedFileUrl) {
        toast.error("Audio file is required");
        setActiveTab("files");
        return;
      }

      const producerInfo = {
        id: user?.id || 'anonymous-producer',
        name: user?.name || 'Anonymous Producer'
      };
      
      if (user && collaborators[0].id === 1) {
        collaborators[0].name = user.name || 'Producer';
        collaborators[0].email = user.email || '';
      }
      
      toast.loading(isEditMode ? "Updating beat..." : "Publishing beat...", { id: "publishing-beat" });
      
      let coverImageUrl = '';
      if (imageFile) {
        if (!isFile(imageFile) && 'url' in imageFile) {
          coverImageUrl = imageFile.url;
        } else if (isFile(imageFile)) {
          coverImageUrl = await uploadImage(imageFile, 'covers');
        }
      }

      if (isSoundpack) {
        const soundpackData = await createSoundpack({
          title: beatDetails.title,
          description: beatDetails.description || '',
          genre: beatDetails.genre || 'Various',
          category: beatDetails.category,
          producerId: producerInfo.id,
          coverImageUrl,
          basicLicensePriceLocal: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
          basicLicensePriceDiaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
          premiumLicensePriceLocal: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
          premiumLicensePriceDiaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
          exclusiveLicensePriceLocal: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
          exclusiveLicensePriceDiaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
          customLicensePriceLocal: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceLocal : 0,
          customLicensePriceDiaspora: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceDiaspora : 0,
          licenseType: selectedLicenseTypes.join(','),
          licenseTerms: beatDetails.licenseTerms || ''
        });

        await uploadSoundpackFiles(soundpackData.id, producerInfo.id, soundpackFiles, soundpackMeta, coverImageUrl, 'published');
        await supabase.from('soundpacks').update({ published: true }).eq('id', soundpackData.id);

        toast.success("Soundpack published successfully", { id: "publishing-beat" });
        navigate("/producer/beats");
        return;
      }
      
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        key: beatDetails.key,
        tags: tags,
        category: beatDetails.category,
        basic_license_price_local: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
        basic_license_price_diaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
        premium_license_price_local: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
        premium_license_price_diaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
        exclusive_license_price_local: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
        exclusive_license_price_diaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
        custom_license_price_local: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceLocal : undefined,
        custom_license_price_diaspora: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceDiaspora : undefined,
        status: "published" as const,
        license_type: selectedLicenseTypes.join(','),
        license_terms: beatDetails.licenseTerms || '',
        cover_image: coverImageUrl,
      };
      
      const fullTrackFileOrUrl: FileOrUrl = uploadedFile || { url: uploadedFileUrl };
      const stemsFile = (stems && isFile(stems) && !stemsUrl) ? stems : null;
      let finalPreviewFile: File | null = (previewFile && isFile(previewFile)) ? previewFile : null;
      const previewUrlForUpload = previewUrl || (previewFile && !isFile(previewFile) && 'url' in previewFile ? previewFile.url : '');
      
      let result;
      if (isEditMode && beatId) {
        const { error: updateError } = await supabase.from('beats').update(beatData).eq('id', beatId);
        if (updateError) throw new Error(updateError.message);
        if (collaborators.length > 0) {
          await supabase.from('royalty_splits').delete().eq('beat_id', beatId);
          const collaboratorInserts = collaborators.map(c => ({
            beat_id: beatId,
            party_id: c.id.toString().includes('-') ? c.id.toString() : producerInfo.id,
            party_name: c.name || producerInfo.name,
            party_email: c.email || '',
            party_role: c.role || 'Producer',
            percentage: c.percentage
          }));
          await supabase.from('royalty_splits').insert(collaboratorInserts);
        }
        result = { success: true };
      } else {
        result = await uploadBeat(beatData, fullTrackFileOrUrl, finalPreviewFile, null, stemsFile, producerInfo.id, producerInfo.name, collaborators, selectedLicenseTypes, previewUrlForUpload, stemsUrl);
      }
      
      if (result.success) {
        toast.success(isEditMode ? "Beat updated successfully" : "Beat published successfully", { id: "publishing-beat" });
        if (!isEditMode) checkAndCompleteOnboarding();
        navigate("/producer/beats");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error publishing beat:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: "publishing-beat" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      if (!imageFile) {
        toast.error("Cover image is required to save a draft");
        setActiveTab("files");
        return;
      }

      const isSoundpack = beatDetails.category === 'Soundpack';
      if (isSoundpack && soundpackFiles.length === 0) {
        toast.error("Soundpack requires at least one file to save a draft");
        setActiveTab("files");
        return;
      }
      
      const producerInfo = { id: user?.id || 'anonymous-producer', name: user?.name || 'Anonymous Producer' };
      toast.loading(`Saving draft...`, { id: "saving-draft" });
      
      let coverImageUrl = '';
      if (imageFile) {
        if (!isFile(imageFile) && 'url' in imageFile) coverImageUrl = imageFile.url;
        else if (isFile(imageFile)) coverImageUrl = await uploadImage(imageFile, 'covers');
      }

      if (isSoundpack) {
        const soundpackData = await createSoundpack({
          title: beatDetails.title,
          description: beatDetails.description || '',
          genre: beatDetails.genre || 'Various',
          category: beatDetails.category,
          producerId: producerInfo.id,
          coverImageUrl,
          basicLicensePriceLocal: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
          basicLicensePriceDiaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
          premiumLicensePriceLocal: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
          premiumLicensePriceDiaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
          exclusiveLicensePriceLocal: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
          exclusiveLicensePriceDiaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
          customLicensePriceLocal: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceLocal : 0,
          customLicensePriceDiaspora: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceDiaspora : 0,
          licenseType: selectedLicenseTypes.join(','),
          licenseTerms: beatDetails.licenseTerms || ''
        });

        await uploadSoundpackFiles(soundpackData.id, producerInfo.id, soundpackFiles, soundpackMeta, coverImageUrl, 'draft');
        toast.success("Draft saved successfully", { id: "saving-draft" });
        navigate("/producer/beats");
        return;
      }
      
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        key: beatDetails.key,
        tags: tags,
        category: beatDetails.category,
        basic_license_price_local: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
        basic_license_price_diaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
        premium_license_price_local: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
        premium_license_price_diaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
        exclusive_license_price_local: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
        exclusive_license_price_diaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
        custom_license_price_local: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceLocal : undefined,
        custom_license_price_diaspora: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceDiaspora : undefined,
        status: "draft" as const,
        license_type: selectedLicenseTypes.join(','),
        license_terms: beatDetails.licenseTerms || '',
        cover_image: coverImageUrl,
      };
      
      const fullTrackFileOrUrl: FileOrUrl = uploadedFile || { url: uploadedFileUrl };
      const stemsFile = (stems && isFile(stems) && !stemsUrl) ? stems : null;
      let finalPreviewFile: File | null = (previewFile && isFile(previewFile)) ? previewFile : null;
      const previewUrlForUpload = previewUrl || (previewFile && !isFile(previewFile) && 'url' in previewFile ? previewFile.url : '');
      
      let result;
      if (isEditMode && beatId) {
        await supabase.from('beats').update(beatData).eq('id', beatId);
        if (collaborators.length > 0) {
          await supabase.from('royalty_splits').delete().eq('beat_id', beatId);
          const collaboratorInserts = collaborators.map(c => ({
            beat_id: beatId,
            party_id: c.id.toString().includes('-') ? c.id.toString() : producerInfo.id,
            party_name: c.name || producerInfo.name,
            party_email: c.email || '',
            party_role: c.role || 'Producer',
            percentage: c.percentage
          }));
          await supabase.from('royalty_splits').insert(collaboratorInserts);
        }
        result = { success: true };
      } else {
        result = await uploadBeat(beatData, fullTrackFileOrUrl, finalPreviewFile, null, stemsFile, producerInfo.id, producerInfo.name, collaborators, selectedLicenseTypes, previewUrlForUpload, stemsUrl);
      }
      
      if (result.success) {
        toast.success("Draft saved", { id: "saving-draft" });
        navigate("/producer/beats");
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Save failed", { id: "saving-draft" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (validationErrors.title) setActiveTab("details");
    else if (validationErrors.licenseType || validationErrors.licenseTerms) setActiveTab("licensing");
    else if (validationErrors.coverImage || validationErrors.fullTrack) setActiveTab("files");
    else if (validationErrors.basicPrice || validationErrors.premiumPrice || validationErrors.exclusivePrice || validationErrors.customPrice) setActiveTab("pricing");
    else if (validationErrors.royalties || Object.keys(validationErrors).some(key => key.startsWith("collaborator_"))) setActiveTab("royalties");
  }, [validationErrors]);

  if (!user || user.role !== "producer") return null;

  return (
    <div className="container py-6 md:py-12 px-3 md:px-6 max-w-7xl pb-32">
      <ScrollToTop />
      
      <div className="mb-12">
        <SectionTitle 
          title={isEditMode ? "Edit Beat" : "Upload New Beat"} 
          icon={<Upload className="h-6 w-6" />}
        />
        <p className="text-white/40 italic mt-2 text-lg">Provide detailed information and upload files for your track.</p>
      </div>

      <div className="relative p-[1px] rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent">
        <div className="bg-[#030407] rounded-[1.9rem] md:rounded-[2.9rem] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-[#9A3BDC]" />
              <p className="text-white/40 font-black uppercase italic tracking-widest text-sm animate-pulse">Loading Beat Data...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-white/5 bg-white/[0.01]">
                {/* Scrollable tab bar for mobile */}
                <div className="overflow-x-auto scrollbar-none">
                  <TabsList className="bg-transparent h-16 md:h-20 p-0 flex min-w-max px-4 md:px-12 gap-1 md:gap-0">
                    {tabOrder.map((tab, idx) => (
                      <TabsTrigger 
                        key={tab} 
                        value={tab} 
                        className="bg-transparent border-none px-3 md:p-0 font-black uppercase italic tracking-widest text-[10px] md:text-sm data-[state=active]:text-white text-white/20 transition-all gap-1.5 relative h-full flex items-center shrink-0 md:flex-1 justify-center"
                      >
                        <span className="opacity-20 hidden md:inline">0{idx + 1}.</span> {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#9A3BDC] rounded-t-full shadow-[0_-4px_10px_rgba(154,59,220,0.5)]" />}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              <div className="p-4 md:p-12 min-h-[500px]">
                <TabsContent value="details" className="mt-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-4xl mx-auto">
                    <DetailTab 
                      beatDetails={beatDetails}
                      handleBeatChange={handleBeatChange}
                      setBeatDetails={setBeatDetails}
                      tags={tags}
                      tagInput={tagInput}
                      setTagInput={setTagInput}
                      handleAddTag={handleAddTag}
                      handleRemoveTag={handleRemoveTag}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="licensing" className="mt-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-4xl mx-auto">
                    <LicensingTab 
                      beatDetails={beatDetails}
                      handleBeatChange={handleBeatChange}
                      licenseOptions={licenseOptions}
                      handleLicenseTypeChange={handleLicenseTypeChange}
                      selectedLicenseTypes={selectedLicenseTypes}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="files" className="mt-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-5xl mx-auto">
                    <FilesTab 
                      imagePreview={imagePreview}
                      handleImageUpload={handleImageUpload}
                      uploadedFile={uploadedFile}
                      setUploadedFile={setUploadedFile}
                      handleFullTrackUpload={handleFullTrackUpload}
                      previewFile={previewFile}
                      setPreviewFile={setPreviewFile}
                      isPlaying={isPlaying}
                      setIsPlaying={setIsPlaying}
                      selectedLicenseTypes={selectedLicenseTypes}
                      stems={stems}
                      setStems={setStems}
                      processingFiles={processingFiles}
                      uploadProgress={uploadProgress}
                      regeneratePreview={regeneratePreview}
                      previewUrl={previewUrl}
                      setPreviewUrl={setPreviewUrl}
                      handlePreviewUpload={handlePreviewUpload}
                      handleStemsUpload={handleStemsUpload}
                      uploadError={uploadError}
                      stemsUrl={localStemsUrl || stemsUrl}
                      beatDetails={beatDetails}
                      soundpackFiles={soundpackFiles}
                      soundpackMeta={soundpackMeta}
                      onSoundpackFilesAdd={handleSoundpackFilesAdd}
                      onSoundpackFileRemove={handleSoundpackFileRemove}
                      onSoundpackFileRename={handleSoundpackFileRename}
                      onSoundpackFilesReorder={handleSoundpackFilesReorder}
                      onSoundpackClearAll={handleSoundpackClearAll}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-4xl mx-auto">
                    <PricingTab 
                      beatDetails={beatDetails}
                      setBeatDetails={setBeatDetails}
                      selectedLicenseTypes={selectedLicenseTypes}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="royalties" className="mt-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-4xl mx-auto">
                    <RoyaltiesTab 
                      collaborators={collaborators}
                      handleRemoveCollaborator={handleRemoveCollaborator}
                      handleCollaboratorChange={handleCollaboratorChange}
                      handleAddCollaborator={handleAddCollaborator}
                    />
                  </div>
                </TabsContent>
              </div>

              <div className="p-4 md:p-8 border-t border-white/5 bg-white/[0.01] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button 
                  variant="ghost" 
                  onClick={prevTab}
                  disabled={activeTab === "details"}
                  className="rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white px-6 h-12 font-black uppercase italic tracking-tighter disabled:opacity-20 w-full sm:w-auto"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {activeTab !== "royalties" ? (
                    <Button 
                      onClick={nextTab}
                      className="rounded-2xl bg-white text-black px-10 h-12 font-black uppercase italic tracking-tighter hover:bg-white/90 w-full sm:w-auto"
                    >
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={handleSaveDraft}
                        disabled={isSubmitting}
                        className="rounded-2xl border border-white/10 bg-white/5 text-white px-6 h-12 font-black uppercase italic tracking-tighter flex gap-2 hover:bg-white/10 w-full sm:w-auto justify-center"
                      >
                        <Save className="h-4 w-4" /> {isSubmitting ? "Saving..." : "Save Draft"}
                      </Button>
                      <Button
                        onClick={handlePublish}
                        disabled={isSubmitting}
                        className="rounded-2xl bg-[#9A3BDC] text-white px-10 h-12 font-black uppercase italic tracking-tighter shadow-[0_0_20px_rgba(154,59,220,0.4)] flex gap-2 hover:bg-[#9A3BDC]/90 w-full sm:w-auto justify-center"
                      >
                        <Globe className="h-4 w-4" /> {isSubmitting ? "Publishing..." : "Publish Beat"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Tabs>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 md:p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 border-dashed max-w-4xl mx-auto hidden sm:block">
        <div className="flex items-start gap-4">
           <Info className="h-5 w-5 text-[#9A3BDC] mt-1 shrink-0" />
           <div>
             <h4 className="font-black text-white italic tracking-tighter uppercase mb-2">Tips for a successful upload</h4>
             <p className="text-sm text-white/30 italic leading-relaxed">
               Ensure your audio files are high-quality (WAV or 320kbps MP3). Provide clear metadata and tags to help buyers find your work. Royalties are calculated automatically based on your split settings.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
