'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  ShieldCheck,
  LogOut,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: 'Executive Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'KPI',
    },
    {
      name: 'User Moderation',
      href: '/users',
      icon: Users,
    },
    {
      name: 'Habit Templates',
      href: '/templates',
      icon: Layers,
    },
    {
      name: 'Security & Audit Logs',
      href: '/audit-logs',
      icon: ShieldCheck,
      badge: 'Immutable',
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Habit Tracker
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Admin
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Platform Portal</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2 font-mono">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-brand-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? 'text-brand-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 flex-shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {user?.displayName || 'Administrator'}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono">
                {user?.email || 'admin@example.com'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out of Admin Portal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
