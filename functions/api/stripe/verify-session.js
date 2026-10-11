import { handleVerifyStripeCheckoutSession } from '../../_lib/stripe-access.js';

export async function onRequest(context) {
  return handleVerifyStripeCheckoutSession(context.request, context.env);
}
