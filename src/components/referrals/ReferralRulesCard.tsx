import { Card } from "@/components/ui/card";
import { CheckCircle2, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ReferralRulesCard = () => {
  return (
    <Card className="p-6 mt-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <HelpCircle className="h-5 w-5" />
        How It Works
      </h3>

      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Share Your Link</p>
            <p className="text-sm text-muted-foreground">
              Send your unique referral link to friends who might be interested in OrderSounds
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">They Sign Up</p>
            <p className="text-sm text-muted-foreground">
              When someone signs up using your link, they'll be tracked as your referral
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">They Complete Onboarding</p>
            <p className="text-sm text-muted-foreground">
              Once they finish setting up their account, you earn <strong>10 points</strong>
            </p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What counts as onboarding completion?</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>For Producers:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Upload their first beat or soundpack</li>
                <li>Complete their profile (stage name, bio, location)</li>
                <li>Set up payment details (bank account or wallet)</li>
              </ul>
              <p className="mt-3"><strong>For Buyers:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Make their first purchase, OR</li>
                <li>Add 3 or more items to favorites, OR</li>
                <li>Create their first playlist</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>How can I use my points?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Points are currently for tracking your referral success. In the future, you'll be able to 
              redeem points for discounts, premium licenses, and other rewards. Stay tuned!
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>Is there a limit to referrals?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              No! You can refer as many friends as you like. The more successful referrals, the more points you earn.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
