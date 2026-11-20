import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
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
        <Text style={styles.stepIndicator}>STEP 2 OF 5</Text>
        <Text style={styles.title}>Which apps steal the most of your focus?</Text>
        <Text style={styles.subtitle}>
          Select all that you open unconsciously or spend more time on than intended.
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
                      {isSelected && <Check size={14} color="#090A0F" />}
                    </View>
                  </View>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appSubtext}>{item.subtext}</Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.ctaWrapper}>
            <PrimaryPillButton
              title={`Continue (${selectedApps.length} selected)`}
              onPress={nextStep}
              disabled={selectedApps.length === 0}
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
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 26,
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
    ...typography.titleMedium,
    fontSize: 15,
  },
  appSubtext: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    marginTop: 2,
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

export default Step2DistractionQuiz;
