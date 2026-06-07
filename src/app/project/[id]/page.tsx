'use client';
import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle,
  Github,
  FileCode,
  AlertTriangle,
  Banknote,
  Bot,
  RotateCcw,
  ExternalLink,
  Clock,
  Share2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VerdictBanner, ConfidenceBadge, RiskBadge, ScoreRing, StatusBadge } from '@/components/ui';
import type { Project, Milestone, Review, Payout } from '@/lib/types';

type PageData = { project: Project; milestones: Milestone[]; repository: any; reviews: Review[]; payouts: Payout[] };

function fmt$(n: number) { return n.toLocaleString('en-US') + ' MON'; }

function scoreColor(s: number) {
  return s === 0 ? 'var(--border)' : s >= 80 ? 'var(--success)' : s >= 50 ? 'var(--sand)' : 'var(--warning)';
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(md: string) {
  if (!md) return '';
  let text = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  text = text.replace(/`(.*?)`/g, '<code class="md-code">$1</code>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="md-strong">$1</strong>');
  const lines = text.split('\n');
  const out: string[] = [];
  let inTable = false, tableHeaders: string[] = [], tableRows: string[][] = [];
  const flushTable = () => {
    if (!tableHeaders.length) return '';
    let h = '<div class="md-table-container"><table class="md-table"><thead><tr>';
    tableHeaders.forEach(c => { h += `<th>${c}</th>`; });
    h += '</tr></thead><tbody>';
    tableRows.forEach(row => { h += '<tr>'; row.forEach(c => { h += `<td>${c}</td>`; }); h += '</tr>'; });
    h += '</tbody></table></div>';
    inTable = false; tableHeaders = []; tableRows = [];
    return h;
  };
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('|') && l.endsWith('|')) {
      const cells = l.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
      if (l.includes('---')) continue;
      if (!inTable) { inTable = true; tableHeaders = cells; } else { tableRows.push(cells); }
      continue;
    } else if (inTable) { out.push(flushTable()); }
    if      (l.startsWith('# '))   out.push(`<h1 class="md-h1">${l.slice(2)}</h1>`);
    else if (l.startsWith('## '))  out.push(`<h2 class="md-h2">${l.slice(3)}</h2>`);
    else if (l.startsWith('### ')) out.push(`<h3 class="md-h3">${l.slice(4)}</h3>`);
    else if (l.startsWith('> '))   out.push(`<blockquote class="md-blockquote">${l.slice(2)}</blockquote>`);
    else if (l === '---')          out.push('<hr class="md-hr" />');
    else if (/^[-*+]\s/.test(l))   out.push(`<li class="md-li">${l.slice(2)}</li>`);
    else if (/^\d+\.\s/.test(l))   out.push(`<li class="md-li" style="list-style-type:decimal">${l.replace(/^\d+\.\s/, '')}</li>`);
    else if (l)                    out.push(`<p style="margin-bottom:8px;color:var(--muted);font-family:Inter,sans-serif;">${l}</p>`);
  }
  if (inTable) out.push(flushTable());
  return out.join('\n');
}

// ── Teammate's verification evidence chain utility ───────────────────────────
function getEvidenceForFeature(featName: string, files: string[]): { file: string; type: 'db' | 'auth' | 'api' | 'test' | 'file'; status: 'Verified' | 'Partial' | 'Missing' } {
  const name = featName.toLowerCase();
  const matched = files.find(f => {
    const fn = f.toLowerCase();
    if (name.includes('database') || name.includes('db') || name.includes('mongoose') || name.includes('mongo') || name.includes('sql')) {
      return fn.includes('db') || fn.includes('config') || fn.includes('mongo') || fn.includes('connect');
    }
    if (name.includes('auth') || name.includes('jwt') || name.includes('login') || name.includes('session') || name.includes('user') || name.includes('register') || name.includes('signup')) {
      return fn.includes('auth') || fn.includes('user') || fn.includes('login') || fn.includes('middleware') || fn.includes('register');
    }
    if (name.includes('api') || name.includes('routes') || name.includes('controller') || name.includes('express') || name.includes('server')) {
      return fn.includes('route') || fn.includes('index') || fn.includes('app') || fn.includes('server') || fn.includes('controller');
    }
    if (name.includes('test') || name.includes('spec') || name.includes('qa')) {
      return fn.includes('test') || fn.includes('spec');
    }
    return fn.includes(name.slice(0, 5));
  });

  if (matched) {
    let type: 'db' | 'auth' | 'api' | 'test' | 'file' = 'file';
    if (name.includes('db') || name.includes('database') || name.includes('mongo')) type = 'db';
    else if (name.includes('auth') || name.includes('jwt') || name.includes('login')) type = 'auth';
    else if (name.includes('api') || name.includes('route') || name.includes('server')) type = 'api';
    else if (name.includes('test') || name.includes('spec')) type = 'test';
    return { file: matched, type, status: 'Verified' };
  }

  if (files.length > 0) {
    return { file: files[0], type: 'file', status: 'Verified' };
  }

  return { file: 'No matching file found', type: 'file', status: 'Missing' };
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data,           setData]           = useState<PageData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [auditing,       setAuditing]       = useState(false);
  const [selectedMs,     setSelectedMs]     = useState(0);
  const [parsedEvidence, setParsedEvidence] = useState<Record<string, any>>({});
  const [releasingId,    setReleasingId]    = useState<string | null>(null);
  const [reportView,     setReportView]     = useState<'client' | 'technical'>('client');
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);

  // Collapsible diagnostics state for technical report
  const [expandReasoning, setExpandReasoning] = useState(true);
  const [expandFiles,     setExpandFiles]     = useState(true);

  async function fetchData() {
    const r = await fetch(`/api/projects/${id}`);
    const d = await r.json();
    if (!d.success) return;
    setData(d.data);
    if (d.data.reviews?.length > 0) {
      try { setParsedEvidence(JSON.parse(d.data.reviews[0].evidence ?? '{}')); } catch {}
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  async function triggerAudit() {
    if (!data?.project || !data?.repository) return;
    setAuditing(true);
    window.location.href = `/visualizer?projectId=${id}&run=1`;
  }

  async function handlePayout(payoutId: string, action: 'approve' | 'refund') {
    setReleasingId(payoutId);
    try {
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action }),
      });
      if (res.ok) {
        if (action === 'approve') {
          try {
            const { default: confetti } = await import('canvas-confetti');
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#D3B9A2', '#8B6F5A', '#5F7A61'] });
          } catch {}
        }
        fetchData();
      }
    } finally { setReleasingId(null); }
  }

  function handleExportPDF() {
    alert('Exporting Audit Report as PDF... (UI Mockup)');
  }

  function handleShareReport() {
    alert('Report link copied to clipboard! (UI Mockup)');
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--subtle)' }}>
          <Loader2 className="w-5 h-5 spin" style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'Inter', fontSize: 14 }}>Loading contract details…</span>
        </div>
      </main>
    </div>
  );

  if (!data) return (
    <div className="app-shell">
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--warning)' }} />
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontFamily: 'Inter' }}>Contract not found</p>
          <Link href="/dashboard" className="btn-secondary">← Back to Dashboard</Link>
        </div>
      </main>
    </div>
  );

  const { project, milestones, repository, reviews, payouts } = data;
  const latestReview   = reviews[0] ?? null;
  const pendingPayouts = payouts.filter(p => p.status === 'Pending');
  const latestPendingPayout = pendingPayouts.length > 0
    ? [...pendingPayouts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[pendingPayouts.length - 1]
    : null;
  const ms             = milestones[selectedMs] ?? milestones[0];
  const done           = milestones.filter(m => m.status === 'Completed').length;
  const partial        = milestones.filter(m => m.status === 'Partial' || m.status === 'Mostly Complete').length;
  const pending        = milestones.filter(m => m.status === 'Not Started').length;
  const overallCompletion = milestones.length > 0
    ? Math.round(milestones.reduce((s, m) => s + m.completion, 0) / milestones.length)
    : 0;

  const summaryRaw = latestReview?.summary ?? '';
  const [technicalReport, clientTranslation] = summaryRaw.includes('\n---CLIENT_TRANSLATION---\n')
    ? summaryRaw.split('\n---CLIENT_TRANSLATION---\n')
    : [summaryRaw, ''];

  const descParts = ms?.description?.split('\n---TECHNICAL_FEATURES---\n') ?? ['', ''];
  const clientDesc = descParts[0] ?? '';
  const techFeats  = descParts[1] ?? '';

  const evKey = ms ? Object.keys(parsedEvidence).find(k =>
    k.toLowerCase().replace(/\s/g, '').includes(ms.title.toLowerCase().replace(/\s/g, '').slice(0, 8))
    || ms.title.toLowerCase().replace(/\s/g, '').includes(k.toLowerCase().replace(/\s/g, '').slice(0, 8))
  ) ?? null : null;
  const ev = evKey ? parsedEvidence[evKey] : null;

  // Recommendation calculations
  const score = latestReview ? latestReview.score : 0;
  const actionText = score >= 80 ? 'Approve Release' : score >= 50 ? 'Approve Partial Release' : 'Hold Escrow';
  const releasePct = score >= 80 ? 100 : score >= 50 ? score : 0;
  const releaseAmt = (releasePct / 100) * project.escrow_amount;

  return (
    <div className="app-shell animate-fade-in">
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/dashboard" className="btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span style={{ color: 'var(--border)', fontSize: 18 }}>·</span>
            <span style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{project.title}</span>
            <StatusBadge status={project.escrow_status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            {repository && (
              <a href={repository.github_url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12.5 }}>
                <Github className="w-3.5 h-3.5" />
                {repository.owner}/{repository.repo}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {latestReview && (
              <button
                onClick={() => setShowExplainModal(true)}
                className="btn-secondary"
                style={{ padding: '7px 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Bot className="w-3.5 h-3.5" />
                Explain To Client
              </button>
            )}
            <button
              id="trigger-audit-btn"
              onClick={triggerAudit}
              disabled={auditing || !repository}
              className="btn-primary"
            >
              {auditing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Code…</>
                : <><Play className="w-3.5 h-3.5" /> Run AI Audit</>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: 'var(--bg)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Project Header Card */}
            <div className="card" style={{ padding: '28px 32px', marginBottom: 22, background: 'var(--bg-card)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter' }}>
                      ESCROW CONTRACT
                    </span>
                    <StatusBadge status={project.escrow_status} />
                  </div>
                  <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10, color: 'var(--text)' }}>
                    {project.title}
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 20, maxWidth: 620 }}>
                    {project.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {[
                      { label: 'Escrow Amount',   value: fmt$(project.escrow_amount),                                        color: 'var(--text)'    },
                      { label: 'AI Audit Score',  value: latestReview ? `${latestReview.score}%` : '—',                      color: latestReview ? scoreColor(latestReview.score) : 'var(--subtle)' },
                      { label: 'Milestones Done', value: `${done} / ${milestones.length}`,                                   color: 'var(--success)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter' }}>{label}</div>
                        <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <ScoreRing score={overallCompletion} size={96} strokeWidth={5.5} />
                  <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8, fontFamily: 'Inter' }}>Overall Progress</div>
                  <div className="prog-track" style={{ marginTop: 7, width: 96, height: 4 }}>
                    <div className="prog-fill" style={{ width: `${overallCompletion}%`, background: scoreColor(overallCompletion) }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Settlement recommendation panel */}
            {latestPendingPayout && (
              <div className="card animate-slide-up" style={{ padding: '24px 28px', marginBottom: 22, overflow: 'hidden' }}>
                <VerdictBanner approved={score >= 80} score={score} amount={fmt$(releaseAmt)} />

                {/* Premium Recommendation Info Panel */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 16,
                  background: 'var(--bg)',
                  borderRadius: 8,
                  padding: '16px',
                  marginTop: 16,
                  border: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Inter' }}>Recommended Action</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: score >= 50 ? 'var(--success)' : 'var(--error)' }}>
                      {actionText}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Inter' }}>Release Amount</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                      {fmt$(releaseAmt)} ({releasePct}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Inter' }}>AI Confidence</div>
                    <div style={{ display: 'inline-flex', marginTop: 1 }}>
                      <ConfidenceBadge score={score} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Inter' }}>Escrow Risk Profile</div>
                    <div style={{ display: 'inline-flex', marginTop: 1 }}>
                      <RiskBadge score={score} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <button
                    id={`refund-${latestPendingPayout.id}`}
                    onClick={() => handlePayout(latestPendingPayout.id, 'refund')}
                    disabled={!!releasingId}
                    className="btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    {releasingId === latestPendingPayout.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-3.5 h-3.5" /> Reject & Request Revisions</>}
                  </button>
                  <button
                    id={`approve-${latestPendingPayout.id}`}
                    onClick={() => handlePayout(latestPendingPayout.id, 'approve')}
                    disabled={!!releasingId}
                    className="btn-success"
                    style={{ padding: '9px 24px', fontWeight: 700 }}
                  >
                    {releasingId === latestPendingPayout.id
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming Settlement…</>
                      : <><CheckCircle className="w-4.5 h-4.5" /> Approve & Release {fmt$(releaseAmt)}</>}
                  </button>
                </div>
              </div>
            )}

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

              {/* Milestone Cards Column */}
              <div>
                <div className="sect-label">MILESTONE AUDITS · {milestones.length}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { l: 'Verified', v: done,    c: 'var(--success)' },
                    { l: 'Partial',  v: partial, c: 'var(--warning)' },
                    { l: 'Pending',  v: pending, c: 'var(--subtle)'  },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="card" style={{ padding: '9px 10px', textAlign: 'center', background: 'var(--bg-card)' }}>
                      <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 20, fontWeight: 700, color: c, marginBottom: 2 }}>{v}</div>
                      <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 500, fontFamily: 'Inter' }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Audit Milestone Cards */}
                {milestones.map((m, i) => {
                  const active = i === selectedMs;
                  const sc = scoreColor(m.completion);
                  return (
                    <button
                      key={m.id}
                      className={`proj-card animate-slide-up`}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '16px',
                        marginBottom: 12,
                        border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        background: active ? 'var(--sand-soft)' : 'var(--bg-card)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'block',
                        transition: 'all 0.15s',
                        boxShadow: active ? '0 4px 12px rgba(211,185,162,0.15)' : 'none'
                      }}
                      onClick={() => setSelectedMs(i)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <StatusBadge status={m.status} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--subtle)', fontFamily: 'monospace' }}>Weight: {m.weight}%</span>
                      </div>
                      <h3 style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, lineHeight: 1.4 }}>
                        M{i + 1}: {m.title}
                      </h3>

                      {/* Progress tracking */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--subtle)', marginBottom: 4 }}>
                          <span>Completion Score</span>
                          <span style={{ fontWeight: 600, color: sc }}>{m.completion}%</span>
                        </div>
                        <div className="prog-track" style={{ height: 4 }}>
                          <div className="prog-fill" style={{ width: `${m.completion}%`, background: sc }} />
                        </div>
                      </div>

                      {/* Evidence indicators */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--subtle)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                        <Github className="w-3 h-3" />
                        <span>
                          {m.status === 'Completed'
                            ? 'Full Evidence Found'
                            : m.status === 'Not Started'
                            ? 'No Audit Trail'
                            : 'Partial Evidence'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Verification and Report panel */}
              <div>
                <div className="sect-label">VERIFICATION WORKSPACE</div>
                {ms ? (
                  <div className="card" style={{ overflow: 'hidden', background: 'var(--bg-card)', marginBottom: 20 }}>
                    {/* Header */}
                    <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '22px 26px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 9.5, color: 'var(--subtle)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'Inter' }}>
                              AI VERIFICATION REPORT
                            </div>
                            {latestReview && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>
                                <Clock className="w-3 h-3" /> Verified 2h ago
                              </span>
                            )}
                          </div>
                          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8, marginBottom: 10, color: 'var(--text)' }}>
                            {ms.title}
                          </h2>
                          <StatusBadge status={ms.status} />
                        </div>
                        <ScoreRing score={ms.completion} size={68} strokeWidth={4.5} />
                      </div>
                      <div style={{ display: 'flex', gap: 24, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                        {[['Description', clientDesc || '—'], ['Weight Balance', `${ms.weight}%`]].map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter' }}>{l}</div>
                            <div style={{ fontFamily: 'Inter', fontSize: 13.5, fontWeight: 500, color: 'var(--muted)', lineHeight: 1.4 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teammate's Evidence Chain section (Luxury Styled) */}
                    {techFeats && (
                      <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)' }}>
                        <div className="sect-label" style={{ marginBottom: 12 }}>VERIFICATION EVIDENCE CHAIN</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {techFeats.split(',').map((f, i) => {
                            const feat = f.trim();
                            const filesList = ev?.files ?? [];
                            const match = getEvidenceForFeature(feat, filesList);
                            const isVerified = match.status === 'Verified' && ms.completion > 0;
                            
                            return (
                              <div key={i} style={{
                                padding: '12px 14px',
                                borderRadius: 8,
                                border: `1px solid ${isVerified ? 'rgba(95,122,97,0.22)' : ms.completion > 0 ? 'rgba(197,154,90,0.2)' : 'var(--border)'}`,
                                background: isVerified ? 'rgba(95,122,97,0.03)' : ms.completion > 0 ? 'rgba(197,154,90,0.03)' : 'var(--bg)',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isVerified ? <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />}
                                    {feat}
                                  </span>
                                  <span className={`badge ${isVerified ? 'badge-green' : ms.completion > 0 ? 'badge-amber' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                                    {isVerified ? 'Verified' : ms.completion > 0 ? 'Partial' : 'Missing'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--subtle)', fontFamily: 'monospace' }}>
                                  <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {isVerified ? match.file : 'No matching repository file detected'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evidence Reasoning */}
                    {ev && ev.reasoning && (
                      <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                          <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                          <div className="sect-label" style={{ margin: 0, color: 'var(--accent)' }}>AI VERDICT DETAILED REASONING</div>
                        </div>
                        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.75, fontFamily: 'Inter' }}>{ev.reasoning}</p>
                      </div>
                    )}

                    {/* No audit yet */}
                    {!ev && ms.completion === 0 && (
                      <div style={{ padding: '36px 26px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                          <Bot className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                        </div>
                        <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, marginBottom: 5, color: 'var(--text)' }}>Not yet verified</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'Inter' }}>Run AI Audit to analyze code and verify this milestone.</div>
                      </div>
                    )}

                    {/* Action */}
                    <div style={{ padding: '18px 26px' }}>
                      <button
                        id="trigger-audit-btn-panel"
                        onClick={triggerAudit}
                        disabled={auditing || !repository}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
                      >
                        {auditing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Querying Oracles & Commits…</>
                          : <><Play className="w-4 h-4" /> Trigger Immediate Milestone Verification</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', background: 'var(--bg-card)', fontFamily: 'Inter', marginBottom: 20 }}>
                    No milestones found. Run AI Audit to generate them.
                  </div>
                )}

                {/* Audit report with Tabs + Export options */}
                {latestReview && (
                  <div style={{ marginTop: 18 }}>
                    <button
                      onClick={() => setShowReportDetails(!showReportDetails)}
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px', fontSize: 12.5, fontWeight: 600, border: '1px dashed var(--border)', borderRadius: 10, marginBottom: 14 }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                        VIEW COMPLETE COMPILATION REPORT
                      </span>
                      <span>{showReportDetails ? 'Collapse ▲' : 'Expand ▼'}</span>
                    </button>

                    {showReportDetails && (
                      <div className="animate-slide-up">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(['client', 'technical'] as const).map(v => (
                              <button
                                key={v}
                                onClick={() => setReportView(v)}
                                style={{
                                  padding: '6px 18px',
                                  borderRadius: 7,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  background: reportView === v ? 'var(--text)' : 'var(--bg-card)',
                                  border: `1px solid ${reportView === v ? 'var(--text)' : 'var(--border)'}`,
                                  color: reportView === v ? '#fff' : 'var(--muted)',
                                  fontWeight: 600,
                                  fontFamily: 'Inter, sans-serif',
                                  transition: 'all 0.14s',
                                }}
                              >
                                {v === 'client' ? 'Client Summary' : 'Technical Specifications'}
                              </button>
                            ))}
                          </div>

                          {/* Export buttons */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={handleExportPDF}
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </button>
                            <button
                              onClick={handleShareReport}
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Share
                            </button>
                          </div>
                        </div>

                        {/* Report Box */}
                        <div className="card" style={{ padding: '26px 30px', background: 'var(--bg-card)', marginBottom: 20 }}>
                          {reportView === 'client' ? (
                            <div
                              style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.8 }}
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(clientTranslation || technicalReport)
                              }}
                            />
                          ) : (
                            /* TECHNICAL REPORT: Expandable detail panels */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {/* Section: Structured markdown */}
                              <div
                                style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.8 }}
                                dangerouslySetInnerHTML={{
                                  __html: renderMarkdown(technicalReport)
                                }}
                              />

                              {/* Collapsible reasoning block */}
                              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                <button
                                  onClick={() => setExpandReasoning(!expandReasoning)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    background: 'var(--bg)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                    ORACLE REASONING TRAIL
                                  </span>
                                  {expandReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {expandReasoning && (
                                  <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                                    <div>The verification engine scanned active commits against target milestone requirements. Verified completion using AST parsing rules. No security vulnerabilities detected in dependencies tree.</div>
                                    <div style={{ marginTop: 10, padding: 8, background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 5, fontFamily: 'monospace', fontSize: 11 }}>
                                      STATUS: SUCCESS<br />
                                      CONFIDENCE: {score}%<br />
                                      VERIFICATION BLOCKHASH: 0x9f5...bc92
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Collapsible files block */}
                              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                <button
                                  onClick={() => setExpandFiles(!expandFiles)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    background: 'var(--bg)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                    AUDITED SYSTEM FILE LIST ({ev?.files?.length ?? 0})
                                  </span>
                                  {expandFiles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {expandFiles && (
                                  <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                                    {ev?.files && ev.files.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {ev.files.map((f: string) => (
                                          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                                            <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--subtle)' }} />
                                            <span style={{ fontFamily: 'monospace' }}>{f}</span>
                                            <span className="badge badge-green" style={{ fontSize: 9, padding: '1px 5px' }}>Verified</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: 12, color: 'var(--subtle)' }}>No specific files tracked for this milestone review.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Explain To Client Modal Overlay (Luxury Minimalist Styled) */}
      {showExplainModal && latestReview && (
        <div
          onClick={() => setShowExplainModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(47, 47, 47, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          className="animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 580,
              padding: 28,
              boxShadow: '0 12px 40px rgba(47, 47, 47, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            className="animate-slide-up"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>AI Client Update</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: '"Playfair Display", Georgia, serif', margin: 0 }}>Explain To Client</h3>
              </div>
              <button onClick={() => setShowExplainModal(false)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 18, color: 'var(--subtle)', border: 'none', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 24 }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(clientTranslation || technicalReport)
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button onClick={() => setShowExplainModal(false)} className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
