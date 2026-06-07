'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-alt)', border: '1px solid var(--border)', opacity: 0.5 }} />
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <button
      onClick={cycleTheme}
      className="theme-toggle-btn"
      title={`Theme: ${theme}. Click to switch.`}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--sand)';
        e.currentTarget.style.color = 'var(--text)';
        e.currentTarget.style.background = 'var(--sand-soft)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--muted)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <Icon className="w-4 h-4 transition-transform hover:scale-110" />
    </button>
  );
}
