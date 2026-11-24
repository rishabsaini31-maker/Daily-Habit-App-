import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ArrowRight } from 'lucide-react-native';
import { colors, typography } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

interface ScreenTimeOption {
  hours: number;
  label: string;
  sub: string;
  description: string;
}

const SCREEN_TIME_PRESETS: ScreenTimeOption[] = [
  { hours: 1.5, label: 'Under 2', sub: 'hours', description: 'Using 1.5 h/day: estimate for under 2 hours' },
  { hours: 2.5, label: '2–3', sub: 'hours', description: 'Using 2.5 h/day: the middle of 2–3 hours' },
  { hours: 4.5, label: '4–5', sub: 'hours', description: 'Using 4.5 h/day: the middle of 4–5 hours' },
  { hours: 6.5, label: '6–7', sub: 'hours', description: 'Using 6.5 h/day: the middle of 6–7 hours' },
  { hours: 8.5, label: '8+', sub: 'hours', description: 'Using 8.5 h/day: estimate for 8+ hours' },
];

export const Step3ScreenTimeInput: React.FC = () => {
  const { dailyScreenHours, setDailyHours, nextStep, prevStep } = useOnboarding();
  const [notSureSelected, setNotSureSelected] = useState(false);

  const activeOption = SCREEN_TIME_PRESETS.find(
    (p) => !notSureSelected && Math.abs(dailyScreenHours - p.hours) < 0.2
  );
  const footerText = notSureSelected
    ? 'Using 4.5 h/day: temporary default estimate'
    : (activeOption?.description || 'Using 4.5 h/day: the middle of 4–5 hours');

  return (
    <View style={styles.container}>
      {/* Figma Screen 03 Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Focus setup</Text>
          <Text style={styles.stepCount}>2 of 3</Text>
        </View>
        {/* 3-segment progress indicator (1 and 2 active) */}
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={styles.progressSegment} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Daily screen time</Text>
        <Text style={styles.subtitle}>
          A rough estimate is fine. Choose one.
        </Text>

        {/* 2-Column Grid matching Figma 171x112 px cards */}
        <View style={styles.grid}>
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
                style={styles.cardWrapper}
              >
                <GlassCard
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>Selected</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardBottomCol}>
                    <Text style={[styles.hoursTitle, isSelected && styles.hoursTitleActive]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.hoursSub}>{preset.sub}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}

          {/* Not Sure / Choose Later Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cardWrapper}
            onPress={() => {
              setNotSureSelected(true);
              setDailyHours(4.5);
            }}
          >
            <GlassCard style={[styles.card, notSureSelected && styles.cardSelected]}>
              <View style={styles.cardTopRow}>
                <View style={[styles.radioCircle, notSureSelected && styles.radioCircleActive]}>
                  {notSureSelected && <View style={styles.radioInnerDot} />}
                </View>
                {notSureSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBottomCol}>
                <Text style={[styles.hoursTitle, notSureSelected && styles.hoursTitleActive]}>
                  Not sure
                </Text>
                <Text style={styles.hoursSub}>Choose later</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <Text style={styles.wellbeingNote}>
          For a more accurate number, check Digital Wellbeing in Android Settings.
        </Text>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryPillButton
          title="See my estimate"
          onPress={nextStep}
          rightIcon={<ArrowRight size={18} color="#10182D" />}
        />
        <Text style={styles.footerNote}>{footerText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.elevatedCardSurface,
  },
  stepIndicator: {
    ...typography.bodyMedium,
    color: colors.primaryText,
    flex: 1,
    marginLeft: 12,
    fontWeight: '600',
  },
  stepCount: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: colors.hairlineBorder,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.primaryAccent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cardWrapper: {
    width: '50%',
    padding: 6,
  },
  card: {
    height: 112,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardSelected: {
    borderColor: 'rgba(181, 197, 255, 0.6)',
    backgroundColor: '#1C2D47',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
  selectedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(181, 197, 255, 0.15)',
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  cardBottomCol: {
    marginTop: 8,
  },
  hoursTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  hoursTitleActive: {
    color: colors.primaryAccent,
  },
  hoursSub: {
    fontSize: 12,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  wellbeingNote: {
    fontSize: 12,
    color: colors.tertiaryText,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.obsidian,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  footerNote: {
    fontSize: 11,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Step3ScreenTimeInput;
