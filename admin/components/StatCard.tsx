import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-500',
  iconBg = 'bg-brand-500/10',
}) => {
  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-sm hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {change && (
          <span
            className={`flex items-center text-xs font-semibold ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 leading-normal">{subtitle}</p>
      )}
    </div>
  );
};
