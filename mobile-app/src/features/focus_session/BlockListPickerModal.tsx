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
  Modal,
  Image,
} from 'react-native';
import {
  X,
  Plus,
  Clock,
  Sliders,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Info,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';
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
    profile,
  } = useFocusEngine();
  const { apps: nativeApps } = useNativeBlocker();
  const { bottomInset, isWide } = useResponsiveLayout();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'social' | 'entertainment' | 'gaming' | 'custom'>('all');
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [editingLimitPkg, setEditingLimitPkg] = useState<string | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

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

  return (
    <View style={[styles.modalOverlay, isWide && styles.modalOverlayWide]}>
      <View style={[styles.sheetContainer, isWide && styles.sheetContainerWide]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>App limits</Text>
            <Text style={styles.subtitle}>
              Set your daily limits
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={showAddCustom ? 'Close add app form' : 'Add custom app'}
            onPress={() => setShowAddCustom(!showAddCustom)}
            style={styles.addCustomBtn}
          >
            <Plus size={14} color={colors.primaryButtonText} />
            <Text style={styles.addCustomBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
            <X size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {(['all', 'social', 'entertainment', 'gaming', ...(allApps.some((app) => app.isCustom) ? ['custom' as const] : [])] as const).map((filter) => {
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
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listIntro}>
            Limit entire apps or just Reels and Shorts.
          </Text>

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

          <View style={styles.appsList}>
            {filteredCatalog.map((app) => {
              const matchedTarget = blockedTargets.find(
                (t) => t.package_or_token === app.packageName
              );
              const isEntirelyBlocked = matchedTarget !== undefined && !matchedTarget.is_surgical_feed_only;
              const isSurgicalBlocked = matchedTarget?.is_surgical_feed_only === true;
              const isTargetActive = matchedTarget !== undefined;

              const dailyLimit = matchedTarget?.daily_limit_minutes ?? 20;
              const isEditingThisLimit = editingLimitPkg === app.packageName;

              // Find native app icon
              const nativeApp = nativeApps.find((na) => na.id === app.packageName);
              const iconUri = nativeApp?.iconBase64;

              const ruleSubtitle = isSurgicalBlocked
                ? app.name === 'Instagram'
                  ? 'Reels only'
                  : app.name === 'YouTube'
                  ? 'Shorts only'
                  : 'Surgical feed only'
                : isEntirelyBlocked
                ? 'Entire app'
                : 'Not restricted';

              return (
                <GlassCard key={app.packageName} style={styles.appCard}>
                  {/* Figma 09: Top Row with Real Icon, Name, Subtitle, and Switch */}
                  <View style={styles.appRow}>
                    <View style={styles.appIconBackplate}>
                      {iconUri ? (
                        <Image source={{ uri: iconUri }} style={styles.realAppIcon} resizeMode="contain" />
                      ) : (
                        <Text style={styles.appIconInitial}>{app.name.charAt(0)}</Text>
                      )}
                    </View>
                    <View style={styles.appInfoCol}>
                      <View style={styles.appNameRow}>
                        <Text style={styles.appName}>{app.name}</Text>
                        {app.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.appRuleSubtitle}>{ruleSubtitle}</Text>
                    </View>
                    <Switch
                      value={isTargetActive}
                      onValueChange={(val) => handleToggleEntireApp(app, val)}
                      trackColor={{ false: '#26364E', true: colors.primaryAccent }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Surgical Sub-option if supported */}
                  {app.supportsSurgical && isTargetActive && (
                    <View style={styles.surgicalSubOptionRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleToggleSurgical(app, !isSurgicalBlocked)}
                        style={[
                          styles.surgicalToggleBtn,
                          isSurgicalBlocked && styles.surgicalToggleBtnActive,
                        ]}
                      >
                        <Text style={[styles.surgicalToggleText, isSurgicalBlocked && styles.surgicalToggleTextActive]}>
                          {app.name === 'Instagram' ? 'Block Reels Only (Keep DMs)' : 'Block Shorts Only'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Divider line per Figma */}
                  <View style={styles.appCardDivider} />

                  {/* Daily Allowance & Limit Configuration */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setEditingLimitPkg(isEditingThisLimit ? null : app.packageName)}
                    style={styles.dailyAllowanceRow}
                  >
                    <Text style={styles.dailyAllowanceLabel}>Daily allowance</Text>
                    <View style={styles.dailyAllowanceValueRow}>
                      <Text style={styles.dailyAllowanceValue}>
                        {!isTargetActive ? 'Unrestricted' : dailyLimit === 0 ? 'Always blocked' : `${dailyLimit} min / day`}
                      </Text>
                      <ChevronRight size={14} color={colors.secondaryMutedText} />
                    </View>
                  </TouchableOpacity>

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
                </GlassCard>
              );
            })}
          </View>

          {/* Figma 09: Explanatory section */}
          <View style={styles.bottomExplainerCard}>
            <Text style={styles.bottomExplainerTitle}>Set your daily limits</Text>
            <Text style={styles.bottomExplainerSubtitle}>
              Limit entire apps or just Reels and Shorts.
            </Text>

            <View style={styles.midnightResetBox}>
              <Info size={16} color={colors.primaryAccent} />
              <View style={styles.midnightResetTextCol}>
                <Text style={styles.midnightResetHeading}>Daily limits reset at midnight.</Text>
                <Text style={styles.midnightResetDesc}>Each day runs from 12:00 AM to 12:00 AM.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer (Figma 09) */}
        <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 16) }]}>
          <PrimaryPillButton
            title="Save app limits"
            onPress={() => setShowSaveConfirmation(true)}
            rightIcon={<ArrowRight size={16} color={colors.primaryButtonText} />}
            style={styles.saveLimitsPill}
          />
          <Text style={styles.footerCaption}>
            Reels & Shorts rules keep messages available.
          </Text>
        </View>
      </View>

      <Modal
        visible={showSaveConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveConfirmation(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationTitle}>App limits saved</Text>
            <Text style={styles.confirmationDescription}>
              Your {blockedTargets.length} app rules are saved. Daily allowances reset at midnight.
            </Text>
            <PrimaryPillButton title="Back to focus" onPress={closeModal} />
            <TouchableOpacity
              style={styles.keepEditingButton}
              onPress={() => setShowSaveConfirmation(false)}
            >
              <Text style={styles.keepEditingText}>Keep editing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 19,
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
    paddingVertical: 10,
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
    textTransform: 'none',
  },
  filterTextActive: {
    color: colors.primaryButtonText,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 32,
    gap: 12,
  },
  listIntro: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
    marginBottom: 2,
  },
  cycleCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: colors.primaryAccent,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  addCustomBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryButtonText,
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
    backgroundColor: colors.primaryAccentGlow,
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
    backgroundColor: colors.primaryAccentGlow,
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
    borderRadius: 19,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
    marginBottom: 4,
  },
  appTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconBackplate: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#293D61',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  realAppIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  appIconInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  appTextCol: {
    flex: 1,
  },
  appRuleSubtitle: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    marginTop: 1,
  },
  appCardDivider: {
    height: 1,
    backgroundColor: '#2A2D36',
    marginVertical: 12,
  },
  dailyAllowanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dailyAllowanceLabel: {
    fontSize: 14,
    color: colors.subtleSlate,
  },
  dailyAllowanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyAllowanceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
  },
  surgicalSubOptionRow: {
    marginTop: 8,
  },
  surgicalToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#152131',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  surgicalToggleBtnActive: {
    backgroundColor: 'rgba(165, 217, 200, 0.15)',
    borderColor: colors.positiveAccent,
  },
  surgicalToggleText: {
    fontSize: 12,
    color: colors.secondaryMutedText,
  },
  surgicalToggleTextActive: {
    color: colors.positiveAccent,
    fontWeight: '600',
  },
  bottomExplainerCard: {
    paddingVertical: 18,
    gap: 6,
  },
  bottomExplainerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  bottomExplainerSubtitle: {
    fontSize: 16,
    color: colors.subtleSlate,
  },
  midnightResetBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#152131',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  midnightResetTextCol: {
    flex: 1,
    gap: 2,
  },
  midnightResetHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  midnightResetDesc: {
    fontSize: 13,
    color: colors.subtleSlate,
  },
  saveLimitsPill: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryAccent,
  },
  footerCaption: {
    fontSize: 13,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginTop: 8,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 13,
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
    backgroundColor: colors.primaryAccentGlow,
    borderColor: colors.primaryAccent,
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
  resetNote: {
    ...typography.bodySmall,
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 9,
  },
  confirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  confirmationCard: {
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: 16,
    padding: 18,
  },
  confirmationTitle: {
    ...typography.titleLarge,
    fontSize: 17,
    marginBottom: 8,
  },
  confirmationDescription: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: 15,
  },
  keepEditingButton: {
    height: 40,
    marginTop: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  keepEditingText: {
    ...typography.bodySmall,
    color: colors.primaryText,
  },
});

export default BlockListPickerModal;
