'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { AdminService, RemoteConfigMap } from '../../services/admin-service';
import {
  Sliders,
  Cpu,
  Tag,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

export default function RemoteConfigPage() {
  const [config, setConfig] = useState<RemoteConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selector input state
  const [newInstaSelector, setNewInstaSelector] = useState('');
  const [newYtSelector, setNewYtSelector] = useState('');

  const fetchConfig = async () => {
    try {
      const data = await AdminService.getRemoteConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load remote config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleAddSelector = (platform: 'instagram' | 'youtube') => {
    if (!config) return;
    const value = platform === 'instagram' ? newInstaSelector.trim() : newYtSelector.trim();
    if (!value) return;

    const currentList = config.surgical_selectors[platform] || [];
    if (!currentList.includes(value)) {
      setConfig({
        ...config,
        surgical_selectors: {
          ...config.surgical_selectors,
          [platform]: [...currentList, value],
        },
      });
    }

    if (platform === 'instagram') setNewInstaSelector('');
    else setNewYtSelector('');
  };

  const handleRemoveSelector = (platform: 'instagram' | 'youtube', item: string) => {
    if (!config) return;
    setConfig({
      ...config,
      surgical_selectors: {
        ...config.surgical_selectors,
        [platform]: config.surgical_selectors[platform].filter((s) => s !== item),
      },
    });
  };

  const handleToggleFeature = (key: keyof RemoteConfigMap['feature_flags']) => {
    if (!config) return;
    setConfig({
      ...config,
      feature_flags: {
        ...config.feature_flags,
        [key]: !config.feature_flags[key],
      },
    });
  };

  const handleSaveAll = async () => {
    if (!config) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      await Promise.all([
        AdminService.updateRemoteConfig('surgical_selectors', config.surgical_selectors),
        AdminService.updateRemoteConfig('feature_flags', config.feature_flags),
        AdminService.updateRemoteConfig('paywall_config', config.paywall_config),
      ]);
      setSuccessMsg('Remote Configuration pushed OTA to Supabase. Mobile clients will refresh immediately on launch.');
    } catch (err) {
      console.error('Failed to save remote config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8 max-w-5xl">
        {/* Header Save Bar */}
        <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#38BDF8] text-xs font-mono mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Over-The-Air Telemetry Sync</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">OTA Dynamic Configuration</h1>
            <p className="text-xs text-[#8A94A6] mt-0.5">
              Live updates propagate to the mobile Android AccessibilityService and RevenueCat Paywall without an App Store update.
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-sm font-semibold text-black hover:opacity-95 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing OTA...' : 'Publish Config Live'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-[#10B981] flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading || !config ? (
          <div className="py-20 text-center text-[#8A94A6] font-mono text-xs">
            Loading OTA Remote Config from Supabase...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. SURGICAL SELECTORS EDITOR */}
            <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] space-y-6 shadow-xl md:col-span-2">
              <div className="flex items-center justify-between pb-4 border-b border-[#1E2230]">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#38BDF8]" />
                    <span>Android Accessibility Surgical Selectors</span>
                  </h3>
                  <p className="text-xs text-[#8A94A6] mt-0.5">
                    View node IDs inspected by <code>FocusAccessibilityService</code> to surgically intercept Reels/Shorts containers.
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-[#38BDF8] border border-cyan-500/20">
                  Dynamic JSON
                </span>
              </div>

              {/* Instagram Selectors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase font-mono">Instagram Reels View IDs</span>
                  <span className="text-xs text-[#8A94A6] font-mono">
                    {config.surgical_selectors.instagram.length} active
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {config.surgical_selectors.instagram.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs font-mono text-[#38BDF8]"
                    >
                      <span>{item}</span>
                      <button
                        onClick={() => handleRemoveSelector('instagram', item)}
                        className="text-[#8A94A6] hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInstaSelector}
                    onChange={(e) => setNewInstaSelector(e.target.value)}
                    placeholder="e.g. clips_viewer_view_pager"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs font-mono text-white placeholder-[#8A94A6]/40 focus:outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    onClick={() => handleAddSelector('instagram')}
                    className="px-3 py-1.5 rounded-xl bg-[#161925] border border-[#1E2230] text-xs font-medium text-white hover:border-[#38BDF8] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* YouTube Shorts Selectors */}
              <div className="space-y-3 pt-4 border-t border-[#1E2230]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase font-mono">YouTube Shorts View IDs</span>
                  <span className="text-xs text-[#8A94A6] font-mono">
                    {config.surgical_selectors.youtube.length} active
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {config.surgical_selectors.youtube.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs font-mono text-red-400"
                    >
                      <span>{item}</span>
                      <button
                        onClick={() => handleRemoveSelector('youtube', item)}
                        className="text-[#8A94A6] hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newYtSelector}
                    onChange={(e) => setNewYtSelector(e.target.value)}
                    placeholder="e.g. reel_recycler"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs font-mono text-white placeholder-[#8A94A6]/40 focus:outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    onClick={() => handleAddSelector('youtube')}
                    className="px-3 py-1.5 rounded-xl bg-[#161925] border border-[#1E2230] text-xs font-medium text-white hover:border-[#38BDF8] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. GLOBAL FEATURE FLAGS */}
            <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] space-y-5 shadow-xl">
              <div className="pb-4 border-b border-[#1E2230]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#10B981]" />
                  <span>Global Feature Toggles</span>
                </h3>
                <p className="text-xs text-[#8A94A6] mt-0.5">
                  Remotely disable differentiator hardware locks or guards if required.
                </p>
              </div>

              <div className="space-y-4">
                {/* NFC Lock */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090D] border border-[#1E2230]">
                  <div>
                    <p className="text-sm font-semibold text-white">Physical NFC Tag Lock</p>
                    <p className="text-[11px] text-[#8A94A6]">NTAG213/215 hardware unblocking</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('nfc_lock_enabled')}
                    className="text-2xl text-[#10B981]"
                  >
                    {config.feature_flags.nfc_lock_enabled ? (
                      <ToggleRight className="w-8 h-8 text-[#10B981]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[#8A94A6]" />
                    )}
                  </button>
                </div>

                {/* Step Gating */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090D] border border-[#1E2230]">
                  <div>
                    <p className="text-sm font-semibold text-white">HealthKit & Steps Gate</p>
                    <p className="text-[11px] text-[#8A94A6]">5,000 steps unlocking rule</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('step_unlock_enabled')}
                    className="text-2xl text-[#10B981]"
                  >
                    {config.feature_flags.step_unlock_enabled ? (
                      <ToggleRight className="w-8 h-8 text-[#10B981]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[#8A94A6]" />
                    )}
                  </button>
                </div>

                {/* Friend Lock */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090D] border border-[#1E2230]">
                  <div>
                    <p className="text-sm font-semibold text-white">Emergency Friend Lock</p>
                    <p className="text-[11px] text-[#8A94A6]">6-digit accountability partner OTP</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('friend_lock_enabled')}
                    className="text-2xl text-[#10B981]"
                  >
                    {config.feature_flags.friend_lock_enabled ? (
                      <ToggleRight className="w-8 h-8 text-[#10B981]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[#8A94A6]" />
                    )}
                  </button>
                </div>

                {/* Anti-Uninstall */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090D] border border-[#1E2230]">
                  <div>
                    <p className="text-sm font-semibold text-white">Anti-Uninstall Shield</p>
                    <p className="text-[11px] text-[#8A94A6]">Intercepts Settings app removal during session</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('anti_uninstall_enabled')}
                    className="text-2xl text-[#10B981]"
                  >
                    {config.feature_flags.anti_uninstall_enabled ? (
                      <ToggleRight className="w-8 h-8 text-[#10B981]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[#8A94A6]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. PAYWALL CONFIGURATION */}
            <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] space-y-5 shadow-xl">
              <div className="pb-4 border-b border-[#1E2230]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Paywall Labels & Copy</span>
                </h3>
                <p className="text-xs text-[#8A94A6] mt-0.5">
                  Over-the-air labels shown in mobile Pro paywall modal.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A94A6] mb-1">Yearly Price Tag</label>
                  <input
                    type="text"
                    value={config.paywall_config.yearly_price}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paywall_config: { ...config.paywall_config, yearly_price: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A94A6] mb-1">Monthly Price Tag</label>
                  <input
                    type="text"
                    value={config.paywall_config.monthly_price}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paywall_config: { ...config.paywall_config, monthly_price: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A94A6] mb-1">Free Trial Duration (Days)</label>
                  <input
                    type="number"
                    value={config.paywall_config.trial_days}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paywall_config: { ...config.paywall_config, trial_days: parseInt(e.target.value) || 7 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A94A6] mb-1">Hero Headline</label>
                  <input
                    type="text"
                    value={config.paywall_config.headline || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paywall_config: { ...config.paywall_config, headline: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
