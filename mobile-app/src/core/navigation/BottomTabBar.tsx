import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shield, Calendar, BarChart2, Award, LucideIcon } from 'lucide-react-native';
import { colors } from '../theme/tokens';
import { useResponsiveLayout } from '../theme/useResponsiveLayout';
import { AppTab } from './types';

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabPress: (tab: AppTab) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const { bottomInset, isWide } = useResponsiveLayout();

  const tabs: { key: AppTab; label: string; icon: LucideIcon }[] = [
    { key: 'home', label: 'Focus', icon: Shield },
    { key: 'schedules', label: 'Schedules', icon: Calendar },
    { key: 'insights', label: 'Insights', icon: BarChart2 },
    { key: 'rewards', label: 'Rewards', icon: Award },
  ];

  return (
    <View style={[styles.outerWrapper, { paddingBottom: Math.max(bottomInset, 12) }]}>
      <View
        style={[
          styles.floatingBar,
          {
            maxWidth: isWide ? 440 : 360,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabPress(tab.key)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <IconComponent
                size={20}
                color={isActive ? colors.primaryAccent : colors.secondaryMutedText}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  floatingBar: {
    width: '92%',
    height: 64,
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 29, 43, 0.94)',
    borderRadius: 24, // 24px radius per Figma floating navigation
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 3,
  },
  activeTabButton: {
    backgroundColor: '#273A5A', // Figma selected tab background
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondaryMutedText,
  },
  activeTabLabel: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});

export default BottomTabBar;
