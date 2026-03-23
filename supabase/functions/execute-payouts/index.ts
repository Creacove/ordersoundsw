import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, createServiceRoleClient, jsonResponse, requireRole } from "../_shared/auth.ts";
import { claimPaystackPayouts, executeClaimedPaystackPayouts, getPayoutBatchLimit } from "../_shared/payoutExecution.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createServiceRoleClient();
    const authResult = await authenticateRequest(req, supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const roleResponse = requireRole(authResult.actor, ["admin"]);
    if (roleResponse) {
      return roleResponse;
    }

    let body: { limit?: number } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const limit = getPayoutBatchLimit(body.limit);
    const claimedPayouts = await claimPaystackPayouts(supabase, limit);

    if (!claimedPayouts.length) {
      return jsonResponse({
        claimedCount: 0,
        processedCount: 0,
        results: [],
        success: true,
      });
    }

    const results = await executeClaimedPaystackPayouts(supabase, claimedPayouts);
    return jsonResponse({
      claimedCount: claimedPayouts.length,
      processedCount: results.length,
      results,
      success: true,
    });
  } catch (error) {
    console.error("Payout execution failed:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Payout execution failed",
      },
      500,
    );
  }
});
