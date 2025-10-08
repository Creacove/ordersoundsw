
import { toast } from "sonner";
import { FileOrUrl, isFile } from "@/lib/storage";
import { Collaborator } from "@/hooks/useBeatUpload";

type ValidationArgs = {
  activeTab: string;
  beatDetails: {
    title: string;
    description: string;
    genre: string;
    trackType: string;
    licenseType: string;
    licenseTerms: string;
    basicLicensePriceLocal: number;
    basicLicensePriceDiaspora: number;
    premiumLicensePriceLocal: number;
    premiumLicensePriceDiaspora: number;
    exclusiveLicensePriceLocal: number;
    exclusiveLicensePriceDiaspora: number;
    customLicensePriceLocal: number;
    customLicensePriceDiaspora: number;
    category: string;
  };
  selectedLicenseTypes: string[];
  imageFile: FileOrUrl | null;
  uploadedFile: FileOrUrl | null;
  uploadedFileUrl: string;
  previewFile: FileOrUrl | null;
  previewUrl: string | null;
  stems: FileOrUrl | null;
  collaborators: Collaborator[];
  setValidationErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  toast: typeof toast;
};

export const validateCurrentTab = ({
  activeTab,
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
}: ValidationArgs): boolean => {
  const errors: { [key: string]: string } = {};

  switch (activeTab) {
    case "details":
      if (!beatDetails.title) {
        errors.title = "Beat title is required";
      }
      if (!beatDetails.genre) {
        errors.genre = "Genre is required";
      }
      // Track type is only required for beats, not soundpacks
      if (beatDetails.category !== 'Soundpack' && !beatDetails.trackType) {
        errors.trackType = "Track type is required";
      }
      break;

    case "licensing":
      if (selectedLicenseTypes.length === 0) {
        errors.licenseType = "At least one license type is required";
      }
      if (selectedLicenseTypes.includes('custom') && !beatDetails.licenseTerms) {
        errors.licenseTerms = "Custom license terms are required";
      }
      break;

    case "files":
      if (!imageFile) {
        errors.coverImage = "Cover image is required";
      }
      if (!uploadedFile && !uploadedFileUrl) {
        errors.fullTrack = "Full track file is required";
      }
      if (!previewFile && !previewUrl) {
        errors.preview = "Preview track is required";
      }
      
      // For stems, we only validate the format if one is provided, but don't require it
      if (stems && isFile(stems) && 
          stems.type !== "application/zip" && 
          !stems.name.endsWith('.zip')) {
        errors.stems = "Stems must be a ZIP file";
      }
      
      // Check WAV format requirement for premium/exclusive licenses
      // Exception: Gaming & Soundtrack category allows MP3 even for premium/exclusive
      const requiresWavFormat = (selectedLicenseTypes.includes('premium') || 
                               selectedLicenseTypes.includes('exclusive')) &&
                               beatDetails.category !== 'Gaming & Soundtrack';
      
      if (requiresWavFormat && uploadedFile && isFile(uploadedFile) &&
          uploadedFile.type !== "audio/wav" && 
          !uploadedFile.name.endsWith('.wav')) {
        errors.fullTrackFormat = "Premium and exclusive licenses require WAV format";
      }
      break;

    case "pricing":
      if (selectedLicenseTypes.includes('basic')) {
        if (!beatDetails.basicLicensePriceLocal || beatDetails.basicLicensePriceLocal <= 0) {
          errors.basicPrice = "Basic license local price must be greater than 0";
        }
        if (!beatDetails.basicLicensePriceDiaspora || beatDetails.basicLicensePriceDiaspora <= 0) {
          errors.basicPrice = "Basic license diaspora price must be greater than 0";
        }
      }
      
      if (selectedLicenseTypes.includes('premium')) {
        if (!beatDetails.premiumLicensePriceLocal || beatDetails.premiumLicensePriceLocal <= 0) {
          errors.premiumPrice = "Premium license local price must be greater than 0";
        }
        if (!beatDetails.premiumLicensePriceDiaspora || beatDetails.premiumLicensePriceDiaspora <= 0) {
          errors.premiumPrice = "Premium license diaspora price must be greater than 0";
        }
      }
      
      if (selectedLicenseTypes.includes('exclusive')) {
        if (!beatDetails.exclusiveLicensePriceLocal || beatDetails.exclusiveLicensePriceLocal <= 0) {
          errors.exclusivePrice = "Exclusive license local price must be greater than 0";
        }
        if (!beatDetails.exclusiveLicensePriceDiaspora || beatDetails.exclusiveLicensePriceDiaspora <= 0) {
          errors.exclusivePrice = "Exclusive license diaspora price must be greater than 0";
        }
      }
      
      if (selectedLicenseTypes.includes('custom')) {
        if (!beatDetails.customLicensePriceLocal || beatDetails.customLicensePriceLocal <= 0) {
          errors.customPrice = "Custom license local price must be greater than 0";
        }
        if (!beatDetails.customLicensePriceDiaspora || beatDetails.customLicensePriceDiaspora <= 0) {
          errors.customPrice = "Custom license diaspora price must be greater than 0";
        }
      }
      break;

    case "royalties":
      const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
      if (totalPercentage !== 100) {
        errors.royalties = "Collaborator percentages must sum to 100%";
      }
      
      collaborators.forEach((collab, index) => {
        if (!collab.name) {
          errors[`collaborator_${index}_name`] = `Collaborator #${index + 1} name is required`;
        }
        if (!collab.role) {
          errors[`collaborator_${index}_role`] = `Collaborator #${index + 1} role is required`;
        }
        if (collab.percentage <= 0) {
          errors[`collaborator_${index}_percentage`] = `Collaborator #${index + 1} percentage must be greater than 0`;
        }
      });
      break;
  }

  setValidationErrors(errors);

  if (Object.keys(errors).length > 0) {
    const errorMessage = Object.values(errors)[0];
    toast.error(errorMessage);
    return false;
  }

  return true;
};
