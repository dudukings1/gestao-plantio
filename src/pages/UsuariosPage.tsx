import * as React from 'react'
import { UserPlus, KeyRound, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/store/AuthContext'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

export function UsuariosPage() {
  const { usuario: usuarioLogado, usuarios, criarUsuario, toggleAtivo, alterarSenha } = useAuth()

  // Formulário de criação
  const [mostrarForm, setMostrarForm] = React.useState(false)
  const [nome, setNome] = React.useState('')
  const [login, setLogin] = React.useState('')
  const [senha, setSenha] = React.useState('')
  const [role, setRole] = React.useState<Role>('funcionario')
  const [erroForm, setErroForm] = React.useState('')
  const [salvando, setSalvando] = React.useState(false)

  // Alteração de senha
  const [alterandoSenhaId, setAlterandoSenhaId] = React.useState<string | null>(null)
  const [novaSenha, setNovaSenha] = React.useState('')

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErroForm('')
    if (senha.length < 4) { setErroForm('A senha deve ter ao menos 4 caracteres.'); return }
    setSalvando(true)
    const { ok, erro } = await criarUsuario({ nome, login, senha, role })
    setSalvando(false)
    if (!ok) { setErroForm(erro ?? 'Erro ao criar usuário.'); return }
    setNome(''); setLogin(''); setSenha(''); setRole('funcionario')
    setMostrarForm(false)
  }

  async function handleAlterarSenha(id: string) {
    if (novaSenha.length < 4) return
    await alterarSenha(id, novaSenha)
    setAlterandoSenhaId(null)
    setNovaSenha('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie o acesso ao sistema</p>
        </div>
        <Button onClick={() => setMostrarForm((v) => !v)} variant={mostrarForm ? 'outline' : 'default'}>
          <UserPlus className="mr-2 size-4" />
          Novo usuário
        </Button>
      </div>

      {/* Formulário de criação */}
      {mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criar usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCriar} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="u-nome">Nome completo</Label>
                  <Input id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="u-login">Login</Label>
                  <Input id="u-login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="joao.silva" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="u-senha">Senha</Label>
                  <Input id="u-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mín. 4 caracteres" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="u-role">Perfil</Label>
                  <select
                    id="u-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={salvando || !nome || !login || !senha}>
                  {salvando ? 'Salvando…' : 'Criar usuário'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuários */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Login</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const ehVoce = u.id === usuarioLogado?.id
                return (
                  <React.Fragment key={u.id}>
                    <tr className={cn('border-b last:border-0', !u.ativo && 'opacity-50')}>
                      <td className="px-4 py-3 font-medium">
                        {u.nome}
                        {ehVoce && (
                          <span className="ml-1.5 rounded bg-primary/10 px-1.5 text-xs text-primary">você</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.login}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium',
                          u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {u.role === 'admin' ? 'Admin' : 'Funcionário'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium', u.ativo ? 'text-green-600' : 'text-muted-foreground')}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setAlterandoSenhaId(alterandoSenhaId === u.id ? null : u.id)
                              setNovaSenha('')
                            }}
                            title="Alterar senha"
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                          >
                            <KeyRound className="size-4" />
                          </button>
                          {!ehVoce && (
                            <button
                              onClick={() => toggleAtivo(u.id)}
                              title={u.ativo ? 'Desativar' : 'Ativar'}
                              className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                            >
                              {u.ativo ? <ToggleRight className="size-4 text-primary" /> : <ToggleLeft className="size-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {alterandoSenhaId === u.id && (
                      <tr className="border-b bg-muted/30 last:border-0">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="password"
                              placeholder="Nova senha (mín. 4 caracteres)"
                              value={novaSenha}
                              onChange={(e) => setNovaSenha(e.target.value)}
                              className="h-8 max-w-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAlterarSenha(u.id)}
                              disabled={novaSenha.length < 4}
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setAlterandoSenhaId(null); setNovaSenha('') }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
