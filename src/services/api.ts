import type { DegradationReport } from "../types"

// Mock API service for demonstration
export async function generateDegradationReport(substanceName: string): Promise<DegradationReport> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock data based on the substance name
  const mockReports: Record<string, DegradationReport> = {
    paracetamol: {
      products: [
        {
          substance: "N-acetil-p-benzoquinona imina (NAPQI)",
          degradationRoute: "Oxidação metabólica via CYP2E1",
          environmentalConditions: "pH fisiológico, presença de oxigênio, temperatura corporal",
          toxicityData: "Altamente hepatotóxico, responsável pela toxicidade do paracetamol",
        },
        {
          substance: "p-aminofenol",
          degradationRoute: "Hidrólise da ligação amida",
          environmentalConditions: "pH ácido, temperatura elevada, umidade",
          toxicityData: "Moderadamente tóxico, pode causar metahemoglobinemia",
        },
        {
          substance: "Ácido p-hidroxibenzóico",
          degradationRoute: "Oxidação do grupo amino",
          environmentalConditions: "Presença de oxidantes, luz UV, pH alcalino",
          toxicityData: "Baixa toxicidade, usado como conservante alimentar",
        },
      ],
      references: [
        "Larson, A. M., et al. (2005). Acetaminophen-induced acute liver failure: results of a United States multicenter, prospective study. Hepatology, 42(6), 1364-1372.",
        "McGill, M. R., & Jaeschke, H. (2013). Metabolism and disposition of acetaminophen: recent advances in relation to hepatotoxicity and diagnosis. Pharmaceutical research, 30(9), 2174-2187.",
        "Prescott, L. F. (2000). Paracetamol, alcohol and the liver. British journal of clinical pharmacology, 49(4), 291-301.",
      ],
    },
    ibuprofeno: {
      products: [
        {
          substance: "Ácido 2-[4-(2-carboxipropil)fenil]propiônico",
          degradationRoute: "Oxidação da cadeia lateral",
          environmentalConditions: "pH neutro, presença de oxigênio, catálise enzimática",
          toxicityData: "Toxicidade renal moderada, menor que o composto original",
        },
        {
          substance: "4-isobutilfenol",
          degradationRoute: "Descarboxilação",
          environmentalConditions: "Temperatura elevada, pH ácido",
          toxicityData: "Potencial irritante, dados limitados de toxicidade",
        },
      ],
      references: [
        "Davies, N. M. (1998). Clinical pharmacokinetics of ibuprofen. Clinical pharmacokinetics, 34(2), 101-154.",
        "Rainsford, K. D. (2009). Ibuprofen: pharmacology, efficacy and safety. Inflammopharmacology, 17(6), 275-342.",
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
        degradationRoute: "Múltiplas vias de degradação possíveis",
        environmentalConditions: "Variáveis conforme condições específicas (pH, temperatura, luz, oxigênio)",
        toxicityData: "Dados de toxicidade específicos requerem análise detalhada da literatura",
      },
    ],
    references: [
      "Para informações específicas sobre produtos de degradação, consulte bases de dados especializadas como PubMed, SciFinder ou Reaxys.",
      "Diretrizes ICH Q1A(R2) - Stability Testing of New Drug Substances and Products.",
      "USP <1225> Validation of Compendial Procedures.",
    ],
  }
}
