const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") ?? sessionStorage.getItem("token");
}

export function saveToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem("token", token);
    sessionStorage.removeItem("token");
  } else {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
}

export function clearToken() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const api = {
  login(email: string, password: string) {
    return request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register(email: string, password: string) {
    return request<{ id: number; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<{ id: number; email: string; roles: string[]; is_suspended: boolean }>("/auth/me");
  },
  logout() {
    return request<{ status: string }>("/auth/logout", { method: "POST" });
  },
  verifyEmail(token: string) {
    return request<{ status: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  forgotPassword(email: string) {
    return request<{ status: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(token: string, new_password: string) {
    return request<{ status: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  },

  // Templates
  getTemplates() {
    return request<Template[]>("/templates");
  },
  getTemplate(id: number) {
    return request<Template>(`/templates/${id}`);
  },
  createTemplate(data: { name: string; description?: string; content: string }) {
    return request<Template>("/templates", { method: "POST", body: JSON.stringify(data) });
  },
  updateTemplate(id: number, data: Partial<{ name: string; description: string; content: string }>) {
    return request<Template>(`/templates/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  duplicateTemplate(id: number) {
    return request<Template>(`/templates/${id}/duplicate`, { method: "POST" });
  },
  activateTemplate(id: number) {
    return request<Template>(`/templates/${id}/activate`, { method: "PATCH" });
  },
  archiveTemplate(id: number) {
    return request<Template>(`/templates/${id}/archive`, { method: "PATCH" });
  },
  deleteTemplate(id: number) {
    return request<Template>(`/templates/${id}`, { method: "DELETE" });
  },
  getSubmissions(templateId: number) {
    return request<Submission[]>(`/templates/${templateId}/submissions`);
  },

  // Links
  createLink(data: { template_id: number; expires_in_hours: number; prefill?: Record<string, string> }) {
    return request<PublicLink>("/links", { method: "POST", body: JSON.stringify(data) });
  },
  getLinks(templateId: number) {
    return request<PublicLink[]>(`/links/template/${templateId}`);
  },
  revokeLink(linkId: number) {
    return request<PublicLink>(`/links/${linkId}`, { method: "DELETE" });
  },

  // Submissions
  getAllSubmissions() {
    return request<SubmissionListItem[]>("/contracts/submissions");
  },
  getSubmission(id: number) {
    return request<Submission>(`/contracts/submissions/${id}`);
  },
  confirmSubmission(id: number) {
    return request<Submission>(`/contracts/submissions/${id}/confirm`, { method: "POST" });
  },
  cancelSubmission(id: number) {
    return request<Submission>(`/contracts/submissions/${id}/cancel`, { method: "POST" });
  },
  completeSubmission(id: number) {
    return request<Submission>(`/contracts/submissions/${id}/complete`, { method: "POST" });
  },
  getSubmissionHtml(id: number) {
    return request<{ html: string }>(`/contracts/submissions/${id}/document`);
  },

  // Contacts
  getContacts() {
    return request<Contact[]>("/contacts");
  },
  createContact(data: { name?: string; email?: string; phone?: string; address?: string }) {
    return request<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) });
  },
  updateContact(id: number, data: Partial<{ name: string; email: string; phone: string; address: string }>) {
    return request<Contact>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteContact(id: number) {
    return request<void>(`/contacts/${id}`, { method: "DELETE" });
  },

  // Admin
  adminStats() {
    return request<AdminStats>("/admin/stats");
  },
  adminUsers() {
    return request<AdminUser[]>("/admin/users");
  },
  adminTemplates() {
    return request<AdminTemplate[]>("/admin/templates");
  },
  adminSubmissions() {
    return request<AdminSubmission[]>("/admin/submissions");
  },
  adminToggleSuspend(id: number) {
    return request<{ id: number; is_suspended: boolean }>(`/admin/users/${id}/suspend`, { method: "PATCH" });
  },
  adminDeleteUser(id: number) {
    return request<{ status: string }>(`/admin/users/${id}`, { method: "DELETE" });
  },
  adminVerifyUser(id: number) {
    return request<{ id: number; is_verified: boolean; is_suspended: boolean }>(`/admin/users/${id}/verify`, { method: "PATCH" });
  },
  adminAnalyticsSubmissions(days: number) {
    return request<ChartPoint[]>(`/admin/analytics/submissions?days=${days}`);
  },
  adminAnalyticsUserGrowth(days: number) {
    return request<ChartPoint[]>(`/admin/analytics/user-growth?days=${days}`);
  },
  adminAnalyticsActiveUsers(days: number) {
    return request<ChartPoint[]>(`/admin/analytics/active-users?days=${days}`);
  },

  // Profile
  getProfile() {
    return request<Profile>("/profile");
  },
  updateProfile(data: Partial<{ profile_name: string; company_name: string; company_code: string; address: string; phone_number: string }>) {
    return request<Profile>("/profile", { method: "PUT", body: JSON.stringify(data) });
  },
};

// Types
export type Template = {
  id: number;
  name: string;
  description: string | null;
  content: string;
  status: "draft" | "active" | "archived";
};

export type SubmissionListItem = {
  id: number;
  template_id: number;
  template_name: string;
  submitted_data: Record<string, string>;
  status: "submitted" | "confirmed" | "completed" | "cancelled";
  submitted_at: string;
  confirmed_at: string | null;
  submitter_email: string | null;
};

export type Submission = {
  id: number;
  template_id: number;
  template_version: number;
  link_id: number;
  submitted_data: Record<string, string>;
  rendered_content: string;
  status: "submitted" | "confirmed" | "completed" | "cancelled";
  submitted_at: string;
  confirmed_at: string | null;
  ip_address: string;
  user_agent: string | null;
  signature_image: string | null;
  submission_hash: string;
  submitter_email: string | null;
};

export type PublicLink = {
  id: number;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
};

export type Contact = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type ChartPoint = {
  date: string;
  count: number;
};

export type AdminStats = {
  total_users: number;
  total_templates: number;
  total_submissions: number;
  confirmed_submissions: number;
};

export type AdminUser = {
  id: number;
  email: string;
  is_verified: boolean;
  is_suspended: boolean;
  roles: string[];
  last_login: string | null;
  created_at: string | null;
  template_count: number;
};

export type AdminTemplate = {
  id: number;
  name: string;
  status: string;
  owner_email: string | null;
  owner_id: number;
};

export type AdminSubmission = {
  id: number;
  status: string;
  submitter_email: string | null;
  submitted_at: string;
  confirmed_at: string | null;
  template_id: number;
  template_name: string | null;
  owner_email: string | null;
};

export type Profile = {
  user_id: number;
  email: string;
  profile_name: string | null;
  company_name: string | null;
  company_code: string | null;
  address: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};
