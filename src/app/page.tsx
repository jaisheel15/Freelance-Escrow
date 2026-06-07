'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ArrowRight,
  ShieldCheck,
  Banknote,
  CheckCircle,
  XCircle,
  Lock,
  Zap,
  Flag,
  Search,
  ClipboardCheck,
  Github,
  Bot,
  ChevronRight,
  User,
} from 'lucide-react';

// ── Scroll fade-in ────────────────────────────────────────────────────────────
function FadeSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: 0, transform: 'translateY(18px)', transition: 'opacity 0.7s ease, transform 0.7s ease', ...style }}>
      {children}
    </div>
  );
}

// ── Animated score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const size = 72, sw = 4, r = (size - sw * 2) / 2, circ = 2 * Math.PI * r;
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.strokeDasharray = `${(score / 100) * circ} ${circ}`; }, 600);
    return () => clearTimeout(t);
  }, [score, circ]);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 7px' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE5DB" strokeWidth={sw} />
          <circle ref={ref} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round" strokeDasharray={`0 ${circ}`}
            style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 700, color }}>{score}%</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#9C8A7A', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{label}</div>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const AGENTS = [
  { icon: Github, label: 'GitHub Agent', role: 'Repo Intelligence', desc: 'Scans all files, commits, and PR diffs from the linked repository.', bg: 'var(--bg)', color: 'var(--text)' },
  { icon: Search, label: 'Evidence Agent', role: 'Proof Extractor', desc: 'Semantically maps every code artifact to a project milestone.', bg: 'var(--bg-alt)', color: 'var(--accent)' },
  { icon: Flag, label: 'Milestone Agent', role: 'Completion Scorer', desc: 'Grades each milestone 0–100% from the extracted evidence.', bg: 'var(--bg-alt)', color: 'var(--success)' },
  { icon: ShieldCheck, label: 'Verify Agent', role: 'Quality Auditor', desc: 'Cross-checks code quality against the original contract requirements.', bg: 'var(--bg)', color: 'var(--accent)' },
  { icon: ClipboardCheck, label: 'Report Agent', role: 'Audit Compiler', desc: 'Generates a structured markdown report for both client and developer.', bg: 'var(--bg)', color: 'var(--error)' },
  { icon: Banknote, label: 'Payment Agent', role: 'Payout Arbitrator', desc: 'Computes the weighted escrow release and stages smart contract execution.', bg: 'var(--bg-alt)', color: 'var(--warning)' },
];

const PROBLEMS = ['Manual subjective reviews', 'Disputes lasting weeks', 'Delayed, withheld payments', 'Human bias & favoritism', 'No objective evidence trail'];
const SOLUTIONS = ['AI-verified GitHub analysis', 'Automated resolution in minutes', 'Instant smart contract payout', 'Objective, immutable code evidence', '6-agent verifiable audit trail'];

const STEPS = [
  { n: '01', title: 'Client Creates Contract', sub: 'Defines project requirements and locks MON into an on-chain escrow smart contract.', icon: Lock, color: 'var(--accent)', bg: 'var(--bg-alt)' },
  { n: '02', title: 'Developer Builds', sub: 'Writes code, opens a GitHub Pull Request, and submits the repository to krow.', icon: Github, color: 'var(--text)', bg: 'var(--bg)' },
  { n: '03', title: '6-Agent Orchestra', sub: 'Repository analysis, requirement matching, milestone scoring, audit report.', icon: Bot, color: 'var(--accent)', bg: 'var(--bg-alt)' },
  { n: '04', title: 'Funds Released', sub: 'AI verdict triggers the escrow smart contract. Developer is paid automatically.', icon: Banknote, color: 'var(--success)', bg: 'var(--bg-alt)' },
];

const MONAD_STATS = [
  { val: '10,000', unit: ' TPS', desc: 'Transactions per second' },
  { val: '1s', unit: '', desc: 'Block finality time' },
  { val: '< $0.01', unit: '', desc: 'Per transaction cost' },
  { val: '100%', unit: '', desc: 'EVM compatible' },
];

const TRUST_BAR = ['Monad', 'GitHub', 'OpenAI', 'Next.js', 'Viem', 'Tailwind CSS'];

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const h = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // ── inline hover helpers ──────────────────────────────────────────────────
  const navLink = (label: string) => (
    <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`}
      style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
      {label}
    </a>
  );

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased', transition: 'background-color 0.3s ease, color 0.3s ease' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navScrolled ? 'var(--topbar-bg)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(16px)' : 'none',
        borderBottom: navScrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--text)', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M4 2.5V15.5M4 9L13.5 2.5M4 9L13.5 15.5" stroke="var(--bg-card)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: 19, letterSpacing: '-0.03em', color: 'var(--text)' }}>krow</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {['How It Works', 'Features', 'Verification'].map(navLink)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <a href="https://github.com" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', textDecoration: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sand)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
            <Github className="w-4 h-4" /> GitHub
          </a>
          <Link href="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', textDecoration: 'none', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Launch App
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 130, paddingBottom: 90, paddingLeft: 40, paddingRight: 40, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

          {/* Left */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: 30 }}>
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>Built on Monad · 6-Agent AI Orchestra</span>
            </div>

            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 54, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 24 }}>
              Freelance Payments.<br />
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Verified by AI.</em><br />
              Released Automatically.
            </h1>

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 38, maxWidth: 480 }}>
              Stop disputes, delays, and subjective reviews. krow uses a 6-Agent AI Orchestra to verify GitHub pull requests and automatically release escrowed funds on Monad.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 42 }}>
              <Link href="/dashboard"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 10, background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--btn-primary-shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                Launch App <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/visualizer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 10, background: 'transparent', color: 'var(--muted)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, border: '1px solid var(--border)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sand)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-alt)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}>
                View Demo
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: 'var(--subtle)', fontFamily: 'Inter, sans-serif' }}>
              {[
                { icon: <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />, text: 'Smart contract escrow' },
                { icon: <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />, text: 'AI-verified milestones' },
                { icon: <Zap className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />, text: 'Instant settlement' },
              ].map((f, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{f.icon} {f.text}</span>
              ))}
            </div>
          </div>

          {/* Right — Workflow card */}
          <div style={{ position: 'relative' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'none' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 22 }}>
                Escrow Workflow
              </div>

              {[
                { icon: <User className="w-4 h-4" />, label: 'Client', sub: 'Creates contract', badge: 'Step 1', bc: 'var(--sand-soft)', bt: 'var(--accent)', done: true },
                { icon: <Lock className="w-4 h-4" />, label: 'Escrow Locked', sub: '2,000 MON on Monad', badge: 'Funded', bc: 'var(--sand-soft)', bt: 'var(--accent)', done: true },
                { icon: <Github className="w-4 h-4" />, label: 'Pull Request Submitted', sub: 'github.com/user/repo #42', badge: 'PR #42', bc: 'var(--bg)', bt: 'var(--muted)', done: true },
                { icon: <Bot className="w-4 h-4" />, label: 'AI Verification', sub: '6 agents analyzing…', badge: 'Live', bc: 'var(--warning-soft)', bt: 'var(--warning)', done: false, active: true },
                { icon: <Banknote className="w-4 h-4" />, label: 'Payment Released', sub: '1,840 MON → developer', badge: 'Pending', bc: 'var(--success-soft)', bt: 'var(--success)', done: false },
              ].map((step, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: step.done ? 'var(--bg-alt)' : step.active ? 'var(--warning-soft)' : 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.done ? 'var(--accent)' : step.active ? 'var(--warning)' : 'var(--subtle)', flexShrink: 0 }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, fontWeight: 600, color: step.done ? 'var(--text)' : step.active ? 'var(--text)' : 'var(--subtle)', marginBottom: 2 }}>{step.label}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: step.done ? 'var(--muted)' : step.active ? 'var(--warning)' : 'var(--border)' }}>{step.sub}</div>
                    </div>
                    <div style={{ padding: '3px 10px', borderRadius: 100, background: step.bc, border: `1px solid ${step.bt}30`, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: step.bt, flexShrink: 0 }}>
                      {step.badge}
                    </div>
                  </div>
                  {i < 4 && <div style={{ marginLeft: 19, width: 1, height: 10, background: 'var(--border)' }} />}
                </div>
              ))}
            </div>

            {/* Score float card */}
            <div style={{ position: 'absolute', bottom: -22, right: -22, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', boxShadow: 'none', minWidth: 170 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>AI Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--success)', lineHeight: 1 }}>92</div>
                <div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>% Complete</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Approved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section style={{ padding: '32px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--subtle)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>Built With</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 44, flexWrap: 'wrap' }}>
            {TRUST_BAR.map(b => (
              <span key={b} style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: 'var(--subtle)', letterSpacing: '-0.02em', transition: 'color 0.15s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--subtle)')}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 40px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>The Problem</p>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 18 }}>
                Freelance payments still<br />rely on trust.
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: 'var(--muted)', maxWidth: 460, margin: '0 auto' }}>
                Every platform has the same issue — subjective judgements delay and block payments that developers have earned.
              </p>
            </div>
          </FadeSection>

          <FadeSection>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Traditional */}
              <div style={{ background: 'var(--error-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--error-soft)', border: '1px solid var(--error-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
                    <XCircle className="w-5 h-5" />
                  </div>
                  <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--error)' }}>Traditional Platforms</span>
                </div>
                {PROBLEMS.map((p, i) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'var(--text)', padding: '6px 0', borderBottom: i < PROBLEMS.length - 1 ? '1px solid var(--error-border)' : 'none' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--error-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: 'var(--error)', fontWeight: 700 }}>✕</div>
                    {p}
                  </div>
                ))}
              </div>

              {/* krow */}
              <div style={{ background: 'var(--success-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--success-soft)', border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>krow</span>
                </div>
                {SOLUTIONS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: 'var(--text)', padding: '6px 0', borderBottom: i < SOLUTIONS.length - 1 ? '1px solid var(--success-border)' : 'none' }}>
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)', flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '90px 40px', background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>How It Works</p>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                From Commit to Payout.
              </h2>
            </div>
          </FadeSection>

          <FadeSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 20px', position: 'relative', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--btn-primary-shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: step.bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 30, fontWeight: 900, color: 'var(--bg-alt)', letterSpacing: '-0.04em' }}>{step.n}</span>
                  </div>
                  <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.35 }}>{step.title}</h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65 }}>{step.sub}</p>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: 18, height: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight className="w-3 h-3" style={{ color: 'var(--subtle)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── AI ORCHESTRA — BENTO GRID ─────────────────────────────────────── */}
      <section id="verification" style={{ padding: '100px 40px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>The AI Orchestra</p>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 16 }}>
                6 Specialised Agents.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>One Objective Verdict.</em>
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '0 auto' }}>
                Each agent has a single responsibility. They work sequentially, feeding results to the next, creating a tamper-proof audit trail.
              </p>
            </div>
          </FadeSection>

          <FadeSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {AGENTS.map((agent, i) => (
                <div key={i}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sand)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--btn-primary-shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: agent.bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <agent.icon className="w-5 h-5" style={{ color: agent.color }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{agent.label}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10.5, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{agent.role}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{agent.desc}</p>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 2s infinite' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Active</span>
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── LIVE DEMO ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '90px 40px', background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Live Demo</p>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 18 }}>
                  Real verification.<br />Real results.
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 26 }}>
                  Connect your GitHub repository, define milestones, and watch krow's AI verify your developer's work objectively and automatically.
                </p>
                <Link href="/visualizer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 9, background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <Bot className="w-4 h-4" /> Open Verification Center
                </Link>
              </div>

              {/* Simulated card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>AI Verification Report</div>
                    <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>frontend-dashboard</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--subtle)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Github className="w-3 h-3" /> user/frontend-dashboard
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginBottom: 3 }}>
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                      <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>Approved</span>
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--subtle)' }}>Escrow Released</div>
                  </div>
                </div>

                <div style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--bg)', borderRadius: 9, border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Milestone</div>
                  <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Build Escrow Workflow</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                  <ScoreRing score={92} label="Completion" color="var(--accent)" />
                  <ScoreRing score={95} label="Req. Match" color="var(--success)" />
                  <ScoreRing score={94} label="Code Quality" color="var(--warning)" />
                </div>

                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--success-soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>AI Verdict: Approved</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: 'var(--muted)' }}>1,840 MON released to developer</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── WHY MONAD ────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: 'var(--bg)', transition: 'background-color 0.3s ease' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Infrastructure</p>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                Built for Instant Settlement.
              </h2>
            </div>
          </FadeSection>
          <FadeSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {MONAD_STATS.map(s => (
                <div key={s.val}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '26px 22px', textAlign: 'center', transition: 'all 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--sand)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                  <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, marginBottom: 7 }}>
                    {s.val}<span style={{ fontSize: 20, color: 'var(--accent)' }}>{s.unit}</span>
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: '110px 40px', background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', transition: 'background-color 0.3s ease' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <FadeSection>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, background: 'var(--sand-soft)', border: '1px solid var(--border)', marginBottom: 32 }}>
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>Hackathon Demo — Monad Devnet</span>
            </div>

            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 50, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1.1, marginBottom: 22 }}>
              Build software.<br />
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Let AI handle</em><br />
              the trust.
            </h2>

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 42, maxWidth: 420, margin: '0 auto 42px' }}>
              The first escrow platform where code becomes proof of work. No disputes. No delays. Just verified, automated payments.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/dashboard"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 10, background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Launch App <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="https://github.com" target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 28px', borderRadius: 10, background: 'transparent', color: 'var(--muted)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, border: '1px solid var(--border)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--sand-soft)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--sand)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <Github className="w-4 h-4" /> Read Documentation
              </a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: '26px 40px', background: 'var(--bg)', borderTop: '1px solid var(--border)', transition: 'background-color 0.3s ease' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M4 2.5V15.5M4 9L13.5 2.5M4 9L13.5 15.5" stroke="var(--bg-card)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>krow</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--muted)' }}>AI-Verified Escrow for Developers</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {[
              { l: 'GitHub', h: 'https://github.com' },
              { l: 'Twitter', h: 'https://twitter.com' },
              { l: 'Docs', h: '#' },
              { l: 'Launch App', h: '/dashboard' },
            ].map(link => (
              <a key={link.l} href={link.h} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                {link.l}
              </a>
            ))}
          </div>

          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: 'var(--subtle)' }}>
            © 2025 krow · Monad Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}
