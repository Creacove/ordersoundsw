
import { ProducerWalletDetailsForm } from "@/components/payment/ProducerWalletDetailsForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle, Wallet } from "lucide-react";
import { useState, useEffect } from "react";

interface WalletDetailsCardProps {
  userId: string;
  producerData: any;
  onSuccess: () => void;
}

export function WalletDetailsCard({
  userId,
  producerData,
  onSuccess,
}: WalletDetailsCardProps) {
  const hasWalletAddress = !!producerData?.wallet_address;
  const [justUpdated, setJustUpdated] = useState(false);

  // Reset "just updated" status after a time
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (justUpdated) {
      timeoutId = setTimeout(() => {
        setJustUpdated(false);
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [justUpdated]);

  const handleWalletUpdate = () => {
    setJustUpdated(true);
    onSuccess();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Wallet size={16} className="text-primary" />
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
            Solana <span className="text-primary">Vault</span>
          </h3>
        </div>
        <p className="text-[11px] text-white/40 italic leading-relaxed">
          Initialize your digital wallet to receive cross-border revenue. 
          90% of global sales are settled instantly in USDC/SOL.
        </p>
      </div>

      <div className="flex-1">
        {!hasWalletAddress && (
          <Alert className="mb-6 bg-primary/5 border-primary/10 rounded-2xl py-3 px-4">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-primary italic">Initialization Required</AlertTitle>
            <AlertDescription className="text-[10px] text-white/40 italic uppercase tracking-wider">
              Activate your vault to enable global marketplace transactions.
            </AlertDescription>
          </Alert>
        )}
        
        <ProducerWalletDetailsForm
          producerId={userId}
          walletAddress={producerData?.wallet_address}
          onSuccess={handleWalletUpdate}
        />
        
        {(hasWalletAddress && !justUpdated) && (
          <Alert className="mt-6 bg-emerald-500/5 border-emerald-500/10 rounded-2xl py-3 px-4">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Vault Active</AlertTitle>
            <AlertDescription className="text-[10px] text-white/40 italic uppercase tracking-wider">
              Global revenue routing operational.
            </AlertDescription>
          </Alert>
        )}
        
        {justUpdated && (
          <Alert className="mt-6 bg-emerald-500/5 border-emerald-500/10 rounded-2xl py-3 px-4">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Vault Reconfigured</AlertTitle>
            <AlertDescription className="text-[10px] text-white/40 italic uppercase tracking-wider">
              Protocol updated successfully.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
