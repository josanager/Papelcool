import { handleCreateStripeCheckoutSession } from '../../_lib/stripe-access.js';

export async function onRequest(context) {
  return handleCreateStripeCheckoutSession(context.request, context.env);
}
