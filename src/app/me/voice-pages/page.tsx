'use client';

/**
 * /me/voice-pages — the self-serve studio for AI Voice Landing Pages.
 *
 * A user creates the whole ad product from their account: listing details +
 * language + brand (prefilled from their Brand Kit), publishes to get the ad
 * URL (/v/[slug]), and connects their own domain. Captured leads land in
 * their existing CRM (/me/leads) tagged source "voice-page".
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Mic,
  PhoneCall,
  Plus,
  Search,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { VoicePage } from '@/types';

interface FormState {
  title: string;
  area: string;
  city: string;
  price: string;
  bedrooms: string;
  handover: string;
  paymentPlan: string;
  description: string;
  highlights: string;
  locale: 'en' | 'ar';
  companyName: string;
  tagline: string;
  primary: string;
  accent: string;
  phone: string;
  logoUrl: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  area: '',
  city: 'Dubai',
  price: '',
  bedrooms: '',
  handover: '',
  paymentPlan: '',
  description: '',
  highlights: '',
  locale: 'en',
  companyName: '',
  tagline: '',
  primary: '#10b981',
  accent: '#0ea5e9',
  phone: '',
  logoUrl: '',
};

export default function VoicePagesStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<VoicePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [domainDrafts, setDomainDrafts] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<{ month: string; voiceTurns: number } | null>(null);
  const [projectQuery, setProjectQuery] = useState('');
  const [projectResults, setProjectResults] = useState<any[]>([]);
  const [searchingProjects, setSearchingProjects] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<any[]>([]);
  const [bulkCreating, setBulkCreating] = useState(false);

  const authedFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      if (!user) throw new Error('Not signed in');
      const idToken = await user.getIdToken();
      const res = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          ...(init.headers || {}),
        },
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || 'Request failed');
      return json.data;
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [pageList, profile, usageData] = await Promise.all([
          authedFetch('/api/voice-pages'),
          authedFetch('/api/user/profile').catch(() => ({})),
          authedFetch('/api/voice-pages/usage').catch(() => null),
        ]);
        setUsage(usageData);
        setPages(pageList || []);
        // Prefill brand from the user's Brand Kit so a page is one form away.
        setForm((f) => ({
          ...f,
          companyName: profile?.companyName || f.companyName,
          primary: profile?.brandKit?.colors?.primary || f.primary,
          accent: profile?.brandKit?.colors?.accent || f.accent,
          phone: profile?.brandKit?.contact?.phone || f.phone,
          logoUrl: profile?.brandKit?.logoUrl || f.logoUrl,
        }));
      } catch (e: any) {
        toast({ title: 'Could not load your pages', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authedFetch, toast]);

  const searchProjects = async () => {
    const q = projectQuery.trim();
    if (q.length < 2) return;
    setSearchingProjects(true);
    try {
      setProjectResults(await authedFetch(`/api/voice-pages/projects?q=${encodeURIComponent(q)}`));
    } catch {
      setProjectResults([]);
    } finally {
      setSearchingProjects(false);
    }
  };

  const prefillFromProject = (proj: any) => {
    setForm((f) => ({
      ...f,
      title: proj.name || f.title,
      area: proj.area || f.area,
      city: proj.city || f.city,
      price: proj.priceFrom ? String(proj.priceFrom) : f.price,
      bedrooms: Array.isArray(proj.unitTypes) ? proj.unitTypes.join(', ') : f.bedrooms,
      handover: proj.handover || f.handover,
    }));
    setProjectResults([]);
    setProjectQuery('');
  };

  const toggleProject = (proj: any) => {
    setSelectedProjects((sel) =>
      sel.some((p) => p.id === proj.id)
        ? sel.filter((p) => p.id !== proj.id)
        : sel.length < 10
          ? [...sel, proj]
          : sel,
    );
  };

  const bulkCreate = async () => {
    if (!selectedProjects.length || !form.companyName.trim()) {
      toast({
        title: 'Company name required',
        description: 'Fill the brand section below, then create the pages.',
        variant: 'destructive',
      });
      return;
    }
    setBulkCreating(true);
    try {
      const res = await authedFetch('/api/voice-pages/bulk', {
        method: 'POST',
        body: JSON.stringify({
          projectIds: selectedProjects.map((p) => p.id),
          locale: form.locale,
          brand: {
            companyName: form.companyName,
            tagline: form.tagline || undefined,
            logoUrl: form.logoUrl || null,
            colors: { primary: form.primary, accent: form.accent },
            contact: form.phone ? { phone: form.phone } : undefined,
            locale: form.locale,
          },
        }),
      });
      setPages((p) => [...res.created, ...p]);
      setSelectedProjects([]);
      setProjectResults([]);
      setProjectQuery('');
      toast({
        title: `${res.created.length} pages created`,
        description: 'Publish each one to get its ad URL.',
      });
    } catch (e: any) {
      toast({ title: 'Bulk create failed', description: e.message, variant: 'destructive' });
    } finally {
      setBulkCreating(false);
    }
  };

  const createPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const page = await authedFetch('/api/voice-pages', {
        method: 'POST',
        body: JSON.stringify({
          locale: form.locale,
          listing: {
            title: form.title,
            area: form.area,
            city: form.city || undefined,
            price: form.price || undefined,
            bedrooms: form.bedrooms || undefined,
            handover: form.handover || undefined,
            paymentPlan: form.paymentPlan || undefined,
            description: form.description || undefined,
            highlights: form.highlights
              ? form.highlights.split(',').map((h) => h.trim()).filter(Boolean).slice(0, 10)
              : undefined,
          },
          brand: {
            companyName: form.companyName,
            tagline: form.tagline || undefined,
            logoUrl: form.logoUrl || null,
            colors: { primary: form.primary, accent: form.accent },
            contact: form.phone ? { phone: form.phone } : undefined,
            locale: form.locale,
          },
        }),
      });
      setPages((p) => [page, ...p]);
      setShowForm(false);
      toast({ title: 'Page created', description: 'Publish it to go live.' });
    } catch (e: any) {
      toast({ title: 'Could not create the page', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const patchPage = async (id: string, patch: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const updated = await authedFetch(`/api/voice-pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setPages((list) => list.map((p) => (p.id === id ? updated : p)));
      return updated as VoicePage;
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const removePage = async (id: string) => {
    if (!confirm('Delete this page? Its URL stops working immediately.')) return;
    setBusyId(id);
    try {
      await authedFetch(`/api/voice-pages/${id}`, { method: 'DELETE' });
      setPages((list) => list.filter((p) => p.id !== id));
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const pageUrl = (p: VoicePage) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${p.slug}`;

  const copyUrl = (p: VoicePage) => {
    navigator.clipboard?.writeText(pageUrl(p));
    toast({ title: 'Ad URL copied', description: 'Paste it as your ad destination.' });
  };

  const field = (label: string, key: keyof FormState, placeholder = '', required = false) => (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <Input
        required={required}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mic className="h-6 w-6" /> AI Voice Landing Pages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The page your ad points at. It talks to your buyer and drops leads into your CRM.
          </p>
          {(() => {
            const bs = pages.find((p) => p.status === 'published' && p.brandSlug)?.brandSlug;
            return bs ? (
              <p className="mt-1 text-sm">
                Your brand site:{' '}
                <a href={`/b/${bs}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                  /b/{bs}
                </a>{' '}
                <span className="text-muted-foreground">— all your published pages, one link.</span>
              </p>
            ) : null;
          })()}
        </div>
        <div className="flex items-center gap-3">
          {usage && (
            <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5" /> {usage.voiceTurns} AI turns · {usage.month}
            </span>
          )}
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="me-1.5 h-4 w-4" /> New page
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createPage} className="mt-6 space-y-4 rounded-2xl border p-5">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Search className="h-3.5 w-3.5" /> Prefill from a market project (optional)
            </p>
            <div className="flex items-center gap-2">
              <Input
                className="h-9 max-w-xs"
                placeholder="Search project name…"
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void searchProjects();
                  }
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={searchProjects} disabled={searchingProjects}>
                {searchingProjects ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
              </Button>
            </div>
            {projectResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {projectResults.map((proj) => {
                  const isSelected = selectedProjects.some((p) => p.id === proj.id);
                  return (
                    <div
                      key={proj.id}
                      className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => prefillFromProject(proj)}
                        className="min-w-0 flex-1 text-start hover:underline"
                      >
                        <span className="font-medium">{proj.name}</span>
                        <span className="text-muted-foreground"> · {proj.area || proj.city || ''}{proj.developer ? ` · ${proj.developer}` : ''}</span>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        className="h-6 px-2 text-[11px]"
                        onClick={() => toggleProject(proj)}
                      >
                        {isSelected ? 'Selected' : '+ Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedProjects.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                {selectedProjects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => toggleProject(proj)}
                    className="rounded-full border px-2.5 py-1 text-[11px] hover:bg-muted"
                    title="Remove"
                  >
                    {proj.name} ✕
                  </button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  disabled={bulkCreating}
                  onClick={bulkCreate}
                  className="ms-auto"
                >
                  {bulkCreating && <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />}
                  Create {selectedProjects.length} page{selectedProjects.length > 1 ? 's' : ''} with my brand
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm font-semibold">Listing</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Title', 'title', 'Marina Vista Tower B', true)}
            {field('Area / community', 'area', 'Dubai Marina', true)}
            {field('City', 'city')}
            {field('Price', 'price', 'AED 2.4M')}
            {field('Bedrooms', 'bedrooms', '1–3 BR')}
            {field('Handover', 'handover', 'Q4 2027')}
          </div>
          {field('Payment plan', 'paymentPlan', '60/40, 10% booking')}
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Description</span>
            <textarea
              className="min-h-20 w-full rounded-md border bg-transparent p-2 text-sm"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          {field('Highlights (comma-separated)', 'highlights', 'Sea view, Private beach, 8% ROI')}

          <p className="pt-2 text-sm font-semibold">Brand & language</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Company name', 'companyName', '', true)}
            {field('Tagline', 'tagline')}
            {field('Contact phone', 'phone', '+971 …')}
            {field('Logo URL', 'logoUrl', 'https://…')}
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Primary color</span>
              <input
                type="color"
                className="h-10 w-full cursor-pointer rounded-md border bg-transparent"
                value={form.primary}
                onChange={(e) => setForm((f) => ({ ...f, primary: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Accent color</span>
              <input
                type="color"
                className="h-10 w-full cursor-pointer rounded-md border bg-transparent"
                value={form.accent}
                onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Call language</span>
            <select
              className="w-full rounded-md border bg-transparent p-2 text-sm"
              value={form.locale}
              onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value as 'en' | 'ar' }))}
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic, RTL)</option>
            </select>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={creating}>
              {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Create page
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pages.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No pages yet. Create one, publish it, and point your ad at it.
          </div>
        ) : (
          pages.map((p) => (
            <div key={p.id} className="rounded-2xl border p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="h-9 w-9 shrink-0 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${p.brand.colors.primary}, ${p.brand.colors.accent})`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.listing.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.brand.companyName} · {p.listing.area} · {p.locale === 'ar' ? 'Arabic' : 'English'}
                  </p>
                </div>
                <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>
                  {p.status}
                </Badge>
                <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" title="Page views">
                    <Eye className="h-3.5 w-3.5" /> {p.views ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Calls started">
                    <PhoneCall className="h-3.5 w-3.5" /> {p.calls ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Leads captured">
                    <Users className="h-3.5 w-3.5" /> {p.leadCount ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="AI turns served">
                    <Zap className="h-3.5 w-3.5" /> {p.turnCount ?? 0}
                  </span>
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={busyId === p.id}
                  onClick={() =>
                    patchPage(p.id, { status: p.status === 'published' ? 'draft' : 'published' })
                  }
                >
                  {busyId === p.id && <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />}
                  {p.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                {p.status === 'published' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => copyUrl(p)}>
                      <Copy className="me-1.5 h-3.5 w-3.5" /> Copy ad URL
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/v/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="me-1.5 h-3.5 w-3.5" /> Open
                      </a>
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={busyId === p.id}
                  onClick={() => removePage(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="mt-4 rounded-xl bg-muted/40 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" /> Your domain
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="h-9 max-w-xs"
                    placeholder="offers.yourbrand.ae"
                    value={domainDrafts[p.id] ?? p.customDomain ?? ''}
                    onChange={(e) => setDomainDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === p.id}
                    onClick={async () => {
                      const domain = (domainDrafts[p.id] ?? p.customDomain ?? '').trim() || null;
                      const updated = await patchPage(p.id, { customDomain: domain });
                      if (updated)
                        toast({
                          title: domain ? 'Domain saved' : 'Domain removed',
                          description: domain
                            ? 'Now add the DNS record below, then add the domain to your hosting.'
                            : undefined,
                        });
                    }}
                  >
                    Save
                  </Button>
                </div>
                {(domainDrafts[p.id] ?? p.customDomain) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    DNS: create a <b>CNAME</b> record for{' '}
                    <code>{domainDrafts[p.id] ?? p.customDomain}</code> pointing to{' '}
                    <code>{typeof window !== 'undefined' ? window.location.host : 'your app host'}</code>
                    , then register the domain with your hosting provider (Firebase App Hosting →
                    Custom domains) so it issues the SSL certificate.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
