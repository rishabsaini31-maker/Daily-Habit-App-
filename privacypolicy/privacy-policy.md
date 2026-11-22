# Privacy Policy for DHI (Daily Habit Improvement)

**Application Identifier:** `com.dhi.focus`  
**Developer Entity:** SCS Technology  
**Effective Date:** November 22, 2026  
**Last Updated:** November 22, 2026  

---

## 1. Introduction
Welcome to **DHI (Daily Habit Improvement)**, operated by **SCS Technology**. We are committed to protecting your personal data and ensuring transparent digital wellness practices.

This Privacy Policy discloses the information practices for the DHI mobile application published on the Google Play Store and Apple App Store.

---

## 2. Information We Collect and Purpose

| Data Category | Specific Elements | Purpose | Retention & Storage |
| :--- | :--- | :--- | :--- |
| **Account Info (Optional)** | Email address, Display Name | Authentication, profile customization, and restoring DHI Pro subscriptions across devices. | Retained until account deletion. Stored securely in Supabase cloud database. |
| **Habit & Focus Metrics** | Session duration, focus scores, streaks, habit completions | Calculating daily focus scores, awarding motivational gems, and tracking progress insights. | Associated with your account or device ID. |
| **Physical Activity (Steps)** | Step count from device hardware sensors | Enforcing the "Step-Gated Screen Time" feature, where distracting apps stay shielded until daily step goals are achieved. | Evaluated locally; daily totals synced to profile. |
| **Location Coordinates** | GPS latitude and longitude | Powering "GPS Location Auto-Lock" when entering study or workplace focus perimeters. | Processed locally on-device. Location is **never** shared with third parties or advertisers. |
| **Purchase History** | In-app purchase receipts | Unlocking DHI Pro features via Google Play Billing and RevenueCat. | Financial card numbers are processed directly and securely by Google Play. |

---

## 3. Sensitive Android Permissions & API Disclosures

### A. Accessibility Service API (`BIND_ACCESSIBILITY_SERVICE`)
**Prominent Disclosure:**  
DHI utilizes the Android AccessibilityService API strictly to detect when distracting social media feeds (specifically short-form video reels like Instagram Reels and YouTube Shorts) or user-selected blocked applications are active on the screen during a Focus Session.
- **Strict Limitation:** Used solely to identify the package name and view layout of blocked apps to trigger the focus shield overlay.
- **No Keystroke or Message Logging:** DHI **never** reads, stores, or transmits keystrokes, personal messages, passwords, credit card info, or photos.
- **User Control:** The permission must be explicitly enabled by you in Android System Settings and can be disabled at any time.

### B. Usage Stats Permission (`PACKAGE_USAGE_STATS`)
Queries Android's `UsageStatsManager` to aggregate cumulative foreground screen time and alert you when your custom daily app limits are reached.

### C. Physical Activity Recognition (`ACTIVITY_RECOGNITION`)
Queries device pedometer sensors (`Sensor.TYPE_STEP_COUNTER` and `Sensor.TYPE_STEP_DETECTOR`) to count daily walking steps for step-gated routines.

### D. Overlay Permission (`SYSTEM_ALERT_WINDOW`)
Allows DHI to display the dark focus shield overlay directly over intercepted distracting apps.

---

## 4. Data Security & Encryption
- **Encryption in Transit:** All network communication is encrypted using TLS 1.3 / HTTPS.
- **Encryption at Rest:** Databases use industry-standard AES-256 encryption.
- **Zero Third-Party Advertising:** We do not include third-party ad networks, data broker SDKs, or behavioral trackers.

---

## 5. Third-Party Service Providers
- **Google Play Services & Billing:** For distribution and payment processing ([Google Privacy Policy](https://policies.google.com/privacy)).
- **Supabase:** For secure cloud authentication and database synchronization ([Supabase Privacy Policy](https://supabase.com/privacy)).
- **RevenueCat:** For mobile subscription entitlement management ([RevenueCat Privacy Policy](https://www.revenuecat.com/privacy)).

---

## 6. Children's Privacy (COPPA & GDPR)
DHI is intended for users aged **13 and older** (or 16 in the European Union). We do not knowingly collect personal data from children under 13.

---

## 7. Account & Data Deletion
In accordance with Google Play Store and Apple App Store guidelines:
- **In-App Deletion:** Open **Settings -> Danger Zone -> Permanently Delete Account** to instantaneously wipe your profile, habits, schedules, and streaks from our servers.
- **Web Deletion Request:** Email our data privacy team at **support@dhi.app** with your account email address, and your data will be permanently wiped within 48 hours.

---

## 8. Contact Us
For any privacy-related questions, contact:  
- **Email:** support@dhi.app  
- **Organization:** SCS Technology  
- **Application:** DHI - Daily Habit Improvement (`com.dhi.focus`)  
- **Website:** https://daily-habit-app.onrender.com  
