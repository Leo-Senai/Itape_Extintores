import { useMemo } from 'react'
import { AppData, calcularLucroVenda } from '../types'

interface Props { data: AppData }
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtN = (v: number, d = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

function getSegundaFeira(d: Date) {
  const dia = new Date(d)
  const dow = dia.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  dia.setDate(dia.getDate() + diff)
  dia.setHours(0, 0, 0, 0)
  return dia
}

export default function Relatorio({ data }: Props) {
  const { produtos, vendas } = data

  const hoje = new Date()
  const semanaInicio = getSegundaFeira(hoje)
  const semanaFim = new Date(semanaInicio)
  semanaFim.setDate(semanaFim.getDate() + 6)
  semanaFim.setHours(23, 59, 59)

  const fmtData = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const vendasSemana = vendas.filter(v => {
    const dv = new Date(v.data + 'T12:00:00')
    return dv >= semanaInicio && dv <= semanaFim
  })

  const totais = useMemo(() => {
    let receita = 0, impostos = 0, custo = 0, lucro = 0, unidades = 0
    for (const v of vendasSemana) {
      const p = produtos.find(p => p.id === v.produtoId)
      if (!p) continue
      const c = calcularLucroVenda(v, p)
      receita += c.receita
      impostos += c.impostos
      custo += c.custo
      lucro += c.lucro
      unidades += v.quantidade
    }
    return { receita, impostos, custo, lucro, unidades }
  }, [vendasSemana, produtos])

  const porProduto = useMemo(() => {
    return produtos.map(p => {
      const pvs = vendasSemana.filter(v => v.produtoId === p.id)
      const qtd = pvs.reduce((s, v) => s + v.quantidade, 0)
      let receita = 0, impostos = 0, custo = 0, lucro = 0
      for (const v of pvs) {
        const c = calcularLucroVenda(v, p)
        receita += c.receita; impostos += c.impostos; custo += c.custo; lucro += c.lucro
      }
      return { ...p, qtd, receita, impostos, custo, lucro }
    }).sort((a, b) => b.receita - a.receita)
  }, [vendasSemana, produtos])

  // Vendas por dia da semana
  const diasLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const porDia = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaInicio)
    d.setDate(d.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    const pvs = vendasSemana.filter(v => v.data === ds)
    const receita = pvs.reduce((s, v) => {
      const p = produtos.find(p => p.id === v.produtoId)
      return s + (p ? v.quantidade * v.precoUnitario : 0)
    }, 0)
    return { label: diasLabels[i], data: ds, receita }
  })

  const maxReceita = Math.max(...porDia.map(d => d.receita), 1)

  const totalEstoque = produtos.reduce((s, p) => s + p.estoque, 0)
  const valorEstoque = produtos.reduce((s, p) => s + p.estoque * p.precoVenda, 0)
  const valorEstoqueCompra = produtos.reduce((s, p) => s + p.estoque * p.custoCompra, 0)

  const printRelatorio = () => window.print()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Relatório Semanal</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
            {fmtData(semanaInicio)} — {fmtData(semanaFim)}
          </div>
        </div>
        <button onClick={printRelatorio} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-ui)', fontSize: 13, padding: '8px 18px', borderRadius: 7, cursor: 'pointer' }}>
          ⬇ Exportar / Imprimir
        </button>
      </div>

      {/* Cabeçalho empresa */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--color-red)' }}>
        <div style={{ width: 48, height: 48, background: 'var(--color-red)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧯</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>ITAPE Extintores</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', letterSpacing: '0.06em' }}>RELATÓRIO DE DESEMPENHO SEMANAL — GERADO EM {hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase()}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Receita Bruta', value: fmt(totais.receita), color: 'var(--color-text)' },
          { label: 'Custo Produtos', value: fmt(totais.custo), color: '#ef4444' },
          { label: 'Impostos Pagos', value: fmt(totais.impostos), color: '#f59e0b' },
          { label: 'Lucro Líquido', value: fmt(totais.lucro), color: 'var(--color-green)' },
          { label: 'Unidades Vendidas', value: totais.unidades.toString(), color: 'var(--color-red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Gráfico de barras por dia */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>RECEITA POR DIA DA SEMANA</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
            {porDia.map(d => {
              const h = maxReceita > 0 ? (d.receita / maxReceita) * 100 : 0
              const isHoje = d.data === hoje.toISOString().split('T')[0]
              return (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  {d.receita > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)' }}>{fmt(d.receita).replace('R$\xa0', '')}</div>}
                  <div style={{ width: '100%', background: isHoje ? 'var(--color-red)' : 'var(--color-surface-2)', borderRadius: '4px 4px 0 0', height: `${Math.max(h, d.receita > 0 ? 4 : 0)}%`, transition: 'height 0.3s', border: `1px solid ${isHoje ? 'var(--color-red)' : 'var(--color-border)'}` }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isHoje ? 'var(--color-red)' : 'var(--color-muted)', fontWeight: isHoje ? 700 : 400 }}>{d.label}</div>
                </div>
              )
            })}
          </div>
          {totais.receita === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, marginTop: 8 }}>Sem vendas registradas esta semana</div>
          )}
        </div>

        {/* Resultado financeiro detalhado */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>DRE SIMPLIFICADO — SEMANA</div>
          {[
            { label: '(+) Receita Bruta de Vendas', value: totais.receita, indent: 0, bold: false, color: 'var(--color-text)' },
            { label: '(-) Impostos sobre Vendas', value: -totais.impostos, indent: 1, bold: false, color: '#f59e0b' },
            { label: '(=) Receita Líquida', value: totais.receita - totais.impostos, indent: 0, bold: false, color: 'var(--color-text)', separator: true },
            { label: '(-) Custo dos Produtos Vendidos', value: -totais.custo, indent: 1, bold: false, color: '#ef4444' },
            { label: '(=) LUCRO OPERACIONAL LÍQUIDO', value: totais.lucro, indent: 0, bold: true, color: totais.lucro >= 0 ? 'var(--color-green)' : '#ef4444', separator: true },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: `8px 0 8px ${r.indent * 14}px`, borderTop: r.separator ? '1px solid var(--color-border)' : undefined, marginTop: r.separator ? 4 : 0 }}>
              <span style={{ fontSize: 12, color: r.bold ? r.color : 'var(--color-muted)', fontWeight: r.bold ? 700 : 400 }}>{r.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: r.color, fontWeight: r.bold ? 700 : 400 }}>
                {r.value < 0 ? `- ${fmt(-r.value)}` : fmt(r.value)}
              </span>
            </div>
          ))}
          {totais.receita > 0 && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--color-muted)' }}>
              Margem líquida: <strong style={{ color: 'var(--color-text)' }}>{fmtN(totais.lucro / totais.receita * 100)}%</strong>
              &nbsp;·&nbsp; Ticket médio: <strong style={{ color: 'var(--color-text)' }}>{fmt(totais.receita / vendasSemana.length || 0)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Tabela por produto */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)', letterSpacing: '0.06em' }}>DESEMPENHO POR PRODUTO</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Produto', 'Qtd Vendida', 'Receita Bruta', 'Impostos', 'Custo', 'Lucro Líquido', 'Margem', 'Estoque Restante'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.06em', fontWeight: 500 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {porProduto.map((p, i) => {
              const margem = p.receita > 0 ? p.lucro / p.receita * 100 : 0
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 500 }}>
                    {p.nome}
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{p.tipo} · {p.capacidade}</div>
                  </td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', textAlign: 'center', color: p.qtd > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>{p.qtd}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)' }}>{p.receita > 0 ? fmt(p.receita) : '—'}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{p.impostos > 0 ? fmt(p.impostos) : '—'}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>{p.custo > 0 ? fmt(p.custo) : '—'}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', color: p.lucro > 0 ? 'var(--color-green)' : p.lucro < 0 ? '#ef4444' : 'var(--color-muted)' }}>{p.receita > 0 ? fmt(p.lucro) : '—'}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', color: margem >= 20 ? 'var(--color-green)' : margem > 0 ? '#f59e0b' : 'var(--color-muted)' }}>{p.receita > 0 ? `${fmtN(margem)}%` : '—'}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', padding: '2px 10px', borderRadius: 4, background: p.estoque <= 5 ? 'rgba(239,68,68,0.15)' : p.estoque <= 10 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.1)', color: p.estoque <= 5 ? '#ef4444' : p.estoque <= 10 ? '#f59e0b' : 'var(--color-green)' }}>
                      {p.estoque} un
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-surface-2)', fontWeight: 700 }}>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--color-muted)' }}>TOTAL SEMANA</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{totais.unidades}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{fmt(totais.receita)}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{fmt(totais.impostos)}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>{fmt(totais.custo)}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--color-green)' }}>{fmt(totais.lucro)}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: totais.receita > 0 ? 'var(--color-green)' : 'var(--color-muted)' }}>{totais.receita > 0 ? `${fmtN(totais.lucro / totais.receita * 100)}%` : '—'}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                <span style={{ color: 'var(--color-muted)' }}>{totalEstoque} un</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Estoque final */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>POSIÇÃO DE ESTOQUE — FIM DE SEMANA</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Total de Unidades', value: `${totalEstoque} un`, color: 'var(--color-text)' },
            { label: 'Valor a Preço de Custo', value: fmt(valorEstoqueCompra), color: '#f59e0b' },
            { label: 'Valor a Preço de Venda', value: fmt(valorEstoque), color: 'var(--color-green)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {produtos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)', border: `1px solid ${p.estoque <= 5 ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`, borderRadius: 7, padding: '8px 12px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{p.nome}</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>{fmt(p.precoVenda)}/un</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: p.estoque <= 5 ? '#ef4444' : p.estoque <= 10 ? '#f59e0b' : 'var(--color-green)', fontSize: 16 }}>{p.estoque}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
