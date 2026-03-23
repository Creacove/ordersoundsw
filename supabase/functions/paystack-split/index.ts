
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, createServiceRoleClient, requireRole, requireSelfOrAdmin, type AuthenticatedActor } from "../_shared/auth.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const PAYSTACK_API_URL = "https://api.paystack.co";
const PLATFORM_SHARE_PERCENT = 10; // 10% of the beat price goes to the platform
const PRODUCER_SHARE_PERCENT = 90; // 90% goes to the producer
type ServiceClient = ReturnType<typeof createServiceRoleClient>;
type JsonObject = Record<string, unknown>;
type ProducerRecord = {
  id: string;
  producer_name?: string | null;
  full_name?: string | null;
  bank_code?: string | null;
  account_number?: string | null;
  email?: string | null;
  paystack_subaccount_code?: string | null;
  paystack_split_code?: string | null;
};
type ActionPayload = JsonObject & { action?: string };
type CreateSubaccountPayload = { producerId?: string };
type UpdateSubaccountPayload = { producerId?: string; bankCode?: string; accountNumber?: string };
type UpdateSplitPayload = { producerId?: string; share?: number };

function asJsonObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonObject;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function getOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseActionPayload(value: unknown): ActionPayload {
  const data = asJsonObject(value);
  if (!data) {
    return {};
  }

  const action = getOptionalString(data.action);
  return action ? { ...data, action } : { ...data };
}

function parseCreateSubaccountPayload(value: unknown): CreateSubaccountPayload {
  const data = asJsonObject(value);
  return {
    producerId: getOptionalString(data?.producerId),
  };
}

function parseUpdateSubaccountPayload(value: unknown): UpdateSubaccountPayload {
  const data = asJsonObject(value);
  return {
    producerId: getOptionalString(data?.producerId),
    bankCode: getOptionalString(data?.bankCode),
    accountNumber: getOptionalString(data?.accountNumber),
  };
}

function parseUpdateSplitPayload(value: unknown): UpdateSplitPayload {
  const data = asJsonObject(value);
  return {
    producerId: getOptionalString(data?.producerId),
    share: getOptionalNumber(data?.share),
  };
}

// Function for external API calls (returns Response wrapper for endpoint responses)
async function makePaystackRequest(endpoint: string, method: string, body?: JsonObject) {
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
async function makePaystackApiCall(endpoint: string, method: string, body?: JsonObject) {
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
async function createSubaccount(producer: ProducerRecord) {
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
async function updateSubaccount(subaccountCode: string, updates: JsonObject) {
  try {
    const result = await makePaystackApiCall(`/subaccount/${subaccountCode}`, 'PUT', updates);
    return result.data;
  } catch (error) {
    console.error('Error updating subaccount:', error);
    throw error;
  }
}

// Function to update a transaction split
async function updateSplit(splitCode: string, updates: JsonObject) {
  try {
    const result = await makePaystackApiCall(`/split/${splitCode}`, 'PUT', updates);
    return result.data;
  } catch (error) {
    console.error('Error updating split:', error);
    throw error;
  }
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (!Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')) {
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
  
  const supabase = createServiceRoleClient();
  
  try {
    // Parse request body
    let requestData: ActionPayload = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      requestData = parseActionPayload(await req.json());
    }
    
    const action = requestData?.action ?? null;
    
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

    if (action === 'webhook') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Use the dedicated paystack-webhook function for webhook delivery',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    const authResult = await authenticateRequest(req, supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const actor = authResult.actor;
    
    console.log(`Processing Paystack split action: ${action}`, { method: req.method });
    
    // Handle different actions using switch statement
    switch (action) {
      case 'create-subaccount':
        return await handleCreateSubaccount(parseCreateSubaccountPayload(requestData), supabase, actor);
      
      case 'update-subaccount':
        return await handleUpdateSubaccount(parseUpdateSubaccountPayload(requestData), supabase, actor);
      
      case 'update-split':
        return await handleUpdateSplit(parseUpdateSplitPayload(requestData), supabase, actor);
      
      case 'subaccounts':
        {
          const roleResponse = requireRole(actor, ['admin']);
          if (roleResponse) return roleResponse;
        }
        return await handleFetchSubaccounts();
      
      case 'splits':
        {
          const roleResponse = requireRole(actor, ['admin']);
          if (roleResponse) return roleResponse;
        }
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
async function handleCreateSubaccount(
  requestData: CreateSubaccountPayload,
  supabase: ServiceClient,
  actor: AuthenticatedActor
) {
  const { producerId } = requestData;
  const roleResponse = requireRole(actor, ['producer', 'admin']);
  if (roleResponse) {
    return roleResponse;
  }
  
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

  const ownershipResponse = requireSelfOrAdmin(actor, producerId);
  if (ownershipResponse) {
    return ownershipResponse;
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

async function handleUpdateSubaccount(
  requestData: UpdateSubaccountPayload,
  supabase: ServiceClient,
  actor: AuthenticatedActor
) {
  const { producerId, bankCode, accountNumber } = requestData;
  const roleResponse = requireRole(actor, ['producer', 'admin']);
  if (roleResponse) {
    return roleResponse;
  }
  
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

  const ownershipResponse = requireSelfOrAdmin(actor, producerId);
  if (ownershipResponse) {
    return ownershipResponse;
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

async function handleUpdateSplit(
  requestData: UpdateSplitPayload,
  supabase: ServiceClient,
  actor: AuthenticatedActor
) {
  const { producerId, share } = requestData;
  const roleResponse = requireRole(actor, ['admin']);
  if (roleResponse) {
    return roleResponse;
  }
  
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
