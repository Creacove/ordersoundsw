import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAnnouncement } from '@/hooks/useAnnouncement';

export function AnnouncementBanner() {
  const { announcement, isLoading } = useAnnouncement();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (announcement) {
      const dismissed = localStorage.getItem(`announcement_dismissed_${announcement.id}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [announcement?.id]);

  const handleDismiss = () => {
    if (announcement) {
      setIsDismissed(true);
      localStorage.setItem(`announcement_dismissed_${announcement.id}`, 'true');
    }
  };

  if (isLoading || !announcement || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm overflow-hidden h-10 md:h-10">
      <div className="relative w-full h-full flex items-center">
        <div className="flex animate-scroll-announcement">
          <div className="flex items-center gap-8 whitespace-nowrap text-primary-foreground font-medium text-sm px-4">
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
          </div>
          <div className="flex items-center gap-8 whitespace-nowrap text-primary-foreground font-medium text-sm px-4">
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
            <span>{announcement.message}</span>
            <span className="text-primary-foreground/50">•</span>
          </div>
        </div>
        {/* Gradient fade on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-primary/90 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary/90 to-transparent pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Close announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-sm opacity-50 hover:opacity-100 hover:bg-white/10 transition-all duration-200 text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
