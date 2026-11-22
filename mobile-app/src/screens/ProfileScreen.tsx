import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  User as UserIcon,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Trash2,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getOfflineQueue,
  syncOfflineQueue,
  clearOfflineQueue,
  api,
} from '../services/api';
import { OfflineAction } from '../types';

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
];

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentTimezone, setCurrentTimezone] = useState<string>(
    user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [showTzPicker, setShowTzPicker] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const q = await getOfflineQueue();
    setOfflineQueue(q);
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg('');
      const res = await syncOfflineQueue();
      await loadQueue();
      setSyncStatusMsg(`Successfully synchronized ${res.syncedCount} queued action(s).`);
    } catch {
      setSyncStatusMsg('Sync failed: Network server unreachable.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearOutbox = async () => {
    await clearOfflineQueue();
    await loadQueue();
    setSyncStatusMsg('Offline outbox cleared.');
  };

  const handleSelectTimezone = (tz: string) => {
    setCurrentTimezone(tz);
    setShowTzPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Account & Settings</Text>
        <Text style={styles.subtitle}>Profile, synchronization, and local preferences</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <UserIcon size={32} color="#10b981" />
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.displayName || 'DHI Member'}</Text>
              <View style={styles.roleBadge}>
                <ShieldCheck size={11} color="#10b981" />
                <Text style={styles.roleBadgeText}>{user?.role || 'USER'}</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{user?.email || 'member@dhi.app'}</Text>
            <Text style={styles.userJoined}>
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Timezone Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TIMEZONE & LOCAL MIDNIGHT</Text>
        </View>
        <View style={styles.settingCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowTzPicker(!showTzPicker)}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconWrap}>
              <Globe size={18} color="#38bdf8" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>User Timezone</Text>
              <Text style={styles.settingValue}>{currentTimezone}</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          {showTzPicker && (
            <View style={styles.tzDropdown}>
              {COMMON_TIMEZONES.map(tz => (
                <TouchableOpacity
                  key={tz}
                  style={[styles.tzItem, tz === currentTimezone && styles.tzItemActive]}
                  onPress={() => handleSelectTimezone(tz)}
                >
                  <Text style={[styles.tzItemText, tz === currentTimezone && styles.tzItemTextActive]}>
                    {tz}
                  </Text>
                  {tz === currentTimezone && <Check size={14} color="#10b981" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Offline Outbox Queue & Sync Manager */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OFFLINE OUTBOX SYNCHRONIZATION</Text>
        </View>
        <View style={styles.syncCard}>
          <View style={styles.syncStatusRow}>
            <View style={styles.syncIconWrap}>
              {offlineQueue.length > 0 ? (
                <WifiOff size={18} color="#f59e0b" />
              ) : (
                <Wifi size={18} color="#10b981" />
              )}
            </View>
            <View style={styles.syncInfo}>
              <Text style={styles.syncStatusTitle}>
                {offlineQueue.length > 0
                  ? `${offlineQueue.length} action(s) buffered offline`
                  : 'All changes synchronized'}
              </Text>
              <Text style={styles.syncStatusSubtitle}>
                {offlineQueue.length > 0
                  ? 'Check-ins will automatically dispatch when network restores.'
                  : 'Supabase Realtime Cloud Sync is active.'}
              </Text>
            </View>
          </View>

          {syncStatusMsg ? (
            <Text style={styles.syncStatusBanner}>{syncStatusMsg}</Text>
          ) : null}

          <View style={styles.syncActionsRow}>
            <TouchableOpacity
              style={[styles.syncBtn, offlineQueue.length === 0 && styles.syncBtnDisabled]}
              onPress={handleSyncNow}
              disabled={isSyncing || offlineQueue.length === 0}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <RefreshCw size={15} color="#ffffff" />
                  <Text style={styles.syncBtnText}>Sync Cloud Now</Text>
                </>
              )}
            </TouchableOpacity>

            {offlineQueue.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearOutbox}
                accessibilityLabel="Clear outbox"
              >
                <Trash2 size={15} color="#f43f5e" />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App Version & Specs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>APPLICATION SPECS</Text>
        </View>
        <View style={styles.specsCard}>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Client Framework</Text>
            <Text style={styles.specVal}>React Native (Expo 58 / TS)</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Target Architecture</Text>
            <Text style={styles.specVal}>Mobile-First PWA / Native</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Design Compliance</Text>
            <Text style={styles.specVal}>WCAG AA (Touch min 44px)</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Storage Engine</Text>
            <Text style={styles.specVal}>Supabase PostgreSQL (In-Memory)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <LogOut size={18} color="#f43f5e" />
          <Text style={styles.logoutBtnText}>Sign Out of Session</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
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
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  userEmail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  userJoined: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  settingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 52,
    gap: 12,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  settingValue: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  tzDropdown: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
  },
  tzItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  tzItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  tzItemText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  tzItemTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  syncCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncInfo: {
    flex: 1,
  },
  syncStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  syncStatusSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  syncStatusBanner: {
    fontSize: 12,
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    fontWeight: '600',
  },
  syncActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  syncBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    minHeight: 44,
  },
  syncBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
    minHeight: 44,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f43f5e',
  },
  specsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    gap: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specKey: {
    fontSize: 13,
    color: '#94a3b8',
  },
  specVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f43f5e',
  },
});
