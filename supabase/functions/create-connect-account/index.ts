// Supabase Edge Function: create-connect-account
// TEST MODE NOTICE: Express Connect Account onboarding. Change keys for production live mode.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { coach_id, refresh_url, return_url } = await req.json();

    if (!coach_id) {
      return new Response(JSON.stringify({ error: "Missing coach_id parameter." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if coach already has a Stripe Connect Express account ID
    let stripeAccountId: string | null = null;
    const { data: existing } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("user_id", coach_id)
      .maybeSingle();

    if (existing?.stripe_account_id) {
      stripeAccountId = existing.stripe_account_id;
    } else {
      // Create new Express Connect account for Coach marketplace payouts
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          userId: coach_id,
        },
      });

      stripeAccountId = account.id;

      // Store in Supabase
      await supabaseAdmin.from("stripe_connect_accounts").upsert({
        user_id: coach_id,
        stripe_account_id: stripeAccountId,
        charges_enabled: false,
        payouts_enabled: false,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refresh_url || `${origin}/?connect=refresh`,
      return_url: return_url || `${origin}/?connect=success`,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: accountLink.url, accountId: stripeAccountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("create-connect-account error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
