
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Mail, Music, Headphones, Volume2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/Logo';

const getTimeRemaining = (launchDate: string) => {
  const total = Date.parse(launchDate) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
  return { total, days, hours, minutes, seconds };
};

const formatLaunchDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  });
};

export default function ProducerActivation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const launchDate = '2025-04-25T00:00:00';
  const formattedLaunchDate = formatLaunchDate(launchDate);
  
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(launchDate));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(launchDate);
      setTimeLeft(remaining);
      
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [launchDate]);
  
  useEffect(() => {
    document.title = "Studio Preparing | OrderSOUNDS";
  }, []);

  const CountdownUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/5 border border-white/5 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-3 group hover:border-primary/50 transition-colors">
        <span className="text-xl md:text-3xl font-black italic tracking-tighter text-white group-hover:text-primary transition-colors">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{label}</span>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-[#030407] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-primary/10 blur-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-purple-600/5 blur-[120px] translate-x-1/4 translate-y-1/4 rounded-full" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <div className="max-w-2xl w-full relative z-10 space-y-12">
        <div className="flex justify-center">
          <Logo size="desktop" />
        </div>

        <div className="relative p-[1px] rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent">
          <div className="bg-[#030407] rounded-[2.9rem] p-8 md:p-16 text-center border border-white/5 backdrop-blur-xl relative overflow-hidden">
            {/* Visual Indicators */}
            <div className="absolute top-8 right-8 flex items-center gap-2">
               <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary italic">Studio Status</span>
                  <span className="text-[10px] font-bold text-white/40 italic">In Session</span>
               </div>
               <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Volume2 size={14} className="text-primary animate-pulse" />
               </div>
            </div>

            <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative group">
              <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Headphones className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-4 mb-12">
              <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                Studio <span className="text-primary">Preparing</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest italic">
                <Calendar className="h-4 w-4 text-primary" />
                Live Broadcast: {formattedLaunchDate}
              </div>
            </div>

            <p className="text-white/40 italic text-lg leading-relaxed max-w-md mx-auto mb-12">
              We're fine-tuning the studio for the next generation of producers. Your creative workspace will be ready for launch very soon.
            </p>

            <div className="grid grid-cols-4 gap-4 md:gap-8 mb-12 max-w-md mx-auto">
              <CountdownUnit value={timeLeft.days} label="Days" />
              <CountdownUnit value={timeLeft.hours} label="Hours" />
              <CountdownUnit value={timeLeft.minutes} label="Minutes" />
              <CountdownUnit value={timeLeft.seconds} label="Seconds" />
            </div>

            <div className="pt-8 border-t border-white/5 space-y-6">
              {user && (
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-1">PRODUCER ID</p>
                   <p className="text-white font-bold italic tracking-tighter">{user.email}</p>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button 
                  className="h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter px-10 hover:bg-white/90 shadow-xl shadow-white/5"
                  asChild
                >
                  <a href="mailto:info@creacove.com?subject=Studio%20Access%20Inquiry">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Studio
                  </a>
                </Button>
                
                <Button 
                  variant="ghost"
                  className="h-14 rounded-2xl border border-white/10 bg-white/5 text-white font-black uppercase italic tracking-tighter px-10 hover:bg-white/10"
                  onClick={() => navigate('/')}
                >
                  Return Home
                </Button>
              </div>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-6 opacity-30 grayscale">
               <div className="flex items-center gap-2">
                 <Music size={12} />
                 <span className="text-[8px] font-black tracking-widest uppercase italic">HQ AUDIO READY</span>
               </div>
               <div className="flex items-center gap-2">
                 <Volume2 size={12} />
                 <span className="text-[8px] font-black tracking-widest uppercase italic">MIXER ONLINE</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
