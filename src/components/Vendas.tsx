import { useMemo, useState } from 'react'
import { AppData, Venda, calcularLucroVenda } from '../types'

interface Props {
  data: AppData
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

export default function Vendas({ data }: Props) {
  const { produtos, vendas, setVendas, setProdutos } = data

  const [mostrando, setMostrando] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)

  const [form, setForm] = useState({
    produtoId: '',
    quantidade: 1,
    precoUnitario: 0,
    data: new Date().toISOString().split('T')[0],
    cliente: '',
  })

  const produtoSelecionado = produtos.find(
    p => p.id === form.produtoId
  )

  /* =========================
     RESUMO
  ========================= */

  const resumo = useMemo(() => {
    let receita = 0
    let impostos = 0
    let lucro = 0

    vendas.forEach(venda => {
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
      lucro += calculo.lucro
    })

    const unidades = vendas.reduce(
      (total, venda) =>
        total + venda.quantidade,
      0
    )

    return {
      receita,
      impostos,
      lucro,
      unidades,
    }
  }, [vendas, produtos])

  /* =========================
     ORDENAÇÃO
  ========================= */

  const vendasOrdenadas = useMemo(() => {
    return [...vendas].sort((a, b) =>
      b.data.localeCompare(a.data)
    )
  }, [vendas])

  /* =========================
     NOVA VENDA
  ========================= */

  const abrirNova = () => {
    setForm({
      produtoId: '',
      quantidade: 1,
      precoUnitario: 0,
      data: new Date()
        .toISOString()
        .split('T')[0],
      cliente: '',
    })

    setMostrando(true)
  }

  const fechar = () => {
    setMostrando(false)
  }

  const selecionarProduto = (id: string) => {
    const produto = produtos.find(
      p => p.id === id
    )

    setForm(prev => ({
      ...prev,
      produtoId: id,
      precoUnitario:
        produto?.precoVenda ?? 0,
    }))
  }

  /* =========================
     SALVAR VENDA
  ========================= */

  const salvar = () => {
    if (!form.produtoId) {
      alert('Selecione um extintor.')
      return
    }

    if (form.quantidade <= 0) {
      alert('Informe uma quantidade válida.')
      return
    }

    if (form.precoUnitario <= 0) {
      alert('Informe um preço válido.')
      return
    }

    const produto = produtos.find(
      p => p.id === form.produtoId
    )

    if (!produto) {
      alert('Extintor não encontrado.')
      return
    }

    if (form.quantidade > produto.estoque) {
      alert(
        `Estoque insuficiente. Disponível: ${produto.estoque} unidades.`
      )
      return
    }

    const novaVenda: Venda = {
      id: Date.now().toString(),
      produtoId: form.produtoId,
      quantidade: form.quantidade,
      precoUnitario: form.precoUnitario,
      data: form.data,
      cliente: form.cliente,
    }

    setVendas(prev => [
      novaVenda,
      ...prev,
    ])

    setProdutos(prev =>
      prev.map(p =>
        p.id === form.produtoId
          ? {
              ...p,
              estoque:
                p.estoque -
                form.quantidade,
            }
          : p
      )
    )

    fechar()
  }

  /* =========================
     CANCELAR VENDA
  ========================= */

  const cancelarVenda = (venda: Venda) => {
    const confirmar = window.confirm(
      'Cancelar esta venda e devolver os extintores ao estoque?'
    )

    if (!confirmar) return

    setVendas(prev =>
      prev.filter(
        v => v.id !== venda.id
      )
    )

    setProdutos(prev =>
      prev.map(p =>
        p.id === venda.produtoId
          ? {
              ...p,
              estoque:
                p.estoque +
                venda.quantidade,
            }
          : p
      )
    )
  }

  /* =========================
     PREVIEW
  ========================= */

  const preview = produtoSelecionado
    ? calcularLucroVenda(
        {
          ...form,
          id: '',
        } as Venda,
        produtoSelecionado
      )
    : null

  /* =========================
     ESTILOS
  ========================= */

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#ffffff',
    color: '#111827',
    padding: '10px 12px',
    fontSize: 13,
    outline: 'none',
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#ffffff',
        color: '#111827',
        padding: 8,
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
          gap: 15,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Vendas
          </h1>

          <p
            style={{
              margin: '5px 0 0',
              color: '#9ca3af',
              fontSize: 13,
            }}
          >
            Controle de vendas e estoque
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            onClick={() =>
              setHistoricoAberto(true)
            }
            style={{
              border:
                '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#111827',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Histórico
          </button>

          <button
            onClick={abrirNova}
            style={{
              border: 'none',
              background: '#111827',
              color: '#ffffff',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Nova venda
          </button>
        </div>
      </div>

      {/* =========================
          CARDS RESUMO
      ========================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <ResumoCard
          titulo="Vendas"
          valor={String(vendas.length)}
          descricao={`${resumo.unidades} extintores vendidos`}
        />

        <ResumoCard
          titulo="Receita"
          valor={fmt(resumo.receita)}
          descricao="Valor bruto"
        />

        <ResumoCard
          titulo="Impostos"
          valor={fmt(resumo.impostos)}
          descricao="Total calculado"
          cor="#b45309"
        />

        <ResumoCard
          titulo="Lucro"
          valor={fmt(resumo.lucro)}
          descricao="Lucro líquido"
          cor="#15803d"
        />
      </div>

      {/* =========================
          EXTINTORES
      ========================= */}

      <div
        style={{
          marginBottom: 15,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Extintores
        </h2>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          Estoque e valores dos produtos
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 30,
        }}
      >
        {produtos.map(produto => {
          const vendasProduto =
            vendas.filter(
              venda =>
                venda.produtoId ===
                produto.id
            )

          const vendido =
            vendasProduto.reduce(
              (total, venda) =>
                total + venda.quantidade,
              0
            )

          const valorEstoque =
            produto.estoque *
            produto.custoCompra

          const lucroProduto =
            vendasProduto.reduce(
              (total, venda) => {
                const calculo =
                  calcularLucroVenda(
                    venda,
                    produto
                  )

                return (
                  total + calculo.lucro
                )
              },
              0
            )

          return (
            <div
              key={produto.id}
              style={{
                aspectRatio: '1 / 1',
                border:
                  '1px solid #e5e7eb',
                borderRadius: 12,
                background: '#ffffff',
                padding: 18,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent:
                  'space-between',
                boxShadow:
                  '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      {produto.nome}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color: '#9ca3af',
                        fontSize: 11,
                      }}
                    >
                      {produto.tipo}
                      {' · '}
                      {produto.capacidade}
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: 42,
                      height: 42,
                      borderRadius: 9,
                      background:
                        produto.estoque <= 5
                          ? '#fef2f2'
                          : '#f3f4f6',
                      color:
                        produto.estoque <= 5
                          ? '#dc2626'
                          : '#111827',
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    {produto.estoque}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12,
                }}
              >
                <MiniInfo
                  titulo="ESTOQUE"
                  valor={`${produto.estoque} un.`}
                />

                <MiniInfo
                  titulo="VALOR ESTOQUE"
                  valor={fmt(
                    valorEstoque
                  )}
                />

                <MiniInfo
                  titulo="VENDIDO"
                  valor={`${vendido} un.`}
                />

                <MiniInfo
                  titulo="LUCRO"
                  valor={fmt(
                    lucroProduto
                  )}
                  verde
                />
              </div>

              <button
                onClick={() => {
                  setForm({
                    produtoId:
                      produto.id,
                    quantidade: 1,
                    precoUnitario:
                      produto.precoVenda,
                    data: new Date()
                      .toISOString()
                      .split('T')[0],
                    cliente: '',
                  })

                  setMostrando(true)
                }}
                disabled={
                  produto.estoque <= 0
                }
                style={{
                  width: '100%',
                  border: 'none',
                  background:
                    produto.estoque <= 0
                      ? '#f3f4f6'
                      : '#111827',
                  color:
                    produto.estoque <= 0
                      ? '#9ca3af'
                      : '#ffffff',
                  borderRadius: 8,
                  padding: '9px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor:
                    produto.estoque <= 0
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {produto.estoque <= 0
                  ? 'Sem estoque'
                  : 'Vender extintor'}
              </button>
            </div>
          )
        })}
      </div>

      {/* =========================
          HISTÓRICO MODAL
      ========================= */}

      {historicoAberto && (
        <div
          onClick={() =>
            setHistoricoAberto(false)
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(17,24,39,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 900,
          }}
        >
          <div
            onClick={e =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: 1100,
              maxHeight: '85vh',
              background: '#ffffff',
              borderRadius: 14,
              boxShadow:
                '0 20px 50px rgba(0,0,0,.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >

            <div
              style={{
                padding: '18px 20px',
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
                    fontSize: 18,
                  }}
                >
                  Histórico de vendas
                </h2>

                <p
                  style={{
                    margin:
                      '4px 0 0',
                    color: '#9ca3af',
                    fontSize: 11,
                  }}
                >
                  Todas as vendas registradas
                </p>
              </div>

              <button
                onClick={() =>
                  setHistoricoAberto(
                    false
                  )
                }
                style={{
                  border: 'none',
                  background:
                    '#f3f4f6',
                  color: '#111827',
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                overflow: 'auto',
              }}
            >
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
                      background:
                        '#f9fafb',
                      borderBottom:
                        '1px solid #e5e7eb',
                    }}
                  >
                    {[
                      'Data',
                      'Cliente',
                      'Extintor',
                      'Qtd.',
                      'Valor',
                      'Receita',
                      'Imposto',
                      'Lucro',
                      'Ação',
                    ].map(titulo => (
                      <th
                        key={titulo}
                        style={{
                          padding:
                            '12px',
                          textAlign:
                            'left',
                          fontSize: 10,
                          color:
                            '#6b7280',
                          fontWeight: 600,
                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {vendasOrdenadas.map(
                    venda => {
                      const produto =
                        produtos.find(
                          p =>
                            p.id ===
                            venda.produtoId
                        )

                      if (!produto)
                        return null

                      const calculo =
                        calcularLucroVenda(
                          venda,
                          produto
                        )

                      return (
                        <tr
                          key={
                            venda.id
                          }
                          style={{
                            borderBottom:
                              '1px solid #f3f4f6',
                          }}
                        >
                          <td
                            style={{
                              padding:
                                12,
                              color:
                                '#6b7280',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {new Date(
                              venda.data +
                                'T12:00:00'
                            ).toLocaleDateString(
                              'pt-BR'
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                              fontWeight:
                                500,
                            }}
                          >
                            {venda.cliente ||
                              'Não informado'}
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                            }}
                          >
                            <strong>
                              {
                                produto.nome
                              }
                            </strong>

                            <div
                              style={{
                                color:
                                  '#9ca3af',
                                fontSize: 10,
                                marginTop: 2,
                              }}
                            >
                              {
                                produto.tipo
                              }
                              {' · '}
                              {
                                produto.capacidade
                              }
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                              fontWeight:
                                600,
                            }}
                          >
                            {
                              venda.quantidade
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                            }}
                          >
                            {fmt(
                              venda.precoUnitario
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                              fontWeight:
                                600,
                            }}
                          >
                            {fmt(
                              calculo.receita
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                              color:
                                '#b45309',
                            }}
                          >
                            {fmt(
                              calculo.impostos
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                              color:
                                calculo.lucro >=
                                0
                                  ? '#15803d'
                                  : '#dc2626',
                              fontWeight:
                                600,
                            }}
                          >
                            {fmt(
                              calculo.lucro
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                12,
                            }}
                          >
                            <button
                              onClick={() =>
                                cancelarVenda(
                                  venda
                                )
                              }
                              style={{
                                border:
                                  '1px solid #fee2e2',
                                background:
                                  '#fffafa',
                                color:
                                  '#dc2626',
                                borderRadius:
                                  6,
                                padding:
                                  '6px 9px',
                                fontSize: 10,
                                cursor:
                                  'pointer',
                              }}
                            >
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      )
                    }
                  )}

                  {vendasOrdenadas.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: 50,
                          textAlign:
                            'center',
                          color:
                            '#9ca3af',
                        }}
                      >
                        <strong
                          style={{
                            display:
                              'block',
                            color:
                              '#6b7280',
                            marginBottom:
                              5,
                          }}
                        >
                          Nenhuma venda
                        </strong>

                        Registre uma venda
                        para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MODAL NOVA VENDA
      ========================= */}

      {mostrando && (
        <div
          onClick={fechar}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(17,24,39,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              maxWidth: 460,
              background: '#ffffff',
              borderRadius: 14,
              boxShadow:
                '0 20px 50px rgba(0,0,0,.15)',
              overflow: 'hidden',
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
                    fontSize: 18,
                  }}
                >
                  Nova venda
                </h2>

                <span
                  style={{
                    display:
                      'block',
                    marginTop: 3,
                    color:
                      '#9ca3af',
                    fontSize: 11,
                  }}
                >
                  Registre a saída do extintor
                </span>
              </div>

              <button
                onClick={fechar}
                style={{
                  border: 'none',
                  background:
                    '#f3f4f6',
                  color: '#111827',
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 20,
                display: 'flex',
                flexDirection:
                  'column',
                gap: 14,
              }}
            >

              <Campo label="Extintor">
                <select
                  value={
                    form.produtoId
                  }
                  onChange={e =>
                    selecionarProduto(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Selecione um extintor
                  </option>

                  {produtos.map(
                    produto => (
                      <option
                        key={
                          produto.id
                        }
                        value={
                          produto.id
                        }
                        disabled={
                          produto.estoque <=
                          0
                        }
                      >
                        {
                          produto.nome
                        }{' '}
                        — estoque:{' '}
                        {
                          produto.estoque
                        }
                      </option>
                    )
                  )}
                </select>
              </Campo>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12,
                }}
              >
                <Campo label="Quantidade">
                  <input
                    type="number"
                    min="1"
                    value={
                      form.quantidade
                    }
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        quantidade:
                          Number(
                            e.target.value
                          ) || 0,
                      }))
                    }
                    style={inputStyle}
                  />
                </Campo>

                <Campo label="Preço unitário">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.precoUnitario
                    }
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        precoUnitario:
                          Number(
                            e.target.value
                          ) || 0,
                      }))
                    }
                    style={inputStyle}
                  />
                </Campo>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12,
                }}
              >
                <Campo label="Data">
                  <input
                    type="date"
                    value={form.data}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        data:
                          e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </Campo>

                <Campo label="Cliente">
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={
                      form.cliente
                    }
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        cliente:
                          e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </Campo>
              </div>

              {preview && (
                <div
                  style={{
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 14,
                    background:
                      '#fafafa',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        '#6b7280',
                      marginBottom: 10,
                    }}
                  >
                    RESUMO
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(3,1fr)',
                      gap: 10,
                    }}
                  >
                    <ResumoMini
                      titulo="Receita"
                      valor={fmt(
                        preview.receita
                      )}
                    />

                    <ResumoMini
                      titulo="Imposto"
                      valor={fmt(
                        preview.impostos
                      )}
                      cor="#b45309"
                    />

                    <ResumoMini
                      titulo="Lucro"
                      valor={fmt(
                        preview.lucro
                      )}
                      cor="#15803d"
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: 8,
                  marginTop: 3,
                }}
              >
                <button
                  onClick={fechar}
                  style={{
                    border:
                      '1px solid #e5e7eb',
                    background:
                      '#ffffff',
                    color:
                      '#6b7280',
                    borderRadius: 8,
                    padding:
                      '10px 15px',
                    fontSize: 12,
                    cursor:
                      'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvar}
                  style={{
                    border: 'none',
                    background:
                      '#111827',
                    color:
                      '#ffffff',
                    borderRadius: 8,
                    padding:
                      '10px 17px',
                    fontSize: 12,
                    fontWeight:
                      600,
                    cursor:
                      'pointer',
                  }}
                >
                  Registrar venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================
   CARD RESUMO
========================= */

function ResumoCard({
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
        aspectRatio: '1 / 1',
        border:
          '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 18,
        background: '#ffffff',
        display: 'flex',
        flexDirection:
          'column',
        justifyContent:
          'space-between',
        boxSizing: 'border-box',
        boxShadow:
          '0 2px 8px rgba(0,0,0,.03)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#9ca3af',
          fontWeight: 700,
          letterSpacing:
            '.05em',
        }}
      >
        {titulo.toUpperCase()}
      </div>

      <div>
        <div
          style={{
            fontSize: 23,
            fontWeight: 700,
            color: cor,
            lineHeight: 1.2,
          }}
        >
          {valor}
        </div>

        <div
          style={{
            marginTop: 7,
            fontSize: 11,
            color: '#9ca3af',
            lineHeight: 1.4,
          }}
        >
          {descricao}
        </div>
      </div>
    </div>
  )
}

/* =========================
   MINI INFO
========================= */

function MiniInfo({
  titulo,
  valor,
  verde = false,
}: {
  titulo: string
  valor: string
  verde?: boolean
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: '#9ca3af',
          letterSpacing:
            '.05em',
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          marginTop: 3,
          fontSize: 12,
          fontWeight: 600,
          color: verde
            ? '#15803d'
            : '#111827',
        }}
      >
        {valor}
      </div>
    </div>
  )
}

/* =========================
   RESUMO MINI
========================= */

function ResumoMini({
  titulo,
  valor,
  cor = '#111827',
}: {
  titulo: string
  valor: string
  cor?: string
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
   CAMPO
========================= */

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection:
          'column',
        gap: 5,
      }}
    >
      <label
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#6b7280',
        }}
      >
        {label.toUpperCase()}
      </label>

      {children}
    </div>
  )
}