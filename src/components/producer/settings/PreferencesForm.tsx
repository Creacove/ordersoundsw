
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CheckCircle, Bell, Volume2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface PreferencesFormProps {
  initialEmailNotifications: boolean;
  initialPushNotifications: boolean;
  initialSmsNotifications: boolean;
  initialAutoPlayPreviews: boolean;
}

export function PreferencesForm({
  initialEmailNotifications,
  initialPushNotifications,
  initialSmsNotifications,
  initialAutoPlayPreviews
}: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [pushNotifications, setPushNotifications] = useState(initialPushNotifications);
  const [smsNotifications, setSmsNotifications] = useState(initialSmsNotifications);
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(initialAutoPlayPreviews);
  const { user, updateProfile } = useAuth();

  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const settings = {
        emailNotifications,
        pushNotifications,
        smsNotifications,
        autoPlayPreviews
      };
      
      const { error } = await supabase
        .from('users')
        .update({
          settings: settings
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      if (updateProfile) {
        await updateProfile({
          ...user,
          settings
        });
        
        toast.success("Preferences updated successfully");
        setSaveSuccess(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error("Failed to update preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-[#9A3BDC]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Notifications</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white italic tracking-tight uppercase">Email Alerts</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                Sales and critical updates
              </p>
            </div>
            <Switch 
              checked={emailNotifications} 
              onCheckedChange={setEmailNotifications}
              className="data-[state=checked]:bg-[#9A3BDC]"
            />
          </div>
          
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white italic tracking-tight uppercase">Desktop Push</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                Real-time activity pings
              </p>
            </div>
            <Switch 
              checked={pushNotifications} 
              onCheckedChange={setPushNotifications} 
              className="data-[state=checked]:bg-[#9A3BDC]"
            />
          </div>
          
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white italic tracking-tight uppercase">SMS Direct</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                Important account security
              </p>
            </div>
            <Switch 
              checked={smsNotifications} 
              onCheckedChange={setSmsNotifications} 
              className="data-[state=checked]:bg-[#9A3BDC]"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-[#9A3BDC]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Interface Experience</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white italic tracking-tight uppercase">Auto-Play Previews</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                Stream beats on hover/view
              </p>
            </div>
            <Switch 
              checked={autoPlayPreviews} 
              onCheckedChange={setAutoPlayPreviews}
              className="data-[state=checked]:bg-[#9A3BDC]"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center gap-6">
        <Button 
          className="h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter px-10 hover:bg-white/90 disabled:opacity-50 transition-all w-full md:w-auto overflow-hidden relative"
          onClick={handleSavePreferences}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </div>
          ) : saveSuccess ? (
            <div className="flex items-center justify-center animate-in zoom-in duration-300">
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Applied</span>
            </div>
          ) : (
            <span>Save Preferences</span>
          )}
        </Button>
        
        {saveSuccess && (
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 italic animate-in fade-in slide-in-from-left-4">
            System preferences updated successfully
          </span>
        )}
      </div>
    </div>
  );
}
