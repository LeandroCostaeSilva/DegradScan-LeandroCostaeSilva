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

export function generatePDF(substanceName: string, report: DegradationReport) {
  const doc = new jsPDF("portrait", "mm", "a4")

  // A4 dimensions: 210 x 297 mm
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20 // Aumentar de 15 para 20
  const contentWidth = pageWidth - margin * 2 // Agora será 170mm em vez de 180mm

  // Header with gradient effect similar to main screen
  doc.setFillColor(15, 23, 42) // slate-900 base
  doc.rect(0, 0, pageWidth, 40, "F")

  // Add gradient-like effect with multiple rectangles
  doc.setFillColor(88, 28, 135) // purple-900
  doc.rect(0, 0, pageWidth, 35, "F")
  doc.setFillColor(30, 41, 59) // slate-800 overlay
  doc.rect(0, 0, pageWidth, 30, "F")

  // Add decorative molecular dots pattern (using lighter color instead of transparency)
  doc.setFillColor(220, 220, 230) // Light color for subtle effect
  for (let x = 20; x < pageWidth; x += 15) {
    for (let y = 5; y < 35; y += 10) {
      doc.circle(x, y, 0.3, "F") // Smaller circles for subtlety
    }
  }

  // Add colored accent line (similar to gradient in logo)
  const gradient = [
    { color: [59, 130, 246], pos: 0 }, // blue-500
    { color: [139, 92, 246], pos: 0.5 }, // purple-500
    { color: [16, 185, 129], pos: 1 }, // emerald-500
  ]

  // Simulate gradient with multiple colored rectangles
  const lineY = 32
  const segmentWidth = pageWidth / 20
  for (let i = 0; i < 20; i++) {
    const progress = i / 19
    let r, g, b

    if (progress <= 0.5) {
      const localProgress = progress * 2
      r = gradient[0].color[0] + (gradient[1].color[0] - gradient[0].color[0]) * localProgress
      g = gradient[0].color[1] + (gradient[1].color[1] - gradient[0].color[1]) * localProgress
      b = gradient[0].color[2] + (gradient[1].color[2] - gradient[0].color[2]) * localProgress
    } else {
      const localProgress = (progress - 0.5) * 2
      r = gradient[1].color[0] + (gradient[2].color[0] - gradient[1].color[0]) * localProgress
      g = gradient[1].color[1] + (gradient[2].color[1] - gradient[1].color[1]) * localProgress
      b = gradient[1].color[2] + (gradient[2].color[2] - gradient[1].color[2]) * localProgress
    }

    doc.setFillColor(Math.round(r), Math.round(g), Math.round(b))
    doc.rect(i * segmentWidth, lineY, segmentWidth + 1, 3, "F")
  }

  // Header text with enhanced styling
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("DegradScan", margin, 18)

  // Add molecular symbol next to title
  doc.setFillColor(59, 130, 246) // blue-500
  doc.circle(margin + 65, 15, 3, "F")
  doc.setFillColor(139, 92, 246) // purple-500
  doc.circle(margin + 72, 12, 2, "F")
  doc.setFillColor(16, 185, 129) // emerald-500
  doc.circle(margin + 68, 20, 2, "F")

  // Connection lines between molecules
  doc.setDrawColor(100, 116, 139) // slate-500
  doc.setLineWidth(0.5)
  doc.line(margin + 65, 15, margin + 72, 12)
  doc.line(margin + 65, 15, margin + 68, 20)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(203, 213, 225) // slate-300
  doc.text("Relatório de Degradação de Substâncias Ativas", margin, 26)

  // Add "Powered by AI" text similar to main screen
  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175) // gray-400
  doc.text("⚡ Powered by AI", margin + 85, 15)

  // Substance info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`Substância: ${substanceName}`, margin, 50)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, margin, 58)
  doc.text(`Hora: ${new Date().toLocaleTimeString("pt-BR")}`, margin, 64)

  // Function to wrap text properly
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize)
    return doc.splitTextToSize(text, maxWidth - 2) // Adicionar margem interna de 2mm
  }

  // Prepare table data with proper text wrapping
  const tableData = report.products.map((product) => {
    return [
      wrapText(product.substance, 35, 8),
      wrapText(product.degradationRoute, 40, 8),
      wrapText(product.environmentalConditions, 45, 8),
      wrapText(product.toxicityData, 50, 8),
    ]
  })

  // Table configuration with precise measurements for A4
  doc.autoTable({
    head: [["Produto de Degradação", "Via de Degradação", "Condições Ambientais", "Dados de Toxicidade"]],
    body: tableData,
    startY: 75,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
      cellWidth: "wrap",
      valign: "top",
      halign: "left",
      lineColor: [128, 128, 128],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      font: "helvetica",
      fontStyle: "normal",
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      cellPadding: 3,
      minCellHeight: 12,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: {
        // Produto de Degradação
        cellWidth: 28, // Reduzir de 32 para 28
        fontSize: 8,
        fontStyle: "bold",
        overflow: "linebreak",
      },
      1: {
        // Via de Degradação
        cellWidth: 32, // Reduzir de 37 para 32
        fontSize: 8,
        overflow: "linebreak",
      },
      2: {
        // Condições Ambientais
        cellWidth: 36, // Reduzir de 42 para 36
        fontSize: 8,
        overflow: "linebreak",
      },
      3: {
        // Dados de Toxicidade
        cellWidth: 40, // Reduzir de 47 para 40
        fontSize: 8,
        overflow: "linebreak",
      },
    },
    margin: { left: margin, right: margin },
    tableWidth: 136, // Reduzir de contentWidth (170) para 136 (28+32+36+40)
    showHead: "everyPage",
    theme: "grid",
    pageBreak: "auto",
    rowPageBreak: "avoid",
    minCellHeight: 8,
  })

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || 150

  // References section with proper formatting
  let currentY = finalY + 15

  // Check if we need a new page for references
  if (currentY > pageHeight - 60) {
    doc.addPage()
    currentY = margin + 10
  }

  // References title
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Referências Bibliográficas", margin, currentY)
  currentY += 10

  // References content with standardized formatting
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)

  report.references.forEach((reference, index) => {
    const referenceText = `${index + 1}. ${reference}`

    // Split text to fit within content width
    const splitText = doc.splitTextToSize(referenceText, contentWidth - 10) // Aumentar margem interna de 5 para 10

    // Check if we need a new page
    const textHeight = splitText.length * 3.5
    if (currentY + textHeight > pageHeight - margin - 15) {
      doc.addPage()
      currentY = margin + 10
    }

    // Add the reference
    doc.text(splitText, margin, currentY)
    currentY += textHeight + 3
  })

  // Footer with standardized formatting
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer background
    doc.setFillColor(245, 245, 245)
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F")

    // Footer text
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)

    // Left side - Generator info
    doc.text("Gerado por DegradScan", margin, pageHeight - 8)

    // Center - Generation timestamp
    const timestamp = new Date().toLocaleString("pt-BR")
    const timestampWidth = doc.getTextWidth(`Gerado em: ${timestamp}`)
    doc.text(`Gerado em: ${timestamp}`, (pageWidth - timestampWidth) / 2, pageHeight - 8)

    // Right side - Page number
    const pageText = `Página ${i} de ${pageCount}`
    const pageTextWidth = doc.getTextWidth(pageText)
    doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 8)
  }

  // Save the PDF with clean filename
  const cleanSubstanceName = substanceName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")
  const dateString = new Date().toISOString().split("T")[0]
  const filename = `DegradScan_${cleanSubstanceName}_${dateString}.pdf`

  doc.save(filename)
}
