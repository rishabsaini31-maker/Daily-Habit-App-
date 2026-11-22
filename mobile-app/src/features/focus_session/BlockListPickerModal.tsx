import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import {
  X,
  Check,
  Scissors,
  Crown,
  Plus,
  Clock,
  Sliders,
  Sparkles,
  RotateCcw,
  Lock,
  AlertCircle,
  Trash2,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import { SyncBlockedTarget } from '../../services/sync/SyncService';

export interface AppItem {
  packageName: string;
  name: string;
  category: 'social' | 'entertainment' | 'gaming' | 'productivity' | 'custom';
  emoji: string;
  supportsSurgical: boolean;
  surgicalFeatureName?: string;
  surgicalDescription?: string;
  isCustom?: boolean;
}

const APPS_CATALOG: AppItem[] = [
  {
    packageName: 'com.instagram.android',
    name: 'Instagram',
    category: 'social',
    emoji: '📸',
    supportsSurgical: true,
    surgicalFeatureName: 'Instagram Reels Feed',
    surgicalDescription: 'Block algorithmic vertical videos while keeping DMs open',
  },
  {
    packageName: 'com.google.android.youtube',
    name: 'YouTube',
    category: 'entertainment',
    emoji: '▶️',
    supportsSurgical: true,
    surgicalFeatureName: 'YouTube Shorts',
    surgicalDescription: 'Block addictive swipe feed while allowing educational videos',
  },
  {
    packageName: 'com.zhiliaoapp.musically',
    name: 'TikTok',
    category: 'social',
    emoji: '🎵',
    supportsSurgical: true,
    surgicalFeatureName: 'For You Page (FYP)',
    surgicalDescription: 'Block autoplay endless scroll loop',
  },
  {
    packageName: 'com.twitter.android',
    name: 'X (Twitter)',
    category: 'social',
    emoji: '🐦',
    supportsSurgical: false,
  },
  {
    packageName: 'com.reddit.frontpage',
    name: 'Reddit',
    category: 'entertainment',
    emoji: '🤖',
    supportsSurgical: true,
    surgicalFeatureName: 'Popular Video Feed',
    surgicalDescription: 'Block infinite rage-bait video reels',
  },
  {
    packageName: 'com.snapchat.android',
    name: 'Snapchat',
    category: 'social',
    emoji: '👻',
    supportsSurgical: true,
    surgicalFeatureName: 'Spotlight Feed',
    surgicalDescription: 'Block addicting swipe video feed while keeping chat active',
  },
  {
    packageName: 'com.facebook.katana',
    name: 'Facebook',
    category: 'social',
    emoji: '👥',
    supportsSurgical: true,
    surgicalFeatureName: 'Facebook Reels & Watch',
    surgicalDescription: 'Block vertical video reels feed',
  },
  {
    packageName: 'com.pinterest',
    name: 'Pinterest',
    category: 'entertainment',
    emoji: '📌',
    supportsSurgical: false,
  },
  {
    packageName: 'com.discord',
    name: 'Discord',
    category: 'social',
    emoji: '💬',
    supportsSurgical: false,
  },
  {
    packageName: 'com.netflix.mediaclient',
    name: 'Netflix',
    category: 'entertainment',
    emoji: '🍿',
    supportsSurgical: false,
  },
  {
    packageName: 'tv.twitch.android.app',
    name: 'Twitch',
    category: 'entertainment',
    emoji: '👾',
    supportsSurgical: false,
  },
  {
    packageName: 'com.supercell.clashroyale',
    name: 'Clash Royale',
    category: 'gaming',
    emoji: '🎮',
    supportsSurgical: false,
  },
  {
    packageName: 'com.roblox.client',
    name: 'Roblox',
    category: 'gaming',
    emoji: '🕹️',
    supportsSurgical: false,
  },
  {
    packageName: 'com.miHoYo.GenshinImpact',
    name: 'Genshin Impact',
    category: 'gaming',
    emoji: '⚔️',
    supportsSurgical: false,
  },
];

const ALLOWANCE_PRESETS = [
  { minutes: 0, label: 'Always Blocked', sub: 'No allowance' },
  { minutes: 15, label: '15 mins', sub: 'Quick check' },
  { minutes: 20, label: '20 mins', sub: 'Mindful limit' },
  { minutes: 30, label: '30 mins', sub: 'Balanced' },
  { minutes: 45, label: '45 mins', sub: 'Moderate' },
  { minutes: 60, label: '1 Hour', sub: 'Standard cap' },
  { minutes: 90, label: '1.5 Hours', sub: 'Extended' },
  { minutes: 120, label: '2 Hours', sub: 'Generous' },
];

export const BlockListPickerModal: React.FC = () => {
  const { closeModal, openModal } = useAppNavigation();
  const {
    blockedTargets,
    addBlockedTarget,
    removeBlockedTarget,
    setAppDailyLimit,
    recordAppUsage,
    profile,
  } = useFocusEngine();
  const { bottomInset, isWide } = useResponsiveLayout();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'social' | 'entertainment' | 'gaming' | 'custom'>('all');
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [editingLimitPkg, setEditingLimitPkg] = useState<string | null>(null);

  // Custom App Form State
  const [customName, setCustomName] = useState<string>('');
  const [customPackage, setCustomPackage] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<'social' | 'entertainment' | 'gaming' | 'productivity' | 'custom'>('social');
  const [customAllowance, setCustomAllowance] = useState<number>(20);
  const [customSurgical, setCustomSurgical] = useState<boolean>(false);

  // Combine built-in catalog + user-added custom apps from state
  const allApps: AppItem[] = [...APPS_CATALOG];
  blockedTargets.forEach((target) => {
    const exists = allApps.some((a) => a.packageName === target.package_or_token);
    if (!exists) {
      allApps.push({
        packageName: target.package_or_token,
        name: target.display_name,
        category: (target.category as any) || 'custom',
        emoji: target.category === 'gaming' ? '🎮' : target.category === 'entertainment' ? '🍿' : target.category === 'productivity' ? '⚡' : '📱',
        supportsSurgical: target.is_surgical_feed_only,
        isCustom: true,
      });
    }
  });

  const filteredCatalog = allApps.filter((app) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'custom') return app.isCustom;
    return app.category === selectedFilter;
  });

  const handleToggleEntireApp = async (app: AppItem, isBlocked: boolean) => {
    if (isBlocked) {
      const target: SyncBlockedTarget = {
        id: Math.random().toString(36).substring(2, 9),
        platform: 'android',
        package_or_token: app.packageName,
        display_name: app.name,
        is_surgical_feed_only: false,
        daily_limit_minutes: 20, // Default 20m daily allowance
        time_spent_today_minutes: 0,
        category: app.category,
        last_reset_date: new Date().toISOString().split('T')[0],
      };
      await addBlockedTarget(target);
    } else {
      await removeBlockedTarget(app.packageName);
    }
  };

  const handleToggleSurgical = async (app: AppItem, enableSurgical: boolean) => {
    if (!profile.is_pro) {
      Alert.alert(
        'Pro Feature Required',
        'Surgical Reels & Shorts blocking is a DHI Pro exclusive feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Pro', onPress: () => openModal('paywall') },
        ]
      );
      return;
    }

    const matched = blockedTargets.find((t) => t.package_or_token === app.packageName);
    const target: SyncBlockedTarget = {
      id: matched?.id || Math.random().toString(36).substring(2, 9),
      platform: 'android',
      package_or_token: app.packageName,
      display_name: app.name,
      is_surgical_feed_only: enableSurgical,
      daily_limit_minutes: matched?.daily_limit_minutes ?? 20,
      time_spent_today_minutes: matched?.time_spent_today_minutes ?? 0,
      category: app.category,
      last_reset_date: new Date().toISOString().split('T')[0],
    };
    await addBlockedTarget(target);
  };

  const handleSaveCustomApp = async () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      Alert.alert('App Name Required', 'Please enter a name for the app you wish to block.');
      return;
    }

    const trimmedPkg =
      customPackage.trim() || `com.${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}.android`;

    const target: SyncBlockedTarget = {
      id: Math.random().toString(36).substring(2, 9),
      platform: 'android',
      package_or_token: trimmedPkg,
      display_name: trimmedName,
      is_surgical_feed_only: customSurgical,
      daily_limit_minutes: customAllowance,
      time_spent_today_minutes: 0,
      category: customCategory,
      last_reset_date: new Date().toISOString().split('T')[0],
    };

    await addBlockedTarget(target);

    // Reset Form
    setCustomName('');
    setCustomPackage('');
    setCustomAllowance(20);
    setCustomSurgical(false);
    setShowAddCustom(false);

    Alert.alert(
      'App Added to Block List ✓',
      `"${trimmedName}" is now shielded with a ${customAllowance > 0 ? `${customAllowance}-minute daily allowance` : 'hard lock during focus'}. Resets daily at 12:00 AM midnight.`
    );
  };

  const handleSimulateUsage = async (packageName: string, currentSpent: number, limit: number) => {
    const res = await recordAppUsage(packageName, 5);
    if (res.isLimitReached) {
      Alert.alert(
        '24-Hour Daily Limit Reached! 🚫',
        `You have used your entire ${limit}m allowance for today. This app is now blocked until 12:00 AM Midnight when the 24-hour cycle resets.`
      );
    }
  };

  return (
    <View style={[styles.modalOverlay, isWide && styles.modalOverlayWide]}>
      <View style={[styles.sheetContainer, isWide && styles.sheetContainerWide]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>App Block List & Daily Quotas</Text>
            <Text style={styles.subtitle}>
              Configure daily time limits (20m, 30m, 1h) & 24h midnight cycles
            </Text>
          </View>
          <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
            <X size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.filterBar}>
          {(['all', 'social', 'entertainment', 'gaming', 'custom'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.75}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. 24-HOUR RESET CYCLE BANNER (12 AM to 12 AM) */}
          <GlassCard variant="accent" style={styles.cycleCard}>
            <View style={styles.cycleHeaderRow}>
              <Clock size={18} color={colors.primaryAccent} />
              <Text style={styles.cycleTitle}>24-Hour Daily Cycle (12:00 AM – 12:00 AM)</Text>
            </View>
            <Text style={styles.cycleDesc}>
              Each app's daily allowance runs on a midnight-to-midnight cycle. Once an app hits its daily
              cap (e.g. 20m, 30m, 1h), it automatically locks for the rest of the day and unlocks fresh at
              12:00 AM midnight.
            </Text>
            <View style={styles.cycleBadgeRow}>
              <View style={styles.cyclePill}>
                <RotateCcw size={12} color={colors.positiveAccent} />
                <Text style={styles.cyclePillText}>Next Reset: Tonight at 12:00 AM Midnight</Text>
              </View>
            </View>
          </GlassCard>

          {/* 2. ADD CUSTOM APP ACTION BUTTON */}
          <View style={styles.actionHeaderRow}>
            <Text style={styles.sectionHeader}>YOUR TARGET APPS & ALLOWANCES</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAddCustom(!showAddCustom)}
              style={styles.addCustomBtn}
            >
              <Plus size={14} color="#08090D" />
              <Text style={styles.addCustomBtnText}>
                {showAddCustom ? 'Close Form' : '+ Add Custom App'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. CUSTOM APP FORM ACCORDION */}
          {showAddCustom && (
            <GlassCard style={styles.customAppFormCard}>
              <View style={styles.formTitleRow}>
                <Sparkles size={16} color={colors.primaryAccent} />
                <Text style={styles.formTitle}>Add Any App to Block List</Text>
              </View>

              <Text style={styles.inputLabel}>App Display Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Snapchat, Duolingo, Telegram, Netflix"
                placeholderTextColor={colors.tertiaryText}
                value={customName}
                onChangeText={(text) => {
                  setCustomName(text);
                  if (!customPackage) {
                    setCustomPackage(`com.${text.toLowerCase().replace(/[^a-z0-9]/g, '')}.android`);
                  }
                }}
              />

              <Text style={styles.inputLabel}>Package / Bundle Identifier (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="com.snapchat.android"
                placeholderTextColor={colors.tertiaryText}
                value={customPackage}
                onChangeText={setCustomPackage}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPickerRow}>
                {(['social', 'entertainment', 'gaming', 'productivity', 'custom'] as const).map(
                  (cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCustomCategory(cat)}
                      style={[
                        styles.catChoicePill,
                        customCategory === cat && styles.catChoicePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catChoiceText,
                          customCategory === cat && styles.catChoiceTextActive,
                        ]}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.inputLabel}>Daily Time Allowance (24h Cycle)</Text>
              <View style={styles.allowancePickerGrid}>
                {[0, 15, 20, 30, 45, 60, 90, 120].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setCustomAllowance(mins)}
                    style={[
                      styles.allowancePill,
                      customAllowance === mins && styles.allowancePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.allowancePillText,
                        customAllowance === mins && styles.allowancePillTextActive,
                      ]}
                    >
                      {mins === 0 ? 'Always Blocked' : `${mins}m / day`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActionsRow}>
                <TouchableOpacity
                  onPress={() => setShowAddCustom(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveCustomApp} style={styles.submitCustomBtn}>
                  <Text style={styles.submitCustomBtnText}>Add App to Shield</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* 4. SURGICAL BLOCKING SPOTLIGHT CARD */}
          <GlassCard style={styles.surgicalSpotlightCard}>
            <View style={styles.spotlightHeader}>
              <Scissors size={20} color={colors.primaryAccent} />
              <Text style={styles.spotlightTitle}>Surgical Blocker Mode</Text>
              {!profile.is_pro && (
                <View style={styles.proPillBadge}>
                  <Crown size={12} color="#FBBF24" />
                  <Text style={styles.proPillText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.spotlightDesc}>
              Keep productive messaging, search, and educational long-form videos active while
              laser-blocking addicting vertical reels feeds.
            </Text>
          </GlassCard>

          {/* 5. APPS LIST WITH PER-APP TIME LIMITS & 24H CYCLE PROGRESS */}
          <View style={styles.appsList}>
            {filteredCatalog.map((app) => {
              const matchedTarget = blockedTargets.find(
                (t) => t.package_or_token === app.packageName
              );
              const isEntirelyBlocked = matchedTarget !== undefined && !matchedTarget.is_surgical_feed_only;
              const isSurgicalBlocked = matchedTarget?.is_surgical_feed_only === true;
              const isTargetActive = matchedTarget !== undefined;

              const dailyLimit = matchedTarget?.daily_limit_minutes ?? 20;
              const timeSpent = matchedTarget?.time_spent_today_minutes ?? 0;
              const remainingMinutes = Math.max(0, dailyLimit - timeSpent);
              const isLimitReached = dailyLimit > 0 && timeSpent >= dailyLimit;
              const progressPct = dailyLimit > 0 ? Math.min(100, Math.round((timeSpent / dailyLimit) * 100)) : 100;
              const isEditingThisLimit = editingLimitPkg === app.packageName;

              return (
                <GlassCard key={app.packageName} style={styles.appCard}>
                  {/* Main App Row */}
                  <View style={styles.appRow}>
                    <View style={styles.appIconPlaceholder}>
                      <Text style={styles.appEmoji}>{app.emoji}</Text>
                    </View>
                    <View style={styles.appInfoCol}>
                      <View style={styles.appNameRow}>
                        <Text style={styles.appName}>{app.name}</Text>
                        {app.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom App</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.appUsage}>{app.packageName}</Text>
                    </View>
                    <Switch
                      value={isEntirelyBlocked}
                      onValueChange={(val) => handleToggleEntireApp(app, val)}
                      trackColor={{ false: colors.hairlineBorder, true: colors.primaryAccent }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Daily Allowance & Limit Configuration (Shown when app is enabled) */}
                  {isTargetActive && (
                    <View style={styles.allowanceSection}>
                      <View style={styles.allowanceHeaderRow}>
                        <View style={styles.allowanceTitleRow}>
                          <Clock size={14} color={isLimitReached ? colors.dangerAccent : colors.primaryAccent} />
                          <Text style={styles.allowanceLabel}>DAILY ALLOWANCE (24H CYCLE):</Text>
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            setEditingLimitPkg(isEditingThisLimit ? null : app.packageName)
                          }
                          style={[
                            styles.limitPill,
                            dailyLimit === 0 ? styles.limitPillHard : styles.limitPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.limitPillText,
                              dailyLimit === 0 ? styles.limitPillHardText : styles.limitPillActiveText,
                            ]}
                          >
                            {dailyLimit === 0 ? 'Always Blocked' : `${dailyLimit}m / day`}
                          </Text>
                          <Sliders size={12} color={dailyLimit === 0 ? colors.secondaryMutedText : colors.primaryAccent} />
                        </TouchableOpacity>
                      </View>

                      {/* Dropdown / Inline Allowance Preset Selector */}
                      {isEditingThisLimit && (
                        <View style={styles.presetDropdown}>
                          <Text style={styles.dropdownSubtitle}>
                            Select daily time allowance before app locks until 12:00 AM midnight:
                          </Text>
                          <View style={styles.presetOptionsGrid}>
                            {ALLOWANCE_PRESETS.map((p) => {
                              const isSelected = dailyLimit === p.minutes;
                              return (
                                <TouchableOpacity
                                  key={p.minutes}
                                  onPress={async () => {
                                    await setAppDailyLimit(app.packageName, p.minutes);
                                    setEditingLimitPkg(null);
                                  }}
                                  style={[
                                    styles.presetChoice,
                                    isSelected && styles.presetChoiceActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.presetChoiceText,
                                      isSelected && styles.presetChoiceTextActive,
                                    ]}
                                  >
                                    {p.label}
                                  </Text>
                                  <Text style={styles.presetChoiceSub}>{p.sub}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Progress Bar & 24h Cycle Tracking */}
                      {dailyLimit > 0 && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressHeaderRow}>
                            <Text style={styles.progressTimeText}>
                              {timeSpent}m / {dailyLimit}m used today
                            </Text>
                            <Text
                              style={[
                                styles.progressRemainingText,
                                isLimitReached && { color: colors.dangerAccent },
                              ]}
                            >
                              {isLimitReached ? 'Daily Limit Reached' : `${remainingMinutes}m left`}
                            </Text>
                          </View>

                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${progressPct}%`,
                                  backgroundColor:
                                    isLimitReached
                                      ? colors.dangerAccent
                                      : progressPct >= 75
                                      ? colors.warningAccent
                                      : colors.primaryAccent,
                                },
                              ]}
                            />
                          </View>

                          {/* Status Badge when limit is reached */}
                          {isLimitReached ? (
                            <View style={styles.limitReachedBanner}>
                              <Lock size={12} color={colors.dangerAccent} />
                              <Text style={styles.limitReachedText}>
                                LOCKED: 24h limit reached. Resets at 12:00 AM Midnight.
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.simRow}>
                              <Text style={styles.simHint}>Runs 12:00 AM to 12:00 AM cycle</Text>
                              <TouchableOpacity
                                onPress={() =>
                                  handleSimulateUsage(app.packageName, timeSpent, dailyLimit)
                                }
                                style={styles.simBtn}
                              >
                                <Text style={styles.simBtnText}>+5m Test</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Surgical Features Sub-Toggles */}
                  {app.supportsSurgical && (
                    <View style={styles.surgicalSubList}>
                      <View style={styles.surgicalItemRow}>
                        <View style={styles.surgicalDot} />
                        <View style={styles.surgicalTextCol}>
                          <Text style={styles.surgicalName}>{app.surgicalFeatureName}</Text>
                          <Text style={styles.surgicalDesc}>{app.surgicalDescription}</Text>
                        </View>
                        <Switch
                          value={isSurgicalBlocked}
                          onValueChange={(val) => handleToggleSurgical(app, val)}
                          trackColor={{
                            false: colors.hairlineBorder,
                            true: colors.positiveAccent,
                          }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 16) }]}>
          <PrimaryPillButton
            title="Done & Sync Rules"
            onPress={closeModal}
            rightIcon={<Check size={18} color={colors.primaryButtonText} />}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 5, 8, 0.85)',
    justifyContent: 'flex-end',
  },
  modalOverlayWide: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheetContainer: {
    backgroundColor: colors.obsidian,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    height: '94%',
  },
  sheetContainerWide: {
    width: '100%',
    maxWidth: 680,
    borderRadius: 28,
    borderWidth: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  title: {
    ...typography.titleLarge,
    fontSize: 18,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 2,
    fontSize: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  filterPillActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  filterText: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#08090D',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 32,
  },
  cycleCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  cycleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cycleTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  cycleDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  cycleBadgeRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  cyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cyclePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.positiveAccent,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addCustomBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#08090D',
  },
  customAppFormCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: colors.primaryAccent,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  formTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    color: colors.primaryText,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 11,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.primaryText,
    fontSize: 14,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChoicePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  catChoicePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: colors.primaryAccent,
  },
  catChoiceText: {
    fontSize: 11,
    color: colors.secondaryMutedText,
  },
  catChoiceTextActive: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  allowancePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allowancePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  allowancePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: colors.primaryAccent,
  },
  allowancePillText: {
    fontSize: 11,
    color: colors.secondaryMutedText,
  },
  allowancePillTextActive: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.elevatedCardSurface,
  },
  cancelBtnText: {
    ...typography.caption,
    color: colors.secondaryMutedText,
  },
  submitCustomBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primaryAccent,
  },
  submitCustomBtnText: {
    ...typography.caption,
    color: '#08090D',
    fontWeight: '800',
  },
  surgicalSpotlightCard: {
    padding: 16,
    marginBottom: 16,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  spotlightTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    color: colors.primaryAccent,
    flex: 1,
  },
  proPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
  },
  spotlightDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  appsList: {
    gap: 12,
  },
  appCard: {
    padding: 16,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appEmoji: {
    fontSize: 22,
  },
  appInfoCol: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    ...typography.titleMedium,
    fontSize: 15,
  },
  customBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 9,
    color: colors.positiveAccent,
    fontWeight: '800',
  },
  appUsage: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
  },
  allowanceSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  allowanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allowanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allowanceLabel: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.secondaryMutedText,
    fontWeight: '700',
  },
  limitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  limitPillText: {
    fontSize: 11,
  },
  limitPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  limitPillActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  limitPillHard: {
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
  },
  limitPillHardText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryMutedText,
  },
  presetDropdown: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  dropdownSubtitle: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    marginBottom: 8,
  },
  presetOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChoice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.obsidian,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  presetChoiceActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  presetChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  presetChoiceTextActive: {
    color: '#08090D',
  },
  presetChoiceSub: {
    fontSize: 9,
    color: colors.secondaryMutedText,
    marginTop: 1,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTimeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: '600',
  },
  progressRemainingText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.positiveAccent,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hairlineBorder,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  limitReachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  limitReachedText: {
    fontSize: 10,
    color: colors.dangerAccent,
    fontWeight: '700',
  },
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  simHint: {
    fontSize: 10,
    color: colors.tertiaryText,
  },
  simBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  simBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  surgicalSubList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  surgicalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  surgicalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positiveAccent,
    marginRight: 8,
  },
  surgicalTextCol: {
    flex: 1,
    marginRight: 8,
  },
  surgicalName: {
    ...typography.bodyMedium,
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  surgicalDesc: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.obsidian,
  },
});

export default BlockListPickerModal;
