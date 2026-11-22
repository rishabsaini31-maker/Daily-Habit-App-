package com.app.focus.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject

/**
 * Pure In-Memory Android Focus Accessibility Service:
 * - 0% SharedPreferences / 0% SQLite / 0% local database
 * - State passed directly into memory over platform channel by FocusBlockerModule
 * - Intercepts full apps & surgical reels/shorts feeds in real-time
 */
class FocusAccessibilityService : AccessibilityService() {

    data class ActiveBlockRule(
        val packageName: String,
        val displayName: String,
        val isSurgicalOnly: Boolean
    )

    companion object {
        @Volatile var isShieldActive: Boolean = false
        @Volatile var antiUninstallGuard: Boolean = false
        @Volatile var strictnessMode: String = "normal"
        @Volatile var sessionEndTimeMillis: Long = 0L
        @Volatile var blockedRules: List<ActiveBlockRule> = emptyList()
        @Volatile var interceptionsCount: Int = 0

        val dynamicInstagramSelectors = mutableListOf("clips_viewer_view_pager", "reel_viewer_container", "reels_tray_container")
        val dynamicYouTubeSelectors = mutableListOf("reel_recycler", "shorts_container", "shorts_shelf")

        fun updateDynamicSelectors(jsonStr: String) {
            try {
                val json = JSONObject(jsonStr)
                if (json.has("instagram")) {
                    val arr = json.getJSONArray("instagram")
                    dynamicInstagramSelectors.clear()
                    for (i in 0 until arr.length()) dynamicInstagramSelectors.add(arr.getString(i))
                }
                if (json.has("youtube")) {
                    val arr = json.getJSONArray("youtube")
                    dynamicYouTubeSelectors.clear()
                    for (i in 0 until arr.length()) dynamicYouTubeSelectors.add(arr.getString(i))
                }
            } catch (_: Exception) {}
        }

        fun updateBlockingState(
            active: Boolean,
            rules: List<ActiveBlockRule>,
            strictness: String,
            antiUninstall: Boolean,
            endTimeMillis: Long = 0L
        ) {
            isShieldActive = active
            blockedRules = rules
            strictnessMode = strictness
            antiUninstallGuard = antiUninstall
            sessionEndTimeMillis = endTimeMillis
        }

        fun clearBlockingState() {
            isShieldActive = false
            antiUninstallGuard = false
            strictnessMode = "normal"
            sessionEndTimeMillis = 0L
            blockedRules = emptyList()
        }

        fun parseRulesFromJson(jsonStr: String): List<ActiveBlockRule> {
            val list = mutableListOf<ActiveBlockRule>()
            try {
                val array = JSONArray(jsonStr)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    list.add(
                        ActiveBlockRule(
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

    private val mainHandler = Handler(Looper.getMainLooper())
    private var lastToastTime = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            if (event == null) return

            val packageName = event.packageName?.toString() ?: return

            // Never intercept or inspect our own app (prevents self-closing or UI freezes)
            if (packageName == applicationContext.packageName) return

            // 0. Auto-expiration check in memory
            if (sessionEndTimeMillis > 0 && System.currentTimeMillis() >= sessionEndTimeMillis) {
                clearBlockingState()
                return
            }

            // =========================================================================
            // 1. ANTI-UNINSTALL GUARD (In-Memory)
            // When active, blocks navigating to Settings -> App Info for our app
            // =========================================================================
            if (antiUninstallGuard && packageName == "com.android.settings") {
                val rootNode = rootInActiveWindow
                if (inspectNodeContainsText(rootNode, "Daily Habit") ||
                    inspectNodeContainsText(rootNode, "DHI") ||
                    inspectNodeContainsText(rootNode, "com.dhi.focus") ||
                    inspectNodeContainsText(rootNode, "Uninstall") ||
                    inspectNodeContainsText(rootNode, "Force stop")
                ) {
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    triggerInterceptionOverlay("System Settings (Anti-Uninstall Active)", packageName)
                    return
                }
            }

            if (!isShieldActive) return

            val targetRule = blockedRules.find { it.packageName == packageName } ?: return

            // =========================================================================
            // 2. ENTIRE APP BLOCK -> Launch App Block Interception Shield Overlay
            // =========================================================================
            if (!targetRule.isSurgicalOnly) {
                interceptionsCount++
                triggerInterceptionOverlay(targetRule.displayName, packageName)
                return
            }

            // =========================================================================
            // 3. SURGICAL REELS & SHORTS MODE (In-Memory Inspection)
            // =========================================================================
            if (targetRule.isSurgicalOnly) {
                val rootNode = rootInActiveWindow ?: return

                // Instagram Reels: dynamic selectors from remote config or description
                val isInstagramReels = packageName == "com.instagram.android" && (
                    dynamicInstagramSelectors.any { hasNodeWithId(rootNode, it) } ||
                    inspectNodeHasContentDescription(rootNode, "Reels") ||
                    inspectNodeHasContentDescription(rootNode, "Reel")
                )

                // YouTube Shorts: dynamic selectors from remote config or description
                val isYouTubeShorts = packageName == "com.google.android.youtube" && (
                    dynamicYouTubeSelectors.any { hasNodeWithId(rootNode, it) } ||
                    inspectNodeHasContentDescription(rootNode, "Shorts")
                )

                // TikTok FYP / explore swipe
                val isTikTokFeed = packageName == "com.zhiliaoapp.musically" && (
                    hasNodeWithId(rootNode, "viewpager") ||
                    inspectNodeHasContentDescription(rootNode, "For You")
                )

                if (isInstagramReels || isYouTubeShorts || isTikTokFeed) {
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    interceptionsCount++

                    showSurgicalToast(
                        if (isInstagramReels) "Instagram Reels Blocked • Stay Focused"
                        else if (isYouTubeShorts) "YouTube Shorts Blocked • Learn with Long-form"
                        else "TikTok FYP Blocked • Reclaim Your Focus"
                    )
                }
            }
        } catch (_: Throwable) {
            // Safe guard against external app view hierarchy exceptions
        }
    }

    private fun triggerInterceptionOverlay(displayName: String, packageName: String) {
        if (packageName == applicationContext.packageName) return
        val intent = Intent().apply {
            setClassName(applicationContext.packageName, "${applicationContext.packageName}.MainActivity")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("SHIELD_TRIGGER", true)
            putExtra("BLOCKED_APP_NAME", displayName)
            putExtra("PACKAGE_NAME", packageName)
        }
        startActivity(intent)
    }

    private fun showSurgicalToast(message: String) {
        val now = System.currentTimeMillis()
        if (now - lastToastTime < 2500) return
        lastToastTime = now

        mainHandler.post {
            try {
                Toast.makeText(applicationContext, message, Toast.LENGTH_SHORT).show()
            } catch (_: Exception) {}
        }
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

    private fun inspectNodeHasContentDescription(root: AccessibilityNodeInfo?, desc: String): Boolean {
        if (root == null) return false
        if (root.contentDescription?.toString()?.contains(desc, ignoreCase = true) == true) {
            return true
        }
        for (i in 0 until root.childCount) {
            val child = root.getChild(i)
            if (inspectNodeHasContentDescription(child, desc)) return true
        }
        return false
    }

    override fun onInterrupt() {}
}
