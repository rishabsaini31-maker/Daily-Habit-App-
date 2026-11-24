import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, ChevronLeft, Info, ArrowRight } from 'lucide-react-native';
import { colors, typography } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

export const Step4LifetimeRealityCheck: React.FC = () => {
  const { dailyScreenHours, nextStep, prevStep } = useOnboarding();
  const [showEstimateDetails, setShowEstimateDetails] = useState(false);

  const weeklyHours = Number((dailyScreenHours * 7).toFixed(1));
  const hoursInt = Math.floor(dailyScreenHours);
  const minutesInt = Math.round((dailyScreenHours - hoursInt) * 60);
  const dailyFormatted = minutesInt > 0 ? `${hoursInt}h ${minutesInt}m` : `${hoursInt}h`;

  return (
    <View style={styles.container}>
      {/* Figma Screen 04 Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Your estimate</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your time,{'\n'}in perspective</Text>
        <Text style={styles.subtitle}>
          Based on your {dailyScreenHours} hour daily estimate.
        </Text>

        {/* Hero Card: Weekly Estimate */}
        <GlassCard style={styles.heroWeeklyCard}>
          <Text style={styles.cardEyebrow}>ESTIMATED SCREEN TIME</Text>
          <View style={styles.numberRow}>
            <Text style={styles.heroNumber}>{weeklyHours}</Text>
            <Text style={styles.heroUnit}>hours / week</Text>
          </View>
          <Text style={styles.calculationNote}>
            {dailyScreenHours} hours/day × 7 days
          </Text>
        </GlassCard>

        {/* Secondary Card: Daily Estimate Summary */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTitle}>Daily estimate</Text>
            <Text style={styles.summaryValue}>{dailyFormatted}</Text>
          </View>
          <Text style={styles.summarySubtitle}>
            Midpoint of the selected range.
          </Text>
        </GlassCard>

        {/* How Estimates Work Card */}
        <TouchableOpacity
          style={styles.infoCardWrapper}
          activeOpacity={0.75}
          onPress={() => setShowEstimateDetails(true)}
        >
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoLeft}>
              <Info size={16} color={colors.primaryAccent} />
              <Text style={styles.infoText}>How estimates work</Text>
            </View>
            <ChevronRight size={18} color={colors.secondaryMutedText} />
          </GlassCard>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Estimates may differ from your actual usage.
        </Text>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryPillButton
          title="Continue to protection"
          onPress={nextStep}
          rightIcon={<ArrowRight size={18} color="#10182D" />}
        />
        <Text style={styles.footerNote}>Next: Enable app protection</Text>
      </View>

      {/* Info Modal */}
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
              The midpoint is used when a range is selected.
            </Text>
            <Text style={styles.modalSectionTitle}>LONG-RANGE PERSPECTIVE</Text>
            <Text style={styles.modalBody}>
              These metrics illustrate where reclaimed time can go over weeks and months of deep focus, helping you stay intentional.
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  optionalBadge: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    lineHeight: 20,
    marginBottom: 20,
  },
  heroWeeklyCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8F98',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  heroNumber: {
    fontSize: 60,
    fontWeight: '300',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.secondaryMutedText,
  },
  calculationNote: {
    fontSize: 13,
    color: colors.secondaryMutedText,
    marginTop: 8,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: 12,
    color: colors.secondaryMutedText,
    marginTop: 4,
  },
  infoCardWrapper: {
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footnote: {
    fontSize: 12,
    color: colors.tertiaryText,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#121D2B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 13,
    color: colors.secondaryMutedText,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryAccent,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
});

export default Step4LifetimeRealityCheck;
