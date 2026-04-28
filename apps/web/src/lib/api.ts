import type {
  AuthResponse,
  Category,
  MenuItem,
  Order,
  OrderStats,
  OrderStatus,
  PublicMenuResponse,
  Restaurant,
  User,
} from '@menu-gen/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'menu-gen:token';

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(t: string) {
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, t);
  },
  clear() {
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };
  if (auth) {
    const token = tokenStore.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText, data?.details);
  }
  return data as T;
}

export const api = {
  // auth
  register: (body: { name: string; email: string; password: string; restaurantName: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body, auth: false }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body, auth: false }),
  me: () => request<{ user: User }>('/api/auth/me'),

  // restaurant
  getMyRestaurant: () => request<{ restaurant: Restaurant }>('/api/restaurant/me'),
  updateMyRestaurant: (body: Partial<Restaurant>) =>
    request<{ restaurant: Restaurant }>('/api/restaurant/me', { method: 'PATCH', body }),

  // categories
  listCategories: () => request<{ categories: Category[] }>('/api/categories'),
  createCategory: (body: { name: string; sortOrder?: number }) =>
    request<{ category: Category }>('/api/categories', { method: 'POST', body }),
  updateCategory: (id: string, body: { name?: string; sortOrder?: number }) =>
    request<{ category: Category }>(`/api/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id: string) =>
    request<void>(`/api/categories/${id}`, { method: 'DELETE' }),

  // items
  listItems: () => request<{ items: MenuItem[] }>('/api/items'),
  createItem: (body: Partial<MenuItem> & { category: string; name: string; price: number }) =>
    request<{ item: MenuItem }>('/api/items', { method: 'POST', body }),
  updateItem: (id: string, body: Partial<MenuItem>) =>
    request<{ item: MenuItem }>(`/api/items/${id}`, { method: 'PATCH', body }),
  deleteItem: (id: string) => request<void>(`/api/items/${id}`, { method: 'DELETE' }),

  // qr
  getQr: () => request<{ url: string; dataUrl: string }>('/api/qr'),
  qrPngUrl: () => `${API_URL}/api/qr/download.png`,
  qrSvgUrl: () => `${API_URL}/api/qr/download.svg`,

  // uploads
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const token = tokenStore.get();
    const res = await fetch(`${API_URL}/api/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new ApiError(res.status, data?.message ?? res.statusText);
    return data as { url: string };
  },

  // public (server-fetched)
  publicMenu: (slug: string) =>
    request<PublicMenuResponse>(`/api/public/menu/${encodeURIComponent(slug)}`, { auth: false }),

  // orders (owner)
  listOrders: (status?: string) =>
    request<{ orders: Order[] }>(
      `/api/orders${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`
    ),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/api/orders/${id}`, { method: 'PATCH', body: { status } }),
  getOrderStats: () => request<{ stats: OrderStats }>('/api/orders/stats'),

  // orders (customer)
  createOrder: (body: {
    restaurantSlug: string;
    table: string;
    items: Array<{
      menuItem: string;
      quantity: number;
      notes?: string;
      selectedModifiers?: Array<{ groupId: string; optionId: string }>;
    }>;
    customerNote?: string;
  }) =>
    request<{ order: Order }>('/api/public/orders', {
      method: 'POST',
      body,
      auth: false,
    }),
};

export const PUBLIC_API_URL = API_URL;
