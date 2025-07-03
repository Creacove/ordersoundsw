
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ CRITICAL FIX: Use the actual live secret key from environment
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE');
  
  if (!paystackSecretKey) {
    console.error('Missing Paystack live secret key');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Missing Paystack live key' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ✅ VALIDATION: Ensure we're using a live key, not test key
  if (paystackSecretKey.startsWith('sk_test_')) {
    console.error('Test key detected when live key expected');
    return new Response(
      JSON.stringify({ error: 'Configuration error: Test key provided instead of live key' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('✅ Using LIVE Paystack key for operations');

  try {
    const body = await req.json();
    const { operation, endpoint, method = 'GET', data } = body;

    console.log(`Processing Paystack operation: ${operation}`);

    let url = '';
    let requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    };

    // Handle different operations
    switch (operation) {
      case 'fetch-banks':
        url = 'https://api.paystack.co/bank';
        break;
      
      case 'resolve-account':
        if (!data?.account_number || !data?.bank_code) {
          throw new Error('Account number and bank code are required');
        }
        url = `https://api.paystack.co/bank/resolve?account_number=${data.account_number}&bank_code=${data.bank_code}`;
        break;
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, requestOptions);
    const responseData = await response.json();

    if (!response.ok) {
      console.error('Paystack API error:', responseData);
      throw new Error(responseData.message || 'Paystack API request failed');
    }

    console.log(`✅ ${operation} completed successfully in LIVE mode`);

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Paystack operations error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
