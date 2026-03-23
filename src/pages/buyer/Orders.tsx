
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Order History | OrderSOUNDS";
    
    if (!user) {
      navigate('/login', { state: { from: '/orders' } });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="max-w-md mx-auto p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <ShieldCheck className="h-10 w-10 text-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Sign In Required</h1>
          <p className="text-white/50 italic mb-8">Please sign in to view your order history.</p>
          <Button onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg bg-white text-black hover:bg-white/90">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12">
        <SectionTitle 
          title="Order History" 
          icon={<ClipboardList className="h-6 w-6" />}
        />
        <p className="text-white/40 italic mt-2">A comprehensive record of your past purchases and sound acquisitions.</p>
      </div>
      
      <div className="relative p-[1px] rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent">
        <div className="bg-[#030407] rounded-[1.9rem] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 px-8">Order ID</TableHead>
                <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6">Date</TableHead>
                <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6">Items</TableHead>
                <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6">Total</TableHead>
                <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6">Status</TableHead>
                <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 px-8 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-white/5 hover:bg-white/[0.02] transition-colors">
                <TableCell colSpan={6} className="text-center py-32">
                  <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-white/10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">No Orders Found</h3>
                      <p className="text-white/40 text-sm italic">You haven't made any purchases yet. Start exploring the marketplace.</p>
                    </div>
                    <Button 
                      className="h-12 px-8 rounded-xl font-black uppercase italic tracking-tighter bg-white text-black hover:bg-white/90"
                      onClick={() => navigate('/')}
                    >
                      Browse Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
