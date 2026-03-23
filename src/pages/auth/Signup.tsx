
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
import { Eye, EyeOff, Mail, Lock, User, ChevronRight, Music, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [location.search]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Valid email is required";
      valid = false;
    }
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
    if (validateForm()) {
      try {
        await signup(email, password, name, role, referralCode);
      } catch (error: any) {
        toast.error(error.message || "Failed to sign up");
      }
    }
  };

  return (
    <MainLayout hideSidebar>
      <div className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#030407]">
        {/* Background Aesthetics */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/10 blur-[150px] translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-indigo-600/5 blur-[120px] -translate-x-1/4 translate-y-1/4 rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

        <div className="w-full max-w-[480px] relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Logo size="desktop" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                Join the <span className="text-primary">Studio</span>
              </h1>
              <p className="text-white/40 italic text-base tracking-tight">
                Create your account to start your journey
              </p>
            </div>
          </div>

          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("buyer")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-3xl border-2 transition-all group",
                      role === "buyer" 
                        ? "bg-primary/20 border-primary text-white" 
                        : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                    )}
                  >
                    <ShoppingBag className={cn("h-5 w-5 transition-transform group-hover:scale-110", role === "buyer" ? "text-primary" : "text-white/20")} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Buyer / Fan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("producer")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-3xl border-2 transition-all group",
                      role === "producer" 
                        ? "bg-primary/20 border-primary text-white" 
                        : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                    )}
                  >
                    <Music className={cn("h-5 w-5 transition-transform group-hover:scale-110", role === "producer" ? "text-primary" : "text-white/20")} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Producer</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="h-12 bg-white/5 border-white/5 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        placeholder="producer@studio.com"
                        className="h-14 bg-white/5 border-white/5 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="h-14 bg-white/5 border-white/5 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Confirm</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          className="h-14 bg-white/5 border-white/5 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all italic font-medium"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-tighter text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Join Studio"}
                  </Button>

                  <div className="relative flex items-center gap-4 py-2">
                    <div className="h-px bg-white/5 flex-grow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Or Continue With</span>
                    <div className="h-px bg-white/5 flex-grow" />
                  </div>

                  <GoogleAuthButton mode="signup" />
                </div>
              </form>
            </CardContent>
            <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
              <p className="text-white/40 italic text-sm">
                Already part of the studio?{" "}
                <Link to="/login" className="text-white font-black uppercase tracking-tight hover:text-primary transition-colors ml-1 inline-flex items-center gap-1 group">
                  Sign In <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
