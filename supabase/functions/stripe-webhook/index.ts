// Supabase Edge Function: stripe-webhook
// TEST MODE NOTICE: Unified webhook listener for Checkout, Subscriptions, Connect Express, and PaymentIntents.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const body = await req.text();
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const userId = metadata.userId;
        const priceId = metadata.priceId;

        if (session.mode === "subscription" && userId) {
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

          await supabaseAdmin.from("subscriptions").upsert({
            user_id: userId,
            tier: metadata.tier || "pro",
            status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

        if (customerId) {
          const status = sub.status === "active" ? "active" : sub.status;
          const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

          await supabaseAdmin
            .from("subscriptions")
            .update({
              status,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

        if (customerId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              tier: "free",
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const stripeAccountId = account.id;

        await supabaseAdmin
          .from("stripe_connect_accounts")
          .update({
            charges_enabled: account.charges_enabled || false,
            payouts_enabled: account.payouts_enabled || false,
            onboarding_completed: account.details_submitted || false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", stripeAccountId);
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const metadata = intent.metadata || {};
        const athleteId = metadata.athleteId;
        const coachId = metadata.coachId;

        if (athleteId && coachId) {
          const totalAmount = parseFloat(metadata.amountTotal || (intent.amount / 100).toFixed(2));
          const appFeeAmount = parseFloat(metadata.applicationFeeAmount || (totalAmount * 0.10).toFixed(2));
          const coachPayoutAmount = parseFloat(metadata.coachPayoutAmount || (totalAmount * 0.90).toFixed(2));

          await supabaseAdmin.from("session_payments").insert({
            session_id: metadata.sessionId || null,
            athlete_id: athleteId,
            coach_id: coachId,
            amount_total: totalAmount,
            application_fee_amount: appFeeAmount,
            coach_payout_amount: coachPayoutAmount,
            stripe_payment_intent_id: intent.id,
            status: "succeeded",
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Error processing Stripe webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
