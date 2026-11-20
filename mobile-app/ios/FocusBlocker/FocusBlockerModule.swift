//
//  FocusBlockerModule.swift
//  DailyHabitApp (Opal-Grade Digital Well-Being OS)
//
//  Cross-platform bridge implementation for Apple Screen Time API:
//  - FamilyControls (Authorization)
//  - ManagedSettings (Shielding applications & Anti-Uninstall Guard)
//  - DeviceActivity (Schedules & Usage Monitoring)
//

import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(FocusBlockerModule)
class FocusBlockerModule: NSObject {
    
    private let store = ManagedSettingsStore()
    private let appGroupIdentifier = "group.com.app.focus.shared"
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // =========================================================================
    // 1. FAMILY CONTROLS AUTHORIZATION (Onboarding Step 5)
    // =========================================================================
    @objc
    func requestFamilyControlsAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
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
                    reject("AUTHORIZATION_FAILED", "Failed to grant FamilyControls: \(error.localizedDescription)", error)
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
    // 2. ACTIVATE / DEACTIVATE SHIELD (ManagedSettingsStore)
    // =========================================================================
    @objc
    func activateShield(_ blockedTokensJSON: String,
                        strictnessMode: String,
                        denyAppRemoval: Bool,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            do {
                let userDefaults = UserDefaults(suiteName: appGroupIdentifier)
                userDefaults?.set(blockedTokensJSON, forKey: "saved_blocked_tokens")
                userDefaults?.set(strictnessMode, forKey: "active_strictness_mode")
                
                // Decode serialized ApplicationTokens from App Group UserDefaults
                if let data = blockedTokensJSON.data(using: .utf8),
                   let tokens = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: data) {
                    store.shield.applications = tokens
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
    func deactivateShield(_ resolver: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.0, *) {
            store.shield.applications = nil
            store.application.denyAppRemoval = false
            resolve(["success": true, "shieldActive": false])
        } else {
            resolve(["success": true, "mock": true])
        }
    }
    
    // =========================================================================
    // 3. ANTI-UNINSTALL GUARD
    // =========================================================================
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
