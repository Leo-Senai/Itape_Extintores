
import { useMemo } from 'react'
import { AppData, calcularLucroVenda } from '../types'

interface Props {
  data: AppData
}

const fmt = (valor: number) =>
  valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const fmtN = (valor: number, casas = 2) =>
  valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })

function getSegundaFeira(data: Date) {
  const d = new Date(data)
  const dia = d.getDay()
  const diferenca = dia === 0 ? -6 : 1 - dia

  d.setDate(d.getDate() + diferenca)
  d.setHours(0, 0, 0, 0)

  return d
}

export default function Relatorio({ data }: Props) {
  const { produtos, vendas } = data

  const hoje = new Date()

  const semanaInicio = getSegundaFeira(hoje)

  const semanaFim = new Date(semanaInicio)
  semanaFim.setDate(semanaFim.getDate() + 6)
  semanaFim.setHours(23, 59, 59, 999)

  /*
   * =========================
   * VENDAS DA SEMANA
   * =========================
   */

  const vendasSemana = useMemo(() => {
    return vendas.filter(venda => {
      const dataVenda = new Date(
        venda.data + 'T12:00:00'
      )

      return (
        dataVenda >= semanaInicio &&
        dataVenda <= semanaFim
      )
    })
  }, [vendas, semanaInicio, semanaFim])

  /*
   * =========================
   * RESUMO FINANCEIRO
   * =========================
   *
   * comprado = custo dos produtos vendidos
   * revendido = valor total das vendas
   * impostos = impostos das vendas
   * lucro = revendido - comprado - impostos
   */

  const resumo = useMemo(() => {
    let comprado = 0
    let revendido = 0
    let impostos = 0
    let lucro = 0
    let unidades = 0

    vendasSemana.forEach(venda => {
      const produto = produtos.find(
        produto => produto.id === venda.produtoId
      )

      if (!produto) return

      const calculo = calcularLucroVenda(
        venda,
        produto
      )

      comprado += calculo.custo
      revendido += calculo.receita
      impostos += calculo.impostos
      lucro += calculo.lucro
      unidades += venda.quantidade
    })

    return {
      comprado,
      revendido,
      impostos,
      lucro,
      unidades,
    }
  }, [vendasSemana, produtos])

  /*
   * =========================
   * ESTOQUE
   * =========================
   */

  const totalEstoque = produtos.reduce(
    (total, produto) =>
      total + produto.estoque,
    0
  )

  const valorEstoqueCompra = produtos.reduce(
    (total, produto) =>
      total +
      produto.estoque *
        produto.custoCompra,
    0
  )

  const valorEstoqueVenda = produtos.reduce(
    (total, produto) =>
      total +
      produto.estoque *
        produto.precoVenda,
    0
  )

  /*
   * =========================
   * DATA
   * =========================
   */

  const formatarData = (data: Date) =>
    data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  /*
   * =========================
   * IMPRIMIR
   * =========================
   */

  const imprimir = () => {
    window.print()
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#ffffff',
        color: '#111827',
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* =========================
          CABEÇALHO
      ========================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Relatórios
          </h1>

          <p
            style={{
              margin: '5px 0 0',
              color: '#6b7280',
              fontSize: 13,
            }}
          >
            Resumo financeiro das vendas
          </p>

          <div
            style={{
              marginTop: 6,
              color: '#9ca3af',
              fontSize: 11,
            }}
          >
            Semana: {formatarData(semanaInicio)} até{' '}
            {formatarData(semanaFim)}
          </div>
        </div>

        <button
          onClick={imprimir}
          style={{
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            color: '#111827',
            borderRadius: 8,
            padding: '10px 15px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Imprimir relatório
        </button>
      </div>

      {/* =========================
          EMPRESA
      ========================= */}

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 18,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          🧯
        </div>

        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            ITAPE Extintores
          </div>

          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color: '#9ca3af',
            }}
          >
            Relatório financeiro semanal
          </div>
        </div>
      </div>

      {/* =========================
          PRINCIPAIS VALORES
      ========================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: 14,
        }}
      >
        <InfoCard
          titulo="Total comprado"
          valor={fmt(resumo.comprado)}
          descricao="Custo dos extintores vendidos"
        />

        <InfoCard
          titulo="Total revendido"
          valor={fmt(resumo.revendido)}
          descricao={`${resumo.unidades} unidades vendidas`}
        />

        <InfoCard
          titulo="Impostos"
          valor={fmt(resumo.impostos)}
          descricao="Total dos impostos"
          cor="#b45309"
        />

        <InfoCard
          titulo="Lucro total"
          valor={fmt(resumo.lucro)}
          descricao={
            resumo.revendido > 0
              ? `Margem ${fmtN(
                  (resumo.lucro /
                    resumo.revendido) *
                    100
                )}%`
              : 'Sem vendas'
          }
          cor={
            resumo.lucro >= 0
              ? '#15803d'
              : '#dc2626'
          }
        />
      </div>

      {/* =========================
          RESUMO SIMPLES
      ========================= */}

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom:
              '1px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Resumo financeiro
          </h2>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: '#9ca3af',
            }}
          >
            Resultado das vendas realizadas nesta semana
          </p>
        </div>

        <div
          style={{
            padding: 18,
          }}
        >
          <Linha
            titulo="Valor dos produtos comprados"
            valor={resumo.comprado}
          />

          <Linha
            titulo="Valor total revendido"
            valor={resumo.revendido}
            destaque
          />

          <Linha
            titulo="Impostos"
            valor={-resumo.impostos}
            cor="#b45309"
          />

          <Linha
            titulo="Lucro total"
            valor={resumo.lucro}
            cor={
              resumo.lucro >= 0
                ? '#15803d'
                : '#dc2626'
            }
            destaque
          />
        </div>
      </section>

      {/* =========================
          ESTOQUE
      ========================= */}

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#ffffff',
          padding: 18,
        }}
      >
        <div
          style={{
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Estoque atual
          </h2>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: '#9ca3af',
            }}
          >
            Quantidade e valor dos extintores disponíveis
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <MiniCard
            titulo="UNIDADES"
            valor={`${totalEstoque} un.`}
          />

          <MiniCard
            titulo="VALOR DE COMPRA"
            valor={fmt(valorEstoqueCompra)}
          />

          <MiniCard
            titulo="VALOR DE VENDA"
            valor={fmt(valorEstoqueVenda)}
            cor="#15803d"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 8,
          }}
        >
          {produtos.map(produto => (
            <div
              key={produto.id}
              style={{
                border:
                  '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                background: '#fafafa',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {produto.nome}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: '#9ca3af',
                  }}
                >
                  {fmt(
                    produto.precoVenda
                  )}{' '}
                  / unidade
                </div>
              </div>

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color:
                    produto.estoque <= 5
                      ? '#dc2626'
                      : produto.estoque <= 10
                      ? '#b45309'
                      : '#15803d',
                }}
              >
                {produto.estoque}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          QUANDO NÃO HÁ VENDAS
      ========================= */}

      {vendasSemana.length === 0 && (
        <div
          style={{
            border:
              '1px dashed #d1d5db',
            borderRadius: 10,
            padding: 25,
            textAlign: 'center',
            color: '#6b7280',
            fontSize: 13,
            background: '#fafafa',
          }}
        >
          Nenhuma venda registrada
          nesta semana.
        </div>
      )}
    </div>
  )
}

/* =========================
   CARD PRINCIPAL
========================= */

function InfoCard({
  titulo,
  valor,
  descricao,
  cor = '#111827',
}: {
  titulo: string
  valor: string
  descricao: string
  cor?: string
}) {
  return (
    <div
      style={{
        border:
          '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 18,
        background: '#ffffff',
        minHeight: 125,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#9ca3af',
          letterSpacing: '.05em',
        }}
      >
        {titulo.toUpperCase()}
      </div>

      <div>
        <div
          style={{
            marginTop: 10,
            fontSize: 21,
            fontWeight: 700,
            color: cor,
          }}
        >
          {valor}
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            color: '#9ca3af',
          }}
        >
          {descricao}
        </div>
      </div>
    </div>
  )
}

/* =========================
   MINI CARD
========================= */

function MiniCard({
  titulo,
  valor,
  cor = '#111827',
}: {
  titulo: string
  valor: string
  cor?: string
}) {
  return (
    <div
      style={{
        border:
          '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '12px 14px',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: '#9ca3af',
          letterSpacing: '.04em',
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 13,
          fontWeight: 700,
          color: cor,
        }}
      >
        {valor}
      </div>
    </div>
  )
}

/* =========================
   LINHA FINANCEIRA
========================= */

function Linha({
  titulo,
  valor,
  cor = '#111827',
  destaque = false,
}: {
  titulo: string
  valor: number
  cor?: string
  destaque?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        alignItems: 'center',
        padding: '13px 4px',
        borderTop: destaque
          ? '1px solid #e5e7eb'
          : undefined,
        marginTop: destaque ? 4 : 0,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: destaque
            ? 700
            : 500,
          color: destaque
            ? '#111827'
            : '#6b7280',
        }}
      >
        {titulo}
      </span>

      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: cor,
        }}
      >
        {valor < 0
          ? `- ${fmt(-valor)}`
          : fmt(valor)}
      </span>
    </div>
  )
}

