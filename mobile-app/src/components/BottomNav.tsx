import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CheckCircle2, Target, Compass, BarChart3, User } from 'lucide-react-native';

export type TabName = 'today' | 'habits' | 'templates' | 'analytics' | 'profile';

interface BottomNavProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  pendingSyncCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress, pendingSyncCount = 0 }) => {
  const tabs = [
    { key: 'today' as TabName, label: 'Today', icon: CheckCircle2 },
    { key: 'habits' as TabName, label: 'Habits', icon: Target },
    { key: 'templates' as TabName, label: 'Discover', icon: Compass },
    { key: 'analytics' as TabName, label: 'Insights', icon: BarChart3 },
    { key: 'profile' as TabName, label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <IconComponent
                size={22}
                color={isActive ? '#10b981' : '#94a3b8'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {tab.key === 'profile' && pendingSyncCount > 0 && (
                <View style={styles.badgeDot} />
              )}
            </View>
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 4,
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 12,
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#94a3b8',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
});
