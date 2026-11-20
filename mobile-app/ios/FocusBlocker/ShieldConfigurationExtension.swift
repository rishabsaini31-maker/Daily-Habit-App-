//
//  ShieldConfigurationExtension.swift
//  FocusBlocker
//
//  Customizes Apple's system-level Shield screen appearance
//  Matching our Stitch Obsidian Design System tokens:
//  - Background: #08090D (Obsidian)
//  - Primary Accent: #38BDF8 (Cyan)
//  - Primary CTA: #FFFFFF (White Pill) with #090A0F text
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.03, green: 0.04, blue: 0.05, alpha: 1.0), // #08090D
            icon: UIImage(systemName: "shield.slash.fill"),
            title: ShieldConfiguration.Label(
                text: "Focus Lock Active",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Take a mindful pause. This app is shielded during your scheduled focus block.",
                color: UIColor(red: 0.54, green: 0.58, blue: 0.65, alpha: 1.0) // #8A94A6
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Return to Focus",
                color: UIColor(red: 0.04, green: 0.04, blue: 0.06, alpha: 1.0) // #090A0F
            ),
            primaryButtonBackgroundColor: .white, // #FFFFFF Pure White Pill
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Emergency Friend Unlock",
                color: UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 1.0) // #38BDF8
            )
        )
    }
}
