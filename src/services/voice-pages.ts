'use server';

/**
 * @fileoverview Firestore service for AI Voice Landing Pages — the self-serve
 * ad product. Pages live in the top-level `voicePages` collection (public
 * lookup by slug or connected domain must not require knowing the owner);
 * captured leads flow into the owner's existing CRM at users/{uid}/leads.
 */

import { adminDb } from '@/lib/firebaseAdmin';
import type { VoicePage, VoicePageListing, TenantBrand, TenantLocale } from '@/types';

const COLLECTION = 'voicePages';

function requireDb() {
  if (!adminDb) throw new Error('Voice pages service unavailable: Firestore Admin is not initialized.');
  return adminDb;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'page';
}

export async function createVoicePage(
  uid: string,
  input: { listing: VoicePageListing; brand: TenantBrand; locale: TenantLocale },
): Promise<VoicePage> {
  const db = requireDb();
  const base = toSlug(`${input.listing.title}-${input.listing.area}`);
  let slug = base;
  for (let i = 2; i <= 30; i++) {
    const existing = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
    if (existing.empty) break;
    slug = `${base}-${i}`;
  }
  const now = Date.now();
  const ref = db.collection(COLLECTION).doc();
  const page: VoicePage = {
    id: ref.id,
    uid,
    slug,
    status: 'draft',
    locale: input.locale,
    brand: input.brand,
    listing: input.listing,
    customDomain: null,
    createdAt: now,
    updatedAt: now,
    leadCount: 0,
  };
  await ref.set(page);
  return page;
}

export async function listVoicePages(uid: string): Promise<VoicePage[]> {
  const db = requireDb();
  const snap = await db.collection(COLLECTION).where('uid', '==', uid).get();
  return snap.docs
    .map((d) => d.data() as VoicePage)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getVoicePageById(id: string): Promise<VoicePage | null> {
  const db = requireDb();
  const doc = await db.collection(COLLECTION).doc(id).get();
  return doc.exists ? (doc.data() as VoicePage) : null;
}

/** Public lookup — only returns published pages. */
export async function getPublishedVoicePageBySlug(slug: string): Promise<VoicePage | null> {
  const db = requireDb();
  const snap = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  const page = snap.docs[0].data() as VoicePage;
  return page.status === 'published' ? page : null;
}

/** Public lookup by connected custom domain — only published pages. */
export async function getPublishedVoicePageByDomain(host: string): Promise<VoicePage | null> {
  const db = requireDb();
  const domain = host.toLowerCase().replace(/^www\./, '').split(':')[0];
  const snap = await db.collection(COLLECTION).where('customDomain', '==', domain).limit(1).get();
  if (snap.empty) return null;
  const page = snap.docs[0].data() as VoicePage;
  return page.status === 'published' ? page : null;
}

/** Owner-checked partial update. Returns the updated page or null if not owner. */
export async function updateVoicePage(
  uid: string,
  id: string,
  patch: Partial<Pick<VoicePage, 'status' | 'locale' | 'brand' | 'listing' | 'customDomain'>>,
): Promise<VoicePage | null> {
  const db = requireDb();
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists || (doc.data() as VoicePage).uid !== uid) return null;
  if (typeof patch.customDomain === 'string') {
    patch.customDomain = patch.customDomain.toLowerCase().replace(/^www\./, '').split(':')[0] || null;
  }
  await ref.update({ ...patch, updatedAt: Date.now() } as Record<string, unknown>);
  return (await ref.get()).data() as VoicePage;
}

export async function deleteVoicePage(uid: string, id: string): Promise<boolean> {
  const db = requireDb();
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists || (doc.data() as VoicePage).uid !== uid) return false;
  await ref.delete();
  return true;
}

/** Store a captured lead into the page owner's CRM and bump the counter. */
export async function addVoicePageLead(
  page: VoicePage,
  lead: { name: string; phone: string; note?: string },
): Promise<void> {
  const db = requireDb();
  await db.collection('users').doc(page.uid).collection('leads').add({
    name: lead.name,
    email: '',
    phone: lead.phone,
    status: 'New',
    source: 'voice-page',
    pageId: page.id,
    pageSlug: page.slug,
    listingTitle: page.listing.title,
    note: lead.note ?? '',
    createdAt: new Date(),
  });
  await db.collection(COLLECTION).doc(page.id).update({ leadCount: (page.leadCount ?? 0) + 1 });
}
