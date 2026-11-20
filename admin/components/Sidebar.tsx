'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Sliders,
  Terminal,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Database,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      name: 'Executive Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      name: 'Users & Subscriptions',
      href: '/users',
      icon: Users,
    },
    {
      name: 'OTA Remote Config',
      href: '/remote-config',
      icon: Sliders,
      badge: 'OTA',
    },
    {
      name: 'Webhook & System Logs',
      href: '/logs',
      icon: Terminal,
    },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      } bg-[#12141D] border-r border-[#1E2230]`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E2230]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#38BDF8] to-[#10B981] flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20 text-black">
              <Shield className="w-5 h-5 font-bold" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Focus Admin
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#10B981] border border-emerald-500/30">
                    Pro
                  </span>
                </h1>
                <p className="text-[11px] text-[#8A94A6] font-mono">Control Center</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[#8A94A6] hover:text-white hover:bg-[#1E2230] transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          {!collapsed && (
            <div className="text-[10px] font-bold tracking-wider text-[#8A94A6] uppercase px-3 mb-2 font-mono">
              Management
            </div>
          )}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 text-white border border-[#38BDF8]/30 shadow-sm'
                      : 'text-[#8A94A6] hover:text-white hover:bg-[#161925]'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-[#8A94A6]'}`} />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                            item.badge === 'Live'
                              ? 'bg-emerald-500/20 text-[#10B981] border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-[#38BDF8] border border-cyan-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Database Status & Admin Profile */}
      <div className="p-3 border-t border-[#1E2230] space-y-2">
        {/* DB Status Badge */}
        {!collapsed ? (
          <div className="px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-xs font-mono text-[#8A94A6]">Supabase DB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-mono text-[#10B981]">ONLINE</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Supabase DB Online">
            <Radio className="w-4 h-4 text-[#10B981] animate-pulse" />
          </div>
        )}

        {/* User Card */}
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } p-2 rounded-xl bg-[#161925] border border-[#1E2230]`}
        >
          {!collapsed && (
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-[#8A94A6] font-mono truncate">{user?.email || 'admin@focusapp.com'}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#8A94A6] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
