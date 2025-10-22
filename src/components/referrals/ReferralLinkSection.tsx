import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2 } from "lucide-react";
import { referralService } from "@/services/referralService";
import { toast } from "@/hooks/use-toast";

interface ReferralLinkSectionProps {
  referralCode: string;
}

export const ReferralLinkSection = ({ referralCode }: ReferralLinkSectionProps) => {
  const [copied, setCopied] = useState(false);
  const referralLink = referralService.generateReferralLink(referralCode);

  const handleCopy = () => {
    referralService.shareReferralLink('copy', referralCode);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 mb-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share this link with friends to earn 10 points for each successful referral
          </p>
        </div>

        <div className="flex gap-2">
          <Input 
            value={referralLink} 
            readOnly 
            className="font-mono text-sm"
          />
          <Button 
            onClick={handleCopy}
            variant="outline"
            className="shrink-0"
          >
            {copied ? "Copied!" : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
          </Button>
        </div>
      </div>
    </Card>
  );
};
