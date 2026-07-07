'use client';

/**
 * /me/ops — Entrestate's own sales pipeline: claim requests from /pricing
 * and every /pitch demo provisioned (claimed or not). Access is enforced
 * server-side via ENTRESTATE_ADMIN_EMAILS; others see a 403 message.
 */

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Flame, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Claim {
  id: string;
  tenantSlug: string;
  companyName: string;
  name: string;
  phone: string;
  email?: string | null;
  locale: string;
  status: 'new' | 'contacted' | 'won' | 'lost';
  createdAt: number;
}

interface PitchSession {
  id: string;
  tenantSlug: string;
  companyName: string;
  websiteUrl?: string | null;
  locale: string;
  listingsFound: number;
  createdAt: number;
}

const STATUS_FLOW: Claim['status'][] = ['new', 'contacted', 'won', 'lost'];

export default function OpsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sessions, setSessions] = useState<PitchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/whitelabel/ops', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      if (json?.ok) {
        setClaims(json.data.claims || []);
        setSessions(json.data.pitchSessions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (claim: Claim, status: Claim['status']) => {
    if (!user) return;
    setBusyId(claim.id);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/whitelabel/ops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ claimId: claim.id, status }),
      });
      setClaims((list) => list.map((c) => (c.id === claim.id ? { ...c, status } : c)));
    } finally {
      setBusyId(null);
    }
  };

  const when = (ts: number) => new Date(ts).toLocaleString();

  if (forbidden) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
        This area is for the Entrestate team. Ask an admin to add your email to
        <code className="mx-1">ENTRESTATE_ADMIN_EMAILS</code>.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Flame className="h-6 w-6 text-orange-500" /> Sales Pipeline
        </h1>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Claim requests ({claims.length})
      </h2>
      <div className="mt-3 space-y-3">
        {claims.length === 0 && !loading && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto mb-2 h-5 w-5" /> No claims yet.
          </p>
        )}
        {claims.map((c) => (
          <div key={c.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {c.companyName}
                  <span className="ms-2 text-sm font-normal text-muted-foreground">
                    {c.name} · {c.phone}
                    {c.email ? ` · ${c.email}` : ''}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {when(c.createdAt)} · {c.locale}
                  {' · '}
                  <a href={`/demo/${c.tenantSlug}`} target="_blank" rel="noreferrer" className="underline">
                    demo <ExternalLink className="inline h-3 w-3" />
                  </a>
                </p>
              </div>
              <Badge variant={c.status === 'won' ? 'default' : c.status === 'new' ? 'destructive' : 'secondary'}>
                {c.status}
              </Badge>
            </div>
            <div className="mt-3 flex gap-1.5">
              {STATUS_FLOW.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={c.status === s ? 'default' : 'outline'}
                  className="h-7 px-2.5 text-xs capitalize"
                  disabled={busyId === c.id || c.status === s}
                  onClick={() => setStatus(c, s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Pitch demos provisioned ({sessions.length})
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-start text-xs text-muted-foreground">
              <th className="p-3 text-start font-medium">Company</th>
              <th className="p-3 text-start font-medium">Website</th>
              <th className="p-3 text-start font-medium">Lang</th>
              <th className="p-3 text-start font-medium">Listings found</th>
              <th className="p-3 text-start font-medium">When</th>
              <th className="p-3 text-start font-medium">Demo</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{s.companyName}</td>
                <td className="max-w-40 truncate p-3 text-muted-foreground">{s.websiteUrl || '—'}</td>
                <td className="p-3">{s.locale}</td>
                <td className="p-3">{s.listingsFound}</td>
                <td className="p-3 text-muted-foreground">{when(s.createdAt)}</td>
                <td className="p-3">
                  <a href={`/demo/${s.tenantSlug}`} target="_blank" rel="noreferrer" className="text-primary underline">
                    open
                  </a>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No pitch demos yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
