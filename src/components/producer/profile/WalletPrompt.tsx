
import { Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const WalletPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="group relative mb-8">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
      <div className="relative bg-[#030407] border border-amber-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="font-black text-white italic tracking-tighter uppercase text-lg flex items-center gap-2">
              Payment Method Required
              <AlertCircle size={14} className="text-amber-500/50" />
            </h3>
            <p className="text-white/40 italic text-sm mt-1 max-w-md">
              Add your payout details in settings to receive earnings from your beat sales and soundpacks.
            </p>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/producer/settings?tab=payment')}
          className="h-12 px-8 rounded-xl bg-amber-500 text-black font-black uppercase italic tracking-tighter hover:bg-amber-400 transition-all shrink-0 w-full md:w-auto"
        >
          Configure Payouts
        </Button>
      </div>
    </div>
  );
};

export default WalletPrompt;
