'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children, onRefresh, isRefreshing }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#38BDF8] to-[#10B981] flex items-center justify-center animate-pulse shadow-lg shadow-cyan-500/20 text-black">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-sm font-mono text-[#8A94A6]">Verifying Administrative Security Clearance...</p>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#08090D] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onRefresh={onRefresh} isRefreshing={isRefreshing} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
