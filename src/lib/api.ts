// Brauzer həmişə relative /api/* istifadə edir — Next.js proxy backend-ə yönləndirir.
// Bu CORS və DNS (api.easysteperp.com) problemlərini aradan qaldırır.
export function getApiBase(): string {
  if (typeof window === "undefined") return "";
  return ""; // relative URL = proxy vasitəsilə
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

function setTokens(access: string, refresh: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  }
}

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
  skipAuth?: boolean;
  _retrying?: boolean;
};

const FETCH_TIMEOUT_MS = 12000;

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  try {
    const { params, skipAuth, _retrying, ...init } = options;
    const base = getApiBase();
    let url = path.startsWith("http") ? path : `${base}${path}`;
    if (params) {
      const search = new URLSearchParams(params).toString();
      url += (url.includes("?") ? "&" : "?") + search;
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1") {
      headers["X-Debug"] = "1";
    }
    if (!skipAuth) {
      const token = getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { ...init, headers, signal: controller.signal }).finally(() =>
      clearTimeout(timeoutId)
    );
    if (res.status === 401 && !skipAuth && !_retrying) {
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const refreshRes = await fetch(`${getApiBase()}/api/auth/refresh`, {
            method: "POST",
            body: JSON.stringify({ refreshToken: refresh }),
            headers: { "Content-Type": "application/json" },
          });
          const tok = await refreshRes.json() as { accessToken?: string; refreshToken?: string };
          if (tok.accessToken && tok.refreshToken) {
            setTokens(tok.accessToken, tok.refreshToken);
            return apiFetch<T>(path, { ...options, _retrying: true });
          }
        } catch {
          // refresh failed
        }
      }
    }
    const text = await res.text();
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const body = JSON.parse(text) as { message?: string; detail?: string; error?: string; title?: string; inner?: string };
        msg = body.message || body.detail || body.error || body.title || msg;
        if (body.error) msg += ` [${body.error}]`;
        if (body.inner) msg += ` (${body.inner})`;
      } catch {
        if (text && text.length < 300) msg = text.replace(/<[^>]*>/g, "").trim().slice(0, 200);
      }
      const fallback = `API xətası (${res.status})`;
      throw new Error((msg && msg.trim()) || fallback);
    }
    if (!text || text.trim() === "") return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Bağlantı xətası - internet bağlantınızı yoxlayın");
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ accessToken?: string; refreshToken?: string; expiresIn?: number; requires2FA?: boolean; pendingToken?: string; message?: string; viaEmail?: boolean }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }), skipAuth: true }
      ),
    complete2FA: (pendingToken: string, code: string) =>
      apiFetch<{ accessToken: string; refreshToken: string; expiresIn: number }>("/api/auth/2fa/complete", {
        method: "POST",
        body: JSON.stringify({ pendingToken, code }),
        skipAuth: true,
      }),
    twoFactorSetup: (viaEmail?: boolean) =>
      apiFetch<{ secret?: string; qrCodeUrl?: string; message: string; viaEmail?: boolean }>("/api/auth/2fa/setup", {
        method: "POST",
        body: JSON.stringify({ viaEmail: viaEmail ?? false }),
      }),
    twoFactorRequestEmailOtp: (pendingToken: string) =>
      apiFetch<{ message: string }>("/api/auth/2fa/request-email-otp", {
        method: "POST",
        body: JSON.stringify({ pendingToken }),
        skipAuth: true,
      }),
    twoFactorSendDisableOtp: () =>
      apiFetch<{ message: string }>("/api/auth/2fa/send-disable-otp", { method: "POST" }),
    twoFactorVerify: (code: string) =>
      apiFetch<{ message: string }>("/api/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    twoFactorDisable: (password: string, code: string) =>
      apiFetch<{ message: string }>("/api/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ password, code }),
      }),
    register: (data: {
      email: string;
      password: string;
      companyName: string;
      contactPerson: string;
      taxId?: string;
      country?: string;
      city?: string;
      acceptTerms: boolean;
    }) => apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data), skipAuth: true }),
    refresh: (refreshToken: string) =>
      apiFetch<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      }),
    forgotPassword: (email: string) =>
      apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      }),
    logout: () =>
      apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),
    resetPassword: (token: string, newPassword: string) =>
      apiFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
        skipAuth: true,
      }),
    verifyEmail: (token: string) =>
      apiFetch<{ message: string }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
        skipAuth: true,
      }),
  },
  contact: {
    submit: (data: { name: string; email: string; message: string }) =>
      apiFetch<{ message: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      }),
  },
  tickets: {
    list: () => apiFetch<{ id: string; subject: string; status: string; date: string }[]>("/api/support"),
    create: (subject: string, body: string) =>
      apiFetch<{ id: string; message: string }>("/api/support", {
        method: "POST",
        body: JSON.stringify({ subject, body }),
      }),
  },
  academy: () =>
    apiFetch<{ youtubePlaylistId: string }>("/api/content/academy"),
  plans: () => apiFetch<{ id: string; name: string; price: number }[]>("/api/plans", { skipAuth: true }),
  content: {
    site: () => apiFetch<Record<string, unknown>>("/api/content/site", { skipAuth: true }),
  },
  health: () => apiFetch<{ status: string }>("/api/health", { skipAuth: true }),
  dashboard: () =>
    apiFetch<{
      plan: { name: string; endDate: string };
      daysLeft: number;
      status: string;
      autoRenew: boolean;
    }>("/api/dashboard"),
  checkout: (planId: string) =>
    apiFetch<{ paymentUrl: string; orderId: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  billing: () =>
    apiFetch<{
      plan: { name: string; price: number; currency: string; endDate: string } | null;
      autoRenew: boolean;
      payments: { id: string; date: string; amount: number; currency: string; status: string; trxId: string | null; invoiceNumber?: string | null }[];
    }>("/api/billing"),
  receiptUrl: (paymentId: string) => `/cabinet/billing/receipt/${paymentId}`,
  downloadUrl: (releaseId: string) =>
    apiFetch<{ url: string; expiresIn: number }>(`/api/downloads/${releaseId}/url`),
  downloads: () =>
    apiFetch<
      { id: string; version: string; fileUrl: string; sha256: string | null; notes: string | null; isLatest: boolean; publishedAt: string }[]
    >("/api/downloads"),
  licenses: () =>
    apiFetch<{
      activeDevices: number;
      maxDevices: number;
      devices: { id: string; name: string; lastSeen: string; fingerprint: string; status: number }[];
    }>("/api/licenses"),
  tenant: () =>
    apiFetch<{ name: string; taxId?: string; contactPerson: string; country?: string; city?: string }>("/api/settings/tenant"),
  updateTenant: (data: { name?: string; taxId?: string; contactPerson?: string; country?: string; city?: string }) =>
    apiFetch<{ message: string }>("/api/settings/tenant", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  setAutoRenew: (enabled: boolean) =>
    apiFetch<{ autoRenew: boolean }>("/api/settings/subscription/auto-renew", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  me: () => apiFetch<{ email: string; role: string; tenantId: string }>("/api/auth/me"),
  admin: {
    stats: () =>
      apiFetch<{ totalTenants: number; activeSubscriptions: number; revenueThisMonth: number; openTickets: number }>(
        "/api/admin/stats"
      ),
    audit: () => apiFetch<{ id: string; action: string; actor: string; ipAddress: string | null; date: string }[]>("/api/admin/audit"),
    tickets: () => apiFetch<{ id: string; subject: string; body: string; status: string; date: string; tenantName: string }[]>("/api/admin/tickets"),
    ticket: (ticketId: string) =>
      apiFetch<{ id: string; subject: string; body: string; status: string; date: string; tenantName: string }>(
        `/api/admin/tickets/${ticketId}`
      ),
    updateTicketStatus: (ticketId: string, status: string) =>
      apiFetch<{ status: string; message: string }>(`/api/admin/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    contacts: () => apiFetch<{ id: string; name: string; email: string; message: string; date: string }[]>("/api/admin/contacts"),
    tenants: () => apiFetch<{ id: string; name: string; contactPerson: string; createdAt: string; subscription: { planName: string; status: string; endDate: string } | null }[]>("/api/admin/tenants"),
    payments: () => apiFetch<{ id: string; date: string; tenantName: string; amount: number; currency: string; status: string; provider: string; transactionId: string | null }[]>("/api/admin/payments"),
    extendSubscription: (tenantId: string, months?: number, planId?: string) =>
      apiFetch<{ message: string }>(`/api/admin/tenants/${tenantId}/extend`, {
        method: "POST",
        body: JSON.stringify({ months: months ?? 0, planId: planId ?? null }),
      }),
    plans: () =>
      apiFetch<{ id: string; name: string; durationMonths: number; price: number; currency: string; maxDevices: number | null; isActive: boolean; createdAt: string }[]>(
        "/api/admin/plans"
      ),
    createPlan: (data: { name: string; durationMonths: number; price: number; currency?: string; maxDevices?: number }) =>
      apiFetch<{ id: string; message: string }>("/api/admin/plans", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updatePlan: (planId: string, data: { name?: string; durationMonths?: number; price?: number; currency?: string; maxDevices?: number; isActive?: boolean }) =>
      apiFetch<{ message: string }>(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deletePlan: (planId: string) =>
      apiFetch<{ message: string }>(`/api/admin/plans/${planId}`, { method: "DELETE" }),
    siteContent: {
      list: () =>
        apiFetch<{ key: string; value: string; updatedAt: string }[]>("/api/admin/site-content"),
      upsert: (key: string, value: unknown) =>
        apiFetch<{ message: string }>(`/api/admin/site-content/${encodeURIComponent(key)}`, {
          method: "PUT",
          body: JSON.stringify(value),
        }),
    },
  },
  revokeDevice: (deviceId: string) =>
    apiFetch<{ message: string }>("/api/license/revoke-device", {
      method: "POST",
      body: JSON.stringify({ deviceId }),
    }),
};
