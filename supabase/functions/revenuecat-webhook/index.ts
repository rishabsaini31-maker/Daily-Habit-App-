// ==============================================================================
// SUPABASE EDGE FUNCTION: revenuecat-webhook
// Secure listener for RevenueCat StoreKit / Play Billing entitlement events
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify Authorization Bearer Header
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") || "test_secret_rc_12345";
    const expectedHeader = `Bearer ${webhookSecret}`;

    if (!authHeader || authHeader !== expectedHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing webhook authorization secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse RevenueCat Event Body
    const body = await req.json();
    const event = body?.event;

    if (!event || !event.app_user_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing event payload or app_user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appUserId = event.app_user_id;
    const eventType = event.type;
    const originalTransactionId = event.original_transaction_id || event.transaction_id || `txn_${Date.now()}`;
    const productId = event.product_id || "annual_4999_trial";
    const store = (event.store || "app_store").toLowerCase();
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

    // Determine Pro entitlement state based on event type
    const isPro = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",
      "NON_RENEWING_PURCHASE",
    ].includes(eventType);

    // 3. Connect via Service Role Key (bypassing normal client RLS restrictions)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://localhost.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "dummy_service_key";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update profiles.is_pro
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_pro: isPro,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appUserId);

    if (profileError) {
      console.error("Error updating profile pro status:", profileError);
    }

    // Upsert into subscriptions table
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: appUserId,
        original_transaction_id: originalTransactionId,
        product_id: productId,
        store: store,
        status: isPro ? "active" : "expired",
        is_active: isPro,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id, product_id",
      });

    if (subError) {
      console.error("Error upserting subscription record:", subError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: appUserId,
        event_type: eventType,
        is_pro: isPro,
        expires_at: expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
