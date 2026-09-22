import { useState } from 'react'
import { AppData, Venda, calcularLucroVenda } from '../types'

interface Props { data: AppData }
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Vendas({ data }: Props) {
  const { produtos, vendas, setVendas, setProdutos } = data
  const [form, setForm] = useState({ produtoId: '', quantidade: 1, precoUnitario: 0, data: new Date().toISOString().split('T')[0], cliente: '' })
  const [mostrando, setMostrando] = useState(false)

  const produtoSel = produtos.find(p => p.id === form.produtoId)

  const abrirNova = () => {
    setForm({ produtoId: '', quantidade: 1, precoUnitario: 0, data: new Date().toISOString().split('T')[0], cliente: '' })
    setMostrando(true)
  }

  const onProdutoChange = (id: string) => {
    const p = produtos.find(p => p.id === id)
    setForm(prev => ({ ...prev, produtoId: id, precoUnitario: p?.precoVenda ?? 0 }))
  }

  const salvar = () => {
    if (!form.produtoId || form.quantidade <= 0) return
    const p = produtos.find(p => p.id === form.produtoId)
    if (!p) return
    if (form.quantidade > p.estoque) { alert(`Estoque insuficiente. Disponível: ${p.estoque} unidades.`); return }

    const novaVenda: Venda = { id: Date.now().toString(), ...form }
    setVendas(prev => [novaVenda, ...prev])
    setProdutos(prev => prev.map(prod => prod.id === form.produtoId ? { ...prod, estoque: prod.estoque - form.quantidade } : prod))
    setMostrando(false)
  }

  const excluir = (v: Venda) => {
    if (!confirm('Cancelar esta venda e devolver ao estoque?')) return
    setVendas(prev => prev.filter(x => x.id !== v.id))
    setProdutos(prev => prev.map(p => p.id === v.produtoId ? { ...p, estoque: p.estoque + v.quantidade } : p))
  }

  const selStyle = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: '8px 12px',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-ui)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  const inputStyle = { ...selStyle }

  const preview = produtoSel ? calcularLucroVenda({ ...form, id: '', } as any, produtoSel) : null

  const vendasOrd = [...vendas].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Vendas</h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>{vendas.length} REGISTROS</span>
        </div>
        <button onClick={abrirNova} style={{ background: 'var(--color-red)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, padding: '8px 18px', borderRadius: 7, cursor: 'pointer' }}>
          + Registrar Venda
        </button>
      </div>

      {mostrando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 28, width: 460, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Registrar Venda</h2>
              <button onClick={() => setMostrando(false)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>PRODUTO</label>
              <select value={form.produtoId} onChange={e => onProdutoChange(e.target.value)} style={selStyle}>
                <option value="">Selecione um produto...</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} — Estoque: {p.estoque}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'QUANTIDADE', key: 'quantidade', type: 'number' },
                { label: 'PREÇO UNITÁRIO (R$)', key: 'precoUnitario', type: 'number' },
                { label: 'DATA', key: 'data', type: 'date' },
                { label: 'CLIENTE', key: 'cliente', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--color-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
              ))}
            </div>

            {preview && produtoSel && (
              <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--color-muted)' }}>Receita: <strong style={{ color: 'var(--color-text)' }}>{fmt(preview.receita)}</strong></span>
                <span style={{ color: 'var(--color-muted)' }}>Imposto: <strong style={{ color: '#f59e0b' }}>{fmt(preview.impostos)}</strong></span>
                <span style={{ color: 'var(--color-muted)' }}>Lucro: <strong style={{ color: 'var(--color-green)' }}>{fmt(preview.lucro)}</strong></span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setMostrando(false)} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontFamily: 'var(--font-ui)', fontSize: 13, padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvar} style={{ background: 'var(--color-red)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>Confirmar Venda</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              {['Data', 'Cliente', 'Produto', 'Qtd', 'Preço Unit.', 'Receita Bruta', 'Imposto', 'Lucro Líquido', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.06em', fontWeight: 500 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendasOrd.map((v, i) => {
              const p = produtos.find(p => p.id === v.produtoId)
              if (!p) return null
              const c = calcularLucroVenda(v, p)
              return (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)' }}>{new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{v.cliente || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-muted)' }}>{p.nome}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{v.quantidade}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{fmt(v.precoUnitario)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{fmt(c.receita)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{fmt(c.impostos)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: c.lucro >= 0 ? 'var(--color-green)' : '#ef4444' }}>{fmt(c.lucro)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => excluir(v)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Cancelar</button>
                  </td>
                </tr>
              )
            })}
            {vendasOrd.length === 0 && (
              <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted)' }}>Nenhuma venda registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
