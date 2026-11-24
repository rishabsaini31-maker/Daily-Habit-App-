import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Info } from 'lucide-react-native';
import { colors, spacing, typography } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

export const Step4LifetimeRealityCheck: React.FC = () => {
  const { dailyScreenHours, nextStep, prevStep } = useOnboarding();
  const [showEstimateDetails, setShowEstimateDetails] = useState(false);
  const weeklyHours = Number((dailyScreenHours * 7).toFixed(1));
  const averageHours = Math.floor(dailyScreenHours);
  const averageMinutes = Math.round((dailyScreenHours - averageHours) * 60);
  const averageTime = `${averageHours}h${averageMinutes ? ` ${averageMinutes}m` : ''}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR ESTIMATE</Text>
        <Text style={styles.title}>Your time, in perspective</Text>
        <Text style={styles.subtitle}>
          Based on your {dailyScreenHours}-hour daily estimate.
        </Text>

        <GlassCard style={styles.summaryCard}>
          <Text style={styles.cardLabel}>ESTIMATED SCREEN TIME</Text>
          <Text style={styles.weeklyValue}>{weeklyHours}</Text>
          <Text style={styles.weeklyUnit}>hours / week</Text>
          <Text style={styles.dailyEstimate}>
            {averageTime} per day · 7 days
          </Text>
        </GlassCard>

        <GlassCard style={styles.dailyCard}>
          <Text style={styles.cardLabel}>DAILY ESTIMATE</Text>
          <Text style={styles.dailyValue}>{averageTime}</Text>
          <Text style={styles.dailyDescription}>Midpoint of your selected range</Text>
        </GlassCard>

        <TouchableOpacity
          style={styles.detailsLink}
          activeOpacity={0.75}
          onPress={() => setShowEstimateDetails(true)}
        >
          <Info size={15} color={colors.primaryAccent} />
          <Text style={styles.detailsText}>How estimates work</Text>
          <ChevronRight size={16} color={colors.secondaryMutedText} />
        </TouchableOpacity>
        <Text style={styles.estimateFootnote}>
          Estimates may differ from your actual usage.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryPillButton
          title="Continue to protection"
          onPress={nextStep}
          rightIcon={<ChevronRight size={16} color={colors.primaryButtonText} />}
        />
      </View>

      <Modal
        visible={showEstimateDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEstimateDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How estimates work</Text>
            <Text style={styles.modalBody}>
              We multiply your selected daily screen-time estimate by 7 to show a typical week.
              The selected range midpoint is used when a range is provided.
            </Text>
            <Text style={styles.modalSectionTitle}>LONG-RANGE ILLUSTRATIONS</Text>
            <Text style={styles.modalBody}>
              These estimates are illustrative, based on the time you entered, and are not personal
              forecasts or guaranteed outcomes.
            </Text>
            <PrimaryPillButton title="Got it" onPress={() => setShowEstimateDetails(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 20,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 9,
    marginBottom: 8,
  },
  title: {
    ...typography.displayMedium,
    fontSize: 23,
    marginBottom: 5,
  },
  subtitle: {
    ...typography.bodySmall,
    marginBottom: 18,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.secondaryMutedText,
    letterSpacing: 0.6,
  },
  weeklyValue: {
    color: colors.primaryAccent,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '400',
    marginTop: 8,
  },
  weeklyUnit: {
    ...typography.bodySmall,
    color: colors.primaryText,
    marginTop: -2,
  },
  dailyEstimate: {
    ...typography.bodySmall,
    fontSize: 9,
    marginTop: 10,
  },
  dailyCard: {
    padding: 14,
    borderRadius: 13,
  },
  dailyValue: {
    ...typography.titleLarge,
    fontSize: 18,
    marginTop: 7,
  },
  dailyDescription: {
    ...typography.bodySmall,
    fontSize: 9,
    marginTop: 3,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  detailsText: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    flex: 1,
  },
  estimateFootnote: {
    ...typography.bodySmall,
    fontSize: 9,
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    backgroundColor: colors.obsidian,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    ...typography.titleLarge,
    marginBottom: 10,
  },
  modalBody: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalSectionTitle: {
    ...typography.caption,
    fontSize: 9,
    marginBottom: 6,
  },
});

export default Step4LifetimeRealityCheck;
