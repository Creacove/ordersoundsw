
import { supabase } from '@/integrations/supabase/client';

export interface ProducerBankDetails {
  bankCode: string;
  accountNumber: string;
  accountName?: string;
}

// Always use live key for production operations
console.log('PaystackSplitUtils: Initializing with live Paystack configuration');

export const fetchSupportedBanks = async () => {
  try {
    console.log('Fetching supported banks from Paystack via edge function');
    
    const response = await supabase.functions.invoke('paystack-operations', {
      body: {
        operation: 'fetch-banks'
      }
    });

    if (response.error) {
      console.error('Error invoking paystack-operations for banks:', response.error);
      throw new Error(`Failed to fetch banks: ${response.error.message}`);
    }

    // Handle both successful API responses and error responses
    if (response.data?.error) {
      console.error('Paystack API error for banks:', response.data.error);
      // Return empty array as fallback to prevent UI crashes
      return [];
    }

    const banks = response.data?.data || [];
    console.log(`Successfully fetched ${banks.length} banks from Paystack`);
    return banks;
  } catch (error) {
    console.error('Error fetching supported banks:', error);
    // Return empty array as fallback to prevent UI crashes
    return [];
  }
};

export const createProducerSubaccount = async (producerId: string) => {
  try {
    console.log('Creating producer subaccount with LIVE key for producer:', producerId);
    
    const response = await supabase.functions.invoke('paystack-split', {
      body: {
        action: 'create-subaccount',
        producerId
      }
    });

    if (response.error) {
      console.error('Error creating subaccount:', response.error);
      throw new Error(`Failed to create subaccount: ${response.error.message}`);
    }

    console.log('Subaccount created successfully in LIVE mode');
    return response.data;
  } catch (error) {
    console.error('Error creating producer subaccount:', error);
    throw error;
  }
};

export const updateProducerBankDetails = async (producerId: string, bankDetails: ProducerBankDetails) => {
  try {
    console.log('Updating producer bank details with LIVE key for producer:', producerId);
    
    const response = await supabase.functions.invoke('paystack-split', {
      body: {
        action: 'update-subaccount',
        producerId,
        bankCode: bankDetails.bankCode,
        accountNumber: bankDetails.accountNumber
      }
    });

    if (response.error) {
      console.error('Error updating bank details:', response.error);
      throw new Error(`Failed to update bank details: ${response.error.message}`);
    }

    console.log('Bank details updated successfully in LIVE mode');
    return response.data;
  } catch (error) {
    console.error('Error updating producer bank details:', error);
    throw error;
  }
};

export const updateProducerSplitPercentage = async (producerId: string, percentage: number) => {
  try {
    console.log('Updating producer split percentage with LIVE key for producer:', producerId);
    
    const response = await supabase.functions.invoke('paystack-split', {
      body: {
        action: 'update-split',
        producerId,
        share: percentage
      }
    });

    if (response.error) {
      console.error('Error updating split percentage:', response.error);
      throw new Error(`Failed to update split percentage: ${response.error.message}`);
    }

    console.log('Split percentage updated successfully in LIVE mode');
    return response.data;
  } catch (error) {
    console.error('Error updating producer split percentage:', error);
    throw error;
  }
};

export const getProducerSplitCode = async (producerId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('paystack_split_code')
      .eq('id', producerId)
      .eq('role', 'producer')
      .maybeSingle();

    if (error) {
      console.error('Error fetching split code:', error);
      return null;
    }

    return data?.paystack_split_code || null;
  } catch (error) {
    console.error('Error getting producer split code:', error);
    return null;
  }
};

export const resolveAccountNumber = async (accountNumber: string, bankCode: string) => {
  try {
    console.log('Resolving account number with LIVE key:', accountNumber, bankCode);
    
    const response = await supabase.functions.invoke('paystack-operations', {
      body: {
        operation: 'resolve-account',
        data: {
          account_number: accountNumber,
          bank_code: bankCode
        }
      }
    });

    if (response.error) {
      console.error('Account resolution failed:', response.error);
      return null;
    }

    // Handle API error responses
    if (response.data?.error) {
      console.error('Paystack API error for account resolution:', response.data.error);
      return null;
    }

    // Handle successful resolution
    if (response.data?.status && response.data.data?.account_name) {
      console.log('Account resolved successfully in LIVE mode');
      return response.data.data.account_name;
    }

    // Handle banks that don't support verification
    if (response.data?.status === false && response.data?.message?.includes('verification')) {
      console.log('Bank does not support verification, proceeding without validation');
      return 'Account verification not supported for this bank';
    }

    return null;
  } catch (error) {
    console.error('Error resolving account number:', error);
    return null;
  }
};
