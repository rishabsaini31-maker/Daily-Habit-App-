# Daily Habit App — Digital Well-Being & System-Level App Blocker

A minimalist, luxury dark-mode digital well-being and habit-building mobile application engineered for deep focus and screen-time reclamation. Built with native OS-level app shielding (**Apple Screen Time API** on iOS and **AccessibilityService + UsageStats** on Android), **Direct OAuth** authentication, **Supabase** cloud persistence, and **RevenueCat** subscriptions.

---

## Core Features

- **System-Level App Blocking:** Instant OS-level shielding during active Focus Sessions or automated schedules.
- **Surgical Reels & Shorts Blocker:** Blocks short-form video feeds (Instagram Reels, YouTube Shorts) on Android while keeping DMs, search, and core utility accessible.
- **Deep Focus & Anti-Uninstall Guard:** Prevents session cancellation and blocks app uninstallation or force-stop settings while an unbreakable session is active.
- **Smart Context Triggers:**
  - **Time-Based Schedules:** Recurring weekday/weekend focus blocks and sleep wind-downs.
  - **Geofence Auto-Lock:** Automatically activates focus rules upon arriving at work, school, or study zones.
  - **Step-Gated Unlocks:** Integrates with Apple HealthKit and Android Health Connect to unlock distracting apps only after hitting daily step goals.
- **Accountability & Gamification:**
  - **Focus Score (0–100):** Real-time daily score calculated against personal baseline screen time.
  - **Gems & Tier Progression:** Earn Gems for every completed session and intercepted distraction (`Bronze` → `Silver` → `Gold` → `Obsidian` → `Diamond`).
  - **Friend Lock (Emergency OTP):** Requires a time-limited 6-digit OTP sent to an accountability partner to break a strict session early.
  - **Physical NFC Tag Lock:** Pair any NTAG213/215 sticker to require a physical tap to unlock distracted apps.

---

## Architecture & Tech Stack

This project uses a **cloud-first, zero-local-database** architecture:

- **Mobile Client:** Cross-platform UI with in-memory reactive state management (zero SQLite, Hive, or local key-value databases).
- **Authentication:** Direct OAuth 2.0 / OIDC (**Sign in with Apple** & **Google OAuth**) passing asymmetrically signed ID tokens directly to Supabase via `accessToken` callbacks.
- **Backend & Database:** **Supabase** (PostgreSQL with Row-Level Security via `auth.jwt() ->> 'sub'`, `SECURITY DEFINER` RPCs, Realtime subscriptions, Deno Edge Functions, and `pg_cron` jobs).
- **Native Blocking Bridges (`com.app.focus/blocker`):**
  - **iOS (Swift):** `FamilyControls`, `ManagedSettings`, `DeviceActivityMonitorExtension`, `ShieldConfigurationExtension`, `HealthKit`, and `CoreNFC`.
  - **Android (Kotlin):** `AccessibilityService`, `UsageStatsManager`, `SYSTEM_ALERT_WINDOW`, `AlarmManager`, `Health Connect`, and `NfcAdapter`.
- **Monetization:** **RevenueCat** SDK (`pro_access` entitlement) synced via secure server-to-server Supabase Edge Function webhooks.

---

## Project Structure

```text
├── core/
│   ├── theme/                  # Obsidian (#08090D) design tokens, typography, reusable cards & buttons
│   └── navigation/             # Root router (5-step Onboarding, 4-tab App Shell, distraction-free Modals)
├── features/
│   ├── onboarding/             # Steps 1–5 (Hook, Quiz, Screen-Time Baseline, Reality Check, Permissions)
│   ├── home/                   # Focus Score ring, daily saved/used metrics, quick session trigger
│   ├── focus_session/          # Session configurator, Surgical Block List picker, Interception Shield
│   ├── schedules/              # Time rules, GPS geofencing, Step-gated unlock rules
│   ├── insights/               # Weekly reclaimed time chart, Top Blocked list, AI opportunity cost card
│   ├── rewards/                # Gems balance, Tier rank, Friend Lock & NFC tag setup
│   ├── paywall/                # Full-screen Pro subscription modal & OAuth account gate
│   └── settings/               # Anti-Uninstall toggle, Health sync, Account linking & deletion
├── services/
│   ├── native_blocker/         # Platform channel interface + Swift (iOS) & Kotlin (Android) bridges
│   ├── supabase/               # OAuth accessToken client, Realtime listeners, RPC wrappers
│   └── subscriptions/          # RevenueCat entitlement sync & Pro feature gating
├── supabase/
│   ├── migrations/             # PostgreSQL schema, RLS policies, RPCs, and pg_cron jobs
│   └── functions/              # Edge Functions (revenuecat-webhook, weekly-ai-insight, delete-user-account)
└── tests/                      # End-to-end integration & RLS verification test suite
```

---

## Prerequisites

- **Node.js** >= 20.x
- **Xcode 16+** (with a physical iOS 16+ device and Apple Developer Account approved for `com.apple.developer.family-controls`)
- **Android Studio** (with a physical Android 10+ device for Accessibility & UsageStats testing)
- **Supabase CLI** & active Supabase project
- **RevenueCat account** with App Store Connect & Google Play Console products configured

---

## Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rishabsaini31-maker/Daily-Habit-App-.git
cd Daily-Habit-App-
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

GOOGLE_OAUTH_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
APPLE_SERVICE_ID=com.yourcompany.dailyhabitapp

REVENUECAT_APPLE_API_KEY=appl_xxxxxxxxxxxxxxxxxxxx
REVENUECAT_GOOGLE_API_KEY=goog_xxxxxxxxxxxxxxxxxxxx
```

### 3. Configure Supabase Backend & Third-Party OAuth
1. Open **Supabase Dashboard → Authentication → Third-Party Auth** and register Google and Apple (or your custom OIDC issuer URL) so Supabase verifies OAuth ID tokens natively.
2. Enable the `pg_cron` extension under **Database → Extensions**.
3. Apply database migrations:
   ```bash
   supabase db push
   ```
4. Deploy Edge Functions and set secrets:
   ```bash
   supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_webhook_bearer_secret
   supabase functions deploy revenuecat-webhook
   supabase functions deploy weekly-ai-insight
   supabase functions deploy delete-user-account
   ```
5. Add your deployed `revenuecat-webhook` URL to **RevenueCat Dashboard → Integrations → Webhooks**.

---

## Native Platform Configuration

### iOS (`ios/`)
- Open the workspace in Xcode and enable the **Family Controls** capability and **App Groups** (`group.com.app.focus`) on the main app target and all Screen Time extensions (`DeviceActivityMonitor`, `ShieldConfiguration`, `ShieldAction`).
- Ensure `com.apple.developer.family-controls` (Distribution) is approved and assigned in your Apple Developer portal before Archiving for TestFlight/App Store.

### Android (`android/`)
- Verify the following permissions are declared in `android/app/src/main/AndroidManifest.xml`:
  - `android.permission.PACKAGE_USAGE_STATS`
  - `android.permission.SYSTEM_ALERT_WINDOW`
  - `android.permission.SCHEDULE_EXACT_ALARM`
  - `android.permission.ACCESS_FINE_LOCATION` & `android.permission.ACCESS_BACKGROUND_LOCATION`
  - `android.permission.ACTIVITY_RECOGNITION`
  - `android.permission.NFC`
- Ensure `FocusAccessibilityService` is registered with `android.permission.BIND_ACCESSIBILITY_SERVICE`.

---

## Running & Testing

```bash
# Run automated end-to-end backend, RLS, and module verification tests
cd backend && npm test

# Run on a connected physical Android device
cd mobile-app && npx react-native run-android

# Run on a connected physical iOS device
cd mobile-app && npx react-native run-ios --device
```

> **Note:** OS-level app blocking (`FamilyControls` on iOS and third-party package interception on Android) requires testing on physical devices; simulators/emulators do not expose full Screen Time or Play Store package targets.

---

## Store Compliance Checklist

- [x] **Mandatory Pro Account Linking:** Paid subscribers sign in via Apple/Google OAuth prior to checkout so entitlements persist across device reinstalls.
- [x] **Sign in with Apple (Guideline 4.8):** Provided alongside Google OAuth on iOS.
- [x] **In-App Account Deletion (Guideline 5.1.1):** Self-serve account and data wipe available in Settings → Delete Account.
- [x] **Google Play Accessibility Declaration:** Prominent in-app disclosure screen shown prior to opening Android Accessibility settings, strictly scoped to digital well-being blocking.

-----

## License

Proprietary — All rights reserved.
