//
//  DeviceActivityMonitorExtension.swift
//  FocusBlocker
//
//  iOS DeviceActivity framework extension:
//  Executes automatically in the background when smart schedule intervals trigger
//  Directly relies on ManagedSettingsStore without local databases or UserDefaults.
//

import Foundation
import DeviceActivity
import ManagedSettings

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    
    private let store = ManagedSettingsStore()
    
    // Called when a scheduled smart focus block starts (e.g. Work Hours 09:00 AM)
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        // Directly apply ManagedSettingsStore shields
        let selection = FocusBlockerModule.inMemorySelection
        store.shield.applications = selection.applicationTokens
        store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
    }
    
    // Called when a scheduled smart focus block ends (e.g. Work Hours 05:00 PM)
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        store.shield.applications = nil
        store.shield.applicationCategories = nil
    }
}
