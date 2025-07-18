
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { UserCheck, UserPlus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface FollowButtonProps {
  producerId: string;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function FollowButton({
  producerId,
  initialFollowState,
  onFollowChange,
  size = 'default',
  variant = 'default',
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth();
  const { useFollowStatus, toggleFollow } = useFollows();
  const { data: isFollowing, isLoading: isStatusLoading } = useFollowStatus(producerId);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Use initialFollowState if provided and isFollowing is not loaded yet
  const followState = isFollowing ?? initialFollowState ?? false;
  
  // Debounce the follow state to prevent UI flicker
  const debouncedFollowState = useDebounce(followState, 100);
  
  const handleFollowToggle = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to follow this producer');
      return;
    }
    
    // Prevent rapid successive clicks (debounce)
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      return;
    }
    setLastClickTime(now);
    
    // Prevent multiple concurrent requests
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await toggleFollow(producerId, debouncedFollowState);
      if (result && onFollowChange) {
        onFollowChange(!debouncedFollowState);
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
      toast.error("Could not update follow status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, producerId, debouncedFollowState, isLoading, lastClickTime, toggleFollow, onFollowChange]);
  
  return (
    <Button
      onClick={handleFollowToggle}
      size={size}
      variant={debouncedFollowState ? 'secondary' : variant}
      disabled={isLoading || isStatusLoading}
      className={className}
      data-following={debouncedFollowState}
    >
      {isLoading ? (
        'Loading...'
      ) : debouncedFollowState ? (
        <>
          <UserCheck className="mr-2 size-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-2 size-4" />
          Follow
        </>
      )}
    </Button>
  );
}
