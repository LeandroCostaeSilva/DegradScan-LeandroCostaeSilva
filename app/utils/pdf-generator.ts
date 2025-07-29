interface DegradationData {
  id: string
  substance: string
  pathway: string
  products: string[]
  conditions: string
  rate: string
  halfLife: string
  mechanism: string
  references: string[]
  environmental_impact: string
  toxicity: string
  biodegradability: string
}

export async function generatePDF(data: DegradationData[], searchTerm: string): Promise<void> {
  try {
    // Importação dinâmica para evitar problemas de SSR
    const jsPDF = (await import("jspdf")).default
    const autoTable = (await import("jspdf-autotable")).default

    // Criar nova instância do PDF
    const doc = new jsPDF()

    // Configurar fonte
    doc.setFont("helvetica")

    // Título
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("DegradScan - Relatório de Análise", 20, 30)

    // Subtítulo
    doc.setFontSize(14)
    doc.setTextColor(80, 80, 80)
    doc.text(`Substância: ${searchTerm}`, 20, 45)

    // Data
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 55)

    let yPosition = 70

    // Para cada resultado
    data.forEach((result, index) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 30
      }

      // Título da seção
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text(`${index + 1}. Análise de ${result.substance}`, 20, yPosition)
      yPosition += 15

      // Dados principais em tabela
      const tableData = [
        ["Via de Degradação", result.pathway],
        ["Produtos Formados", result.products.join(", ")],
        ["Condições", result.conditions],
        ["Taxa de Degradação", result.rate],
        ["Meia-vida", result.halfLife],
        ["Mecanismo", result.mechanism],
        ["Impacto Ambiental", result.environmental_impact],
        ["Toxicidade", result.toxicity],
        ["Biodegradabilidade", result.biodegradability],
      ]

      // Usar autoTable se disponível, senão usar método manual
      if (typeof autoTable === "function") {
        autoTable(doc, {
          startY: yPosition,
          head: [["Parâmetro", "Valor"]],
          body: tableData,
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [70, 130, 180],
            textColor: 255,
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 20, right: 20 },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      } else {
        // Método manual se autoTable não estiver disponível
        doc.setFontSize(10)
        tableData.forEach(([param, value]) => {
          doc.setTextColor(60, 60, 60)
          doc.text(`${param}:`, 20, yPosition)
          doc.setTextColor(40, 40, 40)

          // Quebrar texto longo
          const splitValue = doc.splitTextToSize(value, 120)
          doc.text(splitValue, 80, yPosition)
          yPosition += splitValue.length * 5 + 2
        })
        yPosition += 10
      }

      // Referências
      if (result.references.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(40, 40, 40)
        doc.text("Referências:", 20, yPosition)
        yPosition += 8

        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        result.references.forEach((ref, refIndex) => {
          const refText = `[${refIndex + 1}] ${ref}`
          const splitRef = doc.splitTextToSize(refText, 170)
          doc.text(splitRef, 25, yPosition)
          yPosition += splitRef.length * 4 + 3
        })
        yPosition += 10
      }
    })

    // Salvar o PDF
    doc.save(`degradscan-${searchTerm.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw new Error("Falha na geração do PDF")
  }
}
