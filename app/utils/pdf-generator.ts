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
    // Importação dinâmica para garantir compatibilidade
    const jsPDFModule = await import("jspdf")
    const autoTableModule = await import("jspdf-autotable")

    const doc = new jsPDFModule.default()

    // Configurar propriedades do documento
    doc.setProperties({
      title: `DegradScan - ${searchTerm}`,
      subject: "Relatório de Degradação",
      author: "DegradScan",
      creator: "DegradScan System",
    })

    // Header com design melhorado
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, 210, 40, "F")

    // Título principal
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("DegradScan", 20, 25)

    // Subtítulo
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Relatório de Degradação de Substâncias Ativas", 20, 35)

    // Informações da substância
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(`Substância: ${searchTerm}`, 20, 55)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 20, 65)
    doc.text(`Hora: ${new Date().toLocaleTimeString("pt-BR")}`, 20, 72)

    let yPosition = 85

    // Verificar se há produtos para exibir
    if (report.products && report.products.length > 0) {
      // Título da seção
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("Produtos de Degradação", 20, yPosition)
      yPosition += 10

      // Preparar dados da tabela
      const tableData = report.products.map((product) => [
        product.substance || "N/A",
        product.degradationRoute || "N/A",
        product.environmentalConditions || "N/A",
        product.toxicityData || "N/A",
      ])

      // Tentar usar autoTable, com fallback manual
      try {
        // Verificar se autoTable está disponível
        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            head: [["Produto de Degradação", "Via de Degradação", "Condições Ambientais", "Dados de Toxicidade"]],
            body: tableData,
            startY: yPosition,
            styles: {
              fontSize: 8,
              cellPadding: 3,
              overflow: "linebreak",
              valign: "top",
              halign: "left",
            },
            headStyles: {
              fillColor: [59, 130, 246], // blue-500
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252], // slate-50
            },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 45 },
              2: { cellWidth: 50 },
              3: { cellWidth: 45 },
            },
            margin: { left: 20, right: 20 },
            theme: "grid",
          })

          yPosition = (doc as any).lastAutoTable.finalY + 15
        } else {
          throw new Error("autoTable não disponível")
        }
      } catch (autoTableError) {
        console.warn("AutoTable falhou, usando método manual:", autoTableError)

        // Fallback: criar tabela manualmente
        yPosition += 5

        // Cabeçalhos da tabela
        doc.setFillColor(59, 130, 246) // blue-500
        doc.rect(20, yPosition - 3, 170, 8, "F")

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text("Produto de Degradação", 22, yPosition + 2)
        doc.text("Via de Degradação", 62, yPosition + 2)
        doc.text("Condições Ambientais", 102, yPosition + 2)
        doc.text("Dados de Toxicidade", 142, yPosition + 2)

        yPosition += 10

        // Linhas da tabela
        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")

        report.products.forEach((product, index) => {
          // Alternar cor de fundo
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252) // slate-50
            doc.rect(20, yPosition - 3, 170, 12, "F")
          }

          // Quebrar texto se necessário
          const substance = doc.splitTextToSize(product.substance || "N/A", 38)
          const route = doc.splitTextToSize(product.degradationRoute || "N/A", 38)
          const conditions = doc.splitTextToSize(product.environmentalConditions || "N/A", 38)
          const toxicity = doc.splitTextToSize(product.toxicityData || "N/A", 38)

          // Calcular altura necessária
          const maxLines = Math.max(substance.length, route.length, conditions.length, toxicity.length)

          // Verificar se precisa de nova página
          if (yPosition + maxLines * 4 > 270) {
            doc.addPage()
            yPosition = 20
          }

          // Adicionar texto
          doc.text(substance, 22, yPosition + 2)
          doc.text(route, 62, yPosition + 2)
          doc.text(conditions, 102, yPosition + 2)
          doc.text(toxicity, 142, yPosition + 2)

          yPosition += Math.max(12, maxLines * 4 + 2)
        })

        yPosition += 10
      }
    } else {
      // Caso não haja produtos
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("Nenhum produto de degradação encontrado.", 20, yPosition)
      yPosition += 20
    }

    // Seção de Referências
    if (report.references && report.references.length > 0) {
      // Verificar se precisa de nova página
      if (yPosition > 220) {
        doc.addPage()
        yPosition = 30
      }

      // Título da seção
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("Referências Bibliográficas", 20, yPosition)
      yPosition += 15

      // Adicionar referências
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(40, 40, 40)

      report.references.forEach((reference, index) => {
        const referenceText = `${index + 1}. ${reference}`

        // Quebrar texto para caber na página
        const splitText = doc.splitTextToSize(referenceText, 170)

        // Verificar se precisa de nova página
        if (yPosition + splitText.length * 4 > 270) {
          doc.addPage()
          yPosition = 30
        }

        // Adicionar referência
        doc.text(splitText, 20, yPosition)
        yPosition += splitText.length * 4 + 3
      })
    }

    // Footer em todas as páginas
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      // Linha do footer
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 285, 190, 285)

      // Texto do footer
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text("Gerado por DegradScan", 20, 292)

      const pageText = `Página ${i} de ${pageCount}`
      const pageTextWidth = doc.getTextWidth(pageText)
      doc.text(pageText, 190 - pageTextWidth, 292)

      const timestamp = new Date().toLocaleString("pt-BR")
      const timestampWidth = doc.getTextWidth(timestamp)
      doc.text(timestamp, (210 - timestampWidth) / 2, 292)
    }

    // Salvar o PDF
    const cleanSubstanceName = searchTerm.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")
    const dateString = new Date().toISOString().split("T")[0]
    const filename = `DegradScan_${cleanSubstanceName}_${dateString}.pdf`

    doc.save(filename)
  } catch (error) {
    console.error("Erro detalhado ao gerar PDF:", error)
    throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }
}
