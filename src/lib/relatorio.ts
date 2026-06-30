import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Area, Categoria, Despesa } from './types'
import { getCategoriaNome } from './categories'
import { formatCurrency, formatDate } from './utils'

function totalArea(areaId: string, despesas: Despesa[]) {
  return despesas.filter((d) => d.areaId === areaId).reduce((s, d) => s + d.valor, 0)
}

export function gerarRelatorioPDF(areas: Area[], despesas: Despesa[], categorias: Categoria[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const hoje = new Date().toLocaleDateString('pt-BR')
  const largura = doc.internal.pageSize.getWidth()

  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, largura, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Gestão Plantio', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório de Despesas por Área', 14, 16)
  doc.text(`Gerado em: ${hoje}`, largura - 14, 16, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo por área', 14, 32)

  const resumoLinhas = areas.map((a) => {
    const gasto = totalArea(a.id, despesas)
    const custoPorHa = a.hectares > 0 ? gasto / a.hectares : 0
    const pct =
      a.orcamento && a.orcamento > 0
        ? `${((gasto / a.orcamento) * 100).toFixed(1)}%`
        : '—'
    return [
      a.nome,
      a.cultura ?? '—',
      `${a.hectares.toFixed(2)} ha`,
      a.orcamento ? formatCurrency(a.orcamento) : '—',
      formatCurrency(gasto),
      formatCurrency(custoPorHa) + '/ha',
      pct,
    ]
  })

  const totalGeral = despesas.reduce((s, d) => s + d.valor, 0)
  const totalOrc = areas.reduce((s, a) => s + (a.orcamento ?? 0), 0)
  const totalHa = areas.reduce((s, a) => s + a.hectares, 0)

  autoTable(doc, {
    startY: 36,
    head: [['Área', 'Cultura', 'Hectares', 'Orçamento', 'Gasto', 'Custo/ha', '% Orç.']],
    body: resumoLinhas,
    foot: [[
      'TOTAL', '',
      `${totalHa.toFixed(2)} ha`,
      totalOrc ? formatCurrency(totalOrc) : '—',
      formatCurrency(totalGeral),
      totalHa > 0 ? formatCurrency(totalGeral / totalHa) + '/ha' : '—',
      totalOrc ? `${((totalGeral / totalOrc) * 100).toFixed(1)}%` : '—',
    ]],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 248] },
  })

  const yAposResumo = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalhamento de despesas', 14, yAposResumo)

  const despesasOrdenadas = [...despesas].sort((a, b) => (a.data < b.data ? 1 : -1))
  const areaNomePorId = new Map(areas.map((a) => [a.id, a.nome]))

  autoTable(doc, {
    startY: yAposResumo + 4,
    head: [['Data', 'Área', 'Categoria', 'Descrição', 'Valor']],
    body: despesasOrdenadas.map((d) => [
      formatDate(d.data),
      areaNomePorId.get(d.areaId) ?? '—',
      getCategoriaNome(categorias, d.categoria),
      d.descricao ?? '—',
      formatCurrency(d.valor),
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 248] },
    columnStyles: { 4: { halign: 'right' } },
  })

  const totalPaginas = (doc as jsPDF & { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      `Gestão Plantio · Página ${i} de ${totalPaginas}`,
      largura / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    )
  }

  doc.save(`relatorio-plantio-${new Date().toISOString().slice(0, 10)}.pdf`)
}
