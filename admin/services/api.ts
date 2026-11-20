/**
 * Enterprise Daily Habit Platform — Admin API Client
 * OpenAPI 3.1 specification compliant with automatic mock fallback for offline/preview environments.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  timezone: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  timezone: string;
  totalHabits: number;
  activeStreaks: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface HabitTemplate {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  frequencyType: 'DAILY' | 'WEEKLY_DAYS' | 'TIMES_PER_PERIOD';
  frequencyPayload?: number[] | null;
  targetType: 'BOOLEAN' | 'NUMERIC';
  targetValue?: number | null;
  unit?: string | null;
  icon: string;
  color: string;
  isPublished: boolean;
  createdAt: string;
}

export interface CreateTemplateRequest {
  title: string;
  description: string;
  categoryId: string;
  frequencyType: 'DAILY' | 'WEEKLY_DAYS' | 'TIMES_PER_PERIOD';
  frequencyPayload?: number[];
  targetType: 'BOOLEAN' | 'NUMERIC';
  targetValue?: number | null;
  unit?: string | null;
  icon: string;
  color: string;
  isPublished?: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminDashboardData {
  totalUsers: number;
  dau: number;
  mau: number;
  totalActiveHabits: number;
  completionsToday: number;
  platformCompletionRate: number;
  signupTrends: Array<{ date: string; newUsers: number }>;
  completionVelocityTrends: Array<{ date: string; completions: number }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// ---------------- MOCK DATA STORAGE ----------------
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Health', icon: 'heart', color: '#10B981', isSystem: true },
  { id: 'cat-2', name: 'Fitness', icon: 'activity', color: '#3B82F6', isSystem: true },
  { id: 'cat-3', name: 'Productivity', icon: 'check-square', color: '#F59E0B', isSystem: true },
  { id: 'cat-4', name: 'Mindfulness', icon: 'smile', color: '#8B5CF6', isSystem: true },
  { id: 'cat-5', name: 'Learning', icon: 'book', color: '#EC4899', isSystem: true },
  { id: 'cat-6', name: 'Finance', icon: 'dollar-sign', color: '#06B6D4', isSystem: true },
];

let mockUsers: AdminUser[] = [
  {
    id: 'usr-admin-001',
    email: 'admin@habit-tracker.internal',
    displayName: 'Global Administrator',
    role: 'ADMIN',
    status: 'ACTIVE',
    timezone: 'UTC',
    totalHabits: 14,
    activeStreaks: 12,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-002',
    email: 'alex.chen@example.com',
    displayName: 'Alex Chen',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'America/New_York',
    totalHabits: 8,
    activeStreaks: 6,
    createdAt: '2026-02-14T11:20:00Z',
  },
  {
    id: 'usr-003',
    email: 'jordan.taylor@example.com',
    displayName: 'Jordan Taylor',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'Europe/London',
    totalHabits: 5,
    activeStreaks: 4,
    createdAt: '2026-03-01T15:45:00Z',
  },
  {
    id: 'usr-004',
    email: 'morgan.smith@spamdomain.xyz',
    displayName: 'Spam Bot 4000',
    role: 'USER',
    status: 'SUSPENDED',
    timezone: 'UTC',
    totalHabits: 0,
    activeStreaks: 0,
    createdAt: '2026-04-12T02:11:00Z',
  },
  {
    id: 'usr-005',
    email: 'elena.rostova@techcorp.io',
    displayName: 'Elena Rostova',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'Europe/Berlin',
    totalHabits: 11,
    activeStreaks: 9,
    createdAt: '2026-05-20T09:12:00Z',
  },
  {
    id: 'usr-006',
    email: 'marcus.vance@outreach.org',
    displayName: 'Marcus Vance',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'America/Los_Angeles',
    totalHabits: 4,
    activeStreaks: 3,
    createdAt: '2026-06-08T18:30:00Z',
  },
  {
    id: 'usr-007',
    email: 'priya.sharma@innovate.co.in',
    displayName: 'Priya Sharma',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
    totalHabits: 9,
    activeStreaks: 7,
    createdAt: '2026-07-01T04:15:00Z',
  },
  {
    id: 'usr-008',
    email: 'david.kim@financeflow.net',
    displayName: 'David Kim',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'Asia/Seoul',
    totalHabits: 6,
    activeStreaks: 2,
    createdAt: '2026-08-11T12:00:00Z',
  },
  {
    id: 'usr-009',
    email: 'chloe.dubois@creative.fr',
    displayName: 'Chloé Dubois',
    role: 'USER',
    status: 'ACTIVE',
    timezone: 'Europe/Paris',
    totalHabits: 7,
    activeStreaks: 5,
    createdAt: '2026-09-03T16:20:00Z',
  },
  {
    id: 'usr-010',
    email: 'hacker.attempt@invalidsite.com',
    displayName: 'Brute Script',
    role: 'USER',
    status: 'SUSPENDED',
    timezone: 'UTC',
    totalHabits: 1,
    activeStreaks: 0,
    createdAt: '2026-10-18T23:59:00Z',
  },
];

let mockTemplates: HabitTemplate[] = [
  {
    id: 'tpl-001',
    title: 'Morning Miracle Routine',
    description: 'Start your morning with 10 mins meditation, hydration, and light stretching.',
    categoryId: 'cat-4',
    frequencyType: 'DAILY',
    targetType: 'BOOLEAN',
    icon: 'sun',
    color: '#F59E0B',
    isPublished: true,
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'tpl-002',
    title: 'Daily Hydration (2000ml)',
    description: 'Maintain optimal cellular hydration by consuming at least 2 liters of water daily.',
    categoryId: 'cat-1',
    frequencyType: 'DAILY',
    targetType: 'NUMERIC',
    targetValue: 2000,
    unit: 'ml',
    icon: 'droplet',
    color: '#06B6D4',
    isPublished: true,
    createdAt: '2026-02-05T10:30:00Z',
  },
  {
    id: 'tpl-003',
    title: 'Deep Work Sprint (60m)',
    description: 'Uninterrupted cognitive focus on primary objective with notifications silenced.',
    categoryId: 'cat-3',
    frequencyType: 'WEEKLY_DAYS',
    frequencyPayload: [1, 2, 3, 4, 5],
    targetType: 'NUMERIC',
    targetValue: 60,
    unit: 'minutes',
    icon: 'zap',
    color: '#3B82F6',
    isPublished: true,
    createdAt: '2026-02-10T14:15:00Z',
  },
  {
    id: 'tpl-004',
    title: 'Couch to 5K Fitness Jog',
    description: 'Progressive aerobic conditioning 3 days per week to build cardiovascular endurance.',
    categoryId: 'cat-2',
    frequencyType: 'WEEKLY_DAYS',
    frequencyPayload: [1, 3, 5],
    targetType: 'NUMERIC',
    targetValue: 5,
    unit: 'km',
    icon: 'activity',
    color: '#10B981',
    isPublished: true,
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'tpl-005',
    title: 'Daily Technical Reading',
    description: 'Read at least 15 pages of architectural or engineering literature every day.',
    categoryId: 'cat-5',
    frequencyType: 'DAILY',
    targetType: 'NUMERIC',
    targetValue: 15,
    unit: 'pages',
    icon: 'book-open',
    color: '#8B5CF6',
    isPublished: false,
    createdAt: '2026-03-15T11:00:00Z',
  },
];

let mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    actorId: 'usr-admin-001',
    actorEmail: 'admin@habit-tracker.internal',
    action: 'USER_SUSPENDED',
    entityType: 'USER',
    entityId: 'usr-004',
    details: { reason: 'Automated spam bot pattern detected across API endpoints.' },
    ipAddress: '192.168.1.10',
    createdAt: '2026-11-20T14:32:00Z',
  },
  {
    id: 'audit-002',
    actorId: 'usr-admin-001',
    actorEmail: 'admin@habit-tracker.internal',
    action: 'TEMPLATE_CREATED',
    entityType: 'HABIT_TEMPLATE',
    entityId: 'tpl-004',
    details: { title: 'Couch to 5K Fitness Jog', targetValue: 5, unit: 'km' },
    ipAddress: '192.168.1.10',
    createdAt: '2026-11-19T10:15:20Z',
  },
  {
    id: 'audit-003',
    actorId: 'usr-admin-001',
    actorEmail: 'admin@habit-tracker.internal',
    action: 'USER_SUSPENDED',
    entityType: 'USER',
    entityId: 'usr-010',
    details: { reason: 'Credential stuffing attempt flagged by security sentinel.' },
    ipAddress: '192.168.1.10',
    createdAt: '2026-11-18T18:40:11Z',
  },
  {
    id: 'audit-004',
    actorId: 'usr-admin-001',
    actorEmail: 'admin@habit-tracker.internal',
    action: 'TEMPLATE_UPDATED',
    entityType: 'HABIT_TEMPLATE',
    entityId: 'tpl-001',
    details: { changes: { isPublished: true, frequencyType: 'DAILY' } },
    ipAddress: '192.168.1.10',
    createdAt: '2026-11-17T09:22:04Z',
  },
  {
    id: 'audit-005',
    actorId: 'usr-admin-001',
    actorEmail: 'admin@habit-tracker.internal',
    action: 'SYSTEM_SETTINGS_UPDATE',
    entityType: 'SYSTEM_CONFIG',
    entityId: 'RATE_LIMIT_GLOBAL',
    details: { maxRequests: 1000, windowMinutes: 15 },
    ipAddress: '192.168.1.10',
    createdAt: '2026-11-16T12:05:00Z',
  },
];

// Helper for dates in past
const generatePastDates = (days: number) => {
  const result: Array<{ date: string; newUsers: number; completions: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      newUsers: 180 + Math.floor(Math.sin(i * 0.8) * 60) + (i % 3 === 0 ? 40 : 10),
      completions: 18500 + Math.floor(Math.sin(i * 0.6) * 4500) + i * 250,
    });
  }
  return result;
};

const pastTrendData = generatePastDates(14);

export const mockDashboardData: AdminDashboardData = {
  totalUsers: 15420,
  dau: 4820,
  mau: 12300,
  totalActiveHabits: 38900,
  completionsToday: 24150,
  platformCompletionRate: 76.5,
  signupTrends: pastTrendData.map((d) => ({ date: d.date, newUsers: d.newUsers })),
  completionVelocityTrends: pastTrendData.map((d) => ({ date: d.date, completions: d.completions })),
};

// ---------------- API CLIENT CLASS ----------------
class AdminApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  /**
   * Safe fetch with fallback to mock data if backend server is unreachable.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackFn?: () => T
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        // If HTTP error code like 401/403/400 from actual backend, throw detailed error
        if (response.status === 401 || response.status === 403) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Request failed with status ${response.status}`);
        }
        // If server error or endpoint not implemented yet on backend, fallback
        if (fallbackFn) {
          return fallbackFn();
        }
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const json = await response.json();
      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      if (fallbackFn) {
        // Connection refused / Network failure fallback
        console.warn(`[API Client] Network fetch failed for ${endpoint}, using mock fallback:`, err.message);
        return fallbackFn();
      }
      throw err;
    }
  }

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      () => {
        // Mock verification
        if (email.toLowerCase().includes('admin') || password === 'AdminPass123!') {
          const user: User = {
            id: 'usr-admin-001',
            email: email,
            displayName: 'Global Administrator',
            role: 'ADMIN',
            status: 'ACTIVE',
            timezone: 'UTC',
            createdAt: '2026-01-10T08:00:00Z',
          };
          const token = `mock-admin-jwt-token-${Date.now()}`;
          return { user, token };
        }
        throw new Error('Invalid credentials. For preview mode, use any email containing "admin" and password "AdminPass123!".');
      }
    );
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me', { method: 'GET' }, () => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      return mockUsers[0];
    });
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<AdminDashboardData> {
    return this.request('/admin/dashboard', { method: 'GET' }, () => {
      return {
        ...mockDashboardData,
        totalUsers: mockUsers.length + 15410,
      };
    });
  }

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ users: AdminUser[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);

    return this.request(`/admin/users?${query.toString()}`, { method: 'GET' }, () => {
      let filtered = [...mockUsers];
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.displayName.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            u.id.toLowerCase().includes(s)
        );
      }
      if (params.status && params.status !== 'ALL') {
        filtered = filtered.filter((u) => u.status === params.status);
      }
      const page = params.page || 1;
      const limit = params.limit || 10;
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      return {
        users: paginated,
        meta: { page, limit, total },
      };
    });
  }

  async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/admin/users/${userId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      },
      () => {
        const user = mockUsers.find((u) => u.id === userId);
        if (user) {
          user.status = status;
          // Record audit log entry
          const auditEntry: AuditLogEntry = {
            id: `audit-${Date.now()}`,
            actorId: 'usr-admin-001',
            actorEmail: 'admin@habit-tracker.internal',
            action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
            entityType: 'USER',
            entityId: userId,
            details: { reason, previousStatus: status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' },
            ipAddress: '192.168.1.10',
            createdAt: new Date().toISOString(),
          };
          mockAuditLogs.unshift(auditEntry);
        }
        return { success: true, message: `User status successfully updated to ${status}.` };
      }
    );
  }

  // Template Management
  async getCategories(): Promise<Category[]> {
    return this.request('/categories', { method: 'GET' }, () => INITIAL_CATEGORIES);
  }

  async getTemplates(): Promise<HabitTemplate[]> {
    return this.request('/templates', { method: 'GET' }, () => [...mockTemplates]);
  }

  async createTemplate(data: CreateTemplateRequest): Promise<HabitTemplate> {
    return this.request(
      '/admin/templates',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      () => {
        const newTemplate: HabitTemplate = {
          id: `tpl-${Date.now().toString().slice(-4)}`,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          frequencyType: data.frequencyType,
          frequencyPayload: data.frequencyPayload || null,
          targetType: data.targetType,
          targetValue: data.targetValue ?? null,
          unit: data.unit ?? null,
          icon: data.icon || 'check-circle',
          color: data.color || '#3B82F6',
          isPublished: data.isPublished !== undefined ? data.isPublished : true,
          createdAt: new Date().toISOString(),
        };
        mockTemplates.unshift(newTemplate);

        // Audit log
        mockAuditLogs.unshift({
          id: `audit-${Date.now()}`,
          actorId: 'usr-admin-001',
          actorEmail: 'admin@habit-tracker.internal',
          action: 'TEMPLATE_CREATED',
          entityType: 'HABIT_TEMPLATE',
          entityId: newTemplate.id,
          details: { title: newTemplate.title, isPublished: newTemplate.isPublished },
          ipAddress: '192.168.1.10',
          createdAt: new Date().toISOString(),
        });

        return newTemplate;
      }
    );
  }

  async updateTemplate(id: string, data: Partial<CreateTemplateRequest>): Promise<HabitTemplate> {
    return this.request(
      `/admin/templates/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      () => {
        const idx = mockTemplates.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error('Template not found');
        const existing = mockTemplates[idx];
        const updated: HabitTemplate = {
          ...existing,
          ...data,
          targetValue: data.targetValue !== undefined ? data.targetValue : existing.targetValue,
          unit: data.unit !== undefined ? data.unit : existing.unit,
        };
        mockTemplates[idx] = updated;

        mockAuditLogs.unshift({
          id: `audit-${Date.now()}`,
          actorId: 'usr-admin-001',
          actorEmail: 'admin@habit-tracker.internal',
          action: 'TEMPLATE_UPDATED',
          entityType: 'HABIT_TEMPLATE',
          entityId: id,
          details: { updatedFields: Object.keys(data) },
          ipAddress: '192.168.1.10',
          createdAt: new Date().toISOString(),
        });

        return updated;
      }
    );
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/admin/templates/${id}`,
      { method: 'DELETE' },
      () => {
        const tpl = mockTemplates.find((t) => t.id === id);
        mockTemplates = mockTemplates.filter((t) => t.id !== id);
        if (tpl) {
          mockAuditLogs.unshift({
            id: `audit-${Date.now()}`,
            actorId: 'usr-admin-001',
            actorEmail: 'admin@habit-tracker.internal',
            action: 'TEMPLATE_DELETED',
            entityType: 'HABIT_TEMPLATE',
            entityId: id,
            details: { title: tpl.title },
            ipAddress: '192.168.1.10',
            createdAt: new Date().toISOString(),
          });
        }
        return { success: true, message: 'Habit template deleted successfully.' };
      }
    );
  }

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    actorId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: AuditLogEntry[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.actorId) query.set('actorId', params.actorId);
    if (params.action && params.action !== 'ALL') query.set('action', params.action);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    return this.request(`/admin/audit-logs?${query.toString()}`, { method: 'GET' }, () => {
      let filtered = [...mockAuditLogs];
      if (params.action && params.action !== 'ALL') {
        filtered = filtered.filter((log) => log.action === params.action);
      }
      if (params.actorId) {
        const actorFilter = params.actorId.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.actorEmail.toLowerCase().includes(actorFilter) ||
            log.actorId.toLowerCase().includes(actorFilter)
        );
      }
      if (params.startDate) {
        filtered = filtered.filter((log) => log.createdAt >= params.startDate!);
      }
      if (params.endDate) {
        filtered = filtered.filter((log) => log.createdAt <= params.endDate! + 'T23:59:59Z');
      }

      const page = params.page || 1;
      const limit = params.limit || 15;
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        logs: paginated,
        meta: { page, limit, total },
      };
    });
  }
}

export const api = new AdminApiClient();
