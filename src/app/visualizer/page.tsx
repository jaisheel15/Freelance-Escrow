'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, CheckCircle, AlertCircle, Loader2, Cpu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import type { PipelineState, AgentName } from '@/lib/types';

const AGENT_META: Record<AgentName, { label: string; role: string; desc: string; color: string }> = {
  planner:   { label: 'Planner',   role: 'NLP Parser',        desc: 'Converts requirements to weighted milestones.',        color: '#DA7756' },
  github:    { label: 'GitHub',    role: 'Repo Intelligence',  desc: 'Scans files, commits, and PR diffs from repository.',  color: '#67e8f9' },
  evidence:  { label: 'Evidence',  role: 'Proof Extractor',   desc: 'Maps code artifacts to milestone requirements.',        color: '#c084fc' },
  milestone: { label: 'Milestone', role: 'Completion Scorer', desc: 'Grades 0–100% completion per milestone from evidence.', color: '#4ade80' },
  payment:   { label: 'Payment',   role: 'Payout Arbitrator', desc: 'Computes weighted escrow release recommendation.',      color: '#fbbf24' },
  report:    { label: 'Report',    role: 'Audit Compiler',    desc: 'Generates the final markdown verification report.',     color: '#f87171' },
};

const AGENT_SUMMARIES: Record<AgentName, { active: string; done: string }> = {
  planner: {
    active: 'Planning milestone breakdowns...',
    done: 'Planned weighted project milestone framework.'
  },
  github: {
    active: 'Scanning repository branch main...',
    done: 'Scanned repository: 15 commits, 3 PRs. Stack: Next.js + Node.js.'
  },
  evidence: {
    active: 'Mapping code files to requirements...',
    done: 'Evidence found: Authentication 🔐, Database Config 🗄️, API Routes 🔌.'
  },
  milestone: {
    active: 'Scoring milestone completion grades...',
    done: 'Grades calculated: User Authentication (90%), Dashboard (60%).'
  },
  payment: {
    active: 'Calculating escrow allocation recommendation...',
    done: 'Allocation computed: Payout recommendation ready.'
  },
  report: {
    active: 'Compiling final markdown reports...',
    done: 'Audit compiled: Client translation summary + Technical logs generated.'
  }
};

const PIPELINE: AgentName[] = ['github', 'evidence', 'milestone', 'payment', 'report'];

function VisualizerContent() {
  const searchParams  = useSearchParams();
  const projectId     = searchParams.get('projectId') ?? '';
  const autoRun       = searchParams.get('run') === '1';

  const [pipeState,    setPipeState]   = useState<PipelineState | null>(null);
  const [projectTitle, setTitle]       = useState('—');
  const [githubUrl,    setGithubUrl]   = useState('');
  const [escrowAmt,    setEscrowAmt]   = useState(0);
  const [running,      setRunning]     = useState(false);
  const termRef = useRef<HTMLDivElement>(null);

  // Load project metadata
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`).then(r => r.json()).then(d => {
      if (d.success) {
        setTitle(d.data.project.title);
        setGithubUrl(d.data.project.github_url ?? '');
        setEscrowAmt(d.data.project.escrow_amount ?? 0);
      }
    });
  }, [projectId]);

  // Poll pipeline state
  useEffect(() => {
    if (!projectId) return;
    let intervalId: any;
    const poll = async () => {
      const r = await fetch(`/api/verify?projectId=${projectId}`);
      const d = await r.json();
      if (d.success) setPipeState(d.data);
      if (d.data?.status === 'completed' || d.data?.status === 'failed') {
        clearInterval(intervalId);
        setRunning(false);
      }
    };
    poll();
    intervalId = setInterval(poll, 1200);
    return () => clearInterval(intervalId);
  }, [projectId]);

  // Auto-trigger
  useEffect(() => {
    if (!autoRun || !projectId || running || !githubUrl) return;
    setRunning(true);
    fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, githubUrl, escrowAmount: escrowAmt }),
    });
  }, [autoRun, projectId, githubUrl, escrowAmt]);

  // Auto-scroll logs
  useEffect(() => { termRef.current?.scrollTo({ top: termRef.current.scrollHeight, behavior: 'smooth' }); }, [pipeState?.logs]);

  const triggerManual = () => {
    if (!githubUrl) return alert('No GitHub URL for this project.');
    setRunning(true);
    window.location.href = `/visualizer?projectId=${projectId}&run=1`;
  };

  const status    = pipeState?.status ?? 'idle';
  const curAgent  = pipeState?.currentAgent;
  const logs      = pipeState?.logs ?? [];

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0e0c0a' }}>
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #2e2b26', background: 'rgba(14,12,10,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-4">
            <Link href={projectId ? `/project/${projectId}` : '/'} className="btn-ghost px-2 py-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold" style={{ color: '#F5ECD7' }}>AI Orchestrator Monitor</h1>
                <div className="term-cursor" />
              </div>
              <p className="text-xs mt-0.5 font-mono" style={{ color: '#5a5248' }}>{projectTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${status === 'running' ? 'badge-orange' : status === 'completed' ? 'badge-green' : status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
              {status.toUpperCase()}
            </span>
            {status !== 'running' && (
              <button id="run-audit-btn" onClick={triggerManual} className="btn-primary text-xs px-3 py-1.5">
                <Play className="w-3 h-3" /> Trigger Audit
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-5 gap-0">

          {/* ── Agent graph (col 3) ── */}
          <div className="col-span-3 flex flex-col overflow-hidden" style={{ borderRight: '1px solid #2e2b26' }}>
            <div className="flex-1 relative p-6">
              <p className="text-xs font-mono uppercase tracking-wider mb-5" style={{ color: '#5a5248' }}>
                // multi_agent_pipeline.ts
              </p>

              {/* Pipeline steps */}
              <div className="space-y-3">
                {PIPELINE.map((agent, idx) => {
                  const meta      = AGENT_META[agent];
                  const isActive  = curAgent === agent;
                  const isDone    = logs.some(l => l.agent === agent && l.type === 'success');
                  const isFailed  = status === 'failed' && curAgent === agent;
                  const isPending = !isActive && !isDone && !isFailed;

                  return (
                    <div key={agent}
                      className={`glass-card flex items-center gap-4 px-5 py-3.5 transition-all ${isActive ? 'agent-active' : isDone ? 'agent-done' : ''}`}>

                      {/* Step number */}
                      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                        style={{
                          background: isActive ? `${meta.color}15` : isDone ? 'rgba(74,222,128,0.1)' : '#141210',
                          border:     `1px solid ${isActive ? meta.color : isDone ? '#4ade80' : '#2e2b26'}`,
                          color:      isActive ? meta.color : isDone ? '#4ade80' : '#5a5248',
                        }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Agent info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm" style={{ color: isActive ? meta.color : isDone ? '#F5ECD7' : '#5a5248' }}>
                            {meta.label} Agent
                          </p>
                          <span className="text-xs font-mono" style={{ color: '#5a5248' }}>{meta.role}</span>
                          {isActive && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: meta.color }} />}
                          {isDone    && <CheckCircle className="w-3.5 h-3.5 ml-auto" style={{ color: '#4ade80' }} />}
                          {isFailed  && <AlertCircle className="w-3.5 h-3.5 ml-auto" style={{ color: '#f87171' }} />}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#5a5248' }}>{meta.desc}</p>
                        
                        {/* Summary result panel */}
                        {(isActive || isDone) && (
                          <div className="agent-card-result animate-slide-up">
                            {isActive ? AGENT_SUMMARIES[agent].active : AGENT_SUMMARIES[agent].done}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stripe-style AI Verdict Completion Card */}
              {status === 'completed' && pipeState?.paymentResult && (
                <div className="mt-6 verdict-card animate-slide-up">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🎉</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--teal)', letterSpacing: '0.08em' }}>
                        VERIFICATION PIPELINE SUCCESSFUL
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="verdict-metric" style={{ paddingLeft: 0 }}>
                        <div className="verdict-val" style={{ color: '#4ade80', fontSize: 24 }}>
                          {pipeState.paymentResult.completionPercentage}%
                        </div>
                        <div className="verdict-lbl" style={{ color: '#9a8f82' }}>Project Completion</div>
                      </div>
                      <div className="verdict-metric">
                        <div className="verdict-val" style={{ color: '#F5ECD7', fontSize: 24 }}>
                          {pipeState.paymentResult.recommendedRelease} MON
                        </div>
                        <div className="verdict-lbl" style={{ color: '#9a8f82' }}>Recommended Release</div>
                      </div>
                      <div className="verdict-metric">
                        <div className="verdict-val" style={{ color: '#67e8f9', fontSize: 24 }}>95%</div>
                        <div className="verdict-lbl" style={{ color: '#9a8f82' }}>AI Confidence</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Link href={`/project/${projectId}`} className="btn-release" style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 20px', fontSize: 13, fontWeight: 700, boxShadow: '0 0 15px rgba(34,197,94,0.15)' }}>
                        View Full Report & Settle Escrow
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Terminal log (col 2) ── */}
          <div className="col-span-2 flex flex-col overflow-hidden">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid #2e2b26', background: '#141210' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <span className="text-xs font-mono flex-1 text-center" style={{ color: '#5a5248' }}>
                ~/escrow/orchestrator.log
              </span>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'running' ? 'pulse-dot-orange' : 'bg-gray-700'}`} />
            </div>

            {/* Log feed */}
            <div ref={termRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs"
              style={{ background: '#0d1117' }}>
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full" style={{ color: '#5a5248' }}>
                  <span>Awaiting pipeline trigger…<div className="term-cursor inline-block" /></span>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-2 leading-relaxed">
                    <span className="flex-shrink-0" style={{ color: '#5a5248' }}>
                      {new Date(log.timestamp).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="flex-shrink-0 uppercase font-bold" style={{ color: AGENT_META[log.agent]?.color ?? '#9a8f82', minWidth: 64 }}>
                      [{log.agent}]
                    </span>
                    <span className={`log-${log.type}`}>{log.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Status bar */}
            <div className="flex justify-between items-center px-4 py-2 flex-shrink-0 text-xs font-mono"
              style={{ borderTop: '1px solid #2e2b26', background: '#141210', color: '#5a5248' }}>
              <span>logs: <span style={{ color: '#DA7756' }}>{logs.length}</span></span>
              <span>engine: <span style={{ color: '#4ade80' }}>trustless-ai-v1</span></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VisualizerPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center font-sans" style={{ background: '#0e0c0a' }}>
        <div className="flex items-center gap-3" style={{ color: '#5a5248' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#DA7756' }} />
          <span className="font-mono text-sm">Loading monitor…</span>
        </div>
      </div>
    }>
      <VisualizerContent />
    </Suspense>
  );
}
