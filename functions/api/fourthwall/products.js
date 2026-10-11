import { handleFourthwallProducts } from '../../_lib/fourthwall-catalog.js';

export async function onRequest(context) {
  return handleFourthwallProducts(context.request, context.env);
}
