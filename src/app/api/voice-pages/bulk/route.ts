/**
 * POST /api/voice-pages/bulk — Listing-to-Landing, first cut: create draft
 * voice pages for up to 10 market catalog projects in one call, all under
 * the user's brand. Owner-scoped.
 */

import { z } from 'zod';
import { ok, bad, fail, getUidFromRequest } from '@/lib/api-helpers';
import { getProjectById } from '@/services/database';
import { createVoicePage } from '@/services/voice-pages';
import type { VoicePage, VoicePageListing } from '@/types';

const bulkSchema = z.object({
  projectIds: z.array(z.string().min(1).max(120)).min(1).max(10),
  locale: z.enum(['en', 'ar']),
  brand: z.object({
    companyName: z.string().min(2).max(120),
    tagline: z.string().max(200).optional(),
    logoUrl: z.string().url().nullable().optional(),
    colors: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
    contact: z.object({ phone: z.string().max(40).optional() }).optional(),
    locale: z.enum(['en', 'ar']),
  }),
});

export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.errors[0]?.message || 'Invalid bulk request.');
  const { projectIds, locale, brand } = parsed.data;

  try {
    const created: VoicePage[] = [];
    const missing: string[] = [];
    // Sequential on purpose: slug reservation reads-then-writes, and N<=10.
    for (const id of projectIds) {
      const proj = await getProjectById(id).catch(() => null);
      if (!proj) {
        missing.push(id);
        continue;
      }
      const listing: VoicePageListing = {
        title: proj.name,
        area: proj.area || proj.city || '',
        city: proj.city,
        price: proj.priceFrom !== undefined && proj.priceFrom !== null ? String(proj.priceFrom) : undefined,
        bedrooms: Array.isArray(proj.unitTypes) ? proj.unitTypes.join(', ') : undefined,
        handover: proj.handover,
      };
      created.push(await createVoicePage(uid, { listing, brand, locale }));
    }
    return ok({ created, missing });
  } catch (e) {
    return fail(e);
  }
}
