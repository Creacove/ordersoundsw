
import React, { useState, memo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ToggleFavoriteButtonProps {
  beatId: string;
  size?: "sm" | "md" | "lg";
  absolutePosition?: boolean;
  onToggleComplete?: (isFavorited: boolean) => void;
}

const ToggleFavoriteButton = memo(function ToggleFavoriteButton({ 
  beatId, 
  size = "md", 
  absolutePosition = true,
  onToggleComplete
}: ToggleFavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useBeats();
  const { user } = useAuth();
  const [isButtonClicked, setIsButtonClicked] = useState(false);

  // Memoize the favorite status to prevent excessive calls
  const favorite = useCallback(() => isFavorite(beatId), [isFavorite, beatId])();

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to add favorites");
      return;
    }
    
    // Prevent double clicks
    if (isButtonClicked) {
      return;
    }
    
    setIsButtonClicked(true);
    
    try {
      const wasAdded = await toggleFavorite(beatId);
      
      // Call the callback to notify parent component
      if (onToggleComplete) {
        onToggleComplete(wasAdded);
      }
      
      // Remove the duplicate toast notification here since useFavorites hook already handles it
    } catch (error) {
      console.error('ToggleFavoriteButton: Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    } finally {
      // Re-enable after a short delay
      setTimeout(() => {
        setIsButtonClicked(false);
      }, 300);
    }
  };
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={`
        ${absolutePosition ? 'absolute top-2 right-2 z-10' : ''}
        ${sizeClasses[size]}
        bg-background/60 backdrop-blur-sm hover:bg-background/80
        ${favorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}
        transition-colors
      `}
      onClick={handleToggleFavorite}
      disabled={isButtonClicked}
    >
      <Heart className={`${iconSizes[size]} ${favorite ? 'fill-current' : ''}`} />
    </Button>
  );
});

export { ToggleFavoriteButton };
