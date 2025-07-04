import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_API_URL = "https://api.paystack.co";
const PLATFORM_SHARE_PERCENT = 10; // 10% of the beat price goes to the platform
const PRODUCER_SHARE_PERCENT = 90; // 90% goes to the producer

// Function to create a Paystack subaccount for a producer
async function createSubaccount(producer: any, paystackSecretKey: string) {
  try {
    console.log(`Creating subaccount for producer: ${producer.id}`);
    
    const response = await fetch(`${PAYSTACK_API_URL}/subaccount`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: producer.producer_name || producer.full_name || `Producer ${producer.id}`,
        settlement_bank: producer.bank_code,
        account_number: producer.account_number,
        percentage_charge: 0, // We will handle the split via split payment, not via subaccount charge
        description: `Producer subaccount for OrderSOUNDS platform`,
        primary_contact_email: producer.email,
        primary_contact_name: producer.full_name,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Failed to create subaccount: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Subaccount created successfully:', data.data.subaccount_code);
    
    return {
      subaccount_code: data.data.subaccount_code,
      bank_name: data.data.settlement_bank,
      account_name: data.data.account_name,
    };
  } catch (error) {
    console.error('Error creating subaccount:', error);
    throw error;
  }
}

// Function to create a transaction split
async function createTransactionSplit(producerId: string, subaccountCode: string, paystackSecretKey: string) {
  try {
    console.log(`Creating transaction split for producer: ${producerId}`);
    
    const response = await fetch(`${PAYSTACK_API_URL}/split`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Failed to create transaction split: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Transaction split created successfully:', data.data.split_code);
    
    return {
      split_code: data.data.split_code,
      share: PRODUCER_SHARE_PERCENT,
    };
  } catch (error) {
    console.error('Error creating transaction split:', error);
    throw error;
  }
}

// Function to fetch all subaccounts
async function fetchSubaccounts(paystackSecretKey: string) {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/subaccount`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Failed to fetch subaccounts: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching subaccounts:', error);
    throw error;
  }
}

// Function to fetch all transaction splits
async function fetchSplits(paystackSecretKey: string) {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/split`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Failed to fetch splits: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching splits:', error);
    throw error;
  }
}

// Function to update a subaccount
async function updateSubaccount(subaccountCode: string, updates: any, paystackSecretKey: string) {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/subaccount/${subaccountCode}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Failed to update subaccount: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating subaccount:', error);
    throw error;
  }
}

// Function to update a transaction split
async function updateSplit(splitCode: string, updates: any, paystackSecretKey: string) {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/split/${splitCode}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Failed to update split: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
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
    return new Response(null, { headers: corsHeaders });
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
    // Parse request URL to get path segments
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment);
    const action = pathSegments[pathSegments.length - 1];
    
    // Parse request body for POST/PUT requests
    let requestBody;
    if (req.method === 'POST' || req.method === 'PUT') {
      requestBody = await req.json();
    }
    
    console.log(`Processing Paystack split action: ${action}`, { method: req.method });
    
    // Handle webhook
    if (action === 'webhook') {
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
        // Update order status and related tables
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
        // Update payout status
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
        // Update payout status
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
    
    // Create subaccount
    if (action === 'create-subaccount' && req.method === 'POST') {
      const { producerId } = requestBody;
      
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
      
      // Fetch producer details
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
        const subaccountData = await createSubaccount(producer, paystackSecretKey);
        
        // Update producer record with subaccount code
        await supabase
          .from('users')
          .update({ 
            paystack_subaccount_code: subaccountData.subaccount_code,
            verified_account_name: subaccountData.account_name,
          })
          .eq('id', producerId);
        
        // Create transaction split
        const splitData = await createTransactionSplit(producerId, subaccountData.subaccount_code, paystackSecretKey);
        
        // Save split code to producer record
        await supabase
          .from('users')
          .update({ 
            paystack_split_code: splitData.split_code,
          })
          .eq('id', producerId);
        
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
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to create subaccount: ${error.message}`,
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }
    
    // Update subaccount
    if (action === 'update-subaccount' && req.method === 'POST') {
      const { producerId, bankCode, accountNumber } = requestBody;
      
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
      
      // Fetch producer details
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
          const subaccountData = await createSubaccount(updatedProducer, paystackSecretKey);
          
          // Update producer record with subaccount code
          await supabase
            .from('users')
            .update({ 
              paystack_subaccount_code: subaccountData.subaccount_code,
              verified_account_name: subaccountData.account_name,
            })
            .eq('id', producerId);
          
          // Create transaction split
          const splitData = await createTransactionSplit(producerId, subaccountData.subaccount_code, paystackSecretKey);
          
          // Save split code to producer record
          await supabase
            .from('users')
            .update({ 
              paystack_split_code: splitData.split_code,
            })
            .eq('id', producerId);
          
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
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to create subaccount: ${error.message}`,
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
          updates, 
          paystackSecretKey
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
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to update subaccount: ${error.message}`,
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }
    
    // Update split
    if (action === 'update-split' && req.method === 'PUT') {
      const { producerId, share } = requestBody;
      
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
      
      // Fetch producer details
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
        updates, 
        paystackSecretKey
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
    
    // Fetch all subaccounts for admin
    if (action === 'subaccounts' && req.method === 'GET') {
      const subaccounts = await fetchSubaccounts(paystackSecretKey);
      
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
    
    // Fetch all splits for admin
    if (action === 'splits' && req.method === 'GET') {
      const splits = await fetchSplits(paystackSecretKey);
      
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
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid action or method',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function makePaystackRequest(endpoint: string, method: string, body?: any) {
  const url = `https://api.paystack.co${endpoint}`
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  }
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body)
  }
  
  console.log(`Making Paystack request: ${method} ${url}`)
  
  const response = await fetch(url, options)
  const result = await response.json()
  
  // Log mode detection for debugging
  if (result.data && typeof result.data === 'object') {
    console.log(`Paystack API response received - Status: ${response.status}`)
  }
  
  return new Response(
    JSON.stringify(result),
    { 
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleFetchBanks() {
  try {
    console.log('Fetching banks from Paystack API')
    return await makePaystackRequest('/bank', 'GET')
  } catch (error) {
    console.error('Error fetching banks:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch banks', 
        details: error.message,
        // Provide fallback empty data structure
        data: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleResolveAccount(data: any) {
  try {
    const { account_number, bank_code } = data
    if (!account_number || !bank_code) {
      return new Response(
        JSON.stringify({ error: 'Missing account_number or bank_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Resolving account: ${account_number} for bank: ${bank_code}`)
    
    // First check if bank supports verification
    const bankResponse = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (bankResponse.ok) {
      const bankData = await bankResponse.json()
      const bank = bankData.data?.find((b: any) => b.code === bank_code)
      
      if (bank && !bank.enabled_for_verification) {
        console.log(`Bank ${bank_code} does not support verification`)
        return new Response(
          JSON.stringify({ 
            status: false,
            message: 'Bank does not support account verification',
            data: null
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    // Proceed with account resolution
    return await makePaystackRequest('/bank/resolve', 'POST', {
      account_number,
      bank_code
    })
  } catch (error) {
    console.error('Error resolving account:', error)
    return new Response(
      JSON.stringify({ 
        status: false,
        message: 'Failed to resolve account', 
        details: error.message,
        data: null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreateSplit(data: any) {
  console.log('Creating split with live key')
  return await makePaystackRequest('/split', 'POST', data)
}

async function handleUpdateSplit(data: any) {
  const { id, ...updateData } = data
  console.log(`Updating split ${id} with live key`)
  return await makePaystackRequest(`/split/${id}`, 'PUT', updateData)
}

async function handleFetchSplit(data: any) {
  const { id } = data
  console.log(`Fetching split ${id} with live key`)
  return await makePaystackRequest(`/split/${id}`, 'GET')
}
