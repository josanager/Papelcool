import { createCustomTemplateJob, getCustomTemplateJob } from '../_lib/custom-template-jobs.js';

export async function onRequestPost(context) {
  return createCustomTemplateJob(context.request, context.env);
}

export async function onRequestGet(context) {
  return getCustomTemplateJob(context.request, context.env);
}
