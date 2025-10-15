import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, MessageCircle } from "lucide-react";
import { referralService } from "@/services/referralService";
import { toast } from "@/hooks/use-toast";
import { FaXTwitter } from "react-icons/fa6";

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

  const handleShare = (platform: 'twitter' | 'whatsapp') => {
    referralService.shareReferralLink(platform, referralCode);
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

        <div className="flex gap-2">
          <Button 
            onClick={() => handleShare('twitter')}
            variant="outline"
            className="flex-1"
          >
            <FaXTwitter className="h-4 w-4 mr-2" />
            Share on X
          </Button>
          <Button 
            onClick={() => handleShare('whatsapp')}
            variant="outline"
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm">
            <strong>Your Referral Code:</strong> <code className="bg-background px-2 py-1 rounded font-mono">{referralCode}</code>
          </p>
        </div>
      </div>
    </Card>
  );
};
