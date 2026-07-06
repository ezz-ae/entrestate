/**
 * POST /api/voice-pages/track — public, best-effort analytics beacon for
 * published voice pages: {slug, event: 'view' | 'call'}. Only counters are
 * touched; unknown slugs and drafts are ignored.
 */

import { z } from 'zod';
import { ok, bad } from '@/lib/api-helpers';
import { trackVoicePageEvent } from '@/services/voice-pages';

const trackSchema = z.object({
  slug: z.string().min(1).max(64),
  event: z.enum(['view', 'call']),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return bad('Invalid event.');
  try {
    await trackVoicePageEvent(parsed.data.slug, parsed.data.event);
  } catch {
    // analytics must never surface errors to the visitor
  }
  return ok({ tracked: true });
}
