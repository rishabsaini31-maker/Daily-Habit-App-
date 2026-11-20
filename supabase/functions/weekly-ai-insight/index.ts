// ==============================================================================
// SUPABASE EDGE FUNCTION: weekly-ai-insight
// Computes 7-day reclaimed screen time & generates personalized AI opportunity-cost insights
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyMetricRow {
  metric_date: string;
  focus_score: number;
  total_screen_time_min: number;
  blocked_time_min: number;
  interceptions_count: number;
  gems_earned: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://localhost.supabase.co";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "dummy_anon_key";

    // Client scoped to authenticated user JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch User Profile (Baseline Screen Time)
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, streak_days, total_gems, tier_rank, daily_baseline_minutes, is_pro")
      .eq("id", user.id)
      .single();

    const baselineDailyMin = profile?.daily_baseline_minutes || 240;
    const weeklyBaselineHours = (baselineDailyMin * 7) / 60;

    // 3. Query last 7 days of daily_metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data: metricsData, error: metricsError } = await supabase
      .from("daily_metrics")
      .select("metric_date, focus_score, total_screen_time_min, blocked_time_min, interceptions_count, gems_earned")
      .eq("user_id", user.id)
      .gte("metric_date", dateStr)
      .order("metric_date", { ascending: true });

    if (metricsError) {
      throw metricsError;
    }

    const rows: DailyMetricRow[] = metricsData || [];

    // 4. Calculate Aggregate Statistics
    let totalBlockedMin = 0;
    let totalScreenMin = 0;
    let totalInterceptions = 0;
    let totalScoreSum = 0;

    for (const row of rows) {
      totalBlockedMin += row.blocked_time_min || 0;
      totalScreenMin += row.total_screen_time_min || 0;
      totalInterceptions += row.interceptions_count || 0;
      totalScoreSum += row.focus_score || 0;
    }

    const dayCount = Math.max(1, rows.length);
    const avgFocusScore = Math.round(totalScoreSum / dayCount);
    const reclaimedHours = Math.round((totalBlockedMin / 60) * 10) / 10;
    const actualScreenHours = Math.round((totalScreenMin / 60) * 10) / 10;
    const baselineSavedPercent = Math.max(
      0,
      Math.min(100, Math.round((reclaimedHours / Math.max(1, weeklyBaselineHours)) * 100))
    );

    // 5. Generate Personalized AI Opportunity Cost Synthesis
    let insightHeadline = "";
    let opportunityCostComparison = "";

    if (reclaimedHours >= 15) {
      insightHeadline = `Monumental Week • ${reclaimedHours} Hours Reclaimed`;
      opportunityCostComparison = `By deflecting ${totalInterceptions} doomscroll urges, you reclaimed enough high-value cognitive bandwidth to read 2 full books, learn a new programming framework, or run 50 miles.`;
    } else if (reclaimedHours >= 7) {
      insightHeadline = `Strong Focus Trajectory • ${reclaimedHours} Hours Reclaimed`;
      opportunityCostComparison = `You shielded ${reclaimedHours} hours from mindless social dopamine. That is equivalent to taking a full workday back for your creative projects and deep sleep.`;
    } else {
      insightHeadline = `Building Momentum • ${reclaimedHours || 3.5} Hours Reclaimed`;
      opportunityCostComparison = `Every shielded interception compounds into lifetime freedom. Staying consistent with your ${profile?.streak_days || 0}-day streak puts you on pace to save over 250 hours this year.`;
    }

    const fullAiInsight = `${insightHeadline}. ${opportunityCostComparison} (Focus Score: ${avgFocusScore}/100, Tier: ${profile?.tier_rank || "Bronze"}).`;

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        display_name: profile?.display_name || "Focus Pioneer",
        tier_rank: profile?.tier_rank || "Bronze",
        streak_days: profile?.streak_days || 0,
        total_gems: profile?.total_gems || 0,
        reclaimed_hours: reclaimedHours,
        screen_hours_spent: actualScreenHours,
        avg_focus_score: avgFocusScore,
        interceptions_count: totalInterceptions,
        baseline_saved_percent: baselineSavedPercent,
        ai_headline: insightHeadline,
        ai_opportunity_cost: opportunityCostComparison,
        ai_full_insight: fullAiInsight,
        history: rows,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

