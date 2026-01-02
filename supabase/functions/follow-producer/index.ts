
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
    
    // Parse the request body
    const { producerId } = await req.json();
    
    if (!producerId) {
      return new Response(
        JSON.stringify({ error: "Producer ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (user.id === producerId) {
      return new Response(
        JSON.stringify({ error: "You cannot follow yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify the producer exists
    const { data: producer, error: producerError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", producerId)
      .eq("role", "producer")
      .single();
    
    if (producerError || !producer) {
      return new Response(
        JSON.stringify({ error: "Producer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    try {
      // Call the database function to follow the producer
      const { error: followError } = await supabase.rpc("follow_producer", {
        p_follower_id: user.id,
        p_followee_id: producerId,
      });
      
      if (followError) {
        // Check if the error is due to already following
        if (followError.message.includes("Already following")) {
          return new Response(
            JSON.stringify({ success: false, message: "Already following this producer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw followError;
      }
      
      // Return success response
      return new Response(
        JSON.stringify({ success: true, message: "Successfully followed producer" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Follow error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to follow producer";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
