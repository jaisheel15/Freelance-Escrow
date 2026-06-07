'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Github,
  TrendingUp,
  ShieldCheck,
  Banknote,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { KpiCard, StatusBadge, ScoreRing, SkeletonKpi, EmptyState } from '@/components/ui';
import type { Project } from '@/lib/types';

function fmt$(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MON';
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [balances, setBalances] = useState({ client: 0, freelancer: 0, contract: 0 });
  const [loading,  setLoading]  = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([fetch('/api/projects'), fetch('/api/blockchain')]);
      const pData = await pRes.json();
      const bData = await bRes.json();
      if (pData.success) setProjects(pData.data);
      if (bData.success) setBalances(bData.data.balances);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const totalEscrowed = projects.reduce((s, p) => s + p.escrow_amount, 0);
  const verified      = projects.filter(p => p.escrow_status === 'Released').length;
  const active        = projects.filter(p => p.escrow_status === 'Funded').length;

  return (
    <div className="app-shell animate-fade-in">
      <Sidebar />
      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div style={{ fontSize: 10, color: 'var(--subtle)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', fontFamily: 'Inter' }}>
              Overview
            </div>
            <h1 style={{ fontSize: 17, fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Escrow Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            <button onClick={loadData} className="btn-ghost" style={{ padding: '7px 11px' }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'spin' : ''}`} />
            </button>
            <Link href="/new" className="btn-primary">
              <Plus className="w-3.5 h-3.5" />
              New Escrow
            </Link>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content" style={{ background: 'var(--bg)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* Page heading */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 5 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                {loading
                  ? 'Loading your contracts…'
                  : `${projects.length} escrow contract${projects.length !== 1 ? 's' : ''} · AI verification engine ready`}
              </p>
            </div>

            {/* Stats */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 36 }}>
                {[1,2,3,4].map(i => <SkeletonKpi key={i} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 36 }}>
                <KpiCard
                  icon={<Wallet className="w-4 h-4" />}
                  label="Active Escrows"
                  value={String(active)}
                  sub={`${projects.length} total contracts`}
                  accent="var(--sand)"
                />
                <KpiCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Total Volume"
                  value={fmt$(totalEscrowed)}
                  sub="locked in contracts"
                  accent="var(--accent)"
                />
                <KpiCard
                  icon={<ShieldCheck className="w-4 h-4" />}
                  label="AI Verified"
                  value={String(verified)}
                  sub="94% avg confidence"
                  accent="var(--success)"
                />
                <KpiCard
                  icon={<Banknote className="w-4 h-4" />}
                  label="Total Released"
                  value={fmt$(balances.freelancer)}
                  sub="paid to developers"
                  accent="var(--warning)"
                />
              </div>
            )}

            {/* Contracts grid section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
                Your Escrow Contracts
              </h3>
              <span className="badge badge-gray">{loading ? '…' : `${projects.length} active`}</span>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 118, borderRadius: 12 }} />)}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No contracts yet"
                description="Create your first escrow contract. AI will plan verifiable milestones from your project description."
                action={
                  <Link href="/new" className="btn-primary">
                    <Plus className="w-4 h-4" /> Create First Contract
                  </Link>
                }
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {projects.map(p => (
                  <Link key={p.id} href={`/project/${p.id}`} className="proj-card animate-slide-up" style={{ padding: '20px 22px', textDecoration: 'none', color: 'inherit', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 9.5, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter' }}>
                            ESCROW CONTRACT
                          </span>
                          <StatusBadge status={p.escrow_status} />
                        </div>
                        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 5, color: 'var(--text)' }}>
                          {p.title}
                        </h3>
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>
                          {p.description?.slice(0, 110)}{(p.description?.length ?? 0) > 110 ? '…' : ''}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <ScoreRing score={p.escrow_status === 'Released' ? 100 : 0} size={42} strokeWidth={3.5} showLabel={false} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 12, color: 'var(--subtle)', paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 8 }}>
                      <span style={{ fontFamily: 'Inter' }}>
                        Value: <strong style={{ color: 'var(--text)', fontFamily: '"Playfair Display", Georgia, serif' }}>{fmt$(p.escrow_amount)}</strong>
                      </span>
                      {p.github_url && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Github className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>{p.github_url.replace('https://github.com/', '').slice(0, 24)}</span>
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                          {p.escrow_status === 'Released' ? 'View Details' : 'Manage Audit'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* How krow works horizontal onboarding banner */}
            <div className="card animate-slide-up" style={{ padding: '24px 28px', marginTop: 36, background: 'var(--bg-card)' }}>
              <div className="sect-label" style={{ marginBottom: 16, letterSpacing: '0.08em' }}>
                Escrow Protocol Flow
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
                {[
                  { n: '01', t: 'Draft Escrow', d: 'Client locks budget on Monad Devnet.' },
                  { n: '02', t: 'Smart Lock Active', d: 'Smart escrow contract monitors work.' },
                  { n: '03', t: 'GitHub Checkpoint', d: 'Developer triggers webhooks on PR.' },
                  { n: '04', t: 'AI Audits Trait', d: 'Specialized agents verify milestones.' },
                  { n: '05', t: 'Payout Dispatched', d: 'Instant smart contract settlement.' },
                ].map((step, i) => (
                  <div key={step.n} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', background: 'var(--bg-alt)', padding: '2px 6px', borderRadius: 4 }}>
                        {step.n}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {step.t}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45, margin: 0 }}>
                      {step.d}
                    </p>
                    {i < 4 && (
                      <div style={{ position: 'absolute', top: 12, right: -14, fontSize: 11, color: 'var(--border)' }}>
                        ➔
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
