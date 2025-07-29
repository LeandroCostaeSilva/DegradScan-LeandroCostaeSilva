import { supabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, Users, Search, Database, Zap } from "lucide-react"

interface SearchStatistic {
  substance_name: string
  dcb_name: string | null
  cas_number: string | null
  total_searches: number
  new_api_calls: number
  cached_responses: number
  last_searched: string | null
  unique_users: number
  response_sources_used: number
  first_added: string
  last_updated: string
}

interface ApiUsageAudit {
  substance_name: string
  dcb_name: string | null
  search_term: string
  response_source: string
  processing_time_ms: number | null
  created_at: string
  products_count: number
  references_count: number
}

async function getEnhancedStatistics(): Promise<SearchStatistic[]> {
  try {
    const { data, error } = await supabaseServer
      .from("search_statistics_enhanced")
      .select("*")
      .order("total_searches", { ascending: false })
      .limit(15)

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

async function getApiUsageAudit(): Promise<ApiUsageAudit[]> {
  try {
    const { data, error } = await supabaseServer
      .from("api_usage_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Erro ao buscar auditoria:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar auditoria:", error)
    return []
  }
}

export default async function EnhancedAdminPage() {
  const [statistics, apiAudit] = await Promise.all([getEnhancedStatistics(), getApiUsageAudit()])

  const totalSearches = statistics.reduce((sum, stat) => sum + stat.total_searches, 0)
  const totalApiCalls = statistics.reduce((sum, stat) => sum + stat.new_api_calls, 0)
  const totalCachedResponses = statistics.reduce((sum, stat) => sum + stat.cached_responses, 0)
  const cacheHitRate = totalSearches > 0 ? ((totalCachedResponses / totalSearches) * 100).toFixed(1) : "0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            DegradScan Analytics Pro
          </h1>
          <p className="text-slate-300">Dashboard administrativo completo com métricas detalhadas</p>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total de Pesquisas</p>
                  <p className="text-2xl font-bold text-blue-400">{totalSearches}</p>
                </div>
                <Search className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Chamadas API</p>
                  <p className="text-2xl font-bold text-purple-400">{totalApiCalls}</p>
                </div>
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Cache Hits</p>
                  <p className="text-2xl font-bold text-emerald-400">{totalCachedResponses}</p>
                </div>
                <Database className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Taxa de Cache</p>
                  <p className="text-2xl font-bold text-orange-400">{cacheHitRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Estatísticas Detalhadas */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-100">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                Substâncias Mais Pesquisadas
              </CardTitle>
              <CardDescription className="text-slate-400">
                Estatísticas detalhadas com cache e performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.length > 0 ? (
                  statistics.map((stat, index) => (
                    <div
                      key={stat.substance_name}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-slate-200">{stat.substance_name}</p>
                          {stat.dcb_name && <p className="text-sm text-slate-400">{stat.dcb_name}</p>}
                          {stat.cas_number && <p className="text-xs text-slate-500">CAS: {stat.cas_number}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{stat.total_searches}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="text-purple-400">API: {stat.new_api_calls}</span>
                          <span className="text-emerald-400">Cache: {stat.cached_responses}</span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {stat.unique_users} usuários
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">Nenhuma estatística disponível ainda</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auditoria de API */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-100">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
                Auditoria de API
              </CardTitle>
              <CardDescription className="text-slate-400">Últimas 20 respostas geradas com performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiAudit.length > 0 ? (
                  apiAudit.map((audit) => (
                    <div
                      key={audit.created_at}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <Badge
                            variant="outline"
                            className={`text-xs mb-1 ${
                              audit.response_source === "gemini"
                                ? "border-purple-500 text-purple-300"
                                : audit.response_source === "mock"
                                  ? "border-orange-500 text-orange-300"
                                  : "border-slate-500 text-slate-300"
                            }`}
                          >
                            {audit.response_source}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{audit.substance_name}</p>
                          <div className="flex gap-4 text-xs text-slate-400">
                            <span>Produtos: {audit.products_count}</span>
                            <span>Refs: {audit.references_count}</span>
                            {audit.processing_time_ms && <span>{audit.processing_time_ms}ms</span>}
                          </div>
                          <p className="text-xs text-slate-500">{new Date(audit.created_at).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">Nenhuma auditoria disponível ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
