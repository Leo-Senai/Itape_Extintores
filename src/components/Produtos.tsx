import { useMemo, useState } from 'react'
import { AppData, Produto } from '../types'

interface Props {
  data: AppData
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const emptyProduto: Omit<Produto, 'id'> = {
  nome: '',
  tipo: '',
  capacidade: '',
  custoCompra: 0,
  precoVenda: 0,
  aliquotaImposto: 12,
  estoque: 0,
}

type FiltroEstoque = 'todos' | 'normal' | 'baixo' | 'critico'

export default function Produtos({ data }: Props) {
  const { produtos, setProdutos } = data

  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] =
    useState<Omit<Produto, 'id'>>(emptyProduto)

  const [mostrando, setMostrando] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] =
    useState<FiltroEstoque>('todos')

  const [movimento, setMovimento] = useState<{
    produto: Produto
    tipo: 'entrada' | 'saida'
  } | null>(null)

  const [quantidadeMovimento, setQuantidadeMovimento] =
    useState(1)

  /*
   * =========================
   * PRODUTOS
   * =========================
   */

  const abrirNovo = () => {
    setForm({ ...emptyProduto })
    setEditando('novo')
    setMostrando(true)
  }

  const abrirEditar = (p: Produto) => {
    setForm({
      nome: p.nome,
      tipo: p.tipo,
      capacidade: p.capacidade,
      custoCompra: p.custoCompra,
      precoVenda: p.precoVenda,
      aliquotaImposto: p.aliquotaImposto,
      estoque: p.estoque,
    })

    setEditando(p.id)
    setMostrando(true)
  }

  const fechar = () => {
    setMostrando(false)
    setEditando(null)
    setForm({ ...emptyProduto })
  }

  const salvar = () => {
    if (!form.nome.trim()) {
      alert('Informe o nome do produto.')
      return
    }

    if (editando === 'novo') {
      const novoProduto: Produto = {
        ...form,
        id: Date.now().toString(),
      }

      setProdutos(prev => [...prev, novoProduto])
    } else {
      setProdutos(prev =>
        prev.map(p =>
          p.id === editando
            ? {
                ...p,
                ...form,
              }
            : p
        )
      )
    }

    fechar()
  }

  const excluir = (id: string) => {
    if (
      confirm(
        'Tem certeza que deseja excluir este produto?'
      )
    ) {
      setProdutos(prev =>
        prev.filter(p => p.id !== id)
      )
    }
  }

  /*
   * =========================
   * ESTOQUE
   * =========================
   */

  const abrirMovimento = (
    produto: Produto,
    tipo: 'entrada' | 'saida'
  ) => {
    setQuantidadeMovimento(1)

    setMovimento({
      produto,
      tipo,
    })
  }

  const confirmarMovimento = () => {
    if (!movimento) return

    const quantidade = Math.max(
      1,
      Math.floor(quantidadeMovimento)
    )

    setProdutos(prev =>
      prev.map(p => {
        if (p.id !== movimento.produto.id) {
          return p
        }

        const novoEstoque =
          movimento.tipo === 'entrada'
            ? p.estoque + quantidade
            : Math.max(0, p.estoque - quantidade)

        return {
          ...p,
          estoque: novoEstoque,
        }
      })
    )

    setMovimento(null)
    setQuantidadeMovimento(1)
  }

  /*
   * =========================
   * STATUS ESTOQUE
   * =========================
   */

  const statusEstoque = (estoque: number) => {
    if (estoque <= 5) {
      return {
        label: 'Crítico',
        cor: '#ef4444',
        fundo: 'rgba(239,68,68,0.12)',
      }
    }

    if (estoque <= 10) {
      return {
        label: 'Baixo',
        cor: '#f59e0b',
        fundo: 'rgba(245,158,11,0.12)',
      }
    }

    return {
      label: 'Normal',
      cor: 'var(--color-green)',
      fundo: 'rgba(34,197,94,0.10)',
    }
  }

  /*
   * =========================
   * CÁLCULOS
   * =========================
   */

  const resumo = useMemo(() => {
    const totalUnidades = produtos.reduce(
      (total, p) => total + p.estoque,
      0
    )

    const valorEstoque = produtos.reduce(
      (total, p) =>
        total + p.estoque * p.custoCompra,
      0
    )

    const valorVendaEstoque = produtos.reduce(
      (total, p) =>
        total + p.estoque * p.precoVenda,
      0
    )

    const lucroPotencial = produtos.reduce(
      (total, p) => {
        const imposto =
          p.precoVenda *
          (p.aliquotaImposto / 100)

        const lucro =
          p.precoVenda -
          p.custoCompra -
          imposto

        return total + lucro * p.estoque
      },
      0
    )

    const criticos = produtos.filter(
      p => p.estoque <= 5
    ).length

    const baixos = produtos.filter(
      p => p.estoque > 5 && p.estoque <= 10
    ).length

    return {
      totalUnidades,
      valorEstoque,
      valorVendaEstoque,
      lucroPotencial,
      criticos,
      baixos,
    }
  }, [produtos])

  /*
   * =========================
   * FILTROS
   * =========================
   */

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const correspondeBusca =
        p.nome
          .toLowerCase()
          .includes(busca.toLowerCase()) ||
        p.tipo
          .toLowerCase()
          .includes(busca.toLowerCase()) ||
        p.capacidade
          .toLowerCase()
          .includes(busca.toLowerCase())

      let correspondeFiltro = true

      if (filtro === 'normal') {
        correspondeFiltro = p.estoque > 10
      }

      if (filtro === 'baixo') {
        correspondeFiltro =
          p.estoque > 5 && p.estoque <= 10
      }

      if (filtro === 'critico') {
        correspondeFiltro = p.estoque <= 5
      }

      return (
        correspondeBusca &&
        correspondeFiltro
      )
    })
  }, [produtos, busca, filtro])

  /*
   * =========================
   * CAMPOS
   * =========================
   */

  const field = (
    label: string,
    key: keyof Omit<Produto, 'id'>,
    type = 'text'
  ) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      <label
        style={{
          fontSize: 10,
          color: 'var(--color-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}
      >
        {label.toUpperCase()}
      </label>

      <input
        type={type}
        value={form[key] as any}
        min={type === 'number' ? 0 : undefined}
        onChange={e =>
          setForm(prev => ({
            ...prev,
            [key]:
              type === 'number'
                ? parseFloat(e.target.value) || 0
                : e.target.value,
          }))
        }
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--color-bg)',
          border:
            '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '11px 12px',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          outline: 'none',
        }}
      />
    </div>
  )

  const lucroForm =
    form.precoVenda -
    form.custoCompra -
    form.precoVenda *
      (form.aliquotaImposto / 100)

  const margemForm =
    form.precoVenda > 0
      ? (lucroForm / form.precoVenda) * 100
      : 0

  /*
   * =========================
   * INTERFACE
   * =========================
   */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        paddingBottom: 30,
      }}
    >
      {/* CABEÇALHO */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 15,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 25,
                fontWeight: 750,
                letterSpacing: '-0.03em',
              }}
            >
              Produtos & Estoque
            </h1>

            <span
              style={{
                background:
                  'var(--color-surface-2)',
                border:
                  '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '4px 9px',
                fontFamily:
                  'var(--font-mono)',
                fontSize: 10,
                color:
                  'var(--color-muted)',
              }}
            >
              {produtos.length}
            </span>
          </div>

          <p
            style={{
              margin:
                '6px 0 0',
              color:
                'var(--color-muted)',
              fontSize: 13,
            }}
          >
            Controle de produtos, estoque,
            custos e margem de venda.
          </p>
        </div>

        <button
          onClick={abrirNovo}
          style={{
            background:
              'var(--color-red)',
            border: 'none',
            color: '#fff',
            fontFamily:
              'var(--font-ui)',
            fontWeight: 650,
            fontSize: 13,
            padding:
              '11px 18px',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow:
              '0 4px 15px rgba(0,0,0,0.15)',
          }}
        >
          + Novo Produto
        </button>
      </div>

      {/* CARDS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
        }}
      >
        <ResumoCard
          titulo="UNIDADES EM ESTOQUE"
          valor={resumo.totalUnidades.toString()}
          descricao={`${produtos.length} produtos cadastrados`}
          icone="📦"
        />

        <ResumoCard
          titulo="VALOR DO ESTOQUE"
          valor={fmt(resumo.valorEstoque)}
          descricao="Custo dos produtos armazenados"
          icone="💰"
        />

        <ResumoCard
          titulo="VALOR DE VENDA"
          valor={fmt(
            resumo.valorVendaEstoque
          )}
          descricao="Potencial bruto do estoque"
          icone="🏷️"
        />

        <ResumoCard
          titulo="LUCRO POTENCIAL"
          valor={fmt(
            resumo.lucroPotencial
          )}
          descricao="Após custo e imposto cadastrado"
          icone="📈"
        />
      </div>

      {/* ALERTAS */}

      {(resumo.criticos > 0 ||
        resumo.baixos > 0) && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {resumo.criticos > 0 && (
            <div
              style={{
                flex: 1,
                minWidth: 230,
                padding: 13,
                borderRadius: 9,
                border:
                  '1px solid rgba(239,68,68,0.25)',
                background:
                  'rgba(239,68,68,0.07)',
                color: '#ef4444',
                fontSize: 12,
              }}
            >
              ⚠️{' '}
              <strong>
                {resumo.criticos}
              </strong>{' '}
              produto(s) com estoque
              crítico.
            </div>
          )}

          {resumo.baixos > 0 && (
            <div
              style={{
                flex: 1,
                minWidth: 230,
                padding: 13,
                borderRadius: 9,
                border:
                  '1px solid rgba(245,158,11,0.25)',
                background:
                  'rgba(245,158,11,0.07)',
                color: '#f59e0b',
                fontSize: 12,
              }}
            >
              ⚠️{' '}
              <strong>
                {resumo.baixos}
              </strong>{' '}
              produto(s) com estoque
              baixo.
            </div>
          )}
        </div>
      )}

      {/* FILTROS */}

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 220,
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform:
                'translateY(-50%)',
              fontSize: 14,
              opacity: 0.6,
            }}
          >
            🔎
          </span>

          <input
            value={busca}
            onChange={e =>
              setBusca(e.target.value)
            }
            placeholder="Buscar produto, tipo ou capacidade..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background:
                'var(--color-surface)',
              border:
                '1px solid var(--color-border)',
              borderRadius: 8,
              padding:
                '11px 12px 11px 36px',
              color:
                'var(--color-text)',
              outline: 'none',
              fontSize: 13,
            }}
          />
        </div>

        <Filtro
          ativo={filtro === 'todos'}
          onClick={() =>
            setFiltro('todos')
          }
        >
          Todos
        </Filtro>

        <Filtro
          ativo={filtro === 'normal'}
          onClick={() =>
            setFiltro('normal')
          }
        >
          🟢 Normal
        </Filtro>

        <Filtro
          ativo={filtro === 'baixo'}
          onClick={() =>
            setFiltro('baixo')
          }
        >
          🟡 Baixo
        </Filtro>

        <Filtro
          ativo={filtro === 'critico'}
          onClick={() =>
            setFiltro('critico')
          }
        >
          🔴 Crítico
        </Filtro>
      </div>

      {/* TABELA */}

      <div
        style={{
          background:
            'var(--color-surface)',
          border:
            '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding:
              '14px 16px',
            borderBottom:
              '1px solid var(--color-border)',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong
              style={{
                fontSize: 14,
              }}
            >
              Estoque atual
            </strong>

            <div
              style={{
                color:
                  'var(--color-muted)',
                fontSize: 11,
                marginTop: 3,
              }}
            >
              {produtosFiltrados.length}{' '}
              produto(s) encontrado(s)
            </div>
          </div>

          <span
            style={{
              fontFamily:
                'var(--font-mono)',
              fontSize: 10,
              color:
                'var(--color-muted)',
            }}
          >
            ATUALIZADO AGORA
          </span>
        </div>

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse',
              fontSize: 12,
              minWidth: 950,
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    'var(--color-surface-2)',
                  borderBottom:
                    '1px solid var(--color-border)',
                }}
              >
                {[
                  'Produto',
                  'Custo',
                  'Venda',
                  'Imposto',
                  'Margem',
                  'Estoque',
                  'Valor estoque',
                  'Ações',
                ].map(h => (
                  <th
                    key={h}
                    style={{
                      padding:
                        '11px 14px',
                      textAlign:
                        'left',
                      fontFamily:
                        'var(--font-mono)',
                      fontSize: 9,
                      color:
                        'var(--color-muted)',
                      letterSpacing:
                        '0.07em',
                      fontWeight: 600,
                    }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map(
                (p, i) => {
                  const imposto =
                    p.precoVenda *
                    (p.aliquotaImposto /
                      100)

                  const lucroUn =
                    p.precoVenda -
                    p.custoCompra -
                    imposto

                  const margemP =
                    p.precoVenda >
                    0
                      ? (lucroUn /
                          p.precoVenda) *
                        100
                      : 0

                  const valorEstoque =
                    p.estoque *
                    p.custoCompra

                  const status =
                    statusEstoque(
                      p.estoque
                    )

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom:
                          '1px solid var(--color-border)',
                        background:
                          i % 2 === 0
                            ? 'transparent'
                            : 'rgba(255,255,255,0.012)',
                      }}
                    >
                      {/* PRODUTO */}

                      <td
                        style={{
                          padding:
                            '14px',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 11,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 9,
                              background:
                                'var(--color-surface-2)',
                              border:
                                '1px solid var(--color-border)',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center',
                              fontSize: 18,
                            }}
                          >
                            🧯
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 650,
                              }}
                            >
                              {p.nome}
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                                fontSize: 10,
                                color:
                                  'var(--color-muted)',
                              }}
                            >
                              {p.tipo ||
                                'Sem tipo'}{' '}
                              ·{' '}
                              {p.capacidade ||
                                'Sem capacidade'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CUSTO */}

                      <td
                        style={{
                          padding:
                            '14px',
                          fontFamily:
                            'var(--font-mono)',
                        }}
                      >
                        {fmt(
                          p.custoCompra
                        )}
                      </td>

                      {/* VENDA */}

                      <td
                        style={{
                          padding:
                            '14px',
                          fontFamily:
                            'var(--font-mono)',
                          fontWeight: 600,
                        }}
                      >
                        {fmt(
                          p.precoVenda
                        )}
                      </td>

                      {/* IMPOSTO */}

                      <td
                        style={{
                          padding:
                            '14px',
                        }}
                      >
                        <span
                          style={{
                            padding:
                              '4px 7px',
                            borderRadius: 5,
                            background:
                              'rgba(245,158,11,0.1)',
                            color:
                              '#f59e0b',
                            fontFamily:
                              'var(--font-mono)',
                            fontSize: 10,
                          }}
                        >
                          {
                            p.aliquotaImposto
                          }
                          %
                        </span>
                      </td>

                      {/* MARGEM */}

                      <td
                        style={{
                          padding:
                            '14px',
                        }}
                      >
                        <div
                          style={{
                            color:
                              margemP >=
                              20
                                ? 'var(--color-green)'
                                : '#f59e0b',
                            fontWeight: 650,
                          }}
                        >
                          {margemP.toFixed(
                            1
                          )}
                          %
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            color:
                              'var(--color-muted)',
                            marginTop: 2,
                          }}
                        >
                          {fmt(
                            lucroUn
                          )}{' '}
                          / un.
                        </div>
                      </td>

                      {/* ESTOQUE */}

                      <td
                        style={{
                          padding:
                            '14px',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            flexDirection:
                              'column',
                            gap: 5,
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: 7,
                            }}
                          >
                            <span
                              style={{
                                fontFamily:
                                  'var(--font-mono)',
                                fontSize: 16,
                                fontWeight: 700,
                              }}
                            >
                              {
                                p.estoque
                              }
                            </span>

                            <span
                              style={{
                                fontSize: 9,
                                padding:
                                  '3px 6px',
                                borderRadius:
                                  5,
                                background:
                                  status.fundo,
                                color:
                                  status.cor,
                              }}
                            >
                              {
                                status.label
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* VALOR ESTOQUE */}

                      <td
                        style={{
                          padding:
                            '14px',
                          fontFamily:
                            'var(--font-mono)',
                        }}
                      >
                        <div>
                          {fmt(
                            valorEstoque
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 9,
                            color:
                              'var(--color-muted)',
                            marginTop: 3,
                          }}
                        >
                          investido
                        </div>
                      </td>

                      {/* AÇÕES */}

                      <td
                        style={{
                          padding:
                            '14px',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 5,
                            flexWrap:
                              'wrap',
                          }}
                        >
                          <MiniButton
                            onClick={() =>
                              abrirMovimento(
                                p,
                                'entrada'
                              )
                            }
                            tipo="entrada"
                          >
                            + Entrada
                          </MiniButton>

                          <MiniButton
                            onClick={() =>
                              abrirMovimento(
                                p,
                                'saida'
                              )
                            }
                            tipo="saida"
                          >
                            − Saída
                          </MiniButton>

                          <MiniButton
                            onClick={() =>
                              abrirEditar(p)
                            }
                          >
                            Editar
                          </MiniButton>

                          <MiniButton
                            onClick={() =>
                              excluir(p.id)
                            }
                            tipo="excluir"
                          >
                            Excluir
                          </MiniButton>
                        </div>
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>

        {produtosFiltrados.length ===
          0 && (
          <div
            style={{
              padding: 50,
              textAlign: 'center',
              color:
                'var(--color-muted)',
            }}
          >
            <div
              style={{
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              📦
            </div>

            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {/* MODAL PRODUTO */}

      {mostrando && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.72)',
            zIndex: 200,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background:
                'var(--color-surface)',
              border:
                '1px solid var(--color-border)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 580,
              maxHeight:
                '90vh',
              overflowY: 'auto',
              boxShadow:
                '0 25px 80px rgba(0,0,0,0.35)',
            }}
          >
            {/* CABEÇALHO MODAL */}

            <div
              style={{
                padding:
                  '20px 22px',
                borderBottom:
                  '1px solid var(--color-border)',
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
                  }}
                >
                  {editando ===
                  'novo'
                    ? 'Novo Produto'
                    : 'Editar Produto'}
                </h2>

                <div
                  style={{
                    color:
                      'var(--color-muted)',
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Cadastre os valores
                  usados para calcular
                  estoque e margem.
                </div>
              </div>

              <button
                onClick={fechar}
                style={{
                  background:
                    'var(--color-surface-2)',
                  border:
                    '1px solid var(--color-border)',
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  color:
                    'var(--color-muted)',
                  fontSize: 18,
                  cursor: 'pointer',
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
              {/* PRODUTO */}

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    gridColumn:
                      '1/-1',
                  }}
                >
                  {field(
                    'Nome do Produto',
                    'nome'
                  )}
                </div>

                {field(
                  'Tipo',
                  'tipo'
                )}

                {field(
                  'Capacidade',
                  'capacidade'
                )}

                {field(
                  'Custo de Compra (R$)',
                  'custoCompra',
                  'number'
                )}

                {field(
                  'Preço de Venda (R$)',
                  'precoVenda',
                  'number'
                )}

                {field(
                  'Alíquota de Imposto (%)',
                  'aliquotaImposto',
                  'number'
                )}

                {field(
                  'Estoque',
                  'estoque',
                  'number'
                )}
              </div>

              {/* RESUMO */}

              {form.precoVenda >
                0 && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 15,
                    borderRadius: 9,
                    background:
                      'var(--color-surface-2)',
                    border:
                      '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color:
                        'var(--color-muted)',
                      fontFamily:
                        'var(--font-mono)',
                      marginBottom: 10,
                    }}
                  >
                    SIMULAÇÃO DA VENDA
                  </div>

                  <div
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        'repeat(3, 1fr)',
                      gap: 10,
                    }}
                  >
                    <InfoMini
                      label="Lucro / un."
                      value={fmt(
                        lucroForm
                      )}
                    />

                    <InfoMini
                      label="Margem líquida"
                      value={`${margemForm.toFixed(
                        1
                      )}%`}
                    />

                    <InfoMini
                      label="Imposto / un."
                      value={fmt(
                        form.precoVenda *
                          (form.aliquotaImposto /
                            100)
                      )}
                    />
                  </div>
                </div>
              )}

              {/* BOTÕES */}

              <div
                style={{
                  display:
                    'flex',
                  gap: 8,
                  justifyContent:
                    'flex-end',
                  marginTop: 20,
                }}
              >
                <button
                  onClick={fechar}
                  style={{
                    background:
                      'var(--color-surface-2)',
                    border:
                      '1px solid var(--color-border)',
                    color:
                      'var(--color-muted)',
                    padding:
                      '10px 17px',
                    borderRadius: 7,
                    cursor:
                      'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={salvar}
                  style={{
                    background:
                      'var(--color-red)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 650,
                    padding:
                      '10px 20px',
                    borderRadius: 7,
                    cursor:
                      'pointer',
                  }}
                >
                  Salvar Produto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOVIMENTO */}

      {movimento && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background:
              'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 390,
              background:
                'var(--color-surface)',
              border:
                '1px solid var(--color-border)',
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color:
                  'var(--color-muted)',
                fontFamily:
                  'var(--font-mono)',
              }}
            >
              MOVIMENTAÇÃO DE ESTOQUE
            </div>

            <h2
              style={{
                margin:
                  '7px 0 3px',
                fontSize: 18,
              }}
            >
              {movimento.tipo ===
              'entrada'
                ? 'Entrada de estoque'
                : 'Saída de estoque'}
            </h2>

            <div
              style={{
                color:
                  'var(--color-muted)',
                fontSize: 12,
              }}
            >
              {movimento.produto.nome}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 15,
                borderRadius: 9,
                background:
                  'var(--color-surface-2)',
                border:
                  '1px solid var(--color-border)',
                textAlign:
                  'center',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color:
                    'var(--color-muted)',
                  fontFamily:
                    'var(--font-mono)',
                }}
              >
                ESTOQUE ATUAL
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 750,
                  marginTop: 4,
                }}
              >
                {
                  movimento.produto
                    .estoque
                }
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
              }}
            >
              <label
                style={{
                  fontSize: 10,
                  color:
                    'var(--color-muted)',
                  fontFamily:
                    'var(--font-mono)',
                }}
              >
                QUANTIDADE
              </label>

              <input
                type="number"
                min={1}
                value={
                  quantidadeMovimento
                }
                onChange={e =>
                  setQuantidadeMovimento(
                    Math.max(
                      1,
                      parseInt(
                        e.target.value
                      ) || 1
                    )
                  )
                }
                style={{
                  marginTop: 7,
                  width: '100%',
                  boxSizing:
                    'border-box',
                  background:
                    'var(--color-bg)',
                  border:
                    '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: 12,
                  color:
                    'var(--color-text)',
                  fontSize: 18,
                  fontWeight: 700,
                  textAlign:
                    'center',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                textAlign:
                  'center',
                fontSize: 12,
                color:
                  'var(--color-muted)',
              }}
            >
              Novo estoque:{' '}
              <strong
                style={{
                  color:
                    'var(--color-text)',
                }}
              >
                {movimento.tipo ===
                'entrada'
                  ? movimento.produto
                      .estoque +
                    quantidadeMovimento
                  : Math.max(
                      0,
                      movimento.produto
                        .estoque -
                        quantidadeMovimento
                    )}
              </strong>
            </div>

            <div
              style={{
                display:
                  'flex',
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                onClick={() =>
                  setMovimento(null)
                }
                style={{
                  flex: 1,
                  background:
                    'var(--color-surface-2)',
                  border:
                    '1px solid var(--color-border)',
                  color:
                    'var(--color-muted)',
                  padding: 10,
                  borderRadius: 7,
                  cursor:
                    'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={
                  confirmarMovimento
                }
                style={{
                  flex: 1,
                  background:
                    movimento.tipo ===
                    'entrada'
                      ? 'var(--color-green)'
                      : 'var(--color-red)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 650,
                  padding: 10,
                  borderRadius: 7,
                  cursor:
                    'pointer',
                }}
              >
                Confirmar
              </button>
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

function ResumoCard({
  titulo,
  valor,
  descricao,
  icone,
}: {
  titulo: string
  valor: string
  descricao: string
  icone: string
}) {
  return (
    <div
      style={{
        background:
          'var(--color-surface)',
        border:
          '1px solid var(--color-border)',
        borderRadius: 11,
        padding: 17,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
            fontFamily:
              'var(--font-mono)',
            fontSize: 9,
            letterSpacing:
              '0.07em',
            color:
              'var(--color-muted)',
          }}
        >
          {titulo}
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background:
              'var(--color-surface-2)',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
          }}
        >
          {icone}
        </div>
      </div>

      <div
        style={{
          marginTop: 13,
          fontSize: 22,
          fontWeight: 750,
          letterSpacing:
            '-0.02em',
          fontFamily:
            'var(--font-mono)',
        }}
      >
        {valor}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 10,
          color:
            'var(--color-muted)',
        }}
      >
        {descricao}
      </div>
    </div>
  )
}

function Filtro({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: ativo
          ? 'var(--color-surface-2)'
          : 'transparent',
        border:
          '1px solid var(--color-border)',
        color: ativo
          ? 'var(--color-text)'
          : 'var(--color-muted)',
        padding:
          '10px 13px',
        borderRadius: 7,
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function MiniButton({
  children,
  onClick,
  tipo = 'normal',
}: {
  children: React.ReactNode
  onClick: () => void
  tipo?: 'normal' | 'entrada' | 'saida' | 'excluir'
}) {
  const estilos = {
    normal: {
      background:
        'var(--color-surface-2)',
      color:
        'var(--color-muted)',
      border:
        '1px solid var(--color-border)',
    },

    entrada: {
      background:
        'rgba(34,197,94,0.09)',
      color:
        'var(--color-green)',
      border:
        '1px solid rgba(34,197,94,0.18)',
    },

    saida: {
      background:
        'rgba(245,158,11,0.08)',
      color: '#f59e0b',
      border:
        '1px solid rgba(245,158,11,0.18)',
    },

    excluir: {
      background:
        'rgba(239,68,68,0.08)',
      color: '#ef4444',
      border:
        '1px solid rgba(239,68,68,0.18)',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{
        ...estilos[tipo],
        fontSize: 10,
        padding:
          '5px 7px',
        borderRadius: 5,
        cursor:
          'pointer',
        fontFamily:
          'var(--font-ui)',
      }}
    >
      {children}
    </button>
  )
}

function InfoMini({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color:
            'var(--color-muted)',
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          fontFamily:
            'var(--font-mono)',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  )
}
