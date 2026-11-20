import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { colors } from './src/core/theme/tokens';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { NavigationProvider } from './src/core/navigation/NavigationContext';
import { NativeBlockerProvider } from './src/services/native_blocker/NativeBlockerContext';
import { FocusEngineProvider } from './src/services/focus_engine/FocusEngineContext';
import RootNavigator from './src/core/navigation/RootNavigator';
import authService from './src/services/supabase/auth';

export default function App() {
  // Initialize Supabase Auth on app start (anonymous first-launch session)
  useEffect(() => {
    authService.initializeOrGetSession().catch(() => {});
  }, []);

  return (
    <NativeBlockerProvider>
      <FocusEngineProvider>
        <OnboardingProvider>
          <NavigationProvider>
            <StatusBar barStyle="light-content" />
            <RootNavigator />
          </NavigationProvider>
        </OnboardingProvider>
      </FocusEngineProvider>
    </NativeBlockerProvider>
  );
}
