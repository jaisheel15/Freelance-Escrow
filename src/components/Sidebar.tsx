'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Plus,
  Wallet,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'           },
  { href: '/new',        icon: FolderKanban,    label: 'New Escrow'          },
  { href: '/visualizer', icon: Bot,             label: 'Verification Center' },
];

function WalletButton() {
  return (
    <button
      className="wallet-btn"
      onClick={() => alert('Wallet connection coming soon — integrate wagmi/viem here')}
    >
      <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Connect Wallet</span>
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sb-logo">
        <div className="sb-logo-icon">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 2.5V15.5M4 9L13.5 2.5M4 9L13.5 15.5" stroke="var(--bg-card)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div className="sb-logo-name">krow</div>
          <div className="sb-logo-tag">AI-Verified Escrow</div>
        </div>
      </Link>

      {/* Nav */}
      <div className="sb-section">Navigation</div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sb-item${active ? ' active' : ''}`}
            >
              <item.icon className="sb-icon" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Quick action */}
      <div style={{ padding: '0 10px 12px' }}>
        <Link
          href="/new"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '9px' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Escrow
        </Link>
      </div>

      {/* Bottom — status + wallet */}
      <div className="sb-bottom">
        {/* Network status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 4px 9px', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>Monad Devnet</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--success)', fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
        </div>

        {/* AI Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 4px 10px', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>AI Engine</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--warning)', fontWeight: 600, letterSpacing: '0.04em' }}>READY</span>
        </div>

        <WalletButton />
      </div>
    </aside>
  );
}
