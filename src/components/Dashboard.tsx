
import { useMemo, useState } from 'react'
import { AppData, calcularLucroVenda } from '../types'

interface Props {
  data: AppData
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 20,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
}

export default function Dashboard({ data }: Props) {
  const { produtos, vendas } = data

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<string | null>(null)

  const hoje = new Date()
    .toISOString()
    .split('T')[0]

  const semanaAtras = new Date(
    Date.now() - 7 * 86400000
  )
    .toISOString()
    .split('T')[0]

  const vendasSemana = vendas.filter(
    v =>
      v.data >= semanaAtras &&
      v.data <= hoje
  )

  /*
   * =====================================================
   * RESUMO FINANCEIRO
   * =====================================================
   */

  let totalReceita = 0
  let totalImpostos = 0
  let totalCusto = 0
  let totalLucro = 0

  for (const v of vendasSemana) {
    const p = produtos.find(
      p => p.id === v.produtoId
    )

    if (!p) continue

    const c = calcularLucroVenda(v, p)

    totalReceita += c.receita
    totalImpostos += c.impostos
    totalCusto += c.custo
    totalLucro += c.lucro
  }

  /*
   * =====================================================
   * ESTOQUE
   * =====================================================
   */

  const totalUnidades = produtos.reduce(
    (s, p) => s + p.estoque,
    0
  )

  const totalEstoqueCusto = produtos.reduce(
    (s, p) =>
      s + p.estoque * p.custoCompra,
    0
  )

  const totalEstoqueVenda = produtos.reduce(
    (s, p) =>
      s + p.estoque * p.precoVenda,
    0
  )

  const lucroPotencialEstoque =
    produtos.reduce((s, p) => {
      const imposto =
        p.precoVenda *
        (p.aliquotaImposto / 100)

      const lucro =
        p.precoVenda -
        p.custoCompra -
        imposto

      return s + lucro * p.estoque
    }, 0)

  const unidadesVendidasSemana =
    vendasSemana.reduce(
      (s, v) => s + v.quantidade,
      0
    )

  /*
   * =====================================================
   * PRODUTOS
   * =====================================================
   */

  const produtosComDados = useMemo(() => {
    return produtos
      .map(p => {
        const vendasProduto =
          vendasSemana.filter(
            v => v.produtoId === p.id
          )

        const quantidadeVendida =
          vendasProduto.reduce(
            (s, v) =>
              s + v.quantidade,
            0
          )

        const receita =
          vendasProduto.reduce(
            (s, v) =>
              s +
              v.quantidade *
                v.precoUnitario,
            0
          )

        const imposto =
          receita *
          (p.aliquotaImposto / 100)

        const custo =
          quantidadeVendida *
          p.custoCompra

        const lucro =
          receita -
          imposto -
          custo

        const lucroUnidade =
          p.precoVenda -
          p.custoCompra -
          p.precoVenda *
            (p.aliquotaImposto / 100)

        const margem =
          p.precoVenda > 0
            ? (lucroUnidade /
                p.precoVenda) *
              100
            : 0

        const valorEstoque =
          p.estoque *
          p.custoCompra

        const valorVendaEstoque =
          p.estoque *
          p.precoVenda

        const lucroEstoque =
          p.estoque *
          lucroUnidade

        return {
          ...p,
          quantidadeVendida,
          receita,
          imposto,
          custo,
          lucro,
          lucroUnidade,
          margem,
          valorEstoque,
          valorVendaEstoque,
          lucroEstoque,
        }
      })
      .sort(
        (a, b) =>
          b.estoque - a.estoque
      )
  }, [produtos, vendasSemana])

  const produtoAtual =
    produtosComDados.find(
      p => p.id === produtoSelecionado
    )

  /*
   * =====================================================
   * ALERTAS
   * =====================================================
   */

  const estoqueCritico =
    produtos.filter(
      p => p.estoque <= 5
    )

  const estoqueBaixo =
    produtos.filter(
      p =>
        p.estoque > 5 &&
        p.estoque <= 10
    )

  /*
   * =====================================================
   * INTERFACE
   * =====================================================
   */

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#f6f7f9',
        padding: '4px 0 40px',
        color: '#17201b',
      }}
    >
      {/* CABEÇALHO */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: 22,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 750,
              color: '#17201b',
              letterSpacing:
                '-0.03em',
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              margin:
                '6px 0 0',
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            Visão geral das vendas,
            estoque e resultados.
          </p>
        </div>

        <div
          style={{
            padding:
              '8px 12px',
            background:
              '#ffffff',
            border:
              '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 11,
            color: '#6b7280',
          }}
        >
          Últimos 7 dias
        </div>
      </div>

      {/* =================================================
          CARDS PRINCIPAIS
      ================================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <ResumoCard
          titulo="RECEITA BRUTA"
          valor={fmt(totalReceita)}
          descricao={`${unidadesVendidasSemana} unidades vendidas`}
          icone="💰"
          cor="#2563eb"
        />

        <ResumoCard
          titulo="IMPOSTOS"
          valor={fmt(totalImpostos)}
          descricao="Impostos calculados nas vendas"
          icone="🧾"
          cor="#d97706"
        />

        <ResumoCard
          titulo="LUCRO LÍQUIDO"
          valor={fmt(totalLucro)}
          descricao={`Margem ${
            totalReceita > 0
              ? (
                  (totalLucro /
                    totalReceita) *
                  100
                ).toFixed(1)
              : '0.0'
          }%`}
          icone="📈"
          cor="#15803d"
        />

        <ResumoCard
          titulo="ESTOQUE"
          valor={`${totalUnidades} un.`}
          descricao={fmt(
            totalEstoqueCusto
          ) + ' investidos'}
          icone="📦"
          cor="#7c3aed"
        />
      </div>

      {/* =================================================
          RESUMO DO ESTOQUE
      ================================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 22,
        }}
      >
        <MiniResumo
          titulo="VALOR DE COMPRA"
          valor={fmt(
            totalEstoqueCusto
          )}
          descricao="Estoque pelo custo"
        />

        <MiniResumo
          titulo="VALOR DE VENDA"
          valor={fmt(
            totalEstoqueVenda
          )}
          descricao="Potencial bruto"
        />

        <MiniResumo
          titulo="LUCRO POTENCIAL"
          valor={fmt(
            lucroPotencialEstoque
          )}
          descricao="Após custo e imposto"
        />

        <MiniResumo
          titulo="PRODUTOS"
          valor={produtos.length.toString()}
          descricao={`${estoqueBaixo.length} com estoque baixo`}
        />
      </div>

      {/* =================================================
          PRODUTOS / EXTINTORES
      ================================================= */}

      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding:
              '18px 20px',
            borderBottom:
              '1px solid #e5e7eb',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Extintores em estoque
            </h2>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              Clique em um produto
              para ver os detalhes.
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            {produtos.length}{' '}
            produtos
          </div>
        </div>

        <div
          style={{
            padding: 18,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 14,
          }}
        >
          {produtosComDados.map(
            p => {
              const estoqueCritico =
                p.estoque <= 5

              const estoqueBaixo =
                p.estoque > 5 &&
                p.estoque <= 10

              return (
                <button
                  key={p.id}
                  onClick={() =>
                    setProdutoSelecionado(
                      p.id
                    )
                  }
                  style={{
                    textAlign:
                      'left',
                    border:
                      '1px solid #e5e7eb',
                    background:
                      '#ffffff',
                    borderRadius: 12,
                    padding: 16,
                    cursor:
                      'pointer',
                    transition:
                      'all .18s ease',
                    boxShadow:
                      '0 2px 6px rgba(15,23,42,.04)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform =
                      'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 7px 18px rgba(15,23,42,.09)'
                    e.currentTarget.style.borderColor =
                      '#cbd5e1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform =
                      'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 2px 6px rgba(15,23,42,.04)'
                    e.currentTarget.style.borderColor =
                      '#e5e7eb'
                  }}
                >
                  {/* TOPO CARD */}

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 11,
                        background:
                          '#fff1f2',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        fontSize: 24,
                      }}
                    >
                      🧯
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 650,
                        padding:
                          '5px 8px',
                        borderRadius: 20,
                        background:
                          estoqueCritico
                            ? '#fef2f2'
                            : estoqueBaixo
                            ? '#fffbeb'
                            : '#f0fdf4',
                        color:
                          estoqueCritico
                            ? '#dc2626'
                            : estoqueBaixo
                            ? '#d97706'
                            : '#15803d',
                      }}
                    >
                      {estoqueCritico
                        ? 'Estoque crítico'
                        : estoqueBaixo
                        ? 'Estoque baixo'
                        : 'Estoque normal'}
                    </span>
                  </div>

                  {/* NOME */}

                  <div
                    style={{
                      marginTop: 14,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color:
                          '#17201b',
                      }}
                    >
                      {p.nome}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color:
                          '#6b7280',
                        fontSize: 11,
                      }}
                    >
                      {p.tipo ||
                        'Tipo não informado'}{' '}
                      ·{' '}
                      {p.capacidade ||
                        'Capacidade não informada'}
                    </div>
                  </div>

                  {/* ESTOQUE */}

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      marginTop: 16,
                      paddingTop: 13,
                      borderTop:
                        '1px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color:
                            '#94a3b8',
                          textTransform:
                            'uppercase',
                        }}
                      >
                        Estoque
                      </div>

                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 750,
                          marginTop: 2,
                          color:
                            estoqueCritico
                              ? '#dc2626'
                              : '#17201b',
                        }}
                      >
                        {p.estoque}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 400,
                            color:
                              '#94a3b8',
                            marginLeft: 4,
                          }}
                        >
                          un.
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          'right',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color:
                            '#94a3b8',
                        }}
                      >
                        Venda
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 14,
                          fontWeight: 700,
                          color:
                            '#15803d',
                        }}
                      >
                        {fmt(
                          p.precoVenda
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RODAPÉ */}

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      marginTop: 13,
                      fontSize: 10,
                      color:
                        '#64748b',
                    }}
                  >
                    <span>
                      Custo:{' '}
                      {fmt(
                        p.custoCompra
                      )}
                    </span>

                    <span
                      style={{
                        color:
                          p.lucroUnidade >=
                          0
                            ? '#15803d'
                            : '#dc2626',
                        fontWeight: 650,
                      }}
                    >
                      Lucro:{' '}
                      {fmt(
                        p.lucroUnidade
                      )}
                    </span>
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
                  '1/-1',
                padding: 50,
                textAlign:
                  'center',
                color:
                  '#64748b',
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 10,
                }}
              >
                📦
              </div>

              Nenhum produto
              cadastrado.
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          PARTE INFERIOR
      ================================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) 330px',
          gap: 14,
        }}
      >
        {/* VENDAS */}

        <div
          style={{
            ...cardStyle,
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 650,
              color: '#64748b',
              letterSpacing:
                '.06em',
              marginBottom: 14,
            }}
          >
            VENDAS POR PRODUTO —
            ÚLTIMOS 7 DIAS
          </div>

          {produtosComDados.filter(
            p =>
              p.quantidadeVendida >
              0
          ).length === 0 ? (
            <div
              style={{
                padding: 35,
                textAlign:
                  'center',
                color:
                  '#94a3b8',
                fontSize: 13,
              }}
            >
              Nenhuma venda
              registrada esta semana.
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
                  {[
                    'Produto',
                    'Qtd.',
                    'Receita',
                    'Imposto',
                    'Lucro',
                  ].map(
                    h => (
                      <th
                        key={h}
                        style={{
                          textAlign:
                            'left',
                          padding:
                            '8px 7px',
                          color:
                            '#94a3b8',
                          fontSize: 9,
                          fontWeight: 650,
                        }}
                      >
                        {h.toUpperCase()}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {produtosComDados
                  .filter(
                    p =>
                      p.quantidadeVendida >
                      0
                  )
                  .map(p => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom:
                          '1px solid #f1f5f9',
                      }}
                    >
                      <td
                        style={{
                          padding:
                            '11px 7px',
                          fontWeight: 600,
                        }}
                      >
                        {p.nome}
                      </td>

                      <td
                        style={{
                          padding:
                            '11px 7px',
                        }}
                      >
                        {
                          p.quantidadeVendida
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            '11px 7px',
                        }}
                      >
                        {fmt(
                          p.receita
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            '11px 7px',
                          color:
                            '#d97706',
                        }}
                      >
                        {fmt(
                          p.imposto
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            '11px 7px',
                          color:
                            p.lucro >= 0
                              ? '#15803d'
                              : '#dc2626',
                          fontWeight: 650,
                        }}
                      >
                        {fmt(
                          p.lucro
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ALERTAS */}

        <div
          style={{
            display:
              'flex',
            flexDirection:
              'column',
            gap: 14,
          }}
        >
          <div
            style={{
              ...cardStyle,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 650,
                color:
                  '#64748b',
                marginBottom: 13,
              }}
            >
              ⚠️ ATENÇÃO NO ESTOQUE
            </div>

            {estoqueCritico.length ===
              0 &&
            estoqueBaixo.length ===
              0 ? (
              <div
                style={{
                  color:
                    '#15803d',
                  fontSize: 12,
                }}
              >
                ✓ Todos os estoques
                estão adequados.
              </div>
            ) : (
              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: 7,
                }}
              >
                {[
                  ...estoqueCritico,
                  ...estoqueBaixo,
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() =>
                      setProdutoSelecionado(
                        p.id
                      )
                    }
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      width: '100%',
                      border:
                        '1px solid #fee2e2',
                      background:
                        '#fffafa',
                      borderRadius: 8,
                      padding:
                        '9px 11px',
                      cursor:
                        'pointer',
                      textAlign:
                        'left',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {p.nome}
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          color:
                            '#94a3b8',
                          marginTop: 2,
                        }}
                      >
                        {p.tipo} ·{' '}
                        {p.capacidade}
                      </div>
                    </div>

                    <strong
                      style={{
                        color:
                          p.estoque <=
                          5
                            ? '#dc2626'
                            : '#d97706',
                      }}
                    >
                      {p.estoque}
                    </strong>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RESUMO FINANCEIRO */}

          <div
            style={{
              ...cardStyle,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 650,
                color:
                  '#64748b',
                marginBottom: 13,
              }}
            >
              RESUMO FINANCEIRO
            </div>

            <Linha
              label="Receita Bruta"
              valor={fmt(
                totalReceita
              )}
            />

            <Linha
              label="Custo"
              valor={`- ${fmt(
                totalCusto
              )}`}
              cor="#dc2626"
            />

            <Linha
              label="Impostos"
              valor={`- ${fmt(
                totalImpostos
              )}`}
              cor="#d97706"
            />

            <Linha
              label="Lucro Líquido"
              valor={fmt(
                totalLucro
              )}
              cor="#15803d"
              destaque
            />
          </div>
        </div>
      </div>

      {/* =================================================
          MODAL / DETALHES DO EXTINTOR
      ================================================= */}

      {produtoAtual && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15,23,42,.45)',
            backdropFilter:
              'blur(3px)',
            zIndex: 500,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20,
          }}
          onClick={() =>
            setProdutoSelecionado(
              null
            )
          }
        >
          <div
            onClick={e =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: 600,
              maxHeight:
                '90vh',
              overflowY: 'auto',
              background:
                '#ffffff',
              borderRadius: 16,
              boxShadow:
                '0 25px 70px rgba(15,23,42,.22)',
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                padding:
                  '20px 22px',
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
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 11,
                    background:
                      '#fff1f2',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    fontSize: 25,
                  }}
                >
                  🧯
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                      color:
                        '#17201b',
                    }}
                  >
                    {
                      produtoAtual.nome
                    }
                  </h2>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color:
                        '#64748b',
                    }}
                  >
                    {
                      produtoAtual.tipo
                    }{' '}
                    ·{' '}
                    {
                      produtoAtual.capacidade
                    }
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setProdutoSelecionado(
                    null
                  )
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border:
                    '1px solid #e5e7eb',
                  background:
                    '#f8fafc',
                  color:
                    '#64748b',
                  fontSize: 18,
                  cursor:
                    'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 22,
              }}
            >
              {/* ESTOQUE GRANDE */}

              <div
                style={{
                  background:
                    '#f8fafc',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 18,
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color:
                        '#64748b',
                      fontWeight: 650,
                    }}
                  >
                    ESTOQUE ATUAL
                  </div>

                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      marginTop: 3,
                    }}
                  >
                    {
                      produtoAtual.estoque
                    }{' '}
                    <span
                      style={{
                        fontSize: 13,
                        color:
                          '#94a3b8',
                        fontWeight: 400,
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
                  <div
                    style={{
                      fontSize: 10,
                      color:
                        '#64748b',
                    }}
                  >
                    VALOR DO ESTOQUE
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 750,
                      marginTop: 4,
                      color:
                        '#7c3aed',
                    }}
                  >
                    {fmt(
                      produtoAtual.valorEstoque
                    )}
                  </div>
                </div>
              </div>

              {/* GRID DE VALORES */}

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
                  titulo="Custo de compra"
                  valor={fmt(
                    produtoAtual.custoCompra
                  )}
                />

                <Detalhe
                  titulo="Preço de venda"
                  valor={fmt(
                    produtoAtual.precoVenda
                  )}
                  cor="#15803d"
                />

                <Detalhe
                  titulo="Lucro por unidade"
                  valor={fmt(
                    produtoAtual.lucroUnidade
                  )}
                  cor={
                    produtoAtual.lucroUnidade >=
                    0
                      ? '#15803d'
                      : '#dc2626'
                  }
                />

                <Detalhe
                  titulo="Margem líquida"
                  valor={`${produtoAtual.margem.toFixed(
                    1
                  )}%`}
                  cor="#2563eb"
                />

                <Detalhe
                  titulo="Imposto por unidade"
                  valor={fmt(
                    produtoAtual.precoVenda *
                      (produtoAtual.aliquotaImposto /
                        100)
                  )}
                  cor="#d97706"
                />

                <Detalhe
                  titulo="Alíquota"
                  valor={`${produtoAtual.aliquotaImposto}%`}
                  cor="#d97706"
                />
              </div>

              {/* ENTRADAS / VENDAS */}

              <div
                style={{
                  marginTop: 16,
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 12,
                  overflow:
                    'hidden',
                }}
              >
                <div
                  style={{
                    padding:
                      '12px 14px',
                    background:
                      '#f8fafc',
                    borderBottom:
                      '1px solid #e5e7eb',
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      '#64748b',
                  }}
                >
                  MOVIMENTAÇÃO
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr 1fr',
                    padding: 15,
                    gap: 10,
                  }}
                >
                  <Movimento
                    titulo="ENTRADAS"
                    valor={produtoAtual.estoque}
                    cor="#15803d"
                    descricao="Estoque disponível"
                  />

                  <Movimento
                    titulo="VENDIDAS"
                    valor={
                      produtoAtual.quantidadeVendida
                    }
                    cor="#2563eb"
                    descricao="Últimos 7 dias"
                  />

                  <Movimento
                    titulo="LUCRO ESTOQUE"
                    valor={fmt(
                      produtoAtual.lucroEstoque
                    )}
                    cor="#7c3aed"
                    descricao="Potencial"
                  />
                </div>
              </div>

              {/* RESUMO */}

              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background:
                    '#f0fdf4',
                  border:
                    '1px solid #dcfce7',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color:
                      '#15803d',
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  POTENCIAL DO ESTOQUE
                </div>

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
                  <span
                    style={{
                      fontSize: 12,
                      color:
                        '#166534',
                    }}
                  >
                    Se todo o estoque
                    for vendido:
                  </span>

                  <strong
                    style={{
                      fontSize: 18,
                      color:
                        '#15803d',
                    }}
                  >
                    {fmt(
                      produtoAtual.lucroEstoque
                    )}
                  </strong>
                </div>
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
 * COMPONENTES
 * =====================================================
 */

function ResumoCard({
  titulo,
  valor,
  descricao,
  icone,
  cor,
}: {
  titulo: string
  valor: string
  descricao: string
  icone: string
  cor: string
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderTop:
          `3px solid ${cor}`,
        position: 'relative',
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
        <span
          style={{
            fontSize: 10,
            color: '#64748b',
            fontWeight: 700,
            letterSpacing:
              '.05em',
          }}
        >
          {titulo}
        </span>

        <span
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            borderRadius: 8,
            background:
              '#f8fafc',
            fontSize: 16,
          }}
        >
          {icone}
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 23,
          fontWeight: 750,
          color: '#17201b',
        }}
      >
        {valor}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 11,
          color: '#94a3b8',
        }}
      >
        {descricao}
      </div>
    </div>
  )
}

function MiniResumo({
  titulo,
  valor,
  descricao,
}: {
  titulo: string
  valor: string
  descricao: string
}) {
  return (
    <div
      style={{
        background:
          '#ffffff',
        border:
          '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: '#94a3b8',
          fontWeight: 700,
          letterSpacing:
            '.05em',
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 750,
          marginTop: 7,
          color: '#17201b',
        }}
      >
        {valor}
      </div>

      <div
        style={{
          fontSize: 10,
          color: '#94a3b8',
          marginTop: 3,
        }}
      >
        {descricao}
      </div>
    </div>
  )
}

function Detalhe({
  titulo,
  valor,
  cor = '#17201b',
}: {
  titulo: string
  valor: string
  cor?: string
}) {
  return (
    <div
      style={{
        padding: 13,
        background:
          '#f8fafc',
        border:
          '1px solid #e5e7eb',
        borderRadius: 9,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: '#94a3b8',
          fontWeight: 650,
        }}
      >
        {titulo.toUpperCase()}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 15,
          fontWeight: 750,
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
  cor,
  descricao,
}: {
  titulo: string
  valor: number | string
  cor: string
  descricao: string
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: '#94a3b8',
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 750,
          color: cor,
          marginTop: 4,
        }}
      >
        {valor}
      </div>

      <div
        style={{
          fontSize: 9,
          color: '#94a3b8',
          marginTop: 2,
        }}
      >
        {descricao}
      </div>
    </div>
  )
}

function Linha({
  label,
  valor,
  cor = '#17201b',
  destaque = false,
}: {
  label: string
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
          '1px solid #f1f5f9',
      }}
    >
      <span
        style={{
          fontSize: 12,
          color:
            destaque
              ? '#17201b'
              : '#64748b',
          fontWeight:
            destaque
              ? 700
              : 400,
        }}
      >
        {label}
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

