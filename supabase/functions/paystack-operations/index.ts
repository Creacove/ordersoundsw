
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Get the secret key from environment variables
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')
if (!PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not set')
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

    // Handle different Paystack operations
    switch (operation) {
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
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
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
  
  const response = await fetch(url, options)
  const result = await response.json()
  
  return new Response(
    JSON.stringify(result),
    { 
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleCreateSplit(data: any) {
  return await makePaystackRequest('/split', 'POST', data)
}

async function handleUpdateSplit(data: any) {
  const { id, ...updateData } = data
  return await makePaystackRequest(`/split/${id}`, 'PUT', updateData)
}

async function handleFetchSplit(data: any) {
  const { id } = data
  return await makePaystackRequest(`/split/${id}`, 'GET')
}
