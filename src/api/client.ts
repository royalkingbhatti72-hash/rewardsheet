const rawApiUrl = import.meta.env.VITE_API_URL;
const DEFAULT_PROD_URL = 'https://backend-two-lilac-79.vercel.app/api';
const API_BASE = (rawApiUrl && !rawApiUrl.includes('<') 
  ? rawApiUrl 
  : (import.meta.env.PROD ? DEFAULT_PROD_URL : 'http://localhost:5050/api')
).replace(/\/$/, '');

function getUserToken(): string | null {
  return localStorage.getItem('royal_user_token');
}

function getAdminToken(): string | null {
  return localStorage.getItem('royal_admin_token');
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isAdmin = false
): Promise<T> {
  const token = isAdmin ? getAdminToken() : getUserToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Public & Settings
  getPublicSettings: () => request('/settings/public'),
  getAnnouncements: () => request('/notifications/announcements'),

  // User Auth
  register: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  logout: () => {
    localStorage.removeItem('royal_user_token');
    return request('/auth/logout', { method: 'POST' });
  },

  // User Dashboard & Profile
  getDashboard: () => request('/user/dashboard'),
  getProfile: () => request('/user/profile'),
  updatePassword: (payload: any) => request('/user/profile/password', { method: 'PUT', body: JSON.stringify(payload) }),

  // Tasks & Levels
  getLevels: () => request('/tasks/levels'),
  getLevelTasks: (levelNumber: number) => request(`/tasks/levels/${levelNumber}`),
  getTaskDetails: (taskId: string) => request(`/tasks/${taskId}`),
  unlockTask: (taskId: string) => request(`/tasks/${taskId}/unlock`, { method: 'POST' }),
  submitTask: (taskId: string, payload: { submissionNotes: string; proofEvidence?: string }) =>
    request(`/tasks/${taskId}/submit`, { method: 'POST', body: JSON.stringify(payload) }),

  // Wallet
  getWallet: () => request('/wallet'),
  getTransactions: (page = 1, limit = 20) => request(`/wallet/transactions?page=${page}&limit=${limit}`),

  // Deposits
  getDepositInstructions: () => request('/deposits/instructions'),
  getDeposits: () => request('/deposits'),
  submitDeposit: (payload: any) => request('/deposits', { method: 'POST', body: JSON.stringify(payload) }),

  // Withdrawals
  getWithdrawals: () => request('/withdrawals'),
  submitWithdrawal: (payload: any) => request('/withdrawals', { method: 'POST', body: JSON.stringify(payload) }),

  // Spin Wheel
  getSpinStatus: () => request('/spin/status'),
  playSpin: () => request('/spin/play', { method: 'POST' }),

  // Referrals
  getReferrals: () => request('/referrals'),

  // Notifications
  getNotifications: () => request('/notifications'),
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
  updateUserStatus: (userId: string, status: string, reason?: string) =>
    request(`/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }, true),
  resetUserPassword: (userId: string, payload: any) =>
    request(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify(payload) }, true),
  adjustUserBalance: (userId: string, payload: any) =>
    request(`/admin/users/${userId}/adjust-balance`, { method: 'POST', body: JSON.stringify(payload) }, true),

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
  updateAdminSettings: (payload: any) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }, true),

  // Admin Reports & Audit
  getAdminReports: () => request('/admin/reports', {}, true),
  getAdminActivityLogs: (page = 1, limit = 30) => request(`/admin/activity-logs?page=${page}&limit=${limit}`, {}, true),
};
