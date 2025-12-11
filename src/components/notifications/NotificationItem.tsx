import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  ShoppingCart, 
  MessageSquare, 
  Star, 
  Award, 
  Bell, 
  CreditCard, 
  Heart, 
  Tag,
  Check,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAsUnread?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  showActions?: boolean;
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onMarkAsUnread, 
  onDelete,
  showActions = true 
}: NotificationItemProps) {
  const navigate = useNavigate();
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-5 w-5 text-emerald-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-amber-500" />;
      case 'feature':
        return <Award className="h-5 w-5 text-purple-500" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case 'favorite':
        return <Heart className="h-5 w-5 text-rose-500" />;
      case 'promo':
        return <Tag className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const handleClick = async () => {
    // Mark as read first
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
      toast.success("Notification marked as read");
    }
    
    // Navigate to related content if applicable
    if (notification.related_entity_id && notification.related_entity_type) {
      switch (notification.related_entity_type) {
        case 'beat':
          navigate(`/beat/${notification.related_entity_id}`);
          break;
        case 'order':
          navigate(`/orders`);
          break;
        case 'message':
          navigate(`/messages`);
          break;
        default:
          // If no specific navigation, do nothing after marking as read
          break;
      }
    }
  };

  const handleToggleReadStatus = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    
    if (notification.is_read && onMarkAsUnread) {
      await onMarkAsUnread(notification.id);
      toast.success("Notification marked as unread");
    } else if (!notification.is_read) {
      await onMarkAsRead(notification.id);
      toast.success("Notification marked as read");
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click
    if (onDelete) {
      await onDelete(notification.id);
      toast.success("Notification deleted");
    }
  };
  
  return (
    <div className={cn(
      "group w-full relative transition-colors duration-200",
      !notification.is_read 
        ? "bg-primary/10 hover:bg-primary/15" 
        : "hover:bg-muted/50"
    )}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left px-4 py-3 gap-3 rounded-md h-auto",
          "focus-visible:ring-0 focus-visible:ring-offset-0"
        )}
        onClick={handleClick}
      >
        <div className={cn(
          "flex-shrink-0 rounded-full p-2",
          !notification.is_read ? "bg-primary/15" : "bg-muted"
        )}>
          {getNotificationIcon(notification.notification_type)}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <p className={cn(
              "text-sm md:text-base font-medium leading-tight",
              !notification.is_read ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </p>
            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0 hidden xs:block">
              {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-xs md:text-sm mt-1 text-muted-foreground line-clamp-2 break-words pr-8">
            {notification.body}
          </p>
          
          <span className="text-xs text-muted-foreground mt-1 block xs:hidden">
            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
          </span>
        </div>
      </Button>
      
      {showActions && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleToggleReadStatus}
            title={notification.is_read ? "Mark as unread" : "Mark as read"}
          >
            <Check className={cn(
              "h-4 w-4",
              notification.is_read ? "text-emerald-500" : "text-muted-foreground"
            )} />
          </Button>
          
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleToggleReadStatus}>
                  {notification.is_read ? (
                    <>Mark as unread</>
                  ) : (
                    <>Mark as read</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
      )}
    </div>
  );
}
