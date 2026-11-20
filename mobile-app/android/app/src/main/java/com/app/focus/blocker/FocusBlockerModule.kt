package com.app.focus.blocker

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.Calendar

class FocusBlockerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FocusBlockerModule"

    // =========================================================================
    // 1. PERMISSIONS: USAGE STATS & ACCESSIBILITY
    // =========================================================================
    @ReactMethod
    fun checkUsageStatsPermission(promise: Promise) {
        val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactContext.packageName
            )
        } else {
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactContext.packageName
            )
        }
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun requestAccessibilityPermission() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    // =========================================================================
    // 2. USAGE STATS QUERY FOR DASHBOARD & INSIGHTS
    // =========================================================================
    @ReactMethod
    fun getDailyAppUsageMinutes(promise: Promise) {
        try {
            val usageStatsManager =
                reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            val calendar = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
            }
            val startOfDay = calendar.timeInMillis
            val now = System.currentTimeMillis()

            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startOfDay,
                now
            )

            val resultArray = Arguments.createArray()
            stats?.forEach { usage ->
                val minutes = (usage.totalTimeInForeground / (1000 * 60)).toInt()
                if (minutes > 0) {
                    val map = Arguments.createMap().apply {
                        putString("packageName", usage.packageName)
                        putInt("minutes", minutes)
                        putDouble("lastTimeUsed", usage.lastTimeUsed.toDouble())
                    }
                    resultArray.pushMap(map)
                }
            }
            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("USAGE_STATS_ERROR", e.localizedMessage, e)
        }
    }

    // =========================================================================
    // 3. ACTIVATE / DEACTIVATE ACTIVE BLOCK LIST & SURGICAL MODES
    // =========================================================================
    @ReactMethod
    fun activateShield(blockedPackagesJSON: String, denyAppRemoval: Boolean, promise: Promise) {
        val prefs = reactContext.getSharedPreferences("focus_blocker_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("blocked_packages", blockedPackagesJSON)
            .putBoolean("is_shield_active", true)
            .putBoolean("anti_uninstall_guard", denyAppRemoval)
            .apply()
        promise.resolve(true)
    }

    @ReactMethod
    fun deactivateShield(promise: Promise) {
        val prefs = reactContext.getSharedPreferences("focus_blocker_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("is_shield_active", false)
            .putBoolean("anti_uninstall_guard", false)
            .apply()
        promise.resolve(true)
    }

    @ReactMethod
    fun setAntiUninstallGuard(enabled: Boolean, promise: Promise) {
        val prefs = reactContext.getSharedPreferences("focus_blocker_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("anti_uninstall_guard", enabled).apply()
        promise.resolve(enabled)
    }
}
