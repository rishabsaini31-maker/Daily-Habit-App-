import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Clock, ShieldCheck, ChevronRight, Zap, Lock, Users } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';
import { StrictnessLevel } from '../../services/native_blocker/types';

const DURATION_PRESETS = [
  { minutes: 15, label: '15m', sub: 'Quick Sprint' },
  { minutes: 25, label: '25m', sub: 'Pomodoro' },
  { minutes: 45, label: '45m', sub: 'Deep Work' },
  { minutes: 60, label: '60m', sub: 'Flow State' },
  { minutes: 120, label: '2h', sub: 'Monk Mode' },
];

export const NewFocusSessionModal: React.FC = () => {
  const { closeModal, openModal } = useAppNavigation();
  const { startSession, apps } = useNativeBlocker();

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [strictness, setStrictness] = useState<StrictnessLevel>('normal');
  const [sessionTitle, setSessionTitle] = useState<string>('Deep Work Sprint');

  const blockedAppsCount = apps.filter((a) => a.isEntireAppBlocked).length;

  const handleStart = async () => {
    await startSession({
      id: Date.now().toString(),
      title: sessionTitle,
      durationMinutes: selectedDuration,
      strictness,
      blockedAppIds: apps.filter((a) => a.isEntireAppBlocked).map((a) => a.id),
      surgicalFeatureIds: ['reels', 'shorts', 'fyp'],
      autoDoNotDisturb: true,
    });
    closeModal();
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.sheetContainer}>
        {/* Top Drag Handle & Close */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleCol}>
            <Text style={styles.sheetTitle}>New Focus Session</Text>
            <Text style={styles.sheetSubtitle}>Configure duration and strictness</Text>
          </View>
          <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
            <X size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Duration Selector */}
          <Text style={styles.sectionLabel}>SESSION DURATION</Text>
          <View style={styles.durationRow}>
            {DURATION_PRESETS.map((preset) => {
              const isSelected = selectedDuration === preset.minutes;
              return (
                <TouchableOpacity
                  key={preset.minutes}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedDuration(preset.minutes);
                    if (preset.minutes === 45) setSessionTitle('Deep Work');
                    if (preset.minutes === 25) setSessionTitle('Pomodoro Sprint');
                    if (preset.minutes === 120) setSessionTitle('Monk Mode Session');
                  }}
                  style={styles.durationPillWrapper}
                >
                  <GlassCard
                    style={[
                      styles.durationCard,
                      isSelected && styles.durationCardActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationLabel,
                        isSelected && styles.durationLabelActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text style={styles.durationSub}>{preset.sub}</Text>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Strictness Level */}
          <Text style={styles.sectionLabel}>STRICTNESS LEVEL</Text>
          <View style={styles.strictnessList}>
            {/* Normal */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStrictness('normal')}
            >
              <GlassCard
                style={[
                  styles.strictnessCard,
                  strictness === 'normal' && styles.strictnessCardActive,
                ]}
              >
                <View style={styles.strictRow}>
                  <View style={styles.strictIconCircle}>
                    <Zap size={20} color={colors.primaryAccent} />
                  </View>
                  <View style={styles.strictTextCol}>
                    <Text style={styles.strictTitle}>Normal Friction</Text>
                    <Text style={styles.strictDesc}>
                      Can pause session with a 10-second mindful breathing delay
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Hardcore */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStrictness('hardcore')}
            >
              <GlassCard
                style={[
                  styles.strictnessCard,
                  strictness === 'hardcore' && styles.strictnessCardActive,
                ]}
              >
                <View style={styles.strictRow}>
                  <View
                    style={[
                      styles.strictIconCircle,
                      { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                    ]}
                  >
                    <Lock size={20} color={colors.dangerAccent} />
                  </View>
                  <View style={styles.strictTextCol}>
                    <Text style={[styles.strictTitle, strictness === 'hardcore' && { color: colors.dangerAccent }]}>
                      Hardcore Mode (Unbreakable)
                    </Text>
                    <Text style={styles.strictDesc}>
                      No pausing, no cancelling, anti-uninstall protection enabled
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Friend Lock */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStrictness('friend_lock')}
            >
              <GlassCard
                style={[
                  styles.strictnessCard,
                  strictness === 'friend_lock' && styles.strictnessCardActive,
                ]}
              >
                <View style={styles.strictRow}>
                  <View
                    style={[
                      styles.strictIconCircle,
                      { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                    ]}
                  >
                    <Users size={20} color={colors.positiveAccent} />
                  </View>
                  <View style={styles.strictTextCol}>
                    <Text style={styles.strictTitle}>Friend Lock Partner</Text>
                    <Text style={styles.strictDesc}>
                      Requires partner approval code to cancel or unlock early
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>

          {/* Block List Nested Modal Shortcut */}
          <Text style={styles.sectionLabel}>BLOCKED TARGETS</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openModal('block_list_picker')}
          >
            <GlassCard style={styles.appPickerCard}>
              <View style={styles.appPickerRow}>
                <ShieldCheck size={20} color={colors.primaryAccent} />
                <View style={styles.appPickerTextCol}>
                  <Text style={styles.appPickerTitle}>
                    {blockedAppsCount} Apps & Surgical Reels Blocked
                  </Text>
                  <Text style={styles.appPickerSub}>
                    Tap to edit apps and shorts toggles
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.secondaryMutedText} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        </ScrollView>

        {/* Start Button */}
        <View style={styles.sheetFooter}>
          <PrimaryPillButton
            title={`Lock In for ${selectedDuration} Minutes`}
            onPress={handleStart}
            leftIcon={<Clock size={18} color={colors.primaryButtonText} />}
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
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.titleLarge,
  },
  sheetSubtitle: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: 1.2,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durationPillWrapper: {
    flex: 1,
  },
  durationCard: {
    padding: 12,
    alignItems: 'center',
  },
  durationCardActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  durationLabel: {
    ...typography.titleMedium,
    fontSize: 16,
  },
  durationLabelActive: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  durationSub: {
    ...typography.bodySmall,
    fontSize: 9,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  strictnessList: {
    gap: 10,
    marginBottom: 16,
  },
  strictnessCard: {
    padding: 14,
  },
  strictnessCardActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  strictRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strictIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  strictTextCol: {
    flex: 1,
  },
  strictTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    marginBottom: 2,
  },
  strictDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
  },
  appPickerCard: {
    padding: 16,
    marginBottom: 8,
  },
  appPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appPickerTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  appPickerTitle: {
    ...typography.titleMedium,
    fontSize: 14,
  },
  appPickerSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
  },
  sheetFooter: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.obsidian,
  },
});

export default NewFocusSessionModal;
