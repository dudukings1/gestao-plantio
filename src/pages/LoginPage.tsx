import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/store/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loginStr, setLoginStr] = React.useState('')
  const [senha, setSenha] = React.useState('')
  const [erro, setErro] = React.useState('')
  const [carregando, setCarregando] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const usuarioLogado = await login(loginStr.trim(), senha)
    setCarregando(false)
    if (!usuarioLogado) {
      setErro('Login ou senha incorretos.')
      return
    }
    // Admin → Mapa; funcionário → Lançar despesa
    navigate(usuarioLogado.role === 'admin' ? '/' : '/lancar', { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow">
            <Sprout className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão Plantio</h1>
          <p className="text-sm text-muted-foreground">
            Faça login para continuar
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Entrar</CardTitle>
            <CardDescription>
              Primeiro acesso: <code className="rounded bg-muted px-1">admin</code>{' '}
              /{' '}
              <code className="rounded bg-muted px-1">admin123</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="login">Login</Label>
                <Input
                  id="login"
                  autoComplete="username"
                  autoFocus
                  value={loginStr}
                  onChange={(e) => setLoginStr(e.target.value)}
                  placeholder="seu.login"
                />
              </div>
              <div>
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {erro && (
                <p className="text-sm font-medium text-destructive">{erro}</p>
              )}
              <Button type="submit" disabled={carregando || !loginStr || !senha}>
                {carregando ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
