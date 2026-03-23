import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProfileFormProps {
  initialProducerName: string;
  initialBio: string;
  initialLocation: string;
}

export function ProfileForm({ initialProducerName, initialBio, initialLocation }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [producerName, setProducerName] = useState(initialProducerName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const { user, updateProfile, forceUserDataRefresh } = useAuth();
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use AuthContext updateProfile instead of direct Supabase calls
      await updateProfile({
        ...user,
        producer_name: producerName,
        bio: bio,
        country: location
      });
      
      // Force refresh user data to update topbar display
      await forceUserDataRefresh();
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setSaveSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Label htmlFor="stageName" className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Current Alias / Stage Name</Label>
        <Input 
          id="stageName" 
          placeholder="Enter your professional moniker" 
          value={producerName}
          onChange={(e) => setProducerName(e.target.value)}
          className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
        />
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Producer Manifesto / Bio</Label>
        <textarea 
          id="bio" 
          className="w-full min-h-40 p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] text-white placeholder:text-white/10 italic font-medium focus:ring-1 focus:ring-[#9A3BDC]/50 transition-all outline-none resize-none"
          placeholder="Broadcast your creative philosophy to potential collaborators..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Geographic Coordinates / Location</Label>
        <Input 
          id="location" 
          placeholder="e.g. Lagos, Nigeria / London, UK" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
        />
      </div>
      
      <div className="flex items-center gap-6 pt-4">
        <Button 
          className="h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter px-10 hover:bg-white/90 disabled:opacity-50 transition-all shadow-xl"
          onClick={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </div>
          ) : saveSuccess ? (
            <div className="flex items-center justify-center w-full">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Synced</span>
            </div>
          ) : (
            <span>Update Profile</span>
          )}
        </Button>
        
        {saveSuccess && (
          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic animate-pulse">Changes committed to registry</span>
        )}
      </div>
    </div>
  );
}
