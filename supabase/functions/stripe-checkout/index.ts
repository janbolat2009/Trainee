// Supabase Edge Function: stripe-checkout
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, tier, sessionId, amount, coachId, successUrl, cancelUrl } = await req.json();

    if (action === "create-subscription-checkout") {
      // Prices configuration in test mode or dynamically passed
      const priceMap: Record<string, number> = {
        athlete_pro: 799, // $7.99/mo in cents
        coach_basic: 1999, // $19.99/mo in cents
        coach_pro: 2999, // $29.99/mo in cents
      };

      const unitAmount = priceMap[tier] || 799;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Trainee Subscription: ${tier.toUpperCase().replace("_", " ")}`,
                description: `Monthly subscription access to Trainee ${tier.replace("_", " ")} tier`,
              },
              unit_amount: unitAmount,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          tier,
        },
        success_url: successUrl || `${req.headers.get("origin")}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: cancelUrl || `${req.headers.get("origin")}/?status=cancel`,
      });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "create-session-checkout") {
      // 10% commission calculation for platform
      const totalAmountCents = Math.round((amount || 50) * 100);
      const commissionCents = Math.round(totalAmountCents * 0.10); // 10% commission

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Online Consultation Session",
                description: `1-on-1 Training Session with Coach. Platform fee included (10%).`,
              },
              unit_amount: totalAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          coachId,
          bookingSessionId: sessionId,
          amount: String(amount),
          commissionAmount: String((amount * 0.10).toFixed(2)),
        },
        payment_intent_data: {
          application_fee_amount: commissionCents,
        },
        success_url: successUrl || `${req.headers.get("origin")}/?booking_status=paid`,
        cancel_url: cancelUrl || `${req.headers.get("origin")}/?booking_status=canceled`,
      });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action specified." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
