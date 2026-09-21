import { handleStripeWebhook } from '../../_lib/stripe-access.js';

export async function onRequest(context) {
  return handleStripeWebhook(context.request, context.env, context);
}
