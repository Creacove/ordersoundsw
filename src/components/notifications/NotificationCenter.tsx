
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Bell, BellRing } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Effect to mark all as read when the popover/sheet is opened
  React.useEffect(() => {
    if (open && unreadCount > 0) {
      // Small delay to ensure the user sees the notifications before they are marked as read
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [open, unreadCount, markAllAsRead]);

  const NotificationContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h4 className="font-semibold text-base flex items-center gap-2">
          Notifications
        </h4>
        {unreadCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="w-full">
        {isLoading ? (
          <div className="py-2 px-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <BellRing className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No notifications
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[min(500px,65vh)]">
            <AnimatePresence initial={false}>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, backgroundColor: "rgba(var(--primary), 0.05)" }}
                    animate={{ opacity: 1, backgroundColor: "transparent" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onMarkAsUnread={markAsUnread}
                      onDelete={deleteNotification}
                      showActions={true}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </div>
    </>
  );

  return isMobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-[1.3rem] w-[1.3rem]" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-full sm:max-w-md">
        <NotificationContent />
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-[1.3rem] w-[1.3rem]" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(420px,95vw)] p-0 shadow-lg rounded-xl"
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <NotificationContent />
      </PopoverContent>
    </Popover>
  );
}
