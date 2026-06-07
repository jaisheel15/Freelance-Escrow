'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Github,
  Loader2,
  AlertCircle,
  Sparkles,
  Flag,
  Info,
  Lock,
  Bot,
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MilestoneTemplate {
  deliverables: string;
  verification: string;
}

const MILESTONE_TEMPLATES: Record<string, MilestoneTemplate> = {
  'Authentication': {
    deliverables: 'User login/signup forms, JWT authorization middleware, session handling, password hashing.',
    verification: 'AST check for secure passwords + automated execution of login/registration endpoint tests.'
  },
  'Dashboard': {
    deliverables: 'Responsive overview panels, UI layout templates, charting libraries integration.',
    verification: 'DOM render verification + synthetic tests for user interaction widgets.'
  },
  'CRUD Operations': {
    deliverables: 'Entity schemas, forms for creation/editing, list filtering, status updates.',
    verification: 'Automated test suite simulating creation, updating, and removal of test database records.'
  },
  'API Layer': {
    deliverables: 'RESTful API routing architecture, controllers, schema validator middleware.',
    verification: 'Linting compliance checks + HTTP response code verification across all endpoints.'
  },
  'Frontend UI': {
    deliverables: 'Shared UI components library, styling theme token configurations, global layouts.',
    verification: 'HTML/CSS standards compliance validation + components visual check.'
  },
  'Database Setup': {
    deliverables: 'Database schema models configuration, seed files, deployment migrations script.',
    verification: 'Database connection sanity check + validation of primary/foreign key constraints.'
  },
  'Testing & QA': {
    deliverables: 'Unit and integration testing suites, GitHub Actions runner workflows configuration.',
    verification: 'Automatic pipeline test run verification + code coverage metrics analysis.'
  },
  'Analytics': {
    deliverables: 'Data computation algorithms, dashboards widgets, custom aggregators.',
    verification: 'Calculations precision check + verification of visual updates on data changes.'
  },
  'Search & Filters': {
    deliverables: 'Fuzzy search logic implementation, dynamic filtering, sorting indices.',
    verification: 'Execution duration check + validation of result subsets against test records.'
  },
  'Notifications': {
    deliverables: 'Email dispatchers, SMS integration modules, webhook payloads framework.',
    verification: 'Mock server validation of outgoing dispatch status codes.'
  },
  'Payments': {
    deliverables: 'Payment gateway API keys config, webhook listener endpoint, checkout workflows.',
    verification: 'Verification of Stripe webhook signature parser + checkout link generation.'
  },
  'Deployment': {
    deliverables: 'Docker configs, environment variables setup, static bundle build scripts.',
    verification: 'Verification of build compiler output + checking production bundle status.'
  },
  'Core Setup': {
    deliverables: 'Repository structuring, base packages dependencies, developer environment configs.',
    verification: 'Inspection of initial workspace layout + verification of base configurations.'
  },
  'Main Features': {
    deliverables: 'Main business logic modules, controllers, helper libraries.',
    verification: 'Unit checks for controller endpoints + mock inputs validation.'
  },
  'UI & Design': {
    deliverables: 'Sass/Tailwind style system definitions, custom font integrations, themes.',
    verification: 'Audit of global classes + components styling layout verification.'
  },
  'Testing & Launch': {
    deliverables: 'Production build script execution, end-to-end user tests, launch checklists.',
    verification: 'Clean build checks + check for zero compiler warnings.'
  }
};

function deriveMilestones(desc: string): { name: string; deliverables: string; verification: string }[] {
  if (!desc || desc.length < 15) return [];
  const rules: { key: RegExp; label: string }[] = [
    { key: /auth|login|signup|register|jwt|session|password/i, label: 'Authentication' },
    { key: /dashboard|overview|home|landing/i,                  label: 'Dashboard'      },
    { key: /crud|create|read|update|delete|form|submit/i,       label: 'CRUD Operations'},
    { key: /api|endpoint|route|rest|backend|server/i,           label: 'API Layer'      },
    { key: /ui|frontend|component|design|style|layout/i,        label: 'Frontend UI'   },
    { key: /database|db|model|schema|storage|mongo|sql/i,       label: 'Database Setup' },
    { key: /test|spec|unit|integration|qa/i,                    label: 'Testing & QA'  },
    { key: /report|analytics|chart|graph|stat/i,                label: 'Analytics'     },
    { key: /search|filter|sort|query/i,                         label: 'Search & Filters'},
    { key: /notif|email|sms|alert|push/i,                       label: 'Notifications' },
    { key: /payment|stripe|invoice|billing/i,                   label: 'Payments'      },
    { key: /deploy|docker|ci|cd|production/i,                   label: 'Deployment'    },
  ];
  const found = rules.filter(r => r.key.test(desc)).map(r => r.label);
  const selectedNames = found.length === 0
    ? ['Core Setup', 'Main Features', 'UI & Design', 'Testing & Launch']
    : found;

  return selectedNames.slice(0, 5).map(name => {
    const template = MILESTONE_TEMPLATES[name] || {
      deliverables: 'Essential feature modules, configuration files, and components setup.',
      verification: 'Static code analysis and verification of standard feature outputs.'
    };
    return { name, ...template };
  });
}

export default function NewEscrow() {
  const router = useRouter();
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [escrowAmount, setEscrowAmount] = useState('100');
  const [githubUrl,    setGithubUrl]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [previewMs,    setPreviewMs]    = useState<{ name: string; deliverables: string; verification: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setPreviewMs(deriveMilestones(description)), 350);
    return () => clearTimeout(t);
  }, [description]);

  const weightPer = previewMs.length > 0 ? Math.round(100 / previewMs.length) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, escrow_amount: Number(escrowAmount), github_url: githubUrl }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.error ?? 'Failed to create contract'); return; }
      router.push(`/project/${d.data.project.id}`);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  // Stepper state configurations
  const stepState = title && description && escrowAmount ? 'completed' : 'current';

  return (
    <div className="app-shell animate-fade-in">
      <Sidebar />
      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div style={{ fontSize: 10, color: 'var(--subtle)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', fontFamily: 'Inter' }}>Escrows</div>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Initialize Escrow Contract
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Provide project specifications to lock escrow funds</p>
            <ThemeToggle />
          </div>
        </div>

        <div className="page-content" style={{ background: 'var(--bg)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* Step indicator */}
            <div className="step-indicator" style={{ marginBottom: 36 }}>
              <div className={`step-item ${stepState === 'completed' ? 'done' : 'active'}`}>
                <div className="step-num">{stepState === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}</div>
                <span>1. Describe Project Requirements</span>
              </div>
              <div className="step-connector" />
              <div className={`step-item ${stepState === 'completed' ? 'active' : ''}`} style={{ opacity: stepState === 'completed' ? 1 : 0.6 }}>
                <div className="step-num">2</div>
                <span>2. AI Generated Milestones</span>
              </div>
              <div className="step-connector" />
              <div className="step-item" style={{ opacity: 0.5 }}>
                <div className="step-num">3</div>
                <span>3. Deploy Smart Escrow</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start', marginBottom: 28 }}>

              {/* Form Card */}
              <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '28px 30px' }}>
                  <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>
                    Contract Configuration
                  </h2>

                  {/* Title */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Project Name <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input
                      id="project-title"
                      type="text"
                      required
                      placeholder="e.g., Decentraship Dashboard Integration"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {/* GitHub + Escrow */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                    <div>
                      <label className="form-label">GitHub Repository Link</label>
                      <div style={{ position: 'relative' }}>
                        <Github className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)' }} />
                        <input
                          id="github-url"
                          type="url"
                          placeholder="https://github.com/org/repo"
                          value={githubUrl}
                          onChange={e => setGithubUrl(e.target.value)}
                          className="form-input"
                          style={{ paddingLeft: 36, fontFamily: 'monospace', fontSize: 12.5 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Escrow Budget (MON) <span style={{ color: 'var(--error)' }}>*</span></label>
                      <input
                        id="escrow-amount"
                        type="number"
                        min="1"
                        required
                        placeholder="100"
                        value={escrowAmount}
                        onChange={e => setEscrowAmount(e.target.value)}
                        className="form-input"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  {/* Requirements Textarea (Increased Size) */}
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 7, justifyContent: 'space-between' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        Milestone Definitions & Technical Criteria <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles className="w-3.5 h-3.5" /> AI Engine parsing active
                      </span>
                    </div>
                    <textarea
                      id="project-description"
                      rows={12}
                      required
                      placeholder={`Provide a comprehensive specification list. The AI will translate this text directly into cryptographic and code-level verification checkpoints.\n\nExample:\n- User Authentication: Secure sign-up/sign-in flows via JWT tokens.\n- API Layer: Setup 4 REST routes in Node/Express (GET, POST, PUT, DELETE).\n- Database Setup: Create schema configuration files for Users and Projects.\n- Deployment: Configure Dockerfile and trigger GitHub Actions compiler on pull request.`}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="form-textarea"
                    />
                    <p style={{ fontSize: 11.5, color: 'var(--subtle)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter' }}>
                      <Info className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                      Specific deliverables ensure 100% automated agent verification accuracy.
                    </p>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'var(--error-soft)', border: '1px solid rgba(184,92,92,0.2)', marginBottom: 18 }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--error)' }} />
                      <span style={{ fontSize: 13, color: 'var(--error)', fontFamily: 'Inter' }}>{error}</span>
                    </div>
                  )}

                  <button
                    id="create-project-btn"
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Deploying Escrow Contract…</>
                      : <><Plus className="w-4 h-4" /> Create & Lock Escrow Budget</>}
                  </button>
                </div>
              </form>

              {/* Side Panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Escrow flow */}
                <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-card)' }}>
                  <div className="sect-label">Contract Protocol</div>
                  {[
                    { icon: Lock, t: 'Funds Locked', d: 'Budget held in Monad Smart Escrow Contract.' },
                    { icon: Bot, t: 'AI Audited', d: 'Verification agents audit deliverables on PR.' },
                    { icon: Banknote, t: 'Instant Payout', d: 'Contract unlocks funds automatically on success.' },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{f.t}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{f.d}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Milestone Preview */}
                <div className="card animate-slide-up" style={{ overflow: 'hidden', background: 'var(--bg-card)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                      Realtime Milestones Engine
                    </h3>
                    {previewMs.length > 0 && (
                      <span className="badge badge-sand" style={{ marginLeft: 'auto' }}>
                        {previewMs.length} Milestones
                      </span>
                    )}
                  </div>

                  {previewMs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px solid var(--border)' }}>
                        <Flag className="w-5 h-5" style={{ color: 'var(--subtle)' }} />
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--subtle)', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                        Start typing project details. The AI engine will parse your guidelines and draft milestones in realtime.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, maxOverflowY: '380px', overflowY: 'auto' }}>
                        {previewMs.map((ms, i) => (
                          <div key={ms.name} style={{ background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)', border: '1px solid var(--border)' }}>
                                  {i + 1}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{ms.name}</span>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                                {weightPer}%
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 8 }}>
                              {ms.deliverables}
                            </p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 10.5, color: 'var(--subtle)', maxWidth: '100%', overflow: 'hidden' }}>
                              <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ms.verification}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--success)', flexShrink: 0 }} />
                        <span>Weights automatically balanced equally.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
