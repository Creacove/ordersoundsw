
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";
import { ProducerWalletDetailsForm } from "@/components/payment/ProducerWalletDetailsForm";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  DollarSign,
  User,
  KeyRound,
  Wallet,
  Shield,
  Cog,
  Layout
} from "lucide-react";
import { ProfileForm } from "@/components/producer/settings/ProfileForm";
import { ProfilePictureUploader } from "@/components/producer/settings/ProfilePictureUploader";
import { PaymentStatsSection } from "@/components/producer/settings/PaymentStatsSection";
import { PreferencesForm } from "@/components/producer/settings/PreferencesForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function ProducerSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [producerSettings, setProducerSettings] = useState<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    autoPlayPreviews: boolean;
  }>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    autoPlayPreviews: true,
  });
  const [producerData, setProducerData] = useState<{
    bank_code?: string;
    account_number?: string;
    verified_account_name?: string;
    paystack_subaccount_code?: string;
    paystack_split_code?: string;
    wallet_address?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";

    if (!user) {
      navigate("/login", { state: { from: "/producer/settings" } });
    } else if (user.role !== "producer") {
      navigate("/");
    }

    if (user?.settings) {
      try {
        const settings =
          typeof user.settings === "string"
            ? JSON.parse(user.settings)
            : user.settings;

        setProducerSettings({
          emailNotifications: settings.emailNotifications !== false,
          pushNotifications: settings.pushNotifications !== false,
          smsNotifications: settings.smsNotifications === true,
          autoPlayPreviews: settings.autoPlayPreviews !== false,
        });
      } catch (e) {
        console.error("Error parsing user settings:", e);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchProducerData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            "bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code, wallet_address"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching producer data:", error);
          return;
        }

        setProducerData(data);
      } catch (error) {
        console.error("Error fetching producer data:", error);
      }
    };

    fetchProducerData();
  }, [user]);

  const handleBankDetailsSuccess = () => {
    if (user) {
      supabase
        .from("users")
        .select("bank_code, account_number, verified_account_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            console.log("Updated bank details:", data);
          }
        });
    }
  };

  const handleWalletUpdateSuccess = () => {
    if (user) {
      supabase
        .from("users")
        .select("wallet_address")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error refreshing wallet data:", error);
            return;
          }
          if (data) {
            setProducerData(prev => ({...(prev || {}), wallet_address: data.wallet_address}));
            toast.success("Wallet address updated successfully");
          }
        });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("New password must include at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error("New password must include at least one number");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast.error("New password must include at least one special character");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    try {
      setIsChangingPassword(true);

      if (!user?.email) {
        toast.error("Unable to verify your current session");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setIsChangingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(`Password update failed: ${updateError.message}`);
        setIsChangingPassword(false);
        return;
      }

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("An error occurred during verification");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user || user.role !== "producer") {
    return null;
  }

  return (
    <div className="container py-8 md:py-16 px-4 md:px-8 max-w-7xl relative">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-[#9A3BDC]/5 blur-[120px] -mr-[10vw] -mt-[10vh] pointer-events-none" />
      
      <div className="mb-16">
        <SectionTitle 
          title="Producer Dashboard" 
          icon={<Cog className="h-6 w-6" />}
          badge="SETTINGS"
        />
        <p className="text-white/40 italic mt-2 text-lg font-medium">Manage your public profile, payment methods, and account preferences.</p>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-16">
        <div className="border-b border-white/5 pb-8 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent border-none p-0 flex space-x-10 min-w-max">
              <TabsTrigger value="profile" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative">
                Public Profile
                {activeTab === 'profile' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
              <TabsTrigger value="payment" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative">
                Payment Info
                {activeTab === 'payment' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative">
                Notifications
                {activeTab === 'preferences' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
              <TabsTrigger value="account" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative">
                Account Security
                {activeTab === 'account' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full" />}
              </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="profile" className="outline-none space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
            <div className="bg-[#030407] rounded-[2.4rem] p-8 md:p-12">
              <div className="mb-10 flex flex-col items-center md:items-start gap-8">
                <ProfilePictureUploader
                  avatarUrl={user.avatar_url || null}
                  displayName={user.producer_name || user.name || "User"}
                />
                <div className="w-full h-px bg-white/5" />
              </div>

              <ProfileForm
                initialProducerName={user.producer_name || user.name || ""}
                initialBio={user.bio || ""}
                initialLocation={user.country || ""}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="outline-none space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-[#9A3BDC]/20 to-transparent">
               <div className="bg-[#030407] rounded-[2.4rem] p-8 h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#9A3BDC]/10 flex items-center justify-center text-[#9A3BDC]">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-white italic tracking-tighter uppercase text-xl">USDC Wallet</h3>
                      <p className="text-white/30 text-[10px] uppercase font-black tracking-widest italic">For international payouts</p>
                    </div>
                  </div>
                  <ProducerWalletDetailsForm
                    producerId={user.id}
                    walletAddress={producerData?.wallet_address}
                    onSuccess={handleWalletUpdateSuccess}
                  />
               </div>
             </div>

             <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 to-transparent">
               <div className="bg-[#030407] rounded-[2.4rem] p-8 h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-white italic tracking-tighter uppercase text-xl">Local Bank</h3>
                      <p className="text-white/30 text-[10px] uppercase font-black tracking-widest italic">For local currency payouts</p>
                    </div>
                  </div>
                  <ProducerBankDetailsForm
                    producerId={user.id}
                    existingBankCode={producerData?.bank_code}
                    existingAccountNumber={producerData?.account_number}
                    existingAccountName={producerData?.verified_account_name}
                    onSuccess={handleBankDetailsSuccess}
                  />
               </div>
             </div>
          </div>

          <PaymentStatsSection
            userId={user.id}
            hasVerifiedAccount={!!producerData?.verified_account_name}
            verifiedAccountName={producerData?.verified_account_name}
          />
        </TabsContent>

        <TabsContent value="preferences" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
            <div className="bg-[#030407] rounded-[2.4rem] p-8 md:p-12">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white italic tracking-tighter uppercase text-xl">Notifications</h3>
                  <p className="text-white/30 text-[10px] uppercase font-black tracking-widest italic">Configure how you receive updates</p>
                </div>
              </div>
              
              <PreferencesForm
                initialEmailNotifications={producerSettings.emailNotifications}
                initialPushNotifications={producerSettings.pushNotifications}
                initialSmsNotifications={producerSettings.smsNotifications}
                initialAutoPlayPreviews={producerSettings.autoPlayPreviews}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
            <div className="bg-[#030407] rounded-[2.4rem] p-8 md:p-12">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white italic tracking-tighter uppercase text-xl">Change Password</h3>
                  <p className="text-white/30 text-[10px] uppercase font-black tracking-widest italic">Secure your account access</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-10 max-w-xl">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-3 block border-b border-white/5 pb-2">Password Requirements:</span>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                     {['Min 8 characters', 'One uppercase', 'One number', 'One symbol'].map(req => (
                       <div key={req} className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#9A3BDC]/40" />
                         <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest italic">{req}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter px-10 hover:bg-white/90 disabled:opacity-50 transition-all"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
