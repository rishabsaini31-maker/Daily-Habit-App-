import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/tokens';
import { useResponsiveLayout } from '../theme/useResponsiveLayout';
import { useAppNavigation } from './NavigationContext';
import BottomTabBar from './BottomTabBar';
import { useOnboarding } from '../../features/onboarding/OnboardingContext';
import OnboardingFlow from '../../features/onboarding/OnboardingFlow';
import HomeScreen from '../../features/home/HomeScreen';
import SchedulesScreen from '../../features/schedules/SchedulesScreen';
import InsightsScreen from '../../features/insights/InsightsScreen';
import RewardsScreen from '../../features/rewards/RewardsScreen';
import NewFocusSessionModal from '../../features/focus_session/NewFocusSessionModal';
import BlockListPickerModal from '../../features/focus_session/BlockListPickerModal';
import AppBlockShieldScreen from '../../features/focus_session/AppBlockShieldScreen';
import PaywallModal from '../../features/paywall/PaywallModal';
import SettingsScreen from '../../features/settings/SettingsScreen';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';

export const RootNavigator: React.FC = () => {
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { activeTab, switchTab, activeModal, openModal } = useAppNavigation();
  const { lastShieldEvent } = useNativeBlocker();
  const { isMacOrDesktop, isTablet } = useResponsiveLayout();

  // If OS or background intercepts an app launch, trigger the Shield Interception Screen
  useEffect(() => {
    if (lastShieldEvent && activeModal !== 'shield_interception') {
      openModal('shield_interception', {
        appName: lastShieldEvent.appName,
        reason: lastShieldEvent.reason,
      });
    }
  }, [lastShieldEvent, activeModal, openModal]);

  if (onboardingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  // 1. FIRST LAUNCH (NOT ONBOARDED): 5-step Onboarding Stack
  if (!hasCompletedOnboarding) {
    return (
      <View style={styles.container}>
        <OnboardingFlow />
        {/* If paywall is presented at Step 5 completion */}
        {activeModal === 'paywall' && (
          <View style={styles.fullScreenModalLayer}>
            <PaywallModal />
          </View>
        )}
      </View>
    );
  }

  // 2. MAIN APP SHELL (4 Tabs Only)
  const renderActiveTabScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'schedules':
        return <SchedulesScreen />;
      case 'insights':
        return <InsightsScreen />;
      case 'rewards':
        return <RewardsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // 3. DISTRACTION-FREE MODALS & OVERLAYS (NO Bottom Nav Bar when open)
  const isModalActive = activeModal !== null;

  return (
    <View style={styles.container}>
      {/* Active Tab Screen */}
      <View style={styles.screenWrapper}>{renderActiveTabScreen()}</View>

      {/* Main Tab Shell: 4 Tabs Only (Hidden when a modal is active) */}
      {!isModalActive && (
        <BottomTabBar activeTab={activeTab} onTabPress={switchTab} />
      )}

      {/* Full-Screen Modals & Overlays - Rendered with absoluteFill so they take 100% full screen */}
      {isModalActive && (
        <View style={styles.fullScreenModalLayer}>
          {(activeModal === 'settings' || activeModal === 'profile') && <SettingsScreen />}
          {activeModal === 'new_focus_session' && <NewFocusSessionModal />}
          {activeModal === 'block_list_picker' && <BlockListPickerModal />}
          {activeModal === 'shield_interception' && <AppBlockShieldScreen />}
          {activeModal === 'paywall' && <PaywallModal />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian, // #08090D per spec
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  fullScreenModalLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    backgroundColor: colors.obsidian,
  },
});

export default RootNavigator;
