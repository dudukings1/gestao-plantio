import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, Boxes, List, Loader2, LogOut, Map, Package, PlusCircle, Sprout, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/AuthContext'
import { useData } from '@/store/DataContext'
import type { Permissao } from '@/lib/auth'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end: boolean
  permissao: Permissao
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Mapa', icon: Map, end: true, permissao: 'verMapa' },
  { to: '/lancar', label: 'Lançar despesa', icon: PlusCircle, end: false, permissao: 'lancarDespesa' },
  { to: '/historico', label: 'Histórico', icon: List, end: false, permissao: 'verHistorico' },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, end: false, permissao: 'verDashboard' },
  { to: '/safras', label: 'Safras', icon: Boxes, end: false, permissao: 'gerenciarSafras' },
  { to: '/estoque', label: 'Estoque', icon: Package, end: false, permissao: 'verEstoque' },
  { to: '/entradas', label: 'Entradas', icon: TrendingUp, end: false, permissao: 'verEntradas' },
  { to: '/usuarios', label: 'Usuários', icon: Users, end: false, permissao: 'gerenciarUsuarios' },
]

function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              className,
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

export function AppLayout() {
  const { usuario, logout, pode } = useAuth()
  const { carregando: dadosCarregando } = useData()
  const navigate = useNavigate()

  const navVisivel = NAV_ITEMS.filter((item) => pode(item.permissao))

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const roleBadge = usuario?.role === 'admin' ? 'Admin' : 'Funcionário'
  const roleCor = usuario?.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'

  return (
    <div className="flex min-h-svh">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card px-3 py-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold">Gestão Plantio</p>
            <p className="text-xs text-muted-foreground">Despesas por área</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLinks
            items={navVisivel}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          />
        </nav>

        {/* Usuário logado + logout */}
        <div className="mt-auto border-t pt-3">
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary uppercase">
              {usuario?.nome?.[0] ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{usuario?.nome}</p>
              <span className={cn('inline-block rounded px-1.5 text-xs font-medium', roleCor)}>
                {roleBadge}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Navegação mobile (topo) */}
      <div className="flex w-full flex-col">
        <header className="flex items-center gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
          <NavLinks
            items={navVisivel}
            className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium"
          />
          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {dadosCarregando ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Carregando dados…</span>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
