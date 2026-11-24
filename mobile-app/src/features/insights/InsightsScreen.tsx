import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BookOpen, Dumbbell, TrendingDown } from 'lucide-react-native';
import { colors, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import { api } from '../../services/api';

type InsightRange = 'Today' | 'This week' | 'All time';
type WeeklyInsight = {
  reclaimed_hours: number;
  ai_headline: string;
  ai_opportunity_cost: string;
};

const ranges: InsightRange[] = ['Today', 'This week', 'All time'];

export const InsightsScreen: React.FC = () => {
  const { profile, todayMetrics } = useFocusEngine();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const [selectedRange, setSelectedRange] = useState<InsightRange>('This week');
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [insightUnavailable, setInsightUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    api.getWeeklyAiInsight()
      .then((result) => {
        if (active && result.success) {
          setWeeklyInsight(result);
          setInsightUnavailable(false);
        } else if (active) {
          setInsightUnavailable(true);
        }
      })
      .catch(() => {
        if (active) setInsightUnavailable(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const todayMinutes = todayMetrics.blocked_time_min ?? 0;
  const weeklyHours = weeklyInsight?.reclaimed_hours;
  const shownMinutes = selectedRange === 'Today' ? todayMinutes : null;
  const shownHours = selectedRange === 'This week' ? weeklyHours : undefined;
  const hasRangeData = selectedRange === 'Today'
    ? shownMinutes !== null
    : selectedRange === 'This week'
      ? typeof shownHours === 'number'
      : false;
  const savedHours = hasRangeData
    ? selectedRange === 'Today'
      ? todayMinutes / 60
      : (shownHours ?? 0)
    : null;
  const dailyMinutes = todayMinutes;
  const dailyHourText = dailyMinutes >= 60
    ? `${Math.floor(dailyMinutes / 60)}h ${dailyMinutes % 60}m`
    : `${dailyMinutes}m`;
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const booksRead = weeklyHours == null ? null : Math.floor(weeklyHours / 4);
  const workouts = weeklyHours == null ? null : Math.floor(weeklyHours / 2);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 8,
            paddingBottom: 80 + bottomInset,
          },
          responsiveContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Insights</Text>

        <View style={styles.rangeSelector}>
          {ranges.map((range) => (
            <TouchableOpacity
              key={range}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedRange === range }}
              onPress={() => setSelectedRange(range)}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.rangeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  selectedRange === range && styles.rangeTextSelected,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard style={styles.summaryCard}>
          <Text style={styles.eyebrow}>TIME RECLAIMED</Text>
          {savedHours === null ? (
            <Text style={styles.unavailableValue}>—</Text>
          ) : (
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryValue}>
                {savedHours < 1
                  ? `${Math.round(savedHours * 60)}m`
                  : `${savedHours.toFixed(1)}h`}
              </Text>
              {selectedRange === 'This week' && (
                <View style={styles.changeBadge}>
                  <TrendingDown size={14} color={colors.positiveAccent} />
                  <Text style={styles.changeText}>vs. your baseline</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.summaryCaption}>
            {selectedRange === 'Today'
              ? 'Today'
              : selectedRange === 'This week'
                ? 'This week'
                : 'All time'}
          </Text>
          {selectedRange === 'This week' && weeklyInsight?.ai_headline ? (
            <Text style={styles.summaryNote}>{weeklyInsight.ai_headline}</Text>
          ) : null}
          {selectedRange === 'This week' && insightUnavailable ? (
            <Text style={styles.summaryNote}>Weekly insights are unavailable right now.</Text>
          ) : null}
          {selectedRange === 'All time' ? (
            <Text style={styles.summaryNote}>All-time insights will appear as you build your focus history.</Text>
          ) : null}
        </GlassCard>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Daily log</Text>
          <Text style={styles.sectionMeta}>This week</Text>
        </View>
        <GlassCard style={styles.dailyLogCard}>
          <View style={styles.dailyLogHeader}>
            <Text style={styles.dailyLogTitle}>Time reclaimed</Text>
            <Text style={styles.dailyLogTotal}>
              {dailyHourText}
            </Text>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => {
              const isToday = index === todayIndex;
              return (
                <View key={`${day}-${index}`} style={styles.dayColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.dayBar,
                        isToday && dailyMinutes > 0 ? styles.dayBarToday : null,
                        { height: isToday && dailyMinutes > 0 ? 28 : 5 },
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {day}
                  </Text>
                  <Text style={styles.dayValue}>
                    {isToday ? dailyHourText : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.dailyLogFootnote}>
            {todayMetrics.metric_date
              ? `Updated ${new Date(todayMetrics.metric_date).toLocaleDateString()}`
              : 'Daily history will appear here as you use the app.'}
          </Text>
        </GlassCard>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Beyond the screen</Text>
        </View>
        <GlassCard style={styles.activitiesCard}>
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <BookOpen size={18} color={colors.primaryAccent} />
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>
                {booksRead === null
                  ? 'Reading time'
                  : `About ${booksRead} ${booksRead === 1 ? 'book' : 'books'} worth of reading`}
              </Text>
              <Text style={styles.activitySubtitle}>
                {weeklyInsight?.ai_opportunity_cost || 'Your reclaimed time can go toward what matters.'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <Dumbbell size={18} color={colors.positiveAccent} />
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>
                {workouts === null
                  ? 'Phone-free workouts'
                  : `About ${workouts} gym ${workouts === 1 ? 'session' : 'sessions'} worth of time`}
              </Text>
              <Text style={styles.activitySubtitle}>
                Based on time reclaimed this week
              </Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.baselineNote}>
          Estimates use your daily baseline of {profile.daily_baseline_minutes ?? 0} minutes.
        </Text>
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
    gap: 16,
  },
  screenTitle: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  rangeSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.obsidianElevated,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  rangeButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  rangeButtonSelected: {
    backgroundColor: colors.elevatedCardSurface,
  },
  rangeText: {
    color: colors.secondaryMutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  rangeTextSelected: {
    color: colors.primaryText,
  },
  summaryCard: {
    padding: 20,
    gap: 8,
    borderRadius: 20,
    borderColor: colors.borderHighlight,
  },
  eyebrow: {
    color: colors.secondaryMutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryValue: {
    color: colors.primaryText,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
  },
  unavailableValue: {
    color: colors.tertiaryText,
    fontSize: 38,
    fontWeight: '700',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.positiveAccentGlow,
  },
  changeText: {
    color: colors.positiveAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  summaryCaption: {
    color: colors.secondaryMutedText,
    fontSize: 13,
  },
  summaryNote: {
    color: colors.secondaryMutedText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.secondaryMutedText,
    fontSize: 12,
  },
  dailyLogCard: {
    padding: 16,
    gap: 16,
  },
  dailyLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyLogTitle: {
    color: colors.secondaryMutedText,
    fontSize: 13,
  },
  dailyLogTotal: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    height: 48,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 3,
    borderRadius: 10,
    backgroundColor: colors.obsidianElevated,
  },
  dayBar: {
    width: 14,
    borderRadius: 8,
    backgroundColor: colors.hairlineBorder,
  },
  dayBarToday: {
    backgroundColor: colors.primaryAccent,
  },
  dayLabel: {
    color: colors.tertiaryText,
    fontSize: 11,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: colors.primaryAccent,
  },
  dayValue: {
    color: colors.tertiaryText,
    fontSize: 9,
    minHeight: 12,
  },
  dailyLogFootnote: {
    color: colors.tertiaryText,
    fontSize: 10,
  },
  activitiesCard: {
    padding: 16,
    gap: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCopy: {
    flex: 1,
    gap: 3,
  },
  activityTitle: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  activitySubtitle: {
    color: colors.secondaryMutedText,
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairlineBorder,
  },
  baselineNote: {
    color: colors.tertiaryText,
    textAlign: 'center',
    fontSize: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});

export default InsightsScreen;
