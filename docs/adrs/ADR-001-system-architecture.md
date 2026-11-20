# Architecture Decision Record (ADR)
# ADR-001: System Architecture and Technology Stack for Enterprise Daily Habit Tracker

**Status:** Accepted (Gate 2 Architecture Baseline)  
**Date:** 2026-11-20  
**Deciders:** System Architect (@architect), Chief Technology Officer (@cto), Chief Orchestrator (@ceo)  
**Consulted:** Product Manager (@pm), Backend Engineer, Frontend Engineer, Database Engineer, QA Engineer, Security Engineer  

---

## 1. Context and Problem Statement

The enterprise needs a highly scalable, robust, and maintainable Daily Habit Tracking platform composed of three primary operational surfaces:
1. `mobile-app`: A client-side mobile/PWA application delivering low-friction daily check-ins (<5 seconds), visual streak visualizations, offline-first optimistic check-ins, reminders, and personal progress analytics.
2. `admin`: A high-fidelity administrative web dashboard for user moderation, habit template catalog management, system-wide DAU/MAU analytics, and immutable audit logs.
3. `backend`: A centralized, secure, modular REST API enforcing tenancy isolation, role-based access control (RBAC), deterministic timezone-aware streak calculations, idempotent completion updates, and transactional ACID guarantees.

The engineering organization operates under strict quality standards: modular clean architecture, zero speculative dependencies, strong static typing (TypeScript), parameterized SQL safety, reversible database migrations, and 12-stage automated quality gates.

---

## 2. Decision Drivers

- **Modularity & Separation of Concerns:** Core domain business logic (streak state machine, completion idempotency, timezone rollover) must remain decoupled from HTTP frameworks, persistence drivers, and client user interfaces.
- **Strict File & Boundary Ownership:** Clear physical and logical partition across `mobile-app/`, `admin/`, and `backend/`.
- **Developer Velocity & Portability:** Single-command local bootstrapping without heavy cloud dependencies, alongside production readiness for PostgreSQL and containerized deployments.
- **Data Integrity & Determinism:** Timezone differences must never corrupt streaks. Check-ins must be idempotent across network retries.
- **Enterprise Security:** Stateless JWT authentication, zero plain-text secrets, Bcrypt password hashing (work factor 12), strict RBAC (`USER` vs `ADMIN`), rate limiting, and immutable audit logging.
- **Universal Static Typing:** End-to-end TypeScript preventing runtime type failures.

---

## 3. Considered Options

- **Option A (Monolithic Full-stack Framework - e.g. Next.js App Router for Everything):** Coupling backend API routes, admin, and mobile web in one framework.  
  *Rejected:* Violates client isolation, complicates independent mobile app packaging/PWA deployment, mixes web SSR with clean headless API contracts.
- **Option B (Microservices Architecture):** Splitting auth, habits, streaks, analytics, and admin into separate microservices.  
  *Rejected:* Severe operational overhead, distributed transaction complexity, network latency, and premature optimization for current scope.
- **Option C (Decoupled Modular Monolith with Clean Architecture - SELECTED):** Three decoupled top-level directories (`backend/`, `admin/`, `mobile-app/`). The backend adopts Clean Architecture (Ports & Adapters) on Node.js exposing a versioned REST API. SQLite for development and PostgreSQL compatibility for production. Admin portal built with Next.js + React + TypeScript with SSR/SSG capabilities. Mobile application built with modern React + TypeScript (mobile-first PWA / React Native ready).

---

## 4. Architectural Decisions

### 4.1 Monorepo Module Layout
The workspace is organized into three distinct application roots:
```
daily-habit-app/
├── backend/                  # Node.js/TypeScript Clean Architecture REST API
│   ├── src/
│   │   ├── domain/           # Pure enterprise entities, value objects, domain rules
│   │   ├── usecases/         # Application orchestrators, ports/interfaces, DTOs
│   │   ├── controllers/      # Express request handlers and input validators
│   │   ├── infrastructure/   # Repositories, database drivers, JWT, clock
│   │   ├── middleware/       # Auth, RBAC, error handling, rate limiting
│   │   └── config/           # Validated environment configuration
│   ├── migrations/           # Reversible forward (up) and rollback (down) SQL scripts
│   ├── tests/                # Unit, integration, and contract test suites
│   ├── package.json
│   └── tsconfig.json
├── admin/                    # Next.js + React + TypeScript Web Admin Portal
│   ├── src/ or app/          # Accessible UI components, charts, tables, Next.js App Router
│   ├── app/                  # Dashboard, Users, Templates, Audit Logs, Login
│   ├── components/           # UI components, stat cards, tables, modals
│   ├── services/             # Typed API clients for /api/v1/admin/*
│   ├── types/                # Admin domain DTOs
│   ├── context/              # Auth context and route guards
│   ├── package.json
│   └── next.config.js
├── mobile-app/               # Mobile-First Client (React / PWA / TypeScript)
│   ├── src/
│   │   ├── components/       # Check-in cards, streak rings, heatmaps, badges
│   │   ├── screens/          # Today, Habits, Templates, Analytics, Profile
│   │   ├── services/         # Offline-aware API client and synchronization queue
│   │   ├── hooks/            # Habit state and local mutation hooks
│   │   ├── store/            # Lightweight offline state (Zustand / LocalStorage)
│   │   └── types/            # Client entity and API DTO definitions
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # PRD, Architecture, ADRs, Contracts, and Roadmap
└── package.json              # Root workspace orchestrator
```

### 4.2 Backend Layered Architecture (Clean / Hexagonal)
The backend strictly enforces the dependency rule: **inner layers have no knowledge of outer layers**.

1. **Domain Layer (`backend/src/domain`):**
   - Pure TypeScript entities: `User`, `Category`, `Habit`, `HabitCompletion`, `StreakRecord`, `HabitTemplate`, `AuditLog`.
   - Domain logic: `StreakCalculator` state machine, frequency validator (`FrequencyEvaluator`), completion policy.
   - Value objects: `DateString` (`YYYY-MM-DD`), `Timezone` (IANA), `Email`, `HashedPassword`.
   - Zero third-party dependencies (no Express, no database drivers).

2. **Use Case Layer (`backend/src/usecases`):**
   - Application boundaries: `CreateHabitUseCase`, `LogCompletionUseCase`, `CalculateStreakUseCase`, `AdoptTemplateUseCase`, `SuspendUserUseCase`, `GeneratePlatformMetricsUseCase`.
   - Inbound and Outbound Ports: Repositories defined as pure TypeScript interfaces (e.g. `IHabitRepository`, `ICompletionRepository`, `IUserRepository`, `IAuditLogRepository`, `ITokenService`, `IClockService`).
   - Request and Response Data Transfer Objects (DTOs).

3. **Interface Adapter Layer (`backend/src/controllers` & `middleware`):**
   - Express controllers translating HTTP requests into Use Case commands.
   - Input validation using strict schemas (e.g. Zod / schema validators).
   - Global error middleware mapping domain exceptions to standard HTTP error envelopes.
   - Security middleware: `authenticateJwt`, `requireRole('ADMIN')`, `rateLimiter`, `securityHeaders`.

4. **Infrastructure Layer (`backend/src/infrastructure`):**
   - Database persistence implementations: parameterized SQL queries using Knex query builder or typed database driver.
   - Drivers: SQLite3 (`better-sqlite3` or `sqlite3`) for instant zero-config testing and local development; PostgreSQL driver (`pg`) for staging and production.
   - Concrete implementations of services: `BcryptPasswordHasher`, `JwtTokenService`, `SystemClock`.

### 4.3 Database Architecture & Reversible Migrations
- **Dual-Engine Dialect Strategy:** The persistence layer adheres to ANSI SQL standards supported identically by SQLite and PostgreSQL. All migrations use standard DDL statements (`CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE`) with reversible down migrations.
- **Strict Integrity Constraints:**
  - `habits.user_id` -> Foreign key to `users.id` with `ON DELETE CASCADE`.
  - `habit_completions(habit_id, date)` -> `UNIQUE` composite constraint enforcing idempotency.
  - `audit_logs` -> Append-only table without `UPDATE` or `DELETE` capabilities.
  - Indexed fields: `users(email)`, `habits(user_id, is_archived)`, `habit_completions(habit_id, date)`, `audit_logs(created_at, actor_id)`.

### 4.4 Authentication, RBAC & Security Standard
- **Token Mechanism:** Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).
- **Token Payload:** `{ sub: user_id, email: user_email, role: 'USER' | 'ADMIN', exp: timestamp }`. Token expiration: 60 minutes.
- **Password Security:** Salted and hashed using `bcrypt` with 12 salt rounds.
- **Tenancy Enforcement:** Every data query for regular users enforces `WHERE user_id = :authenticatedUserId`. Role `ADMIN` grants access exclusively to administrative routes (`/api/v1/admin/*`).
- **Audit Logging:** Every mutating administrative action triggers an immutable write to `audit_logs` with actor details, target entity, action string, IP address, and payload diff.

### 4.5 Standardized API Envelope
All REST API endpoints conform to a uniform JSON response structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided habit parameters are invalid.",
    "details": [
      { "field": "title", "issue": "Title must be between 1 and 100 characters." }
    ],
    "timestamp": "2026-11-20T21:00:00.000Z",
    "requestId": "req-9a1b-4c8d"
  }
}
```

### 4.6 Standard Machine-Readable Error Codes
- `AUTH_UNAUTHORIZED`: Missing, malformed, or expired token.
- `AUTH_FORBIDDEN`: Insufficient role permissions (e.g. non-admin accessing admin portal).
- `AUTH_INVALID_CREDENTIALS`: Email or password incorrect.
- `AUTH_ACCOUNT_SUSPENDED`: Account suspended by administrator.
- `RESOURCE_NOT_FOUND`: Target habit, user, category, or template does not exist.
- `VALIDATION_FAILED`: Request payload violates schema bounds.
- `COMPLETION_WINDOW_EXCEEDED`: Attempted backfill exceeds 48-hour allowable threshold.
- `IDEMPOTENCY_CONFLICT`: Concurrent write conflict on completion record.
- `INTERNAL_SERVER_ERROR`: Unhandled exception caught by global safety handler.

### 4.7 Client Architecture (Admin & Mobile)
- **Admin Portal (`admin/`):** Production web application built on Next.js + React + TypeScript with App Router. Uses React Router or Next.js App navigation with an `<AdminProtectedRoute />` / middleware verifying token role. Manages asynchronous server state caching, pagination, and invalidation.
- **Mobile Client (`mobile-app/`):** React 18 + TypeScript responsive mobile web application styled with Tailwind CSS, touch targets >= 44px, and WCAG AA contrast. Uses an optimistic UI layer: when a user checks off a habit, the UI updates immediately and queues an HTTP request to `POST /api/v1/habits/:id/completions`. If offline, the check-in is buffered in `localStorage` and flushed upon reconnection.

---

## 5. Consequences

### Positive Consequences
- **High Testability:** Pure domain entities and use cases can be unit tested with 100% code coverage without starting an HTTP server or spinning up a database.
- **Deterministic Habit & Streak Logic:** Isolating the timezone-aware streak calculator guarantees accurate calculation regardless of server timezone.
- **Zero Runtime Surprises:** Strict TypeScript compiler configuration (`noImplicitAny: true`, `strictNullChecks: true`) ensures contract compliance across modules.
- **Seamless Local Bootstrapping:** Developers can spin up the full backend using embedded SQLite in under 5 seconds with zero Docker dependency, while CI and production seamlessly switch to PostgreSQL via environment variables.

### Negative Consequences / Trade-offs & Mitigations
- **Layering Overhead:** Creating domain entities, use case interactors, repository interfaces, and controller classes requires more boilerplate than typical CRUD frameworks.  
  *Mitigation:* Standardized architectural templates and code scaffolding for all entities.
- **Dual SQL Dialect Maintenance:** Ensuring migrations run cleanly on both SQLite and PostgreSQL.  
  *Mitigation:* Strict use of standard SQL-92 types and automated migration tests validating both SQLite and PostgreSQL execution in CI.

---

## 6. Compliance and Verification Gates

This ADR satisfies the Gate 2 Architecture Gate criteria:
- [x] Clear modular boundaries and 3-module top-level structure defined.
- [x] Clean architecture dependency rule established.
- [x] Dual-engine reversible migration pattern documented.
- [x] Strict typing, authentication, and RBAC contracts formulated.
- [x] Uniform API error envelope and error codes defined.
