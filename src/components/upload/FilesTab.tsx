import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileAudio, FileUp, Image, Play, Pause, Upload, X, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAudio } from "@/hooks/useAudio";
import { toast } from "sonner";
import { FileOrUrl, isFile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { SoundpackFilesUpload, type SoundFileMeta } from "./SoundpackFilesUpload";

type FilesTabProps = {
  imagePreview: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFile: FileOrUrl | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<FileOrUrl | null>>;
  handleFullTrackUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewFile: FileOrUrl | null;
  setPreviewFile: React.Dispatch<React.SetStateAction<FileOrUrl | null>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLicenseTypes: string[];
  stems: FileOrUrl | null;
  setStems: React.Dispatch<React.SetStateAction<FileOrUrl | null>>;
  processingFiles: boolean;
  uploadProgress?: { [key: string]: number };
  regeneratePreview?: () => Promise<void>;
  previewUrl?: string | null;
  setPreviewUrl?: React.Dispatch<React.SetStateAction<string | null>>;
  handlePreviewUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStemsUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError?: string | null;
  stemsUrl?: string | null;
  uploadedFileUrl?: string;
  beatDetails: { category: string };
  // Soundpack props
  soundpackFiles?: File[];
  soundpackMeta?: SoundFileMeta[];
  onSoundpackFilesAdd?: (files: FileList) => void;
  onSoundpackFileRemove?: (id: string) => void;
  onSoundpackFileRename?: (id: string, newName: string) => void;
  onSoundpackFilesReorder?: (fromIndex: number, toIndex: number) => void;
  onSoundpackClearAll?: () => void;
};

export const FilesTab = ({
  imagePreview,
  handleImageUpload,
  uploadedFile,
  setUploadedFile,
  handleFullTrackUpload,
  previewFile,
  setPreviewFile,
  isPlaying,
  setIsPlaying,
  selectedLicenseTypes,
  stems,
  setStems,
  processingFiles,
  uploadProgress = {},
  regeneratePreview,
  previewUrl,
  setPreviewUrl,
  handlePreviewUpload,
  handleStemsUpload,
  uploadError,
  stemsUrl,
  uploadedFileUrl,
  beatDetails,
  soundpackFiles = [],
  soundpackMeta = [],
  onSoundpackFilesAdd,
  onSoundpackFileRemove,
  onSoundpackFileRename,
  onSoundpackFilesReorder,
  onSoundpackClearAll
}: FilesTabProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [previewLoadingTimeout, setPreviewLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [previewLoadingFailed, setPreviewLoadingFailed] = useState(false);
  const [stemUploadError, setStemUploadError] = useState<string | null>(null);
  
  const isSoundpack = beatDetails.category === 'Soundpack';
  const hasExclusiveLicense = selectedLicenseTypes.includes('exclusive');
  const hasPremiumLicense = selectedLicenseTypes.includes('premium');
  const requiresWavFormat = (hasExclusiveLicense || hasPremiumLicense) && 
                           beatDetails.category !== 'Gaming & Soundtrack';
  
  const previewObjectUrl = previewFile && isFile(previewFile) 
    ? URL.createObjectURL(previewFile) 
    : '';
    
  const audioPreviewUrl = previewUrl || previewObjectUrl || '';
  
  const { 
    playing: isAudioPlaying, 
    togglePlay: toggleAudioPlay,
    duration: audioDuration,
    isReady: audioIsReady,
    error: audioError,
    reload: reloadAudio
  } = useAudio(audioPreviewUrl);
  
  const hasStemsData = stems !== null || stemsUrl !== null && stemsUrl !== undefined;

  useEffect(() => {
    setIsPlaying(isAudioPlaying);
  }, [isAudioPlaying, setIsPlaying]);

  useEffect(() => {
    if (audioIsReady && audioPreviewUrl) {
      console.log(`Audio preview ready - Duration: ${audioDuration}s, URL: ${audioPreviewUrl}`);
      setPreviewLoadingFailed(false);
      
      // Clear any existing timeout when preview is ready
      if (previewLoadingTimeout) {
        clearTimeout(previewLoadingTimeout);
        setPreviewLoadingTimeout(null);
      }
    }
  }, [audioDuration, audioIsReady, audioPreviewUrl, previewLoadingTimeout]);

  useEffect(() => {
    if (processingFiles && !audioIsReady && !audioError && !previewLoadingFailed) {
      const timeoutId = setTimeout(() => {
        setPreviewLoadingFailed(true);
        console.log("Preview generation timed out after 30 seconds");
      }, 30000); // 30 seconds timeout
      
      setPreviewLoadingTimeout(timeoutId);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [processingFiles, audioIsReady, audioError, previewLoadingFailed]);

  useEffect(() => {
    if (audioError) {
      setPreviewLoadingFailed(true);
      console.log("Audio preview error detected:", audioError);
      
      // Clear any existing timeout when there's an error
      if (previewLoadingTimeout) {
        clearTimeout(previewLoadingTimeout);
        setPreviewLoadingTimeout(null);
      }
    }
  }, [audioError, previewLoadingTimeout]);

  useEffect(() => {
    if (uploadedFile && isFile(uploadedFile) && uploadProgress[uploadedFile.name] !== undefined) {
      console.log(`Progress update for ${uploadedFile.name}: ${uploadProgress[uploadedFile.name]}%`);
    }
  }, [uploadedFile, uploadProgress]);

  useEffect(() => {
    if (stems && isFile(stems) && uploadProgress[stems.name] !== undefined) {
      console.log(`Stems progress update for ${stems.name}: ${uploadProgress[stems.name]}%`);
    }
  }, [stems, uploadProgress]);

  useEffect(() => {
    if (uploadError && uploadedFile && previewUrl) {
      if (uploadError.includes('stem') || 
          (stems && isFile(stems) && uploadError.includes(stems.name))) {
        setStemUploadError(uploadError);
        return;
      }
    }
  }, [uploadError, uploadedFile, previewUrl, stems]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const getAcceptedAudioTypes = () => {
    if (requiresWavFormat) {
      return "audio/wav";
    }
    return ".mp3,.wav,audio/*";
  };
  
  const getAudioInstructions = () => {
    if (requiresWavFormat) {
      return "WAV format required for premium/exclusive licenses (max 70MB)";
    }
    return "MP3, WAV (max 70MB)";
  };
  
  useEffect(() => {
    if (!requiresWavFormat && 
        uploadedFile && 
        isFile(uploadedFile) &&
        uploadedFile.type === "audio/wav") {
      setValidationError("You've selected a basic license but uploaded a WAV file. For basic licenses, MP3 is recommended.");
    } else if (requiresWavFormat && 
              uploadedFile && 
              isFile(uploadedFile) &&
              uploadedFile.type === "audio/mpeg") {
      setValidationError("Premium and exclusive licenses require WAV format. Please upload a WAV file.");
    } else {
      setValidationError(null);
    }
  }, [uploadedFile, requiresWavFormat]);

  const handleFullTrackUploadInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 70 * 1024 * 1024) {
        toast.error("File must be less than 70MB");
        return;
      }
      
      if (requiresWavFormat && file.type !== "audio/wav" && !file.name.endsWith('.wav')) {
        setValidationError("WAV format required for premium/exclusive licenses");
        return;
      }
      
      setRetryCount(0);
      setValidationError(null);
      
      handleFullTrackUpload(e);
    }
  };

  const handleStemsUploadInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 250 * 1024 * 1024) {
        setStemUploadError("Stems file must be less than 250MB");
        toast.error("Stems file must be less than 250MB");
        return;
      }
      
      const isZip = file.type === "application/zip" || 
                    file.type === "application/x-zip-compressed" || 
                    file.name.endsWith('.zip');
                    
      if (!isZip) {
        setStemUploadError("Stems file must be a ZIP archive");
        toast.error("Stems file must be a ZIP archive");
        return;
      }
      
      console.log("Stem file selected:", file.name, "type:", file.type, "size:", (file.size / (1024 * 1024)).toFixed(2) + "MB");
      toast.info(`Starting upload of ${(file.size / (1024 * 1024)).toFixed(2)}MB stems file. This may take several minutes for large files.`, {
        duration: 8000,
        id: "stems-upload-start"
      });
      setStems(file);
      setStemUploadError(null);
      
      if (handleStemsUpload) {
        handleStemsUpload(e);
      }
    }
  };

  const handlePreviewUploadInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handlePreviewUpload) {
      handlePreviewUpload(e);
      setPreviewLoadingFailed(false);
      return;
    }
    
    if (e.target.files && e.target.files[0]) {
      setPreviewFile(e.target.files[0]);
      setPreviewLoadingFailed(false);
    }
  };

  const getFileNameFromFileOrUrl = (file: FileOrUrl | null): string => {
    if (!file) return '';
    if (isFile(file)) return file.name;
    return 'Uploaded file';
  };

  const getFileSizeFromFileOrUrl = (file: FileOrUrl | null): string => {
    if (!file) return '';
    if (isFile(file)) return `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    return '';
  };

  const renderProgressBar = (file: File | null, progressValue: number | undefined) => {
    if (!file || progressValue === undefined) return null;
    
    const safeValue = Math.min(100, Math.max(0, progressValue));
    
    let statusMessage = `Uploading: ${safeValue}%`;
    if (safeValue === 0) {
      statusMessage = "Preparing upload...";
    } else if (safeValue === 100) {
      statusMessage = "Upload complete";
    } else if (safeValue > 0 && safeValue < 100) {
      statusMessage = `Uploading: ${safeValue}%`;
      
      if (file.size > 50 * 1024 * 1024) {
        const uploadedMB = (file.size / (1024 * 1024) * (safeValue / 100)).toFixed(1);
        const totalMB = (file.size / (1024 * 1024)).toFixed(1);
        statusMessage += ` (${uploadedMB}/${totalMB} MB)`;
      }
    }
    
    return (
      <div className="mt-2">
        <div className="relative">
          <Progress 
            value={safeValue} 
            className="h-1.5 bg-gray-200" 
          />
          {safeValue > 0 && safeValue < 100 && (
            <div className="absolute right-0 top-0 transform -translate-y-1/2" 
                 style={{ right: `${100 - safeValue}%` }}>
              <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          {safeValue > 0 && safeValue < 100 && (
            <span className="w-3 h-3 mr-1 rounded-full border-2 border-t-transparent border-primary animate-spin inline-block"></span>
          )}
          {statusMessage}
        </p>
      </div>
    );
  };

  const handlePreviewClear = () => {
    setPreviewFile(null);
    if (setPreviewUrl) {
      setPreviewUrl(null);
    }
    setPreviewLoadingFailed(false);
  };

  const handleStemsClear = () => {
    setStems(null);
  };

  const getStemsFileName = () => {
    if (stems && isFile(stems)) {
      return stems.name;
    } else if (stemsUrl) {
      const urlParts = stemsUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return fileName.split('?')[0] || "stems.zip";
    }
    return "stems.zip";
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 mb-24 sm:mb-16">
      {/* Cover Image Section */}
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Cover Image *</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Upload a high quality square image (recommended size: 1000x1000px)
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-4 text-center ${
              imagePreview ? "border-primary/50" : "border-muted hover:border-muted-foreground/50"
            } transition-colors cursor-pointer`}
            onClick={() => document.getElementById("coverImage")?.click()}
          >
            {imagePreview ? (
              <div className="relative aspect-square rounded-md overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm">Click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Image className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF, max 5MB</p>
              </div>
            )}
            <input 
              id="coverImage" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          
          {/* Conditional rendering: Soundpack or Beat files */}
          {isSoundpack ? (
            <div className="sm:col-span-1">
              <Alert>
                <AlertDescription className="text-xs">
                  Soundpacks use multi-file upload. Add your audio files in the section below.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Full Track *</h4>
              <div 
                className={`border rounded-lg p-3 flex items-center gap-3 ${
                  uploadedFile ? "bg-primary/5 border-primary/30" : "border-muted"
                } transition-colors`}
              >
                {uploadedFile ? (
                  <>
                    <FileAudio className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {getFileNameFromFileOrUrl(uploadedFile)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFileSizeFromFileOrUrl(uploadedFile)}
                        {requiresWavFormat && uploadedFile && isFile(uploadedFile) && 
                         uploadedFile.type !== "audio/wav" && !uploadedFile.name.endsWith('.wav') && (
                          <span className="text-destructive ml-2">WAV format required</span>
                        )}
                      </p>
                      
                      {uploadedFile && isFile(uploadedFile) && 
                       uploadProgress[uploadedFile.name] !== undefined && (
                        renderProgressBar(uploadedFile, uploadProgress[uploadedFile.name])
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <FileAudio className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium">Upload full track</p>
                      <p className="text-xs text-muted-foreground">{getAudioInstructions()}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("fullTrack")?.click()}
                      className="px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Upload</span>
                      <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                    </Button>
                    <input 
                      id="fullTrack" 
                      type="file" 
                      className="hidden" 
                      accept={getAcceptedAudioTypes()}
                      onChange={handleFullTrackUploadInternal}
                    />
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Preview Track</h4>
              <div 
                className={cn(
                  "border rounded-lg p-3 flex items-center gap-3",
                  previewFile || previewUrl ? "bg-primary/5 border-primary/30" : "border-muted",
                  (uploadError || previewLoadingFailed || audioError) ? "border-destructive/50 bg-destructive/5" : "",
                  "transition-colors"
                )}
              >
                {(previewFile || previewUrl) ? (
                  <>
                    <button
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${(uploadError || previewLoadingFailed || audioError) ? "bg-destructive" : "bg-primary"} text-primary-foreground flex items-center justify-center`}
                      onClick={toggleAudioPlay}
                      disabled={!audioPreviewUrl || audioError || previewLoadingFailed}
                    >
                      {(uploadError || previewLoadingFailed || audioError) ? <AlertTriangle size={14} /> : 
                        isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {(uploadError || previewLoadingFailed || audioError) ? "Preview failed to load" : 
                          previewFile && isFile(previewFile) ? previewFile.name : "Preview.mp3"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadError || previewLoadingFailed || audioError) ? (
                          <span className="text-destructive flex items-center">
                            <AlertTriangle size={12} className="mr-1" />
                            Failed to generate preview. Please upload manually.
                          </span>
                        ) : previewFile && isFile(previewFile) ? 
                          `${(previewFile.size / (1024 * 1024)).toFixed(2)} MB` : 
                          audioPreviewUrl && audioIsReady && audioDuration > 0 ? 
                            `Preview ready (${formatDuration(audioDuration)})` : 
                            "Loading preview..."}
                      </p>
                      
                      {previewFile && isFile(previewFile) && 
                       uploadProgress[previewFile.name] !== undefined && (
                        renderProgressBar(previewFile, uploadProgress[previewFile.name])
                      )}
                    </div>
                    {regeneratePreview && !previewLoadingFailed && !audioError && !uploadError && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          regeneratePreview();
                        }}
                        className="mr-1"
                        disabled={processingFiles}
                      >
                        {processingFiles ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                      </Button>
                    )}
                    
                    {(uploadError || previewLoadingFailed || audioError) && (
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => document.getElementById("previewTrack")?.click()}
                        className="mr-1 px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Upload Preview</span>
                        <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                      </Button>
                    )}
                    <input 
                      id="previewTrack" 
                      type="file" 
                      className="hidden" 
                      accept="audio/mpeg"
                      onChange={handlePreviewUploadInternal}
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewClear();
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <FileAudio className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium">
                        {processingFiles ? "Generating preview..." : "Upload or generate preview"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {processingFiles && !previewLoadingFailed ? (
                          <span className="flex items-center">
                            <span className="w-3 h-3 mr-2 rounded-full border-2 border-t-transparent border-primary animate-spin inline-block"></span>
                            Processing audio...
                          </span>
                        ) : (
                          "Automatic preview generation available, or upload a 30-second MP3"
                        )}
                      </p>
                      {(uploadError || previewLoadingFailed) && !processingFiles && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Preview generation failed. Please upload a preview manually.
                        </p>
                      )}
                    </div>
                    {processingFiles && !previewLoadingFailed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></span>
                        Processing
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant={(uploadError || previewLoadingFailed) ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => document.getElementById("previewTrack")?.click()}
                          className="px-2 sm:px-3"
                        >
                          <span className="hidden sm:inline">Upload Preview</span>
                          <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                        </Button>
                        <input 
                          id="previewTrack" 
                          type="file" 
                          className="hidden" 
                          accept="audio/mpeg"
                          onChange={handlePreviewUploadInternal}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
              {processingFiles && !previewLoadingFailed && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Preview generation can take up to 30 seconds. Please be patient or upload manually.
                </p>
              )}
              {previewLoadingFailed && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Automatic preview generation failed. Please upload a 30-second MP3 manually.
                </p>
              )}
            </div>

            {hasExclusiveLicense && (
              <div>
                <h4 className="text-sm font-medium mb-1">Stems (Optional for Exclusive)</h4>
                <div 
                  className={`border rounded-lg p-3 flex items-center gap-3 ${
                    hasStemsData ? "bg-primary/5 border-primary/30" : "border-muted"
                  } ${stemUploadError ? "border-destructive/50" : ""} transition-colors`}
                >
                  {hasStemsData ? (
                    <>
                      <FileUp className={`h-6 w-6 sm:h-8 sm:w-8 ${stemUploadError ? "text-destructive" : "text-primary"}`} />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {getStemsFileName()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isFile(stems) ? `${(stems.size / (1024 * 1024)).toFixed(2)} MB` : stemsUrl ? "Stems file uploaded" : ""}
                        </p>
                        
                        {isFile(stems) && uploadProgress[stems.name] !== undefined && (
                          renderProgressBar(stems, uploadProgress[stems.name])
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStemsClear();
                          setStemUploadError(null);
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium">Upload stems</p>
                        <p className="text-xs text-muted-foreground">ZIP file, max 250MB</p>
                        <p className="text-xs text-muted-foreground mt-1">For large files, allow time for upload to complete</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById("stems")?.click()}
                        className="px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Upload</span>
                        <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                      </Button>
                      <input 
                        id="stems" 
                        type="file" 
                        className="hidden" 
                        accept=".zip,application/zip,application/x-zip-compressed" 
                        onChange={handleStemsUploadInternal}
                      />
                    </>
                  )}
                </div>
                {stemUploadError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="ml-2 text-xs">
                      Stems upload error: {stemUploadError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Soundpack Files Section */}
        {isSoundpack && onSoundpackFilesAdd && onSoundpackFileRemove && 
         onSoundpackFileRename && onSoundpackFilesReorder && onSoundpackClearAll && (
          <SoundpackFilesUpload
            soundFiles={soundpackFiles}
            soundFilesMeta={soundpackMeta}
            onFilesAdd={onSoundpackFilesAdd}
            onFileRemove={onSoundpackFileRemove}
            onFileRename={onSoundpackFileRename}
            onFilesReorder={onSoundpackFilesReorder}
            onClearAll={onSoundpackClearAll}
            uploadProgress={uploadProgress}
          />
        )}

        {validationError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {uploadError && !stemUploadError && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2 text-xs">
              Upload error: {uploadError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
