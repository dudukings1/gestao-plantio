import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, List, Map, PlusCircle, Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Mapa', icon: Map, end: true },
  { to: '/lancar', label: 'Lançar despesa', icon: PlusCircle, end: false },
  { to: '/historico', label: 'Histórico', icon: List, end: false },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, end: false },
]

export function AppLayout() {
  return (
    <div className="flex min-h-svh">
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
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
        </nav>
      </aside>

      {/* Navegação mobile (topo) */}
      <div className="flex w-full flex-col">
        <header className="flex items-center gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
