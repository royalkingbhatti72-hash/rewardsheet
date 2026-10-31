const rawApiUrl = import.meta.env.VITE_API_URL;
const DEFAULT_PROD_URL = 'https://streetearn-backend.vercel.app/api';

function resolveApiBase(): string {
  if (rawApiUrl && !rawApiUrl.includes('<')) {
    return rawApiUrl.replace(/\/$/, '');
  }
  // When running inside the Admin SPA served directly by the backend, always use same-origin relative /api
  if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/adminpanal'))) {
    return '/api';
  }
  if (import.meta.env.PROD) {
    return DEFAULT_PROD_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    return `${window.location.protocol}//${window.location.hostname}:5050/api`;
  }
  return 'http://localhost:5050/api';
}

const API_BASE = resolveApiBase();

function getUserToken(): string | null {
  return localStorage.getItem('royal_user_token');
}

function getAdminToken(): string | null {
  return localStorage.getItem('royal_admin_token');
}

// ----------------------------------------------------
// BROWSER CACHE SYSTEM (Memory + SessionStorage + Deduplication)
// ----------------------------------------------------
interface CacheEntry {
  data: any;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_PREFIX = 'royal_c_';

export function getCachedData<T = any>(endpoint: string): T | null {
  const now = Date.now();

  // 1. Check memory cache first (0ms)
  const mem = memoryCache.get(endpoint);
  if (mem) {
    if (mem.expiry > now) {
      return mem.data as T;
    }
    memoryCache.delete(endpoint);
  }

  // 2. Check browser sessionStorage
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${endpoint}`);
    if (raw) {
      const parsed: CacheEntry = JSON.parse(raw);
      if (parsed.expiry > now) {
        memoryCache.set(endpoint, parsed);
        return parsed.data as T;
      }
      sessionStorage.removeItem(`${CACHE_PREFIX}${endpoint}`);
    }
  } catch {
    // SessionStorage disabled or restricted
  }

  return null;
}

export function setCachedData(endpoint: string, data: any, ttlMs: number): void {
  const expiry = Date.now() + ttlMs;
  const entry: CacheEntry = { data, expiry };

  // Write memory cache
  memoryCache.set(endpoint, entry);

  // Write browser sessionStorage
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${endpoint}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded or private browsing
  }
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
    try {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith(CACHE_PREFIX)) {
          sessionStorage.removeItem(k);
        }
      }
    } catch {}
    return;
  }

  // Selective invalidation
  for (const k of Array.from(memoryCache.keys())) {
    if (k.includes(pattern)) {
      memoryCache.delete(k);
    }
  }

  try {
    const keys = Object.keys(sessionStorage);
    for (const k of keys) {
      if (k.startsWith(CACHE_PREFIX) && k.includes(pattern)) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {}
}

function getTtlForEndpoint(endpoint: string): number {
  if (endpoint.startsWith('/settings/public')) return 15 * 1000; // 15 sec for instant maintenance response
  if (endpoint.startsWith('/notifications/announcements')) return 10 * 60 * 1000; // 10 min
  if (endpoint.startsWith('/tasks/levels')) return 3 * 60 * 1000; // 3 min
  if (endpoint.startsWith('/tasks/')) return 60 * 1000; // 1 min
  if (endpoint.startsWith('/user/dashboard')) return 45 * 1000; // 45 sec
  if (endpoint.startsWith('/auth/me')) return 60 * 1000; // 60 sec
  if (endpoint.startsWith('/wallet')) return 30 * 1000; // 30 sec
  if (endpoint.startsWith('/deposits')) return 30 * 1000; // 30 sec
  if (endpoint.startsWith('/withdrawals')) return 30 * 1000; // 30 sec
  if (endpoint.startsWith('/spin/status')) return 30 * 1000; // 30 sec
  if (endpoint.startsWith('/referrals')) return 60 * 1000; // 60 sec
  if (endpoint.startsWith('/notifications')) return 30 * 1000; // 30 sec
  return 30 * 1000; // Default 30s
}

export interface RequestOptions extends RequestInit {
  bypassCache?: boolean;
  ttl?: number;
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {},
  isAdmin = false
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Cache lookup for non-admin GET requests
  if (isGet && !isAdmin && !options.bypassCache) {
    const cached = getCachedData<T>(endpoint);
    if (cached !== null) {
      return cached;
    }
  }

  // Deduplicate all concurrent in-flight GET requests (both user and admin) to prevent duplicate API calls
  if (isGet && !options.bypassCache) {
    if (inFlightRequests.has(endpoint)) {
      return inFlightRequests.get(endpoint)!;
    }
  }

  const token = isAdmin ? getAdminToken() : getUserToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = (options as any).timeoutMs || (isAdmin ? 15000 : 25000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 503 && data?.maintenance) {
          window.dispatchEvent(new CustomEvent('royal_maintenance_triggered', { detail: data }));
        }
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      // Cache successful user GET responses
      if (isGet && !isAdmin) {
        const ttl = options.ttl || getTtlForEndpoint(endpoint);
        setCachedData(endpoint, data, ttl);
      } else if (!isGet) {
        // Automatic cache invalidation upon mutations
        if (endpoint.includes('/tasks') || endpoint.includes('/submit') || endpoint.includes('/unlock')) {
          invalidateCache('/tasks');
          invalidateCache('/user/dashboard');
          invalidateCache('/wallet');
          invalidateCache('/auth/me');
        } else if (endpoint.includes('/deposits')) {
          invalidateCache('/deposits');
          invalidateCache('/wallet');
          invalidateCache('/user/dashboard');
          invalidateCache('/auth/me');
        } else if (endpoint.includes('/withdrawals')) {
          invalidateCache('/withdrawals');
          invalidateCache('/wallet');
          invalidateCache('/user/dashboard');
          invalidateCache('/auth/me');
        } else if (endpoint.includes('/spin')) {
          invalidateCache('/spin');
          invalidateCache('/wallet');
          invalidateCache('/user/dashboard');
        } else if (endpoint.includes('/profile')) {
          invalidateCache('/user/profile');
          invalidateCache('/auth/me');
        } else if (endpoint.includes('/notifications')) {
          invalidateCache('/notifications');
        } else if (endpoint.includes('/auth/logout') || endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
          invalidateCache();
        }
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
      if (isGet) {
        inFlightRequests.delete(endpoint);
      }
    }
  })();

  if (isGet && !options.bypassCache) {
    inFlightRequests.set(endpoint, fetchPromise);
  }

  return fetchPromise;
}

export const api = {
  // Cache utility helpers
  getCachedData,
  setCachedData,
  invalidateCache,
  request,

  // Public & Settings
  getPublicSettings: (opts?: RequestOptions) => request('/settings/public', opts),
  getAnnouncements: (opts?: RequestOptions) => request('/notifications/announcements', opts),

  // User Auth
  register: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: (opts?: RequestOptions) => request('/auth/me', opts),
  logout: () => {
    localStorage.removeItem('royal_user_token');
    localStorage.removeItem('royal_cached_user');
    localStorage.removeItem('royal_cached_wallet');
    invalidateCache();
    return request('/auth/logout', { method: 'POST' });
  },

  // User Dashboard & Profile
  getDashboard: (opts?: RequestOptions) => request('/user/dashboard', opts),
  getProfile: (opts?: RequestOptions) => request('/user/profile', opts),
  updatePassword: (payload: any) => request('/user/profile/password', { method: 'PUT', body: JSON.stringify(payload) }),

  // Tasks & Levels
  getLevels: (opts?: RequestOptions) => request('/tasks/levels', opts),
  getLevelTasks: (levelNumber: number, opts?: RequestOptions) => request(`/tasks/levels/${levelNumber}`, opts),
  unlockLevel: async (levelNumber: number, opts?: RequestOptions) => {
    api.invalidateCache('/tasks');
    return request(`/tasks/levels/${levelNumber}`, { bypassCache: true, ...opts });
  },
  getTaskDetails: (taskId: string, opts?: RequestOptions) =>
    request(`/tasks/${taskId}`, { bypassCache: true, ...opts }),
  unlockTask: async (taskId: string) => {
    const res = await request(`/tasks/${taskId}/unlock`, { method: 'POST' });
    api.invalidateCache('/tasks');
    api.invalidateCache('/wallet');
    api.invalidateCache('/user/dashboard');
    return res;
  },
  submitTask: async (taskId: string, payload: { submissionNotes: string; proofEvidence?: string }) => {
    const res = await request(`/tasks/${taskId}/submit`, { method: 'POST', body: JSON.stringify(payload) });
    api.invalidateCache('/tasks');
    api.invalidateCache('/wallet');
    api.invalidateCache('/user/dashboard');
    return res;
  },

  // Wallet
  getWallet: (opts?: RequestOptions) => request('/wallet', opts),
  getTransactions: (page = 1, limit = 20, opts?: RequestOptions) => request(`/wallet/transactions?page=${page}&limit=${limit}`, opts),

  // Deposits
  getDepositInstructions: (opts?: RequestOptions) => request('/deposits/instructions', opts),
  getDeposits: (opts?: RequestOptions) => request('/deposits', opts),
  submitDeposit: (payload: any) => request('/deposits', { method: 'POST', body: JSON.stringify(payload) }),

  // Withdrawals
  getWithdrawals: (opts?: RequestOptions) => request('/withdrawals', opts),
  submitWithdrawal: (payload: any) => request('/withdrawals', { method: 'POST', body: JSON.stringify(payload) }),

  // Spin Wheel
  getSpinStatus: (opts?: RequestOptions) => request('/spin/status', opts),
  playSpin: () => request('/spin/play', { method: 'POST' }),

  // Referrals
  getReferrals: (opts?: RequestOptions) => request('/referrals', opts),

  // Notifications
  getNotifications: (opts?: RequestOptions) => request('/notifications', opts),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // ----------------------------------------------------
  // ADMIN API
  // ----------------------------------------------------
  adminLogin: (payload: any) => request('/admin/login', { method: 'POST', body: JSON.stringify(payload) }, true),
  adminGetMe: () => request('/admin/me', {}, true),
  adminLogout: () => {
    localStorage.removeItem('royal_admin_token');
  },
  getAdminDashboard: () => request('/admin/dashboard', {}, true),
  getAdminNotificationCounts: () => request('/admin/notifications/counts', {}, true),
  getTaskGrid: () => request('/admin/tasks/grid', {}, true),

  // Admin Users
  getAdminUsers: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return request(`/admin/users?${q.toString()}`, {}, true);
  },
  getAdminUserDetail: (userId: string) => request(`/admin/users/${userId}`, {}, true),
  getAdminUserSummary: (userId: string) => request(`/admin/users/${userId}/summary`, {}, true),
  updateUser: (userId: string, data: { name?: string; phone?: string; accountStatus?: string; reason?: string }) =>
    request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }, true),
  updateUserStatus: (userId: string, status: string, reason?: string) =>
    request(`/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }, true),
  resetUserPassword: (userId: string, payload: any) =>
    request(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify(payload) }, true),
  adjustUserBalance: (userId: string, payload: any) =>
    request(`/admin/users/${userId}/adjust-balance`, { method: 'POST', body: JSON.stringify(payload) }, true),
  adjustUserCreditPoints: (userId: string, payload: { points: number; actionType: 'ADD' | 'DEDUCT'; reason: string; notes?: string }) =>
    request(`/admin/users/${userId}/adjust-credit-points`, { method: 'POST', body: JSON.stringify(payload) }, true),

  // Admin Levels & Tasks
  getAdminLevels: () => request('/admin/levels', {}, true),
  updateAdminLevel: (levelId: string, payload: any) =>
    request(`/admin/levels/${levelId}`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  getAdminTasks: (params?: { level?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.level) q.append('level', params.level.toString());
    if (params?.search) q.append('search', params.search);
    return request(`/admin/tasks?${q.toString()}`, {}, true);
  },
  updateAdminTask: (taskId: string, payload: any) =>
    request(`/admin/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(payload) }, true),

  // Admin Submissions
  getAdminSubmissions: (params?: { status?: string; level?: number; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.level) q.append('level', params.level.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return request(`/admin/submissions?${q.toString()}`, {}, true);
  },
  reviewTaskSubmission: (submissionId: string, payload: any) =>
    request(`/admin/submissions/${submissionId}/review`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  batchReviewSubmissions: (payload: { submissionIds: string[]; action: 'APPROVE' | 'REJECT'; reviewNotes?: string; rejectionReason?: string }) =>
    request(`/admin/submissions/batch-review`, { method: 'POST', body: JSON.stringify(payload) }, true),

  // Admin Deposits
  getAdminDeposits: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return request(`/admin/deposits?${q.toString()}`, {}, true);
  },
  reviewDeposit: (depositId: string, payload: any) =>
    request(`/admin/deposits/${depositId}/review`, { method: 'PUT', body: JSON.stringify(payload) }, true),

  // Admin Withdrawals
  getAdminWithdrawals: (params?: { approvalStatus?: string; paymentStatus?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.approvalStatus) q.append('approvalStatus', params.approvalStatus);
    if (params?.paymentStatus) q.append('paymentStatus', params.paymentStatus);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return request(`/admin/withdrawals?${q.toString()}`, {}, true);
  },
  reviewWithdrawal: (withdrawalId: string, payload: any) =>
    request(`/admin/withdrawals/${withdrawalId}/review`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  payoutWithdrawal: (withdrawalId: string, payload: any) =>
    request(`/admin/withdrawals/${withdrawalId}/payout`, { method: 'PUT', body: JSON.stringify(payload) }, true),

  // Admin Spin Wheel
  getAdminSpin: () => request('/admin/spin', {}, true),
  assignSpinPrize: (payload: any) => request('/admin/spin/assign', { method: 'POST', body: JSON.stringify(payload) }, true),
  assignMilestoneSpinPrize: (entitlementId: string, payload: { assignedPrizeId: string }) =>
    request(`/admin/spin/entitlements/${entitlementId}/assign`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  createSpinPrize: (payload: any) => request('/admin/spin/prizes', { method: 'POST', body: JSON.stringify(payload) }, true),

  // Admin Referrals & Transactions
  getAdminReferrals: () => request('/admin/referrals', {}, true),
  getAdminReferralCodes: () => request('/admin/referral-codes', {}, true),
  getAdminTelegramUsers: () => request('/admin/telegram-users', {}, true),
  grantTelegramUserCodes: (chatId: string, amount: number) =>
    request(`/admin/telegram-users/${chatId}/grant`, { method: 'POST', body: JSON.stringify({ amount }) }, true),
  generateAdminReferralCodes: (payload?: { count?: number; prefix?: string }) =>
    request('/admin/referral-codes/generate', { method: 'POST', body: JSON.stringify(payload || {}) }, true),
  createAdminReferralCode: (payload: { code: string; notes?: string }) =>
    request('/admin/referral-codes/create', { method: 'POST', body: JSON.stringify(payload) }, true),
  validateReferralCode: (code: string) => request(`/auth/validate-referral/${encodeURIComponent(code)}`),
  getAdminTransactions: (params?: { type?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.append('type', params.type);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return request(`/admin/transactions?${q.toString()}`, {}, true);
  },

  // Admin Announcements & Settings
  getAdminAnnouncements: () => request('/admin/announcements', {}, true),
  createAnnouncement: (payload: any) => request('/admin/announcements', { method: 'POST', body: JSON.stringify(payload) }, true),
  deleteAnnouncement: (id: string) => request(`/admin/announcements/${id}`, { method: 'DELETE' }, true),
  getAdminSettings: () => request('/admin/settings', {}, true),
  updateAdminSettings: (payload: any) => {
    const body = Array.isArray(payload)
      ? { settings: payload }
      : payload?.settings
      ? payload
      : { settings: Object.entries(payload).map(([key, value]) => ({ key, value: String(value ?? '') })) };
    return request('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }, true);
  },

  // Admin Reports & Audit
  getAdminReports: () => request('/admin/reports', {}, true),
  getAdminActivityLogs: (page = 1, limit = 30) => request(`/admin/activity-logs?page=${page}&limit=${limit}`, {}, true),
};
