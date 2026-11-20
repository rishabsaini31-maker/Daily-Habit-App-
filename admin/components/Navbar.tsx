'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Shield, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing = false }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageInfo = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Executive Mission Control',
          subtitle: 'Live global KPIs, distraction analytics, and platform health',
        };
      case '/users':
        return {
          title: 'Users & Subscriptions Manager',
          subtitle: 'Moderate profiles, grant VIP Pro access, adjust Gems, and review active sessions',
        };
      case '/remote-config':
        return {
          title: 'OTA Remote Config & Feature Flags',
          subtitle: 'Push dynamic Android Accessibility node selectors and toggle global flags in realtime',
        };
      case '/logs':
        return {
          title: 'Webhook & Audit Trail',
          subtitle: 'Inspect server-to-server RevenueCat purchase events and Emergency Unlock audit codes',
        };
      default:
        return {
          title: 'Admin Platform Portal',
          subtitle: 'Obsidian luxury dark-mode operations console',
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="h-20 bg-[#08090D] border-b border-[#1E2230] px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
        </h2>
        <p className="text-xs text-[#8A94A6] mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12141D] border border-[#1E2230] text-xs font-medium text-[#8A94A6] hover:text-white hover:border-[#38BDF8]/40 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#38BDF8]' : ''}`} />
            Refresh
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12141D] border border-[#1E2230]">
          <Zap className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-xs font-mono font-medium text-white">Production V2</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-[#38BDF8]/20">
          <Shield className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-xs font-semibold text-white">{user?.role === 'super_admin' ? 'Super Admin' : 'Support'}</span>
        </div>
      </div>
    </header>
  );
};
