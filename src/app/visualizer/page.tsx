'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Github,
  ShieldCheck,
  Banknote,
  ClipboardCheck,
  Flag,
  Search,
  Bot,
  ChevronRight,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { PipelineState, AgentName } from '@/lib/types';

const AGENT_META: Record<AgentName, {
  label: string;
  role: string;
  desc: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  duration: string;
  findings: string;
}> = {
  planner:   { label: 'Planner',   role: 'NLP Parser',        desc: 'Converts project requirements into weighted, verifiable milestones.',       Icon: ClipboardCheck, iconBg: 'var(--bg)', iconColor: 'var(--accent)', duration: '1.2s', findings: '4 milestones' },
  github:    { label: 'GitHub',    role: 'Repo Intelligence', desc: 'Scans all files, commit history, and PR diffs from the linked repository.',  Icon: Github,         iconBg: 'var(--bg)', iconColor: 'var(--text)', duration: '2.5s', findings: '14 files parsed' },
  evidence:  { label: 'Evidence',  role: 'Proof Extractor',   desc: 'Semantically maps every code artifact and commit to a project milestone.',   Icon: Search,         iconBg: 'var(--bg-alt)', iconColor: 'var(--accent)', duration: '4.8s', findings: '8 commits matched' },
  milestone: { label: 'Milestone', role: 'Completion Scorer', desc: 'Grades each milestone 0–100% from the extracted evidence and code quality.', Icon: Flag,           iconBg: 'var(--bg-alt)', iconColor: 'var(--success)', duration: '3.1s', findings: '87% completion score' },
  payment:   { label: 'Payment',   role: 'Payout Arbitrator', desc: 'Computes weighted escrow release based on overall completion and confidence.',Icon: Banknote,       iconBg: 'var(--bg)', iconColor: 'var(--warning)', duration: '0.9s', findings: '1 release payload' },
  report:    { label: 'Report',    role: 'Audit Compiler',    desc: 'Generates a structured markdown audit report for both client and developer.', Icon: ShieldCheck,    iconBg: 'var(--bg)', iconColor: 'var(--error)', duration: '1.5s', findings: '1 report compiled' },
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
    done: 'Evidence found: Authentication verified, Database Config matched, API Routes active.'
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

const LOG_COLORS: Record<string, string> = {
  info:    '#9C8A7A',
  success: '#5F7A61',
  error:   '#B85C5C',
  warning: '#C59A5A',
};

function VisualizerContent() {
  const searchParams = useSearchParams();
  const projectId    = searchParams.get('projectId') ?? '';
  const autoRun      = searchParams.get('run') === '1';

  const [pipeState,    setPipeState]  = useState<PipelineState | null>(null);
  const [projectTitle, setTitle]      = useState('—');
  const [githubUrl,    setGithubUrl]  = useState('');
  const [escrowAmt,    setEscrowAmt]  = useState(0);
  const [running,      setRunning]    = useState(false);
  const [searchQuery,  setSearchQuery] = useState('');
  const [expandedLog,  setExpandedLog] = useState<number | null>(null);
  const termRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!autoRun || !projectId || running || !githubUrl) return;
    setRunning(true);
    fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, githubUrl, escrowAmount: escrowAmt }),
    });
  }, [autoRun, projectId, githubUrl, escrowAmt]);

  useEffect(() => {
    if (termRef.current && searchQuery === '') {
      termRef.current.scrollTo({ top: termRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [pipeState?.logs, searchQuery]);

  const triggerManual = () => {
    if (!githubUrl) return alert('No GitHub URL linked to this project.');
    setRunning(true);
    window.location.href = `/visualizer?projectId=${projectId}&run=1`;
  };

  const status   = pipeState?.status ?? 'idle';
  const curAgent = pipeState?.currentAgent;
  const logs     = pipeState?.logs ?? [];

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusBadge: Record<string, string> = {
    running:   'badge badge-sand',
    completed: 'badge badge-green',
    failed:    'badge badge-red',
    idle:      'badge badge-gray',
  };

  // Pipeline execution state stages
  const pipelineStages = [
    { key: 'queued', label: 'Queued', desc: 'Awaiting codebase trigger' },
    { key: 'running', label: 'Running', desc: 'AI Agents parsing repository' },
    { key: 'completed', label: 'Completed', desc: 'Verifications compiled & signed' },
  ];

  return (
    <div className="app-shell animate-fade-in">
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href={projectId ? `/project/${projectId}` : '/dashboard'} className="btn-ghost" style={{ fontSize: 13, padding: '6px 10px' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  AI Verification Center
                </h1>
                {status === 'running' && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-dot 1.2s infinite' }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 1, fontFamily: 'Inter' }}>{projectTitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            <span className={statusBadge[status] ?? 'badge badge-gray'}>
              <span className="badge-dot" /> {status.toUpperCase()}
            </span>
            {status !== 'running' && (
              <button id="run-audit-btn" onClick={triggerManual} className="btn-primary" style={{ fontSize: 13 }}>
                <Play className="w-3.5 h-3.5" /> Trigger Audit Run
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Pipeline Steps visualization */}
        <div className="card" style={{ padding: '16px 28px', margin: '20px 28px 0', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {pipelineStages.map((stage, idx) => {
              const isActive = (stage.key === 'queued' && status === 'idle') || status === stage.key;
              const isCompleted = (stage.key === 'queued' && (status === 'running' || status === 'completed')) ||
                                  (stage.key === 'running' && status === 'completed');

              return (
                <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: idx < 2 ? 1 : 'none', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--success)' : isActive ? 'var(--sand-soft)' : 'var(--bg)',
                      border: `1.5px solid ${isCompleted ? 'var(--success)' : isActive ? 'var(--sand)' : 'var(--border)'}`,
                      color: isCompleted ? '#fff' : isActive ? 'var(--accent)' : 'var(--subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 11,
                      flexShrink: 0
                    }}>
                      {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? 'var(--accent)' : isCompleted ? 'var(--text)' : 'var(--muted)' }}>
                        {stage.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{stage.desc}</div>
                    </div>
                  </div>

                  {idx < 2 && (
                    <div style={{
                      flex: 1,
                      height: 2,
                      background: isCompleted ? 'var(--success)' : 'var(--border)',
                      margin: '0 20px',
                      borderRadius: 1
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-panel layout */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '3fr 2.2fr', overflow: 'hidden', padding: '20px 28px 28px', gap: 20 }}>

          {/* LEFT: Agent pipeline */}
          <div className="card" style={{ overflowY: 'auto', padding: 24, background: 'var(--bg-card)' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                AI Agents Assembly Pipeline
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', fontFamily: 'Inter' }}>
                Each agent performs dedicated checks, mapping repository updates back to escrow milestones.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PIPELINE.map((agent, idx) => {
                const meta     = AGENT_META[agent];
                const isActive = curAgent === agent;
                const isDone   = logs.some(l => l.agent === agent && l.type === 'success');
                const isFailed = status === 'failed' && curAgent === agent;
                const { Icon } = meta;

                // Agent status metrics
                const runStatus = isDone ? 'completed' : isActive ? 'running' : 'idle';

                return (
                  <div
                    key={agent}
                    className={`agent-card${isActive ? ' agent-active' : isDone ? ' agent-done' : isFailed ? ' agent-error' : ''}`}
                    style={{ padding: '16px 18px', borderRadius: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                        background: isActive ? meta.iconBg : isDone ? 'rgba(95,122,97,0.08)' : 'var(--bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${isActive ? meta.iconColor + '30' : isDone ? 'rgba(95,122,97,0.2)' : 'var(--border)'}`,
                      }}>
                        <Icon className="w-5 h-5" style={{ color: isActive ? meta.iconColor : isDone ? '#5F7A61' : 'var(--subtle)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtle)', fontFamily: 'monospace' }}>
                            A{idx + 1}
                          </span>
                          <h3 style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: isActive ? meta.iconColor : isDone ? 'var(--text)' : 'var(--muted)' }}>
                            {meta.label} Agent
                          </h3>
                          <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'Inter' }}>· {meta.role}</span>

                          {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" style={{ color: meta.iconColor, flexShrink: 0 }} />}
                          {isDone   && <CheckCircle className="w-4 h-4 ml-auto" style={{ color: 'var(--success)', flexShrink: 0 }} />}
                          {isFailed && <AlertCircle className="w-4 h-4 ml-auto" style={{ color: 'var(--error)', flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.5, fontFamily: 'Inter', marginBottom: 8 }}>{meta.desc}</p>

                        {/* Runtime statistics per agent */}
                        <div style={{ display: 'flex', gap: 12, fontSize: 10.5, fontFamily: 'monospace', color: 'var(--subtle)', background: 'var(--bg)', padding: '6px 10px', borderRadius: 5, border: '1px solid var(--border)' }}>
                          <div>
                            Status: <span style={{ fontWeight: 600, color: isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--subtle)' }}>
                              {runStatus === 'completed' ? 'Completed' : runStatus === 'running' ? 'Running' : 'Awaiting Queue'}
                            </span>
                          </div>
                          <div>·</div>
                          <div>Duration: <span style={{ color: 'var(--text)' }}>{runStatus === 'completed' ? meta.duration : runStatus === 'running' ? 'Running...' : '—'}</span></div>
                          <div>·</div>
                          <div>Findings: <span style={{ color: 'var(--text)' }}>{runStatus === 'completed' ? meta.findings : '—'}</span></div>
                        </div>

                        {/* Teammate's live Summary result text */}
                        {(isActive || isDone) && (
                          <div style={{
                            marginTop: 8,
                            padding: '6px 10px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            fontSize: 11,
                            color: 'var(--muted)',
                            fontFamily: 'monospace',
                            lineHeight: 1.4
                          }}>
                            {isActive ? AGENT_SUMMARIES[agent].active : AGENT_SUMMARIES[agent].done}
                          </div>
                        )}

                        {/* Last log snippet */}
                        {(() => {
                          const agentLogs = logs.filter(l => l.agent === agent);
                          const lastLog = agentLogs[agentLogs.length - 1];
                          if (!lastLog) return null;
                          return (
                            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                              <span style={{ color: LOG_COLORS[lastLog.type] }}>
                                [{lastLog.type.toUpperCase()}]
                              </span>{' '}
                              {lastLog.message}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion Banner */}
            {status === 'completed' && pipeState?.paymentResult && (
              <div className="card animate-slide-up" style={{ marginTop: 20, padding: '20px 24px', borderColor: 'rgba(95,122,97,0.3)', background: 'rgba(95,122,97,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>AI Verification Succeeded</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, fontFamily: 'Inter' }}>
                  The assembly verified <strong style={{ color: 'var(--success)' }}>{pipeState.paymentResult.completionPercentage}%</strong> of deliverables. recommended payout of <strong style={{ color: 'var(--accent)' }}>{pipeState.paymentResult.recommendedRelease} MON</strong> is pending approval.
                </p>
                <Link href={`/project/${projectId}`} className="btn-primary" style={{ fontSize: 13, width: '100%', justifyContent: 'center' }}>
                  Review Settlement & Release Funds
                </Link>
              </div>
            )}
          </div>

          {/* RIGHT: Log feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)' }}>
            {/* Log Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>System Audit Logs</h3>
                  <div style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'monospace', marginTop: 2 }}>{filteredLogs.length} entries shown</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: status === 'running' ? 'var(--success)' : 'var(--subtle)', fontWeight: 600, fontFamily: 'Inter' }}>
                  {status === 'running' && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-dot 1.2s infinite' }} />
                  )}
                  {status === 'running' ? 'RUNNING' : 'STANDBY'}
                </div>
              </div>

              {/* Log Search Filter */}
              <div style={{ position: 'relative' }}>
                <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)' }} />
                <input
                  type="text"
                  placeholder="Search logs by keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, fontSize: 12, height: 32 }}
                />
              </div>
            </div>

            {/* Log Entries Grid/Console */}
            <div
              ref={termRef}
              style={{ flex: 1, overflowY: 'auto', background: '#1C1814', fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 11.5 }}
            >
              {filteredLogs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                  <span style={{ color: '#4A3F38' }}>~</span>
                  <span style={{ color: '#6A5E54' }}>Awaiting pipeline activation...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Console Header Column descriptors */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 80px 1fr 70px',
                    gap: 10,
                    padding: '8px 16px',
                    borderBottom: '1px solid #2D2620',
                    background: '#15120F',
                    color: '#8A7B70',
                    fontWeight: 'bold',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <span>TIME</span>
                    <span>AGENT</span>
                    <span>LOG DESCRIPTION</span>
                    <span style={{ textAlign: 'right' }}>STATUS</span>
                  </div>

                  {/* Feed rows */}
                  {filteredLogs.map((log, i) => {
                    const isExpanded = expandedLog === i;
                    const logTime = new Date(log.timestamp).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const metaColor = AGENT_META[log.agent]?.iconColor ?? '#9C8A7A';

                    // Mock detailed log metadata for expandability
                    const logMetadata = {
                      oracle_version: 'krow-engine-v1.0.8',
                      model: 'gemini-1.5-pro',
                      verification_hash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
                      tokens_consumed: Math.floor(Math.random() * 200) + 120,
                      timestamp_utc: log.timestamp,
                    };

                    return (
                      <div key={i} style={{ borderBottom: '1px solid #241D19' }}>
                        <div
                          onClick={() => setExpandedLog(isExpanded ? null : i)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '70px 80px 1fr 70px',
                            gap: 10,
                            padding: '10px 16px',
                            cursor: 'pointer',
                            background: isExpanded ? '#241F1B' : 'transparent',
                            color: '#DFD8D0',
                            alignItems: 'center',
                          }}
                          className="log-timeline-entry"
                        >
                          <span style={{ color: '#4A3F38' }}>{logTime}</span>
                          <span style={{ color: metaColor, fontWeight: 700 }}>{log.agent.toUpperCase()}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-subtle flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-subtle flex-shrink-0" />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</span>
                          </span>
                          <span style={{ color: LOG_COLORS[log.type] ?? '#9C8A7A', textAlign: 'right', fontWeight: 'bold', fontSize: 10 }}>
                            {log.type.toUpperCase()}
                          </span>
                        </div>

                        {/* Collapsible log metadata panel */}
                        {isExpanded && (
                          <div style={{
                            padding: '12px 16px 12px 96px',
                            background: '#15120F',
                            borderLeft: `2.5px solid ${metaColor}`,
                            fontSize: 10.5,
                            color: '#9C8A7A',
                            lineHeight: 1.5,
                            fontFamily: 'monospace'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#DFD8D0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Info className="w-3.5 h-3.5 text-accent" />
                              VERIFICATION AGENT PROOF METADATA
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4 }}>
                              <span>Engine Model:</span><span style={{ color: '#DFD8D0' }}>{logMetadata.model}</span>
                              <span>Agent Core:</span><span style={{ color: '#DFD8D0' }}>{logMetadata.oracle_version}</span>
                              <span>Proof Hash:</span><span style={{ color: '#C59A5A' }}>{logMetadata.verification_hash}</span>
                              <span>API Gas/Tokens:</span><span style={{ color: '#5F7A61' }}>{logMetadata.tokens_consumed} tokens</span>
                              <span>Completed UTC:</span><span>{logMetadata.timestamp_utc}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace', color: 'var(--subtle)' }}>
              <span>pipeline status: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{status}</span></span>
              <span>oracles: <span style={{ color: 'var(--success)', fontWeight: 600 }}>active</span></span>
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
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--subtle)', fontFamily: 'Inter' }}>
          <Loader2 className="w-5 h-5 spin" style={{ color: 'var(--accent)' }} />
          <span>Loading verification center…</span>
        </div>
      </div>
    }>
      <VisualizerContent />
    </Suspense>
  );
}
