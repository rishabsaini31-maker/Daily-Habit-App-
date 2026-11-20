import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Category, FrequencyType, TargetType } from '../types';

interface CreateHabitModalProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (habitData: {
    title: string;
    description?: string;
    categoryId: string;
    frequencyType: FrequencyType;
    frequencyPayload?: number[];
    targetType: TargetType;
    targetValue?: number;
    unit?: string;
    reminderTime?: string;
    color: string;
    icon: string;
  }) => Promise<void>;
}

const PALETTE = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
];

const WEEK_DAYS = [
  { label: 'M', day: 1 },
  { label: 'T', day: 2 },
  { label: 'W', day: 3 },
  { label: 'T', day: 4 },
  { label: 'F', day: 5 },
  { label: 'S', day: 6 },
  { label: 'S', day: 0 },
];

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  visible,
  categories,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'cat-prod');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('DAILY');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [targetType, setTargetType] = useState<TargetType>('BOOLEAN');
  const [targetValue, setTargetValue] = useState('2000');
  const [unit, setUnit] = useState('ml');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a habit title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: selectedCatId,
        frequencyType,
        frequencyPayload: frequencyType === 'WEEKLY_DAYS' ? selectedDays : undefined,
        targetType,
        targetValue: targetType === 'NUMERIC' ? parseFloat(targetValue) || 1 : undefined,
        unit: targetType === 'NUMERIC' ? unit.trim() || undefined : undefined,
        reminderTime: reminderTime.trim() || undefined,
        color: selectedColor,
        icon: 'Check',
      });

      // Reset
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Habit</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close dialog"
            >
              <X size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {errorMsg ? <Text style={styles.errorBanner}>{errorMsg}</Text> : null}

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.inputLabel}>HABIT TITLE *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Morning Jog, Read 20 mins"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Why does this habit matter to you?"
              placeholderTextColor="#64748b"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={2}
              maxLength={500}
            />

            {/* Category selection */}
            <Text style={styles.inputLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map(cat => {
                const isSelected = selectedCatId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catPill,
                      isSelected && { borderColor: cat.color, backgroundColor: 'rgba(255,255,255,0.08)' },
                    ]}
                    onPress={() => setSelectedCatId(cat.id)}
                  >
                    <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.catPillText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Frequency selection */}
            <Text style={styles.inputLabel}>FREQUENCY</Text>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, frequencyType === 'DAILY' && styles.segmentBtnActive]}
                onPress={() => setFrequencyType('DAILY')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    frequencyType === 'DAILY' && styles.segmentTextActive,
                  ]}
                >
                  Every Day
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  frequencyType === 'WEEKLY_DAYS' && styles.segmentBtnActive,
                ]}
                onPress={() => setFrequencyType('WEEKLY_DAYS')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    frequencyType === 'WEEKLY_DAYS' && styles.segmentTextActive,
                  ]}
                >
                  Specific Days
                </Text>
              </TouchableOpacity>
            </View>

            {/* Days of week selector */}
            {frequencyType === 'WEEKLY_DAYS' && (
              <View style={styles.daysSelectorRow}>
                {WEEK_DAYS.map((item, idx) => {
                  const isDaySelected = selectedDays.includes(item.day);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dayPickCircle, isDaySelected && styles.dayPickCircleActive]}
                      onPress={() => toggleDay(item.day)}
                    >
                      <Text
                        style={[styles.dayPickText, isDaySelected && styles.dayPickTextActive]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Target Type */}
            <Text style={styles.inputLabel}>TARGET TYPE</Text>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, targetType === 'BOOLEAN' && styles.segmentBtnActive]}
                onPress={() => setTargetType('BOOLEAN')}
              >
                <Text
                  style={[styles.segmentText, targetType === 'BOOLEAN' && styles.segmentTextActive]}
                >
                  Done / Not Done
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, targetType === 'NUMERIC' && styles.segmentBtnActive]}
                onPress={() => setTargetType('NUMERIC')}
              >
                <Text
                  style={[styles.segmentText, targetType === 'NUMERIC' && styles.segmentTextActive]}
                >
                  Numeric Goal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Numeric input row */}
            {targetType === 'NUMERIC' && (
              <View style={styles.numericRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSublabel}>Target Goal</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 2000"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={targetValue}
                    onChangeText={setTargetValue}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSublabel}>Unit Label</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. ml, mins, pages"
                    placeholderTextColor="#64748b"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            )}

            {/* Reminder time */}
            <Text style={styles.inputLabel}>REMINDER TIME (HH:MM)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 08:30"
              placeholderTextColor="#64748b"
              value={reminderTime}
              onChangeText={setReminderTime}
            />

            {/* Color palette */}
            <Text style={styles.inputLabel}>COLOR THEME</Text>
            <View style={styles.paletteRow}>
              {PALETTE.map((color, index) => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.colorCircle, { backgroundColor: color }]}
                    onPress={() => setSelectedColor(color)}
                    accessibilityLabel={`Select color ${color}`}
                  >
                    {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: selectedColor }]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Saving...' : 'Create Habit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 6,
  },
  inputSublabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    minHeight: 46,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  catScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
    minHeight: 44,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catPillText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
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
    color: '#94a3b8',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  daysSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayPickCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPickCircleActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  dayPickText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  dayPickTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  numericRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  submitBtn: {
    flex: 2,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
