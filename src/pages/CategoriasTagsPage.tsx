import * as React from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useData } from '@/store/DataContext'

const CORES_PADRAO = [
  '#f59e0b', '#16a34a', '#a16207', '#dc2626',
  '#2563eb', '#7c3aed', '#64748b', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1',
]

export function CategoriasTagsPage() {
  const {
    categorias, adicionarCategoria, removerCategoria,
    tagsCadastradas, adicionarTagCadastrada, removerTagCadastrada,
    despesas,
  } = useData()
  const confirm = useConfirm()

  // Form nova categoria
  const [nomeCat, setNomeCat] = React.useState('')
  const [corCat, setCorCat] = React.useState('#64748b')
  const [mostrarFormCat, setMostrarFormCat] = React.useState(false)

  // Form nova tag
  const [nomeTag, setNomeTag] = React.useState('')
  const [mostrarFormTag, setMostrarFormTag] = React.useState(false)

  function handleCriarCategoria(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeCat.trim()) return
    adicionarCategoria({ nome: nomeCat.trim(), cor: corCat })
    setNomeCat('')
    setCorCat('#64748b')
    setMostrarFormCat(false)
  }

  function handleCriarTag(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeTag.trim()) return
    const jaExiste = tagsCadastradas.some(
      (t) => t.nome.toLowerCase() === nomeTag.trim().toLowerCase()
    )
    if (jaExiste) { setNomeTag(''); return }
    adicionarTagCadastrada(nomeTag.trim())
    setNomeTag('')
    setMostrarFormTag(false)
  }

  function usosCategoria(id: string) {
    return despesas.filter((d) => d.categoria === id).length
  }

  function usosTag(nome: string) {
    return despesas.filter((d) => d.tags?.includes(nome)).length
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Categorias e Tags</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as categorias de despesa e as tags disponíveis para lançamento.
        </p>
      </div>

      {/* ── CATEGORIAS ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categorias</h2>
          <Button
            size="sm"
            variant={mostrarFormCat ? 'outline' : 'default'}
            onClick={() => setMostrarFormCat((v) => !v)}
          >
            <Plus className="mr-1 size-3" /> Nova categoria
          </Button>
        </div>

        {mostrarFormCat && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Criar categoria</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCriarCategoria} className="flex flex-col gap-4">
                <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <Label htmlFor="cat-nome">Nome</Label>
                    <Input
                      id="cat-nome"
                      value={nomeCat}
                      onChange={(e) => setNomeCat(e.target.value)}
                      placeholder="Ex.: Irrigação"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="cat-cor">Cor</Label>
                    <input
                      id="cat-cor"
                      type="color"
                      value={corCat}
                      onChange={(e) => setCorCat(e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded-md border bg-transparent p-1"
                    />
                  </div>
                </div>
                {/* Paleta de cores rápidas */}
                <div className="flex flex-wrap gap-2">
                  {CORES_PADRAO.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setCorCat(cor)}
                      className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: cor,
                        borderColor: corCat === cor ? 'white' : 'transparent',
                        outline: corCat === cor ? `2px solid ${cor}` : 'none',
                      }}
                      title={cor}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={!nomeCat.trim()}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setMostrarFormCat(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-2">
          {categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma categoria cadastrada.</p>
          ) : (
            categorias.map((c) => {
              const usos = usosCategoria(c.id)
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-4 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                    <span className="font-medium">{c.nome}</span>
                    {usos > 0 && (
                      <span className="text-xs text-muted-foreground">{usos} despesa{usos > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={usos > 0}
                    title={usos > 0 ? 'Categoria em uso — não pode ser excluída' : 'Excluir'}
                    onClick={async () => {
                      if (await confirm({ description: `Excluir categoria "${c.nome}"?`, variant: 'destructive' })) {
                        removerCategoria(c.id)
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ── TAGS ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tags</h2>
          <Button
            size="sm"
            variant={mostrarFormTag ? 'outline' : 'default'}
            onClick={() => setMostrarFormTag((v) => !v)}
          >
            <Plus className="mr-1 size-3" /> Nova tag
          </Button>
        </div>

        {mostrarFormTag && (
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleCriarTag} className="flex gap-2">
                <Input
                  value={nomeTag}
                  onChange={(e) => setNomeTag(e.target.value)}
                  placeholder="Nome da tag"
                  required
                  autoFocus
                  className="flex-1"
                />
                <Button type="submit" disabled={!nomeTag.trim()}>Criar</Button>
                <Button type="button" variant="outline" onClick={() => setMostrarFormTag(false)}>×</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {tagsCadastradas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma tag cadastrada. Clique em <strong>Nova tag</strong> para criar.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tagsCadastradas.map((t) => {
              const usos = usosTag(t.nome)
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/30 pl-3 pr-1.5 py-1"
                >
                  <Tag className="size-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{t.nome}</span>
                  {usos > 0 && (
                    <span className="text-xs text-muted-foreground ml-0.5">({usos})</span>
                  )}
                  <button
                    onClick={async () => {
                      if (await confirm({ description: `Excluir tag "${t.nome}"?`, variant: 'destructive' })) {
                        removerTagCadastrada(t.id)
                      }
                    }}
                    className="ml-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir tag"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
