
import { supabase } from '@/integrations/supabase/client';

export interface ProducerBankDetails {
  bankCode: string;
  accountNumber: string;
  accountName?: string;
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Get the appropriate secret key based on environment
const getPaystackSecretKey = () => {
  // Always use live key for production
  const liveKey = 'PAYSTACK_SECRET_KEY_LIVE';
  console.log('Using live Paystack secret key for operations');
  return liveKey;
};

const makePaystackRequest = async (endpoint: string, method: string = 'GET', data?: any) => {
  try {
    console.log(`Making Paystack API request: ${method} ${endpoint}`);
    
    const response = await supabase.functions.invoke('paystack-operations', {
      body: {
        operation: endpoint.includes('split') ? 'create-split' : 'resolve-account',
        endpoint,
        method,
        data
      }
    });

    if (response.error) {
      throw new Error(`Paystack API error: ${response.error.message}`);
    }

    return response.data;
  } catch (error) {
    console.error('Paystack request failed:', error);
    throw error;
  }
};

export const fetchSupportedBanks = async () => {
  try {
    console.log('Fetching supported banks from Paystack');
    
    const response = await supabase.functions.invoke('paystack-operations', {
      body: {
        operation: 'fetch-banks',
        endpoint: '/bank',
        method: 'GET'
      }
    });

    if (response.error) {
      throw new Error(`Failed to fetch banks: ${response.error.message}`);
    }

    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching supported banks:', error);
    throw error;
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

    if (response.data?.status && response.data.data?.account_name) {
      console.log('Account resolved successfully in LIVE mode');
      return response.data.data.account_name;
    }

    return null;
  } catch (error) {
    console.error('Error resolving account number:', error);
    return null;
  }
};
