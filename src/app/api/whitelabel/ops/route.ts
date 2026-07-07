/**
 * Entrestate ops — the sales pipeline behind the white-label funnel.
 * GET  /api/whitelabel/ops           — latest claims + pitch sessions + counts
 * PATCH /api/whitelabel/ops          — update a claim's status
 *
 * Gated by ENTRESTATE_ADMIN_EMAILS (comma-separated). There is no admin role
 * system in the app yet; this env allowlist is the interim gate and the
 * single place to swap a real role check in later.
 */

import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { ok, bad, fail } from '@/lib/api-helpers';

async function requireAdmin(req: Request): Promise<{ email: string } | null> {
  if (!adminAuth) return null;
  const allow = (process.env.ENTRESTATE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length) return null; // unset allowlist = ops closed, not open
  try {
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return null;
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    return email && allow.includes(email) ? { email } : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail('Forbidden', 403);
  if (!adminDb) return fail('Service unavailable.', 503);
  try {
    const [claimsSnap, sessionsSnap] = await Promise.all([
      adminDb.collection('claims').orderBy('createdAt', 'desc').limit(50).get(),
      adminDb.collection('pitchSessions').orderBy('createdAt', 'desc').limit(50).get(),
    ]);
    return ok({
      claims: claimsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      pitchSessions: sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e) {
    return fail(e);
  }
}

const patchSchema = z.object({
  claimId: z.string().min(1).max(120),
  status: z.enum(['new', 'contacted', 'won', 'lost']),
});

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail('Forbidden', 403);
  if (!adminDb) return fail('Service unavailable.', 503);
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return bad('Invalid update.');
  try {
    await adminDb.collection('claims').doc(parsed.data.claimId).update({
      status: parsed.data.status,
      updatedAt: Date.now(),
      updatedBy: admin.email,
    });
    return ok({ updated: true });
  } catch (e) {
    return fail(e);
  }
}
