import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shield, Calendar, BarChart2, Award, LucideIcon } from 'lucide-react-native';
import { colors, layout } from '../theme/tokens';
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
    <View style={styles.outerWrapper}>
      <View
        style={[
          styles.container,
          {
            paddingBottom: Math.max(bottomInset, 16),
            height: 56 + Math.max(bottomInset, 16),
            maxWidth: isWide ? 680 : '100%',
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
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    backgroundColor: colors.obsidian,
    borderTopWidth: layout.hairlineBorderWidth,
    borderTopColor: colors.hairlineBorder,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: colors.obsidian, // Obsidian #08090D per spec
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
    backgroundColor: 'rgba(169, 185, 255, 0.14)',
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
    display: 'none',
  },
});

export default BottomTabBar;
