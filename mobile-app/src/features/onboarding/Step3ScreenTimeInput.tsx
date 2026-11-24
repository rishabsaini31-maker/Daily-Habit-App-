import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

const SCREEN_TIME_PRESETS = [
  { hours: 1.5, label: 'Under 2', suffix: 'hours' },
  { hours: 2.5, label: '2–3', suffix: 'hours' },
  { hours: 4.5, label: '4–5', suffix: 'hours' },
  { hours: 6.5, label: '6–7', suffix: 'hours' },
  { hours: 8.5, label: '8+', suffix: 'hours' },
];

export const Step3ScreenTimeInput: React.FC = () => {
  const { dailyScreenHours, setDailyHours, nextStep, prevStep } = useOnboarding();
  const [notSureSelected, setNotSureSelected] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={18} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Focus setup</Text>
          <Text style={styles.stepCount}>2 of 3</Text>
        </View>
        <Text style={styles.title}>Daily screen time</Text>
        <Text style={styles.subtitle}>
          A rough estimate is fine. Choose one.
        </Text>

        <View style={styles.presetsList}>
          {SCREEN_TIME_PRESETS.map((preset) => {
            const isSelected = !notSureSelected && Math.abs(dailyScreenHours - preset.hours) < 0.2;
            return (
              <TouchableOpacity
                key={preset.label}
                activeOpacity={0.8}
                onPress={() => {
                  setNotSureSelected(false);
                  setDailyHours(preset.hours);
                }}
                style={styles.presetWrapper}
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
                      <Text style={styles.tierBadge}>{preset.suffix}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.presetWrapper}
            onPress={() => {
              setNotSureSelected(true);
              setDailyHours(4.5);
            }}
          >
            <GlassCard style={[styles.presetCard, notSureSelected && styles.presetCardActive]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.hoursTitle, notSureSelected && styles.hoursTitleActive]}>
                    Not sure
                  </Text>
                  <Text style={styles.tierBadge}>Choose later</Text>
                </View>
                <View style={[styles.radioCircle, notSureSelected && styles.radioCircleActive]}>
                  {notSureSelected && <View style={styles.radioInnerDot} />}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryPillButton
          title="See my estimate"
          onPress={nextStep}
          rightIcon={<ChevronLeft size={16} color={colors.primaryButtonText} style={styles.nextIcon} />}
        />
        <Text style={styles.footerNote}>
          {notSureSelected
            ? "We'll use 4.5 hours as a temporary estimate. You can update it later."
            : 'Choose Not sure to start with a 4.5-hour estimate.'}
        </Text>
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
    paddingTop: 8,
    justifyContent: 'flex-start',
  },
  stepIndicator: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    flex: 1,
    marginLeft: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.elevatedCardSurface,
  },
  stepCount: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontSize: 10,
  },
  title: {
    ...typography.displayMedium,
    fontSize: 23,
    marginBottom: 5,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginBottom: 16,
  },
  presetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    rowGap: 8,
  },
  presetWrapper: {
    width: '50%',
    paddingHorizontal: 5,
  },
  presetCard: {
    padding: 10,
    borderRadius: 12,
    minHeight: 55,
    justifyContent: 'center',
  },
  presetCardActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: colors.primaryAccentGlow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  hoursTitle: {
    ...typography.bodyMedium,
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  hoursTitleActive: {
    color: colors.primaryAccent,
  },
  tierBadge: {
    ...typography.bodySmall,
    fontSize: 9,
    color: colors.secondaryMutedText,
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
    paddingVertical: 12,
    backgroundColor: colors.obsidian,
  },
  footerNote: {
    ...typography.bodySmall,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  nextIcon: {
    transform: [{ rotate: '180deg' }],
  },
});

export default Step3ScreenTimeInput;
