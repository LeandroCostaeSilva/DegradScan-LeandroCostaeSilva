import jsPDF from "jspdf"
import "jspdf-autotable"
import type { DegradationReport } from "../types"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function generatePDF(substanceName: string, report: DegradationReport) {
  const doc = new jsPDF()

  // Header with dark theme colors
  doc.setFillColor(30, 41, 59) // slate-800
  doc.rect(0, 0, 210, 40, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("DegradScan", 20, 25)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Relatório de Degradação", 20, 35)

  // Substance info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(`Substância: ${substanceName}`, 20, 55)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 65)

  // Table
  const tableData = report.products.map((product) => [
    product.substance,
    product.degradationRoute,
    product.environmentalConditions,
    product.toxicityData,
  ])

  doc.autoTable({
    head: [["Produto de Degradação", "Via de Degradação", "Condições Ambientais", "Dados de Toxicidade"]],
    body: tableData,
    startY: 80,
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 },
      3: { cellWidth: 50 },
    },
  })

  // References
  const finalY = (doc as any).lastAutoTable.finalY || 150

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Referências Bibliográficas", 20, finalY + 20)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  let yPosition = finalY + 35
  report.references.forEach((reference, index) => {
    const text = `${index + 1}. ${reference}`
    const splitText = doc.splitTextToSize(text, 170)
    doc.text(splitText, 20, yPosition)
    yPosition += splitText.length * 5

    // Add new page if needed
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Página ${i} de ${pageCount}`, 170, 285)
    doc.text("Gerado por DegradScan", 20, 285)
  }

  // Save the PDF
  doc.save(`DegradScan_${substanceName}_${new Date().toISOString().split("T")[0]}.pdf`)
}
