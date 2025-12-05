import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SCENE_DURATIONS = [4000, 4000, 5000, 5000, 5000, 5000, 5000, 5000, 8000, 4000];

// Particle component for effects
const Particle = ({ delay = 0, color = "#9A3BDC" }: { delay?: number; color?: string }) => {
  const randomX = Math.random() * 100 - 50;
  const randomY = Math.random() * 100 - 50;
  const size = Math.random() * 8 + 4;
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}`,
        left: "50%",
        top: "50%",
      }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        x: randomX * 20,
        y: randomY * 20,
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 2,
        delay,
        ease: "easeOut",
      }}
    />
  );
};

// Scene 1: Boom Intro
const Scene1 = () => {
  const [showText, setShowText] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 800);
    const t2 = setTimeout(() => setShowSecondText(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Particle explosion */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Particle key={i} delay={i * 0.02} />
      ))}
      
      {/* Shockwave */}
      <motion.div
        className="absolute rounded-full border-2 border-[#9A3BDC]"
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ width: 2000, height: 2000, opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ boxShadow: "0 0 60px #9A3BDC" }}
      />
      
      {/* Logo slam */}
      <motion.img
        src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
        alt="OrderSounds"
        className="absolute h-24 w-auto"
        initial={{ scale: 5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
      />
      
      {/* Main text */}
      <AnimatePresence>
        {showText && !showSecondText && (
          <motion.h1
            className="absolute text-6xl md:text-8xl font-black text-white text-center"
            style={{ textShadow: "0 0 40px #9A3BDC, 0 0 80px #9A3BDC" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            DECEMBER & JANUARY
          </motion.h1>
        )}
        {showSecondText && (
          <motion.h1
            className="absolute text-4xl md:text-6xl font-black text-white text-center"
            style={{ textShadow: "0 0 30px #9A3BDC" }}
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            WE'RE BREAKING THE RULES.
          </motion.h1>
        )}
      </AnimatePresence>
    </div>
  );
};

// Scene 2: Chaotic Collage
const Scene2 = () => {
  const texts = ["NO FEES.", "NO CUTS.", "NO LIMITS."];
  const [currentText, setCurrentText] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prev => (prev < 2 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const uiElements = [
    { type: "card", x: -30, y: -20, rotate: -15 },
    { type: "button", x: 25, y: 15, rotate: 10 },
    { type: "waveform", x: -20, y: 30, rotate: -5 },
    { type: "card", x: 35, y: -25, rotate: 20 },
    { type: "button", x: -35, y: 10, rotate: -10 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Floating UI elements */}
      {uiElements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${50 + el.x}%`, top: `${50 + el.y}%` }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            scale: [0, 1, 1, 0.8],
            rotate: el.rotate,
            x: [0, el.x * 2, el.x * 4],
            y: [0, el.y * 2, el.y * 4],
          }}
          transition={{ duration: 3.5, delay: i * 0.15 }}
        >
          {el.type === "card" && (
            <div className="w-32 h-20 bg-card rounded-lg border border-border/50 shadow-xl" 
                 style={{ boxShadow: "0 0 30px rgba(154, 59, 220, 0.3)" }} />
          )}
          {el.type === "button" && (
            <div className="px-4 py-2 bg-primary rounded-md text-white text-sm font-medium">
              Add to Cart
            </div>
          )}
          {el.type === "waveform" && (
            <div className="flex gap-1 items-end h-8">
              {Array.from({ length: 8 }).map((_, j) => (
                <motion.div
                  key={j}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [8, 24, 8] }}
                  transition={{ duration: 0.5, delay: j * 0.1, repeat: Infinity }}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Kinetic text */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentText}
          className="text-7xl md:text-9xl font-black text-white z-10"
          style={{ textShadow: "0 0 60px #9A3BDC" }}
          initial={{ x: 300, opacity: 0, skewX: -20 }}
          animate={{ x: 0, opacity: 1, skewX: 0 }}
          exit={{ x: -300, opacity: 0, skewX: 20 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 150 }}
        >
          {texts[currentText]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
};

// Scene 3: Massive Reveal
const Scene3 = () => {
  const [showMain, setShowMain] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowMain(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Dark void zoom */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ scale: 1 }}
        animate={{ scale: showMain ? 1.5 : 1 }}
        transition={{ duration: 1 }}
      />

      {/* Floating orbs */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 40 + i * 20,
            height: 40 + i * 20,
            background: `radial-gradient(circle, rgba(154, 59, 220, 0.5) 0%, transparent 70%)`,
            left: `${20 + i * 12}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
        />
      ))}

      {/* Main text */}
      <AnimatePresence>
        {showMain && (
          <div className="z-10 text-center">
            <motion.h1
              className="text-8xl md:text-[12rem] font-black text-white leading-none"
              style={{
                textShadow: "0 0 80px #9A3BDC, 0 0 120px #9A3BDC, 0 0 160px rgba(154, 59, 220, 0.5)",
                filter: "url(#distort)",
              }}
              initial={{ scale: 0.3, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              EARN 100%
            </motion.h1>
            <motion.p
              className="text-xl md:text-3xl text-white/80 mt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              When your invited buyer pays with crypto.
            </motion.p>
          </div>
        )}
      </AnimatePresence>

      {/* SVG filter for distortion */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="distort">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

// Scene 4: Crypto Flow Animation
const Scene4 = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const intervals = [1500, 3000, 4500];
    intervals.forEach((time, i) => {
      setTimeout(() => setStep(i + 1), time);
    });
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Flow line */}
      <svg className="absolute w-full h-32" viewBox="0 0 1000 100">
        <motion.path
          d="M 0 50 Q 250 20, 500 50 T 1000 50"
          fill="none"
          stroke="#9A3BDC"
          strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ filter: "drop-shadow(0 0 10px #9A3BDC)" }}
        />
        <motion.circle
          cx="0"
          cy="50"
          r="8"
          fill="#9A3BDC"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            cx: [0, 500, 1000],
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
          style={{ filter: "drop-shadow(0 0 20px #9A3BDC)" }}
        />
      </svg>

      {/* Steps */}
      <div className="absolute flex justify-between w-4/5 px-8">
        {["Invite", "Buyer Purchases", "You Earn 100%"].map((text, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step > i ? 1 : 0.3, y: step > i ? 0 : 30 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-card border-2 border-primary flex items-center justify-center mb-4"
              style={{ boxShadow: step > i ? "0 0 30px #9A3BDC" : "none" }}
              animate={{ scale: step > i ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              {i === 0 && <span className="text-2xl">👤</span>}
              {i === 1 && <span className="text-2xl">💳</span>}
              {i === 2 && <span className="text-2xl">✓</span>}
            </motion.div>
            <span className="text-white font-bold text-lg">{text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Scene 5: Split Screen Comparison
const Scene5 = () => {
  const [crush, setCrush] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCrush(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Crypto side */}
      <motion.div
        className="h-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(154, 59, 220, 0.3) 0%, rgba(34, 197, 94, 0.2) 100%)",
        }}
        initial={{ width: "50%" }}
        animate={{ width: crush ? "100%" : "50%" }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <div className="text-center">
          <motion.h2
            className="text-6xl md:text-8xl font-black text-white"
            style={{ textShadow: "0 0 40px #22c55e" }}
            animate={{ scale: crush ? 1.3 : 1 }}
            transition={{ duration: 0.5 }}
          >
            0% FEE
          </motion.h2>
          <p className="text-2xl text-white/80 mt-4">Crypto Payments</p>
        </div>
      </motion.div>

      {/* Normal side */}
      <motion.div
        className="h-full bg-muted/30 flex items-center justify-center"
        initial={{ width: "50%" }}
        animate={{ width: crush ? "0%" : "50%", opacity: crush ? 0 : 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-black text-muted-foreground">
            20% FEE
          </h2>
          <p className="text-xl text-muted-foreground mt-4">Standard Payments</p>
        </div>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="absolute top-0 bottom-0 w-1 bg-white/30"
        style={{ left: "50%" }}
        animate={{ opacity: crush ? 0 : 1, scaleY: crush ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

// Scene 6: Hero Imagery Cuts
const Scene6 = () => {
  const [currentText, setCurrentText] = useState(0);
  const texts = ["FOR PRODUCERS.", "FOR CREATORS.", "FOR THE CULTURE."];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prev => (prev < 2 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const cuts = Array.from({ length: 12 }).map((_, i) => ({
    x: (i % 4) * 25 + Math.random() * 10,
    y: Math.floor(i / 4) * 33 + Math.random() * 10,
    delay: i * 0.1,
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Rapid cuts */}
      {cuts.map((cut, i) => (
        <motion.div
          key={i}
          className="absolute w-24 h-16 bg-card rounded border border-border/50"
          style={{ left: `${cut.x}%`, top: `${cut.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.8],
            rotate: [0, (i % 2 === 0 ? 5 : -5), 0],
          }}
          transition={{
            duration: 2,
            delay: cut.delay,
            repeat: 1,
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            {i % 3 === 0 && "120 BPM"}
            {i % 3 === 1 && "🎵"}
            {i % 3 === 2 && "TRAP"}
          </div>
        </motion.div>
      ))}

      {/* Flash text */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentText}
          className="text-5xl md:text-8xl font-black text-white z-10 text-center"
          style={{ textShadow: "0 0 60px #9A3BDC" }}
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {texts[currentText]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
};

// Scene 7: Time Window Urgency
const Scene7 = () => {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Glitch overlay */}
      {glitch && (
        <div className="absolute inset-0 z-20">
          <div className="absolute inset-0 bg-[#9A3BDC]/10" style={{ clipPath: "inset(20% 0 60% 0)" }} />
          <div className="absolute inset-0 bg-[#22c55e]/10" style={{ clipPath: "inset(50% 0 30% 0)" }} />
        </div>
      )}

      {/* Neon clock effect */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border-4 border-[#9A3BDC]"
        style={{ boxShadow: "0 0 40px #9A3BDC, inset 0 0 40px rgba(154, 59, 220, 0.3)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute top-1/2 left-1/2 w-1 h-24 bg-[#9A3BDC] origin-bottom"
          style={{ transform: "translate(-50%, -100%)", boxShadow: "0 0 10px #9A3BDC" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Main text */}
      <motion.h1
        className="text-6xl md:text-9xl font-black text-white z-10"
        style={{
          textShadow: "0 0 60px #9A3BDC",
          transform: glitch ? "translateX(3px)" : "translateX(0)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        DEC → JAN ONLY
      </motion.h1>
    </div>
  );
};

// Scene 8: Cashout Moment
const Scene8 = () => {
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Cash particles */}
      {showCard && Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 800,
            y: (Math.random() - 0.5) * 600,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 2, delay: i * 0.05 }}
        >
          💰
        </motion.div>
      ))}

      {/* Payout card */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: showCard ? 1 : 0, rotateY: showCard ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div
          className="bg-card p-8 rounded-2xl border border-border"
          style={{ boxShadow: "0 0 60px rgba(154, 59, 220, 0.5)" }}
        >
          <p className="text-muted-foreground text-lg mb-2">Your Earnings</p>
          <motion.h2
            className="text-6xl md:text-8xl font-black text-white"
            style={{ textShadow: "0 0 30px #22c55e" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            YOU: 100%
          </motion.h2>
          <p className="text-[#22c55e] text-xl mt-4 font-semibold">Platform Fee: $0</p>
        </div>
      </motion.div>
    </div>
  );
};

// Scene 9: Closing Statement
const Scene9 = () => {
  const texts = ["Start Inviting.", "Start Earning.", "Start Winning."];
  const [visibleTexts, setVisibleTexts] = useState<number[]>([]);

  useEffect(() => {
    texts.forEach((_, i) => {
      setTimeout(() => {
        setVisibleTexts(prev => [...prev, i]);
      }, 1500 * (i + 1));
    });
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Drift particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-[#9A3BDC]/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Text stack */}
      <div className="text-center z-10 space-y-4">
        {texts.map((text, i) => (
          <motion.h2
            key={i}
            className="text-4xl md:text-6xl font-bold text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: visibleTexts.includes(i) ? 1 : 0,
              y: visibleTexts.includes(i) ? 0 : 30,
            }}
            transition={{ duration: 0.8 }}
          >
            {text}
          </motion.h2>
        ))}
      </div>

      {/* Light sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 3, delay: 5, ease: "easeInOut" }}
      />
    </div>
  );
};

// Scene 10: Final Logo Hit
const Scene10 = () => {
  const [flash, setFlash] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlash(true), 500);
    const t2 = setTimeout(() => {
      setFlash(false);
      setShowLogo(true);
    }, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 bg-[#9A3BDC]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Logo with breathing glow */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            <motion.img
              src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
              alt="OrderSounds"
              className="h-32 md:h-48 w-auto"
              animate={{
                filter: [
                  "drop-shadow(0 0 20px #9A3BDC)",
                  "drop-shadow(0 0 40px #9A3BDC)",
                  "drop-shadow(0 0 20px #9A3BDC)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.p
              className="text-white/60 text-lg md:text-xl mt-8 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              The future is in your hands.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10];

export default function Animations() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    if (currentScene >= scenes.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentScene(prev => prev + 1);
    }, SCENE_DURATIONS[currentScene]);

    return () => clearTimeout(timer);
  }, [currentScene]);

  const CurrentSceneComponent = scenes[currentScene];

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden">
      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scene container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentSceneComponent />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/10 rounded-full overflow-hidden z-50">
        <motion.div
          className="h-full bg-[#9A3BDC]"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
