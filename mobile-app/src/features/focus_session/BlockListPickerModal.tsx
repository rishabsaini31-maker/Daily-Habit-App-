import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { X, Sparkles, Check, Scissors } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';

export const BlockListPickerModal: React.FC = () => {
  const { closeModal } = useAppNavigation();
  const { apps, toggleAppBlock, toggleSurgicalBlock } = useNativeBlocker();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'social' | 'entertainment' | 'gaming'>('all');

  const filteredApps = apps.filter((app) => {
    if (selectedFilter === 'all') return true;
    return app.category === selectedFilter;
  });

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Block List & Surgical Picker</Text>
            <Text style={styles.subtitle}>
              Lock whole apps or surgically remove infinite scroll features
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
            </View>
            <Text style={styles.spotlightDesc}>
              Keep productive messaging, search, and educational long-form videos active while
              laser-blocking addicting vertical reels feeds.
            </Text>
          </GlassCard>

          {/* Apps List */}
          <Text style={styles.sectionHeader}>INSTALLED APPS & SURGICAL RULES</Text>
          <View style={styles.appsList}>
            {filteredApps.map((app) => (
              <GlassCard key={app.id} style={styles.appCard}>
                {/* Main App Row */}
                <View style={styles.appRow}>
                  <View style={styles.appIconPlaceholder}>
                    <Text style={styles.appEmoji}>
                      {app.name === 'Instagram'
                        ? '📸'
                        : app.name === 'YouTube'
                        ? '▶️'
                        : app.name === 'TikTok'
                        ? '🎵'
                        : app.name.includes('Twitter')
                        ? '🐦'
                        : '📱'}
                    </Text>
                  </View>
                  <View style={styles.appInfoCol}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appUsage}>{app.dailyUsageMinutes} mins/day</Text>
                  </View>
                  <Switch
                    value={app.isEntireAppBlocked}
                    onValueChange={(val) => toggleAppBlock(app.id, val)}
                    trackColor={{ false: colors.hairlineBorder, true: colors.primaryAccent }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Surgical Features Sub-Toggles */}
                {app.surgicalFeatures && app.surgicalFeatures.length > 0 && (
                  <View style={styles.surgicalSubList}>
                    <Text style={styles.surgicalSubHeader}>Surgical Feed Locks:</Text>
                    {app.surgicalFeatures.map((feat) => (
                      <View key={feat.id} style={styles.surgicalItemRow}>
                        <View style={styles.surgicalDot} />
                        <View style={styles.surgicalTextCol}>
                          <Text style={styles.surgicalName}>{feat.name}</Text>
                          <Text style={styles.surgicalDesc}>{feat.description}</Text>
                        </View>
                        <Switch
                          value={feat.isBlocked}
                          onValueChange={(val) =>
                            toggleSurgicalBlock(app.id, feat.id, val)
                          }
                          trackColor={{
                            false: colors.hairlineBorder,
                            true: colors.positiveAccent,
                          }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <PrimaryPillButton
            title="Done & Save Block Rules"
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
  sheetContainer: {
    backgroundColor: colors.obsidian,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    height: '92%',
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
  },
  surgicalSubList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  surgicalSubHeader: {
    ...typography.caption,
    fontSize: 10,
    color: colors.positiveAccent,
    marginBottom: 8,
  },
  surgicalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
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
