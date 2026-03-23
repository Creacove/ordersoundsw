
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { usePaystackSplit } from "@/hooks/payment/usePaystackSplit";
import { fetchSupportedBanks } from "@/utils/payment/paystackSplitUtils";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Bank {
  name: string;
  code: string;
  active: boolean;
  id: number;
}

interface ProducerBankDetailsFormProps {
  producerId: string;
  existingBankCode?: string;
  existingAccountNumber?: string;
  existingAccountName?: string;
  onSuccess?: () => void;
}

const formSchema = z.object({
  bank_code: z.string().min(1, "Bank selection is required"),
  account_number: z
    .string()
    .min(10, "Account number must be at least 10 digits"),
});

export function ProducerBankDetailsForm({
  producerId,
  existingBankCode,
  existingAccountNumber,
  existingAccountName,
  onSuccess,
}: ProducerBankDetailsFormProps) {
  // Always default to read-only mode if bank details exist
  const hasCompleteDetails = !!(
    existingBankCode &&
    existingAccountNumber &&
    existingAccountName
  );

  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!hasCompleteDetails);
  const [verificationWarning, setVerificationWarning] = useState<string | null>(null);
  const { user, updateProfile, updateUserInfo } = useAuth();
  const {
    isLoading,
    accountName,
    isVerifying,
    updateBankDetails,
    verifyBankAccount,
  } = usePaystackSplit();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bank_code: existingBankCode || "",
      account_number: existingAccountNumber || "",
    },
  });

  // Load banks only when in edit mode
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const banksList = await fetchSupportedBanks();
        // Filter only active banks
        const activeBanks = banksList.filter((bank: Bank) => bank.active);
        setBanks(
          activeBanks.sort((a: Bank, b: Bank) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Error loading banks:", error);
        toast({
          title: "Error",
          description: "Failed to load bank list. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBanks(false);
      }
    };

    if (isEditMode) {
      loadBanks();
    }
  }, [toast, isEditMode]);

  // Verify account number when changed
  const onAccountChange = async (bankCode: string, accountNumber: string) => {
    if (bankCode && accountNumber && accountNumber.length >= 10) {
      setVerificationWarning(null);
      const isVerified = await verifyBankAccount(accountNumber, bankCode);
      
      // Check if verification failed due to unsupported bank
      if (!isVerified && accountName?.includes('verification not supported')) {
        setVerificationWarning('This bank does not support automatic verification. You can still proceed with account creation.');
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User session not found",
        variant: "destructive",
      });
      return;
    }

    // Try to verify the account, but don't block if verification is unsupported
    let verificationPassed = false;
    let finalAccountName = accountName;
    
    try {
      verificationPassed = await verifyBankAccount(values.account_number, values.bank_code);
      
      // If verification is unsupported but we have an account name, allow proceeding
      if (!verificationPassed && accountName?.includes('verification not supported')) {
        finalAccountName = `${getBankNameFromCode(values.bank_code)} Account`;
        verificationPassed = true; // Allow proceeding
        console.log('Proceeding with unverified bank account due to lack of verification support');
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Allow proceeding if verification fails completely
      finalAccountName = `${getBankNameFromCode(values.bank_code)} Account`;
      verificationPassed = true;
    }

    if (!verificationPassed && !finalAccountName) {
      toast({
        title: "Error",
        description: "Bank account verification failed. Please check your details.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting subaccount creation/update with LIVE key');
      
      // First, update the database directly
      const { error } = await supabase
        .from("users")
        .update({
          bank_code: values.bank_code,
          account_number: values.account_number,
          verified_account_name: finalAccountName,
        })
        .eq("id", producerId);

      if (error) {
        console.error("Error updating bank details in database:", error);
        throw new Error("Failed to update bank details in database");
      }

      // Try to create/update Paystack subaccount with live key
      try {
        console.log('Creating/updating Paystack subaccount in LIVE mode');
        const result = await updateBankDetails(producerId, {
          bankCode: values.bank_code,
          accountNumber: values.account_number,
        });
        
        if (result && result.success && result.data) {
          console.log('Subaccount operation completed successfully in LIVE mode:', result);
          
          // CRITICAL FIX: Save the Paystack codes to the database
          if (result.data.subaccount_code && result.data.split_code) {
            console.log('Saving Paystack codes to database:', {
              subaccount_code: result.data.subaccount_code,
              split_code: result.data.split_code
            });
            
            const { error: codesError } = await supabase
              .from("users")
              .update({
                paystack_subaccount_code: result.data.subaccount_code,
                paystack_split_code: result.data.split_code,
              })
              .eq("id", producerId);

            if (codesError) {
              console.error("Error saving Paystack codes to database:", codesError);
              // Don't throw here, we still want to update the user context
            } else {
              console.log('Paystack codes saved successfully to database');
            }

            // Update local user context with all the new data including Paystack codes
            const updatedUser = {
              ...user,
              bank_code: values.bank_code,
              account_number: values.account_number,
              verified_account_name: finalAccountName,
              paystack_subaccount_code: result.data.subaccount_code,
              paystack_split_code: result.data.split_code,
            };

            if (updateUserInfo) {
              updateUserInfo(updatedUser);
            } else if (updateProfile) {
              await updateProfile(updatedUser);
            }
          } else {
            console.warn('Missing Paystack codes in result:', result.data);
            
            // Still update user context with bank details
            const updatedUser = {
              ...user,
              bank_code: values.bank_code,
              account_number: values.account_number,
              verified_account_name: finalAccountName,
            };

            if (updateUserInfo) {
              updateUserInfo(updatedUser);
            } else if (updateProfile) {
              await updateProfile(updatedUser);
            }
          }
          
          toast({
            title: "Success",
            description: "Bank details and Paystack subaccount updated successfully",
          });
        } else {
          console.warn('Subaccount operation completed with warnings:', result);
          
          // Still update user context with bank details only
          const updatedUser = {
            ...user,
            bank_code: values.bank_code,
            account_number: values.account_number,
            verified_account_name: finalAccountName,
          };

          if (updateUserInfo) {
            updateUserInfo(updatedUser);
          } else if (updateProfile) {
            await updateProfile(updatedUser);
          }
          
          toast({
            title: "Success",
            description: "Bank details saved. Paystack integration may need manual review.",
            variant: "default",
          });
        }
      } catch (splitError) {
        console.error("Error updating Paystack split account:", splitError);
        
        // Continue even if Paystack update fails - we've updated the database
        const updatedUser = {
          ...user,
          bank_code: values.bank_code,
          account_number: values.account_number,
          verified_account_name: finalAccountName,
        };

        if (updateUserInfo) {
          updateUserInfo(updatedUser);
        } else if (updateProfile) {
          await updateProfile(updatedUser);
        }
        
        toast({
          title: "Warning",
          description: `Bank details saved but Paystack integration failed: ${splitError.message}`,
          variant: "default",
        });
      }

      setIsEditMode(false);
      setVerificationWarning(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast({
        title: "Error",
        description: `Failed to save bank details: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Find bank name from bank code
  const getBankNameFromCode = (code: string | undefined): string => {
    if (!code) return "Your Bank";
    const bank = banks.find((b) => b.code === code);
    return bank ? bank.name : "Bank Account";
  };

  // Format account number to show only last 4 digits
  const formatAccountNumber = (accountNumber: string | undefined): string => {
    if (!accountNumber) return "";
    return accountNumber.slice(-4).padStart(accountNumber.length, "*");
  };

  // Always check for complete bank details first - this is our absolute priority
  if (hasCompleteDetails && !isEditMode) {
    // Show read-only view of bank details with edit button
    return (
      <div className="space-y-6">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={16} />
                </div>
                <h3 className="text-sm font-black text-white italic tracking-widest uppercase">
                  Payout Node Active
                </h3>
              </div>
              <div>
                <p className="text-xl font-black text-white italic tracking-tighter uppercase">
                  {getBankNameFromCode(existingBankCode)}
                </p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic mt-1">
                  Account Holder: {existingAccountName}
                </p>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                  Identifier: {formatAccountNumber(existingAccountNumber)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase italic tracking-widest px-4"
            >
              <PenLine className="h-3 w-3 mr-2" />
              Reconfigure
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show form for editing/adding bank details
  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="bank_code"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Financial Institution / Bank</FormLabel>
                <Select
                  disabled={isLoadingBanks || isLoading}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const accountNumber = form.getValues("account_number");
                    if (accountNumber) {
                      onAccountChange(value, accountNumber);
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6">
                      <SelectValue placeholder="Select institution..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#0c0d12] border-white/10 rounded-2xl max-h-80">
                    {isLoadingBanks ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-accent" />
                        <span className="text-[10px] font-black uppercase italic text-white/40">Querying registry...</span>
                      </div>
                    ) : (
                      banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code} className="text-white focus:bg-white/5 focus:text-white py-3 font-bold italic">
                          {bank.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Account Identifier / Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter 10-digit numeric code"
                    className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
                    {...field}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      const bankCode = form.getValues("bank_code");
                      if (bankCode && e.target.value.length >= 10) {
                        onAccountChange(bankCode, e.target.value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account name verification result */}
          {(isVerifying || accountName || existingAccountName) && (
            <div
              className={cn(
                "p-6 rounded-[1.8rem] border transition-all animate-in fade-in duration-500",
                isVerifying
                  ? "bg-[#9A3BDC]/5 border-[#9A3BDC]/20"
                  : (accountName || existingAccountName)
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-red-500/5 border-red-500/20"
              )}
            >
              <div className="flex items-center gap-4">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#9A3BDC]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#9A3BDC] italic">
                      Verifying Node Credentials...
                    </span>
                  </>
                ) : (accountName || existingAccountName) ? (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Account Verified</p>
                      <p className="text-sm font-black text-white italic uppercase tracking-tight">
                        {accountName || existingAccountName}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                      Verification Failure
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Verification warning */}
          {verificationWarning && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest italic leading-relaxed">
                  {verificationWarning}
                </span>
              </div>
            </div>
          )}

          <FormDescription className="text-[9px] font-bold text-white/20 uppercase tracking-[0.1em] italic leading-relaxed">
            Encrypted settlement protocols active. Your financial telemetry remains isolated within the vault.
          </FormDescription>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            {hasCompleteDetails && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
                className="h-14 rounded-2xl border-white/5 bg-transparent text-white/40 font-black uppercase italic tracking-widest px-8 hover:bg-white/5 hover:text-white"
              >
                Abort
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isVerifying}
              className="h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter px-10 hover:bg-white/90 disabled:opacity-50 transition-all flex-1 sm:flex-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
                </div>
              ) : (
                <span>{existingBankCode ? "Commit Changes" : "Establish Payout Node"}</span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
