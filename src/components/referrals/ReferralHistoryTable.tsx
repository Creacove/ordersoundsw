import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Referral } from "@/types/referral";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";

interface ReferralHistoryTableProps {
  referrals: Referral[];
}

export const ReferralHistoryTable = ({ referrals }: ReferralHistoryTableProps) => {
  if (referrals.length === 0) {
    return (
      <Card className="p-12 text-center">
        <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
        <p className="text-muted-foreground">
          Invite friends to start earning points! Share your referral link above.
        </p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'successful':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Successful</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Referral History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Friend Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell className="font-medium">
                  {referral.referred_email || 'User'}
                </TableCell>
                <TableCell>{getStatusBadge(referral.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {referral.status === 'successful' ? `+${referral.reward_points}` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
