//
//  FocusBlockerModule.swift
//  DailyHabitApp (Opal-Grade Digital Well-Being OS)
//
//  Real system-level Screen Time API implementation:
//  - FamilyControls (Authorization & FamilyActivityPicker)
//  - ManagedSettings (Shielding applications, categories, and Anti-Uninstall Guard)
//  - DeviceActivity (Background Schedule Monitoring)
//

import Foundation
import UIKit
import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(FocusBlockerModule)
class FocusBlockerModule: NSObject {
    
    private let store = ManagedSettingsStore()
    private let appGroupSuiteName = "group.com.app.focus"
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // =========================================================================
    // 1. FAMILY CONTROLS AUTHORIZATION
    // =========================================================================
    @objc
    func requestScreenTimeAuth(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            Task {
                do {
                    // Spec: AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    resolve([
                        "status": "authorized",
                        "familyControlsAuthorized": true
                    ])
                } catch {
                    reject("AUTHORIZATION_FAILED", "Failed to grant Screen Time authorization: \(error.localizedDescription)", error)
                }
            }
        } else {
            resolve([
                "status": "unsupported_os",
                "familyControlsAuthorized": true
            ])
        }
    }
    
    // =========================================================================
    // 2. NATIVE FAMILY ACTIVITY PICKER (Apple's Native App/Category Selector)
    // =========================================================================
    @objc
    func presentAppPicker(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            DispatchQueue.main.async {
                guard let rootVC = UIApplication.shared.windows.first?.rootViewController else {
                    reject("NO_ROOT_VC", "Unable to locate root view controller for picker modal", nil)
                    return
                }
                
                let pickerHostingVC = UIHostingController(
                    rootView: NativeFamilyPickerView(
                        appGroupSuite: self.appGroupSuiteName,
                        onComplete: { selectedCount in
                            rootVC.dismiss(animated: true) {
                                resolve(["success": true, "selectedCount": selectedCount])
                            }
                        },
                        onCancel: {
                            rootVC.dismiss(animated: true) {
                                resolve(["success": false, "cancelled": true])
                            }
                        }
                    )
                )
                
                pickerHostingVC.modalPresentationStyle = .pageSheet
                rootVC.present(pickerHostingVC, animated: true)
            }
        } else {
            resolve(["success": true, "mock": true])
        }
    }
    
    // =========================================================================
    // 3. SHIELD ENFORCEMENT & ANTI-UNINSTALL GUARD
    // =========================================================================
    @objc
    func startBlocking(_ tokensJSON: String,
                       strictnessMode: String,
                       denyAppRemoval: Bool,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            do {
                let userDefaults = UserDefaults(suiteName: appGroupSuiteName)
                userDefaults?.set(tokensJSON, forKey: "saved_blocked_tokens")
                userDefaults?.set(strictnessMode, forKey: "active_strictness_mode")
                userDefaults?.set(true, forKey: "is_blocking_active")
                
                // Decode PropertyList serialized FamilyActivitySelection tokens
                if let data = userDefaults?.data(forKey: "family_activity_selection_data"),
                   let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
                    store.shield.applications = selection.applicationTokens
                    store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
                }
                
                // Spec: Anti-Uninstall Guard or deep_focus denies app deletion
                if denyAppRemoval || strictnessMode == "deep_focus" {
                    store.application.denyAppRemoval = true
                } else {
                    store.application.denyAppRemoval = false
                }
                
                resolve(["success": true, "shieldActive": true])
            } catch {
                reject("SHIELD_ACTIVATION_ERROR", error.localizedDescription, error)
            }
        } else {
            resolve(["success": true, "mock": true])
        }
    }
    
    @objc
    func stopBlocking(_ resolver: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            store.application.denyAppRemoval = false
            
            let userDefaults = UserDefaults(suiteName: appGroupSuiteName)
            userDefaults?.set(false, forKey: "is_blocking_active")
            
            resolve(["success": true, "shieldActive": false])
        } else {
            resolve(["success": true, "mock": true])
        }
    }
    
    @objc
    func setAntiUninstallGuard(_ enabled: Bool,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            store.application.denyAppRemoval = enabled
            resolve(["success": true, "denyAppRemoval": enabled])
        } else {
            resolve(["success": true, "mock": true])
        }
    }
}

// SwiftUI Modal View wrapping Apple's native FamilyActivityPicker
@available(iOS 16.0, *)
struct NativeFamilyPickerView: View {
    let appGroupSuite: String
    let onComplete: (Int) -> Void
    let onCancel: () -> Void
    
    @State private var selection = FamilyActivitySelection()
    
    var body: some View {
        NavigationView {
            FamilyActivityPicker(headerText: "Select distracting apps & websites to shield", selection: $selection)
                .navigationTitle("Select Target Apps")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            onCancel()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save Rules") {
                            // Serialize with PropertyListEncoder to App Group UserDefaults
                            if let encoded = try? PropertyListEncoder().encode(selection) {
                                let userDefaults = UserDefaults(suiteName: appGroupSuite)
                                userDefaults?.set(encoded, forKey: "family_activity_selection_data")
                            }
                            let count = selection.applicationTokens.count + selection.categoryTokens.count
                            onComplete(count)
                        }
                    }
                }
        }
    }
}
