import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, BookOpen, Compass, Activity } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

export const Step4LifetimeRealityCheck: React.FC = () => {
  const { dailyScreenHours, lifetimeYearsLost, nextStep, prevStep } = useOnboarding();

  // Opportunity cost calculations based on daily hours
  const booksCouldRead = Math.round((dailyScreenHours * 365 * 10) / 10); // 10h per book
  const workoutsPossible = Math.round((dailyScreenHours * 365) / 1.2);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepIndicator}>STEP 4 OF 5</Text>
        <Text style={styles.title}>Your Lifetime Reality Check</Text>
        <Text style={styles.subtitle}>
          Here is what {dailyScreenHours} hours per day really means across your remaining lifetime.
        </Text>

        {/* Big Impact Callout Card */}
        <GlassCard variant="danger" style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <AlertTriangle size={24} color={colors.dangerAccent} />
            <Text style={styles.impactBadge}>LIFETIME ATTENTION DRAIN</Text>
          </View>
          <Text style={styles.giantYears}>{lifetimeYearsLost} YEARS</Text>
          <Text style={styles.impactDesc}>
            At {dailyScreenHours} hours every day, you will spend {lifetimeYearsLost} full waking
            years looking down at a glass screen.
          </Text>
        </GlassCard>

        {/* Reclaimable Opportunity Cards */}
        <Text style={styles.sectionHeader}>WHAT YOU CAN RECLAIM WITH THIS APP:</Text>

        <View style={styles.comparisonGrid}>
          <GlassCard style={styles.comparisonCard}>
            <View style={styles.iconCircle}>
              <BookOpen size={20} color={colors.primaryAccent} />
            </View>
            <Text style={styles.metricVal}>+{booksCouldRead}</Text>
            <Text style={styles.metricLabel}>Books read over 10 years</Text>
          </GlassCard>

          <GlassCard style={styles.comparisonCard}>
            <View style={styles.iconCircle}>
              <Activity size={20} color={colors.positiveAccent} />
            </View>
            <Text style={styles.metricVal}>+{workoutsPossible}</Text>
            <Text style={styles.metricLabel}>Gym workouts per year</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.solutionCard}>
          <Compass size={22} color={colors.primaryAccent} />
          <View style={styles.solutionTextCol}>
            <Text style={styles.solutionTitle}>Our Mission For You</Text>
            <Text style={styles.solutionBody}>
              Save 2.5 hours every day. In 1 year, that gives you 38 full 24-hour days of freedom to
              build, learn, and live present.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.ctaWrapper}>
            <PrimaryPillButton title="Secure My Time" onPress={nextStep} />
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
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 24,
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
    marginBottom: 20,
  },
  impactCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  impactBadge: {
    ...typography.caption,
    color: colors.dangerAccent,
    letterSpacing: 1,
  },
  giantYears: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: -1,
    marginVertical: 4,
  },
  impactDesc: {
    ...typography.bodyMedium,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  comparisonCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricVal: {
    ...typography.titleLarge,
    fontSize: 22,
    color: colors.primaryText,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginTop: 2,
  },
  solutionCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 14,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  solutionTextCol: {
    flex: 1,
  },
  solutionTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    marginBottom: 2,
  },
  solutionBody: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
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

export default Step4LifetimeRealityCheck;
