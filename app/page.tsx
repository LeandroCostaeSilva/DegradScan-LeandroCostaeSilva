"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Download, FileText, Loader2, Sparkles, Zap } from "lucide-react"
import { MoleculeLogo } from "./components/MoleculeLogo"
import { generateDegradationReportDefinitive } from "./actions/generate-report-definitive"

interface DegradationProduct {
  substance: string
  degradationRoute: string
  environmentalConditions: string
  toxicityData: string
}

interface DegradationReport {
  products: DegradationProduct[]
  references: string[]
}

export default function DegradScanApp() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<DegradationReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cacheStatus, setCacheStatus] = useState<string | null>(null)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError(null)
    setCacheStatus(null)

    const startTime = Date.now()

    try {
      const result = await generateDegradationReportDefinitive(searchTerm)
      const processingTime = Date.now() - startTime

      setReport(result)
      setCacheStatus(`Processado em ${processingTime}ms`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar relatório. Tente novamente.")
      console.error("Error generating report:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!report) return

    setIsPdfGenerating(true)

    try {
      // Dynamic import to avoid SSR issues
      const { generatePDF } = await import("./utils/pdf-generator")
      await generatePDF(searchTerm, report)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      setError("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <MoleculeLogo />
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                DegradScan
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-slate-400 font-medium">Powered by AI</span>
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-400 font-medium">Cache Inteligente</span>
              </div>
            </div>
          </div>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-6">
            Ferramenta especializada para pesquisa de produtos de degradação de substâncias ativas de medicamentos
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
              Química Analítica
            </Badge>
            <Badge
              variant="secondary"
              className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30"
            >
              Ciências Farmacêuticas
            </Badge>
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
            >
              Controle de Qualidade
            </Badge>
            <Badge
              variant="secondary"
              className="bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
            >
              P&D Farmacêutico
            </Badge>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-100">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              Busca por Substância Ativa
              {cacheStatus && (
                <Badge variant="outline" className="border-emerald-500 text-emerald-300 ml-auto">
                  <Zap className="h-3 w-3 mr-1" />
                  {cacheStatus}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Digite o nome do fármaco conforme DCB ou o nome da substância conforme CAS Number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Ex: Paracetamol, Ibuprofeno, Ácido Acetilsalicílico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-slate-900/50 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                disabled={isLoading}
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchTerm.trim()}
                className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-900/20 border-red-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-red-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {report && (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-slate-100">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  Relatório de Degradação - {searchTerm}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Produtos de degradação identificados e suas características
                </CardDescription>
              </div>
              <Button
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {/* Degradation Products Table */}
              <div className="overflow-x-auto mb-8 rounded-lg border border-slate-700">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-700/50">
                      <th className="border-b border-slate-600 px-6 py-4 text-left font-semibold text-slate-200">
                        Produto de Degradação
                      </th>
                      <th className="border-b border-slate-600 px-6 py-4 text-left font-semibold text-slate-200">
                        Via de Degradação
                      </th>
                      <th className="border-b border-slate-600 px-6 py-4 text-left font-semibold text-slate-200">
                        Condições Ambientais
                      </th>
                      <th className="border-b border-slate-600 px-6 py-4 text-left font-semibold text-slate-200">
                        Dados de Toxicidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.products.map((product, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/50"
                        } hover:bg-slate-700/30 transition-colors`}
                      >
                        <td className="border-b border-slate-700/50 px-6 py-4 text-slate-300">{product.substance}</td>
                        <td className="border-b border-slate-700/50 px-6 py-4 text-slate-300">
                          {product.degradationRoute}
                        </td>
                        <td className="border-b border-slate-700/50 px-6 py-4 text-slate-300">
                          {product.environmentalConditions}
                        </td>
                        <td className="border-b border-slate-700/50 px-6 py-4 text-slate-300">
                          {product.toxicityData}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-8 bg-slate-700" />

              {/* References Section */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Referências Bibliográficas
                </h3>
                <div className="space-y-3">
                  {report.references.map((reference, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-blue-400 font-medium min-w-[2rem]">{index + 1}.</span>
                      <p className="text-sm text-slate-300 leading-relaxed">{reference}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/30 rounded-full border border-slate-700/50 backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-400">
              DegradScan - Sistema com cache inteligente para otimização de performance
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
