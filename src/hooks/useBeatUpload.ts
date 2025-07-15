import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, FileOrUrl, isFile } from "@/lib/storage";
import { uploadImage } from "@/lib/imageStorage";
import { createMp3Preview } from "@/utils/audioPreview";

export type LicenseOption = {
  value: string;
  label: string;
  description: string;
  terms: string;
};

export type BeatDetails = {
  title: string;
  description: string;
  genre: string;
  trackType: string;
  bpm: number;
  key: string;
  priceLocal: number;
  priceDiaspora: number;
  basicLicensePriceLocal: number;
  basicLicensePriceDiaspora: number;
  premiumLicensePriceLocal: number;
  premiumLicensePriceDiaspora: number;
  exclusiveLicensePriceLocal: number;
  exclusiveLicensePriceDiaspora: number;
  status: "draft" | "published";
  licenseType: string;
  licenseTerms: string;
  customLicensePriceLocal: number;
  customLicensePriceDiaspora: number;
  category: string;
};

export type Collaborator = {
  id: number;
  name: string;
  email: string;
  role: string;
  percentage: number;
};

export function useBeatUpload() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileOrUrl | null>(null);
  const [previewFile, setPreviewFile] = useState<FileOrUrl | null>(null);
  const [imageFile, setImageFile] = useState<FileOrUrl | null>(null);
  const [stems, setStems] = useState<FileOrUrl | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState<string[]>(['basic']);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stemsUrl, setStemsUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stemsUploadError, setStemsUploadError] = useState<string | null>(null);

  const [beatDetails, setBeatDetails] = useState<BeatDetails>({
    title: "",
    description: "",
    genre: "",
    trackType: "",
    bpm: 90,
    key: "Not Sure",
    priceLocal: 10000,
    priceDiaspora: 25,
    basicLicensePriceLocal: 5000,
    basicLicensePriceDiaspora: 15,
    premiumLicensePriceLocal: 10000,
    premiumLicensePriceDiaspora: 25,
    exclusiveLicensePriceLocal: 30000,
    exclusiveLicensePriceDiaspora: 75,
    status: "draft",
    licenseType: "basic",
    licenseTerms: "",
    customLicensePriceLocal: 15000,
    customLicensePriceDiaspora: 40,
    category: "Music Beat",
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 1, name: user?.name || "", email: user?.email || "", role: "Producer", percentage: 100 }
  ]);

  const licenseOptions: LicenseOption[] = [
    {
      value: "basic",
      label: "Basic License",
      description: "Non-exclusive rights, limited distribution (up to 5,000 streams/sales). MP3 format only.",
      terms: "This is a non-exclusive license granting the right to use the beat for one single commercial release with up to 5,000 streams/downloads/sales. No broadcasting rights for radio, TV, or similar platforms. Credit must be given to the producer."
    },
    {
      value: "premium",
      label: "Premium License",
      description: "Non-exclusive rights, unlimited distribution, some broadcasting rights. WAV format included.",
      terms: "This is a non-exclusive license granting the right to use the beat for one single commercial release with unlimited streams/downloads/sales. Includes limited broadcasting rights (for online videos, podcasts). Credit must be given to the producer."
    },
    {
      value: "exclusive",
      label: "Exclusive License",
      description: "Full ownership transfer, all rights to the beat (limited to one buyer). WAV + Stems included.",
      terms: "This is an exclusive license transferring full ownership rights to the beat. The producer retains credits as the original creator but transfers all commercial exploitation rights to the buyer. The beat will be removed from all marketplaces after purchase."
    },
    {
      value: "custom",
      label: "Custom License",
      description: "Define your own terms and conditions.",
      terms: ""
    }
  ];

  const handleBeatChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBeatDetails({
      ...beatDetails,
      [name]: value,
    });
  };

  const handleFullTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 70 * 1024 * 1024) {
        toast.error("File must be less than 70MB");
        return;
      }
      
      const requiresWavFormat = (selectedLicenseTypes.includes('premium') || 
                               selectedLicenseTypes.includes('exclusive')) &&
                               beatDetails.category !== 'Gaming & Soundtrack';
                              
      if (requiresWavFormat && file.type !== "audio/wav" && !file.name.endsWith('.wav')) {
        toast.error("Premium and exclusive licenses require WAV format");
        return;
      }
      
      setUploadedFile(file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      setPreviewFile(null);
      setPreviewUrl(null);
      setUploadError(null);
      
      try {
        toast.info(`Uploading full track`, {
          duration: 10000,
          id: "upload-track"
        });

        const url = await uploadFile(file, 'beats', 'full-tracks', (progress) => {
          console.log(`Upload progress for ${file.name}: ${progress}%`);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          
          // Update toast silently without showing percentage
          if (progress === 100) {
            toast.success("Full track uploaded", { id: "upload-track" });
          }
        });
        
        setUploadedFileUrl(url);
        toast.success("Full track uploaded successfully");

        toast.info("Processing audio and generating preview", {
          id: "processing-audio"
        });
        await generatePreview(url);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadError(error.message || "Failed to upload file");
        toast.error(error.message || "Failed to upload file. Please try again.");
      }
    }
  };

  const generatePreview = async (fileUrl: string) => {
    try {
      setProcessingFiles(true);
      setPreviewUrl(null);
      setPreviewFile(null);
      
      const timestampedUrl = fileUrl.includes('?') 
        ? `${fileUrl}&t=${Date.now()}` 
        : `${fileUrl}?t=${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: { 
          fullTrackUrl: timestampedUrl,
          requiresWav: selectedLicenseTypes.includes('premium') || selectedLicenseTypes.includes('exclusive')
        }
      });
      
      if (error) {
        console.error("Error processing audio:", error);
        toast.error("Server preview generation failed. Trying client-side generation...", {
          id: "processing-audio"
        });
        
        if (uploadedFile && isFile(uploadedFile)) {
          try {
            const previewBlob = await createMp3Preview(uploadedFile);
            const previewObjectUrl = URL.createObjectURL(previewBlob);
            setPreviewUrl(previewObjectUrl);
            toast.success("Preview generated locally", {
              id: "processing-audio"
            });
            setProcessingFiles(false);
            return;
          } catch (clientError) {
            console.error("Client-side preview generation failed:", clientError);
            throw new Error("Failed to generate preview");
          }
        } else {
          throw new Error("No file available for preview generation");
        }
      }

      if (data && data.previewUrl) {
        console.log("Preview generated successfully:", data.previewUrl);
        setPreviewUrl(data.previewUrl);
        toast.success("Audio preview generated successfully", {
          id: "processing-audio"
        });
      } else if (data && data.publicUrl) {
        console.log("Preview generated successfully:", data.publicUrl);
        setPreviewUrl(data.publicUrl);
        toast.success("Audio preview generated successfully", {
          id: "processing-audio"
        });
      } else {
        console.error("No preview URL returned from processing:", data);
        toast.error("Failed to generate audio preview", {
          id: "processing-audio"
        });
        
        if (uploadedFile && isFile(uploadedFile)) {
          toast.info("Trying client-side preview generation...", {
            id: "processing-audio"
          });
          try {
            const previewBlob = await createMp3Preview(uploadedFile);
            const previewObjectUrl = URL.createObjectURL(previewBlob);
            setPreviewUrl(previewObjectUrl);
            toast.success("Preview generated locally", {
              id: "processing-audio"
            });
          } catch (clientError) {
            console.error("Client-side preview generation failed:", clientError);
            toast.error("Failed to generate preview locally", {
              id: "processing-audio"
            });
          }
        }
      }
      
      setProcessingFiles(false);
    } catch (error) {
      console.error("Error in audio processing:", error);
      toast.error("Failed to process audio. Please try again.", {
        id: "processing-audio"
      });
      setProcessingFiles(false);
    }
  };

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Preview file must be less than 10MB");
        return;
      }
      
      if (file.type !== "audio/mpeg" && !file.name.endsWith('.mp3')) {
        toast.error("Preview file must be in MP3 format");
        return;
      }
      
      setPreviewFile(file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      uploadPreviewFile(file);
    }
  };
  
  const uploadPreviewFile = async (file: File) => {
    try {
      toast.info("Uploading preview...");
      
      const url = await uploadFile(file, 'beats', 'previews', (progress) => {
        console.log(`Preview upload progress: ${progress}%`);
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      });
      
      setPreviewUrl(url);
      toast.success("Preview uploaded");
    } catch (error) {
      console.error("Error uploading preview:", error);
      toast.error("Failed to upload preview. Please try again.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Cover image must be less than 5MB");
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error("Cover image must be JPG, PNG, or GIF format");
        return;
      }

      try {
        toast.info("Uploading cover image...", { id: "image-upload" });
        
        // Upload image to storage and get URL instead of base64
        const imageUrl = await uploadImage(file, 'covers');
        
        // Set both the image file reference and preview URL
        setImageFile({ url: imageUrl });
        setImagePreview(imageUrl);
        
        toast.success("Cover image uploaded successfully", { id: "image-upload" });
      } catch (error) {
        console.error("Error uploading cover image:", error);
        toast.error("Failed to upload cover image. Please try again.", { id: "image-upload" });
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      } else {
        toast.error("Tag already exists");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCollaborator = () => {
    if (collaborators.length >= 5) {
      toast.error("Maximum 5 collaborators allowed");
      return;
    }
    
    setCollaborators([
      ...collaborators,
      { id: Date.now(), name: "", email: "", role: "", percentage: 0 }
    ]);
  };

  const handleRemoveCollaborator = (id: number) => {
    if (collaborators.length <= 1) {
      toast.error("At least one collaborator is required");
      return;
    }
    
    const removedCollaborator = collaborators.find(c => c.id === id);
    const remainingCollaborators = collaborators.filter(c => c.id !== id);
    
    if (removedCollaborator && remainingCollaborators.length > 0) {
      const percentageToDistribute = removedCollaborator.percentage;
      const equalShare = percentageToDistribute / remainingCollaborators.length;
      
      const updatedCollaborators = remainingCollaborators.map(c => ({
        ...c,
        percentage: Math.round(c.percentage + equalShare)
      }));
      
      setCollaborators(updatedCollaborators);
    }
  };

  const handleCollaboratorChange = (id: number, field: string, value: string | number) => {
    setCollaborators(prev => 
      prev.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleLicenseTypeChange = (value: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedLicenseTypes(prev => [...prev, value]);
      
      if (value === 'custom') {
        const customOption = licenseOptions.find(option => option.value === 'custom');
        if (customOption) {
          setBeatDetails({
            ...beatDetails,
            licenseTerms: beatDetails.licenseTerms || customOption.terms
          });
        }
      }
    } else {
      setSelectedLicenseTypes(prev => prev.filter(type => type !== value));
    }
    
    if (isChecked && beatDetails.licenseType === '') {
      setBeatDetails({
        ...beatDetails,
        licenseType: value
      });
    } else if (!isChecked && beatDetails.licenseType === value) {
      const newLicenseTypes = selectedLicenseTypes.filter(type => type !== value);
      if (newLicenseTypes.length > 0) {
        setBeatDetails({
          ...beatDetails,
          licenseType: newLicenseTypes[0]
        });
      } else {
        setBeatDetails({
          ...beatDetails,
          licenseType: ''
        });
      }
    }
    
    if (uploadedFile) {
      const requiresWavFormat = (value === 'premium' || value === 'exclusive') && isChecked &&
                               beatDetails.category !== 'Gaming & Soundtrack';
      
      if (isFile(uploadedFile)) {
        const hasWav = uploadedFile.type === "audio/wav" || uploadedFile.name.endsWith('.wav');
        
        if (requiresWavFormat && !hasWav) {
          toast.warning("Premium and exclusive licenses require WAV format. Please upload a WAV file.");
        }
      }
    }
  };

  const validateForm = () => {
    if (!beatDetails.title) {
      toast.error("Beat title is required");
      return false;
    }
    
    if (!uploadedFile && !uploadedFileUrl) {
      toast.error("Full track file is required");
      return false;
    }
    
    if (!imageFile) {
      toast.error("Cover image is required");
      return false;
    }
    
    if (!beatDetails.genre) {
      toast.error("Genre is required");
      return false;
    }
    
    if (!beatDetails.trackType) {
      toast.error("Track type is required");
      return false;
    }
    
    if (!beatDetails.category) {
      toast.error("Category is required");
      return false;
    }
    
    if (selectedLicenseTypes.length === 0) {
      toast.error("At least one license type is required");
      return false;
    }
    
    if (selectedLicenseTypes.includes('custom') && !beatDetails.licenseTerms) {
      toast.error("Custom license terms are required");
      return false;
    }
    
    const requiresWavFormat = (selectedLicenseTypes.includes('premium') || 
                               selectedLicenseTypes.includes('exclusive')) &&
                               beatDetails.category !== 'Gaming & Soundtrack';
    
    if (requiresWavFormat && uploadedFile && isFile(uploadedFile) &&
        uploadedFile.type !== "audio/wav" && 
        !uploadedFile.name.endsWith('.wav')) {
      toast.error("Premium and exclusive licenses require WAV format");
      return false;
    }
    
    if (selectedLicenseTypes.includes('exclusive') && 
        stems && isFile(stems) && 
        stems.type !== "application/zip" && 
        !stems.name.endsWith('.zip')) {
      toast.error("Stems must be a ZIP file");
      return false;
    }
    
    if (!previewUrl && !previewFile) {
      toast.error("Preview track is required. Please try re-uploading the full track or upload a separate preview");
      return false;
    }
    
    const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 100) {
      toast.error("Collaborator percentages must sum to 100%");
      return false;
    }
    
    return true;
  };

  const regeneratePreview = async () => {
    if (!uploadedFileUrl) {
      toast.error("Please upload a full track first");
      return;
    }
    
    try {
      toast.info("Regenerating preview...");
      await generatePreview(uploadedFileUrl);
    } catch (error) {
      console.error("Failed to regenerate preview:", error);
      toast.error("Failed to regenerate preview. Please try again.");
    }
  };

  const handleStemsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 250 * 1024 * 1024) {
        toast.error("Stems file must be less than 250MB");
        return;
      }
      
      const isZip = file.type === "application/zip" || 
                    file.type === "application/x-zip-compressed" || 
                    file.name.endsWith('.zip');
                    
      if (!isZip) {
        toast.error("Stems file must be a ZIP archive");
        return;
      }
      
      setStems(file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      setStemsUrl(null);
      setStemsUploadError(null);
      
      try {
        toast.info("Uploading stems", { id: "stems-upload" });
        
        const url = await uploadFile(file, 'beats', 'stems', (progress) => {
          console.log(`Stems upload progress: ${progress}%`);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });
        
        setStemsUrl(url);
        toast.success("Stems uploaded successfully", { id: "stems-upload" });
      } catch (error) {
        console.error("Error uploading stems:", error);
        setStemsUploadError(error.message || "Failed to upload stems");
        toast.error("Failed to upload stems. Please try again.", { id: "stems-upload" });
      }
    }
  };

  const uploadStemsFile = async (file: File) => {
    try {
      toast.info("Uploading stems", { id: "stems-upload" });
      
      const url = await uploadFile(file, 'beats', 'stems', (progress) => {
        console.log(`Stems upload progress: ${progress}%`);
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      });
      
      setStemsUrl(url);
      toast.success("Stems uploaded", { id: "stems-upload" });
      return url;
    } catch (error) {
      console.error("Error uploading stems:", error);
      setStemsUploadError(error.message || "Failed to upload stems");
      toast.error("Failed to upload stems. Please try again.", { id: "stems-upload" });
      throw error;
    }
  };

  return {
    activeTab, setActiveTab,
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
    selectedLicenseTypes, setSelectedLicenseTypes,
    stems, setStems,
    processingFiles, setProcessingFiles,
    previewUrl, setPreviewUrl,
    uploadProgress,
    validateForm,
    handleLicenseTypeChange,
    handleCollaboratorChange,
    handleRemoveCollaborator,
    handleAddCollaborator,
    handleRemoveTag,
    handleAddTag,
    handleBeatChange,
    handleImageUpload,
    handlePreviewUpload,
    handleFullTrackUpload,
    handleStemsUpload,
    regeneratePreview,
    licenseOptions,
    uploadedFileUrl,
    setUploadedFileUrl,
    uploadError,
    uploadStemsFile,
    stemsUrl,
    setStemsUrl,
    stemsUploadError,
    setStemsUploadError
  };
}
