
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Rocket, Calendar, Clock3, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

// Helper function to calculate time remaining
const getTimeRemaining = (launchDate: string) => {
  const total = Date.parse(launchDate) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
  return { total, days, hours, minutes, seconds };
};

// Format date to display in a nice format
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
  const location = useLocation();
  const launchDate = '2025-04-25T00:00:00';  // Updated launch date
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
  
  // Timer display components
  const CountdownUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-primary/10 text-primary w-16 h-16 rounded-lg flex items-center justify-center mb-2">
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
  
  return (
    <MainLayout hideSidebar currentPath={location.pathname}>
      <div className="h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-6">
        <div className="bg-card p-8 sm:p-10 rounded-lg shadow-lg max-w-md w-full text-center border border-border relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>

          {/* Logo */}
          <div className="flex justify-center mb-6 relative z-10">
            <Logo size="mobile" />
          </div>

          {/* Icon and heading */}
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <Rocket className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Coming Soon
          </h1>
          
          <div className="flex items-center justify-center gap-1 mb-6">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">{formattedLaunchDate}</p>
          </div>
          
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
            We're putting the final touches on the producer platform. Get ready for an amazing launch!
          </p>
          
          {/* Countdown timer */}
          <div className="bg-background/50 backdrop-blur-sm p-6 rounded-lg border border-border mb-8">
            <div className="flex justify-center gap-4 sm:gap-6">
              <CountdownUnit value={timeLeft.days} label="Days" />
              <CountdownUnit value={timeLeft.hours} label="Hours" />
              <CountdownUnit value={timeLeft.minutes} label="Minutes" />
              <CountdownUnit value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>
          
          {user && (
            <div className="text-sm text-muted-foreground mb-6 bg-muted/50 p-3 rounded-md">
              <p>You'll receive an email at <span className="font-medium text-foreground">{user.email}</span> when we launch.</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              className="min-w-[200px] gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
              asChild
            >
              <a href="mailto:info@creacove.com?subject=Producer%20Platform%20Launch%20Inquiry">
                <Mail className="h-4 w-4" />
                Contact Us
              </a>
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Have questions about the launch? We're here to help!
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
