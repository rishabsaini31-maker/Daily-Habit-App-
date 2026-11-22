import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { NavigationProvider } from './src/core/navigation/NavigationContext';
import { NativeBlockerProvider } from './src/services/native_blocker/NativeBlockerContext';
import { FocusEngineProvider } from './src/services/focus_engine/FocusEngineContext';
import RootNavigator from './src/core/navigation/RootNavigator';
import authService from './src/services/supabase/auth';
import revenueCat from './src/services/revenuecat/RevenueCatService';
import { StartupSplashScreen } from './src/core/startup/StartupSplashScreen';

export default function App() {
  const [splashFinished, setSplashFinished] = useState<boolean>(false);

  // Initialize Supabase Auth on app start & RevenueCat customer listener
  useEffect(() => {
    authService
      .initializeOrGetSession()
      .then((session) => {
        const uid = session?.user?.id || 'anonymous_user';
        revenueCat.initialize(uid).catch(() => {});
      })
      .catch((err) => {
        console.warn('App initialization warning:', err);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <NativeBlockerProvider>
        <FocusEngineProvider>
          <OnboardingProvider>
            <NavigationProvider>
              <StatusBar barStyle="light-content" />
              <RootNavigator />
              {!splashFinished && (
                <StartupSplashScreen
                  onContinue={() => setSplashFinished(true)}
                  onAnimationComplete={() => setSplashFinished(true)}
                />
              )}
            </NavigationProvider>
          </OnboardingProvider>
        </FocusEngineProvider>
      </NativeBlockerProvider>
    </SafeAreaProvider>
  );
}
