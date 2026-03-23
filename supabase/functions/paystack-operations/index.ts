import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateRequest, createServiceRoleClient, requireRole } from "../_shared/auth.ts"

// Get the secret key from environment variables
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')
if (!PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY_LIVE is not set')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type JsonObject = Record<string, unknown>
type ResolveAccountPayload = {
  account_number?: string
  bank_code?: string
}
type SplitPayload = JsonObject & {
  id?: string
}

function asJsonObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as JsonObject
}

function getOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function parseResolveAccountPayload(value: unknown): ResolveAccountPayload | null {
  const data = asJsonObject(value)
  if (!data) {
    return null
  }

  return {
    account_number: getOptionalString(data.account_number),
    bank_code: getOptionalString(data.bank_code),
  }
}

function parseSplitPayload(value: unknown): SplitPayload | null {
  const data = asJsonObject(value)
  if (!data) {
    return null
  }

  const id = getOptionalString(data.id)
  return id ? { ...data, id } : { ...data }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const serviceClient = createServiceRoleClient();
    const authResult = await authenticateRequest(req, serviceClient);
    if ("response" in authResult) {
      return authResult.response;
    }

    const actor = authResult.actor;
    const requestBody = asJsonObject(await req.json())
    const operation = getOptionalString(requestBody?.operation)
    const data = requestBody?.data

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
        {
          const roleResponse = requireRole(actor, ['producer', 'admin']);
          if (roleResponse) return roleResponse;
        }
        return await handleFetchBanks()
      case 'resolve-account':
        {
          const roleResponse = requireRole(actor, ['producer', 'admin']);
          if (roleResponse) return roleResponse;
        }
        return await handleResolveAccount(parseResolveAccountPayload(data) ?? undefined)
      case 'create-split':
        {
          const roleResponse = requireRole(actor, ['admin']);
          if (roleResponse) return roleResponse;
        }
        return await handleCreateSplit(asJsonObject(data) ?? undefined)
      case 'update-split':
        {
          const roleResponse = requireRole(actor, ['admin']);
          if (roleResponse) return roleResponse;
        }
        return await handleUpdateSplit(parseSplitPayload(data) ?? undefined)
      case 'fetch-split':
        {
          const roleResponse = requireRole(actor, ['admin']);
          if (roleResponse) return roleResponse;
        }
        return await handleFetchSplit(parseSplitPayload(data) ?? undefined)
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

async function makePaystackRequest(endpoint: string, method: string, body?: JsonObject) {
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

async function handleResolveAccount(data?: ResolveAccountPayload) {
  try {
    const { account_number, bank_code } = data ?? {}
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

async function handleCreateSplit(data?: JsonObject) {
  if (!data) {
    return new Response(
      JSON.stringify({ error: 'Missing split payload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Creating split with live key')
  return await makePaystackRequest('/split', 'POST', data)
}

async function handleUpdateSplit(data?: SplitPayload) {
  const { id, ...updateData } = data ?? {}
  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing split id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Updating split ${id} with live key`)
  return await makePaystackRequest(`/split/${id}`, 'PUT', updateData)
}

async function handleFetchSplit(data?: SplitPayload) {
  const { id } = data ?? {}
  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing split id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Fetching split ${id} with live key`)
  return await makePaystackRequest(`/split/${id}`, 'GET')
}
