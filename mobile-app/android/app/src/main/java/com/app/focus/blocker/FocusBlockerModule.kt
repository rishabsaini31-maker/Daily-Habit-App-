package com.app.focus.blocker

import android.app.AlarmManager
import android.app.AppOpsManager
import android.app.PendingIntent
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.*
import java.util.Calendar

class FocusBlockerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FocusBlockerModule"

    companion object {
        const val KEY_BLOCKED_PACKAGES = "blocked_packages"
        const val KEY_IS_SHIELD_ACTIVE = "is_shield_active"
        const val KEY_ANTI_UNINSTALL = "anti_uninstall_guard"
        const val KEY_STRICTNESS_MODE = "strictness_mode"
        const val KEY_INTERCEPTIONS_COUNT = "interceptions_count"
    }

    // =========================================================================
    // 1. SYSTEM PERMISSIONS HANDLERS (Real System Intent Routing)
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
    fun openUsageStatsSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + reactContext.packageName)
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        val expectedService = reactContext.packageName + "/" + FocusAccessibilityService::class.java.canonicalName
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        val isEnabled = enabledServices.contains(expectedService)
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun isBatteryOptimizationIgnored(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            promise.resolve(pm.isIgnoringBatteryOptimizations(reactContext.packageName))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:" + reactContext.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun getAllPermissionsStatus(promise: Promise) {
        val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val usageMode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
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
        val hasUsage = usageMode == AppOpsManager.MODE_ALLOWED

        val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else true

        val expectedService = reactContext.packageName + "/" + FocusAccessibilityService::class.java.canonicalName
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        val hasAccessibility = enabledServices.contains(expectedService)

        val hasBattery = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            pm.isIgnoringBatteryOptimizations(reactContext.packageName)
        } else true

        val map = Arguments.createMap().apply {
            putBoolean("usageStatsPermissionGranted", hasUsage)
            putBoolean("systemAlertWindowGranted", hasOverlay)
            putBoolean("accessibilityServiceEnabled", hasAccessibility)
            putBoolean("batteryOptimizationIgnored", hasBattery)
            putBoolean("allRequiredPermissionsGranted", hasUsage && hasOverlay && hasAccessibility)
        }
        promise.resolve(map)
    }

    // =========================================================================
    // 2. REAL APP USAGE STATS QUERY (UsageStatsManager - queryAndAggregate)
    // =========================================================================
    @ReactMethod
    fun getDailyAppUsageMinutes(promise: Promise) {
        try {
            val usageStatsManager =
                reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val pm = reactContext.packageManager

            val calendar = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val startOfDay = calendar.timeInMillis
            val now = System.currentTimeMillis()

            // 1. Use queryAndAggregateUsageStats for exact cumulative foreground time
            val aggregatedStats = try {
                usageStatsManager.queryAndAggregateUsageStats(startOfDay, now)
            } catch (_: Exception) {
                emptyMap()
            }

            val resultMap = mutableMapOf<String, Long>()

            if (!aggregatedStats.isNullOrEmpty()) {
                for ((pkg, usage) in aggregatedStats) {
                    if (usage.totalTimeInForeground > 0) {
                        resultMap[pkg] = usage.totalTimeInForeground
                    }
                }
            } else {
                // Fallback to queryUsageStats
                val stats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    startOfDay,
                    now
                )
                stats?.forEach { usage ->
                    val existing = resultMap[usage.packageName] ?: 0L
                    resultMap[usage.packageName] = Math.max(existing, usage.totalTimeInForeground)
                }
            }

            val resultArray = Arguments.createArray()
            resultMap.entries
                .filter { it.value > 15000L } // Active for at least 15 seconds
                .sortedByDescending { it.value }
                .forEach { entry ->
                    val pkg = entry.key
                    val totalMs = entry.value
                    // Round up to 1 minute if at least 15s, otherwise exact rounded minutes
                    val minutes = if (totalMs in 15000L..59999L) 1 else Math.round(totalMs / 60000.0).toInt()

                    var appName = pkg
                    try {
                        val appInfo = pm.getApplicationInfo(pkg, 0)
                        appName = pm.getApplicationLabel(appInfo).toString()
                    } catch (_: Exception) {}

                    val map = Arguments.createMap().apply {
                        putString("packageName", pkg)
                        putString("appName", appName)
                        putInt("minutes", minutes)
                        putInt("seconds", (totalMs / 1000).toInt())
                    }
                    resultArray.pushMap(map)
                }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("USAGE_STATS_ERROR", e.localizedMessage, e)
        }
    }

    // =========================================================================
    // 2.1 REAL HARDWARE STEP SENSOR (Pedometer)
    // =========================================================================
    private var isSensorRegistered = false
    private var baseSensorSteps = -1
    private var liveTodaySteps = 0

    private val stepEventListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent?) {
            if (event == null) return
            if (event.sensor.type == Sensor.TYPE_STEP_COUNTER) {
                val totalSteps = event.values[0].toInt()
                if (baseSensorSteps < 0) {
                    baseSensorSteps = totalSteps
                }
                liveTodaySteps = Math.max(0, totalSteps - baseSensorSteps)
            } else if (event.sensor.type == Sensor.TYPE_STEP_DETECTOR) {
                liveTodaySteps += 1
            }
        }
        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

    private fun ensureStepSensorRegistered() {
        if (isSensorRegistered) return
        try {
            val sm = reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return
            val counter = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
            if (counter != null) {
                sm.registerListener(stepEventListener, counter, SensorManager.SENSOR_DELAY_UI)
                isSensorRegistered = true
                return
            }
            val detector = sm.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
            if (detector != null) {
                sm.registerListener(stepEventListener, detector, SensorManager.SENSOR_DELAY_UI)
                isSensorRegistered = true
            }
        } catch (_: Exception) {}
    }

    @ReactMethod
    fun getLiveStepCount(promise: Promise) {
        try {
            ensureStepSensorRegistered()
            promise.resolve(liveTodaySteps)
        } catch (e: Exception) {
            promise.resolve(0)
        }
    }

    // =========================================================================
    // 3. SHIELD ENFORCEMENT & IN-MEMORY BRIDGE
    // =========================================================================
    @ReactMethod
    fun activateShield(
        blockedPackagesJSON: String,
        strictnessMode: String,
        denyAppRemoval: Boolean,
        endTimeMillisDouble: Double = 0.0,
        promise: Promise
    ) {
        val rules = FocusAccessibilityService.parseRulesFromJson(blockedPackagesJSON)
        val endMillis = if (endTimeMillisDouble > 0) endTimeMillisDouble.toLong() else 0L

        FocusAccessibilityService.updateBlockingState(
            active = true,
            rules = rules,
            strictness = strictnessMode,
            antiUninstall = denyAppRemoval || strictnessMode == "deep_focus",
            endTimeMillis = endMillis
        )

        promise.resolve(true)
    }

    @ReactMethod
    fun deactivateShield(promise: Promise) {
        FocusAccessibilityService.clearBlockingState()
        promise.resolve(true)
    }

    @ReactMethod
    fun setAntiUninstallGuard(enabled: Boolean, promise: Promise) {
        FocusAccessibilityService.antiUninstallGuard = enabled
        promise.resolve(enabled)
    }

    @ReactMethod
    fun updateSurgicalSelectors(selectorsJson: String, promise: Promise) {
        FocusAccessibilityService.updateDynamicSelectors(selectorsJson)
        promise.resolve(true)
    }

    // =========================================================================
    // 4. BACKGROUND SCHEDULE ALARMS (AlarmManager)
    // =========================================================================
    @ReactMethod
    fun scheduleExactAlarm(
        scheduleId: String,
        triggerAtMillis: Double,
        isStartAlarm: Boolean,
        promise: Promise
    ) {
        try {
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactContext, FocusScheduleReceiver::class.java).apply {
                action = if (isStartAlarm) FocusScheduleReceiver.ACTION_SCHEDULE_START else FocusScheduleReceiver.ACTION_SCHEDULE_END
                putExtra(FocusScheduleReceiver.EXTRA_SCHEDULE_ID, scheduleId)
            }

            val requestCode = (scheduleId.hashCode() + if (isStartAlarm) 1 else 2)
            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis.toLong(),
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis.toLong(),
                    pendingIntent
                )
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_ERROR", e.localizedMessage, e)
        }
    }
}
