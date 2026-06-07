/**
 * krow shared UI components
 * Used across all pages for consistent design language
 */
'use client';

import { useRef, useEffect } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, XCircle, Banknote,
  ShieldCheck, FileText, Wallet, Flag, Bot, Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────
//  STATUS BADGE
// ─────────────────────────────────────────────

type StatusKey =
  | 'Pending' | 'Queued' | 'Running' | 'Approved' | 'Rejected'
  | 'Paid' | 'In Review' | 'Released' | 'Funded' | 'Created'
  | 'Refunded' | 'Completed' | 'Mostly Complete' | 'Partial'
  | 'Not Started' | 'failed' | 'completed' | 'running' | 'idle';

const STATUS_MAP: Record<StatusKey, { icon: React.ElementType; cls: string; label: string }> = {
  Pending:          { icon: Clock,         cls: 'badge badge-gray',   label: 'Pending'        },
  Queued:           { icon: Clock,         cls: 'badge badge-gray',   label: 'Queued'         },
  Running:          { icon: Loader2,       cls: 'badge badge-sand',   label: 'Running'        },
  running:          { icon: Loader2,       cls: 'badge badge-sand',   label: 'Running'        },
  Approved:         { icon: CheckCircle,   cls: 'badge badge-green',  label: 'Approved'       },
  Rejected:         { icon: XCircle,       cls: 'badge badge-red',    label: 'Rejected'       },
  Paid:             { icon: Banknote,      cls: 'badge badge-green',  label: 'Paid'           },
  'In Review':      { icon: ShieldCheck,   cls: 'badge badge-sand',   label: 'In Review'      },
  Released:         { icon: CheckCircle,   cls: 'badge badge-green',  label: 'Paid Out'       },
  Funded:           { icon: Wallet,        cls: 'badge badge-sand',   label: 'In Review'      },
  Created:          { icon: FileText,      cls: 'badge badge-gray',   label: 'Pending'        },
  Refunded:         { icon: XCircle,       cls: 'badge badge-red',    label: 'Refunded'       },
  Completed:        { icon: CheckCircle,   cls: 'badge badge-green',  label: 'Verified'       },
  'Mostly Complete':{ icon: ShieldCheck,   cls: 'badge badge-sand',   label: 'Mostly Done'    },
  Partial:          { icon: AlertTriangle, cls: 'badge badge-amber',  label: 'Partial'        },
  'Not Started':    { icon: Clock,         cls: 'badge badge-gray',   label: 'Not Started'    },
  failed:           { icon: XCircle,       cls: 'badge badge-red',    label: 'Failed'         },
  completed:        { icon: CheckCircle,   cls: 'badge badge-green',  label: 'Complete'       },
  idle:             { icon: Clock,         cls: 'badge badge-gray',   label: 'Idle'           },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusKey] ?? { icon: Clock, cls: 'badge badge-gray', label: status };
  const Icon = s.icon;
  return (
    <span className={s.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────
//  SCORE RING
// ─────────────────────────────────────────────

function scoreColor(score: number) {
  if (score === 0) return 'var(--border)';
  if (score >= 80)  return 'var(--success)';
  if (score >= 50)  return 'var(--sand)';
  return 'var(--warning)';
}

export function ScoreRing({ score, size = 84, strokeWidth = 7, showLabel = true }: {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dash = (score / 100) * circ;
    setTimeout(() => { if (ref.current) ref.current.style.strokeDasharray = `${dash} ${circ}`; }, 80);
  }, [score, circ]);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} style={{ opacity: 0.4 }} />
        <circle ref={ref} cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={`0 ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      {showLabel && (
        <div className="ring-label">
          <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: Math.round(size * 0.26), fontWeight: 800, color, lineHeight: 1 }}>
            {score === 0 ? '—' : score}
          </span>
          {score > 0 && <span style={{ fontSize: Math.round(size * 0.15), color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: 1, marginLeft: 1 }}>%</span>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  KPI CARD
// ─────────────────────────────────────────────

export function KpiCard({ icon, label, value, sub, accent, featured }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  featured?: boolean;
}) {
  return (
    <div 
      className={`stat-card card-elevated ${featured ? 'kpi-featured' : ''}`} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        gridColumn: featured ? 'span 2' : 'span 1',
        padding: featured ? '26px 28px' : '22px 24px',
        background: featured ? 'linear-gradient(135deg, var(--bg-card) 0%, var(--sand-soft) 100%)' : 'var(--bg-card)',
        border: featured ? '2px solid var(--sand)' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: featured ? 144 : 'auto',
      }}
    >
      {/* Accent bar or glow */}
      {accent && !featured && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '12px 12px 0 0' }} />}
      {featured && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--sand)' }} />}
      
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: featured ? 14 : 10 }}>
          <div style={{ 
            width: featured ? 38 : 34, 
            height: featured ? 38 : 34, 
            borderRadius: 9, 
            background: featured ? 'var(--sand-soft)' : 'var(--bg-alt)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: featured ? 'var(--accent)' : (accent ?? 'var(--accent)'), 
            flexShrink: 0, 
            border: '1px solid var(--border)' 
          }}>
            {icon}
          </div>
          <span className="stat-label" style={{ 
            margin: 0, 
            fontSize: featured ? 12 : 11, 
            letterSpacing: '0.04em', 
            fontWeight: 700,
            textTransform: 'uppercase',
            color: featured ? 'var(--accent)' : 'var(--subtle)'
          }}>{label}</span>
        </div>
        <div className="stat-val" style={{ 
          fontSize: featured ? 42 : 32, 
          fontWeight: 900,
          marginBottom: sub ? (featured ? 6 : 4) : 0,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--text)'
        }}>{value}</div>
      </div>
      {sub && <div className="stat-sub" style={{ fontSize: featured ? 13 : 12, color: 'var(--muted)', fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SKELETON CARD
// ─────────────────────────────────────────────

export function SkeletonCard({ height = 100 }: { height?: number }) {
  return <div className="shimmer" style={{ height, borderRadius: 12, marginBottom: 10 }} />;
}

export function SkeletonKpi() {
  return (
    <div className="stat-card card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="shimmer" style={{ height: 34, borderRadius: 9, width: 34 }} />
      <div className="shimmer" style={{ height: 12, borderRadius: 6, width: '60%' }} />
      <div className="shimmer" style={{ height: 28, borderRadius: 6, width: '80%' }} />
      <div className="shimmer" style={{ height: 11, borderRadius: 5, width: '50%' }} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: '56px 40px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', border: '1px solid var(--border)' }}>
        <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
      </div>
      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{title}</h3>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>{description}</p>
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CONFIDENCE BADGE
// ─────────────────────────────────────────────

export function ConfidenceBadge({ score }: { score: number }) {
  const level = score >= 85 ? 'High' : score >= 60 ? 'Medium' : 'Low';
  const cls   = score >= 85 ? 'badge badge-green' : score >= 60 ? 'badge badge-amber' : 'badge badge-red';
  return (
    <span className={cls}>
      <ShieldCheck className="w-3 h-3" />
      {level} Confidence {score}%
    </span>
  );
}

// ─────────────────────────────────────────────
//  RISK BADGE
// ─────────────────────────────────────────────

export function RiskBadge({ score }: { score: number }) {
  const risk  = score >= 80 ? 'Low Risk' : score >= 50 ? 'Medium Risk' : 'High Risk';
  const cls   = score >= 80 ? 'badge badge-green' : score >= 50 ? 'badge badge-amber' : 'badge badge-red';
  const Icon  = score >= 80 ? CheckCircle : score >= 50 ? AlertTriangle : XCircle;
  return (
    <span className={cls}>
      <Icon className="w-3 h-3" />
      {risk}
    </span>
  );
}

// ─────────────────────────────────────────────
//  VERDICT BANNER
// ─────────────────────────────────────────────

export function VerdictBanner({ approved, score, amount }: { approved: boolean; score: number; amount: string }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderRadius: 12,
      border: `1px solid ${approved ? 'var(--success-border)' : 'var(--error-border)'}`,
      background: approved ? 'var(--success-soft)' : 'var(--error-soft)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: approved ? 'var(--success-soft)' : 'var(--error-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {approved
          ? <CheckCircle className="w-6 h-6" style={{ color: 'var(--success-icon)' }} />
          : <XCircle    className="w-6 h-6" style={{ color: 'var(--error-icon)' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
          AI Verdict: {approved ? 'Approved for Release' : 'Insufficient Evidence'}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--muted)' }}>
          {score}% completion verified · {amount} recommended for release
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ConfidenceBadge score={score} />
        <RiskBadge score={score} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SECTION HEADER
// ─────────────────────────────────────────────

export function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {eyebrow && <div className="sect-label" style={{ marginBottom: 5 }}>{eyebrow}</div>}
      <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: sub ? 6 : 0 }}>{title}</h2>
      {sub && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  PROGRESS BAR
// ─────────────────────────────────────────────

export function ProgressBar({ value, color, label }: { value: number; color?: string; label?: string }) {
  const c = color ?? (value >= 80 ? 'var(--success)' : value >= 50 ? 'var(--sand)' : 'var(--warning)');
  return (
    <div>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, fontFamily: 'Inter, sans-serif', color: 'var(--muted)' }}>
        <span>{label}</span><span style={{ fontWeight: 600, color: c }}>{value}%</span>
      </div>}
      <div className="prog-track" style={{ height: 5 }}>
        <div className="prog-fill" style={{ width: `${value}%`, background: c }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  INLINE INFO ROW
// ─────────────────────────────────────────────

export function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: 'var(--subtle)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: mono ? '"JetBrains Mono", monospace' : '"Playfair Display", Georgia, serif', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
