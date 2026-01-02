
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const PAYSTACK_API_URL = "https://api.paystack.co";
const PLATFORM_SHARE_PERCENT = 10; // 10% of the beat price goes to the platform
const PRODUCER_SHARE_PERCENT = 90; // 90% goes to the producer

// Function for external API calls (returns Response wrapper for endpoint responses)
async function makePaystackRequest(endpoint: string, method: string, body?: any) {
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')!;
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
  
  console.log(`Making Paystack request: ${method} ${url}`);
  
  const response = await fetch(url, options);
  const result = await response.json();
  
  // Log mode detection for debugging
  if (result.data && typeof result.data === 'object') {
    console.log(`Paystack API response received - Status: ${response.status}`);
  }
  
  return new Response(
    JSON.stringify(result),
    { 
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Function for internal use (returns raw Paystack data)
async function makePaystackApiCall(endpoint: string, method: string, body?: any) {
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')!;
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
  
  console.log(`Making internal Paystack API call: ${method} ${url}`);
  
  const response = await fetch(url, options);
  const result = await response.json();
  
  console.log(`Paystack API call completed - Status: ${response.status}, Success: ${result.status}`);
  
  if (!response.ok || !result.status) {
    console.error('Paystack API error:', result);
    throw new Error(`Paystack API error: ${result.message || 'Unknown error'}`);
  }
  
  return result;
}

// Function to create a Paystack subaccount for a producer
async function createSubaccount(producer: any) {
  try {
    console.log(`Creating subaccount for producer: ${producer.id}`);
    
    const body = {
      business_name: producer.producer_name || producer.full_name || `Producer ${producer.id}`,
      settlement_bank: producer.bank_code,
      account_number: producer.account_number,
      percentage_charge: 0, // We will handle the split via split payment, not via subaccount charge
      description: `Producer subaccount for OrderSOUNDS platform`,
      primary_contact_email: producer.email,
      primary_contact_name: producer.full_name,
    };
    
    const result = await makePaystackApiCall('/subaccount', 'POST', body);
    
    console.log('Subaccount created successfully:', result.data.subaccount_code);
    
    return {
      subaccount_code: result.data.subaccount_code,
      bank_name: result.data.settlement_bank,
      account_name: result.data.account_name,
    };
  } catch (error) {
    console.error('Error creating subaccount:', error);
    throw error;
  }
}

// Function to create a transaction split
async function createTransactionSplit(producerId: string, subaccountCode: string) {
  try {
    console.log(`Creating transaction split for producer: ${producerId}`);
    
    const body = {
      name: `Beat Sale Split for Producer ${producerId}`,
      type: "percentage",
      currency: "NGN",
      subaccounts: [
        {
          subaccount: subaccountCode,
          share: PRODUCER_SHARE_PERCENT,
        }
      ],
      bearer_type: "account", // Main account bears the fees
      bearer_subaccount: null,
    };
    
    const result = await makePaystackApiCall('/split', 'POST', body);
    
    console.log('Transaction split created successfully:', result.data.split_code);
    
    return {
      split_code: result.data.split_code,
      share: PRODUCER_SHARE_PERCENT,
    };
  } catch (error) {
    console.error('Error creating transaction split:', error);
    throw error;
  }
}

// Function to fetch all subaccounts
async function fetchSubaccounts() {
  try {
    const result = await makePaystackApiCall('/subaccount', 'GET');
    return result.data;
  } catch (error) {
    console.error('Error fetching subaccounts:', error);
    throw error;
  }
}

// Function to fetch all transaction splits
async function fetchSplits() {
  try {
    const result = await makePaystackApiCall('/split', 'GET');
    return result.data;
  } catch (error) {
    console.error('Error fetching splits:', error);
    throw error;
  }
}

// Function to update a subaccount
async function updateSubaccount(subaccountCode: string, updates: any) {
  try {
    const result = await makePaystackApiCall(`/subaccount/${subaccountCode}`, 'PUT', updates);
    return result.data;
  } catch (error) {
    console.error('Error updating subaccount:', error);
    throw error;
  }
}

// Function to update a transaction split
async function updateSplit(splitCode: string, updates: any) {
  try {
    const result = await makePaystackApiCall(`/split/${splitCode}`, 'PUT', updates);
    return result.data;
  } catch (error) {
    console.error('Error updating split:', error);
    throw error;
  }
}

// Function to validate Paystack webhook request
function validateWebhook(signature: string, requestBody: any, secretKey: string): boolean {
  try {
    if (!signature) {
      console.error('Missing x-paystack-signature header');
      return false;
    }
    
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(requestBody))
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    console.error('Error validating webhook:', error);
    return false;
  }
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Get Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')!;
  
  if (!paystackSecretKey) {
    console.error('Missing Paystack secret key');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Server configuration error: Missing Paystack key',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Parse request body
    let requestData;
    if (req.method === 'POST' || req.method === 'PUT') {
      requestData = await req.json();
    }
    
    // Extract action from request body or check for webhook
    const action = requestData?.action || (req.headers.get('x-paystack-signature') ? 'webhook' : null);
    
    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No action specified',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    console.log(`Processing Paystack split action: ${action}`, { method: req.method });
    
    // Handle different actions using switch statement
    switch (action) {
      case 'webhook':
        return await handleWebhook(req, supabase, paystackSecretKey);
      
      case 'create-subaccount':
        return await handleCreateSubaccount(requestData, supabase);
      
      case 'update-subaccount':
        return await handleUpdateSubaccount(requestData, supabase);
      
      case 'update-split':
        return await handleUpdateSplit(requestData, supabase);
      
      case 'subaccounts':
        return await handleFetchSubaccounts();
      
      case 'splits':
        return await handleFetchSplits();
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid action',
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Handler functions
async function handleWebhook(req: Request, supabase: any, paystackSecretKey: string) {
  const requestBody = await req.json();
  const signature = req.headers.get('x-paystack-signature');
  
  // Validate webhook signature
  if (!validateWebhook(signature!, requestBody, paystackSecretKey)) {
    console.error('Invalid webhook signature');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid webhook signature',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      }
    );
  }
  
  // Process webhook event
  const event = requestBody.event;
  const data = requestBody.data;
  
  console.log(`Processing webhook event: ${event}`);
  
  // Handle charge.success event (successful payment)
  if (event === 'charge.success') {
    const transactionReference = data.reference;
    
    // Find the order associated with this transaction
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', transactionReference)
      .single();
    
    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Update order status to 'completed'
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderData.id);
    
    // Create payment record
    await supabase
      .from('payments')
      .insert({
        order_id: orderData.id,
        transaction_reference: transactionReference,
        amount: data.amount / 100, // Convert from kobo to naira
        status: 'success',
        payment_method: 'paystack',
        payment_details: data,
      });
  }
  
  // Handle transfer.success event (successful payout to producer)
  if (event === 'transfer.success') {
    const transferReference = data.reference;
    
    await supabase
      .from('payouts')
      .update({ 
        status: 'success',
        payout_date: new Date().toISOString(),
        transaction_details: data,
      })
      .eq('transaction_reference', transferReference);
  }
  
  // Handle transfer.failed event (failed payout to producer)
  if (event === 'transfer.failed') {
    const transferReference = data.reference;
    
    await supabase
      .from('payouts')
      .update({ 
        status: 'failed',
        failure_reason: data.reason || 'Unknown failure reason',
        transaction_details: data,
      })
      .eq('transaction_reference', transferReference);
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function handleCreateSubaccount(requestData: any, supabase: any) {
  const { producerId } = requestData;
  
  if (!producerId) {
    console.error('Missing producer ID');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer ID is required',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
  
  const { data: producer, error: producerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', producerId)
    .eq('role', 'producer')
    .single();
  
  if (producerError || !producer) {
    console.error('Error fetching producer:', producerError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer not found',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  }
  
  // Validate required fields for subaccount creation
  if (!producer.bank_code || !producer.account_number) {
    console.error('Missing bank details for producer:', producerId, {
      hasBankCode: !!producer.bank_code,
      hasAccountNumber: !!producer.account_number
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer bank details are incomplete. Please add bank code and account number.',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
  
  // Create the subaccount
  try {
    const subaccountData = await createSubaccount(producer);
    
    console.log('Received subaccount data:', subaccountData);
    
    // Validate subaccount data before database update
    if (!subaccountData.subaccount_code) {
      console.error('No subaccount_code received from Paystack');
      throw new Error('Invalid subaccount response from Paystack');
    }
    
    // Update producer record with subaccount code
    const { error: updateError1 } = await supabase
      .from('users')
      .update({ 
        paystack_subaccount_code: subaccountData.subaccount_code,
        verified_account_name: subaccountData.account_name,
      })
      .eq('id', producerId);
    
    if (updateError1) {
      console.error('Error updating producer with subaccount code:', updateError1);
      throw new Error('Failed to save subaccount code to database');
    }
    
    console.log(`Successfully saved subaccount_code: ${subaccountData.subaccount_code} to database`);
    
    // Create transaction split
    const splitData = await createTransactionSplit(producerId, subaccountData.subaccount_code);
    
    console.log('Received split data:', splitData);
    
    // Validate split data before database update
    if (!splitData.split_code) {
      console.error('No split_code received from Paystack');
      throw new Error('Invalid split response from Paystack');
    }
    
    // Save split code to producer record
    const { error: updateError2 } = await supabase
      .from('users')
      .update({ 
        paystack_split_code: splitData.split_code,
      })
      .eq('id', producerId);
    
    if (updateError2) {
      console.error('Error updating producer with split code:', updateError2);
      throw new Error('Failed to save split code to database');
    }
    
    console.log(`Successfully saved split_code: ${splitData.split_code} to database`);
    
    console.log('Subaccount and split created successfully in LIVE mode for producer:', producerId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          subaccount_code: subaccountData.subaccount_code,
          split_code: splitData.split_code,
          account_name: subaccountData.account_name,
          bank_name: subaccountData.bank_name,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in subaccount creation process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to create subaccount: ${errorMessage}`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}

async function handleUpdateSubaccount(requestData: any, supabase: any) {
  const { producerId, bankCode, accountNumber } = requestData;
  
  console.log('Update subaccount request:', { producerId, bankCode, accountNumber });
  
  if (!producerId) {
    console.error('Missing producer ID for update');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer ID is required',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
  
  if (!bankCode || !accountNumber) {
    console.error('Missing bank details for update:', { bankCode, accountNumber });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Bank code and account number are required',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
  
  const { data: producer, error: producerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', producerId)
    .eq('role', 'producer')
    .single();
  
  if (producerError || !producer) {
    console.error('Error fetching producer for update:', producerError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer not found',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  }
  
  // If producer doesn't have a subaccount, create one instead of updating
  if (!producer.paystack_subaccount_code) {
    console.log('Producer has no subaccount, creating new one');
    
    // Update producer with new bank details first
    await supabase
      .from('users')
      .update({ 
        bank_code: bankCode,
        account_number: accountNumber,
      })
      .eq('id', producerId);
    
    // Fetch updated producer data
    const { data: updatedProducer } = await supabase
      .from('users')
      .select('*')
      .eq('id', producerId)
      .single();
    
    try {
      // Create the subaccount
      const subaccountData = await createSubaccount(updatedProducer);
      
      console.log('Received new subaccount data:', subaccountData);
      
      // Validate subaccount data before database update
      if (!subaccountData.subaccount_code) {
        console.error('No subaccount_code received from Paystack');
        throw new Error('Invalid subaccount response from Paystack');
      }
      
      // Update producer record with subaccount code
      const { error: updateError1 } = await supabase
        .from('users')
        .update({ 
          paystack_subaccount_code: subaccountData.subaccount_code,
          verified_account_name: subaccountData.account_name,
        })
        .eq('id', producerId);
      
      if (updateError1) {
        console.error('Error updating producer with new subaccount code:', updateError1);
        throw new Error('Failed to save new subaccount code to database');
      }
      
      console.log(`Successfully saved new subaccount_code: ${subaccountData.subaccount_code} to database`);
      
      // Create transaction split
      const splitData = await createTransactionSplit(producerId, subaccountData.subaccount_code);
      
      console.log('Received new split data:', splitData);
      
      // Validate split data before database update
      if (!splitData.split_code) {
        console.error('No split_code received from Paystack');
        throw new Error('Invalid split response from Paystack');
      }
      
      // Save split code to producer record
      const { error: updateError2 } = await supabase
        .from('users')
        .update({ 
          paystack_split_code: splitData.split_code,
        })
        .eq('id', producerId);
      
      if (updateError2) {
        console.error('Error updating producer with new split code:', updateError2);
        throw new Error('Failed to save new split code to database');
      }
      
      console.log(`Successfully saved new split_code: ${splitData.split_code} to database`);
      
      console.log('New subaccount and split created successfully in LIVE mode');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            subaccount_code: subaccountData.subaccount_code,
            split_code: splitData.split_code,
            account_name: subaccountData.account_name,
            bank_name: subaccountData.bank_name,
            created: true
          },
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('Error creating new subaccount:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create subaccount: ${errorMessage}`,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  }
  
  // Update existing subaccount
  try {
    const updates = {
      settlement_bank: bankCode,
      account_number: accountNumber,
    };
    
    const updatedSubaccount = await updateSubaccount(
      producer.paystack_subaccount_code, 
      updates
    );
    
    // Update producer record with new bank details
    await supabase
      .from('users')
      .update({ 
        bank_code: bankCode,
        account_number: accountNumber,
        verified_account_name: updatedSubaccount.account_name,
      })
      .eq('id', producerId);
    
    console.log('Subaccount updated successfully in LIVE mode');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...updatedSubaccount,
          updated: true
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating subaccount:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to update subaccount: ${errorMessage}`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}

async function handleUpdateSplit(requestData: any, supabase: any) {
  const { producerId, share } = requestData;
  
  if (!producerId || !share) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer ID and share percentage are required',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
  
  const { data: producer, error: producerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', producerId)
    .eq('role', 'producer')
    .single();
  
  if (producerError || !producer) {
    console.error('Error fetching producer:', producerError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer not found',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  }
  
  if (!producer.paystack_split_code) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Producer does not have a split code',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
  
  // Update the split
  const updates = {
    subaccounts: [
      {
        subaccount: producer.paystack_subaccount_code,
        share: share,
      }
    ],
  };
  
  const updatedSplit = await updateSplit(
    producer.paystack_split_code, 
    updates
  );
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      data: updatedSplit,
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function handleFetchSubaccounts() {
  const subaccounts = await fetchSubaccounts();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      data: subaccounts,
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function handleFetchSplits() {
  const splits = await fetchSplits();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      data: splits,
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
