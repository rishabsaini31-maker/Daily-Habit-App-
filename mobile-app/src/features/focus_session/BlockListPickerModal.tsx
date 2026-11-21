import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { X, Check, Scissors, Crown } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import { SyncBlockedTarget } from '../../services/sync/SyncService';

interface AppItem {
  packageName: string;
  name: string;
  category: 'social' | 'entertainment' | 'gaming';
  emoji: string;
  supportsSurgical: boolean;
  surgicalFeatureName?: string;
  surgicalDescription?: string;
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
    packageName: 'com.supercell.clashroyale',
    name: 'Clash Royale',
    category: 'gaming',
    emoji: '🎮',
    supportsSurgical: false,
  },
];

export const BlockListPickerModal: React.FC = () => {
  const { closeModal, openModal } = useAppNavigation();
  const { blockedTargets, addBlockedTarget, removeBlockedTarget, profile } = useFocusEngine();
  const { bottomInset, isWide } = useResponsiveLayout();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'social' | 'entertainment' | 'gaming'>('all');

  const filteredCatalog = APPS_CATALOG.filter((app) => {
    if (selectedFilter === 'all') return true;
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
        'Surgical Reels & Shorts blocking is an Opal Pro exclusive feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Pro', onPress: () => openModal('paywall') },
        ]
      );
      return;
    }

    const target: SyncBlockedTarget = {
      id: Math.random().toString(36).substring(2, 9),
      platform: 'android',
      package_or_token: app.packageName,
      display_name: app.name,
      is_surgical_feed_only: enableSurgical,
    };
    await addBlockedTarget(target);
  };

  return (
    <View style={[styles.modalOverlay, isWide && styles.modalOverlayWide]}>
      <View style={[styles.sheetContainer, isWide && styles.sheetContainerWide]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Block List & Surgical Picker</Text>
            <Text style={styles.subtitle}>
              Offline-first mirror synced with Supabase PostgreSQL
            </Text>
          </View>
          <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
            <X size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.filterBar}>
          {(['all', 'social', 'entertainment', 'gaming'] as const).map((filter) => {
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
          {/* SURGICAL BLOCKING SPOTLIGHT CARD */}
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

          {/* Apps List */}
          <Text style={styles.sectionHeader}>INSTALLED TARGETS & LOCAL CACHE RULES</Text>
          <View style={styles.appsList}>
            {filteredCatalog.map((app) => {
              const matchedTarget = blockedTargets.find(
                (t) => t.package_or_token === app.packageName
              );
              const isEntirelyBlocked = matchedTarget !== undefined && !matchedTarget.is_surgical_feed_only;
              const isSurgicalBlocked = matchedTarget?.is_surgical_feed_only === true;

              return (
                <GlassCard key={app.packageName} style={styles.appCard}>
                  {/* Main App Row */}
                  <View style={styles.appRow}>
                    <View style={styles.appIconPlaceholder}>
                      <Text style={styles.appEmoji}>{app.emoji}</Text>
                    </View>
                    <View style={styles.appInfoCol}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={styles.appUsage}>{app.packageName}</Text>
                    </View>
                    <Switch
                      value={isEntirelyBlocked}
                      onValueChange={(val) => handleToggleEntireApp(app, val)}
                      trackColor={{ false: colors.hairlineBorder, true: colors.primaryAccent }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

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
    height: '92%',
  },
  sheetContainerWide: {
    width: '100%',
    maxWidth: 640,
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
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.secondaryMutedText,
  },
  filterTextActive: {
    color: colors.primaryButtonText,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 24,
  },
  surgicalSpotlightCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
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
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 10,
    letterSpacing: 1.2,
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
  appName: {
    ...typography.titleMedium,
    fontSize: 15,
  },
  appUsage: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
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
