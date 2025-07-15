
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileKey, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BeatDetails, LicenseOption } from "@/hooks/useBeatUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

type LicensingTabProps = {
  beatDetails: BeatDetails;
  handleBeatChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  licenseOptions: LicenseOption[];
  handleLicenseTypeChange: (optionValue: string, isChecked: boolean) => void;
  selectedLicenseTypes: string[];
};

export const LicensingTab = ({
  beatDetails,
  handleBeatChange,
  licenseOptions,
  handleLicenseTypeChange,
  selectedLicenseTypes
}: LicensingTabProps) => {
  const [showLicenseHints, setShowLicenseHints] = useState<{ [key: string]: boolean }>({
    basic: false,
    premium: false,
    exclusive: false,
    custom: false
  });

  const toggleLicenseHint = (license: string) => {
    setShowLicenseHints(prev => ({
      ...prev,
      [license]: !prev[license]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium">Important: License Selection</h3>
          <p className="text-xs text-muted-foreground">
            Select one or more license options for your beat. The license type determines what files buyers will receive and how they can use your beat.
            Each license type requires specific file formats to be uploaded in the next step.
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {selectedLicenseTypes.length === 0 && (
          <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertDescription className="flex items-center">
              <FileKey className="h-4 w-4 mr-2" />
              Please select at least one license type for your beat
            </AlertDescription>
          </Alert>
        )}
      
        {licenseOptions.filter(option => {
          if (beatDetails.category === "Gaming & Soundtrack") {
            return option.value === "exclusive" || option.value === "custom";
          }
          return true;
        }).map((option) => (
          <div key={option.value} className={`border rounded-lg p-4 ${
            selectedLicenseTypes.includes(option.value) ? "border-primary bg-primary/5" : ""
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id={`license-${option.value}`} 
                  checked={selectedLicenseTypes.includes(option.value)}
                  onCheckedChange={(checked) => handleLicenseTypeChange(option.value, !!checked)}
                  className="mt-1" 
                />
                <div>
                  <Label htmlFor={`license-${option.value}`} className="font-medium flex items-center cursor-pointer">
                    {option.label}
                    {option.value === 'basic' && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">MP3</span>
                    )}
                    {option.value === 'premium' && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">WAV</span>
                    )}
                    {option.value === 'exclusive' && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">WAV + Stems</span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  
                  <button 
                    onClick={() => toggleLicenseHint(option.value)}
                    className="text-xs text-primary hover:underline mt-1 flex items-center"
                  >
                    {showLicenseHints[option.value] ? "Hide details" : "Show details"}
                  </button>
                </div>
              </div>
            </div>
            
            {showLicenseHints[option.value] && option.value !== 'custom' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs">
                <div className="mb-2 font-medium">Details:</div>
                <p>{option.terms}</p>
                
                <div className="mt-3 mb-1 font-medium">Required files:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {option.value === 'basic' && (
                    <>
                      <li>MP3 track (original full length)</li>
                      <li>Preview will be auto-generated</li>
                    </>
                  )}
                  {option.value === 'premium' && (
                    <>
                      <li>WAV track (high quality, original full length)</li>
                      <li>Preview will be auto-generated</li>
                    </>
                  )}
                  {option.value === 'exclusive' && (
                    <>
                      <li>WAV track (high quality, original full length)</li>
                      <li>Stems as ZIP file (optional)</li>
                      <li>Preview will be auto-generated</li>
                    </>
                  )}
                </ul>
              </div>
            )}
            
            {option.value === 'custom' ? (
              selectedLicenseTypes.includes('custom') && (
                <div className="mt-4">
                  <Label htmlFor="licenseTerms">Custom License Terms</Label>
                  <Textarea 
                    id="licenseTerms" 
                    name="licenseTerms"
                    value={beatDetails.licenseTerms}
                    onChange={handleBeatChange}
                    placeholder="Describe the terms and conditions of your custom license..." 
                    rows={4}
                    className="mt-1.5"
                  />
                </div>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
