
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  
  useEffect(() => {
    // Check if we're on this page with a valid recovery token
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      // If we have an access token but the user is not fully authenticated,
      // it means we're likely in the password recovery flow
      if (!data?.session?.user?.id && !data?.session?.access_token) {
        toast({
          title: "Invalid or Expired Link",
          description: "This password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
        // Redirect after a short delay
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      password: "",
      confirmPassword: ""
    };

    // Password validation
    if (!password) {
      newErrors.password = "New password is required";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
      valid = false;
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain at least one number";
      valid = false;
    } else if (!/(?=.*[!@#$%^&*])/.test(password)) {
      newErrors.password = "Password must contain at least one special character (!@#$%^&*)";
      valid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (password !== confirmPassword) {
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
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setResetSuccessful(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You will be redirected to login."
      });
      
      // Sign out to prevent auto-login
      await supabase.auth.signOut();
      
      // Redirect to login after successful password reset
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <MainLayout hideSidebar currentPath={location.pathname}>
      <div className="container relative h-screen flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-purple-800/80 to-zinc-900/90" />
            <img
              src="https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop"
              alt="Authentication"
              className="object-cover w-full h-full opacity-50 mix-blend-overlay"
            />
          </div>
          <div className="relative z-20 mt-auto">
            <div className="mb-4">
              <div className="w-12 h-1 bg-primary mb-3 rounded-full"></div>
              <Logo size="desktop" showText className="mb-2" />
              <p className="text-white/70">Your ultimate sound experience</p>
            </div>
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Discover premium audio that transforms your creative projects. Join our community of passionate creators and elevate your sound experience."
              </p>
              <footer className="text-sm text-white/70">Creative Director</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8 flex items-center justify-center w-full h-full overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-800/20 to-zinc-900/10 lg:hidden" />
          <Card className="mx-auto flex w-full flex-col justify-center sm:w-[350px] bg-background/95 backdrop-blur-sm border border-border/20 shadow-xl animate-fade-in relative z-10">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <Logo size="mobile" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">
                Create a new password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {resetSuccessful ? (
                <Alert>
                  <AlertDescription>
                    Your password has been successfully updated. You'll be redirected to the login page shortly.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          disabled={isSubmitting}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500">{errors.password}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          disabled={isSubmitting}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Password requirements:</p>
                      <ul className="list-disc list-inside pl-2 text-xs space-y-1 mt-1">
                        <li>At least 8 characters long</li>
                        <li>Include at least one uppercase letter</li>
                        <li>Include at least one number</li>
                        <li>Include at least one special character (!@#$%^&*)</li>
                      </ul>
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 w-full transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" />
                          Updating Password...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
