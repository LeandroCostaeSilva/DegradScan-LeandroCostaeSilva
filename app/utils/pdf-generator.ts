import jsPDF from "jspdf"
import "jspdf-autotable"

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

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generatePDF(searchTerm: string, report: DegradationReport): Promise<void> {
  try {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("DegradScan - Relatório de Degradação", 20, 30)

    doc.setFontSize(14)
    doc.setTextColor(80, 80, 80)
    doc.text(`Substância: ${searchTerm}`, 20, 45)
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 55)

    // Produtos de Degradação Table
    const tableData = report.products.map((product) => [
      product.substance,
      product.degradationRoute,
      product.environmentalConditions,
      product.toxicityData,
    ])

    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        head: [["Produto de Degradação", "Via de Degradação", "Condições Ambientais", "Dados de Toxicidade"]],
        body: tableData,
        startY: 70,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 20, right: 20 },
      })
    }

    // References
    const finalY = (doc as any).lastAutoTable?.finalY || 150
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text("Referências Bibliográficas", 20, finalY + 20)

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    let yPosition = finalY + 35

    report.references.forEach((reference, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${reference}`, 170)
      doc.text(lines, 20, yPosition)
      yPosition += lines.length * 5 + 5
    })

    // Save the PDF
    doc.save(`degradscan-${searchTerm.toLowerCase().replace(/\s+/g, "-")}.pdf`)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw new Error("Falha na geração do PDF")
  }
}
