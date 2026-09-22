export interface Produto {
  id: string
  nome: string
  tipo: string
  capacidade: string
  custoCompra: number
  precoVenda: number
  aliquotaImposto: number
  estoque: number
}

export interface Venda {
  id: string
  produtoId: string
  quantidade: number
  precoUnitario: number
  data: string
  cliente: string
}

export interface AppData {
  produtos: Produto[]
  vendas: Venda[]
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>
  setVendas: React.Dispatch<React.SetStateAction<Venda[]>>
}

export function calcularLucroVenda(venda: Venda, produto: Produto): {
  receita: number
  impostos: number
  receitaLiquida: number
  custo: number
  lucro: number
} {
  const receita = venda.quantidade * venda.precoUnitario
  const impostos = receita * (produto.aliquotaImposto / 100)
  const receitaLiquida = receita - impostos
  const custo = venda.quantidade * produto.custoCompra
  const lucro = receitaLiquida - custo
  return { receita, impostos, receitaLiquida, custo, lucro }
}
