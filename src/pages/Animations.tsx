import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Wallet, 
  Share2, 
  Copy, 
  ShoppingCart, 
  Play, 
  Heart,
  Music,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  ArrowRight
} from "lucide-react";

// ============================================
// SHOWCASE COMPONENTS (Static versions of real UI)
// ============================================

const ShowcaseBeatCard = ({ 
  title, 
  producer, 
  price, 
  genre,
  bpm,
  plays
}: { 
  title: string; 
  producer: string; 
  price: number; 
  genre: string;
  bpm?: number;
  plays?: string;
}) => (
  <Card className="group overflow-hidden w-64 bg-card/90 backdrop-blur-sm border-border/50">
    <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-primary/5">
      <div className="absolute inset-0 flex items-center justify-center">
        <Music className="h-16 w-16 text-primary/30" />
      </div>
      <div className="absolute top-2 left-2">
        <Badge variant="secondary" className="text-xs">{genre}</Badge>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/50 hover:bg-black/70">
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
          <Play className="h-3 w-3" />
          <span>{plays || "2.4k"}</span>
          {bpm && <span>• {bpm} BPM</span>}
        </div>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-foreground truncate">{title}</h3>
      <p className="text-sm text-muted-foreground">by {producer}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="font-bold text-lg text-primary">${price}</span>
        <Button size="sm" className="gap-1">
          <ShoppingCart className="h-3 w-3" />
          Add
        </Button>
      </div>
    </div>
  </Card>
);

const ShowcaseCartItem = ({ 
  title, 
  producer, 
  price, 
  license 
}: { 
  title: string; 
  producer: string; 
  price: number; 
  license: string;
}) => (
  <div className="border border-border/50 rounded-xl bg-card/80 backdrop-blur-sm shadow-lg p-4 flex gap-4 w-80">
    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
      <Music className="h-8 w-8 text-primary/50" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-foreground truncate">{title}</h3>
      <p className="text-xs text-muted-foreground">{producer}</p>
      <Badge variant="secondary" className="text-xs mt-1">{license} License</Badge>
    </div>
    <span className="font-bold text-primary">${price}</span>
  </div>
);

const ShowcaseStatsCard = ({ 
  label, 
  value, 
  icon: Icon,
  highlight
}: { 
  label: string; 
  value: string; 
  icon: React.ElementType;
  highlight?: boolean;
}) => (
  <Card className={`p-6 ${highlight ? 'ring-2 ring-primary shadow-[0_0_30px_rgba(124,58,237,0.3)]' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      <Icon className={`h-10 w-10 ${highlight ? 'text-primary' : 'text-primary/70'}`} />
    </div>
  </Card>
);

const ShowcaseWalletButton = ({ connected }: { connected?: boolean }) => (
  <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 shadow-lg">
    <Wallet className="h-4 w-4" />
    {connected ? "Wallet Connected" : "Connect Wallet"}
  </Button>
);

const ShowcaseReferralLink = () => (
  <Card className="p-6 w-96">
    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
      <Share2 className="h-5 w-5 text-primary" /> Your Referral Link
    </h3>
    <div className="flex gap-2">
      <Input 
        value="ordersounds.app/ref/yourcode" 
        readOnly 
        className="font-mono text-sm bg-muted/50" 
      />
      <Button variant="outline" className="gap-1 flex-shrink-0">
        <Copy className="h-4 w-4" /> Copy
      </Button>
    </div>
  </Card>
);

const ShowcaseCheckoutCard = ({ total, items }: { total: number; items: number }) => (
  <Card className="p-6 w-80 bg-card/90 backdrop-blur-sm">
    <h3 className="text-lg font-semibold mb-4 text-foreground">Checkout</h3>
    <div className="space-y-3 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{items} items</span>
        <span className="text-foreground">${total.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Platform Fee</span>
        <span className="text-green-500 font-medium">$0.00</span>
      </div>
      <div className="border-t border-border pt-3 flex justify-between font-semibold">
        <span>Total</span>
        <span className="text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
    <ShowcaseWalletButton />
  </Card>
);

// ============================================
// MOCK DATA
// ============================================

const mockBeats = [
  { id: '1', title: 'Midnight Vibes', producer: 'BeatMaster', price: 29.99, genre: 'Trap', bpm: 140, plays: '2.4k' },
  { id: '2', title: 'Summer Heat', producer: 'ProducerX', price: 49.99, genre: 'Afrobeats', bpm: 105, plays: '5.1k' },
  { id: '3', title: 'Dark Energy', producer: 'SoundWave', price: 39.99, genre: 'Drill', bpm: 145, plays: '1.8k' },
  { id: '4', title: 'Golden Hour', producer: 'MelodyKing', price: 34.99, genre: 'R&B', bpm: 90, plays: '3.2k' },
  { id: '5', title: 'Street Dreams', producer: 'UrbanFlow', price: 44.99, genre: 'Hip-Hop', bpm: 95, plays: '4.7k' },
];

// ============================================
// PARTICLE COMPONENT
// ============================================

const Particle = ({ delay = 0, x = 0, y = 0, size = 4 }: { delay?: number; x?: number; y?: number; size?: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary"
    style={{ width: size, height: size, left: `${50 + x}%`, top: `${50 + y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      x: [0, x * 10, x * 20],
      y: [0, y * 10, y * 20],
    }}
    transition={{ duration: 2, delay, ease: "easeOut" }}
  />
);

// ============================================
// SCENE COMPONENTS
// ============================================

const Scene1 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Particle explosion */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Particle
          key={i}
          delay={0.5 + i * 0.02}
          x={(Math.random() - 0.5) * 100}
          y={(Math.random() - 0.5) * 100}
          size={Math.random() * 8 + 2}
        />
      ))}

      {/* Floating beat cards in background */}
      <motion.div
        className="absolute -left-20 top-1/4 opacity-20 scale-75"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 0.2, x: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <ShowcaseBeatCard {...mockBeats[0]} />
      </motion.div>
      <motion.div
        className="absolute -right-20 top-1/3 opacity-20 scale-75"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 0.2, x: 0 }}
        transition={{ delay: 1.7, duration: 1 }}
      >
        <ShowcaseBeatCard {...mockBeats[1]} />
      </motion.div>

      {/* Logo slam */}
      <motion.img
        src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
        alt="OrderSounds"
        className="h-24 mb-8"
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
      />

      {/* Shockwave ring */}
      <motion.div
        className="absolute w-40 h-40 rounded-full border-4 border-primary"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 10, opacity: 0 }}
        transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
      />

      {/* Main text */}
      <motion.h1
        className="text-6xl md:text-8xl font-black text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 150 }}
        style={{ textShadow: "0 0 40px rgba(124, 58, 237, 0.5)" }}
      >
        <span className="text-primary">DECEMBER</span> & <span className="text-primary">JANUARY</span>
      </motion.h1>

      <motion.p
        className="text-2xl md:text-4xl font-bold mt-6 text-muted-foreground"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        WE'RE BREAKING THE RULES.
      </motion.p>
    </motion.div>
  );
};

const Scene2 = () => {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Flying UI components collage */}
      <motion.div
        className="absolute"
        initial={{ x: -500, y: -200, rotate: -20, opacity: 0 }}
        animate={{ x: -300, y: -150, rotate: -10, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ShowcaseBeatCard {...mockBeats[0]} />
      </motion.div>

      <motion.div
        className="absolute"
        initial={{ x: 500, y: 200, rotate: 20, opacity: 0 }}
        animate={{ x: 300, y: 150, rotate: 10, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <ShowcaseBeatCard {...mockBeats[1]} />
      </motion.div>

      <motion.div
        className="absolute"
        initial={{ x: -500, y: 300, rotate: -15, opacity: 0 }}
        animate={{ x: -250, y: 200, rotate: -5, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <ShowcaseCartItem title="Midnight Vibes" producer="BeatMaster" price={29.99} license="Premium" />
      </motion.div>

      <motion.div
        className="absolute"
        initial={{ x: 500, y: -300, rotate: 15, opacity: 0 }}
        animate={{ x: 280, y: -180, rotate: 5, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <ShowcaseStatsCard label="Total Revenue" value="$1,247" icon={DollarSign} />
      </motion.div>

      {/* Slicing text */}
      <motion.div className="relative z-10 text-center">
        <motion.h2
          className="text-7xl md:text-9xl font-black text-primary"
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 100 }}
          style={{ textShadow: "0 0 60px rgba(124, 58, 237, 0.8)" }}
        >
          NO FEES.
        </motion.h2>
        <motion.h2
          className="text-7xl md:text-9xl font-black text-foreground"
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
        >
          NO CUTS.
        </motion.h2>
        <motion.h2
          className="text-7xl md:text-9xl font-black text-primary"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, type: "spring", stiffness: 150 }}
          style={{ textShadow: "0 0 60px rgba(124, 58, 237, 0.8)" }}
        >
          NO LIMITS.
        </motion.h2>
      </motion.div>
    </motion.div>
  );
};

const Scene3 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Floating stats cards */}
      <motion.div
        className="absolute left-10 top-1/4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <ShowcaseStatsCard label="Beat Sale" value="$100" icon={Music} />
      </motion.div>

      <motion.div
        className="absolute right-10 top-1/4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1.7, duration: 0.8 }}
      >
        <ShowcaseStatsCard label="You Earn" value="$100" icon={DollarSign} highlight />
      </motion.div>

      {/* Main reveal */}
      <motion.h1
        className="text-8xl md:text-[12rem] font-black text-center leading-none"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 80, damping: 12 }}
        style={{
          textShadow: "0 0 80px rgba(124, 58, 237, 0.8), 0 0 120px rgba(124, 58, 237, 0.4)",
        }}
      >
        <span className="text-primary">EARN</span>
        <br />
        <span className="text-foreground">100%</span>
      </motion.h1>

      <motion.p
        className="text-xl md:text-3xl text-muted-foreground mt-8 text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        When your invited buyer pays with crypto.
      </motion.p>

      {/* Glowing orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-20 h-20 rounded-full bg-primary/20 blur-xl"
          style={{
            left: `${20 + i * 15}%`,
            top: `${60 + Math.sin(i) * 10}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            delay: i * 0.2,
            repeat: Infinity,
          }}
        />
      ))}
    </motion.div>
  );
};

const Scene4 = () => {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Flow line */}
      <motion.div
        className="absolute h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
        style={{ width: "100%", top: "50%" }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Step 1: Share link */}
      <motion.div
        className="absolute left-[5%]"
        initial={{ x: -100, opacity: 0, scale: 0.8 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
      >
        <ShowcaseReferralLink />
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-primary font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Share2 className="h-5 w-5" /> Share
        </motion.div>
      </motion.div>

      {/* Arrow */}
      <motion.div
        className="absolute left-[32%] text-primary"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
      >
        <ArrowRight className="h-12 w-12" />
      </motion.div>

      {/* Step 2: Beat card */}
      <motion.div
        className="absolute left-[38%]"
        initial={{ y: 100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
      >
        <ShowcaseBeatCard {...mockBeats[2]} />
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-primary font-semibold whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <Music className="h-5 w-5" /> Buyer Finds Beat
        </motion.div>
      </motion.div>

      {/* Arrow */}
      <motion.div
        className="absolute left-[58%] text-primary"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.2 }}
      >
        <ArrowRight className="h-12 w-12" />
      </motion.div>

      {/* Step 3: Checkout with wallet */}
      <motion.div
        className="absolute right-[5%]"
        initial={{ x: 100, opacity: 0, scale: 0.8 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, type: "spring", stiffness: 100 }}
      >
        <ShowcaseCheckoutCard total={39.99} items={1} />
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-primary font-semibold whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          <Wallet className="h-5 w-5" /> Pays Crypto
        </motion.div>
      </motion.div>

      {/* Final message */}
      <motion.div
        className="absolute bottom-20 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.5 }}
      >
        <p className="text-4xl font-bold text-primary" style={{ textShadow: "0 0 30px rgba(124, 58, 237, 0.5)" }}>
          YOU EARN 100%
        </p>
      </motion.div>
    </motion.div>
  );
};

const Scene5 = () => {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Split screen */}
      <motion.div
        className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-center"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <ShowcaseStatsCard label="You Earn (Crypto)" value="$100" icon={Wallet} highlight />
          <motion.p
            className="text-center mt-4 text-3xl font-bold text-green-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            0% Fee
          </motion.p>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-muted/30 to-transparent flex items-center justify-center"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <ShowcaseStatsCard label="You Earn (Regular)" value="$80" icon={DollarSign} />
          <motion.p
            className="text-center mt-4 text-3xl font-bold text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            20% Fee
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="absolute w-1 h-full bg-primary"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ boxShadow: "0 0 30px rgba(124, 58, 237, 0.8)" }}
      />

      {/* Crypto side expands */}
      <motion.div
        className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-primary/20 to-primary/5"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 3, duration: 1 }}
      />

      <motion.h2
        className="absolute text-6xl md:text-8xl font-black text-primary z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3.5, type: "spring" }}
        style={{ textShadow: "0 0 60px rgba(124, 58, 237, 0.8)" }}
      >
        CRYPTO WINS
      </motion.h2>
    </motion.div>
  );
};

const Scene6 = () => {
  return (
    <motion.div className="absolute inset-0 overflow-hidden">
      {/* Rapid montage of beat cards */}
      {mockBeats.map((beat, i) => (
        <motion.div
          key={beat.id}
          className="absolute"
          style={{
            left: `${(i % 3) * 35}%`,
            top: `${Math.floor(i / 3) * 40 + 10}%`,
          }}
          initial={{ 
            x: i % 2 === 0 ? -500 : 500, 
            y: i % 3 === 0 ? -300 : 300,
            rotate: (Math.random() - 0.5) * 40,
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            x: 0, 
            y: 0,
            rotate: (Math.random() - 0.5) * 10,
            opacity: 1,
            scale: 0.9
          }}
          transition={{ 
            delay: i * 0.15, 
            type: "spring",
            stiffness: 80
          }}
        >
          <ShowcaseBeatCard {...beat} />
        </motion.div>
      ))}

      {/* Genre badges flying */}
      {['TRAP', 'AFROBEATS', 'DRILL', 'R&B', 'HIP-HOP'].map((genre, i) => (
        <motion.div
          key={genre}
          className="absolute"
          style={{ left: `${10 + i * 18}%`, top: `${70 + (i % 2) * 10}%` }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 + i * 0.1 }}
        >
          <Badge className="text-lg px-4 py-2 bg-primary/20 text-primary border-primary">
            {genre}
          </Badge>
        </motion.div>
      ))}

      {/* Flashing text */}
      <motion.div className="absolute inset-0 flex items-center justify-center z-20">
        <AnimatePresence mode="wait">
          <motion.h2
            key="producers"
            className="text-6xl md:text-9xl font-black text-primary absolute"
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ textShadow: "0 0 60px rgba(124, 58, 237, 0.8)" }}
          >
            FOR PRODUCERS.
          </motion.h2>
        </AnimatePresence>
      </motion.div>

      <motion.h2
        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-4xl md:text-6xl font-black text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        FOR THE CULTURE.
      </motion.h2>
    </motion.div>
  );
};

const Scene7 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Glitch overlay */}
      <motion.div
        className="absolute inset-0 bg-primary/5"
        animate={{
          opacity: [0, 0.1, 0, 0.05, 0],
          x: [0, -5, 5, -2, 0],
        }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
      />

      {/* Countdown style */}
      <motion.div
        className="text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <motion.h1
          className="text-7xl md:text-[10rem] font-black text-primary"
          animate={{
            textShadow: [
              "0 0 20px rgba(124, 58, 237, 0.5)",
              "0 0 60px rgba(124, 58, 237, 0.8)",
              "0 0 20px rgba(124, 58, 237, 0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          DEC → JAN
        </motion.h1>
        <motion.p
          className="text-3xl md:text-5xl font-bold text-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          ONLY
        </motion.p>
      </motion.div>

      {/* Neon clock effect */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border-4 border-primary/30"
        animate={{
          scale: [1, 1.1, 1],
          borderColor: ["rgba(124, 58, 237, 0.3)", "rgba(124, 58, 237, 0.8)", "rgba(124, 58, 237, 0.3)"],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ boxShadow: "0 0 40px rgba(124, 58, 237, 0.3)" }}
      />

      <motion.p
        className="absolute bottom-20 text-xl text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        Limited time. Unlimited potential.
      </motion.p>
    </motion.div>
  );
};

const Scene8 = () => {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Cash particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            left: "50%",
            top: "50%",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 800,
            y: (Math.random() - 0.5) * 600,
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            delay: 1.5 + i * 0.05,
            duration: 2,
            ease: "easeOut",
          }}
        >
          💰
        </motion.div>
      ))}

      {/* Flying stats card */}
      <motion.div
        initial={{ scale: 0.3, y: 200, opacity: 0 }}
        animate={{ scale: 1.2, y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 80 }}
        style={{ filter: "drop-shadow(0 0 40px rgba(124, 58, 237, 0.6))" }}
      >
        <Card className="p-8 bg-card/90 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground mb-2">Your Earnings</p>
          <motion.p
            className="text-6xl md:text-8xl font-black text-primary"
            animate={{
              textShadow: [
                "0 0 20px rgba(124, 58, 237, 0.5)",
                "0 0 40px rgba(124, 58, 237, 0.8)",
                "0 0 20px rgba(124, 58, 237, 0.5)",
              ],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            $10,000
          </motion.p>
          <div className="flex items-center gap-2 mt-4 text-green-500">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-semibold">100% Yours</span>
          </div>
        </Card>
      </motion.div>

      {/* YOU: 100% */}
      <motion.h2
        className="absolute bottom-20 text-5xl md:text-7xl font-black"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
      >
        <span className="text-foreground">YOU:</span>{" "}
        <span className="text-primary" style={{ textShadow: "0 0 40px rgba(124, 58, 237, 0.8)" }}>
          100%
        </span>
      </motion.h2>
    </motion.div>
  );
};

const Scene9 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Slow drift particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            delay: i * 0.2,
            repeat: Infinity,
          }}
        />
      ))}

      {/* Closing statements */}
      <motion.div className="text-center space-y-6">
        <motion.p
          className="text-4xl md:text-6xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Start Inviting.
        </motion.p>
        <motion.p
          className="text-4xl md:text-6xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          Start Earning.
        </motion.p>
        <motion.p
          className="text-4xl md:text-6xl font-bold text-primary"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          style={{ textShadow: "0 0 40px rgba(124, 58, 237, 0.6)" }}
        >
          Start Winning.
        </motion.p>
      </motion.div>

      {/* Light sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ delay: 4, duration: 1.5 }}
      />

      {/* Referral link at bottom */}
      <motion.div
        className="absolute bottom-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 5 }}
      >
        <ShowcaseReferralLink />
      </motion.div>
    </motion.div>
  );
};

const Scene10 = () => {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Flash */}
      <motion.div
        className="absolute inset-0 bg-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />

      {/* Logo with breathing glow */}
      <motion.img
        src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
        alt="OrderSounds"
        className="h-32 md:h-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
        style={{
          filter: "drop-shadow(0 0 40px rgba(124, 58, 237, 0.6))",
        }}
      />

      {/* Breathing glow ring */}
      <motion.div
        className="absolute w-48 h-48 rounded-full border-2 border-primary/50"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ boxShadow: "0 0 60px rgba(124, 58, 237, 0.4)" }}
      />

      <motion.p
        className="text-xl md:text-2xl text-muted-foreground mt-12 font-light tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        The future is in your hands.
      </motion.p>

      {/* Final CTA */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
      >
        <Button size="lg" className="gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Start Now
        </Button>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// SCENE DURATIONS (in seconds)
// ============================================

const SCENE_DURATIONS = [4, 4, 5, 5, 5, 5, 5, 5, 8, 4]; // Total: 50 seconds

const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10];

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
      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-50"
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
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <CurrentSceneComponent />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-4 left-4 right-4 h-1 bg-muted/30 rounded-full overflow-hidden z-50">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default Animations;
