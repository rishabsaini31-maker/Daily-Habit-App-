import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

const SCREEN_TIME_PRESETS = [
  { hours: 2.5, label: '2 - 3 Hours', tier: 'Moderate User', desc: 'Typical casual check-ins & messaging' },
  { hours: 4.5, label: '4 - 5 Hours', tier: 'High User', desc: 'Average modern smartphone consumer' },
  { hours: 6.5, label: '6 - 7 Hours', tier: 'Intense User', desc: 'Heavy doomscrolling and constant multitasking' },
  { hours: 8.5, label: '8+ Hours', tier: 'Extreme Loop', desc: 'Over half your waking day on device' },
];

export const Step3ScreenTimeInput: React.FC = () => {
  const { dailyScreenHours, setDailyHours, nextStep, prevStep } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepIndicator}>STEP 3 OF 5</Text>
        <Text style={styles.title}>Estimate your daily screen time</Text>
        <Text style={styles.subtitle}>
          Check your iOS Screen Time or Android Digital Wellbeing report if unsure.
        </Text>

        <View style={styles.presetsList}>
          {SCREEN_TIME_PRESETS.map((preset) => {
            const isSelected = Math.abs(dailyScreenHours - preset.hours) < 0.2;
            return (
              <TouchableOpacity
                key={preset.label}
                activeOpacity={0.8}
                onPress={() => setDailyHours(preset.hours)}
              >
                <GlassCard
                  style={[
                    styles.presetCard,
                    isSelected && styles.presetCardActive,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.hoursTitle, isSelected && styles.hoursTitleActive]}>
                        {preset.label}
                      </Text>
                      <Text style={styles.tierBadge}>{preset.tier}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </View>
                  <Text style={styles.presetDesc}>{preset.desc}</Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.ctaWrapper}>
            <PrimaryPillButton
              title={`Calculate Impact (${dailyScreenHours} hrs/day)`}
              onPress={nextStep}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
    justifyContent: 'center',
  },
  stepIndicator: {
    ...typography.caption,
    color: colors.primaryAccent,
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  title: {
    ...typography.displayMedium,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginBottom: 24,
  },
  presetsList: {
    gap: 12,
  },
  presetCard: {
    padding: 16,
  },
  presetCardActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hoursTitle: {
    ...typography.titleLarge,
    fontSize: 18,
  },
  hoursTitleActive: {
    color: colors.primaryAccent,
  },
  tierBadge: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  presetDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 4,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primaryAccent,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryAccent,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.obsidian,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
  },
  ctaWrapper: {
    flex: 1,
    marginLeft: 12,
  },
});

export default Step3ScreenTimeInput;
