import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Clock, ShieldCheck, ChevronRight, Zap, Lock, Users, Sparkles } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import ChronographClock from '../../core/theme/components/ChronographClock';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

const DURATION_PRESETS = [
  { minutes: 25, label: '25m', sub: 'Pomodoro' },
  { minutes: 45, label: '45m', sub: 'Deep Work' },
  { minutes: 60, label: '60m', sub: 'Flow State' },
  { minutes: 90, label: '90m', sub: 'Hyperfocus' },
];

export const NewFocusSessionModal: React.FC = () => {
  const { closeModal, openModal } = useAppNavigation();
  const { startSession, blockedTargets, profile } = useFocusEngine();
  const { bottomInset, isWide } = useResponsiveLayout();

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [strictness, setStrictness] = useState<'normal' | 'deep_focus' | 'friend_or_nfc'>('normal');
  const [sessionTitle, setSessionTitle] = useState<string>('Deep Focus Sprint');

  const handleSelectStrictness = (mode: 'normal' | 'deep_focus' | 'friend_or_nfc') => {
    if ((mode === 'deep_focus' || mode === 'friend_or_nfc') && !profile.is_pro) {
      Alert.alert(
        'DHI Pro Feature',
        'Deep Focus (Hardcore Mode) and Friend Lock require DHI Pro.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View DHI Pro Pass', onPress: () => openModal('paywall') },
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

  const isDeep = strictness === 'deep_focus';

  return (
    <View style={[styles.modalOverlay, isWide && styles.modalOverlayWide]}>
      <View style={[styles.sheetContainer, isWide && styles.sheetContainerWide]}>
        {/* Top Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleCol}>
            <Text style={styles.sheetTitle}>New Focus Session</Text>
            <Text style={styles.sheetSubtitle}>Precision Mechanical Chronograph</Text>
          </View>
          <TouchableOpacity onPress={closeModal} style={styles.closeBtn} accessibilityLabel="Close">
            <X size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* 1. Precision 60-Tick Chronograph Dial & Countdown */}
          <View style={styles.clockContainer}>
            <ChronographClock
              totalSeconds={selectedDuration * 60}
              remainingSeconds={selectedDuration * 60}
              size={220}
              strokeWidth={7}
              strictness={strictness}
              interactive={true}
              blockedAppsCount={blockedTargets.length}
            />
          </View>

          {/* 2. Interactive Quick-Select Duration Preset Pills */}
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
                    if (preset.minutes === 25) setSessionTitle('Pomodoro Focus');
                    if (preset.minutes === 45) setSessionTitle('Deep Work Sprint');
                    if (preset.minutes === 60) setSessionTitle('Flow State Block');
                    if (preset.minutes === 90) setSessionTitle('Hyperfocus Chamber');
                  }}
                  style={styles.durationPillWrapper}
                >
                  <GlassCard
                    style={[
                      styles.durationCard,
                      isSelected && (isDeep ? styles.durationCardActiveGold : styles.durationCardActive),
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationLabel,
                        isSelected && (isDeep ? { color: '#FBBF24' } : styles.durationLabelActive),
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

          {/* 3. Segmented Strictness Mode Selector */}
          <Text style={styles.sectionLabel}>LOCK STRICTNESS</Text>
          <View style={styles.segmentedSelector}>
            {/* Standard Mode */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectStrictness('normal')}
              style={[
                styles.segmentItem,
                strictness === 'normal' && styles.segmentItemActiveNormal,
              ]}
            >
              <Zap size={16} color={strictness === 'normal' ? colors.primaryAccent : colors.secondaryMutedText} />
              <Text
                style={[
                  styles.segmentLabel,
                  strictness === 'normal' && { color: colors.primaryAccent, fontWeight: '700' },
                ]}
              >
                Standard
              </Text>
            </TouchableOpacity>

            {/* Deep Focus Mode (Gold Accent) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectStrictness('deep_focus')}
              style={[
                styles.segmentItem,
                strictness === 'deep_focus' && styles.segmentItemActiveGold,
              ]}
            >
              <Lock size={15} color={strictness === 'deep_focus' ? '#FBBF24' : colors.secondaryMutedText} />
              <View style={styles.segmentGoldCol}>
                <Text
                  style={[
                    styles.segmentLabel,
                    strictness === 'deep_focus' && { color: '#FBBF24', fontWeight: '800' },
                  ]}
                >
                  Deep Focus 🔒
                </Text>
              </View>
              {!profile.is_pro && (
                <View style={styles.proMicroBadge}>
                  <Text style={styles.proMicroText}>PRO</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Detailed strictness card explanation */}
          <GlassCard style={styles.modeDescriptionCard}>
            <View style={styles.modeDescRow}>
              {strictness === 'deep_focus' ? (
                <>
                  <Lock size={16} color="#FBBF24" />
                  <Text style={[styles.modeDescText, { color: '#FDF6B2' }]}>
                    Deep Focus Mode: Unbreakable OS lock. Prevents uninstallation and session cancellation until the timer completes.
                  </Text>
                </>
              ) : (
                <>
                  <Zap size={16} color={colors.primaryAccent} />
                  <Text style={styles.modeDescText}>
                    Standard Mode: Intercepts distracting apps with screen shields. Can be stopped early with mindful intent.
                  </Text>
                </>
              )}
            </View>
          </GlassCard>

          {/* 4. Blocked Targets Card */}
          <Text style={styles.sectionLabel}>PROTECTED APPS</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openModal('block_list_picker')}
          >
            <GlassCard style={styles.appPickerCard}>
              <View style={styles.appPickerRow}>
                <ShieldCheck size={20} color={colors.positiveAccent} />
                <View style={styles.appPickerTextCol}>
                  <Text style={styles.appPickerTitle}>
                    {blockedTargets.length} Apps & Categories Shielded
                  </Text>
                  <Text style={styles.appPickerSub}>
                    Surgical Reels & Shorts blocking active
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
    backgroundColor: 'rgba(4, 5, 8, 0.88)',
    justifyContent: 'flex-end',
  },
  modalOverlayWide: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheetContainer: {
    backgroundColor: colors.obsidian,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '92%',
  },
  sheetContainerWide: {
    width: '100%',
    maxWidth: 580,
    borderRadius: 32,
    borderWidth: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.titleLarge,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetSubtitle: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  scrollBody: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 14,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  durationPillWrapper: {
    flex: 1,
  },
  durationCard: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  durationCardActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  durationCardActiveGold: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  durationLabel: {
    ...typography.titleMedium,
    fontSize: 16,
    fontWeight: '700',
  },
  durationLabelActive: {
    color: colors.primaryAccent,
  },
  durationSub: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  segmentedSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 20, 29, 0.95)',
    borderRadius: 18,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
  },
  segmentItemActiveNormal: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  segmentItemActiveGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  segmentGoldCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryMutedText,
  },
  proMicroBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 4,
  },
  proMicroText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
  },
  modeDescriptionCard: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  modeDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeDescText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  appPickerCard: {
    padding: 14,
    borderRadius: 16,
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appPickerSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
    marginTop: 2,
  },
  sheetFooter: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.obsidian,
  },
});

export default NewFocusSessionModal;
