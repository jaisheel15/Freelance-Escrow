'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Play, Loader2, CheckCircle, Clock, GitBranch,
  FileCode, GitCommit, Coins, ShieldCheck, AlertTriangle, Cpu,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import type { Project, Milestone, Review, Payout } from '@/lib/types';

type PageData = { project: Project; milestones: Milestone[]; repository: any; reviews: Review[]; payouts: Payout[] };

const milestoneStatus: Record<string, { cls: string }> = {
  'Completed':       { cls: 'badge-green'  },
  'Mostly Complete': { cls: 'badge-cyan'   },
  'Partial':         { cls: 'badge-amber'  },
  'Not Started':     { cls: 'badge-orange' },
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data,         setData]         = useState<PageData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [auditing,     setAuditing]     = useState(false);
  const [selectedEv,   setSelectedEv]   = useState<string | null>(null);
  const [parsedEvidence, setParsedEvidence] = useState<Record<string, any>>({});
  const [releasingId,  setReleasingId]  = useState<string | null>(null);
  const [reportView,   setReportView]   = useState<'technical' | 'client'>('client');

  async function fetchData() {
    const r = await fetch(`/api/projects/${id}`);
    const d = await r.json();
    if (!d.success) return;
    setData(d.data);
    if (d.data.reviews?.length > 0) {
      try {
        const ev = JSON.parse(d.data.reviews[0].evidence ?? '{}');
        setParsedEvidence(ev);
        if (!selectedEv && Object.keys(ev).length > 0) setSelectedEv(Object.keys(ev)[0]);
      } catch { /* ignore */ }
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
    if (!confirm(`${action === 'approve' ? 'Approve release' : 'Refund'}? This will update the on-chain record.`)) return;
    setReleasingId(payoutId);
    try {
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action }),
      });
      if (res.ok) {
        if (action === 'approve') {
          const { default: confetti } = await import('canvas-confetti');
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        fetchData();
      }
    } finally { setReleasingId(null); }
  }

  if (loading) {
    return (
      <div className="flex h-screen font-sans" style={{ background: '#0e0c0a' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3" style={{ color: '#5a5248' }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#DA7756' }} />
            <span className="font-mono text-sm">Loading contract state…</span>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen font-sans" style={{ background: '#0e0c0a' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#f87171' }} />
            <p style={{ color: '#F5ECD7' }}>Project not found</p>
            <Link href="/" className="btn-secondary mt-4 inline-flex">← Back</Link>
          </div>
        </main>
      </div>
    );
  }

  const { project, milestones, repository, reviews, payouts } = data;
  const latestReview   = reviews[0] ?? null;
  const pendingPayouts = payouts.filter(p => p.status === 'Pending');

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0e0c0a' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-4"
          style={{ background: 'rgba(14,12,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2e2b26' }}>
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="btn-ghost px-2 py-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate" style={{ color: '#F5ECD7' }}>{project.title}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="badge badge-cyan text-xs">{project.escrow_status}</span>
                {repository && (
                  <a href={repository.github_url} target="_blank" rel="noreferrer"
                    className="text-xs font-mono flex items-center gap-1" style={{ color: '#5a5248' }}>
                    <GitBranch className="w-3 h-3" />
                    {repository.owner}/{repository.repo}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button id="trigger-audit-btn"
              onClick={triggerAudit}
              disabled={auditing || !repository}
              className="bg-[#DA7756] text-[#0e0c0a] font-extrabold text-sm px-6 py-3.5 rounded-lg shadow-lg hover:bg-[#e0896a] hover:scale-[1.03] transition-all flex items-center gap-2 disabled:opacity-45 disabled:scale-100 disabled:cursor-not-allowed">
              {auditing ? <><Loader2 className="w-4 h-4 animate-spin" /> Running AI Audit…</> : <><Play className="w-4 h-4 fill-current" /> Run AI Audit</>}
            </button>
          </div>
        </div>

        <div className="px-7 py-6 grid grid-cols-3 gap-6">

          {/* ── Left: milestones + report ── */}
          <div className="col-span-2 space-y-5">

            {/* Contract stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Escrow Locked',   value: `${project.escrow_amount} MON`, color: '#67e8f9', icon: Coins       },
                { label: 'Audit Score',      value: latestReview ? `${latestReview.score}%` : '—', color: '#DA7756', icon: ShieldCheck },
                { label: 'Milestones',       value: `${milestones.filter(m => m.status === 'Completed').length}/${milestones.length}`, color: '#4ade80', icon: CheckCircle },
              ].map(s => (
                <div key={s.label} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#9a8f82' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Pending payouts */}
            {pendingPayouts.map(payout => (
              <div key={payout.id} className="glass-card p-4 animate-slide-up"
                style={{ borderColor: 'rgba(218,119,86,0.3)', boxShadow: '0 0 20px rgba(218,119,86,0.05)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5ECD7' }}>
                      AI Settlement Recommendation
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9a8f82' }}>
                      Release <strong style={{ color: '#DA7756' }}>{payout.amount} MON</strong> ({payout.release_percentage}% of escrow)
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <button id={`refund-${payout.id}`}
                      onClick={() => handlePayout(payout.id, 'refund')}
                      disabled={!!releasingId}
                      className="border border-neutral-800 hover:border-red-950 hover:text-red-400 text-[#9a8f82] transition-all text-xs px-4 py-2.5 rounded disabled:opacity-40">
                      {releasingId === payout.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Refund'}
                    </button>
                    <button id={`approve-${payout.id}`}
                      onClick={() => handlePayout(payout.id, 'approve')}
                      disabled={!!releasingId}
                      className="bg-[#DA7756] text-[#0e0c0a] hover:bg-[#e0896a] hover:scale-[1.02] transition-all font-bold text-xs px-5 py-2.5 rounded shadow-md flex items-center gap-1.5 disabled:opacity-40">
                      {releasingId === payout.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5" /> Approve Release</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pixel divider */}
            <div className="px-div" />

            {/* Milestones */}
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#5a5248' }}>
                Milestone Breakdown
              </h2>
              <div className="space-y-2">
                {milestones.map(m => {
                  const cfg = milestoneStatus[m.status] ?? { cls: 'badge-orange' };
                  const descParts = m.description.split('\n---TECHNICAL_FEATURES---\n');
                  const clientDesc = descParts[0] || '';
                  const techFeatures = descParts[1] || '';
                  return (
                    <div key={m.id} className="glass-card glass-card-hover p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm" style={{ color: '#F5ECD7' }}>{m.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9a8f82' }}>{clientDesc}</p>
                          {techFeatures && reportView === 'technical' && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {techFeatures.split(',').map((feat, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-900 border border-neutral-800 text-[#F5ECD7] font-mono">
                                  ⚙️ {feat.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge ${cfg.cls}`}>{m.status}</span>
                          <span className="font-mono text-xs font-bold" style={{ color: '#DA7756' }}>W:{m.weight}%</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1" style={{ color: '#5a5248' }}>
                          <span className="font-mono">completion</span>
                          <span className="font-mono font-bold" style={{ color: m.completion >= 80 ? '#4ade80' : m.completion >= 40 ? '#fbbf24' : '#9a8f82' }}>
                            {m.completion}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: '#141210', border: '1px solid #2e2b26' }}>
                          <div className="progress-fill rounded-sm"
                            style={{
                              width:      `${m.completion}%`,
                              background: m.completion >= 80 ? '#4ade80' : m.completion >= 40 ? '#fbbf24' : '#DA7756',
                            }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latest report */}
            {latestReview && (() => {
              const summaryParts = latestReview.summary.split('\n---CLIENT_TRANSLATION---\n');
              const technicalReport = summaryParts[0] || '';
              const clientTranslation = summaryParts[1] || '';
              return (
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-2.5"
                    style={{ background: '#141210', borderBottom: '1px solid #2e2b26' }}>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4" style={{ color: '#DA7756' }} />
                      <span className="font-medium text-sm text-[#F5ECD7]">Review Reports</span>
                    </div>
                    {/* View Selector Tabs */}
                    <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-md border border-neutral-800 text-xs">
                      <button onClick={() => setReportView('client')}
                        className={`px-2.5 py-1 rounded transition-all font-medium ${reportView === 'client' ? 'bg-[#DA7756] text-[#0e0c0a] font-bold' : 'text-[#9a8f82] hover:text-[#F5ECD7]'}`}>
                        Client View (Simple)
                      </button>
                      <button onClick={() => setReportView('technical')}
                        className={`px-2.5 py-1 rounded transition-all font-medium ${reportView === 'technical' ? 'bg-[#DA7756] text-[#0e0c0a] font-bold' : 'text-[#9a8f82] hover:text-[#F5ECD7]'}`}>
                        Auditor View (Technical)
                      </button>
                    </div>
                    <span className="ml-auto badge badge-green">Confidence: {latestReview.confidence}%</span>
                  </div>
                  <div className="p-5 max-h-96 overflow-y-auto">
                    {reportView === 'client' && clientTranslation ? (
                      <div className="text-xs leading-relaxed space-y-3 prose prose-invert font-mono" style={{ color: '#9a8f82' }}>
                        {clientTranslation.split('\n').map((line, i) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={i} className="text-sm font-bold text-[#F5ECD7] mt-3 mb-1">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-sm font-extrabold text-[#F5ECD7] mt-4 mb-2">{line.replace('## ', '')}</h2>;
                          }
                          if (line.startsWith('# ')) {
                            return <h1 key={i} className="text-base font-black text-[#F5ECD7] mt-5 mb-3">{line.replace('# ', '')}</h1>;
                          }
                          if (line.startsWith('- ') || line.startsWith('* ')) {
                            return <li key={i} className="ml-4 list-disc text-[#9a8f82]">{line.substring(2)}</li>;
                          }
                          return <p key={i} className="my-1">{line}</p>;
                        })}
                      </div>
                    ) : (
                      <pre className="text-xs whitespace-pre-wrap leading-relaxed font-mono" style={{ color: '#9a8f82' }}>
                        {technicalReport || latestReview.summary}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Right: Evidence explorer ── */}
          <div className="space-y-4">
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3"
                style={{ background: '#141210', borderBottom: '1px solid #2e2b26' }}>
                <Cpu className="w-4 h-4" style={{ color: '#67e8f9' }} />
                <span className="font-medium text-sm" style={{ color: '#F5ECD7' }}>Evidence Explorer</span>
              </div>

              {Object.keys(parsedEvidence).length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#5a5248' }} />
                  <p className="text-xs font-mono" style={{ color: '#5a5248' }}>Run an AI audit to see code evidence</p>
                </div>
              ) : (
                <div className="p-3">
                  {/* Tabs */}
                  <div className="space-y-0.5 mb-3">
                    {Object.keys(parsedEvidence).map(title => {
                      const ev = parsedEvidence[title];
                      const isActive = selectedEv === title;
                      return (
                        <button key={title} onClick={() => setSelectedEv(title)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-xs transition-all"
                          style={{
                            color:      isActive ? '#DA7756' : '#9a8f82',
                            background: isActive ? 'rgba(218,119,86,0.08)' : 'transparent',
                            border:     `1px solid ${isActive ? 'rgba(218,119,86,0.2)' : 'transparent'}`,
                          }}>
                          <span className="truncate font-mono">{title}</span>
                          <span className={`badge flex-shrink-0 ml-1 ${ev.status === 'completed' ? 'badge-green' : ev.status === 'partial' ? 'badge-amber' : 'badge-orange'}`} style={{ fontSize: 9 }}>
                            {ev.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected evidence detail */}
                  {selectedEv && parsedEvidence[selectedEv] && (
                    <div className="space-y-3 pt-3" style={{ borderTop: '1px solid #2e2b26' }}>
                      <p className="text-xs leading-relaxed italic" style={{ color: '#9a8f82' }}>
                        "{parsedEvidence[selectedEv].reasoning}"
                      </p>

                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#67e8f9' }}>
                          <FileCode className="w-3 h-3" /> Verified Files
                        </p>
                        <div className="space-y-1">
                          {parsedEvidence[selectedEv].files.length === 0
                            ? <p className="text-xs font-mono" style={{ color: '#5a5248' }}>None found</p>
                            : parsedEvidence[selectedEv].files.map((f: string) => (
                              <div key={f} className="px-2 py-1 rounded text-xs font-mono truncate"
                                style={{ background: '#141210', border: '1px solid #2e2b26', color: '#e8d5b8' }}>
                                {f}
                              </div>
                            ))
                          }
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#DA7756' }}>
                          <GitCommit className="w-3 h-3" /> Commits
                        </p>
                        <div className="space-y-1">
                          {parsedEvidence[selectedEv].commits.length === 0
                            ? <p className="text-xs font-mono" style={{ color: '#5a5248' }}>None matched</p>
                            : parsedEvidence[selectedEv].commits.map((c: string) => (
                              <div key={c} className="px-2 py-1 rounded text-xs font-mono"
                                style={{ background: '#141210', border: '1px solid #2e2b26', color: '#9a8f82', wordBreak: 'break-all' }}>
                                {c}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer strip */}
            <div className="text-xs font-mono px-3 py-2 rounded"
              style={{ background: '#141210', border: '1px solid #201e1b', color: '#5a5248' }}>
              <span>milestones: <span style={{ color: '#DA7756' }}>{milestones.length}</span></span>
              {' · '}
              <span>reviews: <span style={{ color: '#4ade80' }}>{reviews.length}</span></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
