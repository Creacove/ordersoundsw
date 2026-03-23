
import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, MessageSquare, DollarSign, Activity, Headphones, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  notifications: Notification[];
}

export function RecentActivity({ notifications }: RecentActivityProps) {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
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
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign size={14} className="text-emerald-500" />;
      case 'favorite':
        return <Heart size={14} className="text-pink-500" />;
      case 'comment':
        return <MessageSquare size={14} className="text-primary" />;
      case 'royalty':
      case 'payment':
        return <DollarSign size={14} className="text-amber-500" />;
      default:
        return <Bell size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            Studio Feed
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Recent movements in your studio</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-20 text-center space-y-3">
            <Headphones size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Feed is currently silent.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="group relative flex items-start gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-500 cursor-pointer overflow-hidden"
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Visual indicator for new */}
                {notification.notification_type === 'sale' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110",
                  notification.notification_type === 'sale' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"
                )}>
                  {getNotificationIcon(notification.notification_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors tracking-tight italic uppercase">
                      {notification.title}
                    </p>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest tabular-nums shrink-0 italic">
                      {formatDistanceToNow(new Date(notification.created_date), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1 font-medium italic">
                    {notification.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <button 
          onClick={() => navigate('/notifications')}
          className="mt-6 w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all italic active:scale-95"
        >
          Access Communication Hub
        </button>
      )}
    </div>
  );
}
