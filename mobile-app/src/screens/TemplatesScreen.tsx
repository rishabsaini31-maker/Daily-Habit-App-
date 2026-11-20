import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Compass,
  Search,
  Sparkles,
  Check,
  Plus,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { HabitTemplate, Category } from '../types';
import { api } from '../services/api';

interface TemplatesScreenProps {
  onTemplateAdopted: () => void;
}

export const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ onTemplateAdopted }) => {
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [fetchedTemplates, fetchedCategories] = await Promise.all([
        api.getTemplates(),
        api.getCategories(),
      ]);
      setTemplates(fetchedTemplates);
      setCategories(fetchedCategories);
    } catch (err) {
      console.warn('Error loading templates:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const handleAdopt = async (template: HabitTemplate) => {
    try {
      setAdoptingId(template.id);
      await api.adoptTemplate(template.id);
      setAdoptedIds(prev => new Set([...prev, template.id]));
      setTimeout(() => {
        onTemplateAdopted();
      }, 700);
    } catch (err) {
      console.warn('Failed to adopt template:', err);
    } finally {
      setAdoptingId(null);
    }
  };

  const filteredTemplates = templates.filter(tmpl => {
    if (selectedCatId !== 'ALL' && tmpl.categoryId !== selectedCatId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tmpl.title.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover Routines</Text>
          <Text style={styles.subtitle}>Curated templates verified by habit experts</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates (e.g. mindfulness, water)"
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills */}
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

      {/* Templates List */}
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
            <Text style={styles.loadingText}>Fetching curated routines...</Text>
          </View>
        ) : filteredTemplates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Compass size={44} color="#64748b" />
            <Text style={styles.emptyTitle}>No templates match your search</Text>
            <Text style={styles.emptySubtitle}>Try clearing filters or search query.</Text>
          </View>
        ) : (
          filteredTemplates.map(tmpl => {
            const isAdopted = adoptedIds.has(tmpl.id);
            const isBusy = adoptingId === tmpl.id;

            return (
              <View key={tmpl.id} style={styles.templateCard}>
                <View style={[styles.accentStrip, { backgroundColor: tmpl.color }]} />

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      {tmpl.category && (
                        <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                          <Text style={[styles.tagText, { color: tmpl.category.color }]}>
                            {tmpl.category.name}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tag}>
                        <Text style={styles.tagTextMuted}>
                          {tmpl.frequencyType === 'DAILY' ? 'Daily' : 'Weekly Routine'}
                        </Text>
                      </View>
                      {tmpl.targetType === 'NUMERIC' && tmpl.targetValue && (
                        <View style={styles.tag}>
                          <Text style={styles.tagTextMuted}>
                            {tmpl.targetValue} {tmpl.unit || ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.tmplTitle}>{tmpl.title}</Text>
                  <Text style={styles.tmplDesc}>{tmpl.description}</Text>

                  {/* 1-Tap Adopt Button */}
                  <TouchableOpacity
                    style={[
                      styles.adoptBtn,
                      isAdopted ? styles.adoptBtnSuccess : { backgroundColor: tmpl.color },
                    ]}
                    onPress={() => handleAdopt(tmpl)}
                    disabled={isBusy || isAdopted}
                    activeOpacity={0.8}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : isAdopted ? (
                      <>
                        <Check size={16} color="#ffffff" strokeWidth={3} />
                        <Text style={styles.adoptBtnText}>Added to Today!</Text>
                      </>
                    ) : (
                      <>
                        <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                        <Text style={styles.adoptBtnText}>1-Tap Adopt Routine</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 44,
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
  },
  templateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentStrip: {
    width: 5,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextMuted: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tmplTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  tmplDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  adoptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    minHeight: 44,
  },
  adoptBtnSuccess: {
    backgroundColor: '#059669',
  },
  adoptBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
