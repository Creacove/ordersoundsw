
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle, Music, Download, Radio, Video, Users, Crown, Settings } from 'lucide-react';

const Licenses = () => {
  React.useEffect(() => {
    document.title = "License Details | OrderSOUNDS";
  }, []);

  const LicenseCard = ({ 
    title, 
    badge = null, 
    icon: Icon, 
    fileDelivery, 
    licenseType, 
    features, 
    description 
  }: {
    title: string;
    badge?: string | null;
    icon: React.ElementType;
    fileDelivery: string;
    licenseType: string;
    features: Array<{ label: string; allowed: boolean; details?: string }>;
    description: string;
  }) => (
    <div className="relative p-[1px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent">
      <Card className="relative bg-[#030407] border-0 rounded-[1.7rem] h-full flex flex-col overflow-hidden">
        {badge && (
          <div className="absolute top-4 right-4 bg-white text-black text-[10px] font-black uppercase italic py-1 px-3 rounded-full">
            {badge}
          </div>
        )}
        <CardHeader className="pt-8 px-8">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white italic tracking-tight mb-2">
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white/50">{fileDelivery}</Badge>
            <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white/50">{licenseType}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex-1 flex flex-col">
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                {feature.allowed ? (
                  <CheckCircle className="h-4 w-4 text-[#9A3BDC] mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-white/20 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span className={`font-medium ${feature.allowed ? "text-white/90" : "text-white/30"}`}>
                    {feature.label}
                  </span>
                  {feature.details && (
                    <span className="text-white/40 block text-xs mt-0.5">{feature.details}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-6 border-t border-white/5">
            <p className="text-xs text-white/40 leading-relaxed italic">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const basicFeatures = [
    { label: "Commercial use", allowed: true, details: "One (1) commercial use" },
    { label: "Streams/Sales Limit", allowed: true, details: "Up to 5,000" },
    { label: "Live Performances", allowed: true },
    { label: "Music Videos", allowed: false },
    { label: "Radio Airplay", allowed: false },
    { label: "Monetized YouTube Videos", allowed: false },
    { label: "Stems Included", allowed: false },
    { label: "Content ID Registration", allowed: false }
  ];

  const premiumFeatures = [
    { label: "Commercial use", allowed: true, details: "One (1) commercial use" },
    { label: "Streams/Sales Limit", allowed: true, details: "Unlimited" },
    { label: "Live Performances", allowed: true },
    { label: "Music Videos", allowed: true, details: "1 video permitted" },
    { label: "Radio Airplay", allowed: true, details: "Up to 5 stations" },
    { label: "Monetized YouTube Videos", allowed: true },
    { label: "Stems Included", allowed: false },
    { label: "Content ID Registration", allowed: false }
  ];

  const exclusiveFeatures = [
    { label: "Commercial use", allowed: true, details: "Unlimited commercial uses" },
    { label: "Streams/Sales Limit", allowed: true, details: "Unlimited" },
    { label: "Live Performances", allowed: true, details: "Unlimited" },
    { label: "Music Videos", allowed: true, details: "Unlimited" },
    { label: "Radio Airplay", allowed: true, details: "Unlimited" },
    { label: "Monetized YouTube Videos", allowed: true },
    { label: "Stems Included", allowed: true },
    { label: "Full Ownership Rights", allowed: true }
  ];

  const customFeatures = [
    { label: "File Delivery", allowed: true, details: "Determined by seller" },
    { label: "Commercial use", allowed: true, details: "As agreed between buyer and seller" },
    { label: "Streams/Sales Limit", allowed: true, details: "Determined by seller" },
    { label: "Music Videos", allowed: true, details: "Subject to agreement" },
    { label: "Radio Airplay", allowed: true, details: "Subject to agreement" },
    { label: "Live Performances", allowed: true, details: "Based on terms" },
    { label: "Monetized YouTube Videos", allowed: true, details: "Based on agreement" },
    { label: "Stems", allowed: true, details: "Included or excluded based on agreement" }
  ];

  return (
    <div className="container py-8 md:py-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-2xl md:text-6xl font-black text-white tracking-tighter uppercase italic mb-4">License Blueprint</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic">
            Precision licensing for the modern creator. Choose the tier that matches your vision.
          </p>
        </div>

        {/* License Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <LicenseCard
            title="Basic"
            icon={Music}
            fileDelivery="MP3"
            licenseType="Non-Exclusive"
            features={basicFeatures}
            description="Perfect for testing the waters and small-scale digital content."
          />

          <LicenseCard
            title="Premium"
            badge="Popular"
            icon={Download}
            fileDelivery="WAV"
            licenseType="Non-Exclusive"
            features={premiumFeatures}
            description="The choice for serious artists and growing platforms."
          />

          <LicenseCard
            title="Exclusive"
            icon={Crown}
            fileDelivery="WAV + Stems"
            licenseType="Exclusive"
            features={exclusiveFeatures}
            description="Total dominance. Own the sound, own the rights."
          />

          <LicenseCard
            title="Custom"
            icon={Settings}
            fileDelivery="Custom"
            licenseType="Variable"
            features={customFeatures}
            description="Tailor-made terms for enterprise and specialized media."
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-4xl font-black text-white tracking-tighter uppercase italic mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Common questions answered.</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                q: "What is the core difference between license tiers?",
                a: "The main differences are audio quality (MP3 vs WAV), distribution limits (capped vs unlimited), and ownership (usage rights vs full transfer)."
              },
              {
                q: "Can I use Basic/Premium for high-budget music videos?",
                a: "Basic is restricted from video sync. Premium allows for one music video. Exclusive gives you total freedom."
              },
              {
                q: "What happens after an Exclusive purchase?",
                a: "The beat is removed from the marketplace immediately. No one else will ever be able to purchase it again."
              },
              {
                q: "Is monetization enabled across all tiers?",
                a: "No. Basic is for non-monetized demos and projects. Premium and Exclusive are fully cleared for revenue generation."
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/5 bg-white/[0.01] rounded-2xl px-6 transition-all hover:bg-white/[0.03]">
                <AccordionTrigger className="text-left font-bold text-white hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/50 pb-6 italic">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Licenses;
