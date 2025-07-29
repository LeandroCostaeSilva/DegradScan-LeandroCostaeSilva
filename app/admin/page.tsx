import { getSearchStatistics, getRecentSearches } from "../actions/get-search-statistics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, Users, Search } from "lucide-react"

export default async function AdminPage() {
  const [statistics, recentSearches] = await Promise.all([getSearchStatistics(), getRecentSearches()])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            DegradScan Analytics
          </h1>
          <p className="text-slate-300">Dashboard administrativo com estatísticas de uso</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Estatísticas de Pesquisa */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-100">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                Substâncias Mais Pesquisadas
              </CardTitle>
              <CardDescription className="text-slate-400">Top 10 substâncias por número de consultas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.length > 0 ? (
                  statistics.map((stat, index) => (
                    <div
                      key={stat.substance_name}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-slate-200">{stat.substance_name}</p>
                          {stat.dcb_name && <p className="text-sm text-slate-400">{stat.dcb_name}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{stat.search_count}</p>
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

          {/* Pesquisas Recentes */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-100">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
                Pesquisas Recentes
              </CardTitle>
              <CardDescription className="text-slate-400">Últimas 20 consultas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSearches.length > 0 ? (
                  recentSearches.map((search) => (
                    <div key={search.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-purple-400" />
                        <div>
                          <p className="font-medium text-slate-200">{search.substance_name}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(search.search_timestamp).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {search.user_ip?.substring(0, 8)}...
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">Nenhuma pesquisa registrada ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
