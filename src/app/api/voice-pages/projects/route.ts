/**
 * GET /api/voice-pages/projects?q=… — prefix search over projects_catalog so
 * a Voice Page can be prefilled from a market project. Auth'd (studio-only).
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { ok, bad, fail, getUidFromRequest } from '@/lib/api-helpers';
import type { Project } from '@/types';

export async function GET(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);
  if (!adminDb) return fail('Firebase Admin is not initialized.', 503);

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return bad('Query too short.');

  try {
    const snap = await adminDb
      .collection('projects_catalog')
      .where('name', '>=', q)
      .where('name', '<=', `${q}`)
      .limit(8)
      .get();
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
    return ok(projects);
  } catch (e) {
    return fail(e);
  }
}
