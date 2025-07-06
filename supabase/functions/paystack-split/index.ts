
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Simplified Paystack API helper - matches paystack-operations pattern
async function makePaystackRequest(endpoint: string, method: string = 'GET', body?: any) {
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE');
  
  if (!paystackSecretKey) {
    console.error('Missing PAYSTACK_SECRET_KEY_LIVE');
    throw new Error('Paystack secret key not configured');
  }

  const url = `https://api.paystack.co${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Making Paystack API request: ${method} ${url}`);
  console.log('Request body:', body ? JSON.stringify(body, null, 2) : 'none');
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`Paystack API response - Status: ${response.status}`);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error(`Paystack API error: ${response.status} - ${result.message || 'Unknown error'}`);
      throw new Error(`Paystack API error: ${result.message || 'Request failed'}`);
    }
    
    if (!result.status) {
      console.error('Paystack API returned unsuccessful status:', result);
      throw new Error(`Paystack API error: ${result.message || 'Operation failed'}`);
    }
    
    return result;
  } catch (error) {
    console.error('Paystack API request failed:', error);
    throw error;
  }
}

// Handle subaccount creation
async function handleCreateSubaccount(requestData: any, supabase: any) {
  const { producerId } = requestData;
  
  if (!producerId) {
    throw new Error('Producer ID is required');
  }
  
  console.log(`Creating subaccount for producer: ${producerId}`);
  
  // Get producer data
  const { data: producer, error: producerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', producerId)
    .eq('role', 'producer')
    .single();
  
  if (producerError || !producer) {
    console.error('Producer not found:', producerError);
    throw new Error('Producer not found');
  }
  
  // Validate required fields
  if (!producer.bank_code || !producer.account_number) {
    console.error('Missing bank details for producer:', producerId);
    throw new Error('Producer bank details are incomplete');
  }
  
  // Create subaccount via Paystack API
  const subaccountBody = {
    business_name: producer.producer_name || producer.full_name || `Producer ${producer.id}`,
    settlement_bank: producer.bank_code,
    account_number: producer.account_number,
    percentage_charge: 0,
    description: `Producer subaccount for OrderSOUNDS platform`,
    primary_contact_email: producer.email,
    primary_contact_name: producer.full_name,
  };
  
  console.log('Creating Paystack subaccount with data:', subaccountBody);
  
  const subaccountResult = await makePaystackRequest('/subaccount', 'POST', subaccountBody);
  const subaccountCode = subaccountResult.data.subaccount_code;
  
  if (!subaccountCode) {
    throw new Error('Failed to get subaccount code from Paystack');
  }
  
  console.log(`Subaccount created successfully: ${subaccountCode}`);
  
  // Create split payment configuration
  const splitBody = {
    name: `Beat Sale Split for Producer ${producerId}`,
    type: "percentage",
    currency: "NGN",
    subaccounts: [
      {
        subaccount: subaccountCode,
        share: 90, // 90% to producer
      }
    ],
    bearer_type: "account",
    bearer_subaccount: null,
  };
  
  console.log('Creating Paystack split with data:', splitBody);
  
  const splitResult = await makePaystackRequest('/split', 'POST', splitBody);
  const splitCode = splitResult.data.split_code;
  
  if (!splitCode) {
    throw new Error('Failed to get split code from Paystack');
  }
  
  console.log(`Split created successfully: ${splitCode}`);
  
  // Update producer record in database
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      paystack_subaccount_code: subaccountCode,
      paystack_split_code: splitCode,
      verified_account_name: subaccountResult.data.account_name || producer.verified_account_name,
    })
    .eq('id', producerId);
  
  if (updateError) {
    console.error('Failed to update producer record:', updateError);
    throw new Error('Failed to save Paystack codes to database');
  }
  
  console.log('Producer record updated successfully');
  
  return {
    success: true,
    data: {
      subaccount_code: subaccountCode,
      split_code: splitCode,
      account_name: subaccountResult.data.account_name,
      bank_name: subaccountResult.data.settlement_bank,
    }
  };
}

// Handle subaccount update
async function handleUpdateSubaccount(requestData: any, supabase: any) {
  const { producerId, bankCode, accountNumber } = requestData;
  
  if (!producerId || !bankCode || !accountNumber) {
    throw new Error('Producer ID, bank code, and account number are required');
  }
  
  console.log(`Updating subaccount for producer: ${producerId}`);
  
  // Get producer data
  const { data: producer, error: producerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', producerId)
    .eq('role', 'producer')
    .single();
  
  if (producerError || !producer) {
    console.error('Producer not found:', producerError);
    throw new Error('Producer not found');
  }
  
  // Update producer bank details in database first
  const { error: dbUpdateError } = await supabase
    .from('users')
    .update({ 
      bank_code: bankCode,
      account_number: accountNumber,
    })
    .eq('id', producerId);
  
  if (dbUpdateError) {
    console.error('Failed to update producer bank details:', dbUpdateError);
    throw new Error('Failed to update bank details in database');
  }
  
  // If no existing subaccount, create new one
  if (!producer.paystack_subaccount_code) {
    console.log('No existing subaccount, creating new one');
    return await handleCreateSubaccount({ producerId }, supabase);
  }
  
  // Update existing subaccount
  const updateBody = {
    settlement_bank: bankCode,
    account_number: accountNumber,
  };
  
  console.log(`Updating existing subaccount: ${producer.paystack_subaccount_code}`);
  
  const updateResult = await makePaystackRequest(
    `/subaccount/${producer.paystack_subaccount_code}`, 
    'PUT', 
    updateBody
  );
  
  // Update verified account name if provided
  if (updateResult.data.account_name) {
    await supabase
      .from('users')
      .update({ verified_account_name: updateResult.data.account_name })
      .eq('id', producerId);
  }
  
  console.log('Subaccount updated successfully');
  
  return {
    success: true,
    data: {
      ...updateResult.data,
      updated: true
    }
  };
}

// Handle split update
async function handleUpdateSplit(requestData: any, supabase: any) {
  const { producerId, share } = requestData;
  
  if (!producerId || !share) {
    throw new Error('Producer ID and share percentage are required');
  }
  
  console.log(`Updating split for producer: ${producerId} to ${share}%`);
  
  // Get producer data
  const { data: producer, error: producerError } = await supabase
    .from('users')
    .select('paystack_split_code, paystack_subaccount_code')
    .eq('id', producerId)
    .eq('role', 'producer')
    .single();
  
  if (producerError || !producer) {
    throw new Error('Producer not found');
  }
  
  if (!producer.paystack_split_code || !producer.paystack_subaccount_code) {
    throw new Error('Producer does not have Paystack split configuration');
  }
  
  // Update split
  const updateBody = {
    subaccounts: [
      {
        subaccount: producer.paystack_subaccount_code,
        share: share,
      }
    ],
  };
  
  const updateResult = await makePaystackRequest(
    `/split/${producer.paystack_split_code}`, 
    'PUT', 
    updateBody
  );
  
  console.log('Split updated successfully');
  
  return {
    success: true,
    data: updateResult.data
  };
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const requestData = await req.json();
    const { action } = requestData;
    
    if (!action) {
      throw new Error('Action is required');
    }
    
    console.log(`Processing action: ${action}`);
    
    let result;
    
    switch (action) {
      case 'create-subaccount':
        result = await handleCreateSubaccount(requestData, supabase);
        break;
        
      case 'update-subaccount':
        result = await handleUpdateSubaccount(requestData, supabase);
        break;
        
      case 'update-split':
        result = await handleUpdateSplit(requestData, supabase);
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
