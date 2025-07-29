export interface DegradationProduct {
  substance: string
  degradationRoute: string
  environmentalConditions: string
  toxicityData: string
}

export interface DegradationReport {
  products: DegradationProduct[]
  references: string[]
}
