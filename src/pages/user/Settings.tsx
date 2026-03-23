
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProducerTabs } from "@/components/user/settings/ProducerTabs";
import { BuyerTabs } from "@/components/user/settings/BuyerTabs";
import { LoginPrompt } from "@/components/user/settings/LoginPrompt";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function UserSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Settings | OrderSOUNDS";
    
    if (!user) {
      navigate('/login', { state: { from: '/settings' } });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="max-w-md mx-auto p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <ShieldCheck className="h-10 w-10 text-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Sign In Required</h1>
          <p className="text-white/50 italic mb-8">
            You need to be signed in to access your settings.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg bg-white text-black hover:bg-white/90">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12">
        <SectionTitle 
          title={user.role === "producer" ? "Producer Settings" : "Account Settings"} 
          icon={<SettingsIcon className="h-6 w-6" />}
        />
        <p className="text-white/40 italic mt-2">Update your profile and account preferences.</p>
      </div>
      
      <div className={cn(
        "w-full",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <Tabs defaultValue="profile" className="w-full space-y-8">
          {user.role === "producer" ? <ProducerTabs user={user} /> : <BuyerTabs user={user} />}
        </Tabs>
      </div>
    </div>
  );
}
