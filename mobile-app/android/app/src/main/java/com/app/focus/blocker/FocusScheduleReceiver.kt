package com.app.focus.blocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * FocusScheduleReceiver:
 * Wakes device on exact scheduled alarms (Morning Routine, Work Hours, Bedtime Sanctuary)
 * even when phone is in Doze mode or our app has been killed.
 */
class FocusScheduleReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "FocusScheduleReceiver"
        const val ACTION_SCHEDULE_START = "com.app.focus.SCHEDULE_START"
        const val ACTION_SCHEDULE_END = "com.app.focus.SCHEDULE_END"
        const val EXTRA_SCHEDULE_ID = "schedule_id"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val scheduleId = intent.getStringExtra(EXTRA_SCHEDULE_ID) ?: "unknown"

        when (action) {
            ACTION_SCHEDULE_START -> {
                Log.d(TAG, "Smart Schedule START triggered for $scheduleId. Activating OS Shield.")
                FocusAccessibilityService.isShieldActive = true
            }
            ACTION_SCHEDULE_END -> {
                Log.d(TAG, "Smart Schedule END triggered for $scheduleId. Deactivating OS Shield.")
                FocusAccessibilityService.clearBlockingState()
            }
            Intent.ACTION_BOOT_COMPLETED -> {
                Log.d(TAG, "Device rebooted. In-memory Focus Shield ready.")
            }
        }
    }
}
