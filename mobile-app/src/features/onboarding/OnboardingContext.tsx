import React, { createContext, useContext, useState, useEffect } from 'react';
import syncService from '../../services/sync/SyncService';
import { api } from '../../services/api';

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

/**
 * Pure In-Memory Onboarding Context:
 * - 0% local database / 0% AsyncStorage / 0% SQLite
 * - Onboarding completes directly into Supabase profile & blocked targets
 */
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
    // Check if user profile already has baseline configured in Supabase
    const initCheck = async () => {
      try {
        const profile = await syncService.getProfile();
        if (profile && profile.daily_baseline_minutes && profile.daily_baseline_minutes > 0) {
          setHasCompletedOnboarding(true);
        }
      } catch {
        // start onboarding
      } finally {
        setIsLoading(false);
      }
    };
    initCheck();
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
      return exists ? prev.filter((id) => id !== appId) : [...prev, appId];
    });
  };

  const setDailyHours = (hours: number) => {
    setDailyScreenHours(hours);
  };

  const finishOnboarding = async () => {
    setHasCompletedOnboarding(true);

    try {
      // 1. Update Supabase profile directly with baseline screen time
      const baselineMinutes = Math.round(dailyScreenHours * 60);
      await syncService.updateProfile({
        daily_baseline_minutes: baselineMinutes,
      });

      // 2. Also record in Node.js backend if reachable
      await api.anonymousAuth().catch(() => {});
      await api.updateFocusProfile({
        daily_baseline_minutes: baselineMinutes,
      }).catch(() => {});

      // 3. Map and persist blocked targets directly to Supabase
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
        await syncService.addBlockedTarget({
          id: Math.random().toString(36).substring(2, 10),
          platform: 'android',
          package_or_token: mapped.pkg,
          display_name: mapped.name,
          is_surgical_feed_only: mapped.isSurgical,
        });
      }
    } catch (e) {
      console.warn('Error finishing onboarding to Supabase:', e);
    }
  };

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    setCurrentStep(1);
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

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
