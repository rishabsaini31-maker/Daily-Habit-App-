import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

interface DistractionOption {
  id: string;
  name: string;
  category: string;
  emoji: string;
  subtext: string;
}

const DISTRACTION_OPTIONS: DistractionOption[] = [
  { id: 'instagram', name: 'Instagram', category: 'Social', emoji: '📸', subtext: 'Reels doomscrolling' },
  { id: 'tiktok', name: 'TikTok', category: 'Social', emoji: '🎵', subtext: 'Infinite swipe loop' },
  { id: 'youtube', name: 'YouTube', category: 'Video', emoji: '▶️', subtext: 'Shorts & autoplay hole' },
  { id: 'twitter', name: 'X / Twitter', category: 'Social', emoji: '🐦', subtext: 'Rage bait & breaking news' },
  { id: 'reddit', name: 'Reddit', category: 'Forum', emoji: '🤖', subtext: 'Subreddit rabbit holes' },
  { id: 'games', name: 'Mobile Games', category: 'Gaming', emoji: '🎮', subtext: 'Gacha & competitive grind' },
  { id: 'shopping', name: 'Shopping Apps', category: 'Shopping', emoji: '🛍️', subtext: 'Impulse window shopping' },
  { id: 'news', name: 'News & Media', category: 'Information', emoji: '📰', subtext: 'Anxiety inducing headlines' },
];

export const Step2DistractionQuiz: React.FC = () => {
  const { selectedApps, toggleAppSelection, nextStep, prevStep } = useOnboarding();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={18} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Focus setup</Text>
          <Text style={styles.stepCount}>1 of 3</Text>
        </View>
        <Text style={styles.title}>Choose apps to limit</Text>
        <Text style={styles.subtitle}>
          Select one or more. You can change these later.
        </Text>

        <View style={styles.grid}>
          {DISTRACTION_OPTIONS.map((item) => {
            const isSelected = selectedApps.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => toggleAppSelection(item.id)}
                style={styles.cardWrapper}
              >
                <GlassCard
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleActive,
                      ]}
                    >
                      {isSelected && <Check size={14} color={colors.primaryButtonText} />}
                    </View>
                  </View>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appSubtext}>{item.category}</Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <Text style={styles.selectionNote}>
          {selectedApps.length} apps selected · Change these anytime
        </Text>
        <PrimaryPillButton
          title="Continue"
          onPress={nextStep}
          disabled={selectedApps.length === 0}
          rightIcon={<ChevronLeft size={16} color={colors.primaryButtonText} style={styles.nextIcon} />}
        />
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
    paddingTop: 8,
    paddingBottom: 24,
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
    marginBottom: 14,
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
    minHeight: 82,
    borderRadius: 12,
    padding: 11,
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: colors.primaryAccent,
    backgroundColor: colors.primaryAccentGlow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 19,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  appName: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: '600',
  },
  appSubtext: {
    ...typography.bodySmall,
    display: 'none',
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    backgroundColor: colors.obsidian,
  },
  selectionNote: {
    ...typography.bodyMedium,
    fontSize: 10,
    marginBottom: 9,
  },
  nextIcon: {
    transform: [{ rotate: '180deg' }],
  },
});

export default Step2DistractionQuiz;
