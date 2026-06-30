import * as React from 'react'
import { Check, Plus, Star, StarOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { cn, formatDate } from '@/lib/utils'

export function SafrasPage() {
  const { safras, adicionarSafra, toggleSafra, removerSafra } = useData()
  const { usuario } = useAuth()

  const [mostrarForm, setMostrarForm] = React.useState(false)
  const [nome, setNome] = React.useState('')
  const [cultura, setCultura] = React.useState('')
  const [ativaForm, setAtivaForm] = React.useState(true)

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    adicionarSafra({ nome: nome.trim(), cultura: cultura.trim(), ativa: ativaForm })
    setNome('')
    setCultura('')
    setAtivaForm(true)
    setMostrarForm(false)
  }

  const isAdmin = usuario?.role === 'admin'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Safras</h1>
          <p className="text-sm text-muted-foreground">
            Agrupe despesas por safra. Múltiplas safras podem estar ativas ao mesmo tempo.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setMostrarForm((v) => !v)} variant={mostrarForm ? 'outline' : 'default'}>
            <Plus className="mr-1 size-4" />
            Nova safra
          </Button>
        )}
      </div>

      {mostrarForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Criar safra</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCriar} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="s-nome">Nome</Label>
                  <Input
                    id="s-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Soja 24/25"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="s-cultura">Cultura</Label>
                  <Input
                    id="s-cultura"
                    value={cultura}
                    onChange={(e) => setCultura(e.target.value)}
                    placeholder="Ex.: Soja"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ativaForm}
                  onChange={(e) => setAtivaForm(e.target.checked)}
                  className="accent-primary"
                />
                Iniciar como ativa
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={!nome.trim()}>
                  <Check className="mr-1 size-4" /> Criar safra
                </Button>
                <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {safras.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma safra cadastrada ainda.
            {isAdmin && <> Clique em <strong>Nova safra</strong> para começar.</>}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {[...safras].reverse().map((s) => (
            <Card
              key={s.id}
              className={cn('transition-colors', s.ativa && 'border-primary/50 bg-primary/5')}
            >
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  {s.ativa ? (
                    <Star className="size-4 shrink-0 fill-primary text-primary" />
                  ) : (
                    <Star className="size-4 shrink-0 text-muted-foreground/30" />
                  )}
                  <div>
                    <p className="font-semibold">{s.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.cultura || '—'} · criada em {formatDate(s.criadoEm.slice(0, 10))}
                    </p>
                  </div>
                  {s.ativa && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      ativa
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant={s.ativa ? 'outline' : 'outline'}
                      onClick={() => toggleSafra(s.id)}
                      title={s.ativa ? 'Desativar safra' : 'Ativar safra'}
                    >
                      {s.ativa ? (
                        <><StarOff className="mr-1 size-3" /> Desativar</>
                      ) : (
                        <><Star className="mr-1 size-3" /> Ativar</>
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Excluir a safra "${s.nome}"?`)) removerSafra(s.id)
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
