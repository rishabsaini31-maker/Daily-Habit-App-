import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

const STORAGE_KEYS = {
  COMPLETED: '@onboarding_completed',
  APPS: '@onboarding_selected_apps',
  SCREEN_HOURS: '@onboarding_screen_hours',
};

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  currentStep: 1 | 2 | 3 | 4 | 5;
  selectedApps: string[];
  dailyScreenHours: number;
  lifetimeYearsLost: number;
  isLoading: boolean;
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleAppSelection: (appId: string) => void;
  setDailyHours: (hours: number) => void;
  finishOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedApps, setSelectedApps] = useState<string[]>([
    'instagram',
    'tiktok',
    'youtube',
  ]);
  const [dailyScreenHours, setDailyScreenHours] = useState<number>(4.5);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reality calculation: assuming 60 waking years left, 16 waking hours per day
  // (dailyHours / 16) * 60 years = lifetime years spent staring at phone
  const lifetimeYearsLost = Number(((dailyScreenHours / 16) * 60).toFixed(1));

  useEffect(() => {
    const loadState = async () => {
      try {
        const [completed, apps, hours] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.COMPLETED),
          AsyncStorage.getItem(STORAGE_KEYS.APPS),
          AsyncStorage.getItem(STORAGE_KEYS.SCREEN_HOURS),
        ]);

        if (completed === 'true') {
          setHasCompletedOnboarding(true);
        }
        if (apps) {
          setSelectedApps(JSON.parse(apps));
        }
        if (hours) {
          setDailyScreenHours(parseFloat(hours));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const setStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setCurrentStep(step);
  };

  const toggleAppSelection = (appId: string) => {
    setSelectedApps((prev) => {
      const exists = prev.includes(appId);
      const updated = exists ? prev.filter((id) => id !== appId) : [...prev, appId];
      AsyncStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const setDailyHours = (hours: number) => {
    setDailyScreenHours(hours);
    AsyncStorage.setItem(STORAGE_KEYS.SCREEN_HOURS, hours.toString()).catch(() => {});
  };

  const finishOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED, 'true');

    // Seamlessly register anonymous identity with Node.js backend & sync baseline
    try {
      await api.anonymousAuth();
      await api.updateFocusProfile({
        daily_baseline_minutes: Math.round(dailyScreenHours * 60),
      });

      const appPackageMap: Record<string, { pkg: string; name: string; isSurgical: boolean }> = {
        instagram: { pkg: 'com.instagram.android', name: 'Instagram', isSurgical: true },
        youtube: { pkg: 'com.google.android.youtube', name: 'YouTube', isSurgical: true },
        tiktok: { pkg: 'com.zhiliaoapp.musically', name: 'TikTok', isSurgical: false },
        twitter: { pkg: 'com.twitter.android', name: 'X (Twitter)', isSurgical: false },
        facebook: { pkg: 'com.facebook.katana', name: 'Facebook', isSurgical: false },
        reddit: { pkg: 'com.reddit.frontpage', name: 'Reddit', isSurgical: false },
      };

      for (const appId of selectedApps) {
        const mapped = appPackageMap[appId.toLowerCase()] || {
          pkg: `com.${appId.toLowerCase()}.app`,
          name: appId,
          isSurgical: false,
        };
        await api.addBlockedTarget({
          packageOrToken: mapped.pkg,
          displayName: mapped.name,
          isSurgicalFeedOnly: mapped.isSurgical,
          platform: 'android',
        });
      }
    } catch {
      // offline fallback
    }
  };

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    setCurrentStep(1);
    await AsyncStorage.removeItem(STORAGE_KEYS.COMPLETED);
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        currentStep,
        selectedApps,
        dailyScreenHours,
        lifetimeYearsLost,
        isLoading,
        setStep,
        nextStep,
        prevStep,
        toggleAppSelection,
        setDailyHours,
        finishOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
