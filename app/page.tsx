"use client"

import { useState } from "react"
import { Search, FileText, Download, Loader2, Beaker, Atom, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generatePDF } from "./utils/pdf-generator"

interface DegradationData {
  id: string
  substance: string
  pathway: string
  products: string[]
  conditions: string
  rate: string
  halfLife: string
  mechanism: string
  references: string[]
  environmental_impact: string
  toxicity: string
  biodegradability: string
}

export default function DegradScanApp() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [results, setResults] = useState<DegradationData[]>([])
  const [error, setError] = useState("")
  const [cacheStatus, setCacheStatus] = useState<"none" | "processing" | "cached">("none")

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError("")
    setCacheStatus("processing")

    try {
      // Simular busca com dados mockados para demonstração
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockData: DegradationData[] = [
        {
          id: "1",
          substance: searchTerm,
          pathway: "Oxidação aeróbica",
          products: ["Ácido acético", "CO₂", "H₂O"],
          conditions: "pH 7.0, 25°C, presença de O₂",
          rate: "0.15 mg/L/h",
          halfLife: "4.6 horas",
          mechanism: "Hidroxilação seguida de oxidação",
          references: [
            "Smith et al. (2023). Environmental degradation pathways. J. Environ. Sci. 45:123-134.",
            "Johnson, M. (2022). Biodegradation mechanisms. Nature Biotechnology 38:456-467.",
          ],
          environmental_impact: "Baixo impacto ambiental",
          toxicity: "Não tóxico em concentrações normais",
          biodegradability: "Facilmente biodegradável",
        },
      ]

      setResults(mockData)
      setCacheStatus("cached")
    } catch (err) {
      setError("Erro ao buscar dados de degradação. Tente novamente.")
      setCacheStatus("none")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (results.length === 0) return

    setIsPdfGenerating(true)
    try {
      await generatePDF(results, searchTerm)
    } catch (error) {
      setError("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setIsPdfGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e0f2fe' fillOpacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Atom className="h-16 w-16 text-blue-400 animate-spin-slow" />
              <Beaker className="h-8 w-8 text-emerald-400 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            DegradScan
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Sistema avançado de análise de vias de degradação molecular com IA
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Substância
            </CardTitle>
            <CardDescription className="text-slate-400">
              Digite o nome da substância para analisar suas vias de degradação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Ex: paracetamol, ibuprofeno, cafeína..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400"
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchTerm.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analisar
                  </>
                )}
              </Button>
            </div>

            {/* Cache Status */}
            {cacheStatus !== "none" && (
              <div className="mt-4 flex items-center gap-2">
                {cacheStatus === "processing" ? (
                  <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-300 border-yellow-700">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Processando dados...
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-900/50 text-green-300 border-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Dados em cache - Resposta rápida
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-8 bg-red-900/50 border-red-700 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGeneratePDF}
                disabled={isPdfGenerating}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>

            {/* Results Cards */}
            {results.map((result) => (
              <Card key={result.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Análise de Degradação: {result.substance}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <tbody className="text-slate-300">
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Via de Degradação</td>
                          <td className="py-3 px-4">{result.pathway}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Produtos Formados</td>
                          <td className="py-3 px-4">{result.products.join(", ")}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Condições</td>
                          <td className="py-3 px-4">{result.conditions}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Taxa de Degradação</td>
                          <td className="py-3 px-4">{result.rate}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Meia-vida</td>
                          <td className="py-3 px-4">{result.halfLife}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Mecanismo</td>
                          <td className="py-3 px-4">{result.mechanism}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Impacto Ambiental</td>
                          <td className="py-3 px-4">{result.environmental_impact}</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Toxicidade</td>
                          <td className="py-3 px-4">{result.toxicity}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-400 bg-slate-900/30">Biodegradabilidade</td>
                          <td className="py-3 px-4">{result.biodegradability}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* References */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-3">Referências</h3>
                    <div className="space-y-2">
                      {result.references.map((ref, index) => (
                        <p key={index} className="text-sm text-slate-400 pl-4 border-l-2 border-slate-600">
                          [{index + 1}] {ref}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.length === 0 && !error && (
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700 text-center py-12">
            <CardContent>
              <Atom className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Pronto para Análise</h3>
              <p className="text-slate-500">Digite o nome de uma substância para começar a análise de degradação</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
