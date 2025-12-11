
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Bell, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  const NotificationContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h4 className="font-medium text-base flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </h4>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full rounded-none border-b">
          <TabsTrigger value="all" className="text-xs py-2">All</TabsTrigger>
          <TabsTrigger value="unread" className="text-xs py-2">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none">
          {isLoading ? (
            <div className="py-2 px-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <BellRing className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-foreground">
                {activeTab === 'all' 
                  ? 'No notifications' 
                  : 'No unread notifications'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
                {activeTab === 'all'
                  ? "We'll notify you when something important happens"
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[min(500px,70vh)]">
              <AnimatePresence>
                <div className="py-1">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <NotificationItem 
                        notification={notification} 
                        onMarkAsRead={markAsRead}
                        onMarkAsUnread={markAsUnread}
                        onDelete={deleteNotification}
                        showActions={true}
                      />
                      <Separator className={cn(
                        filteredNotifications[filteredNotifications.length - 1].id !== notification.id ? "opacity-100" : "opacity-0"
                      )} />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
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
