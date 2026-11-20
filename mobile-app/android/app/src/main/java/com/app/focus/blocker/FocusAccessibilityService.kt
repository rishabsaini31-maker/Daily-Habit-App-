package com.app.focus.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject

/**
 * FocusAccessibilityService:
 * Real-time window state monitor:
 * 1. Entire App Interception: Launches AppBlockInterceptionActivity overlay
 * 2. Surgical Feed Lock: Inspects view hierarchies on Instagram & YouTube
 *    - Instagram Reels: clips_viewer_view_pager / reel_recycler
 *    - YouTube Shorts: reel_recycler / shorts_container
 * 3. Anti-Uninstall Guard: Prevents opening Settings -> App Info for our app
 */
class FocusAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: return
        val prefs = getSharedPreferences("focus_blocker_prefs", Context.MODE_PRIVATE)
        val isShieldActive = prefs.getBoolean("is_shield_active", false)
        val antiUninstallGuard = prefs.getBoolean("anti_uninstall_guard", false)

        // 1. Anti-Uninstall Guard: Protect against Settings -> App Info deletion
        if (antiUninstallGuard && isShieldActive && packageName == "com.android.settings") {
            val rootNode = rootInActiveWindow
            if (inspectNodeContainsText(rootNode, "Daily Habit") || inspectNodeContainsText(rootNode, "Opal")) {
                performGlobalAction(GLOBAL_ACTION_HOME)
                return
            }
        }

        if (!isShieldActive) return

        val blockedPackagesStr = prefs.getString("blocked_packages", "[]") ?: "[]"
        val blockedList = parseBlockedList(blockedPackagesStr)

        val targetRule = blockedList.find { it.packageName == packageName } ?: return

        // 2. Entire App Blocked -> Trigger Interception Shield
        if (!targetRule.isSurgicalOnly) {
            triggerInterceptionOverlay(targetRule.displayName, packageName)
            return
        }

        // 3. Surgical Reel / Shorts Inspection
        if (targetRule.isSurgicalOnly) {
            val rootNode = rootInActiveWindow ?: return

            val isInstagramReels = packageName == "com.instagram.android" &&
                    (hasNodeWithId(rootNode, "clips_viewer_view_pager") ||
                     hasNodeWithId(rootNode, "reel_viewer_container"))

            val isYouTubeShorts = packageName == "com.google.android.youtube" &&
                    (hasNodeWithId(rootNode, "reel_recycler") ||
                     hasNodeWithId(rootNode, "shorts_container"))

            if (isInstagramReels || isYouTubeShorts) {
                // Block the surgical distraction loop, return user to safety
                performGlobalAction(GLOBAL_ACTION_BACK)
                triggerInterceptionOverlay(
                    if (isInstagramReels) "Instagram Reels" else "YouTube Shorts",
                    packageName
                )
            }
        }
    }

    private fun triggerInterceptionOverlay(displayName: String, packageName: String) {
        val intent = Intent().apply {
            setClassName(this@FocusAccessibilityService, "com.app.focus.MainActivity")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("SHIELD_TRIGGER", true)
            putExtra("BLOCKED_APP_NAME", displayName)
            putExtra("PACKAGE_NAME", packageName)
        }
        startActivity(intent)
    }

    private fun hasNodeWithId(root: AccessibilityNodeInfo, targetIdFragment: String): Boolean {
        val nodes = root.findAccessibilityNodeInfosByViewId(targetIdFragment)
        return !nodes.isNullOrEmpty()
    }

    private fun inspectNodeContainsText(root: AccessibilityNodeInfo?, targetText: String): Boolean {
        if (root == null) return false
        val nodes = root.findAccessibilityNodeInfosByText(targetText)
        return !nodes.isNullOrEmpty()
    }

    override fun onInterrupt() {}

    private data class BlockRule(val packageName: String, val displayName: String, val isSurgicalOnly: Boolean)

    private fun parseBlockedList(jsonStr: String): List<BlockRule> {
        val list = mutableListOf<BlockRule>()
        try {
            val array = JSONArray(jsonStr)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    BlockRule(
                        packageName = obj.optString("package_or_token"),
                        displayName = obj.optString("display_name", "App"),
                        isSurgicalOnly = obj.optBoolean("is_surgical_feed_only", false)
                    )
                )
            }
        } catch (_: Exception) {}
        return list
    }
}
