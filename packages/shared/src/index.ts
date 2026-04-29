export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  owner: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  currency: string;
  themeColor: string;
  address?: string;
  phone?: string;
  instagram?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  restaurant: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  available: boolean;
}

export type ModifierSelectionType = 'single' | 'multiple';

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: ModifierSelectionType;
  required: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  restaurant: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  tags: string[];
  allergens: string[];
  modifierGroups: ModifierGroup[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface PublicMenuResponse {
  restaurant: Restaurant;
  categories: Array<
    Category & {
      items: MenuItem[];
    }
  >;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItemLine {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedModifiers?: SelectedModifier[];
}

export interface Order {
  id: string;
  restaurant: string;
  table: string;
  items: OrderItemLine[];
  subtotal: number;
  status: OrderStatus;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatsBucket {
  orders: number;
  revenue: number;
  averageOrderValue: number;
}

export interface OrderStatusBreakdown {
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
}

export interface OrderTimePoint {
  /** Bucket start, ISO string. */
  at: string;
  orders: number;
  revenue: number;
}

export interface OrderStats {
  today: OrderStatsBucket;
  thisWeek: OrderStatsBucket;
  thisMonth: OrderStatsBucket;
  pending: number;
  statusCounts: OrderStatusBreakdown;
  /** 24 buckets, one per hour of "today" in server time. */
  hourlyToday: OrderTimePoint[];
  /** Last 14 days inclusive of today. */
  daily: OrderTimePoint[];
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  /** Average minutes between createdAt and the moment status reached `ready`/`completed`. Null if no completed orders yet. */
  avgPrepTimeMinutes: number | null;
}
