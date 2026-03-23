
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";
import { Building2 } from "lucide-react";

interface BankDetailsCardProps {
  userId: string;
  producerData: any;
  onSuccess: () => void;
}

export function BankDetailsCard({
  userId,
  producerData,
  onSuccess,
}: BankDetailsCardProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Building2 size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
            Banking <span className="text-emerald-500">Node</span>
          </h3>
        </div>
        <p className="text-[11px] text-white/40 italic leading-relaxed">
          Configure your Nigerian bank details to activate automated NGN settlements. 
          Receive 90% revenue directly to your local account.
        </p>
      </div>

      <div className="flex-1">
        <ProducerBankDetailsForm
          producerId={userId}
          existingBankCode={producerData?.bank_code}
          existingAccountNumber={producerData?.account_number}
          existingAccountName={producerData?.verified_account_name}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}
