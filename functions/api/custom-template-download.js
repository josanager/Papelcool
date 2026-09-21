import { downloadCustomTemplateJob } from '../_lib/custom-template-jobs.js';

export async function onRequestGet(context) {
  return downloadCustomTemplateJob(context.request, context.env);
}
