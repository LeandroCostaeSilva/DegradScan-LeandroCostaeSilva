import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface Substance {
  id: string
  name: string
  cas_number?: string
  dcb_name?: string
  created_at: string
  updated_at: string
}

export interface DegradationProduct {
  id: string
  substance_id: string
  product_name: string
  degradation_route: string
  environmental_conditions: string
  toxicity_data: string
  created_at: string
}

export interface Reference {
  id: string
  substance_id: string
  reference_text: string
  reference_order: number
  created_at: string
}

export interface SearchHistory {
  id: string
  substance_id: string
  search_term: string
  user_ip?: string
  user_agent?: string
  search_timestamp: string
}
