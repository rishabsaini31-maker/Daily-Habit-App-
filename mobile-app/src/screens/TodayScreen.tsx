import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Sparkles,
  WifiOff,
  RefreshCw,
  Plus,
  Flame,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';
import { Habit, Category, HabitCompletion } from '../types';
import { api, getLocalDateString, getOfflineQueue, syncOfflineQueue } from '../services/api';
import { HabitCard } from '../components/HabitCard';
import { ProgressBar } from '../components/ProgressBar';
import { CreateHabitModal } from '../components/CreateHabitModal';
import { useAuth } from '../context/AuthContext';

interface TodayScreenProps {
  onNavigateToTemplates: () => void;
  onNavigateToHabits: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  onNavigateToTemplates,
  onNavigateToHabits,
}) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completionsMap, setCompletionsMap] = useState<Record<string, HabitCompletion>>({});
  const [numericValuesMap, setNumericValuesMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const todayStr = getLocalDateString();
  const todayDate = new Date();
  const currentDayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday ...

  const loadData = useCallback(async () => {
    try {
      const [fetchedHabits, fetchedCategories, queue] = await Promise.all([
        api.getHabits(false),
        api.getCategories(),
        getOfflineQueue(),
      ]);

      setHabits(fetchedHabits);
      setCategories(fetchedCategories);
      setPendingSyncCount(queue.length);

      // Initialize default completions for demo habits
      const initialMap: Record<string, HabitCompletion> = {};
      const initialNumeric: Record<string, number> = {};

      fetchedHabits.forEach(h => {
        if (h.streak?.lastCompletedDate === todayStr) {
          initialMap[h.id] = {
            id: 'comp-' + h.id,
            habitId: h.id,
            userId: h.userId,
            date: todayStr,
            status: 'COMPLETED',
            value: h.targetValue || 1,
            completedAt: new Date().toISOString(),
          };
          initialNumeric[h.id] = h.targetValue || 1;
        } else {
          initialNumeric[h.id] = 0;
        }
      });

      setCompletionsMap(initialMap);
      setNumericValuesMap(initialNumeric);
    } catch (err) {
      console.warn('Error loading today habits:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      const res = await syncOfflineQueue();
      const updatedQueue = await getOfflineQueue();
      setPendingSyncCount(updatedQueue.length);
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter habits scheduled for today
  const scheduledToday = habits.filter(habit => {
    if (habit.isArchived) return false;
    if (habit.frequencyType === 'DAILY') return true;
    if (habit.frequencyType === 'WEEKLY_DAYS' && Array.isArray(habit.frequencyPayload)) {
      return habit.frequencyPayload.includes(currentDayOfWeek);
    }
    return true;
  });

  // Optimistic Toggle Handler (< 5 second interaction)
  const handleToggleHabit = async (habit: Habit) => {
    const isCurrentlyCompleted = Boolean(completionsMap[habit.id]);
    const nextCompleted = !isCurrentlyCompleted;

    // 1. Instant Optimistic UI Update
    setCompletionsMap(prev => {
      const next = { ...prev };
      if (nextCompleted) {
        next[habit.id] = {
          id: 'temp-comp-' + Date.now(),
          habitId: habit.id,
          userId: habit.userId,
          date: todayStr,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        };
      } else {
        delete next[habit.id];
      }
      return next;
    });

    // Update streak locally
    setHabits(prev =>
      prev.map(h => {
        if (h.id === habit.id) {
          const currentStreak = h.streak?.currentStreak || 0;
          const nextStreak = nextCompleted ? currentStreak + 1 : Math.max(0, currentStreak - 1);
          return {
            ...h,
            streak: {
              currentStreak: nextStreak,
              longestStreak: Math.max(h.streak?.longestStreak || 0, nextStreak),
              lastCompletedDate: nextCompleted ? todayStr : null,
              freezeCountRemaining: h.streak?.freezeCountRemaining || 1,
            },
          };
        }
        return h;
      })
    );

    // 2. Dispatch API in background (with offline outbox fallback)
    try {
      if (nextCompleted) {
        await api.logCompletion(habit.id, {
          date: todayStr,
          status: 'COMPLETED',
          value: habit.targetValue || 1,
        });
      } else {
        await api.deleteCompletion(habit.id, todayStr);
      }
      const queue = await getOfflineQueue();
      setPendingSyncCount(queue.length);
    } catch {
      const queue = await getOfflineQueue();
      setPendingSyncCount(queue.length);
    }
  };

  // Numeric Value Increment Handler
  const handleNumericValueChange = async (habit: Habit, newValue: number) => {
    setNumericValuesMap(prev => ({ ...prev, [habit.id]: newValue }));

    const target = habit.targetValue || 1;
    const isCompleted = newValue >= target;

    setCompletionsMap(prev => {
      const next = { ...prev };
      if (isCompleted) {
        next[habit.id] = {
          id: 'comp-' + habit.id,
          habitId: habit.id,
          userId: habit.userId,
          date: todayStr,
          status: 'COMPLETED',
          value: newValue,
          completedAt: new Date().toISOString(),
        };
      } else {
        delete next[habit.id];
      }
      return next;
    });

    try {
      await api.logCompletion(habit.id, {
        date: todayStr,
        status: isCompleted ? 'COMPLETED' : 'SKIPPED',
        value: newValue,
      });
      const queue = await getOfflineQueue();
      setPendingSyncCount(queue.length);
    } catch {
      const queue = await getOfflineQueue();
      setPendingSyncCount(queue.length);
    }
  };

  const handleCreateHabit = async (habitData: any) => {
    const created = await api.createHabit(habitData);
    setHabits(prev => [created, ...prev]);
  };

  // Metrics calculation
  const totalScheduled = scheduledToday.length;
  const totalCompleted = scheduledToday.filter(h => Boolean(completionsMap[h.id])).length;
  const completionPercentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Split into pending and completed
  const pendingHabits = scheduledToday.filter(h => !completionsMap[h.id]);
  const completedHabits = scheduledToday.filter(h => Boolean(completionsMap[h.id]));

  const formattedDate = todayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Offline Outbox banner */}
      {pendingSyncCount > 0 && (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={handleManualSync}
          activeOpacity={0.8}
        >
          <View style={styles.offlineBannerLeft}>
            <WifiOff size={16} color="#fbbf24" />
            <Text style={styles.offlineBannerText}>
              {pendingSyncCount} check-in{pendingSyncCount > 1 ? 's' : ''} saved offline
            </Text>
          </View>
          <View style={styles.syncButton}>
            {isSyncing ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <>
                <RefreshCw size={13} color="#0f172a" />
                <Text style={styles.syncButtonText}>Sync</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.greetingText}>
              Hello, {user?.displayName?.split(' ')[0] || 'Friend'} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addHabitFab}
            onPress={() => setShowCreateModal(true)}
            accessibilityLabel="Add new habit"
          >
            <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Daily Motivation & Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View style={styles.progressTitleGroup}>
              <Sparkles size={18} color="#10b981" />
              <Text style={styles.progressCardTitle}>Today's Momentum</Text>
            </View>
            <Text style={styles.progressCardFraction}>
              {totalCompleted} of {totalScheduled} Done
            </Text>
          </View>

          <ProgressBar current={totalCompleted} total={totalScheduled} color="#10b981" />

          <Text style={styles.motivationText}>
            {totalCompleted === totalScheduled && totalScheduled > 0
              ? '🎉 Outstanding! All habits fulfilled for today!'
              : totalCompleted > 0
              ? '🔥 Great rhythm! Keep stacking your streaks.'
              : '🌟 Start your first habit check-in in under 5 seconds.'}
          </Text>
        </View>

        {/* Loading state */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading today's schedule...</Text>
          </View>
        ) : scheduledToday.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No habits scheduled for today</Text>
            <Text style={styles.emptySubtitle}>
              Adopt proven routines from the curated template library or design your own daily habits.
            </Text>
            <View style={styles.emptyButtonRow}>
              <TouchableOpacity
                style={styles.emptyBtnPrimary}
                onPress={onNavigateToTemplates}
              >
                <Sparkles size={16} color="#ffffff" />
                <Text style={styles.emptyBtnPrimaryText}>Browse Templates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emptyBtnSecondary}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={16} color="#94a3b8" />
                <Text style={styles.emptyBtnSecondaryText}>Create Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Habit checklist */
          <View style={styles.listContainer}>
            {/* Pending habits section */}
            {pendingHabits.length > 0 && (
              <View style={styles.sectionGroup}>
                <Text style={styles.sectionTitle}>
                  TO DO ({pendingHabits.length})
                </Text>
                {pendingHabits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isTodayMode={true}
                    isCompleted={false}
                    currentValue={numericValuesMap[habit.id] || 0}
                    onToggle={() => handleToggleHabit(habit)}
                    onUpdateValue={val => handleNumericValueChange(habit, val)}
                  />
                ))}
              </View>
            )}

            {/* Completed habits section */}
            {completedHabits.length > 0 && (
              <View style={styles.sectionGroup}>
                <Text style={[styles.sectionTitle, styles.sectionTitleCompleted]}>
                  COMPLETED ({completedHabits.length})
                </Text>
                {completedHabits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isTodayMode={true}
                    isCompleted={true}
                    currentValue={numericValuesMap[habit.id] || habit.targetValue || 1}
                    onToggle={() => handleToggleHabit(habit)}
                    onUpdateValue={val => handleNumericValueChange(habit, val)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Habit Modal */}
      <CreateHabitModal
        visible={showCreateModal}
        categories={categories}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateHabit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  offlineBanner: {
    backgroundColor: '#78350f',
    borderBottomWidth: 1,
    borderBottomColor: '#b45309',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fef3c7',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  addHabitFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  progressCardFraction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  motivationText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 16,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  emptyBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyBtnSecondaryText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    marginBottom: 20,
  },
  sectionGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionTitleCompleted: {
    color: '#10b981',
  },
});
