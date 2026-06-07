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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 36 }}>
                <div style={{ gridColumn: 'span 2' }}><SkeletonKpi /></div>
                <SkeletonKpi />
                <SkeletonKpi />
                <SkeletonKpi />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 36 }}>
                <KpiCard
                  icon={<TrendingUp className="w-4.5 h-4.5" />}
                  label="Total Volume"
                  value={fmt$(totalEscrowed)}
                  sub="locked in contracts"
                  accent="var(--accent)"
                  featured={true}
                />
                <KpiCard
                  icon={<Wallet className="w-4 h-4" />}
                  label="Active Escrows"
                  value={String(active)}
                  sub={`${projects.length} total contracts`}
                  accent="var(--sand)"
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
                  <Link key={p.id} href={`/project/${p.id}`} className="proj-card animate-slide-up" style={{ padding: '24px 28px', textDecoration: 'none', color: 'inherit', margin: 0, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter' }}>
                            Escrow Contract
                          </span>
                          <StatusBadge status={p.escrow_status} />
                        </div>
                        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, color: 'var(--text)' }}>
                          {p.title}
                        </h3>
                        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                          {p.description?.slice(0, 130)}{(p.description?.length ?? 0) > 130 ? '…' : ''}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <ScoreRing score={p.escrow_status === 'Released' ? 100 : 0} size={54} strokeWidth={4.5} showLabel={false} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--subtle)', fontWeight: 500, fontFamily: 'Inter' }}>Value:</span>
                        <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 800, color: 'var(--accent)', background: 'var(--sand-soft)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {fmt$(p.escrow_amount)}
                        </span>
                      </div>
                      {p.github_url && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                          <Github className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                          <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
                            {p.github_url.replace('https://github.com/', '').slice(0, 24)}
                          </span>
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto' }}>
                        <span className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-alt)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text)' }}>
                          {p.escrow_status === 'Released' ? 'View Details' : 'Manage Audit'}
                          <ArrowRight className="w-3.5 h-3.5" />
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
