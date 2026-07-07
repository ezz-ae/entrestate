/**
 * POST /api/chat — the workspace AI co-pilot (used by /me/assistant and the
 * global chat). Authenticated (it's inside the signed-in workspace) and
 * rate-limited to bound Gemini cost. Body: { text, history? }.
 */

import { z } from 'zod';
import { ok, bad, fail, getUidFromRequest } from '@/lib/api-helpers';
import { assistantChat } from '@/ai/flows/utility/assistant-chat-flow';
import { checkRateLimit, tooMany } from '@/lib/whitelabel/rate-limit';

export const maxDuration = 30;

const chatSchema = z.object({
  text: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(4000) }))
    .max(20)
    .optional(),
});

export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);

  const rl = await checkRateLimit(`chat:uid:${uid}`, 40, 600); // 40 messages / 10 min
  if (!rl.allowed) return tooMany(rl.retryAfterSec);

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return bad('Invalid chat input.');

  try {
    const out = await assistantChat({ query: parsed.data.text, history: parsed.data.history });
    return ok({ text: out.text, suggestedToolId: out.suggestedToolId ?? null });
  } catch (e) {
    return fail(e);
  }
}
