// Import jsPDF with proper typing for production
let jsPDF: any
let autoTable: any

async function loadPDFLibraries() {
  if (typeof window === "undefined") {
    throw new Error("PDF generation only works in browser environment")
  }

  if (!jsPDF) {
    const jsPDFModule = await import("jspdf")
    jsPDF = jsPDFModule.jsPDF || jsPDFModule.default

    // Load autoTable plugin
    await import("jspdf-autotable")
  }

  return jsPDF
}

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

export async function generatePDF(substanceName: string, report: DegradationReport): Promise<void> {
  try {
    // Load PDF libraries dynamically
    const PDFClass = await loadPDFLibraries()

    if (!PDFClass) {
      throw new Error("Failed to load PDF library")
    }

    const doc = new PDFClass("portrait", "mm", "a4")

    // A4 dimensions: 210 x 297 mm
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const contentWidth = pageWidth - margin * 2

    // Header with gradient effect similar to main screen
    doc.setFillColor(15, 23, 42) // slate-900 base
    doc.rect(0, 0, pageWidth, 40, "F")

    // Add gradient-like effect with multiple rectangles
    doc.setFillColor(88, 28, 135) // purple-900
    doc.rect(0, 0, pageWidth, 35, "F")
    doc.setFillColor(30, 41, 59) // slate-800 overlay
    doc.rect(0, 0, pageWidth, 30, "F")

    // Add decorative molecular dots pattern
    doc.setFillColor(220, 220, 230) // Light color for subtle effect
    for (let x = 20; x < pageWidth; x += 15) {
      for (let y = 5; y < 35; y += 10) {
        doc.circle(x, y, 0.3, "F")
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
      return doc.splitTextToSize(text, maxWidth - 2)
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

    // Check if autoTable is available
    if (typeof doc.autoTable === "function") {
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
            cellWidth: 28,
            fontSize: 8,
            fontStyle: "bold",
            overflow: "linebreak",
          },
          1: {
            cellWidth: 32,
            fontSize: 8,
            overflow: "linebreak",
          },
          2: {
            cellWidth: 36,
            fontSize: 8,
            overflow: "linebreak",
          },
          3: {
            cellWidth: 40,
            fontSize: 8,
            overflow: "linebreak",
          },
        },
        margin: { left: margin, right: margin },
        tableWidth: 136,
        showHead: "everyPage",
        theme: "grid",
        pageBreak: "auto",
        rowPageBreak: "avoid",
        minCellHeight: 8,
      })
    } else {
      // Fallback: create simple table without autoTable
      let currentY = 85

      // Table header
      doc.setFillColor(59, 130, 246)
      doc.rect(margin, currentY - 10, contentWidth, 12, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")

      const headers = ["Produto de Degradação", "Via de Degradação", "Condições Ambientais", "Dados de Toxicidade"]
      const colWidths = [42, 42, 42, 42]
      let xPos = margin + 2

      headers.forEach((header, index) => {
        doc.text(header, xPos, currentY - 3)
        xPos += colWidths[index]
      })

      currentY += 5

      // Table rows
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")

      report.products.forEach((product, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, currentY - 5, contentWidth, 15, "F")
        }

        xPos = margin + 2
        const rowData = [
          product.substance,
          product.degradationRoute,
          product.environmentalConditions,
          product.toxicityData,
        ]

        rowData.forEach((data, colIndex) => {
          const wrappedText = doc.splitTextToSize(data, colWidths[colIndex] - 4)
          doc.text(wrappedText, xPos, currentY)
          xPos += colWidths[colIndex]
        })

        currentY += 15
      })
    }

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable?.finalY || 85 + 15 * report.products.length + 20

    // References section with proper formatting
    let refCurrentY = finalY + 15

    // Check if we need a new page for references
    if (refCurrentY > pageHeight - 60) {
      doc.addPage()
      refCurrentY = margin + 10
    }

    // References title
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Referências Bibliográficas", margin, refCurrentY)
    refCurrentY += 10

    // References content with standardized formatting
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)

    report.references.forEach((reference, index) => {
      const referenceText = `${index + 1}. ${reference}`

      // Split text to fit within content width
      const splitText = doc.splitTextToSize(referenceText, contentWidth - 10)

      // Check if we need a new page
      const textHeight = splitText.length * 3.5
      if (refCurrentY + textHeight > pageHeight - margin - 15) {
        doc.addPage()
        refCurrentY = margin + 10
      }

      // Add the reference
      doc.text(splitText, margin, refCurrentY)
      refCurrentY += textHeight + 3
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

    // Use save method
    doc.save(filename)
  } catch (error) {
    console.error("Erro detalhado ao gerar PDF:", error)

    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes("browser environment")) {
        throw new Error("PDF só pode ser gerado no navegador. Recarregue a página e tente novamente.")
      } else if (error.message.includes("Failed to load")) {
        throw new Error("Erro ao carregar bibliotecas PDF. Verifique sua conexão com a internet.")
      } else {
        throw new Error(`Erro ao gerar PDF: ${error.message}`)
      }
    } else {
      throw new Error("Erro desconhecido ao gerar PDF. Tente novamente ou use um navegador diferente.")
    }
  }
}
