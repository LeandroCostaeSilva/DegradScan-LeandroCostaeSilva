"use server"

import { supabaseServer } from "@/lib/supabase-server"

export interface SearchStatistic {
  substance_name: string
  dcb_name: string | null
  search_count: number
  last_searched: string | null
  unique_users: number
}

export interface RecentSearch {
  id: string
  substance_name: string
  search_term: string
  search_timestamp: string
  user_ip: string | null
}

export async function getSearchStatistics(): Promise<SearchStatistic[]> {
  try {
    const { data, error } = await supabaseServer
      .from("search_statistics")
      .select("*")
      .order("search_count", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Erro ao buscar estatísticas:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return []
  }
}

export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const { data, error } = await supabaseServer.from("recent_searches").select("*").limit(20)

    if (error) {
      console.error("Erro ao buscar pesquisas recentes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar pesquisas recentes:", error)
    return []
  }
}
