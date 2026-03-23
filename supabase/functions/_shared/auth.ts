import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export type AppRole = "buyer" | "producer" | "admin";

type AppUserRecord = {
  id: string;
  role: AppRole | null;
  status: string | null;
  email: string | null;
  wallet_address: string | null;
};

export type AuthenticatedActor = {
  authUser: User;
  appUser: AppUserRecord;
};

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

export async function authenticateRequest(
  req: Request,
  serviceClient: SupabaseClient,
): Promise<{ actor: AuthenticatedActor } | { response: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      response: jsonResponse({ error: "Unauthorized" }, 401),
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return {
      response: jsonResponse({ error: "Unauthorized" }, 401),
    };
  }

  const { data: authData, error: authError } = await serviceClient.auth.getUser(token);
  if (authError || !authData.user) {
    console.error("Failed to authenticate request:", authError);
    return {
      response: jsonResponse({ error: "Unauthorized" }, 401),
    };
  }

  const { data: appUser, error: userError } = await serviceClient
    .from("users")
    .select("id, role, status, email, wallet_address")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (userError) {
    console.error("Failed to load app user for request:", userError);
    return {
      response: jsonResponse({ error: "Failed to resolve user context" }, 500),
    };
  }

  if (!appUser) {
    return {
      response: jsonResponse({ error: "User profile not found" }, 403),
    };
  }

  return {
    actor: {
      authUser: authData.user,
      appUser,
    },
  };
}

export function requireRole(actor: AuthenticatedActor, allowedRoles: AppRole[]): Response | null {
  if (!actor.appUser.role || !allowedRoles.includes(actor.appUser.role)) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  return null;
}

export function requireSelfOrAdmin(actor: AuthenticatedActor, targetUserId: string): Response | null {
  if (actor.appUser.role === "admin" || actor.authUser.id === targetUserId) {
    return null;
  }

  return jsonResponse({ error: "Forbidden" }, 403);
}
