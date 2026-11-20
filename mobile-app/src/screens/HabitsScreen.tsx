import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Plus, Filter, Archive, CheckCircle2 } from 'lucide-react-native';
import { Habit, Category } from '../types';
import { api } from '../services/api';
import { HabitCard } from '../components/HabitCard';
import { CreateHabitModal } from '../components/CreateHabitModal';

export const HabitsScreen: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [isArchivedTab, setIsArchivedTab] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [fetchedHabits, fetchedCategories] = await Promise.all([
        api.getHabits(isArchivedTab),
        api.getCategories(),
      ]);
      setHabits(fetchedHabits);
      setCategories(fetchedCategories);
    } catch (err) {
      console.warn('Error loading habits:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isArchivedTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const handleCreateHabit = async (data: any) => {
    const created = await api.createHabit(data);
    setHabits(prev => [created, ...prev]);
  };

  const handleArchiveToggle = async (habit: Habit) => {
    const nextArchived = !habit.isArchived;
    await api.archiveHabit(habit.id, nextArchived);
    // Remove from current view tab
    setHabits(prev => prev.filter(h => h.id !== habit.id));
  };

  const handleDeleteHabit = async (habit: Habit) => {
    await api.deleteHabit(habit.id);
    setHabits(prev => prev.filter(h => h.id !== habit.id));
  };

  const filteredHabits = habits.filter(h => {
    if (selectedCatId === 'ALL') return true;
    return h.categoryId === selectedCatId;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>All Habits</Text>
          <Text style={styles.subtitle}>
            {habits.length} {isArchivedTab ? 'archived' : 'active'} routines
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreateModal(true)}
          accessibilityLabel="Create habit"
        >
          <Plus size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>New Habit</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: Active vs Archived */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, !isArchivedTab && styles.segmentBtnActive]}
          onPress={() => setIsArchivedTab(false)}
        >
          <Text style={[styles.segmentText, !isArchivedTab && styles.segmentTextActive]}>
            Active Habits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, isArchivedTab && styles.segmentBtnActive]}
          onPress={() => setIsArchivedTab(true)}
        >
          <Text style={[styles.segmentText, isArchivedTab && styles.segmentTextActive]}>
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Category Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, selectedCatId === 'ALL' && styles.filterPillActive]}
            onPress={() => setSelectedCatId('ALL')}
          >
            <Text style={[styles.filterPillText, selectedCatId === 'ALL' && styles.filterPillTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map(cat => {
            const isSelected = selectedCatId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: cat.color },
                ]}
                onPress={() => setSelectedCatId(cat.id)}
              >
                <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.filterPillText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Habits List */}
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
            <Text style={styles.loadingText}>Loading habits...</Text>
          </View>
        ) : filteredHabits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={44} color="#64748b" />
            <Text style={styles.emptyTitle}>
              {isArchivedTab ? 'No archived habits' : 'No habits found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedCatId !== 'ALL'
                ? 'No habits under this category. Switch category or create one.'
                : 'Create your first custom habit to start your streak.'}
            </Text>
            {!isArchivedTab && (
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.createFirstBtnText}>Create Habit</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isTodayMode={false}
              onArchiveToggle={() => handleArchiveToggle(habit)}
              onDelete={() => handleDeleteHabit(habit)}
            />
          ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
    minHeight: 44,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#334155',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  segmentTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minHeight: 44,
  },
  filterPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  filterPillTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  catDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 10,
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
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 16,
  },
  createFirstBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
