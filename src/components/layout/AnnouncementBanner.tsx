import { useAnnouncement } from '@/hooks/useAnnouncement';

export function AnnouncementBanner() {
  const { announcement, isLoading } = useAnnouncement();

  if (isLoading || !announcement) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm overflow-hidden h-10 md:h-10">
      <div className="relative w-full h-full flex items-center">
        <div className="animate-scroll-announcement whitespace-nowrap text-primary-foreground font-medium text-sm px-4 flex items-center gap-8">
          <span>{announcement.message}</span>
          <span className="text-primary-foreground/50">•</span>
          <span>{announcement.message}</span>
          <span className="text-primary-foreground/50">•</span>
          <span>{announcement.message}</span>
        </div>
        {/* Gradient fade on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-primary/90 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary/90 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
