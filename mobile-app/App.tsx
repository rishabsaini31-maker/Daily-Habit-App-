import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BottomNav, TabName } from './src/components/BottomNav';
import { TodayScreen } from './src/screens/TodayScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { TemplatesScreen } from './src/screens/TemplatesScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { getOfflineQueue } from './src/services/api';

const MainNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('today');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    // Check pending sync queue periodically
    const checkQueue = async () => {
      const queue = await getOfflineQueue();
      setPendingSyncCount(queue.length);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.appContainer}>
        {/* Active Screen View */}
        <View style={styles.screenContainer}>
          {activeTab === 'today' && (
            <TodayScreen
              onNavigateToTemplates={() => setActiveTab('templates')}
              onNavigateToHabits={() => setActiveTab('habits')}
            />
          )}
          {activeTab === 'habits' && <HabitsScreen />}
          {activeTab === 'templates' && (
            <TemplatesScreen onTemplateAdopted={() => setActiveTab('today')} />
          )}
          {activeTab === 'analytics' && <AnalyticsScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
        </View>

        {/* Global Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabPress={setActiveTab}
          pendingSyncCount={pendingSyncCount}
        />
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600, // Elegant responsive container on tablets or desktop preview
    alignSelf: 'center',
    backgroundColor: '#0f172a',
  },
  screenContainer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
