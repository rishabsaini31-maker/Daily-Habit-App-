import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import {
  Check,
  Circle,
  Clock,
  Plus,
  Minus,
  Sparkles,
  Archive,
  Trash2,
  MoreVertical,
} from 'lucide-react-native';
import { Habit } from '../types';
import { StreakBadge } from './StreakBadge';
import { ProgressBar } from './ProgressBar';

interface HabitCardProps {
  habit: Habit;
  isTodayMode?: boolean;
  isCompleted?: boolean;
  currentValue?: number;
  onToggle?: () => void;
  onUpdateValue?: (newValue: number) => void;
  onArchiveToggle?: () => void;
  onDelete?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isTodayMode = true,
  isCompleted = false,
  currentValue = 0,
  onToggle,
  onUpdateValue,
  onArchiveToggle,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [localNumericVal, setLocalNumericVal] = useState<number>(currentValue);

  const isNumeric = habit.targetType === 'NUMERIC';
  const targetVal = habit.targetValue || 1;
  const isTargetReached = isNumeric ? localNumericVal >= targetVal : isCompleted;

  const handleIncrement = (amount: number) => {
    const next = Math.max(0, localNumericVal + amount);
    setLocalNumericVal(next);
    if (onUpdateValue) onUpdateValue(next);
  };

  const handleQuickCheck = () => {
    if (onToggle) onToggle();
  };

  const frequencyLabel =
    habit.frequencyType === 'DAILY'
      ? 'Daily'
      : habit.frequencyType === 'WEEKLY_DAYS' && Array.isArray(habit.frequencyPayload)
      ? `${habit.frequencyPayload.length}x/wk`
      : 'Weekly';

  return (
    <View style={[styles.card, isTargetReached && styles.cardCompleted]}>
      {/* Accent left border pill */}
      <View style={[styles.accentStrip, { backgroundColor: habit.color || '#10b981' }]} />

      <View style={styles.content}>
        {/* Header row: title, category tag, frequency, more menu */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <View style={styles.titleLine}>
              <Text
                style={[styles.title, isTargetReached && styles.titleCompleted]}
                numberOfLines={1}
              >
                {habit.title}
              </Text>
            </View>

            <View style={styles.tagsRow}>
              {habit.category && (
                <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  <Text style={[styles.tagText, { color: habit.category.color }]}>
                    {habit.category.name}
                  </Text>
                </View>
              )}
              <View style={styles.tag}>
                <Text style={styles.tagTextMuted}>{frequencyLabel}</Text>
              </View>
              {habit.reminderTime && (
                <View style={styles.tag}>
                  <Clock size={11} color="#94a3b8" />
                  <Text style={styles.tagTextMuted}>{habit.reminderTime}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action toggle / more button */}
          {!isTodayMode ? (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowMenu(!showMenu)}
              accessibilityLabel="Habit options"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            !isNumeric && (
              <TouchableOpacity
                style={[styles.checkButton, isTargetReached ? styles.checkButtonActive : styles.checkButtonInactive]}
                onPress={handleQuickCheck}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTargetReached }}
                accessibilityLabel={`Check-in for ${habit.title}`}
              >
                {isTargetReached ? (
                  <Check size={22} color="#ffffff" strokeWidth={3} />
                ) : (
                  <Circle size={22} color="#64748b" strokeWidth={2} />
                )}
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Description if present */}
        {habit.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {habit.description}
          </Text>
        ) : null}

        {/* Numeric Habit Progress Control (Today mode) */}
        {isNumeric && isTodayMode && (
          <View style={styles.numericControls}>
            <ProgressBar
              current={localNumericVal}
              total={targetVal}
              unit={habit.unit || ''}
              color={habit.color || '#10b981'}
            />

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => handleIncrement(targetVal > 100 ? -250 : -1)}
                accessibilityLabel="Decrease progress"
              >
                <Minus size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.numericInputBox}>
                <Text style={styles.numericValueText}>
                  {localNumericVal} <Text style={styles.numericUnitText}>{habit.unit || ''}</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.stepButton, styles.stepButtonPlus]}
                onPress={() => handleIncrement(targetVal > 100 ? 250 : 1)}
                accessibilityLabel="Increase progress"
              >
                <Plus size={18} color="#10b981" />
              </TouchableOpacity>

              {/* Complete target button */}
              <TouchableOpacity
                style={[
                  styles.targetButton,
                  isTargetReached ? styles.targetButtonCompleted : styles.targetButtonActive,
                ]}
                onPress={() => handleIncrement(Math.max(0, targetVal - localNumericVal))}
              >
                <Check size={16} color="#ffffff" />
                <Text style={styles.targetButtonText}>
                  {isTargetReached ? 'Target Met!' : 'Finish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Streak and Status Footer */}
        <View style={styles.footerRow}>
          <StreakBadge
            currentStreak={habit.streak?.currentStreak || 0}
            longestStreak={habit.streak?.longestStreak || 0}
            freezeCountRemaining={habit.streak?.freezeCountRemaining || 0}
            size="sm"
          />

          {isTargetReached && (
            <View style={styles.completedPill}>
              <Sparkles size={12} color="#10b981" />
              <Text style={styles.completedPillText}>Done for today</Text>
            </View>
          )}
        </View>

        {/* Dropdown menu for Habits tab (edit / archive / delete) */}
        {showMenu && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                if (onArchiveToggle) onArchiveToggle();
              }}
            >
              <Archive size={16} color="#94a3b8" />
              <Text style={styles.menuItemText}>
                {habit.isArchived ? 'Unarchive Habit' : 'Archive Habit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDelete]}
              onPress={() => {
                setShowMenu(false);
                if (onDelete) onDelete();
              }}
            >
              <Trash2 size={16} color="#f43f5e" />
              <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>Delete Habit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: '#172338',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  accentStrip: {
    width: 5,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  titleCompleted: {
    color: '#cbd5e1',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
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
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonInactive: {
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
  },
  checkButtonActive: {
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#34d399',
  },
  moreButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 18,
  },
  numericControls: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPlus: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  numericInputBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  numericUnitText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  targetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    gap: 4,
  },
  targetButtonActive: {
    backgroundColor: '#10b981',
  },
  targetButtonCompleted: {
    backgroundColor: '#059669',
  },
  targetButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  completedPillText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    minHeight: 44,
  },
  menuItemDelete: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  menuItemText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  menuItemTextDelete: {
    color: '#f43f5e',
  },
});
