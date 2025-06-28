
import React from 'react';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
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
    <Card className="relative">
      {badge && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-bl-lg rounded-tr-lg">
          {badge}
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">{fileDelivery}</Badge>
          <Badge variant="outline">{licenseType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              {feature.allowed ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className={feature.allowed ? "text-foreground" : "text-muted-foreground"}>
                  {feature.label}
                </span>
                {feature.details && (
                  <span className="text-muted-foreground"> - {feature.details}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground border-t pt-4">
          {description}
        </p>
      </CardContent>
    </Card>
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
    <MainLayoutWithPlayer>
      <div className="container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">License Details</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            At OrderSounds, we offer multiple licensing options to suit your creative and commercial needs. 
            Each license grants you specific rights to use the beat in your projects. Please review the license 
            terms carefully before purchasing.
          </p>
        </div>

        {/* License Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <LicenseCard
            title="Basic License"
            icon={Music}
            fileDelivery="MP3"
            licenseType="Non-Exclusive"
            features={basicFeatures}
            description="The Basic License is ideal for demo releases, small-scale projects, or independent creators testing their sound. You are not granted exclusive rights, and the beat may be licensed to other users."
          />

          <LicenseCard
            title="Premium License"
            badge="Popular"
            icon={Download}
            fileDelivery="WAV"
            licenseType="Non-Exclusive"
            features={premiumFeatures}
            description="The Premium License offers higher-quality audio and extended usage rights, including full monetization and distribution flexibility. You still do not own the beat, and it may be licensed to others."
          />

          <LicenseCard
            title="Exclusive License"
            icon={Crown}
            fileDelivery="WAV + Stems"
            licenseType="Exclusive"
            features={exclusiveFeatures}
            description="The Exclusive License grants you full commercial and ownership rights to the beat. Once purchased, the beat will no longer be available for licensing to any other user."
          />

          <LicenseCard
            title="Custom License"
            icon={Settings}
            fileDelivery="Custom"
            licenseType="Custom Terms"
            features={customFeatures}
            description="The Custom License offers buyers the flexibility to request terms that fit their specific needs. Whether you're working on a video game, short film, single release, podcast, or brand content. This license allows you to secure either exclusive or specially negotiated rights directly from the producer."
          />
        </div>

        {/* Additional Custom License Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Custom License Note:</strong> It doesn't have to be a large-scale campaign. If you need exclusive rights 
              for a personal project, or you want to negotiate specific usage terms, the Custom License is for you.
            </p>
          </CardContent>
        </Card>

        {/* Terms Notice */}
        <div className="bg-muted/50 rounded-lg p-4 mb-8">
          <p className="text-sm text-center">
            All licenses are subject to our <strong>Terms and Conditions</strong>. Please read them carefully before purchasing.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions (FAQ)</h2>
          
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="item-1" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                What is the difference between the Basic, Premium, and Exclusive Licenses?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The Basic License is for small-scale projects and includes an MP3 file with limited distribution 
                (up to 5,000 streams/sales). The Premium License offers WAV quality and unlimited distribution, 
                while the Exclusive License provides full ownership transfer and unlimited use for the buyer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Can I use a beat purchased with a Basic or Premium License for my music video?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Basic License users are not permitted to use the beat in a music video, while Premium License 
                users can use it for one music video. The Exclusive License grants full rights for music video use.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                What happens if I purchase an Exclusive License?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Once you purchase an Exclusive License, the beat is removed from the store and will no longer 
                be available for licensing. You will own full rights to the track for unlimited commercial use.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Can I resell or redistribute a beat once I have a license?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, resale or redistribution is not allowed unless specifically stated in the license agreement. 
                You are granted usage rights within the terms of the license.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">
                Can I use a beat purchased with any license for content on YouTube or streaming platforms?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Premium and Exclusive License users are allowed to monetize their YouTube videos and streaming 
                platforms. Basic License users are not permitted to monetize on these platforms.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Licenses;
