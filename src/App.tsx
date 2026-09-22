import { useState, useMemo } from 'react'
import Dashboard from './components/Dashboard'
import Produtos from './components/Produtos'
import Vendas from './components/Vendas'
import Relatorio from './components/Relatorio'
import { AppData, Produto, Venda } from './types'

const seedProdutos: Produto[] = [
  { id: '1', nome: 'Extintor CO₂ 6kg', tipo: 'CO₂', capacidade: '6kg', custoCompra: 185.00, precoVenda: 320.00, aliquotaImposto: 12, estoque: 14 },
  { id: '2', nome: 'Extintor Pó ABC 4kg', tipo: 'Pó ABC', capacidade: '4kg', custoCompra: 62.00, precoVenda: 110.00, aliquotaImposto: 12, estoque: 28 },
  { id: '3', nome: 'Extintor Pó ABC 6kg', tipo: 'Pó ABC', capacidade: '6kg', custoCompra: 78.00, precoVenda: 135.00, aliquotaImposto: 12, estoque: 20 },
  { id: '4', nome: 'Extintor Água 10L', tipo: 'Água', capacidade: '10L', custoCompra: 95.00, precoVenda: 165.00, aliquotaImposto: 12, estoque: 9 },
  { id: '5', nome: 'Extintor Espuma 9L', tipo: 'Espuma', capacidade: '9L', custoCompra: 110.00, precoVenda: 190.00, aliquotaImposto: 12, estoque: 6 },
]

const hoje = new Date()
const diasSemana = [-6, -5, -4, -3, -2, -1, 0]

const seedVendas: Venda[] = [
  { id: 'v1', produtoId: '2', quantidade: 3, precoUnitario: 110.00, data: new Date(hoje.getTime() - 6*86400000).toISOString().split('T')[0], cliente: 'Mercado Bom Preço' },
  { id: 'v2', produtoId: '3', quantidade: 2, precoUnitario: 135.00, data: new Date(hoje.getTime() - 5*86400000).toISOString().split('T')[0], cliente: 'Auto Peças Silva' },
  { id: 'v3', produtoId: '1', quantidade: 1, precoUnitario: 320.00, data: new Date(hoje.getTime() - 4*86400000).toISOString().split('T')[0], cliente: 'Escritório Central' },
  { id: 'v4', produtoId: '4', quantidade: 2, precoUnitario: 165.00, data: new Date(hoje.getTime() - 3*86400000).toISOString().split('T')[0], cliente: 'Condomínio Res. Planalto' },
  { id: 'v5', produtoId: '2', quantidade: 5, precoUnitario: 110.00, data: new Date(hoje.getTime() - 2*86400000).toISOString().split('T')[0], cliente: 'Indústria Têxtil Morais' },
  { id: 'v6', produtoId: '5', quantidade: 1, precoUnitario: 190.00, data: new Date(hoje.getTime() - 1*86400000).toISOString().split('T')[0], cliente: 'Restaurante Sabor & Arte' },
  { id: 'v7', produtoId: '3', quantidade: 4, precoUnitario: 135.00, data: hoje.toISOString().split('T')[0], cliente: 'Farmácia Popular' },
]

type Tab = 'dashboard' | 'produtos' | 'vendas' | 'relatorio'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [produtos, setProdutos] = useState<Produto[]>(seedProdutos)
  const [vendas, setVendas] = useState<Venda[]>(seedVendas)

  const data: AppData = { produtos, vendas, setProdutos, setVendas }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'produtos', label: 'Produtos', icon: '🔴' },
    { id: 'vendas', label: 'Vendas', icon: '↗' },
    { id: 'relatorio', label: 'Relatório Semanal', icon: '≡' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 58,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--color-red)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 0 14px var(--color-red-glow)',
          }}>🧯</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1 }}>ITAPE</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>EXTINTORES</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                background: tab === t.id ? 'var(--color-red-glow)' : 'transparent',
                color: tab === t.id ? 'var(--color-red)' : 'var(--color-muted)',
                borderBottom: tab === t.id ? '2px solid var(--color-red)' : '2px solid transparent',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 12 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-muted)',
          background: 'var(--color-surface-2)',
          padding: '4px 10px',
          borderRadius: 4,
          border: '1px solid var(--color-border)',
        }}>
          {hoje.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
        {tab === 'dashboard' && <Dashboard data={data} />}
        {tab === 'produtos' && <Produtos data={data} />}
        {tab === 'vendas' && <Vendas data={data} />}
        {tab === 'relatorio' && <Relatorio data={data} />}
      </main>
    </div>
  )
}
