
import { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { uniqueToast } from "@/lib/toast";
import { logAuthEvent } from "@/lib/authLogger";
import { Logo } from "@/components/ui/Logo";

export default function Login() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
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
  const { login, refreshSession } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    // If in recovery mode, attempt to clean any problematic auth state
    if (recoveryMode) {
      const attemptCleanup = async () => {
        try {
          // Sign out locally first to clear any problematic tokens
          await supabase.auth.signOut({ scope: 'local' });
          
          // Clear auth storage
          try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          } catch (e) {
            console.warn('Could not access storage:', e);
          }
          
          // Log the recovery attempt
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
    const newErrors = {
      email: "",
      password: ""
    };

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              className="pl-10"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="pl-10 pr-10"
              autoCapitalize="none"
              autoComplete="current-password"
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
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setResetEmail(email);
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors text-left underline underline-offset-4"
          >
            Forgot password?
          </button>
        </div>
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="mt-2 w-full transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword}>
      <div className="grid gap-4">
        {resetEmailSent ? (
          <Alert className="mb-4">
            <AlertDescription>
              Password reset email sent! Please check your inbox and spam/junk folders for instructions.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  placeholder="name@example.com"
                  type="email"
                  className="pl-10"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isSubmitting}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="mt-2 w-full transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" />
                  Sending reset email...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </>
        )}
        <Button 
          type="button" 
          variant="ghost" 
          onClick={() => {
            setShowForgotPassword(false);
            setResetEmailSent(false);
          }}
          className="mt-2"
        >
          Back to Login
        </Button>
      </div>
    </form>
  );

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
              <CardTitle className="text-2xl font-bold tracking-tight text-center">
                {showForgotPassword ? "Reset Password" : recoveryMode ? "Session Recovery" : "Welcome back"}
              </CardTitle>
              <CardDescription className="text-center">
                {showForgotPassword
                  ? "Enter your email to receive a password reset link"
                  : recoveryMode
                    ? "Please sign in again to restore your session"
                    : "Enter your credentials to sign in to your account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {recoveryMode && (
                <Alert className="bg-amber-500/10 border-amber-500/50 text-amber-600">
                  <AlertTitle>Session recovery mode</AlertTitle>
                  <AlertDescription>
                    Your previous session encountered an error. Sign in again to fix the issue.
                  </AlertDescription>
                </Alert>
              )}
            
              {showForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}
              {!showForgotPassword && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>
                  <GoogleAuthButton mode="login" />
                </>
              )}
            </CardContent>
            <div className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">
                {showForgotPassword ? "" : "Don't have an account? "}
                <Link
                  to="/signup"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  {showForgotPassword ? "" : "Sign up"}
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
