import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Copy, 
  Check,
  Download,
  Home,
  Library,
  Music2,
  Settings,
  Gift,
  X
} from "lucide-react";

// ============================================
// SHOWCASE COMPONENTS (Clean, Minimal UI)
// ============================================

const ShowcaseBeatCard = ({ 
  title, 
  producer, 
  price, 
  genre,
}: { 
  title: string; 
  producer: string; 
  price: number; 
  genre: string;
}) => (
  <Card className="w-56 bg-card border-border/30 overflow-hidden">
    <div className="aspect-square bg-secondary/50 flex items-center justify-center">
      <Music2 className="h-12 w-12 text-muted-foreground/30" />
    </div>
    <div className="p-4">
      <Badge variant="secondary" className="text-xs mb-2">{genre}</Badge>
      <h3 className="font-semibold text-foreground truncate">{title}</h3>
      <p className="text-sm text-muted-foreground">{producer}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="font-bold text-lg">${price}</span>
        <Button size="sm" variant="secondary">Add to Cart</Button>
      </div>
    </div>
  </Card>
);

const ShowcaseCartItem = ({ 
  title, 
  producer, 
  price, 
}: { 
  title: string; 
  producer: string; 
  price: number; 
}) => (
  <div className="border border-border/30 rounded-lg bg-card p-4 flex gap-4 w-72">
    <div className="w-14 h-14 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0">
      <Music2 className="h-6 w-6 text-muted-foreground/40" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-foreground truncate">{title}</h3>
      <p className="text-sm text-muted-foreground">{producer}</p>
    </div>
    <span className="font-semibold">${price}</span>
  </div>
);

const ShowcaseStatsCard = ({ 
  label, 
  value, 
  highlight
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) => (
  <Card className={`p-6 ${highlight ? 'border-primary/50 bg-primary/5' : 'border-border/30'}`}>
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className={`text-3xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
  </Card>
);

const ShowcaseSidebar = ({ highlightItem }: { highlightItem?: string }) => (
  <div className="w-56 bg-sidebar border border-sidebar-border rounded-lg p-4 space-y-1">
    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70">
      <Home className="h-4 w-4" />
      <span className="text-sm">Home</span>
    </div>
    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70">
      <Library className="h-4 w-4" />
      <span className="text-sm">Library</span>
    </div>
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md ${highlightItem === 'invite' ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/70'}`}>
      <Gift className="h-4 w-4" />
      <span className="text-sm font-medium">Invite & Earn</span>
    </div>
    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70">
      <Settings className="h-4 w-4" />
      <span className="text-sm">Settings</span>
    </div>
  </div>
);

const ShowcaseReferralLink = ({ copied }: { copied?: boolean }) => (
  <Card className="p-5 w-80 border-border/30">
    <h3 className="text-base font-medium mb-3 text-foreground">Your Invite Link</h3>
    <div className="flex gap-2">
      <Input 
        value="ordersounds.app/ref/yourcode" 
        readOnly 
        className="font-mono text-sm bg-secondary/30 border-border/30" 
      />
      <Button variant={copied ? "default" : "outline"} size="icon" className="flex-shrink-0">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  </Card>
);

const ShowcaseCheckoutCard = ({ total, usdcHighlight }: { total: number; usdcHighlight?: boolean }) => (
  <Card className="p-5 w-72 border-border/30">
    <h3 className="font-medium mb-4 text-foreground">Payment</h3>
    <div className="space-y-2 mb-4">
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${usdcHighlight ? 'border-primary bg-primary/5' : 'border-border/30'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${usdcHighlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          $
        </div>
        <span className={`text-sm font-medium ${usdcHighlight ? 'text-foreground' : 'text-muted-foreground'}`}>USDC</span>
        {usdcHighlight && <Badge className="ml-auto text-xs">100% to you</Badge>}
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/20 opacity-50">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
          ₦
        </div>
        <span className="text-sm text-muted-foreground">Card / Bank</span>
      </div>
    </div>
    <div className="border-t border-border/30 pt-3 flex justify-between items-center">
      <span className="text-sm text-muted-foreground">Total</span>
      <span className="text-xl font-bold">${total}</span>
    </div>
  </Card>
);

const ShowcaseExpiredNotification = () => (
  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 w-80 flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
      <X className="h-4 w-4 text-destructive" />
    </div>
    <div>
      <p className="font-medium text-destructive">Link Expired</p>
      <p className="text-sm text-muted-foreground mt-1">You have 7 days to download your files before the link expires.</p>
    </div>
  </div>
);

const ShowcaseFileIcon = ({ type }: { type: 'wav' | 'zip' | 'stems' }) => {
  const labels = { wav: 'WAV', zip: 'ZIP', stems: 'STEMS' };
  return (
    <div className="w-16 h-20 bg-card border border-border/30 rounded-lg flex flex-col items-center justify-center">
      <div className="w-8 h-8 bg-secondary/50 rounded flex items-center justify-center mb-1">
        <Download className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{labels[type]}</span>
    </div>
  );
};

// ============================================
// MOCK DATA
// ============================================

const mockBeats = [
  { id: '1', title: 'Midnight Vibes', producer: 'BeatMaster', price: 29, genre: 'Trap' },
  { id: '2', title: 'Summer Heat', producer: 'ProducerX', price: 49, genre: 'Afrobeats' },
  { id: '3', title: 'Dark Energy', producer: 'SoundWave', price: 39, genre: 'Drill' },
  { id: '4', title: 'Golden Hour', producer: 'MelodyKing', price: 34, genre: 'R&B' },
];

// ============================================
// SCENE COMPONENTS
// ============================================

// Scene 1: Cold Open - Black. Slow fade. Typography focus.
const Scene1 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      {/* Faded beat cards in background - very subtle */}
      <motion.div
        className="absolute opacity-[0.03] scale-75"
        style={{ left: '10%', top: '20%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <ShowcaseBeatCard {...mockBeats[0]} />
      </motion.div>
      <motion.div
        className="absolute opacity-[0.03] scale-75"
        style={{ right: '10%', bottom: '25%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <ShowcaseBeatCard {...mockBeats[1]} />
      </motion.div>

      {/* Main text - word by word fade */}
      <div className="text-center">
        <motion.span
          className="text-3xl md:text-5xl font-light text-foreground/80 block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Producers...
        </motion.span>
        <motion.span
          className="text-3xl md:text-5xl font-light text-foreground/80 block mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          imagine keeping every dollar you earn.
        </motion.span>
      </div>
    </motion.div>
  );
};

// Scene 2: Reveal - SNAP to contrast. Bold typography.
const Scene2 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Stats card floating in background */}
      <motion.div
        className="absolute right-[10%] top-[20%] opacity-60"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 2.5, duration: 0.6 }}
      >
        <ShowcaseStatsCard label="Beat Sale" value="$100" />
      </motion.div>
      <motion.div
        className="absolute right-[15%] top-[45%] opacity-80"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 2.8, duration: 0.6 }}
      >
        <ShowcaseStatsCard label="You Keep" value="$100" highlight />
      </motion.div>

      {/* Massive 100% */}
      <motion.h1
        className="text-[8rem] md:text-[14rem] font-black text-foreground leading-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
      >
        100%
      </motion.h1>

      {/* Quick cuts - phrases */}
      <div className="flex flex-col items-center gap-2 mt-6">
        <motion.p
          className="text-2xl md:text-4xl font-medium text-muted-foreground"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          Every sale.
        </motion.p>
        <motion.p
          className="text-2xl md:text-4xl font-medium text-muted-foreground"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.3 }}
        >
          No fees.
        </motion.p>
        <motion.p
          className="text-2xl md:text-4xl font-medium text-muted-foreground"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6, duration: 0.3 }}
        >
          Zero cuts.
        </motion.p>
      </div>

      {/* USDC callout */}
      <motion.p
        className="text-lg md:text-xl text-primary font-medium mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.4 }}
      >
        When your invited buyers pay with USDC.
      </motion.p>
    </motion.div>
  );
};

// Scene 3: Tutorial - 4 steps. Clean Apple-style instruction.
const Scene3 = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 6500),
      setTimeout(() => setStep(4), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center overflow-hidden px-6">
      <AnimatePresence mode="wait">
        {/* Step 1: Find invite link */}
        {step === 1 && (
          <motion.div
            key="step1"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <ShowcaseSidebar highlightItem="invite" />
            </motion.div>
            <motion.p
              className="text-2xl md:text-3xl font-medium text-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Find your invite link.
            </motion.p>
          </motion.div>
        )}

        {/* Step 2: Copy it */}
        {step === 2 && (
          <motion.div
            key="step2"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <ShowcaseReferralLink copied />
            </motion.div>
            <motion.p
              className="text-2xl md:text-3xl font-medium text-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Copy it.
            </motion.p>
          </motion.div>
        )}

        {/* Step 3: Share with buyers */}
        {step === 3 && (
          <motion.div
            key="step3"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Simple avatar silhouettes */}
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-14 h-14 rounded-full bg-secondary/50 border border-border/30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.3 }}
                />
              ))}
            </div>
            <motion.p
              className="text-2xl md:text-3xl font-medium text-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Share with your buyers.
            </motion.p>
            <motion.p
              className="text-base text-muted-foreground text-center max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Artists, labels, clients — anyone who buys your beats.
            </motion.p>
          </motion.div>
        )}

        {/* Step 4: The flow - LONGER, better mobile layout */}
        {step === 4 && (
          <motion.div
            key="step4"
            className="flex flex-col items-center gap-6 w-full max-w-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Main message first on mobile */}
            <motion.p
              className="text-2xl md:text-3xl font-medium text-foreground text-center px-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              They pay with USDC.
            </motion.p>
            
            {/* Checkout card - centered and prominent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="my-4"
            >
              <ShowcaseCheckoutCard total={39} usdcHighlight />
            </motion.div>

            {/* Result */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <p className="text-lg text-muted-foreground">Your earnings:</p>
              <div className="flex items-center gap-4">
                <span className="text-4xl md:text-5xl font-bold text-primary">$39</span>
                <Badge className="text-lg px-3 py-1">100%</Badge>
              </div>
            </motion.div>

            {/* Final emphasis */}
            <motion.p
              className="text-2xl md:text-3xl font-bold text-primary text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.5 }}
            >
              You keep 100%.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
// Scene 4: Transition - "But that's not all."
const Scene4 = () => {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center">
      <motion.p
        className="text-3xl md:text-5xl font-light text-foreground/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        But that's not all.
      </motion.p>
    </motion.div>
  );
};

// Scene 5: Storage Value - Files, catalog, forever
const Scene5 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Main heading first - centered */}
      <motion.h2
        className="text-2xl md:text-4xl font-bold text-foreground text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Store everything. Forever.
      </motion.h2>

      {/* File icons with labels - explanatory */}
      <motion.div 
        className="flex gap-4 md:gap-8 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {(['wav', 'zip', 'stems'] as const).map((type, i) => (
          <motion.div
            key={type}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.2, duration: 0.4 }}
          >
            <ShowcaseFileIcon type={type} />
            <span className="text-xs text-muted-foreground">
              {type === 'wav' ? 'Audio' : type === 'zip' ? 'Projects' : 'Stems'}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Explanatory text - centered */}
      <motion.p
        className="text-base md:text-lg text-muted-foreground text-center max-w-md mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        Upload your beats, stems, and project files. 
        Buyers get instant, permanent access.
      </motion.p>

      {/* Final emphasis - centered */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.5 }}
      >
        <p className="text-xl md:text-2xl font-medium text-foreground">
          Your beats. Your stems. Your files.
        </p>
        <p className="text-2xl md:text-3xl text-primary font-bold mt-2">
          Forever.
        </p>
      </motion.div>
    </motion.div>
  );
};

// Scene 6: Pain Point - Expired link fades away
const Scene6 = () => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDismissed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Expired notification */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: dismissed ? 0 : 1, 
          scale: dismissed ? 0.9 : 1,
        }}
        transition={{ duration: dismissed ? 0.6 : 0.4 }}
      >
        <ShowcaseExpiredNotification />
      </motion.div>

      {/* Text appears after notification fades */}
      <motion.h2
        className="text-4xl md:text-6xl font-bold text-foreground mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: dismissed ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        That era is over.
      </motion.h2>
    </motion.div>
  );
};

// Scene 7: Professional Delivery - Comparison
const Scene7 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-6">
      {/* Heading */}
      <motion.h2
        className="text-xl md:text-3xl font-bold text-foreground text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        No more file sharing headaches.
      </motion.h2>

      {/* Comparison - stacked on mobile, side by side on desktop */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
        {/* Old way - crossed out */}
        <motion.div
          className="text-center md:text-left opacity-50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.5, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wide">The old way</p>
          <p className="text-lg md:text-xl text-muted-foreground line-through mb-2">WeTransfer links</p>
          <p className="text-lg md:text-xl text-muted-foreground line-through mb-2">Expired after 7 days</p>
          <p className="text-lg md:text-xl text-muted-foreground line-through">"Can you resend?"</p>
        </motion.div>

        {/* Arrow / Divider */}
        <motion.div
          className="text-3xl text-muted-foreground/30 hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          →
        </motion.div>
        <motion.div
          className="w-16 h-px bg-border/50 md:hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        />

        {/* New way */}
        <motion.div
          className="text-center md:text-left"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          <p className="text-sm text-primary mb-3 uppercase tracking-wide font-medium">OrderSounds</p>
          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-lg md:text-xl text-foreground font-medium">Instant delivery</p>
          </div>
          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-lg md:text-xl text-foreground font-medium">Links never expire</p>
          </div>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-lg md:text-xl text-foreground font-medium">Professional storefront</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Scene 8: Promo Callback - USDC = 100%
const Scene8 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Checkout card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <ShowcaseCheckoutCard total={100} usdcHighlight />
      </motion.div>

      {/* Text */}
      <motion.p
        className="text-2xl md:text-3xl text-muted-foreground mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        Pay with USDC.
      </motion.p>
      <motion.h2
        className="text-4xl md:text-6xl font-bold text-primary mt-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.4 }}
      >
        Keep 100%.
      </motion.h2>
    </motion.div>
  );
};

// Scene 9: Comparison - Simple side by side
const Scene9 = () => {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center">
      <div className="flex gap-8 md:gap-16 items-center">
        {/* Card/Bank */}
        <motion.div
          className="text-center opacity-50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.5, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p className="text-lg text-muted-foreground mb-2">Card / Bank</p>
          <p className="text-4xl md:text-5xl font-bold text-muted-foreground">80%</p>
        </motion.div>

        {/* VS */}
        <motion.p
          className="text-xl text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          vs
        </motion.p>

        {/* USDC */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <p className="text-lg text-primary mb-2">USDC</p>
          <p className="text-4xl md:text-5xl font-bold text-primary">100%</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Scene 10: Emotional Payoff - Slow, deliberate reveals
const Scene10 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      {/* Faded catalog in background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center opacity-[0.02]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.02 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <div className="flex gap-4 scale-75">
          {mockBeats.map((beat) => (
            <ShowcaseBeatCard key={beat.id} {...beat} />
          ))}
        </div>
      </motion.div>

      {/* Text reveals */}
      <div className="text-center space-y-6">
        <motion.p
          className="text-2xl md:text-4xl font-light text-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          You made the beat.
        </motion.p>
        <motion.p
          className="text-2xl md:text-4xl font-light text-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          You did the work.
        </motion.p>
        <motion.p
          className="text-2xl md:text-4xl font-medium text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.8 }}
        >
          You deserve every dollar.
        </motion.p>
      </div>
    </motion.div>
  );
};

// Scene 11: Close - Urgency + Logo
const Scene11 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Deadline */}
      <motion.p
        className="text-xl md:text-2xl text-muted-foreground mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Through January 31.
      </motion.p>

      {/* Logo */}
      <motion.img
        src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
        alt="OrderSounds"
        className="h-16 md:h-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
      />

      {/* Subtle scale breathe - very minimal */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ delay: 2, duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-32 h-32 rounded-full border border-primary/10" />
      </motion.div>
    </motion.div>
  );
};

// ============================================
// SCENE DURATIONS (in seconds)
// ============================================

const SCENE_DURATIONS = [4, 5, 16, 3, 7, 4, 7, 5, 4, 5, 4]; // Total: 64 seconds

const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10, Scene11];

// ============================================
// MAIN COMPONENT
// ============================================

const Animations = () => {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    if (currentScene >= scenes.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentScene((prev) => prev + 1);
    }, SCENE_DURATIONS[currentScene] * 1000);

    return () => clearTimeout(timer);
  }, [currentScene]);

  const CurrentSceneComponent = scenes[currentScene];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scene container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <CurrentSceneComponent />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar - minimal */}
      <div className="absolute bottom-6 left-6 right-6 h-0.5 bg-muted/20 rounded-full overflow-hidden z-50">
        <motion.div
          className="h-full bg-primary/60"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default Animations;
