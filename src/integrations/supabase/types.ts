export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'customer' | 'seller' | 'admin'
export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentMethod = 'razorpay' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  full_name: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  price: number
  compare_price: number | null
  cost_price: number | null
  stock: number
  reorder_point: number
  image_url: string | null
  images: string[]
  specifications: Record<string, Json>
  sales: number
  revenue: number
  is_active: boolean
  is_featured: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  category?: Category
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  address_id: string | null
  shipping_address: Json
  subtotal: number
  tax: number
  shipping_cost: number
  discount: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  order_status: OrderStatus
  tracking_number: string | null
  carrier: string | null
  notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  user?: Profile
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_sku: string
  product_image: string | null
  quantity: number
  price: number
  total: number
  created_at: string
  product?: Product
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  content: string
  is_approved: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  user?: Profile
  product?: Product
}

export interface Discount {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string | null
  type: string
  title: string
  message: string
  data: Json
  is_read: boolean
  created_at: string
}

export interface SupportTicket {
  id: string
  ticket_number: string
  user_id: string
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved'
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_by: string | null
  created_at: string
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
      addresses: {
        Row: Address
        Insert: Omit<Address, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Address, 'id'>>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id'>>
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sales' | 'revenue' | 'category'>
        Update: Partial<Omit<Product, 'id' | 'category'>>
        Relationships: []
      }
      cart_items: {
        Row: CartItem
        Insert: Omit<CartItem, 'id' | 'created_at' | 'updated_at' | 'product'>
        Update: Partial<Omit<CartItem, 'id' | 'product'>>
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_items' | 'user'>
        Update: Partial<Omit<Order, 'id' | 'order_items' | 'user'>>
        Relationships: []
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at' | 'product'>
        Update: Partial<Omit<OrderItem, 'id' | 'product'>>
        Relationships: []
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'helpful_count' | 'user' | 'product'>
        Update: Partial<Omit<Review, 'id' | 'user' | 'product'>>
        Relationships: []
      }
      discounts: {
        Row: Discount
        Insert: Omit<Discount, 'id' | 'created_at' | 'usage_count'>
        Update: Partial<Omit<Discount, 'id'>>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id'>>
        Relationships: []
      }
      support_tickets: {
        Row: SupportTicket
        Insert: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SupportTicket, 'id'>>
        Relationships: []
      }
      order_status_history: {
        Row: OrderStatusHistory
        Insert: Omit<OrderStatusHistory, 'id' | 'created_at'>
        Update: Partial<Omit<OrderStatusHistory, 'id'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: undefined
      }
      place_order: {
        Args: {
          p_shipping_address: Json
          p_subtotal: number
          p_tax: number
          p_shipping_cost: number
          p_discount: number
          p_total: number
          p_payment_method: PaymentMethod
          p_items: Json
          p_discount_code?: string | null
        }
        Returns: { id: string; order_number: string }[]
      }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      increment_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      has_role: {
        Args: { _uid: string; _roles: UserRole[] }
        Returns: boolean
      }
      is_admin: {
        Args: { _uid?: string }
        Returns: boolean
      }
      is_staff: {
        Args: { _uid?: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      order_status: OrderStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      user_role: ['customer', 'seller', 'admin'],
      order_status: ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      payment_method: ['razorpay', 'cod'],
      payment_status: ['pending', 'paid', 'failed', 'refunded'],
    },
  },
} as const
