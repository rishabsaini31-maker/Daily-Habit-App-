import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Shield, Calendar, BarChart2, Award, LucideIcon } from 'lucide-react-native';
import { colors, layout } from '../theme/tokens';
import { AppTab } from './types';

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabPress: (tab: AppTab) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: { key: AppTab; label: string; icon: LucideIcon }[] = [
    { key: 'home', label: 'Home', icon: Shield },
    { key: 'schedules', label: 'Schedules', icon: Calendar },
    { key: 'insights', label: 'Insights', icon: BarChart2 },
    { key: 'rewards', label: 'Rewards', icon: Award },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const IconComponent = tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabPress(tab.key)}
            style={styles.tabButton}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <IconComponent
                size={22}
                color={isActive ? colors.primaryAccent : colors.secondaryMutedText}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activePillIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 8,
    backgroundColor: colors.obsidian, // Obsidian #08090D per spec
    borderTopWidth: layout.hairlineBorderWidth,
    borderTopColor: colors.hairlineBorder, // Hairline #1E2230 per spec
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondaryMutedText,
    marginTop: 3,
  },
  activeTabLabel: {
    color: colors.primaryAccent, // Cyan
    fontWeight: '700',
  },
  activePillIndicator: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 2,
    backgroundColor: colors.primaryAccent,
    borderRadius: 1,
  },
});

export default BottomTabBar;
