import { Card } from "@/components/ui/card";
import { Gift, TrendingUp, Users } from "lucide-react";
import type { ReferralStats } from "@/types/referral";

interface ReferralStatsCardProps {
  stats: ReferralStats;
}

export const ReferralStatsCard = ({ stats }: ReferralStatsCardProps) => {
  const conversionRate = stats.referralCount > 0 
    ? Math.round((stats.successfulReferrals / stats.referralCount) * 100) 
    : 0;

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
            <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
            <p className="text-3xl font-bold">{stats.referralCount}</p>
          </div>
          <Users className="h-10 w-10 text-primary opacity-70" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <p className="text-3xl font-bold">{conversionRate}%</p>
          </div>
          <TrendingUp className="h-10 w-10 text-primary opacity-70" />
        </div>
      </Card>
    </div>
  );
};
