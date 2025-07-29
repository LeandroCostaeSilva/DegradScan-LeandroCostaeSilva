"use server"

import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { supabaseServer } from "@/lib/supabase-server"
import { headers } from "next/headers"

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

export async function generateDegradationReportWithLogging(substanceName: string): Promise<DegradationReport> {
  const startTime = Date.now()
  const headersList = headers()
  const userAgent = headersList.get("user-agent") || ""
  const forwardedFor = headersList.get("x-forwarded-for")
  const userIP = forwardedFor ? forwardedFor.split(",")[0] : headersList.get("x-real-ip") || "unknown"

  console.log(`🔍 [SEARCH] Iniciando pesquisa para: ${substanceName}`)

  try {
    // Log do início da pesquisa
    await logSystemEvent("INFO", "search", "start", `Pesquisa iniciada para ${substanceName}`, {
      substance: substanceName,
      user_ip: userIP,
      user_agent: userAgent?.substring(0, 100),
    })

    // 1. Verificar cache primeiro
    const cacheKey = `substance_${substanceName.toLowerCase()}`
    const cachedData = await checkCache(cacheKey, substanceName)

    if (cachedData) {
      const processingTime = Date.now() - startTime
      console.log(`✅ [CACHE] Dados encontrados no cache (${processingTime}ms)`)

      // Registrar pesquisa como cache hit
      await logSearchSafe(substanceName, substanceName, userIP, userAgent, "cache", true)

      await logSystemEvent("INFO", "search", "cache_hit", `Cache hit para ${substanceName}`, {
        processing_time_ms: processingTime,
        cache_key: cacheKey,
      })

      return cachedData
    }

    console.log(`🤖 [SEARCH] Cache miss, gerando novo relatório...`)

    // 2. Verificar se já temos dados no banco
    const existingData = await getSubstanceFromDatabase(substanceName)

    if (existingData) {
      const processingTime = Date.now() - startTime
      console.log(`✅ [DATABASE] Dados encontrados no banco (${processingTime}ms)`)

      // Salvar no cache para próximas consultas
      await setCache(cacheKey, substanceName, existingData, "database")

      // Registrar pesquisa como database hit
      await logSearchSafe(substanceName, substanceName, userIP, userAgent, "database", false)

      await logSystemEvent("INFO", "search", "database_hit", `Dados encontrados no banco para ${substanceName}`, {
        processing_time_ms: processingTime,
      })

      return existingData
    }

    console.log(`🧠 [AI] Dados não encontrados, consultando AI...`)

    // 3. Gerar relatório (AI ou mock)
    let report: DegradationReport
    let responseSource: string

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log(`🧠 [AI] Consultando Gemini AI...`)
      report = await generateReportFromAI(substanceName)
      responseSource = "gemini"

      await logSystemEvent("INFO", "ai", "generate", `Relatório gerado via Gemini para ${substanceName}`, {
        substance: substanceName,
        products_count: report.products.length,
        references_count: report.references.length,
      })
    } else {
      console.log(`📋 [MOCK] Usando dados mock (API key não disponível)`)
      report = getMockData(substanceName)
      responseSource = "mock"

      await logSystemEvent("INFO", "mock", "generate", `Dados mock gerados para ${substanceName}`, {
        substance: substanceName,
        products_count: report.products.length,
        references_count: report.references.length,
      })
    }

    const processingTime = Date.now() - startTime

    // 4. Salvar dados no banco
    console.log(`💾 [DATABASE] Salvando dados no banco...`)
    await saveReportToDatabaseSafe(substanceName, substanceName, report, responseSource, processingTime)

    // 5. Salvar no cache
    await setCache(cacheKey, substanceName, report, responseSource)

    // 6. Registrar pesquisa no histórico
    console.log(`📊 [LOG] Registrando pesquisa no histórico...`)
    await logSearchSafe(substanceName, substanceName, userIP, userAgent, responseSource, false)

    await logSystemEvent("INFO", "search", "complete", `Pesquisa concluída para ${substanceName}`, {
      processing_time_ms: processingTime,
      response_source: responseSource,
      products_count: report.products.length,
      references_count: report.references.length,
    })

    console.log(`✅ [SUCCESS] Pesquisa concluída com sucesso (${processingTime}ms)`)
    return report
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [ERROR] Erro ao gerar relatório (${processingTime}ms):`, error)

    await logSystemEvent(
      "ERROR",
      "search",
      "error",
      `Erro na pesquisa para ${substanceName}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      {
        processing_time_ms: processingTime,
        error_message: error instanceof Error ? error.message : "Erro desconhecido",
        stack_trace: error instanceof Error ? error.stack : undefined,
      },
    )

    // Registrar tentativa de pesquisa mesmo com erro
    try {
      await logSearchSafe(substanceName, substanceName, userIP, userAgent, "error", false)
    } catch (logError) {
      console.error("❌ [ERROR] Erro ao registrar pesquisa:", logError)
    }

    // Retornar dados mock como fallback
    const fallbackReport = getMockData(substanceName)

    await logSystemEvent("INFO", "search", "fallback", `Usando dados mock como fallback para ${substanceName}`, {
      processing_time_ms: processingTime,
    })

    return fallbackReport
  }
}

// Funções auxiliares
async function logSystemEvent(
  level: string,
  component: string,
  action: string,
  message: string,
  metadata: Record<string, any> = {},
) {
  try {
    await supabaseServer.rpc("log_system_event", {
      p_level: level,
      p_component: component,
      p_action: action,
      p_message: message,
      p_metadata: metadata,
    })
  } catch (error) {
    console.error("❌ [LOG] Erro ao registrar log:", error)
  }
}

async function checkCache(cacheKey: string, substanceName: string): Promise<DegradationReport | null> {
  try {
    const { data, error } = await supabaseServer.rpc("get_or_set_cache", {
      p_cache_key: cacheKey,
      p_substance_name: substanceName,
    })

    if (error) {
      console.error("❌ [CACHE] Erro ao verificar cache:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("❌ [CACHE] Erro na verificação de cache:", error)
    return null
  }
}

async function setCache(cacheKey: string, substanceName: string, data: DegradationReport, source: string) {
  try {
    await supabaseServer.rpc("get_or_set_cache", {
      p_cache_key: cacheKey,
      p_substance_name: substanceName,
      p_data: data,
      p_source: source,
    })
  } catch (error) {
    console.error("❌ [CACHE] Erro ao salvar cache:", error)
  }
}

async function getSubstanceFromDatabase(substanceName: string): Promise<DegradationReport | null> {
  try {
    const { data, error } = await supabaseServer.rpc("get_substance_data", {
      substance_name: substanceName,
    })

    if (error) {
      console.error("❌ [DATABASE] Erro ao buscar dados do banco:", error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      products: data.products || [],
      references: data.references || [],
    }
  } catch (error) {
    console.error("❌ [DATABASE] Erro na consulta ao banco:", error)
    return null
  }
}

async function saveReportToDatabaseSafe(
  substanceName: string,
  searchTerm: string,
  report: DegradationReport,
  responseSource: string,
  processingTime: number,
): Promise<void> {
  try {
    const { error } = await supabaseServer.rpc("save_degradation_data_safe", {
      substance_name: substanceName.toLowerCase(),
      search_term: searchTerm,
      cas_number: null,
      dcb_name: substanceName,
      products: report.products,
      references_list: report.references,
      response_source: responseSource,
      processing_time_ms: processingTime,
    })

    if (error) {
      console.error("❌ [DATABASE] Erro ao salvar dados no banco:", error)
    } else {
      console.log(`✅ [DATABASE] Dados salvos com sucesso no banco`)
    }
  } catch (error) {
    console.error("❌ [DATABASE] Erro ao salvar no banco:", error)
  }
}

async function logSearchSafe(
  substanceName: string,
  searchTerm: string,
  userIP: string,
  userAgent: string,
  responseSource: string,
  wasCached: boolean,
): Promise<void> {
  try {
    const { error } = await supabaseServer.rpc("log_search_safe", {
      substance_name: substanceName.toLowerCase(),
      search_term: searchTerm,
      user_ip: userIP,
      user_agent: userAgent,
      response_source: responseSource,
      was_cached: wasCached,
    })

    if (error) {
      console.error("❌ [LOG] Erro ao registrar pesquisa:", error)
    } else {
      console.log(`✅ [LOG] Pesquisa registrada: ${substanceName} (${responseSource}, cached: ${wasCached})`)
    }
  } catch (error) {
    console.error("❌ [LOG] Erro ao registrar histórico:", error)
  }
}

async function generateReportFromAI(substanceName: string): Promise<DegradationReport> {
  const prompt = `Como um especialista em química analítica sênior, me apresente de forma objetiva em formato de tabela os produtos de degradação da ${substanceName}, organizando como atributos os nomes das substâncias formadas, a via de degradação química, as condições ambientais que a favorecem e os dados de toxicidade relatados na literatura científica para esse produto de degradação formado. Ao final, embaixo da tabela, apresente as referências bibliográficas dessas informações apresentadas.

Por favor, formate sua resposta em JSON com a seguinte estrutura:
{
  "products": [
    {
      "substance": "nome da substância formada",
      "degradationRoute": "via de degradação química",
      "environmentalConditions": "condições ambientais que favorecem",
      "toxicityData": "dados de toxicidade relatados"
    }
  ],
  "references": [
    "referência bibliográfica 1",
    "referência bibliográfica 2"
  ]
}`

  const { text } = await generateText({
    model: google("gemini-2.0-flash-exp", {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    prompt,
    temperature: 0.3,
  })

  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const jsonStr = jsonMatch[0]
    const parsedData = JSON.parse(jsonStr)
    return parsedData
  }

  // Fallback: parse the text response manually
  return parseTextResponse(text, substanceName)
}

function getMockData(substanceName: string): DegradationReport {
  const mockReports: Record<string, DegradationReport> = {
    paracetamol: {
      products: [
        {
          substance: "N-acetil-p-benzoquinona imina (NAPQI)",
          degradationRoute: "Oxidação metabólica via CYP2E1",
          environmentalConditions: "pH fisiológico, presença de oxigênio, temperatura corporal (37°C)",
          toxicityData: "Altamente hepatotóxico, responsável pela toxicidade do paracetamol em overdose",
        },
        {
          substance: "p-aminofenol",
          degradationRoute: "Hidrólise da ligação amida",
          environmentalConditions: "pH ácido (< 4), temperatura elevada (> 60°C), umidade alta",
          toxicityData: "Moderadamente tóxico, pode causar metahemoglobinemia e nefrotoxicidade",
        },
        {
          substance: "Ácido p-hidroxibenzóico",
          degradationRoute: "Oxidação do grupo amino seguida de desaminação",
          environmentalConditions: "Presença de oxidantes, luz UV, pH alcalino (> 8)",
          toxicityData: "Baixa toxicidade, usado como conservante alimentar (E-214)",
        },
      ],
      references: [
        "Larson, A. M., et al. (2005). Acetaminophen-induced acute liver failure: results of a United States multicenter, prospective study. Hepatology, 42(6), 1364-1372.",
        "McGill, M. R., & Jaeschke, H. (2013). Metabolism and disposition of acetaminophen: recent advances in relation to hepatotoxicity and diagnosis. Pharmaceutical research, 30(9), 2174-2187.",
        "Prescott, L. F. (2000). Paracetamol, alcohol and the liver. British journal of clinical pharmacology, 49(4), 291-301.",
        "Dahlin, D. C., et al. (1984). N-acetyl-p-benzoquinone imine: a cytochrome P-450-mediated oxidation product of acetaminophen. Proceedings of the National Academy of Sciences, 81(5), 1327-1331.",
      ],
    },
    ibuprofeno: {
      products: [
        {
          substance: "Ácido 2-[4-(2-carboxipropil)fenil]propiônico",
          degradationRoute: "Oxidação da cadeia lateral isobutílica",
          environmentalConditions: "pH neutro (6-8), presença de oxigênio, catálise enzimática (CYP2C9)",
          toxicityData: "Toxicidade renal moderada, menor nefrotoxicidade que o composto original",
        },
        {
          substance: "4-isobutilfenol",
          degradationRoute: "Descarboxilação térmica",
          environmentalConditions: "Temperatura elevada (> 80°C), pH ácido (< 3), ausência de água",
          toxicityData: "Potencial irritante dérmico e ocular, dados limitados de toxicidade sistêmica",
        },
        {
          substance: "Ácido 2-[4-(1-hidroxi-2-metilpropil)fenil]propiônico",
          degradationRoute: "Hidroxilação da cadeia lateral",
          environmentalConditions: "Presença de enzimas CYP, pH fisiológico, temperatura corporal",
          toxicityData: "Perfil de toxicidade similar ao ibuprofeno, menor atividade anti-inflamatória",
        },
      ],
      references: [
        "Davies, N. M. (1998). Clinical pharmacokinetics of ibuprofen. Clinical pharmacokinetics, 34(2), 101-154.",
        "Rainsford, K. D. (2009). Ibuprofen: pharmacology, efficacy and safety. Inflammopharmacology, 17(6), 275-342.",
        "Mazaleuskaya, L. L., et al. (2015). PharmGKB summary: ibuprofen pathways. Pharmacogenetics and genomics, 25(2), 96-106.",
      ],
    },
  }

  const key = substanceName.toLowerCase()
  const report = mockReports[key]

  if (report) {
    return report
  }

  // Generic response for unknown substances
  return {
    products: [
      {
        substance: `Produtos de degradação de ${substanceName}`,
        degradationRoute: "Múltiplas vias de degradação possíveis (hidrólise, oxidação, fotólise)",
        environmentalConditions: "Variáveis conforme condições específicas (pH, temperatura, luz, oxigênio)",
        toxicityData: "Dados de toxicidade específicos requerem análise detalhada da literatura científica",
      },
    ],
    references: [
      "Para informações específicas sobre produtos de degradação, consulte bases de dados especializadas como PubMed, SciFinder ou Reaxys.",
      "Diretrizes ICH Q1A(R2) - Stability Testing of New Drug Substances and Products.",
      "USP <1225> Validation of Compendial Procedures - Analytical validation guidelines.",
    ],
  }
}

function parseTextResponse(text: string, substanceName: string): DegradationReport {
  // This is a fallback parser for when the AI doesn't return proper JSON
  const lines = text.split("\n").filter((line) => line.trim())

  const products: DegradationProduct[] = []
  const references: string[] = []

  let inReferences = false

  for (const line of lines) {
    if (line.toLowerCase().includes("referência") || line.toLowerCase().includes("bibliografia")) {
      inReferences = true
      continue
    }

    if (inReferences) {
      if (line.trim() && !line.includes("|")) {
        references.push(line.trim())
      }
    } else if (line.includes("|") && !line.includes("Produto") && !line.includes("---")) {
      // Parse table rows
      const columns = line
        .split("|")
        .map((col) => col.trim())
        .filter((col) => col)
      if (columns.length >= 4) {
        products.push({
          substance: columns[0] || "Não especificado",
          degradationRoute: columns[1] || "Não especificado",
          environmentalConditions: columns[2] || "Não especificado",
          toxicityData: columns[3] || "Não especificado",
        })
      }
    }
  }

  // If no products were parsed, return mock data
  if (products.length === 0) {
    return getMockData(substanceName)
  }

  if (references.length === 0) {
    references.push(
      "Consulte literatura científica especializada para informações detalhadas sobre produtos de degradação.",
    )
  }

  return { products, references }
}
