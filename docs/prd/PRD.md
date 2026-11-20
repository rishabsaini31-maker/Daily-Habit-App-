# Product Requirements Document (PRD)
## Enterprise Daily Habit Tracker System

**Document Version:** 1.0.0  
**Status:** Approved (Gate 1 Baseline)  
**Author:** Product Management (@pm)  
**Stakeholders:** Engineering, Architecture, QA, Security, Operations, Executive Leadership  
**Target Delivery:** Q1 2027  

---

## 1. Executive Summary & Product Vision

### 1.1 Vision Statement
The **Enterprise Daily Habit Tracker** is an intuitive, reliable, and scalable habit tracking ecosystem designed to empower individuals to build sustainable daily routines while providing platform administrators with enterprise-grade operational controls, template curation, and analytics.

### 1.2 Core Value Proposition
- **For End Users (Mobile App):** Low-friction daily check-ins, visual streak tracking, intelligent reminders, customizable habit frequencies, rich progress analytics, and an inspiring template library.
- **For Platform Administrators (Admin Portal):** Centralized oversight of platform adoption, user lifecycle management, curated habit template catalog, system-wide health and streak analytics, and immutable audit logging.
- **For Engineering & Operations (Backend API):** A robust, modular, secure, and performant REST API enforcing role-based access control, deterministic timezone-aware streak calculations, idempotent completion handling, and ACID-compliant persistence.

---

## 2. Target Personas

| Persona | Role | Key Objectives | Core Pain Points |
| :--- | :--- | :--- | :--- |
| **Alex (Daily Habit Tracker)** | Primary Mobile End-User | - Complete daily habits in < 5 seconds<br>- Visualize unbroken streaks<br>- Receive contextual reminders<br>- Review weekly/monthly progress trends | - Clunky interfaces causing tracking fatigue<br>- Timezone changes breaking streaks unexpectedly<br>- Loss of offline check-ins |
| **Jordan (Habit Explorer)** | Secondary Mobile End-User | - Discover proven routines (Morning, Fitness, Mindfulness)<br>- Adopt multi-day schedules (e.g., MWF workout)<br>- Track quantitative habits (e.g., 2000ml water) | - Rigid apps only supporting binary yes/no daily habits<br>- Overwhelmed starting from a blank slate |
| **Morgan (Platform Administrator)** | System & Community Admin | - Curate and publish global habit templates<br>- Monitor platform DAU/MAU and completion rates<br>- Manage suspicious/flagged user accounts<br>- Audit administrative changes | - Lack of actionable operational insights<br>- No audit trail for compliance and safety<br>- Inability to seed or organize templates |

---

## 3. Product Architecture Overview & Modules

The platform is partitioned into three decoupled modules sharing a unified domain model and API contract:

```
+----------------------------------------------------------------------+
|                           CLIENT TIER                                |
|  +--------------------------------+   +---------------------------+  |
|  |     Mobile App (React/React Native) |   |    Admin Web Portal       |  |
|  |   - Daily Check-in & Dashboard |   |  - User Management        |  |
|  |   - Habit CRUD & Categories    |   |  - Template Management    |  |
|  |   - Streak & Progress Analytics|   |  - Platform Metrics       |  |
|  |   - Push Reminders & Settings  |   |  - Audit Log Viewer       |  |
|  +--------------------------------+   +---------------------------+  |
+----------------------------------------------------------------------+
                                   | REST / JSON (JWT RBAC)
                                   v
+----------------------------------------------------------------------+
|                           BACKEND TIER                               |
|  +----------------------------------------------------------------+  |
|  |                       Node.js / Express API                    |  |
|  |  +-------------------+  +------------------+  +-------------+  |  |
|  |  | Auth & RBAC       |  | Habit Engine     |  | Streak Core |  |  |
|  |  | (JWT, Bcrypt)     |  | (CRUD, Types)    |  | (Timezone)  |  |  |
|  |  +-------------------+  +------------------+  +-------------+  |  |
|  |  +-------------------+  +------------------+  +-------------+  |  |
|  |  | Completion & Log  |  | Template Manager |  | Analytics   |  |  |
|  |  | (Idempotent)      |  | & Audit Subsystem|  | & Reporting |  |  |
|  |  +-------------------+  +------------------+  +-------------+  |  |
|  +----------------------------------------------------------------+  |
+----------------------------------------------------------------------+
                                   | SQL (ACID)
                                   v
+----------------------------------------------------------------------+
|                           DATA TIER                                  |
|     Relational Database (SQLite for dev/testing, PostgreSQL prod)    |
+----------------------------------------------------------------------+
```

---

## 4. Epic & Detailed Functional Requirements

### Epic 1: Identity, Authentication & Role-Based Access Control (RBAC)
- **FR-AUTH-001 (User Registration):** Mobile users can register with valid email, password (min 8 chars, 1 uppercase, 1 digit, 1 special character), and display name.
- **FR-AUTH-002 (Authentication & JWT):** System issues short-lived JWT access tokens (15–60 min) and cryptographically secure refresh tokens.
- **FR-AUTH-003 (Role Segregation):** Two distinct roles:
  - `USER`: Regular mobile user permissions (own habits, completions, profile).
  - `ADMIN`: Administrative portal access (user moderation, global templates, audit logs, aggregate metrics).
- **FR-AUTH-004 (Password Security):** Passwords hashed using bcrypt (cost factor >= 10) or Argon2id. No plaintext passwords stored or logged.
- **FR-AUTH-005 (Session & Logout):** Revocable refresh tokens stored server-side to allow instant revocation upon logout or security breach.

### Epic 2: Habit Management & Categorization (Mobile)
- **FR-HABIT-001 (Habit Creation):** User can create habits specifying:
  - `title` (1 to 100 characters, required).
  - `description` (optional, up to 500 characters).
  - `categoryId` (required, pre-seeded or user-created).
  - `frequencyType`: `DAILY`, `WEEKLY_DAYS` (specific days e.g., Mon, Wed, Fri), or `TIMES_PER_PERIOD` (e.g., 3 times per week).
  - `targetType`: `BOOLEAN` (done/not done) or `NUMERIC` (target value + unit, e.g., 30 minutes, 2000 ml).
  - `targetValue`: Required if `targetType` is `NUMERIC` (positive integer/float).
  - `unit`: String label (e.g., "pages", "km", "minutes").
  - `reminderTime`: Optional daily time string (`HH:mm` format).
  - `color`: Hex color code for UI rendering.
  - `icon`: Identifier for standard icon sets.
- **FR-HABIT-002 (Habit Editing):** Modify title, description, reminder time, color, and icon without altering historical completion records.
- **FR-HABIT-003 (Soft Deletion & Archival):** Habits can be archived or soft-deleted (`archived_at` / `deleted_at`). Historical completion and streak data remain queryable for reports.
- **FR-HABIT-004 (Habit Categories):** Default categories pre-populated: Health, Fitness, Productivity, Mindfulness, Learning, Finance, and Lifestyle. Users can assign custom categories.
- **FR-HABIT-005 (Filtering & Ordering):** Filter habits by category, status (active/archived), and sort by creation date, title, or streak length.

### Epic 3: Daily Check-In, Progress Tracking & Streak Engine
- **FR-CHECKIN-001 (Today's Checklist):** Present an actionable list of habits scheduled for the current date based on user's timezone.
- **FR-CHECKIN-002 (Idempotent Check-In):**
  - Toggling or updating a completion for date `YYYY-MM-DD` must be idempotent.
  - For `BOOLEAN` habits: check/uncheck sets status `COMPLETED` or `SKIPPED`/`UNCHECKED`.
  - For `NUMERIC` habits: record progress incrementally or set final value. Reaching or exceeding `targetValue` marks the day completed.
- **FR-CHECKIN-003 (Timezone Determinism):**
  - Check-ins recorded with user's local date (`YYYY-MM-DD`), UTC timestamp (`completed_at`), and user's IANA timezone (e.g., `America/New_York`, `UTC`).
  - Streak evaluation considers midnight cutoffs strictly in the user's localized date.
- **FR-STREAK-001 (Current Streak Calculation):**
  - Continuous consecutive scheduled days where habit conditions were met.
  - If today is not yet completed, the streak remains intact if yesterday was completed.
  - If yesterday was missed and today is not completed, streak resets to 0.
- **FR-STREAK-002 (Longest Streak Calculation):**
  - High-water mark of consecutive completed scheduled periods throughout habit lifetime.
- **FR-STREAK-003 (Streak Grace Period / Freeze):**
  - Configurable streak freeze: Allow 1 freeze per month or grace period for accidental missed days to prevent user demoralization.
- **FR-CHECKIN-004 (Historical Backfill Window):**
  - Users can backfill completions up to a maximum of 48 hours in the past (to accommodate forgotten check-ins) with audit timestamp indicating backfill.

### Epic 4: Progress Analytics & Visualizations (Mobile)
- **FR-ANALYTICS-001 (Completion Rate):** Calculate 7-day, 30-day, and all-time completion percentage per habit and across all habits.
- **FR-ANALYTICS-002 (Calendar Heatmap):** Visual monthly calendar matrix indicating completion status per day (Full, Partial, Missed, Off-day).
- **FR-ANALYTICS-003 (Streak Milestones):** Celebratory badges/milestones at 3, 7, 14, 30, 60, 100, and 365 days.
- **FR-ANALYTICS-004 (Category Performance):** Aggregate completion distribution by category.

### Epic 5: Curated Habit Templates & Discovery
- **FR-TEMPLATE-001 (Template Catalog):** System maintains curated templates (e.g., "Morning Miracle", "Couch to 5K", "Deep Work Sprint", "Daily Hydration").
- **FR-TEMPLATE-002 (Template Adoption):** Mobile users can preview a template and adopt it with one tap, cloning it into their personal habits with pre-configured settings.
- **FR-TEMPLATE-003 (Template Search & Filter):** Browse templates by category, difficulty, or popularity.

### Epic 6: Administration Portal (Web Admin)
- **FR-ADMIN-001 (Executive Dashboard):**
  - Key performance indicators: Total Users, Active Users (DAU/MAU), Total Active Habits, Completions Logged Today, Platform-wide Completion Rate.
  - Interactive charts for signups and completion velocity.
- **FR-ADMIN-002 (User Moderation & Management):**
  - Paginated table of all registered users with search (by email, name, ID) and status filters (`ACTIVE`, `SUSPENDED`).
  - View individual user profile summary: total habits created, active streaks, registration date, last active timestamp.
  - Action to suspend / unsuspend accounts with mandatory reason input.
- **FR-ADMIN-003 (Habit Template Management - CRUD):**
  - Create, edit, publish, unpublish, and delete global habit templates.
  - Fields: Title, description, suggested category, default frequency, target type, target value, icon, color.
- **FR-ADMIN-004 (Security & Audit Trail):**
  - Immutable audit log tracking all administrative actions (user suspension, template updates, system config changes).
  - Columns: Timestamp (UTC), Admin ID & Email, Action Name, Target Entity Type, Target Entity ID, IP Address, Metadata/Changes Diff.
  - Filterable by date range, action type, and admin user.

---

## 5. Domain Rules & Business Logic Specifications

### 5.1 Streak Calculation State Machine
```
                       +-----------------------+
                       |      Day Begins       |
                       +-----------------------+
                                   |
                   +---------------+---------------+
                   |                               |
       Scheduled Active Day              Unscheduled / Off Day
                   |                               |
        +----------+----------+                    v
        |                     |            Streak Preserved
  Check-in Logged       No Check-in        (No increment,
  (Target Met)          by Midnight         no penalty)
        |                     |
        v                     v
  Streak = Streak + 1   Check Freeze Available?
  Update LongestStreak        |
                        +-----+-----+
                        |           |
                       Yes          No
                        |           |
                        v           v
                  Streak Frozen    Streak Resets to 0
```

### 5.2 Completion State Transitions
1. `PENDING`: Scheduled for date, not yet fulfilled.
2. `COMPLETED`: Target reached or boolean toggle active.
3. `SKIPPED`: User explicitly flagged as rest/pass (does not break streak if allowed by policy).
4. `MISSED`: End-of-day reached without completion.

### 5.3 Data Integrity & Security Rules
- **Rule 1 (Tenancy Isolation):** Non-admin users can ONLY read and mutate records belonging to their authenticated `user_id`. Every SQL query for habit data must enforce `WHERE user_id = :userId`.
- **Rule 2 (Idempotency):** The composite key `(habit_id, date)` in completion logs MUST be unique. Repeated check-in API calls must update rather than create duplicate rows.
- **Rule 3 (Zero Plaintext Secrets):** Passwords, JWT secrets, and API credentials must never be committed or written into logs.
- **Rule 4 (Audit Immutability):** Records in `audit_logs` table are append-only. No UPDATE or DELETE privileges allowed.

---

## 6. Non-Functional Requirements (NFRs)

### 6.1 Performance & Latency
- **API Response Time:** P95 latency < 100ms for habit listing, check-in, and streak queries under concurrent load.
- **Throughput:** Backend designed to support >= 500 requests/sec with minimal resource footprint.
- **Database Indexing:** Composite indexes on `(user_id, status)`, `(habit_id, date)`, and `(created_at)`.

### 6.2 Reliability & Availability
- **Data Durability:** Transactional ACID guarantees on all habit completion and streak updates.
- **Graceful Error Handling:** Standardized JSON error response envelope (`{ success: false, error: { code, message, details } }`).

### 6.3 Security & Compliance
- **Authentication:** JWT with HMAC-SHA256 (or RS256), expiring in 60 minutes; refresh tokens stored in hashed format.
- **OWASP Top 10 Mitigation:**
  - SQL Injection: 100% parameterized queries / ORM mapping.
  - XSS: Output encoding and sanitization on all user inputs.
  - Rate Limiting: 100 requests per 15-minute window for auth endpoints; 1000 requests per 15-minute window for general API.
  - CORS: Explicitly whitelisted client origins.

### 6.4 Usability & Accessibility
- **WCAG 2.1 AA Compliance:** Minimum color contrast ratio of 4.5:1 for text, accessible touch targets (min 44x44px), screen-reader friendly semantic markup.
- **Mobile Responsiveness:** Fluid layouts from 360px viewport width up to 4K desktop screens.

---

## 7. Data Models & Entity Relationships

### 7.1 Core Entities

1. **User**
   - `id`: UUID (Primary Key)
   - `email`: VARCHAR(255), UNIQUE, indexed
   - `password_hash`: VARCHAR(255)
   - `display_name`: VARCHAR(100)
   - `role`: ENUM ('USER', 'ADMIN'), default 'USER'
   - `status`: ENUM ('ACTIVE', 'SUSPENDED'), default 'ACTIVE'
   - `timezone`: VARCHAR(50), default 'UTC'
   - `created_at`, `updated_at`: TIMESTAMP

2. **Category**
   - `id`: UUID (Primary Key)
   - `name`: VARCHAR(50), UNIQUE
   - `icon`: VARCHAR(50)
   - `color`: VARCHAR(20)
   - `is_system`: BOOLEAN, default true

3. **Habit**
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Foreign Key -> User.id, ON DELETE CASCADE)
   - `category_id`: UUID (Foreign Key -> Category.id)
   - `title`: VARCHAR(100)
   - `description`: TEXT (nullable)
   - `frequency_type`: ENUM ('DAILY', 'WEEKLY_DAYS', 'TIMES_PER_PERIOD')
   - `frequency_payload`: JSON (e.g. days array `[1, 3, 5]` or target times `3`)
   - `target_type`: ENUM ('BOOLEAN', 'NUMERIC')
   - `target_value`: DECIMAL(10,2) (nullable)
   - `unit`: VARCHAR(30) (nullable)
   - `reminder_time`: VARCHAR(5) (HH:mm format, nullable)
   - `color`: VARCHAR(20)
   - `icon`: VARCHAR(50)
   - `is_archived`: BOOLEAN, default false
   - `created_at`, `updated_at`: TIMESTAMP

4. **HabitCompletion**
   - `id`: UUID (Primary Key)
   - `habit_id`: UUID (Foreign Key -> Habit.id, ON DELETE CASCADE)
   - `user_id`: UUID (Foreign Key -> User.id)
   - `date`: DATE (format 'YYYY-MM-DD', unique per habit_id + date)
   - `status`: ENUM ('COMPLETED', 'SKIPPED')
   - `value`: DECIMAL(10,2) (recorded progress value)
   - `notes`: TEXT (nullable)
   - `completed_at`: TIMESTAMP (UTC)
   - `created_at`, `updated_at`: TIMESTAMP

5. **StreakRecord**
   - `id`: UUID (Primary Key)
   - `habit_id`: UUID (Foreign Key -> Habit.id, ON DELETE CASCADE, UNIQUE)
   - `current_streak`: INTEGER, default 0
   - `longest_streak`: INTEGER, default 0
   - `last_completed_date`: DATE (nullable)
   - `freeze_count_remaining`: INTEGER, default 1
   - `updated_at`: TIMESTAMP

6. **HabitTemplate**
   - `id`: UUID (Primary Key)
   - `title`: VARCHAR(100)
   - `description`: TEXT
   - `category_id`: UUID (Foreign Key -> Category.id)
   - `frequency_type`: ENUM ('DAILY', 'WEEKLY_DAYS', 'TIMES_PER_PERIOD')
   - `frequency_payload`: JSON
   - `target_type`: ENUM ('BOOLEAN', 'NUMERIC')
   - `target_value`: DECIMAL(10,2) (nullable)
   - `unit`: VARCHAR(30) (nullable)
   - `icon`: VARCHAR(50)
   - `color`: VARCHAR(20)
   - `is_published`: BOOLEAN, default true
   - `created_by`: UUID (Foreign Key -> User.id)
   - `created_at`, `updated_at`: TIMESTAMP

7. **AuditLog**
   - `id`: UUID (Primary Key)
   - `actor_id`: UUID (Foreign Key -> User.id)
   - `action`: VARCHAR(100)
   - `entity_type`: VARCHAR(50)
   - `entity_id`: VARCHAR(100)
   - `details`: JSON (metadata / before & after diff)
   - `ip_address`: VARCHAR(45) (nullable)
   - `created_at`: TIMESTAMP (immutable)

---

## 8. User Journeys & Workflow Specifications

### Journey 1: New User Onboarding & First Habit Creation
1. User opens Mobile App and lands on Welcome Screen.
2. Selects "Sign Up" -> enters email, password, and name -> submits.
3. System logs user in, returns JWT, and redirects to Onboarding Habit Wizard.
4. User selects from popular templates (e.g. "Drink 2L Water", "Read 20 mins") or creates custom habit.
5. Habit is persisted; user is navigated to Today view where new habit is ready for check-in.

### Journey 2: Daily Check-In & Streak Increment
1. User opens Mobile App. Today's date is calculated per user's device timezone.
2. User taps check-in on "Morning Jog".
3. System dispatches `POST /api/v1/habits/:id/completions` with date `YYYY-MM-DD`.
4. Streak engine evaluates completion:
   - Increments `current_streak` from 4 to 5.
   - Evaluates if 5 exceeds `longest_streak` (e.g. 4) -> updates `longest_streak` to 5.
5. Mobile UI immediately displays celebratory checkmark animation and updated streak counter.

### Journey 3: Administrator Curation & Platform Oversight
1. Admin navigates to `/admin` login page.
2. Authenticates using Admin credentials. Backend verifies `role == 'ADMIN'`.
3. Admin dashboard loads summary stats: DAU/MAU, total completions, active habits.
4. Admin clicks "Templates" -> selects "New Template" -> enters "Evening Wind Down", 30 mins reading -> clicks "Publish".
5. Backend writes template and creates entry in `audit_logs`.
6. Mobile users immediately see the new template in their template discovery screen.

---

## 9. Gate 1 Acceptance Criteria (Verification Matrix)

To pass Gate 1 (Requirements Gate) and transition to Gate 2 (Architecture), this PRD must meet the following criteria:

| Requirement ID | Acceptance Criterion | Verification Method |
| :--- | :--- | :--- |
| **AC-REQ-001** | Full functional requirements defined for mobile-app, admin portal, and backend API. | PRD Inspection across Section 4 |
| **AC-REQ-002** | Personas, user journeys, and edge cases clearly articulated. | Section 2 & 8 Review |
| **AC-REQ-003** | Timezone and midnight streak rollover logic unambiguously specified. | Section 5.1 & 5.2 Review |
| **AC-REQ-004** | Role-Based Access Control (User vs Admin) strictly delineated with security invariants. | Section 4 (Epic 1) & Section 5.3 |
| **AC-REQ-005** | Complete entity schema defined covering Users, Habits, Completions, Streaks, Templates, and Audit Logs. | Section 7 Entity Model Review |
| **AC-REQ-006** | Non-functional requirements for performance, security, and accessibility explicitly stated with testable thresholds. | Section 6 NFR Review |

---

## 10. Document Approvals & Sign-off

- **Product Manager:** Approved (@pm)
- **Status:** Baseline Established. Ready for Architectural Blueprinting (@architect) and System Design.
