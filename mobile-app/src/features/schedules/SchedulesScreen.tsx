import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Clock,
  MapPin,
  Footprints,
  Plus,
  Shield,
  CheckCircle2,
  Crown,
  Sparkles,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import addonsService from '../../services/addons/AddonsService';
import healthStepService from '../../services/addons/HealthStepService';

const DAYS_MAP = [
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 },
  { label: 'S', full: 'Sun', value: 7 },
];

function formatDaysDisplay(days: number[]): string {
  if (!days || days.length === 0) return 'No days selected';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d))) {
    return 'Weekdays (Mon–Fri)';
  }
  if (sorted.length === 2 && [6, 7].every((d) => sorted.includes(d))) {
    return 'Weekends (Sat–Sun)';
  }
  return sorted
    .map((d) => DAYS_MAP.find((m) => m.value === d)?.full || `${d}`)
    .join(', ');
}

export const SchedulesScreen: React.FC = () => {
  const { openModal } = useAppNavigation();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const { schedules, toggleSchedule, createSchedule, deleteSchedule, profile, blockedTargets } =
    useFocusEngine();
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [isSyncingSteps, setIsSyncingSteps] = useState<boolean>(false);

  // Add Schedule Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('Deep Work Routine');
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newEndTime, setNewEndTime] = useState<string>('12:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Initial and periodic step synchronization from hardware sensor
  useEffect(() => {
    let isMounted = true;
    const fetchSteps = async () => {
      try {
        const steps = await addonsService.getTodaySteps();
        if (isMounted) setTodaySteps(steps);
      } catch {
        // Fallback silently
      }
    };

    fetchSteps();
    const interval = setInterval(fetchSteps, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleManualStepSync = async () => {
    setIsSyncingSteps(true);
    try {
      const steps = await healthStepService.getTodaySteps();
      setTodaySteps(steps);
      await healthStepService.enforceStepGating(schedules, blockedTargets);
    } finally {
      setIsSyncingSteps(false);
    }
  };

  const handleToggle = (id: string, currentlyActive: boolean, triggerType: string) => {
    const activeCount = schedules.filter((s) => s.is_active).length;

    // Spec: Free users can enable 1 active schedule only; geofence and health_steps require Pro
    if (!currentlyActive && !profile.is_pro) {
      if (activeCount >= 1 || triggerType === 'geofence' || triggerType === 'health_steps') {
        Alert.alert(
          'DHI Pro Schedule Limit',
          triggerType === 'geofence'
            ? 'GPS Location auto-lock is a DHI Pro feature.'
            : triggerType === 'health_steps'
            ? 'Step-Gated screen time rules require DHI Pro.'
            : 'Free tier allows 1 active schedule. Unlock DHI Pro for unlimited automated rules.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unlock Pro', onPress: () => openModal('paywall') },
          ]
        );
        return;
      }
    }

    toggleSchedule(id, !currentlyActive);

    if (triggerType === 'health_steps') {
      const updatedSchedules = schedules.map((s) =>
        s.id === id ? { ...s, is_active: !currentlyActive } : s
      );
      healthStepService.enforceStepGating(updatedSchedules, blockedTargets);
    }
  };

  const handleToggleStepGatingMaster = async (stepScheduleId?: string, isCurrentlyActive?: boolean) => {
    if (!profile.is_pro) {
      openModal('paywall');
      return;
    }

    if (stepScheduleId) {
      handleToggle(stepScheduleId, !!isCurrentlyActive, 'health_steps');
    } else {
      // First time activating step gating -> create default 5,000-step routine
      const newStepSchedule = {
        id: `sched_step_${Date.now()}`,
        user_id: profile.id,
        title: 'Daily 5,000 Step Screen Time Gate',
        trigger_type: 'health_steps' as const,
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
        step_goal: 5000,
        is_active: true,
      };
      await createSchedule(newStepSchedule);
      const updatedSchedules = [...schedules, newStepSchedule];
      await healthStepService.enforceStepGating(updatedSchedules, blockedTargets);
    }
  };

  const handleCreateNewSchedule = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('Routine Title Required', 'Please enter a name for your focus routine.');
      return;
    }

    // Time validation HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newStartTime.trim()) || !timeRegex.test(newEndTime.trim())) {
      Alert.alert('Invalid Time', 'Please enter valid 24-hour times (e.g. 09:00 and 12:00).');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Select Active Days', 'Please select at least one day for this routine.');
      return;
    }

    const timeSchedules = schedules.filter((s) => s.trigger_type === 'time');
    if (!profile.is_pro && timeSchedules.length >= 1) {
      setIsAddModalOpen(false);
      openModal('paywall');
      return;
    }

    await createSchedule({
      id: `sched_time_${Date.now()}`,
      user_id: profile.id,
      title: trimmedTitle,
      trigger_type: 'time',
      start_time: newStartTime.trim(),
      end_time: newEndTime.trim(),
      days_of_week: selectedDays,
      is_active: true,
    });

    setIsAddModalOpen(false);
  };

  const handleApplyPresetAndCreate = async (
    title: string,
    start: string,
    end: string,
    days: number[]
  ) => {
    const timeSchedules = schedules.filter((s) => s.trigger_type === 'time');
    if (!profile.is_pro && timeSchedules.length >= 1) {
      openModal('paywall');
      return;
    }

    await createSchedule({
      id: `sched_time_${Date.now()}`,
      user_id: profile.id,
      title,
      trigger_type: 'time',
      start_time: start,
      end_time: end,
      days_of_week: days,
      is_active: true,
    });
  };

  const handleDeleteSchedule = (id: string, title: string) => {
    Alert.alert('Delete Routine', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSchedule(id),
      },
    ]);
  };

  const toggleDaySelection = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length === 1) return; // keep at least 1
      setSelectedDays(selectedDays.filter((d) => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort((a, b) => a - b));
    }
  };

  const timeSchedules = schedules.filter((s) => s.trigger_type === 'time');
  const geofenceSchedules = schedules.filter((s) => s.trigger_type === 'geofence');
  const stepSchedules = schedules.filter((s) => s.trigger_type === 'health_steps');
  const activeStepRule = stepSchedules[0];
  const stepGoal = activeStepRule?.step_goal || 5000;
  const isStepGoalMet = todaySteps >= stepGoal;

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
        {/* Figma 10 Header: Schedules | + New */}
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Schedules</Text>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (!profile.is_pro && timeSchedules.length >= 1) {
                openModal('paywall');
                return;
              }
              setNewTitle('Deep Work Routine');
              setNewStartTime('09:00');
              setNewEndTime('12:00');
              setSelectedDays([1, 2, 3, 4, 5]);
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={15} color={colors.primaryAccent} />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Figma 10 Main: Plan your focus */}
        <View style={styles.mainTitleBlock}>
          <Text style={styles.mainHeadline}>Plan your focus</Text>
          <Text style={styles.mainSubhead}>
            Create a routine or start with a preset.
          </Text>
        </View>

        {/* Daily Routine Presets (Figma 10) */}
        <Text style={styles.routineSectionLabel}>START WITH A DAILY ROUTINE</Text>

        <View style={styles.presetsList}>
          {/* Preset 1: Morning deep work */}
          <GlassCard style={styles.presetCard}>
            <View style={styles.presetTopRow}>
              <View style={styles.routineIconBackplate}>
                <Clock size={16} color={colors.primaryAccent} />
              </View>
              <Text style={styles.presetRoutineTitle}>Morning deep work</Text>
            </View>
            <View style={styles.presetBottomRow}>
              <View style={styles.presetTimeCol}>
                <Text style={styles.presetTimeLarge}>9:00 – 11:30 AM</Text>
                <Text style={styles.presetDaysPill}>Mon–Fri</Text>
              </View>
              <TouchableOpacity
                style={styles.addPresetActionBtn}
                activeOpacity={0.8}
                onPress={() =>
                  handleApplyPresetAndCreate(
                    'Morning deep work',
                    '09:00',
                    '11:30',
                    [1, 2, 3, 4, 5]
                  )
                }
              >
                <Text style={styles.addPresetActionText}>Add</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Preset 2: Sleep wind-down */}
          <GlassCard style={styles.presetCard}>
            <View style={styles.presetTopRow}>
              <View style={styles.routineIconBackplate}>
                <Clock size={16} color={colors.primaryAccent} />
              </View>
              <Text style={styles.presetRoutineTitle}>Sleep wind-down</Text>
            </View>
            <View style={styles.presetBottomRow}>
              <View style={styles.presetTimeCol}>
                <Text style={styles.presetTimeLarge}>10:30 PM – 7:00 AM</Text>
                <Text style={styles.presetDaysPill}>Every day</Text>
              </View>
              <TouchableOpacity
                style={styles.addPresetActionBtn}
                activeOpacity={0.8}
                onPress={() =>
                  handleApplyPresetAndCreate(
                    'Sleep wind-down',
                    '22:30',
                    '07:00',
                    [1, 2, 3, 4, 5, 6, 7]
                  )
                }
              >
                <Text style={styles.addPresetActionText}>Add</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Existing Active Time Schedules if any */}
        {timeSchedules.length > 0 && (
          <View style={styles.activeSchedulesBlock}>
            <Text style={styles.routineSectionLabel}>ACTIVE SCHEDULES</Text>
            <View style={styles.cardsList}>
              {timeSchedules.map((schedule) => (
                <GlassCard key={schedule.id} style={styles.scheduleCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.scheduleInfoCol}>
                      <Text style={styles.scheduleName}>{schedule.title}</Text>
                      <Text style={styles.scheduleTime}>
                        {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                      </Text>
                      <Text style={styles.scheduleDays}>
                        {formatDaysDisplay(schedule.days_of_week)}
                      </Text>
                    </View>
                    <View style={styles.cardTopActions}>
                      <TouchableOpacity
                        onPress={() => handleDeleteSchedule(schedule.id, schedule.title)}
                        style={styles.deleteIconBtn}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={16} color={colors.secondaryMutedText} />
                      </TouchableOpacity>
                      <Switch
                        value={schedule.is_active}
                        onValueChange={() =>
                          handleToggle(schedule.id, schedule.is_active, schedule.trigger_type)
                        }
                        trackColor={{
                          false: colors.hairlineBorder,
                          true: colors.primaryAccent,
                        }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                  <View style={styles.cardFooterRow}>
                    <Shield size={14} color={colors.secondaryMutedText} />
                    <Text style={styles.cardFooterText}>
                      {blockedTargets.length} apps locked automatically during this window
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* Figma 10: MORE WAYS TO FOCUS */}
        <Text style={[styles.routineSectionLabel, { marginTop: 28 }]}>MORE WAYS TO FOCUS</Text>

        <GlassCard style={styles.moreWaysCard}>
          {/* Location-based focus */}
          <TouchableOpacity
            style={styles.moreWaysRow}
            activeOpacity={0.75}
            onPress={() => {
              if (!profile.is_pro) openModal('paywall');
              else Alert.alert('Add Location', 'Define a 200m focus perimeter around your workplace or school.');
            }}
          >
            <View style={styles.moreWaysIconBox}>
              <MapPin size={18} color={colors.positiveAccent} />
            </View>
            <View style={styles.moreWaysTextCol}>
              <Text style={styles.moreWaysTitle}>Location-based focus</Text>
              <Text style={styles.moreWaysSubtitle}>Activate at work or your study space.</Text>
            </View>
            <X size={16} color={colors.secondaryMutedText} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>

          <View style={styles.moreWaysDivider} />

          {/* Earn your screen time */}
          <TouchableOpacity
            style={styles.moreWaysRow}
            activeOpacity={0.75}
            onPress={() => handleToggleStepGatingMaster(activeStepRule?.id, activeStepRule?.is_active)}
          >
            <View style={styles.moreWaysIconBox}>
              <Footprints size={18} color={colors.positiveAccent} />
            </View>
            <View style={styles.moreWaysTextCol}>
              <Text style={styles.moreWaysTitle}>Earn your screen time</Text>
              <Text style={styles.moreWaysSubtitle}>Unlock time by reaching a step goal ({todaySteps.toLocaleString()} steps today).</Text>
            </View>
            <Switch
              value={!!activeStepRule?.is_active}
              onValueChange={() => handleToggleStepGatingMaster(activeStepRule?.id, activeStepRule?.is_active)}
              trackColor={{ false: colors.hairlineBorder, true: colors.positiveAccent }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      {/* ==================================================== */}
      {/* ADD SCHEDULE MODAL */}
      {/* ==================================================== */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <Clock size={20} color={colors.primaryAccent} />
                <Text style={styles.modalTitle}>New Focus Schedule</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.secondaryMutedText} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <Text style={styles.modalInputLabel}>QUICK PRESETS</Text>
            <View style={styles.modalPresetsRow}>
              <TouchableOpacity
                style={styles.modalPresetPill}
                onPress={() => {
                  setNewTitle('Morning Deep Work');
                  setNewStartTime('09:00');
                  setNewEndTime('11:30');
                  setSelectedDays([1, 2, 3, 4, 5]);
                }}
              >
                <Text style={styles.modalPresetPillText}>Morning (9:00-11:30)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPresetPill}
                onPress={() => {
                  setNewTitle('Afternoon Focus');
                  setNewStartTime('14:00');
                  setNewEndTime('17:00');
                  setSelectedDays([1, 2, 3, 4, 5]);
                }}
              >
                <Text style={styles.modalPresetPillText}>Afternoon (14:00-17:00)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPresetPill}
                onPress={() => {
                  setNewTitle('Sleep Wind-Down');
                  setNewStartTime('22:30');
                  setNewEndTime('07:00');
                  setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
                }}
              >
                <Text style={styles.modalPresetPillText}>Night (22:30-07:00)</Text>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <Text style={styles.modalInputLabel}>ROUTINE NAME</Text>
            <TextInput
              style={styles.modalTextInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Work Deep Work, Study Window"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />

            {/* Time Window Inputs */}
            <View style={styles.timeInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>START TIME (24H)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                  placeholder="09:00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>END TIME (24H)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newEndTime}
                  onChangeText={setNewEndTime}
                  placeholder="12:00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>

            {/* Days Selection */}
            <View style={styles.daysHeaderRow}>
              <Text style={styles.modalInputLabel}>REPEATING DAYS</Text>
              <View style={styles.daysQuickTogglesRow}>
                <TouchableOpacity
                  onPress={() => setSelectedDays([1, 2, 3, 4, 5])}
                  style={styles.quickDayBtn}
                >
                  <Text style={styles.quickDayBtnText}>Weekdays</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                  style={styles.quickDayBtn}
                >
                  <Text style={styles.quickDayBtnText}>All Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dayPillsRow}>
              {DAYS_MAP.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                    onPress={() => toggleDaySelection(day.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayPillText, isSelected && styles.dayPillTextSelected]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveRoutineBtn}
              activeOpacity={0.8}
              onPress={handleCreateNewSchedule}
            >
              <Sparkles size={16} color="#08090D" />
              <Text style={styles.saveRoutineBtnText}>Save Focus Routine</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainTitleBlock: {
    marginBottom: 20,
    gap: 4,
  },
  mainHeadline: {
    fontSize: 34,
    fontWeight: '600',
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  mainSubhead: {
    fontSize: 16,
    color: colors.secondaryMutedText,
  },
  routineSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: colors.secondaryMutedText,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  presetsList: {
    gap: 12,
    marginBottom: 20,
  },
  presetCard: {
    padding: 18,
    borderRadius: 19,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineIconBackplate: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#293D61',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRoutineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  presetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  presetTimeCol: {
    gap: 4,
  },
  presetTimeLarge: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.primaryText,
  },
  presetDaysPill: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
  addPresetActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#293F65',
  },
  addPresetActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  activeSchedulesBlock: {
    marginBottom: 20,
  },
  moreWaysCard: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
  },
  moreWaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  moreWaysIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(165, 217, 200, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreWaysTextCol: {
    flex: 1,
    gap: 2,
  },
  moreWaysTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  moreWaysSubtitle: {
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  moreWaysDivider: {
    height: 1,
    backgroundColor: '#2A2D36',
    marginVertical: 12,
  },
  screenTitle: {
    ...typography.displayMedium,
    fontSize: 24,
    marginBottom: 4,
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.primaryText,
    fontSize: 14,
  },
  moreWaysHeading: {
    ...typography.titleMedium,
    color: colors.primaryText,
    fontSize: 17,
    marginTop: 10,
    marginBottom: 2,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(169, 185, 255, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(169, 185, 255, 0.3)',
  },
  addBtnText: {
    ...typography.caption,
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  cardsList: {
    gap: 10,
  },
  scheduleCard: {
    padding: 14,
    borderRadius: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  cardTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scheduleName: {
    ...typography.titleMedium,
    fontSize: 16,
    marginBottom: 2,
  },
  scheduleTime: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleDays: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  cardFooterText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
  },
  stepGatedCard: {
    padding: 16,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  stepProgressContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  stepProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCounterText: {
    ...typography.titleMedium,
    fontSize: 13,
    color: colors.primaryText,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  earnedBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.warningAccent,
    fontWeight: '700',
  },
  stepProgressBarBg: {
    height: 6,
    backgroundColor: colors.hairlineBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  stepProgressBarFill: {
    height: '100%',
    backgroundColor: colors.warningAccent,
    borderRadius: 3,
  },
  healthSyncNote: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  stepActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  stepActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryAccentGlow,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
  },
  stepSimulateBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  stepActionBtnText: {
    ...typography.caption,
    color: colors.primaryAccent,
    fontWeight: '600',
    fontSize: 11,
  },
  dashedRoutineCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(169, 185, 255, 0.4)',
    backgroundColor: 'rgba(169, 185, 255, 0.04)',
    padding: 14,
    marginBottom: 12,
  },
  dashedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dashedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAccentGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedCardTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    color: colors.primaryText,
    fontWeight: '700',
  },
  dashedCardSub: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    marginTop: 1,
  },
  presetButtonsRow: {
    gap: 8,
  },
  presetChip: {
    backgroundColor: 'rgba(17, 20, 29, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  presetChipTitle: {
    ...typography.titleMedium,
    fontSize: 13,
    color: colors.primaryAccent,
    fontWeight: '600',
  },
  presetChipBadge: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primaryAccent,
    backgroundColor: colors.primaryAccentGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
  },
  presetChipDesc: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
  },
  interactiveEmptyCard: {
    padding: 16,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  emptyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  emptyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardTextCol: {
    flex: 1,
  },
  emptyCardTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '700',
    marginBottom: 3,
  },
  emptyCardDesc: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    lineHeight: 16,
  },
  emptyPresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyPresetBtnText: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#11141D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    ...typography.titleMedium,
    fontSize: 18,
    color: colors.primaryText,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalInputLabel: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  modalPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  modalPresetPill: {
    backgroundColor: colors.primaryAccentGlow,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalPresetPillText: {
    ...typography.caption,
    color: colors.primaryAccent,
    fontSize: 10,
    fontWeight: '600',
  },
  modalTextInput: {
    backgroundColor: '#08090D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysQuickTogglesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDayBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickDayBtnText: {
    fontSize: 9,
    color: colors.secondaryMutedText,
    fontWeight: '600',
  },
  dayPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#08090D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillSelected: {
    backgroundColor: colors.primaryAccentGlow,
    borderColor: colors.primaryAccent,
  },
  dayPillText: {
    color: colors.secondaryMutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  dayPillTextSelected: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  saveRoutineBtn: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: Platform.OS === 'ios' ? 16 : 6,
  },
  saveRoutineBtnText: {
    color: '#08090D',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SchedulesScreen;
