
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { toast } from "sonner";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Signup() {
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"buyer" | "producer">("buyer");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { signup, isLoading } = useAuth();

  // Extract referral code from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [location.search]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

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
    } else if (password.length < 6) {
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
    
    if (validateForm()) {
      try {
        await signup(email, password, name, role, referralCode);
      } catch (error: any) {
        toast.error(error.message || "Failed to sign up");
      }
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
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
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
                "Join our creative community and explore a world of professional audio that will bring your projects to life. Elevate your craft with premium sound quality."
              </p>
              <footer className="text-sm text-white/70">Head of Design</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8 flex items-center justify-center w-full h-full overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/30 via-indigo-600/20 to-zinc-900/10 lg:hidden" />
          <Card className="mx-auto flex w-full flex-col justify-center sm:w-[350px] bg-background/95 backdrop-blur-sm border border-border/20 shadow-xl animate-fade-in relative z-10 my-4">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-center mb-2">
                <Logo size="mobile" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-center">Create an account</CardTitle>
              <CardDescription className="text-center text-sm">
                Sign up to access premium sound content
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-3">
                  {/* Name and Email Row - Stacked vertically */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="name" className="text-sm">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="John Doe"
                          type="text"
                          className="pl-10 h-10"
                          autoCapitalize="none"
                          autoCorrect="off"
                          disabled={isLoading}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          placeholder="name@example.com"
                          type="email"
                          className="pl-10 h-10"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
                          disabled={isLoading}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Password Fields - Compact stacked */}
                  <div className="grid gap-1">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 h-10"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pl-10 pr-10 h-10"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        disabled={isLoading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Role Selection Toggle */}
                  <div className="grid gap-2">
                    <Label className="text-sm">I am a:</Label>
                    <ToggleGroup type="single" value={role} onValueChange={(value) => value && setRole(value as "buyer" | "producer")}>
                      <ToggleGroupItem value="buyer">Buyer</ToggleGroupItem>
                      <ToggleGroupItem value="producer">Producer</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-1 h-11 w-full transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </div>
              </form>
              
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
              
              <GoogleAuthButton mode="signup" />
            </CardContent>
            <div className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
