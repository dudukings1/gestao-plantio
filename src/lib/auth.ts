import type { Role } from './types'

export async function hashSenha(senha: string): Promise<string> {
  const data = new TextEncoder().encode(senha)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return (await hashSenha(senha)) === hash
}

const definePermissoes = <T extends Record<string, boolean>>(p: T) => p

export const PERMISSOES = {
  admin: definePermissoes({
    verMapa: true,
    criarArea: true,
    excluirArea: true,
    lancarDespesa: true,
    excluirDespesaPropria: true,
    excluirDespesaQualquer: true,
    verHistorico: true,
    verDashboard: true,
    exportarPDF: true,
    exportarCSV: true,
    gerenciarUsuarios: true,
    gerenciarSafras: true,
    verEstoque: true,
    gerenciarEstoque: true,
    gerenciarCategorias: true,
  }),
  funcionario: definePermissoes({
    verMapa: false,
    criarArea: false,
    excluirArea: false,
    lancarDespesa: true,
    excluirDespesaPropria: true,
    excluirDespesaQualquer: false,
    verHistorico: true,
    verDashboard: false,
    exportarPDF: false,
    exportarCSV: false,
    gerenciarUsuarios: false,
    gerenciarSafras: false,
    verEstoque: true,
    gerenciarEstoque: false,
    gerenciarCategorias: false,
  }),
} satisfies Record<Role, Record<string, boolean>>

export type Permissao = keyof (typeof PERMISSOES)['admin']
