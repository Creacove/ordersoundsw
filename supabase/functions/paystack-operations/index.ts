import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Get the secret key from environment variables
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')
if (!PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY_LIVE is not set')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { operation, data } = await req.json()

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that we're using live key (security check)
    if (PAYSTACK_SECRET_KEY.startsWith('sk_test_')) {
      console.error('WARNING: Using test key instead of live key!')
      return new Response(
        JSON.stringify({ error: 'Invalid key configuration - test key detected' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing Paystack operation: ${operation}`)

    // Handle different Paystack operations
    switch (operation) {
      case 'fetch-banks':
        return await handleFetchBanks()
      case 'resolve-account':
        return await handleResolveAccount(data)
      case 'create-split':
        return await handleCreateSplit(data)
      case 'update-split':
        return await handleUpdateSplit(data)
      case 'fetch-split':
        return await handleFetchSplit(data)
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch banks', 
        details: errorMessage,
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
    
    // Use GET method with query parameters and the makePaystackRequest helper
    return await makePaystackRequest(
      `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      'GET'
    )
  } catch (error) {
    console.error('Error resolving account:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        status: false,
        message: 'Failed to resolve account', 
        details: errorMessage,
        data: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
