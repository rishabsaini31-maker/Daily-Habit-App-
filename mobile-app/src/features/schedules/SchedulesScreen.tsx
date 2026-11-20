import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Footprints,
  Plus,
  Shield,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';

interface TimeSchedule {
  id: string;
  name: string;
  timeRange: string;
  days: string;
  isActive: boolean;
  blockedAppsCount: number;
}

interface LocationRule {
  id: string;
  name: string;
  address: string;
  radiusMeters: number;
  isActive: boolean;
}

export const SchedulesScreen: React.FC = () => {
  const [timeSchedules, setTimeSchedules] = useState<TimeSchedule[]>([
    {
      id: '1',
      name: 'Work Focus Block',
      timeRange: '09:00 AM – 05:00 PM',
      days: 'Mon, Tue, Wed, Thu, Fri',
      isActive: true,
      blockedAppsCount: 6,
    },
    {
      id: '2',
      name: 'Sleep Sanctuary',
      timeRange: '10:30 PM – 07:00 AM',
      days: 'Every Day',
      isActive: true,
      blockedAppsCount: 8,
    },
    {
      id: '3',
      name: 'Morning Mindfulness',
      timeRange: '07:00 AM – 08:30 AM',
      days: 'Every Day',
      isActive: false,
      blockedAppsCount: 4,
    },
  ]);

  const [locationRules, setLocationRules] = useState<LocationRule[]>([
    {
      id: 'loc-1',
      name: 'Office / Work HQ',
      address: 'Tech Park Tower 4',
      radiusMeters: 200,
      isActive: true,
    },
    {
      id: 'loc-2',
      name: 'Campus Library',
      address: 'University Main Hall',
      radiusMeters: 150,
      isActive: false,
    },
  ]);

  const [stepGatingEnabled, setStepGatingEnabled] = useState<boolean>(true);

  const toggleTimeSchedule = (id: string) => {
    setTimeSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const toggleLocationRule = (id: string) => {
    setLocationRules((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Smart Schedules</Text>
        <Text style={styles.screenSubtitle}>
          Automate blocking by time, GPS geofence, and physical activity
        </Text>

        {/* 1. TIME-BASED RECURRING RULES */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Clock size={18} color={colors.primaryAccent} />
            <Text style={styles.sectionTitle}>TIME-BASED SCHEDULES</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Plus size={16} color={colors.primaryAccent} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardsList}>
          {timeSchedules.map((schedule) => (
            <GlassCard key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.scheduleInfoCol}>
                  <Text style={styles.scheduleName}>{schedule.name}</Text>
                  <Text style={styles.scheduleTime}>{schedule.timeRange}</Text>
                  <Text style={styles.scheduleDays}>{schedule.days}</Text>
                </View>
                <Switch
                  value={schedule.isActive}
                  onValueChange={() => toggleTimeSchedule(schedule.id)}
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
                  {schedule.blockedAppsCount} apps locked automatically
                </Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* 2. GPS LOCATION AUTO-LOCK */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionHeaderLeft}>
            <MapPin size={18} color={colors.positiveAccent} />
            <Text style={styles.sectionTitle}>GPS LOCATION AUTO-LOCK</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Plus size={16} color={colors.positiveAccent} />
            <Text style={[styles.addBtnText, { color: colors.positiveAccent }]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardsList}>
          {locationRules.map((rule) => (
            <GlassCard key={rule.id} style={styles.scheduleCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.scheduleInfoCol}>
                  <Text style={styles.scheduleName}>{rule.name}</Text>
                  <Text style={styles.scheduleTime}>{rule.address}</Text>
                  <Text style={styles.scheduleDays}>
                    Auto-locks within {rule.radiusMeters}m geofence
                  </Text>
                </View>
                <Switch
                  value={rule.isActive}
                  onValueChange={() => toggleLocationRule(rule.id)}
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

        {/* 3. STEP-GATED "EARN SCREEN TIME" RULES */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionHeaderLeft}>
            <Footprints size={18} color={colors.warningAccent} />
            <Text style={styles.sectionTitle}>STEP-GATED "EARN TIME"</Text>
          </View>
        </View>

        <GlassCard style={styles.stepGatedCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.scheduleInfoCol}>
              <Text style={styles.scheduleName}>Physical Activity Gating</Text>
              <Text style={styles.scheduleTime}>
                Walk 5,000 steps = Unlock 15 mins Social Screen Time
              </Text>
            </View>
            <Switch
              value={stepGatingEnabled}
              onValueChange={setStepGatingEnabled}
              trackColor={{
                false: colors.hairlineBorder,
                true: colors.warningAccent,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Progress bar toward 5,000 steps */}
          <View style={styles.stepProgressContainer}>
            <View style={styles.stepProgressHeader}>
              <Text style={styles.stepCounterText}>6,420 / 5,000 steps today</Text>
              <View style={styles.earnedBadge}>
                <CheckCircle2 size={12} color={colors.positiveAccent} />
                <Text style={styles.earnedBadgeText}>15m Unlocked</Text>
              </View>
            </View>
            <View style={styles.stepProgressBarBg}>
              <View style={[styles.stepProgressBarFill, { width: '100%' }]} />
            </View>
            <Text style={styles.healthSyncNote}>
              Synced via Apple Health / Health Connect
            </Text>
          </View>
        </GlassCard>
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
    color: colors.positiveAccent,
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
});

export default SchedulesScreen;
