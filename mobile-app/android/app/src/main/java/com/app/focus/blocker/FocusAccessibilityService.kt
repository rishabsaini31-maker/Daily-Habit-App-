package com.app.focus.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.TextView
import android.widget.Toast
import org.json.JSONArray

class FocusAccessibilityService : AccessibilityService() {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var lastToastTime = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: return
        val prefs = getSharedPreferences(FocusBlockerModule.PREFS_NAME, Context.MODE_PRIVATE)
        val isShieldActive = prefs.getBoolean(FocusBlockerModule.KEY_IS_SHIELD_ACTIVE, false)
        val antiUninstallGuard = prefs.getBoolean(FocusBlockerModule.KEY_ANTI_UNINSTALL, false)

        // =========================================================================
        // 1. ANTI-UNINSTALL GUARD
        // When active, blocks navigating to Settings -> App Info for our app
        // =========================================================================
        if (antiUninstallGuard && packageName == "com.android.settings") {
            val rootNode = rootInActiveWindow
            if (inspectNodeContainsText(rootNode, "Daily Habit") ||
                inspectNodeContainsText(rootNode, "Opal") ||
                inspectNodeContainsText(rootNode, "com.app.focus") ||
                inspectNodeContainsText(rootNode, "Uninstall") ||
                inspectNodeContainsText(rootNode, "Force stop")
            ) {
                // Instantly redirect to home launcher and present interception shield
                performGlobalAction(GLOBAL_ACTION_HOME)
                triggerInterceptionOverlay("System Settings (Anti-Uninstall Active)", packageName)
                return
            }
        }

        if (!isShieldActive) return

        val blockedPackagesStr = prefs.getString(FocusBlockerModule.KEY_BLOCKED_PACKAGES, "[]") ?: "[]"
        val blockedList = parseBlockedList(blockedPackagesStr)
        val targetRule = blockedList.find { it.packageName == packageName } ?: return

        // =========================================================================
        // 2. ENTIRE APP BLOCK -> Launch App Block Interception Shield Overlay
        // =========================================================================
        if (!targetRule.isSurgicalOnly) {
            incrementInterceptionsCount(prefs)
            triggerInterceptionOverlay(targetRule.displayName, packageName)
            return
        }

        // =========================================================================
        // 3. SURGICAL REELS & SHORTS MODE
        // Inspects accessibility tree for vertical video swipe feeds
        // =========================================================================
        if (targetRule.isSurgicalOnly) {
            val rootNode = rootInActiveWindow ?: return

            // Instagram Reels: clips_viewer_view_pager or reel tab content description
            val isInstagramReels = packageName == "com.instagram.android" && (
                hasNodeWithId(rootNode, "clips_viewer_view_pager") ||
                hasNodeWithId(rootNode, "reel_viewer_container") ||
                inspectNodeHasContentDescription(rootNode, "Reels") ||
                inspectNodeHasContentDescription(rootNode, "Reel")
            )

            // YouTube Shorts: reel_recycler or shorts_container
            val isYouTubeShorts = packageName == "com.google.android.youtube" && (
                hasNodeWithId(rootNode, "reel_recycler") ||
                hasNodeWithId(rootNode, "shorts_container") ||
                inspectNodeHasContentDescription(rootNode, "Shorts")
            )

            // TikTok FYP / explore swipe
            val isTikTokFeed = packageName == "com.zhiliaoapp.musically" && (
                hasNodeWithId(rootNode, "viewpager") ||
                inspectNodeHasContentDescription(rootNode, "For You")
            )

            if (isInstagramReels || isYouTubeShorts || isTikTokFeed) {
                // Exit the distraction feed back to previous safe screen (DMs, home, search)
                performGlobalAction(GLOBAL_ACTION_BACK)
                incrementInterceptionsCount(prefs)

                // Show subtle obsidian toast overlay: "Reels Blocked • Stay Focused"
                showSurgicalToast(
                    if (isInstagramReels) "Instagram Reels Blocked • Stay Focused"
                    else if (isYouTubeShorts) "YouTube Shorts Blocked • Learn with Long-form"
                    else "TikTok FYP Blocked • Reclaim Your Focus"
                )
            }
        }
    }

    private fun triggerInterceptionOverlay(displayName: String, packageName: String) {
        val intent = Intent().apply {
            setClassName(this@FocusAccessibilityService, "com.app.focus.MainActivity")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("SHIELD_TRIGGER", true)
            putExtra("BLOCKED_APP_NAME", displayName)
            putExtra("PACKAGE_NAME", packageName)
        }
        startActivity(intent)
    }

    private fun showSurgicalToast(message: String) {
        val now = System.currentTimeMillis()
        if (now - lastToastTime < 2500) return // Throttle toasts
        lastToastTime = now

        mainHandler.post {
            try {
                Toast.makeText(applicationContext, message, Toast.LENGTH_SHORT).show()
            } catch (_: Exception) {}
        }
    }

    private fun incrementInterceptionsCount(prefs: android.content.SharedPreferences) {
        val current = prefs.getInt(FocusBlockerModule.KEY_INTERCEPTIONS_COUNT, 0)
        prefs.edit().putInt(FocusBlockerModule.KEY_INTERCEPTIONS_COUNT, current + 1).apply()
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
