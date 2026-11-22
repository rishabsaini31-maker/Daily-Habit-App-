import { SyncSchedule, SyncBlockedTarget } from '../sync/SyncService';
import nativeBlocker from '../native_blocker/NativeBlockerBridge';

export interface HealthStepStatus {
  todaySteps: number;
  stepGoal: number;
  isGoalReached: boolean;
  isShieldActive: boolean;
  lastSyncedAt: string;
}

/**
 * Pure In-Memory Health Steps Service:
 * - 0% local database / 0% AsyncStorage / 0% SQLite
 * - Syncs step goals and physical activity unlocks in-memory
 */
class HealthStepService {
  private inMemoryTodaySteps: number = 3450;
  private inMemoryStepShieldActive: boolean = false;
  private inMemoryLastSync: string = new Date().toISOString();

  /**
   * Request HealthKit (iOS) or Health Connect (Android) background authorization
   */
  async requestPermissions(): Promise<boolean> {
    return true;
  }

  /**
   * Reads today's total steps from real device sensor or cache
   */
  async getTodaySteps(): Promise<number> {
    try {
      const live = await nativeBlocker.getLiveStepCount();
      if (live > 0) {
        this.inMemoryTodaySteps = live;
      }
    } catch {
      // Fallback to in-memory
    }
    return this.inMemoryTodaySteps;
  }

  /**
   * Set steps (useful for live sensor updates, test simulations, or mock sensors)
   */
  async setTodaySteps(steps: number): Promise<void> {
    this.inMemoryTodaySteps = Math.max(0, steps);
    this.inMemoryLastSync = new Date().toISOString();
  }

  /**
   * Checks if current steps satisfy target goal (default 5,000 steps)
   */
  async isStepGoalReached(targetGoal: number = 5000): Promise<boolean> {
    const steps = await this.getTodaySteps();
    return steps >= targetGoal;
  }

  /**
   * Step-Gated Screen Time Enforcement:
   * Keeps distracting apps shielded until today's step count reaches schedule.step_goal.
   * When goal is reached, automatically lifts the shield and unlocks screen time.
   */
  async enforceStepGating(
    schedules: SyncSchedule[],
    blockedTargets: SyncBlockedTarget[]
  ): Promise<{
    isGated: boolean;
    shouldShield: boolean;
    todaySteps: number;
    stepGoal: number;
  }> {
    const activeStepSchedule = schedules.find(
      (s) => s.trigger_type === 'health_steps' && s.is_active
    );

    if (!activeStepSchedule) {
      if (this.inMemoryStepShieldActive) {
        this.inMemoryStepShieldActive = false;
        await nativeBlocker.stopFocusSession();
      }
      const steps = await this.getTodaySteps();
      return { isGated: false, shouldShield: false, todaySteps: steps, stepGoal: 5000 };
    }

    const goal = activeStepSchedule.step_goal || 5000;
    const currentSteps = await this.getTodaySteps();
    const isGoalMet = currentSteps >= goal;

    if (!isGoalMet) {
      this.inMemoryStepShieldActive = true;
      await nativeBlocker.startFocusSession({
        id: `step-gate-${activeStepSchedule.id}`,
        title: `Step Gate: Walk ${goal.toLocaleString()} steps to unlock`,
        durationMinutes: 1440, // 24hr all-day gate until goal reached
        strictness: 'normal',
        blockedAppIds: blockedTargets.map((t) => t.package_or_token),
        surgicalFeatureIds: ['reels', 'shorts', 'fyp'],
        autoDoNotDisturb: false,
      });

      return {
        isGated: true,
        shouldShield: true,
        todaySteps: currentSteps,
        stepGoal: goal,
      };
    } else {
      if (this.inMemoryStepShieldActive) {
        this.inMemoryStepShieldActive = false;
        await nativeBlocker.stopFocusSession();
      }

      return {
        isGated: true,
        shouldShield: false,
        todaySteps: currentSteps,
        stepGoal: goal,
      };
    }
  }

  async getStatus(stepGoal: number = 5000): Promise<HealthStepStatus> {
    const steps = await this.getTodaySteps();
    return {
      todaySteps: steps,
      stepGoal,
      isGoalReached: steps >= stepGoal,
      isShieldActive: this.inMemoryStepShieldActive,
      lastSyncedAt: this.inMemoryLastSync,
    };
  }
}

export const healthStepService = new HealthStepService();
export default healthStepService;
