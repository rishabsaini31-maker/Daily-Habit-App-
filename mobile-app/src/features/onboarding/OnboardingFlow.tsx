import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import { useOnboarding } from './OnboardingContext';
import Step1WelcomeHook from './Step1WelcomeHook';
import Step2DistractionQuiz from './Step2DistractionQuiz';
import Step3ScreenTimeInput from './Step3ScreenTimeInput';
import Step4LifetimeRealityCheck from './Step4LifetimeRealityCheck';
import Step5PermissionsGrant from './Step5PermissionsGrant';

export const OnboardingFlow: React.FC = () => {
  const { currentStep } = useOnboarding();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1WelcomeHook />;
      case 2:
        return <Step2DistractionQuiz />;
      case 3:
        return <Step3ScreenTimeInput />;
      case 4:
        return <Step4LifetimeRealityCheck />;
      case 5:
        return <Step5PermissionsGrant />;
      default:
        return <Step1WelcomeHook />;
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.stepProgressBar,
          { paddingTop: topInset + 8 },
          responsiveContainerStyle,
        ]}
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <View
            key={step}
            style={[
              styles.progressSegment,
              step <= currentStep && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
      <View style={[styles.content, { paddingBottom: bottomInset }, responsiveContainerStyle]}>
        {renderStep()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  stepProgressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: colors.hairlineBorder,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.primaryAccent,
  },
  content: {
    flex: 1,
  },
});

export default OnboardingFlow;
