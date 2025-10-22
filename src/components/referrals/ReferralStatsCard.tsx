import { Card } from "@/components/ui/card";
import { Gift, Users, Sparkles } from "lucide-react";
import type { ReferralStats } from "@/types/referral";

interface ReferralStatsCardProps {
  stats: ReferralStats;
  todaysPoints: number;
}

export const ReferralStatsCard = ({ stats, todaysPoints }: ReferralStatsCardProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Points</p>
            <p className="text-3xl font-bold">{stats.points}</p>
          </div>
          <Gift className="h-10 w-10 text-primary opacity-70" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Users Invited</p>
            <p className="text-3xl font-bold">{stats.referralCount}</p>
          </div>
          <Users className="h-10 w-10 text-primary opacity-70" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today's Points</p>
            <p className="text-3xl font-bold">{todaysPoints}</p>
          </div>
          <Sparkles className="h-10 w-10 text-primary opacity-70" />
        </div>
      </Card>
    </div>
  );
};
