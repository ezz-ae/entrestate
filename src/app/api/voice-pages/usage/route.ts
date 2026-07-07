/**
 * GET /api/voice-pages/usage — the signed-in user's current-month AI usage
 * (voice conversation turns). Shown in the studio; the basis for AI pricing.
 */

import { ok, fail, getUidFromRequest } from '@/lib/api-helpers';
import { getMonthlyUsage } from '@/services/voice-pages';

export async function GET(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);
  try {
    return ok(await getMonthlyUsage(uid));
  } catch (e) {
    return fail(e);
  }
}
