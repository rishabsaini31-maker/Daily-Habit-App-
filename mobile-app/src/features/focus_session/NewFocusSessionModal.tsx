import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Clock, ShieldCheck, ChevronRight, Zap, Lock, Users } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

const DURATION_PRESETS = [
  { minutes: 15, label: '15m', sub: 'Quick Sprint' },
  { minutes: 25, label: '25m', sub: 'Pomodoro' },
  { minutes: 45, label: '45m', sub: 'Deep Work' },
  { minutes: 60, label: '60m', sub: 'Flow State' },
  { minutes: 120, label: '2h', sub: 'Monk Mode' },
];

export const NewFocusSessionModal: React.FC = () => {
  const { closeModal, openModal } = useAppNavigation();
  const { startSession, blockedTargets, profile } = useFocusEngine();
  const { bottomInset, isWide } = useResponsiveLayout();

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [strictness, setStrictness] = useState<'normal' | 'deep_focus' | 'friend_or_nfc'>('normal');
  const [sessionTitle, setSessionTitle] = useState<string>('Deep Work Sprint');

  const handleSelectStrictness = (mode: 'normal' | 'deep_focus' | 'friend_or_nfc') => {
    if ((mode === 'deep_focus' || mode === 'friend_or_nfc') && !profile.is_pro) {
      Alert.alert(
        'Pro Feature',
        'Deep Focus (Hardcore Mode) and Friend Lock require Opal Pro.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Pro Pass', onPress: () => openModal('paywall') },
        ]
      );
      return;
    }
    setStrictness(mode);
  };

  const handleStart = async () => {
    await startSession(sessionTitle, selectedDuration, strictness);
    closeModal();
  };

  return (
    <View style={[styles.modalOverlay, isWide && styles.modalOverlayWide]}>
      <View style={[styles.sheetContainer, isWide && styles.sheetContainerWide]}>
        {/* Top Header */}
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
              onPress={() => handleSelectStrictness('normal')}
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

            {/* Deep Focus (Hardcore) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectStrictness('deep_focus')}
            >
              <GlassCard
                style={[
                  styles.strictnessCard,
                  strictness === 'deep_focus' && styles.strictnessCardActive,
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
                    <View style={styles.titleWithBadge}>
                      <Text
                        style={[
                          styles.strictTitle,
                          strictness === 'deep_focus' && { color: colors.dangerAccent },
                        ]}
                      >
                        Deep Focus (Hardcore Mode)
                      </Text>
                      {!profile.is_pro && (
                        <View style={styles.proTag}>
                          <Text style={styles.proTagText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.strictDesc}>
                      Unbreakable lock. Anti-uninstall guard active. No cancelling allowed.
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Friend Lock / NFC */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectStrictness('friend_or_nfc')}
            >
              <GlassCard
                style={[
                  styles.strictnessCard,
                  strictness === 'friend_or_nfc' && styles.strictnessCardActive,
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
                    <View style={styles.titleWithBadge}>
                      <Text style={styles.strictTitle}>Friend & NFC Hardware Lock</Text>
                      {!profile.is_pro && (
                        <View style={styles.proTag}>
                          <Text style={styles.proTagText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.strictDesc}>
                      Requires partner approval code or physical NFC desk tap to unlock
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
                    {blockedTargets.length} Rules Active in Local-First Cache
                  </Text>
                  <Text style={styles.appPickerSub}>
                    Configure apps, tokens & surgical shorts locks
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.secondaryMutedText} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        </ScrollView>

        {/* Start Button */}
        <View style={[styles.sheetFooter, { paddingBottom: Math.max(bottomInset, 16) }]}>
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
    maxHeight: '90%',
  },
  sheetContainerWide: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 28,
    borderWidth: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
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
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proTag: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
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
