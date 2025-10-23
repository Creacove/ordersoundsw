
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Producer } from "@/hooks/useProducers";
import { Skeleton } from "@/components/ui/skeleton";

interface ProducersListProps {
  producers: Producer[];
  isLoading: boolean;
  isMobile: boolean;
  searchQuery: string;
  showFollowedContent?: boolean;
  user: any;
}

export function ProducersList({
  producers,
  isLoading,
  isMobile,
  searchQuery,
  showFollowedContent,
  user
}: ProducersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const isEmptyState = showFollowedContent && producers.length === 0;
  const isEmptySearch = producers.length === 0 && searchQuery.trim() !== '';
  
  if (isEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#121212] rounded-xl">
        <div className="text-center max-w-md px-4">
          <h3 className="text-xl font-semibold mb-2">
            {user ? "You're not following any producers yet" : "Sign in to see producers you follow"}
          </h3>
          <p className="text-gray-400 mb-6">
            {user 
              ? "Discover producers and follow them to stay updated with new beats"
              : "Create an account or sign in to follow your favorite producers"
            }
          </p>
        </div>
      </div>
    );
  }
  
  if (isEmptySearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#121212] rounded-xl">
        <div className="text-center max-w-md px-4">
          <h3 className="text-xl font-semibold mb-2">No producers found</h3>
          <p className="text-gray-400 mb-6">
            No producers match your search for "{searchQuery}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {producers.map((producer) => (
        <Link 
          to={`/producer/${producer.id}`}
          key={producer.id} 
          className="flex items-center p-4 bg-[#121212] rounded-xl hover:bg-[#1a1a1a] transition-colors"
        >
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 mr-4">
            <AvatarImage 
              src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
              alt={producer.stage_name || producer.full_name} 
            />
            <AvatarFallback>
              {(producer.stage_name || producer.full_name || 'P').charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-medium text-base sm:text-lg text-white truncate">
                {producer.stage_name || producer.full_name}
              </h3>

              {/* Activity indicators based on beat count */}
              {producer.beatCount > 20 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Very Active
                </Badge>
              )}
              {producer.beatCount > 10 && producer.beatCount <= 20 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </Badge>
              )}
              {producer.beatCount > 0 && producer.beatCount <= 10 && (
                <Badge variant="outline" className="text-xs">
                  Getting Started
                </Badge>
              )}

              {searchQuery && (producer.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              producer.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) && (
                <Badge variant="secondary" className="bg-purple-700/30 text-purple-300 text-xs">Match</Badge>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                {producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}
              </span>
              <span className="hidden xs:inline-block">•</span>
              <FollowerCount 
                count={producer.follower_count || 0} 
                className="text-xs sm:text-sm text-gray-400"
              />
            </div>
            {producer.bio && (
              <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-1">{producer.bio}</p>
            )}
          </div>
          
          <div onClick={(e) => e.stopPropagation()} className="ml-2 sm:ml-4">
            <FollowButton 
              producerId={producer.id}
              size={isMobile ? "sm" : "default"}
              variant="outline"
              className="bg-transparent hover:bg-[#323232] text-sm data-[following=true]:bg-purple-700 data-[following=true]:hover:bg-purple-800 border-gray-700"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
