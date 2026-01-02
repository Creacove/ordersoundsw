
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the producers this user follows
    const { data: followers, error: followersError } = await supabase
      .from("followers")
      .select("followee_id")
      .eq("follower_id", user.id);
    
    if (followersError) {
      return new Response(
        JSON.stringify({ error: followersError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If user doesn't follow anyone, return empty array
    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ beats: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the producer IDs
    const producerIds = followers.map(follow => follow.followee_id);
    
    // Get recent beats from followed producers
    const { data: beats, error: beatsError } = await supabase
      .from("beats")
      .select(`
        id, 
        title, 
        cover_image,
        basic_license_price_local,
        producer_id,
        users!beats_producer_id_fkey (
          stage_name,
          full_name
        )
      `)
      .in("producer_id", producerIds)
      .order("upload_date", { ascending: false })
      .limit(10);
    
    if (beatsError) {
      return new Response(
        JSON.stringify({ error: beatsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Return recommended beats
    return new Response(
      JSON.stringify({ beats: beats || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
