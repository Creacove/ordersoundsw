
import { User } from "@/types";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/user/settings/ProfileForm";
import { PreferencesForm } from "@/components/user/settings/PreferencesForm";
import { AccountForm } from "@/components/user/settings/AccountForm";
import { User as UserIcon } from "@/components/ui/user";
import { Shield, Settings as SettingsIcon } from "lucide-react";

interface BuyerTabsProps {
  user: User;
}

export function BuyerTabs({ user }: BuyerTabsProps) {
  return (
    <>
      <TabsList className="border-b w-full mb-6 md:mb-8 rounded-none p-0 h-auto bg-transparent">
        <TabsTrigger value="profile" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-4">
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="account" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-4">
          <Shield className="mr-2 h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-4">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Profile Information</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm 
              initialProducerName=""
              initialBio={user.bio || ""}
              initialLocation={user.country || ''}
              avatarUrl={user.avatar_url || null}
              displayName={user.name || 'User'}
              isBuyer={true}
              initialFullName={user.name || ''}
              initialMusicInterests={user.music_interests || []}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Account Security</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm 
              userEmail={user.email}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Preferences</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Customize your experience
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
