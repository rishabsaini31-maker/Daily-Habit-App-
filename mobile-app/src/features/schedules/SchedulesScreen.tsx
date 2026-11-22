import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
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
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import addonsService from '../../services/addons/AddonsService';
import healthStepService from '../../services/addons/HealthStepService';

export const SchedulesScreen: React.FC = () => {
  const { openModal } = useAppNavigation();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const { schedules, toggleSchedule, profile, blockedTargets } = useFocusEngine();
  const [todaySteps, setTodaySteps] = useState<number>(0);

  useEffect(() => {
    addonsService.getTodaySteps().then(setTodaySteps);
  }, []);

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

  const handleSimulateSteps = async () => {
    const newSteps = isStepGoalMet ? 3200 : stepGoal + 500;
    await healthStepService.setTodaySteps(newSteps);
    setTodaySteps(newSteps);
    const result = await healthStepService.enforceStepGating(schedules, blockedTargets);
    Alert.alert(
      result.shouldShield ? 'Step Gate Shield Active' : 'Step Goal Reached! Screen Time Unlocked ✓',
      result.shouldShield
        ? `Walked ${newSteps.toLocaleString()} / ${stepGoal.toLocaleString()} steps. Apps remain shielded until goal is met.`
        : `Walked ${newSteps.toLocaleString()} steps! Automatic OS shield has been lifted. Enjoy mindful screen time.`
    );
  };

  const timeSchedules = schedules.filter((s) => s.trigger_type === 'time');
  const geofenceSchedules = schedules.filter((s) => s.trigger_type === 'geofence');
  const stepSchedules = schedules.filter((s) => s.trigger_type === 'health_steps');
  const stepGoal = stepSchedules[0]?.step_goal || 5000;
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
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Smart Schedules</Text>
            <Text style={styles.screenSubtitle}>
              Automate your focus blocks by time, location, or daily steps
            </Text>
          </View>
        </View>

        {/* 1. TIME-BASED RECURRING RULES */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Clock size={18} color={colors.primaryAccent} />
            <Text style={styles.sectionTitle}>TIME-BASED SCHEDULES</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (!profile.is_pro && timeSchedules.length >= 1) openModal('paywall');
              else Alert.alert('Add Schedule', 'Configure custom recurring hour windows.');
            }}
          >
            <Plus size={16} color={colors.primaryAccent} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {timeSchedules.length === 0 ? (
          <View style={styles.dashedRoutineCard}>
            <View style={styles.dashedCardHeader}>
              <View style={styles.dashedIconWrap}>
                <Sparkles size={16} color={colors.primaryAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dashedCardTitle}>Create your first daily focus routine</Text>
                <Text style={styles.dashedCardSub}>
                  Quick 1-tap presets to eliminate decision fatigue
                </Text>
              </View>
            </View>

            <View style={styles.presetButtonsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                activeOpacity={0.7}
                onPress={() => {
                  if (!profile.is_pro && timeSchedules.length >= 1) {
                    openModal('paywall');
                  } else {
                    Alert.alert('Preset Activated', 'Morning Deep Work (9:00 – 11:30 AM) added to daily routines.');
                  }
                }}
              >
                <View style={styles.presetChipTop}>
                  <Text style={styles.presetChipTitle}>Morning Deep Work</Text>
                  <Text style={styles.presetChipBadge}>9:00 – 11:30 AM</Text>
                </View>
                <Text style={styles.presetChipDesc}>Shields distractions during peak morning energy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                activeOpacity={0.7}
                onPress={() => {
                  if (!profile.is_pro && timeSchedules.length >= 1) {
                    openModal('paywall');
                  } else {
                    Alert.alert('Preset Activated', 'Sleep Wind-Down (10:30 PM – 7:00 AM) added to daily routines.');
                  }
                }}
              >
                <View style={styles.presetChipTop}>
                  <Text style={styles.presetChipTitle}>Sleep Wind-Down</Text>
                  <Text style={styles.presetChipBadge}>10:30 PM – 7:00 AM</Text>
                </View>
                <Text style={styles.presetChipDesc}>Locks doomscroll apps for deep restorative sleep</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
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
                      Days: {schedule.days_of_week.join(', ')}
                    </Text>
                  </View>
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
                <View style={styles.cardFooterRow}>
                  <Shield size={14} color={colors.secondaryMutedText} />
                  <Text style={styles.cardFooterText}>
                    {blockedTargets.length} apps locked automatically
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* 2. GPS LOCATION AUTO-LOCK */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionHeaderLeft}>
            <MapPin size={18} color={colors.positiveAccent} />
            <Text style={styles.sectionTitle}>GPS LOCATION AUTO-LOCK</Text>
            {!profile.is_pro && (
              <View style={styles.proTag}>
                <Crown size={10} color="#FBBF24" />
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            )}
          </View>
        </View>

        {geofenceSchedules.length === 0 ? (
          <GlassCard style={styles.interactiveEmptyCard}>
            <View style={styles.emptyCardHeader}>
              <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <MapPin size={20} color={colors.positiveAccent} />
              </View>
              <View style={styles.emptyCardTextCol}>
                <Text style={styles.emptyCardTitle}>Workplace & Study Auto-Lock</Text>
                <Text style={styles.emptyCardDesc}>
                  Enter stealth focus automatically when stepping into your office, campus, or study space.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.emptyPresetBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (!profile.is_pro) openModal('paywall');
                else Alert.alert('Add Location', 'Tap to define a 200m focus perimeter on map.');
              }}
            >
              <Plus size={14} color={colors.positiveAccent} />
              <Text style={[styles.emptyPresetBtnText, { color: colors.positiveAccent }]}>
                {profile.is_pro ? 'Set Up Location Fence' : 'Unlock GPS Auto-Lock (DHI Pro)'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <View style={styles.cardsList}>
            {geofenceSchedules.map((rule) => (
              <GlassCard key={rule.id} style={styles.scheduleCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.scheduleInfoCol}>
                    <Text style={styles.scheduleName}>{rule.title}</Text>
                    <Text style={styles.scheduleTime}>
                      {rule.geofence_lat}, {rule.geofence_lng}
                    </Text>
                    <Text style={styles.scheduleDays}>
                      Auto-locks within {rule.geofence_radius_m || 200}m geofence
                    </Text>
                  </View>
                  <Switch
                    value={rule.is_active}
                    onValueChange={() =>
                      handleToggle(rule.id, rule.is_active, rule.trigger_type)
                    }
                    trackColor={{
                      false: colors.hairlineBorder,
                      true: colors.positiveAccent,
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* 3. STEP-GATED "EARN SCREEN TIME" RULES */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionHeaderLeft}>
            <Footprints size={18} color={colors.warningAccent} />
            <Text style={styles.sectionTitle}>STEP-GATED "EARN TIME"</Text>
            {!profile.is_pro && (
              <View style={styles.proTag}>
                <Crown size={10} color="#FBBF24" />
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            )}
          </View>
        </View>

        {stepSchedules.length === 0 ? (
          <GlassCard style={styles.stepGatedCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.scheduleInfoCol}>
                <Text style={styles.scheduleName}>Daily 5,000 Step Screen Time Gate</Text>
                <Text style={styles.scheduleTime}>
                  Walk {stepGoal.toLocaleString()} steps = Unlock Social Time
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {
                  if (!profile.is_pro) openModal('paywall');
                  else Alert.alert('Step Gating', 'Step gating enabled.');
                }}
                trackColor={{
                  false: colors.hairlineBorder,
                  true: colors.warningAccent,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSimulateSteps}
              style={styles.stepProgressContainer}
            >
              <View style={styles.stepProgressHeader}>
                <Text style={styles.stepCounterText}>
                  {todaySteps.toLocaleString()} / {stepGoal.toLocaleString()} steps today
                </Text>
                <View style={styles.earnedBadge}>
                  <CheckCircle2
                    size={12}
                    color={isStepGoalMet ? colors.positiveAccent : colors.secondaryMutedText}
                  />
                  <Text
                    style={[
                      styles.earnedBadgeText,
                      isStepGoalMet && { color: colors.positiveAccent },
                    ]}
                  >
                    {isStepGoalMet ? 'Goal Unlocked' : 'Locked'}
                  </Text>
                </View>
              </View>
              <View style={styles.stepProgressBarBg}>
                <View
                  style={[
                    styles.stepProgressBarFill,
                    { width: `${Math.min(100, (todaySteps / stepGoal) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.healthSyncNote}>
                Synced with Apple HealthKit & Android Health Connect • Tap to test step sync
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          stepSchedules.map((stepRule) => (
            <GlassCard key={stepRule.id} style={styles.stepGatedCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.scheduleInfoCol}>
                  <Text style={styles.scheduleName}>{stepRule.title}</Text>
                  <Text style={styles.scheduleTime}>
                    Walk {stepGoal.toLocaleString()} steps = Unlock Social Time
                  </Text>
                </View>
                <Switch
                  value={stepRule.is_active}
                  onValueChange={() =>
                    handleToggle(stepRule.id, stepRule.is_active, stepRule.trigger_type)
                  }
                  trackColor={{
                    false: colors.hairlineBorder,
                    true: colors.warningAccent,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Step progress bar */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSimulateSteps}
                style={styles.stepProgressContainer}
              >
                <View style={styles.stepProgressHeader}>
                  <Text style={styles.stepCounterText}>
                    {todaySteps.toLocaleString()} / {stepGoal.toLocaleString()} steps today
                  </Text>
                  <View style={styles.earnedBadge}>
                    <CheckCircle2
                      size={12}
                      color={isStepGoalMet ? colors.positiveAccent : colors.secondaryMutedText}
                    />
                    <Text
                      style={[
                        styles.earnedBadgeText,
                        isStepGoalMet && { color: colors.positiveAccent },
                      ]}
                    >
                      {isStepGoalMet ? 'Goal Unlocked' : 'Locked'}
                    </Text>
                  </View>
                </View>
                <View style={styles.stepProgressBarBg}>
                  <View
                    style={[
                      styles.stepProgressBarFill,
                      { width: `${Math.min(100, (todaySteps / stepGoal) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.healthSyncNote}>
                  Synced with Apple HealthKit & Android Health Connect • Tap to test step sync
                </Text>
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
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
  titleRow: {
    marginBottom: 16,
  },
  screenTitle: {
    ...typography.displayMedium,
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
    ...typography.caption,
    color: colors.secondaryMutedText,
    letterSpacing: 1.2,
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
    padding: 16,
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  earnedBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondaryMutedText,
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
  dashedRoutineCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    padding: 16,
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
});

export default SchedulesScreen;
