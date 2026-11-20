import React from 'react';
import { StatusBar } from 'react-native';
import { colors } from './src/core/theme/tokens';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { NavigationProvider } from './src/core/navigation/NavigationContext';
import { NativeBlockerProvider } from './src/services/native_blocker/NativeBlockerContext';
import RootNavigator from './src/core/navigation/RootNavigator';

export default function App() {
  return (
    <NativeBlockerProvider>
      <OnboardingProvider>
        <NavigationProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.obsidian} />
          <RootNavigator />
        </NavigationProvider>
      </OnboardingProvider>
    </NativeBlockerProvider>
  );
}
