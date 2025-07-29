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

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generatePDF(searchTerm: string, report: DegradationReport): Promise<void> {
  try {
    // Create new PDF document
    const doc = new jsPDF()

    // Set document properties
    doc.setProperties({
      title: `Relatório de Degradação - ${searchTerm}`,
      subject: "Análise de Produtos de Degradação",
      author: "DegradScan",
      creator: "DegradScan System",
    })

    // Add title
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("DegradScan", 20, 20)

    doc.setFontSize(16)
    doc.text(`Relatório de Degradação - ${searchTerm}`, 20, 35)

    // Add generation date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 45)

    // Reset text color
    doc.setTextColor(40, 40, 40)

    let yPosition = 60

    // Add products table if available
    if (report.products && report.products.length > 0) {
      doc.setFontSize(14)
      doc.text("Produtos de Degradação", 20, yPosition)
      yPosition += 10

      // Prepare table data
      const tableData = report.products.map((product) => [
        product.substance || "N/A",
        product.degradationRoute || "N/A",
        product.environmentalConditions || "N/A",
        product.toxicityData || "N/A",
      ])

      // Add table using autoTable
      try {
        doc.autoTable({
          startY: yPosition,
          head: [["Produto", "Via de Degradação", "Condições Ambientais", "Toxicidade"]],
          body: tableData,
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: "linebreak",
            halign: "left",
          },
          headStyles: {
            fillColor: [71, 85, 105],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 45 },
            2: { cellWidth: 45 },
            3: { cellWidth: 40 },
          },
          margin: { left: 20, right: 20 },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 20
      } catch (tableError) {
        console.warn("AutoTable failed, using manual table:", tableError)

        // Fallback: manual table creation
        yPosition += 5
        doc.setFontSize(8)

        // Table headers
        doc.setFont(undefined, "bold")
        doc.text("Produto", 20, yPosition)
        doc.text("Via de Degradação", 60, yPosition)
        doc.text("Condições", 110, yPosition)
        doc.text("Toxicidade", 150, yPosition)
        yPosition += 8

        // Table rows
        doc.setFont(undefined, "normal")
        report.products.forEach((product, index) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          doc.text(product.substance?.substring(0, 25) || "N/A", 20, yPosition)
          doc.text(product.degradationRoute?.substring(0, 30) || "N/A", 60, yPosition)
          doc.text(product.environmentalConditions?.substring(0, 25) || "N/A", 110, yPosition)
          doc.text(product.toxicityData?.substring(0, 20) || "N/A", 150, yPosition)
          yPosition += 6
        })

        yPosition += 10
      }
    }

    // Add references if available
    if (report.references && report.references.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.text("Referências Bibliográficas", 20, yPosition)
      yPosition += 10

      doc.setFontSize(9)
      report.references.forEach((reference, index) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }

        const referenceText = `${index + 1}. ${reference}`
        const splitText = doc.splitTextToSize(referenceText, 170)
        doc.text(splitText, 20, yPosition)
        yPosition += splitText.length * 4 + 2
      })
    }

    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(
        `DegradScan - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" },
      )
    }

    // Save the PDF
    doc.save(`degradscan-${searchTerm.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`)
  } catch (error) {
    console.error("Erro detalhado ao gerar PDF:", error)
    throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }
}
