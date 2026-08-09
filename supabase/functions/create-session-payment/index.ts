// Supabase Edge Function: create-session-payment
// TEST MODE NOTICE: 10% platform fee calculation via application_fee_amount and direct transfer to Coach Express Account.
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
    const { session_id, athlete_id, coach_id, amount } = await req.json();

    if (!athlete_id || !coach_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing athlete_id, coach_id, or amount parameter." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch coach's Stripe Connect Express account
    const { data: connectData, error: connectErr } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", coach_id)
      .maybeSingle();

    if (connectErr || !connectData?.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Coach has not connected their Stripe Payout account yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!connectData.charges_enabled) {
      return new Response(JSON.stringify({ error: "Coach is completing payment setup. Charges are not enabled yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const totalAmountCents = Math.round(parseFloat(String(amount)) * 100);
    const applicationFeeCents = Math.round(totalAmountCents * 0.10); // 10% platform fee
    const coachPayoutCents = totalAmountCents - applicationFeeCents; // 90% coach payout

    // Create PaymentIntent with transfer_data to coach's Express Account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: "usd",
      payment_method_types: ["card"],
      application_fee_amount: applicationFeeCents,
      transfer_data: {
        destination: connectData.stripe_account_id,
      },
      metadata: {
        sessionId: session_id || "",
        athleteId: athlete_id,
        coachId: coach_id,
        amountTotal: String(amount),
        applicationFeeAmount: String((applicationFeeCents / 100).toFixed(2)),
        coachPayoutAmount: String((coachPayoutCents / 100).toFixed(2)),
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountTotal: amount,
        applicationFeeAmount: (applicationFeeCents / 100),
        coachPayoutAmount: (coachPayoutCents / 100),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("create-session-payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
