
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { usePaystackSplit } from "@/hooks/payment/usePaystackSplit";
import { fetchSupportedBanks } from "@/utils/payment/paystackSplitUtils";
import { useAuth } from "@/context/AuthContext";

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
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-medium text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bank Account Connected
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {getBankNameFromCode(existingBankCode)} Account{" "}
                {existingAccountName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Account Number: {formatAccountNumber(existingAccountNumber)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1"
            >
              <PenLine className="h-3 w-3" />
              <span>Edit Bank Details</span>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="bank_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-80">
                    {isLoadingBanks ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading banks...</span>
                      </div>
                    ) : (
                      banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
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
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter 10-digit account number"
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
              className={`p-3 rounded-md ${
                isVerifying
                  ? "bg-blue-50 border border-blue-200"
                  : accountName
                  ? "bg-green-50 border border-green-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-blue-600">
                      Verifying account details...
                    </span>
                  </>
                ) : accountName ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Account Name: {accountName}
                    </span>
                  </>
                ) : existingAccountName ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">
                      Account Name: {existingAccountName}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      Account verification failed
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Verification warning */}
          {verificationWarning && (
            <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700">
                  {verificationWarning}
                </span>
              </div>
            </div>
          )}

          <FormDescription className="text-xs">
            Your bank details are securely encrypted and only used for payment
            processing. Please ensure your account details are correct to avoid
            payment issues.
          </FormDescription>

          <div className="flex justify-end space-x-2">
            {hasCompleteDetails && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isVerifying}
              className="relative"
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <span className={isLoading ? "opacity-0" : ""}>
                {existingBankCode ? "Save Changes" : "Save Bank Details"}
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
