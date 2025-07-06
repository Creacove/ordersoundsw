
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Beat } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

interface TopSellingBeatsProps {
  beats: Beat[];
}

export function TopSellingBeats({ beats }: TopSellingBeatsProps) {
  const navigate = useNavigate();
  const { currency } = useAuth();

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Beats</CardTitle>
        <CardDescription>Your best performing tracks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {beats.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven't uploaded any beats yet. Go to Upload Beat to get started.
            </p>
          ) : (
            beats.map((beat, index) => (
              <div 
                key={beat.id} 
                className="flex items-center gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                onClick={() => handleBeatClick(beat.id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                  <img
                    src={beat.cover_image_url}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{beat.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {beat.purchase_count || 0} sales
                    </p>
                    {beat.plays > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {beat.plays} plays
                      </Badge>
                    )}
                    {beat.favorites_count > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-red-50">
                        {beat.favorites_count} likes
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {currency === 'NGN' ? '₦' : '$'}
                    {(currency === 'NGN' ? 
                      beat.basic_license_price_local : 
                      beat.basic_license_price_diaspora || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
