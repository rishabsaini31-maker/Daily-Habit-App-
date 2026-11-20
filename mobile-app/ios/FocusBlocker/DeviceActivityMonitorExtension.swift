//
//  DeviceActivityMonitorExtension.swift
//  FocusBlocker
//
//  iOS DeviceActivity framework extension:
//  Executes automatically in the background when smart schedule intervals trigger
//

import Foundation
import DeviceActivity
import ManagedSettings

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    
    private let store = ManagedSettingsStore()
    private let appGroupSuiteName = "group.com.app.focus"
    
    // Called when a scheduled smart focus block starts (e.g. Work Hours 09:00 AM)
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        let userDefaults = UserDefaults(suiteName: appGroupSuiteName)
        if let data = userDefaults?.data(forKey: "family_activity_selection_data"),
           let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
            userDefaults?.set(true, forKey: "is_blocking_active")
        }
    }
    
    // Called when a scheduled smart focus block ends (e.g. Work Hours 05:00 PM)
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        
        let userDefaults = UserDefaults(suiteName: appGroupSuiteName)
        userDefaults?.set(false, forKey: "is_blocking_active")
    }
}
