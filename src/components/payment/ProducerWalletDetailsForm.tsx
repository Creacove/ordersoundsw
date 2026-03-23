
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Create the zod schema for validation
const WalletSchema = z.object({
  walletAddress: z.string().min(32, {
    message: "Wallet address must be at least 32 characters.",
  }).max(44, {
    message: "Wallet address cannot exceed 44 characters.",
  }),
});

type WalletFormValues = z.infer<typeof WalletSchema>;

interface ProducerWalletDetailsFormProps {
  producerId: string;
  walletAddress?: string;
  onSuccess: () => void;
}

export function ProducerWalletDetailsForm({ producerId, walletAddress, onSuccess }: ProducerWalletDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(WalletSchema),
    defaultValues: {
      walletAddress: walletAddress || '',
    },
  });

  async function onSubmit(values: WalletFormValues) {
    try {
      setIsSubmitting(true);
      
      // Update the producer's wallet address in the database
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: values.walletAddress })
        .eq('id', producerId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Wallet address updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating wallet address:', error);
      toast.error('Failed to update wallet address');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="walletAddress"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 italic ml-1">Solana Payout Node / Wallet Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your Solana (SPL) address"
                  className="h-14 rounded-2xl bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 italic font-bold focus:ring-[#9A3BDC]/50 transition-all px-6"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic leading-relaxed">
                Primary settlement address for USDC-SPL distributions. Ensure this corresponds to a secure hardware or verified software vault.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter px-10 hover:bg-white/90 disabled:opacity-50 transition-all w-full md:w-auto"
        >
          {isSubmitting ? 'Syncing Address...' : 'Commit Wallet Address'}
        </Button>
      </form>
    </Form>
  );
}
