
import { User } from "@/types";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/user/settings/ProfileForm";
import { PreferencesForm } from "@/components/user/settings/PreferencesForm";
import { User as UserIcon } from "@/components/ui/user";
import { Settings as SettingsIcon } from "lucide-react";
import { WalletDetailsCard } from "@/components/producer/dashboard/WalletDetailsCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProducerTabsProps {
  user: User;
}

export function ProducerTabs({ user }: ProducerTabsProps) {
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch producer data including wallet address
  useEffect(() => {
    const fetchProducerData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProducerData(data);
      } catch (error) {
        console.error("Error fetching producer data:", error);
        toast.error("Failed to load producer data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducerData();
  }, [user.id]);

  const handleWalletUpdateSuccess = () => {
    // Refresh producer data after wallet update
    const refreshData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProducerData(data);
        toast.success("Payment settings updated successfully");
      } catch (error) {
        console.error("Error refreshing producer data:", error);
      }
    };

    refreshData();
  };

  return (
    <>
      <TabsList className="border-b w-full mb-6 md:mb-8 rounded-none p-0 h-auto bg-transparent">
        <TabsTrigger value="profile" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-4">
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="payment" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-4">
          Payment
        </TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-4">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Producer Profile</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Update your producer profile information that will be visible to buyers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm 
              initialProducerName={user.producer_name || ''}
              initialBio={user.bio || ''}
              initialLocation={user.country || ''}
              avatarUrl={user.avatar_url || null}
              displayName={user.producer_name || user.name || 'User'}
              initialMusicInterests={user.music_interests || []}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="payment">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Payment Settings</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Configure how you'll receive payments for your beats
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading payment settings...</div>
            ) : (
              <WalletDetailsCard 
                userId={user.id} 
                producerData={producerData} 
                onSuccess={handleWalletUpdateSuccess} 
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Preferences</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Customize your producer experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PreferencesForm 
              initialEmailNotifications={user.settings?.emailNotifications || true}
              initialPushNotifications={user.settings?.pushNotifications || true}
              initialSmsNotifications={user.settings?.smsNotifications || false}
              initialAutoPlayPreviews={user.settings?.autoPlayPreviews || true}
              initialDefaultCurrency={user.default_currency || 'NGN'}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
