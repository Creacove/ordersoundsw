
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error("Please fill out all fields");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate sending the form
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Your message has been sent! We'll respond shortly.");
    
    // Reset form
    setName("");
    setEmail("");
    setMessage("");
    setIsSubmitting(false);
  };

  return (
    <div className="container py-8 md:py-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-2xl md:text-6xl font-black text-white tracking-tighter uppercase italic mb-4">Contact Us</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have questions about licenses, custom productions, or technical support? We're here to help you create better.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8">
              <h2 className="text-2xl font-bold text-white italic tracking-tight">Direct Channels</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#9A3BDC]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="text-[#9A3BDC] h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Phone</h4>
                    <span className="text-lg font-medium text-white">(234) 123-4567</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#9A3BDC]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="text-[#9A3BDC] h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Email</h4>
                    <span className="text-lg font-medium text-white">support@ordersounds.com</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#9A3BDC]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="text-[#9A3BDC] h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Office</h4>
                    <span className="text-lg font-medium text-white">123 Music Street, Lagos, Nigeria</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1" />
          
          <div className="lg:col-span-6">
            <div className="p-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-[#030407] rounded-[2.8rem] p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 bg-white/[0.03] border-white/5 rounded-xl focus:ring-[#9A3BDC]/50"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-white/[0.03] border-white/5 rounded-xl focus:ring-[#9A3BDC]/50"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="bg-white/[0.03] border-white/5 rounded-2xl focus:ring-[#9A3BDC]/50 resize-none"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-black uppercase italic tracking-tighter text-lg group" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Transmitting..." : (
                      <span className="flex items-center gap-2">
                        Send Message <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
