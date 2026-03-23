
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Logo } from "@/components/ui/Logo";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user?.id && !data?.session?.access_token) {
        toast.error("This password reset link is invalid or has expired.");
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    checkSession();
  }, [navigate]);
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { password: "", confirmPassword: "" };

    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setResetSuccessful(true);
      toast.success("Password updated successfully");
      
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("An unexpected error occurred.");
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
                Reset <span className="text-primary">Studio</span> Key
              </h1>
              <p className="text-white/40 italic text-lg tracking-tight">
                Secure your access with a new password
              </p>
            </div>
          </div>

          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8">
              {resetSuccessful ? (
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
                    <CheckCircle2 size={40} className="animate-in zoom-in duration-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Encryption Updated</h3>
                    <p className="text-white/40 italic">Your password has been successfully updated. Moving to login studio...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">New Password</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Confirm New Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="h-14 bg-white/5 border-white/5 pl-12 pr-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 bg-white hover:bg-white/90 text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              )}
            </CardContent>
            {!resetSuccessful && (
              <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-black uppercase italic tracking-widest w-full"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
