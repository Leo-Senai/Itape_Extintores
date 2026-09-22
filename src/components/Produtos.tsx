
import { useMemo, useState } from 'react'
import { AppData, calcularLucroVenda } from '../types'

interface Props {
  data: AppData
}

const fmt = (valor: number) =>
  valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

export default function Dashboard({ data }: Props) {
  const { produtos, vendas } = data

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<string | null>(null)

  const hoje = new Date()
    .toISOString()
    .split('T')[0]

  const seteDiasAtras = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split('T')[0]

  const vendasSemana = vendas.filter(
    venda =>
      venda.data >= seteDiasAtras &&
      venda.data <= hoje
  )

  /*
   * ==============================
   * CÁLCULOS
   * ==============================
   */

  let receita = 0
  let impostos = 0
  let custos = 0
  let lucro = 0

  vendasSemana.forEach(venda => {
    const produto = produtos.find(
      p => p.id === venda.produtoId
    )

    if (!produto) return

    const calculo = calcularLucroVenda(
      venda,
      produto
    )

    receita += calculo.receita
    impostos += calculo.impostos
    custos += calculo.custo
    lucro += calculo.lucro
  })

  const totalEstoque = produtos.reduce(
    (total, produto) =>
      total + produto.estoque,
    0
  )

  const valorEstoque = produtos.reduce(
    (total, produto) =>
      total +
      produto.estoque *
        produto.custoCompra,
    0
  )

  const valorVendaEstoque =
    produtos.reduce(
      (total, produto) =>
        total +
        produto.estoque *
          produto.precoVenda,
      0
    )

  const lucroEstoque =
    produtos.reduce((total, produto) => {
      const imposto =
        produto.precoVenda *
        (produto.aliquotaImposto / 100)

      const lucroUnitario =
        produto.precoVenda -
        produto.custoCompra -
        imposto

      return (
        total +
        lucroUnitario *
          produto.estoque
      )
    }, 0)

  /*
   * ==============================
   * DADOS DOS PRODUTOS
   * ==============================
   */

  const produtosDetalhados = useMemo(() => {
    return produtos.map(produto => {
      const vendasProduto =
        vendasSemana.filter(
          venda =>
            venda.produtoId ===
            produto.id
        )

      const quantidadeVendida =
        vendasProduto.reduce(
          (total, venda) =>
            total + venda.quantidade,
          0
        )

      const receitaProduto =
        vendasProduto.reduce(
          (total, venda) =>
            total +
            venda.quantidade *
              venda.precoUnitario,
          0
        )

      const impostoProduto =
        receitaProduto *
        (produto.aliquotaImposto / 100)

      const custoProduto =
        quantidadeVendida *
        produto.custoCompra

      const lucroProduto =
        receitaProduto -
        impostoProduto -
        custoProduto

      const impostoUnitario =
        produto.precoVenda *
        (produto.aliquotaImposto / 100)

      const lucroUnitario =
        produto.precoVenda -
        produto.custoCompra -
        impostoUnitario

      const margem =
        produto.precoVenda > 0
          ? (lucroUnitario /
              produto.precoVenda) *
            100
          : 0

      const valorEstoqueProduto =
        produto.estoque *
        produto.custoCompra

      const potencialVenda =
        produto.estoque *
        produto.precoVenda

      const potencialLucro =
        produto.estoque *
        lucroUnitario

      return {
        ...produto,
        quantidadeVendida,
        receitaProduto,
        impostoProduto,
        custoProduto,
        lucroProduto,
        lucroUnitario,
        margem,
        valorEstoqueProduto,
        potencialVenda,
        potencialLucro,
      }
    })
  }, [produtos, vendasSemana])

  /*
   * ==============================
   * PRODUTO SELECIONADO
   * ==============================
   */

  const produtoAtual =
    produtosDetalhados.find(
      produto =>
        produto.id ===
        produtoSelecionado
    )

  /*
   * ==============================
   * COMPONENTE
   * ==============================
   */

  return (
    <div
      style={{
        background: '#ffffff',
        minHeight: '100%',
        color: '#1f2937',
        paddingBottom: 40,
      }}
    >
      {/* CABEÇALHO */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 25,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              margin:
                '5px 0 0',
              color: '#6b7280',
              fontSize: 13,
            }}
          >
            Controle de vendas e
            estoque
          </p>
        </div>

        <span
          style={{
            border:
              '1px solid #e5e7eb',
            borderRadius: 7,
            padding:
              '7px 12px',
            fontSize: 11,
            color: '#6b7280',
            background:
              '#ffffff',
          }}
        >
          Últimos 7 dias
        </span>
      </div>

      {/* CARDS PRINCIPAIS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <CardResumo
          titulo="Receita"
          valor={fmt(receita)}
          descricao="Vendas realizadas"
          destaque="#2563eb"
        />

        <CardResumo
          titulo="Impostos"
          valor={fmt(impostos)}
          descricao="Impostos calculados"
          destaque="#d97706"
        />

        <CardResumo
          titulo="Lucro líquido"
          valor={fmt(lucro)}
          descricao="Após custos e impostos"
          destaque="#16a34a"
        />

        <CardResumo
          titulo="Estoque"
          valor={`${totalEstoque} un.`}
          descricao={fmt(valorEstoque)}
          destaque="#7c3aed"
        />
      </div>

      {/* RESUMO DO ESTOQUE */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <InfoCard
          titulo="VALOR DE COMPRA"
          valor={fmt(valorEstoque)}
        />

        <InfoCard
          titulo="VALOR DE VENDA"
          valor={fmt(
            valorVendaEstoque
          )}
        />

        <InfoCard
          titulo="LUCRO POTENCIAL"
          valor={fmt(lucroEstoque)}
          verde
        />
      </div>

      {/* EXTINTORES */}

      <div
        style={{
          border:
            '1px solid #e5e7eb',
          borderRadius: 10,
          background:
            '#ffffff',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding:
              '17px 20px',
            borderBottom:
              '1px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Estoque de extintores
          </h2>

          <p
            style={{
              margin:
                '4px 0 0',
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            Clique em um extintor
            para visualizar os
            detalhes.
          </p>
        </div>

        <div
          style={{
            padding: 18,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 12,
          }}
        >
          {produtosDetalhados.map(
            produto => {
              const estoqueBaixo =
                produto.estoque <= 5

              const estoqueMedio =
                produto.estoque > 5 &&
                produto.estoque <= 10

              return (
                <button
                  key={produto.id}
                  onClick={() =>
                    setProdutoSelecionado(
                      produto.id
                    )
                  }
                  style={{
                    background:
                      '#ffffff',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: 9,
                    padding: 15,
                    textAlign:
                      'left',
                    cursor:
                      'pointer',
                    transition:
                      '0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor =
                      '#cbd5e1'
                    e.currentTarget.style.boxShadow =
                      '0 3px 10px rgba(0,0,0,.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor =
                      '#e5e7eb'
                    e.currentTarget.style.boxShadow =
                      'none'
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: 14,
                          color:
                            '#111827',
                        }}
                      >
                        {produto.nome}
                      </strong>

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            '#6b7280',
                          marginTop: 4,
                        }}
                      >
                        {produto.tipo}
                        {' · '}
                        {
                          produto.capacidade
                        }
                      </div>
                    </div>

                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius:
                          '50%',
                        background:
                          estoqueBaixo
                            ? '#dc2626'
                            : estoqueMedio
                            ? '#f59e0b'
                            : '#16a34a',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      marginTop: 17,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display:
                            'block',
                          fontSize: 10,
                          color:
                            '#9ca3af',
                        }}
                      >
                        ESTOQUE
                      </span>

                      <strong
                        style={{
                          display:
                            'block',
                          marginTop: 3,
                          fontSize: 20,
                          color:
                            estoqueBaixo
                              ? '#dc2626'
                              : '#111827',
                        }}
                      >
                        {
                          produto.estoque
                        }
                      </strong>
                    </div>

                    <div
                      style={{
                        textAlign:
                          'right',
                      }}
                    >
                      <span
                        style={{
                          display:
                            'block',
                          fontSize: 10,
                          color:
                            '#9ca3af',
                        }}
                      >
                        VENDA
                      </span>

                      <strong
                        style={{
                          display:
                            'block',
                          marginTop: 5,
                          fontSize: 13,
                          color:
                            '#16a34a',
                        }}
                      >
                        {fmt(
                          produto.precoVenda
                        )}
                      </strong>
                    </div>
                  </div>
                </button>
              )
            }
          )}

          {produtos.length ===
            0 && (
            <div
              style={{
                gridColumn:
                  '1 / -1',
                textAlign:
                  'center',
                padding: 35,
                color:
                  '#9ca3af',
                fontSize: 13,
              }}
            >
              Nenhum extintor
              cadastrado.
            </div>
          )}
        </div>
      </div>

      {/* PARTE INFERIOR */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 320px',
          gap: 14,
        }}
      >
        {/* VENDAS */}

        <div
          style={{
            border:
              '1px solid #e5e7eb',
            borderRadius: 10,
            background:
              '#ffffff',
            padding: 20,
          }}
        >
          <h2
            style={{
              margin:
                '0 0 15px',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Vendas da semana
          </h2>

          {produtosDetalhados.filter(
            p =>
              p.quantidadeVendida >
              0
          ).length === 0 ? (
            <div
              style={{
                textAlign:
                  'center',
                padding: 30,
                color:
                  '#9ca3af',
                fontSize: 12,
              }}
            >
              Nenhuma venda
              registrada.
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse:
                  'collapse',
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom:
                      '1px solid #e5e7eb',
                  }}
                >
                  <th
                    style={{
                      textAlign:
                        'left',
                      padding:
                        '8px 6px',
                      color:
                        '#6b7280',
                    }}
                  >
                    Produto
                  </th>

                  <th
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '8px 6px',
                      color:
                        '#6b7280',
                    }}
                  >
                    Qtd.
                  </th>

                  <th
                    style={{
                      textAlign:
                        'right',
                      padding:
                        '8px 6px',
                      color:
                        '#6b7280',
                    }}
                  >
                    Receita
                  </th>

                  <th
                    style={{
                      textAlign:
                        'right',
                      padding:
                        '8px 6px',
                      color:
                        '#6b7280',
                    }}
                  >
                    Imposto
                  </th>

                  <th
                    style={{
                      textAlign:
                        'right',
                      padding:
                        '8px 6px',
                      color:
                        '#6b7280',
                    }}
                  >
                    Lucro
                  </th>
                </tr>
              </thead>

              <tbody>
                {produtosDetalhados
                  .filter(
                    p =>
                      p.quantidadeVendida >
                      0
                  )
                  .map(
                    produto => (
                      <tr
                        key={
                          produto.id
                        }
                        style={{
                          borderBottom:
                            '1px solid #f3f4f6',
                        }}
                      >
                        <td
                          style={{
                            padding:
                              '10px 6px',
                            fontWeight:
                              600,
                          }}
                        >
                          {
                            produto.nome
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              'center',
                          }}
                        >
                          {
                            produto.quantidadeVendida
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              'right',
                          }}
                        >
                          {fmt(
                            produto.receitaProduto
                          )}
                        </td>

                        <td
                          style={{
                            textAlign:
                              'right',
                            color:
                              '#d97706',
                          }}
                        >
                          {fmt(
                            produto.impostoProduto
                          )}
                        </td>

                        <td
                          style={{
                            textAlign:
                              'right',
                            color:
                              produto.lucroProduto >=
                              0
                                ? '#16a34a'
                                : '#dc2626',
                            fontWeight:
                              600,
                          }}
                        >
                          {fmt(
                            produto.lucroProduto
                          )}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          )}
        </div>

        {/* RESUMO */}

        <div
          style={{
            border:
              '1px solid #e5e7eb',
            borderRadius: 10,
            background:
              '#ffffff',
            padding: 20,
          }}
        >
          <h2
            style={{
              margin:
                '0 0 15px',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Resumo financeiro
          </h2>

          <Linha
            titulo="Receita"
            valor={fmt(receita)}
          />

          <Linha
            titulo="Custo"
            valor={`- ${fmt(
              custos
            )}`}
            cor="#dc2626"
          />

          <Linha
            titulo="Impostos"
            valor={`- ${fmt(
              impostos
            )}`}
            cor="#d97706"
          />

          <Linha
            titulo="Lucro líquido"
            valor={fmt(lucro)}
            cor="#16a34a"
            destaque
          />
        </div>
      </div>

      {/* =================================================
          MODAL DO EXTINTOR
      ================================================= */}

      {produtoAtual && (
        <div
          onClick={() =>
            setProdutoSelecionado(
              null
            )
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(17,24,39,.35)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            onClick={e =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: 500,
              background:
                '#ffffff',
              borderRadius: 12,
              boxShadow:
                '0 15px 40px rgba(0,0,0,.15)',
              overflow:
                'hidden',
            }}
          >
            {/* CABEÇALHO */}

            <div
              style={{
                padding:
                  '18px 20px',
                borderBottom:
                  '1px solid #e5e7eb',
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color:
                      '#111827',
                  }}
                >
                  {
                    produtoAtual.nome
                  }
                </h2>

                <span
                  style={{
                    display:
                      'block',
                    marginTop: 3,
                    fontSize: 11,
                    color:
                      '#6b7280',
                  }}
                >
                  {
                    produtoAtual.tipo
                  }
                  {' · '}
                  {
                    produtoAtual.capacidade
                  }
                </span>
              </div>

              <button
                onClick={() =>
                  setProdutoSelecionado(
                    null
                  )
                }
                style={{
                  border: 'none',
                  background:
                    'transparent',
                  fontSize: 22,
                  color:
                    '#9ca3af',
                  cursor:
                    'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* ESTOQUE */}

            <div
              style={{
                padding: 20,
              }}
            >
              <div
                style={{
                  background:
                    '#f9fafb',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 9,
                  padding: 16,
                  marginBottom: 14,
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        '#6b7280',
                    }}
                  >
                    ESTOQUE ATUAL
                  </span>

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight:
                        750,
                      marginTop: 3,
                    }}
                  >
                    {
                      produtoAtual.estoque
                    }{' '}
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          '#9ca3af',
                        fontWeight:
                          400,
                      }}
                    >
                      unidades
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    textAlign:
                      'right',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        '#6b7280',
                    }}
                  >
                    VALOR DO ESTOQUE
                  </span>

                  <div
                    style={{
                      marginTop: 4,
                      fontWeight:
                        700,
                      color:
                        '#7c3aed',
                    }}
                  >
                    {fmt(
                      produtoAtual.valorEstoqueProduto
                    )}
                  </div>
                </div>
              </div>

              {/* VALORES */}

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 10,
                }}
              >
                <Detalhe
                  titulo="Compra"
                  valor={fmt(
                    produtoAtual.custoCompra
                  )}
                />

                <Detalhe
                  titulo="Venda"
                  valor={fmt(
                    produtoAtual.precoVenda
                  )}
                  cor="#16a34a"
                />

                <Detalhe
                  titulo="Imposto"
                  valor={`${produtoAtual.aliquotaImposto}%`}
                  cor="#d97706"
                />

                <Detalhe
                  titulo="Lucro / unidade"
                  valor={fmt(
                    produtoAtual.lucroUnitario
                  )}
                  cor="#16a34a"
                />
              </div>

              {/* MOVIMENTAÇÃO */}

              <div
                style={{
                  marginTop: 14,
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 9,
                }}
              >
                <div
                  style={{
                    padding:
                      '11px 14px',
                    borderBottom:
                      '1px solid #e5e7eb',
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      '#6b7280',
                  }}
                >
                  MOVIMENTAÇÃO
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <Movimento
                    titulo="Entradas"
                    valor={
                      produtoAtual.estoque
                    }
                    descricao="Estoque disponível"
                    cor="#16a34a"
                  />

                  <Movimento
                    titulo="Vendas"
                    valor={
                      produtoAtual.quantidadeVendida
                    }
                    descricao="Últimos 7 dias"
                    cor="#2563eb"
                  />
                </div>
              </div>

              {/* LUCRO */}

              <div
                style={{
                  marginTop: 14,
                  padding: 15,
                  background:
                    '#f0fdf4',
                  border:
                    '1px solid #dcfce7',
                  borderRadius: 9,
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        '#15803d',
                      fontWeight:
                        700,
                    }}
                  >
                    LUCRO POTENCIAL
                  </span>

                  <div
                    style={{
                      fontSize: 11,
                      color:
                        '#4b5563',
                      marginTop: 3,
                    }}
                  >
                    Se todo o estoque
                    for vendido
                  </div>
                </div>

                <strong
                  style={{
                    fontSize: 17,
                    color:
                      '#15803d',
                  }}
                >
                  {fmt(
                    produtoAtual.potencialLucro
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/*
 * =====================================================
 * COMPONENTES AUXILIARES
 * =====================================================
 */

function CardResumo({
  titulo,
  valor,
  descricao,
  destaque,
}: {
  titulo: string
  valor: string
  descricao: string
  destaque: string
}) {
  return (
    <div
      style={{
        background:
          '#ffffff',
        border:
          '1px solid #e5e7eb',
        borderTop:
          `3px solid ${destaque}`,
        borderRadius: 9,
        padding: 17,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#6b7280',
          fontWeight: 600,
        }}
      >
        {titulo.toUpperCase()}
      </div>

      <div
        style={{
          marginTop: 9,
          fontSize: 21,
          fontWeight: 750,
          color: '#111827',
        }}
      >
        {valor}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          color: '#9ca3af',
        }}
      >
        {descricao}
      </div>
    </div>
  )
}

function InfoCard({
  titulo,
  valor,
  verde = false,
}: {
  titulo: string
  valor: string
  verde?: boolean
}) {
  return (
    <div
      style={{
        background:
          '#ffffff',
        border:
          '1px solid #e5e7eb',
        borderRadius: 9,
        padding: 15,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: '#9ca3af',
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 16,
          fontWeight: 700,
          color: verde
            ? '#16a34a'
            : '#111827',
        }}
      >
        {valor}
      </div>
    </div>
  )
}

function Detalhe({
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
        padding: 12,
        background:
          '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: '#9ca3af',
          fontWeight: 600,
        }}
      >
        {titulo.toUpperCase()}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 14,
          fontWeight: 700,
          color: cor,
        }}
      >
        {valor}
      </div>
    </div>
  )
}

function Movimento({
  titulo,
  valor,
  descricao,
  cor,
}: {
  titulo: string
  valor: number
  descricao: string
  cor: string
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: '#9ca3af',
          fontWeight: 600,
        }}
      >
        {titulo.toUpperCase()}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 750,
          color: cor,
        }}
      >
        {valor}
      </div>

      <div
        style={{
          marginTop: 2,
          fontSize: 10,
          color: '#9ca3af',
        }}
      >
        {descricao}
      </div>
    </div>
  )
}

function Linha({
  titulo,
  valor,
  cor = '#111827',
  destaque = false,
}: {
  titulo: string
  valor: string
  cor?: string
  destaque?: boolean
}) {
  return (
    <div
      style={{
        display:
          'flex',
        justifyContent:
          'space-between',
        alignItems:
          'center',
        padding:
          '9px 0',
        borderBottom:
          '1px solid #f3f4f6',
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: destaque
            ? '#111827'
            : '#6b7280',
          fontWeight:
            destaque
              ? 700
              : 400,
        }}
      >
        {titulo}
      </span>

      <strong
        style={{
          fontSize: 12,
          color: cor,
          fontWeight:
            destaque
              ? 750
              : 600,
        }}
      >
        {valor}
      </strong>
    </div>
  )
}

