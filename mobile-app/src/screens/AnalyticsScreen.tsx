import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react-native';
import { AnalyticsSummary, HeatmapDay } from '../types';
import { api, getLocalDateString } from '../services/api';
import { CalendarHeatmap } from '../components/CalendarHeatmap';

export const AnalyticsScreen: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (monthDate: Date) => {
    try {
      const year = monthDate.getFullYear();
      const monthStr = `${year}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      const [fetchedSummary, fetchedHeatmap] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getHeatmap(monthStr),
      ]);
      setSummary(fetchedSummary);
      setHeatmapData(fetchedHeatmap);
    } catch (err) {
      console.warn('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentMonth);
  }, [loadData, currentMonth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(currentMonth);
  };

  const handlePrevMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(next);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Progress & Insights</Text>
        <Text style={styles.subtitle}>Consistency metrics and streak milestones</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Compiling analytics matrix...</Text>
          </View>
        ) : (
          <>
            {/* KPI Stat Cards Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <TrendingUp size={18} color="#10b981" />
                </View>
                <Text style={styles.kpiValue}>{summary?.completionRate7d ?? 0}%</Text>
                <Text style={styles.kpiLabel}>7-Day Rate</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <CalendarIcon size={18} color="#0ea5e9" />
                </View>
                <Text style={styles.kpiValue}>{summary?.completionRate30d ?? 0}%</Text>
                <Text style={styles.kpiLabel}>30-Day Rate</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                  <Flame size={18} color="#f97316" />
                </View>
                <Text style={styles.kpiValue}>{summary?.currentBestStreak ?? 0}</Text>
                <Text style={styles.kpiLabel}>Best Streak</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <CheckCircle2 size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.kpiValue}>{summary?.totalCompletions ?? 0}</Text>
                <Text style={styles.kpiLabel}>Total Done</Text>
              </View>
            </View>

            {/* Monthly Calendar Heatmap */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MONTHLY COMPLETION HEATMAP</Text>
            </View>
            <CalendarHeatmap
              currentMonth={currentMonth}
              heatmapData={heatmapData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />

            {/* Streak Milestone Badges */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>STREAK MILESTONES</Text>
            </View>
            <View style={styles.milestonesGrid}>
              {summary?.milestones.map((m, idx) => {
                const isUnlocked = m.achieved;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.milestoneCard,
                      isUnlocked ? styles.milestoneUnlocked : styles.milestoneLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.milestoneIconWrap,
                        isUnlocked ? styles.milestoneIconUnlocked : styles.milestoneIconLocked,
                      ]}
                    >
                      <Award size={20} color={isUnlocked ? '#f59e0b' : '#64748b'} />
                    </View>
                    <Text style={styles.milestoneDays}>{m.days} Days</Text>
                    <Text style={styles.milestoneTitle} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <View
                      style={[
                        styles.milestoneStatusPill,
                        isUnlocked ? styles.statusPillUnlocked : styles.statusPillLocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isUnlocked ? styles.statusTextUnlocked : styles.statusTextLocked,
                        ]}
                      >
                        {isUnlocked ? 'Achieved 🏆' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  milestoneCard: {
    width: '48.5%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  milestoneUnlocked: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#1c2638',
  },
  milestoneLocked: {
    borderColor: '#334155',
    opacity: 0.65,
  },
  milestoneIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  milestoneIconUnlocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  milestoneIconLocked: {
    backgroundColor: '#0f172a',
  },
  milestoneDays: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  milestoneTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 8,
  },
  milestoneStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillUnlocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusPillLocked: {
    backgroundColor: '#0f172a',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextUnlocked: {
    color: '#fbbf24',
  },
  statusTextLocked: {
    color: '#64748b',
  },
});
