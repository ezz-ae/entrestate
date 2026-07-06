/**
 * Voice Pages CRUD (owner-scoped).
 * GET  /api/voice-pages       — list the signed-in user's pages
 * POST /api/voice-pages       — create a draft page
 */

import { z } from 'zod';
import { ok, bad, fail, getUidFromRequest } from '@/lib/api-helpers';
import { createVoicePage, listVoicePages } from '@/services/voice-pages';

const listingSchema = z.object({
  title: z.string().min(2).max(120),
  area: z.string().min(2).max(80),
  city: z.string().max(80).optional(),
  price: z.string().max(40).optional(),
  bedrooms: z.string().max(40).optional(),
  handover: z.string().max(60).optional(),
  paymentPlan: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  highlights: z.array(z.string().max(120)).max(10).optional(),
});

const brandSchema = z.object({
  companyName: z.string().min(2).max(120),
  tagline: z.string().max(200).optional(),
  logoUrl: z.string().url().nullable().optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  contact: z
    .object({
      name: z.string().max(80).optional(),
      phone: z.string().max(40).optional(),
      email: z.string().max(120).optional(),
      whatsapp: z.string().max(40).optional(),
    })
    .optional(),
  locale: z.enum(['en', 'ar']),
});

const createSchema = z.object({
  listing: listingSchema,
  brand: brandSchema,
  locale: z.enum(['en', 'ar']),
});

export async function GET(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);
  try {
    return ok(await listVoicePages(uid));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return fail('Unauthorized', 401);
  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0]?.message || 'Invalid page data.');
    const page = await createVoicePage(uid, parsed.data);
    return ok(page, 201);
  } catch (e) {
    return fail(e);
  }
}
