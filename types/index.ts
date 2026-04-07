// ─── LOCALES ─────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  slug: string
  address: string
  phone: string
  email: string
  latitude: number
  longitude: number
  hours_json: WeeklyHours
  image_url: string | null
  google_place_id: string | null
  country: 'CL' | 'US'
  is_active: boolean
}

export interface WeeklyHours {
  lun?: string; mar?: string; mie?: string; jue?: string
  vie?: string; sab?: string; dom?: string
}

// ─── MENÚ ────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string
  business_id: string
  name: string
  order: number
}

export interface MenuItem {
  id: string
  category_id: string
  business_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  dietary_tags: DietaryTag[]
  allergens: Allergen[]
}

export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten-free' | 'spicy' | 'halal'
export type Allergen = 'gluten' | 'nuts' | 'dairy' | 'shellfish' | 'eggs' | 'soy'

// ─── ÓRDENES ─────────────────────────────────────────────────────────────────

export interface Order {
  id: string
  order_number: string
  business_id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string | null
  delivery_latitude: number | null
  delivery_longitude: number | null
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  items_count: number
  subtotal: number
  discount_applied: number
  final_price: number
  status: OrderStatus
  payment_status: 'pending' | 'paid' | 'refunded'
  promo_id: string | null
  created_at: string
  estimated_delivery_at: string | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  menu_item?: MenuItem
  quantity: number
  unit_price: number
  special_instructions: string | null
}

export interface CartItem {
  menu_item: MenuItem
  quantity: number
  special_instructions?: string
}

// ─── RESERVAS ────────────────────────────────────────────────────────────────

export interface Reservation {
  id: string
  reservation_number: string
  business_id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  reservation_date: string
  reservation_time: string
  party_size: number
  table_preference: string | null
  special_requests: string | null
  status: ReservationStatus
  check_in_time: string | null
  created_at: string
}

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'

// ─── PROMOCIONES ─────────────────────────────────────────────────────────────

export interface Promotion {
  id: string
  title: string
  description: string | null
  discount_type: 'percent' | 'fixed_amount'
  discount_value: number
  applicable_to: 'all_orders' | 'delivery_only' | 'dine_in_only' | 'reservation_only'
  local_id: string | null
  valid_from: string
  valid_to: string
  day_of_week: number | null // 0=Sun, 1=Mon ... 6=Sat
  start_hour: number | null
  end_hour: number | null
  is_active: boolean
  usage_count: number
  created_at: string
}

// ─── SUSCRIPTORES ────────────────────────────────────────────────────────────

export interface Subscriber {
  id: string
  email: string
  first_name: string | null
  birthday: string | null
  preferred_local_id: string | null
  subscribed_at: string
  is_active: boolean
}

// ─── DELIVERY TRACKING ───────────────────────────────────────────────────────

export interface DeliveryTracking {
  id: string
  order_id: string
  status: 'assigned' | 'pickup' | 'in_transit' | 'delivered'
  driver_name: string | null
  driver_phone: string | null
  last_lat: number | null
  last_lng: number | null
  estimated_delivery_time: string | null
  created_at: string
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export interface DailyAnalytics {
  date: string
  business_id: string
  total_orders: number
  total_revenue: number
  avg_ticket: number
  delivery_orders: number
  dine_in_orders: number
  reservation_orders: number
  reservation_no_shows: number
}
