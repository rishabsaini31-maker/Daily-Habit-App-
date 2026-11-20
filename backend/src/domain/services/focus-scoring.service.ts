// ==============================================================================
// DOMAIN SERVICE: FocusScoringService
// Business logic for Focus Scores, Tier Ladders, Gem Rewards, and AI Insights
// ==============================================================================

export class FocusScoringService {
  /**
   * Spec Formula:
   * clamp(100 - ((distracting_minutes / daily_baseline_minutes) * 60) + (completed_sessions * 5), 0, 100)
   */
  public static computeFocusScore(
    distractingMinutes: number,
    dailyBaselineMinutes: number = 240,
    completedSessionsCount: number = 0
  ): number {
    const baseline = Math.max(1, dailyBaselineMinutes);
    const penalty = (distractingMinutes / baseline) * 60;
    const bonus = completedSessionsCount * 5;
    const score = Math.round(100 - penalty + bonus);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dynamic Tier Promotion Ladder:
   * Bronze (< 500) -> Silver (500) -> Gold (1,500) -> Obsidian (3,500) -> Diamond (7,500)
   */
  public static computeTierRank(totalGems: number): 'Bronze' | 'Silver' | 'Gold' | 'Obsidian' | 'Diamond' {
    if (totalGems >= 7500) return 'Diamond';
    if (totalGems >= 3500) return 'Obsidian';
    if (totalGems >= 1500) return 'Gold';
    if (totalGems >= 500) return 'Silver';
    return 'Bronze';
  }

  /**
   * Gems Earned for completing a Focus Session:
   * floor(duration_minutes / 30) * 10 + 5 bonus gems (minimum 5 gems)
   */
  public static computeGemsEarned(durationMinutes: number): number {
    return Math.max(5, Math.floor(durationMinutes / 30) * 10 + 5);
  }

  /**
   * Synthesizes personalized AI opportunity-cost analysis from weekly reclaimed screen time
   */
  public static generateWeeklyAiInsight(
    reclaimedHours: number,
    totalInterceptions: number,
    streakDays: number,
    avgScore: number,
    tierRank: string
  ): { headline: string; comparison: string; fullInsight: string } {
    let headline = '';
    let comparison = '';

    if (reclaimedHours >= 15) {
      headline = `Monumental Week • ${reclaimedHours} Hours Reclaimed`;
      comparison = `By deflecting ${totalInterceptions} doomscroll urges, you reclaimed enough high-value cognitive bandwidth to read 2 full books, learn a new framework, or complete 3 deep-work sprints.`;
    } else if (reclaimedHours >= 7) {
      headline = `Strong Focus Trajectory • ${reclaimedHours} Hours Reclaimed`;
      comparison = `You shielded ${reclaimedHours} hours from mindless social dopamine. That is equivalent to taking a full workday back for your creative passion projects and deep sleep.`;
    } else {
      headline = `Building Momentum • ${reclaimedHours || 3.5} Hours Reclaimed`;
      comparison = `Every shielded interception compounds into lifetime freedom. Staying consistent with your ${streakDays}-day streak puts you on pace to save over 250 hours this year.`;
    }

    const fullInsight = `${headline}. ${comparison} (Average Focus Score: ${avgScore}/100, Tier: ${tierRank}).`;

    return { headline, comparison, fullInsight };
  }
}
