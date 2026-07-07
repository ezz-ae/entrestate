/**
 * PATCH  /api/voice-pages/[id] — update (publish/unpublish, edit, connect domain)
 * DELETE /api/voice-pages/[id]
 * Owner-only; ownership enforced in the service.
 */

import { z } from 'zod';
import { ok, bad, fail, getUidFromRequest } from '@/lib/api-helpers';
import { deleteVoicePage, updateVoicePage } from '@/services/voice-pages';

// Only these fields are patchable. brand/listing are intentionally excluded:
// they were free-form maps that the service replaces wholesale, so a partial
// patch would wipe required fields and break the public page.
const patchSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  locale: z.enum(['en', 'ar']).optional(),
  customDomain: z
    .string()
    .max(253)
    .regex(/^[a-zA-Z0-9.-]*$/, 'Invalid domain.')
    .nullable()
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0]?.message || 'Invalid update.');
    const page = await updateVoicePage(uid, id, parsed.data as any);
    if (!page) return bad('Page not found.', 404);
    return ok(page);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);
  const { id } = await params;
  try {
    const deleted = await deleteVoicePage(uid, id);
    if (!deleted) return bad('Page not found.', 404);
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
