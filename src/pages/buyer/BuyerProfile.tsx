
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Playlist } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getUserPlaylists } from "@/lib/playlistService"; 
import { ProfileHeader } from "@/components/buyer/profile/ProfileHeader";
import { ProfileTabs } from "@/components/buyer/profile/ProfileTabs";
import { ProfileLoading } from "@/components/buyer/profile/ProfileLoading";
import { NotFound } from "@/components/shared/NotFound";

export default function BuyerProfile() {
  const { buyerId } = useParams<{ buyerId: string }>();
  const { user: currentUser } = useAuth();
  const [buyer, setBuyer] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const isOwnProfile = currentUser?.id === buyerId;

  useEffect(() => {
    document.title = buyer?.name ? `${buyer.name} | OrderSOUNDS` : "User Profile | OrderSOUNDS";
  }, [buyer]);

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!buyerId) return;

      setIsLoading(true);
      try {
        // Get buyer details
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, bio, profile_picture, country, music_interests')
          .eq('id', buyerId)
          .single();

        if (error) throw error;

        setBuyer({
          id: data.id,
          name: data.full_name,
          bio: data.bio,
          avatar_url: data.profile_picture,
          country: data.country,
          music_interests: data.music_interests || []
        });

        // If this is the user's own profile or if we're looking at public playlists,
        // fetch their playlists
        if (isOwnProfile || currentUser) {
          fetchUserPlaylists();
        }
      } catch (error) {
        console.error('Error fetching buyer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuyer();
  }, [buyerId, currentUser, isOwnProfile]);

  const fetchUserPlaylists = async () => {
    if (!buyerId) return;

    setIsLoadingPlaylists(true);
    try {
      if (isOwnProfile) {
        // Get all playlists if it's the user's own profile
        const userPlaylists = await getUserPlaylists(buyerId);
        setPlaylists(userPlaylists);
      } else {
        // Only get public playlists for other users
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('owner_id', buyerId)
          .eq('is_public', true);

        if (error) throw error;
        setPlaylists(data as unknown as Playlist[]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6">
      {isLoading ? (
        <ProfileLoading />
      ) : buyer ? (
        <>
          <ProfileHeader 
            buyer={buyer} 
            playlists={playlists} 
            isOwnProfile={isOwnProfile} 
          />
          
          <div className="mt-8">
            <ProfileTabs 
              buyer={buyer} 
              playlists={playlists} 
              isLoadingPlaylists={isLoadingPlaylists} 
              isOwnProfile={isOwnProfile} 
            />
          </div>
        </>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
