import * as React from 'react'
import type { Role, Usuario } from '@/lib/types'
import { hashSenha, verificarSenha, PERMISSOES, type Permissao } from '@/lib/auth'
import { gerarId, load, save } from '@/lib/storage'

interface AuthContextValue {
  usuario: Usuario | null
  usuarios: Usuario[]
  carregando: boolean
  login: (login: string, senha: string) => Promise<Usuario | null>
  logout: () => void
  pode: (permissao: Permissao) => boolean
  // Gerenciamento de usuários (admin)
  criarUsuario: (dados: { nome: string; login: string; senha: string; role: Role }) => Promise<{ ok: boolean; erro?: string }>
  toggleAtivo: (id: string) => void
  alterarSenha: (id: string, novaSenha: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = React.useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([])
  const [carregando, setCarregando] = React.useState(true)

  // Inicialização: cria admin padrão se não houver usuários; restaura sessão.
  React.useEffect(() => {
    const init = async () => {
      let lista = load<Usuario[]>('usuarios', [])

      if (lista.length === 0) {
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
        lista = [admin]
        save('usuarios', lista)
      }

      setUsuarios(lista)

      const sessaoId = load<string | null>('sessao', null)
      if (sessaoId) {
        const sessaoUsuario = lista.find((u) => u.id === sessaoId && u.ativo)
        if (sessaoUsuario) setUsuario(sessaoUsuario)
      }

      setCarregando(false)
    }
    init()
  }, [])

  const login = async (loginStr: string, senha: string): Promise<Usuario | null> => {
    const encontrado = usuarios.find(
      (u) => u.login.toLowerCase() === loginStr.toLowerCase() && u.ativo
    )
    if (!encontrado) return null
    const ok = await verificarSenha(senha, encontrado.senhaHash)
    if (!ok) return null
    setUsuario(encontrado)
    save('sessao', encontrado.id)
    return encontrado
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('gestao-plantio:sessao')
  }

  const pode = React.useCallback(
    (permissao: Permissao): boolean => {
      if (!usuario) return false
      return PERMISSOES[usuario.role][permissao]
    },
    [usuario]
  )

  const criarUsuario = async (dados: {
    nome: string
    login: string
    senha: string
    role: Role
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
    const atualizada = [...usuarios, novo]
    setUsuarios(atualizada)
    save('usuarios', atualizada)
    return { ok: true }
  }

  const toggleAtivo = (id: string) => {
    // Não permite desativar o próprio usuário logado
    if (id === usuario?.id) return
    const atualizada = usuarios.map((u) =>
      u.id === id ? { ...u, ativo: !u.ativo } : u
    )
    setUsuarios(atualizada)
    save('usuarios', atualizada)
  }

  const alterarSenha = async (id: string, novaSenha: string) => {
    const senhaHash = await hashSenha(novaSenha)
    const atualizada = usuarios.map((u) =>
      u.id === id ? { ...u, senhaHash } : u
    )
    setUsuarios(atualizada)
    save('usuarios', atualizada)
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
