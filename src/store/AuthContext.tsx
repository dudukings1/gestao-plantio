import * as React from 'react'
import type { Role, Usuario } from '@/lib/types'
import { hashSenha, verificarSenha, PERMISSOES, type Permissao } from '@/lib/auth'
import { gerarId } from '@/lib/storage'
import { db, mapUsuario, rowUsuario } from '@/lib/supabase'

const SESSAO_KEY = 'gestao-plantio:sessao'

interface AuthContextValue {
  usuario: Usuario | null
  usuarios: Usuario[]
  carregando: boolean
  login: (login: string, senha: string) => Promise<Usuario | null>
  logout: () => void
  pode: (permissao: Permissao) => boolean
  criarUsuario: (dados: { nome: string; login: string; senha: string; role: Role }) => Promise<{ ok: boolean; erro?: string }>
  toggleAtivo: (id: string) => void
  alterarSenha: (id: string, novaSenha: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = React.useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([])
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    const init = async () => {
      const { data, error } = await db.from('usuarios').select('*').order('criado_em')

      if (error) {
        console.error('[Supabase] Erro ao carregar usuários:', error)
        setCarregando(false)
        return
      }

      let lista: Usuario[]

      if (!data || data.length === 0) {
        // Primeira execução: cria admin padrão
        const senhaHash = await hashSenha('admin123')
        const admin: Usuario = {
          id: gerarId(),
          nome: 'Administrador',
          login: 'admin',
          senhaHash,
          role: 'admin',
          ativo: true,
          criadoEm: new Date().toISOString(),
        }
        await db.from('usuarios').insert(rowUsuario(admin))
        lista = [admin]
      } else {
        lista = data.map(mapUsuario)
      }

      setUsuarios(lista)

      // Restaura sessão salva no localStorage
      const sessaoId = localStorage.getItem(SESSAO_KEY)
      if (sessaoId) {
        const sessaoUsuario = lista.find((u) => u.id === sessaoId && u.ativo)
        if (sessaoUsuario) setUsuario(sessaoUsuario)
      }

      setCarregando(false)
    }
    init()
  }, [])

  const login = async (loginStr: string, senha: string): Promise<Usuario | null> => {
    const { data } = await db
      .from('usuarios')
      .select('*')
      .ilike('login', loginStr)
      .eq('ativo', true)
      .maybeSingle()

    if (!data) return null

    const user = mapUsuario(data)
    const ok = await verificarSenha(senha, user.senhaHash)
    if (!ok) return null

    setUsuario(user)
    localStorage.setItem(SESSAO_KEY, user.id)
    return user
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem(SESSAO_KEY)
  }

  const pode = React.useCallback(
    (permissao: Permissao): boolean => {
      if (!usuario) return false
      return PERMISSOES[usuario.role][permissao]
    },
    [usuario]
  )

  const criarUsuario = async (dados: {
    nome: string; login: string; senha: string; role: Role
  }): Promise<{ ok: boolean; erro?: string }> => {
    const loginExiste = usuarios.some(
      (u) => u.login.toLowerCase() === dados.login.toLowerCase()
    )
    if (loginExiste) return { ok: false, erro: 'Login já está em uso.' }

    const senhaHash = await hashSenha(dados.senha)
    const novo: Usuario = {
      id: gerarId(),
      nome: dados.nome.trim(),
      login: dados.login.trim(),
      senhaHash,
      role: dados.role,
      ativo: true,
      criadoEm: new Date().toISOString(),
    }

    const { error } = await db.from('usuarios').insert(rowUsuario(novo))
    if (error) {
      console.error('[Supabase] Erro ao criar usuário:', error)
      return { ok: false, erro: 'Erro ao salvar usuário. Tente novamente.' }
    }

    setUsuarios((prev) => [...prev, novo])
    return { ok: true }
  }

  const toggleAtivo = async (id: string) => {
    if (id === usuario?.id) return
    let novoAtivo: boolean | undefined
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        novoAtivo = !u.ativo
        return { ...u, ativo: novoAtivo }
      })
    )
    if (novoAtivo !== undefined) {
      const { error } = await db.from('usuarios').update({ ativo: novoAtivo }).eq('id', id)
      if (error) console.error('[Supabase] Erro ao toggleAtivo:', error)
    }
  }

  const alterarSenha = async (id: string, novaSenha: string) => {
    const senhaHash = await hashSenha(novaSenha)
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, senhaHash } : u))
    )
    const { error } = await db.from('usuarios').update({ senha_hash: senhaHash }).eq('id', id)
    if (error) console.error('[Supabase] Erro ao alterarSenha:', error)
  }

  return (
    <AuthContext.Provider
      value={{ usuario, usuarios, carregando, login, logout, pode, criarUsuario, toggleAtivo, alterarSenha }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
