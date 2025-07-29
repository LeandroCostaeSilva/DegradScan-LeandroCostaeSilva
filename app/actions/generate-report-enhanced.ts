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

export async function generateDegradationReportEnhanced(substanceName: string): Promise<DegradationReport> {
  const startTime = Date.now()
  const headersList = headers()
  const userAgent = headersList.get("user-agent") || ""
  const forwardedFor = headersList.get("x-forwarded-for")
  const userIP = forwardedFor ? forwardedFor.split(",")[0] : headersList.get("x-real-ip") || "unknown"

  console.log(`🔍 Iniciando pesquisa para: ${substanceName}`)
  console.log(`📍 IP: ${userIP}, User-Agent: ${userAgent?.substring(0, 50)}...`)

  try {
    // 1. Verificar se já temos dados no banco (cache)
    const existingData = await getSubstanceFromDatabase(substanceName)

    if (existingData) {
      const processingTime = Date.now() - startTime
      console.log(`✅ Dados encontrados no cache (${processingTime}ms)`)

      // Registrar pesquisa como cache hit
      await logSearchEnhanced(substanceName, substanceName, userIP, userAgent, "cache", true)

      return existingData
    }

    console.log(`🤖 Dados não encontrados no cache, gerando novo relatório...`)

    // 2. Gerar relatório (AI ou mock)
    let report: DegradationReport
    let responseSource: string

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log(`🧠 Consultando Gemini AI...`)
      report = await generateReportFromAI(substanceName)
      responseSource = "gemini"
    } else {
      console.log(`📋 Usando dados mock (API key não disponível)`)
      report = getMockData(substanceName)
      responseSource = "mock"
    }

    const processingTime = Date.now() - startTime

    // 3. Salvar dados no banco com informações detalhadas
    console.log(`💾 Salvando dados no banco...`)
    await saveReportToDatabaseEnhanced(substanceName, substanceName, report, responseSource, processingTime)

    // 4. Registrar pesquisa no histórico
    console.log(`📊 Registrando pesquisa no histórico...`)
    await logSearchEnhanced(substanceName, substanceName, userIP, userAgent, responseSource, false)

    console.log(`✅ Pesquisa concluída com sucesso (${processingTime}ms)`)
    return report
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Erro ao gerar relatório (${processingTime}ms):`, error)

    // Registrar tentativa de pesquisa mesmo com erro
    try {
      await logSearchEnhanced(substanceName, substanceName, userIP, userAgent, "error", false)
    } catch (logError) {
      console.error("❌ Erro ao registrar pesquisa:", logError)
    }

    // Retornar dados mock como fallback
    const fallbackReport = getMockData(substanceName)

    // Tentar salvar dados mock como fallback
    try {
      await saveReportToDatabaseEnhanced(substanceName, substanceName, fallbackReport, "mock_fallback", processingTime)
    } catch (saveError) {
      console.error("❌ Erro ao salvar fallback:", saveError)
    }

    return fallbackReport
  }
}

async function getSubstanceFromDatabase(substanceName: string): Promise<DegradationReport | null> {
  try {
    const { data, error } = await supabaseServer.rpc("get_substance_data", {
      substance_name: substanceName,
    })

    if (error) {
      console.error("❌ Erro ao buscar dados do banco:", error)
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
    console.error("❌ Erro na consulta ao banco:", error)
    return null
  }
}

async function saveReportToDatabaseEnhanced(
  substanceName: string,
  searchTerm: string,
  report: DegradationReport,
  responseSource: string,
  processingTime: number,
): Promise<void> {
  try {
    const { error } = await supabaseServer.rpc("save_degradation_data_enhanced", {
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
      console.error("❌ Erro ao salvar dados no banco:", error)
      throw error
    }

    console.log(`✅ Dados salvos com sucesso no banco`)
  } catch (error) {
    console.error("❌ Erro ao salvar no banco:", error)
    // Não propagar o erro para não quebrar a funcionalidade
  }
}

async function logSearchEnhanced(
  substanceName: string,
  searchTerm: string,
  userIP: string,
  userAgent: string,
  responseSource: string,
  wasCached: boolean,
): Promise<void> {
  try {
    const { error } = await supabaseServer.rpc("log_search_enhanced", {
      substance_name: substanceName.toLowerCase(),
      search_term: searchTerm,
      user_ip: userIP,
      user_agent: userAgent,
      response_source: responseSource,
      was_cached: wasCached,
    })

    if (error) {
      console.error("❌ Erro ao registrar pesquisa:", error)
    } else {
      console.log(`✅ Pesquisa registrada: ${substanceName} (${responseSource}, cached: ${wasCached})`)
    }
  } catch (error) {
    console.error("❌ Erro ao registrar histórico:", error)
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
