
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { uniqueToast } from "@/lib/toast";
import { logAuthEvent } from "@/lib/authLogger";
import { Logo } from "@/components/ui/Logo";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recoveryMode = searchParams.get('recovery') === 'true';
  const recoveryEmail = searchParams.get('email') || "";
  
  const [email, setEmail] = useState(recoveryEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });
  const { login } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (recoveryMode) {
      const attemptCleanup = async () => {
        try {
          await supabase.auth.signOut({ scope: 'local' });
          try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          } catch (e) {
            console.warn('Could not access storage:', e);
          }
          await logAuthEvent('recovery', 'cleanup_complete', { email: recoveryEmail || undefined });
          uniqueToast.info('Your session has been reset. Please sign in again.');
        } catch (error) {
          console.error('Error during auth recovery:', error);
        }
      };
      attemptCleanup();
    }
  }, [recoveryMode, recoveryEmail]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        if (recoveryMode) {
          await logAuthEvent('recovery', 'login_attempt', { email });
        }
        await login(email, password);
      } catch (error) {
        console.error("Login error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      uniqueToast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        uniqueToast.error(error.message);
        return;
      }

      setResetEmailSent(true);
      uniqueToast.success("Password reset email sent");
    } catch (error) {
      console.error("Password reset error:", error);
      uniqueToast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout hideSidebar>
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#030407]">
        {/* Background Aesthetics */}
        <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-primary/10 blur-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-purple-600/5 blur-[120px] translate-x-1/4 translate-y-1/4 rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Logo size="desktop" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                {showForgotPassword ? "Reset" : "Welcome"} <span className="text-primary">Back</span>
              </h1>
              <p className="text-white/40 italic text-lg tracking-tight">
                {showForgotPassword 
                  ? "Enter your email for the magic link" 
                  : "Access your studio and sounds"}
              </p>
            </div>
          </div>

          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-2">
              {showForgotPassword && (
                <button 
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-black uppercase italic tracking-widest mb-4"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              )}
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {recoveryMode && (
                <Alert className="mb-6 bg-amber-500/10 border-amber-500/50 text-amber-500 rounded-2xl">
                  <AlertTitle className="font-black italic uppercase tracking-wider text-xs">Security Protocol</AlertTitle>
                  <AlertDescription className="text-sm italic">
                    Session reset required. Please sign in again.
                  </AlertDescription>
                </Alert>
              )}

              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Connection</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="reset-email"
                          placeholder="producer@studio.com"
                          className="h-14 bg-white/5 border-white/5 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-14 bg-white hover:bg-white/90 text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Transmitting..." : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          placeholder="name@example.com"
                          className="h-14 bg-white/5 border-white/5 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40">Password</Label>
                        <button 
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-primary italic hover:underline"
                        >
                          Recover?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="h-14 bg-white/5 border-white/5 pl-12 pr-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      className="w-full h-14 bg-white hover:bg-white/90 text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Checking..." : "Sign In"}
                    </Button>

                    <div className="relative flex items-center gap-4 py-2">
                      <div className="h-px bg-white/5 flex-grow" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Social Sign In</span>
                      <div className="h-px bg-white/5 flex-grow" />
                    </div>

                    <GoogleAuthButton mode="login" />
                  </div>
                </form>
              )}
            </CardContent>
            <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
              <p className="text-white/40 italic text-sm">
                Don't have an account?{" "}
                <Link to="/signup" className="text-white font-black uppercase tracking-tight hover:text-primary transition-colors ml-1 inline-flex items-center gap-1 group">
                  Create Account <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
