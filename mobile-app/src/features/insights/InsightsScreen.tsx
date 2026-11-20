import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart3, TrendingDown, Sparkles, BookOpen, Dumbbell, Moon, ShieldAlert } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';

export const InsightsScreen: React.FC = () => {
  const weeklyData = [
    { day: 'Mon', hours: 2.1, heightPercent: 55 },
    { day: 'Tue', hours: 3.4, heightPercent: 85 },
    { day: 'Wed', hours: 2.8, heightPercent: 70 },
    { day: 'Thu', hours: 4.1, heightPercent: 100 },
    { day: 'Fri', hours: 3.2, heightPercent: 80 },
    { day: 'Sat', hours: 1.5, heightPercent: 40 },
    { day: 'Sun', hours: 2.0, heightPercent: 50 },
  ];

  const topBlockedApps = [
    { name: 'Instagram Reels', attempts: 48, savedMinutes: 96, emoji: '📸' },
    { name: 'TikTok FYP', attempts: 36, savedMinutes: 72, emoji: '🎵' },
    { name: 'YouTube Shorts', attempts: 22, savedMinutes: 44, emoji: '▶️' },
    { name: 'X / Twitter', attempts: 14, savedMinutes: 28, emoji: '🐦' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Focus Insights</Text>
        <Text style={styles.screenSubtitle}>
          Evidence of your reclaimed time and cognitive clarity
        </Text>

        {/* Big Reclaimed Metric Card */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryBadge}>WEEKLY RECLAIMED ATTENTION</Text>
          <Text style={styles.giantHours}>19h 05m</Text>
          <View style={styles.trendRow}>
            <TrendingDown size={16} color={colors.positiveAccent} />
            <Text style={styles.trendText}>
              -38% screen time vs your pre-onboarding baseline
            </Text>
          </View>
        </GlassCard>

        {/* Reclaimed Time Weekly Chart */}
        <GlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>HOURS SAVED PER DAY</Text>
          <View style={styles.barsContainer}>
            {weeklyData.map((d) => (
              <View key={d.day} style={styles.barCol}>
                <Text style={styles.barHours}>{d.hours}h</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${d.heightPercent}%` },
                      d.hours >= 3.5 && styles.barFillTop,
                    ]}
                  />
                </View>
                <Text style={styles.barDay}>{d.day}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* AI OPPORTUNITY COST CARD */}
        <GlassCard style={styles.aiCostCard}>
          <View style={styles.aiCostHeader}>
            <Sparkles size={20} color={colors.primaryAccent} />
            <Text style={styles.aiCostTitle}>AI Opportunity Cost Analysis</Text>
          </View>
          <Text style={styles.aiCostDesc}>
            What 19 hours of avoided doomscrolling became in real life:
          </Text>

          <View style={styles.gainsList}>
            <View style={styles.gainItem}>
              <View style={[styles.gainIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <BookOpen size={16} color={colors.primaryAccent} />
              </View>
              <Text style={styles.gainText}>
                <Text style={styles.gainBold}>2 Books read:</Text> Deep Work & Atomic Habits
              </Text>
            </View>

            <View style={styles.gainItem}>
              <View style={[styles.gainIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Dumbbell size={16} color={colors.positiveAccent} />
              </View>
              <Text style={styles.gainText}>
                <Text style={styles.gainBold}>5 Workouts completed</Text> without workout distraction
              </Text>
            </View>

            <View style={styles.gainItem}>
              <View style={[styles.gainIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Moon size={16} color="#C084FC" />
              </View>
              <Text style={styles.gainText}>
                <Text style={styles.gainBold}>+48 mins</Text> additional REM sleep per night
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* TOP BLOCKED APPS LIST */}
        <Text style={styles.sectionHeader}>TOP INTERCEPTED TARGETS</Text>
        <View style={styles.blockedList}>
          {topBlockedApps.map((item, idx) => (
            <GlassCard key={item.name} style={styles.appStatCard}>
              <Text style={styles.rankNum}>#{idx + 1}</Text>
              <Text style={styles.appEmoji}>{item.emoji}</Text>
              <View style={styles.appStatInfoCol}>
                <Text style={styles.appStatName}>{item.name}</Text>
                <Text style={styles.appStatSub}>
                  {item.attempts} opens blocked • Saved ~{item.savedMinutes}m
                </Text>
              </View>
              <View style={styles.shieldCountBadge}>
                <ShieldAlert size={14} color={colors.dangerAccent} />
                <Text style={styles.shieldCountText}>{item.attempts}</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  screenTitle: {
    ...typography.displayMedium,
    marginBottom: 4,
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginBottom: 20,
  },
  summaryCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  summaryBadge: {
    ...typography.caption,
    color: colors.positiveAccent,
    letterSpacing: 1.5,
  },
  giantHours: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: -1,
    marginVertical: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    ...typography.bodySmall,
    color: colors.positiveAccent,
    fontWeight: '600',
  },
  chartCard: {
    padding: 18,
    marginBottom: 16,
  },
  chartTitle: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barHours: {
    ...typography.bodySmall,
    fontSize: 9,
    color: colors.secondaryMutedText,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: colors.hairlineBorder,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primaryAccent,
    borderRadius: 7,
  },
  barFillTop: {
    backgroundColor: colors.positiveAccent,
  },
  barDay: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    marginTop: 6,
  },
  aiCostCard: {
    padding: 18,
    marginBottom: 20,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  aiCostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiCostTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    color: colors.primaryAccent,
  },
  aiCostDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginBottom: 14,
  },
  gainsList: {
    gap: 10,
  },
  gainItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gainIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gainText: {
    ...typography.bodySmall,
    color: colors.primaryText,
    flex: 1,
  },
  gainBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  blockedList: {
    gap: 10,
  },
  appStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rankNum: {
    ...typography.caption,
    fontSize: 12,
    color: colors.secondaryMutedText,
    width: 24,
  },
  appEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  appStatInfoCol: {
    flex: 1,
  },
  appStatName: {
    ...typography.titleMedium,
    fontSize: 14,
  },
  appStatSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
  },
  shieldCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shieldCountText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.dangerAccent,
  },
});

export default InsightsScreen;
