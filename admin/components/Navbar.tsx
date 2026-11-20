'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Globe, Clock, RefreshCw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': {
      title: 'Executive KPI Dashboard',
      subtitle: 'Real-time overview of adoption, engagement, and completion velocity',
    },
    '/users': {
      title: 'User Moderation & Management',
      subtitle: 'Inspect platform accounts, review activity, and enforce moderation policies',
    },
    '/templates': {
      title: 'Curated Habit Templates',
      subtitle: 'Manage global habit templates catalog available for user discovery',
    },
    '/audit-logs': {
      title: 'Security & Audit Trail',
      subtitle: 'Immutable record of all administrative actions and security events',
    },
  };

  const currentMeta = pageTitles[pathname] || {
    title: 'Platform Administration',
    subtitle: 'Daily Habit Platform Enterprise Console',
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-sm font-bold text-white tracking-wide">{currentMeta.title}</h2>
        <p className="text-[11px] text-slate-400">{currentMeta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Status Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono text-slate-300">API v1 Connected</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{utcTime || 'Loading...'}</span>
        </div>

        {/* Reload button */}
        <button
          onClick={() => window.location.reload()}
          title="Refresh view data"
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
