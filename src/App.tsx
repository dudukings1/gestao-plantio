import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { MapaPage } from '@/pages/MapaPage'
import { LancarDespesaPage } from '@/pages/LancarDespesaPage'
import { HistoricoPage } from '@/pages/HistoricoPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { UsuariosPage } from '@/pages/UsuariosPage'
import { SafrasPage } from '@/pages/SafrasPage'
import { EstoquePage } from '@/pages/EstoquePage'
import { EntradasPage } from '@/pages/EntradasPage'
import { useAuth } from '@/store/AuthContext'

function RequireAuth() {
  const { usuario, carregando } = useAuth()
  if (carregando) return null
  if (!usuario) return <Navigate to="/login" replace />
  return <Outlet />
}

function SomenteAdmin() {
  const { usuario } = useAuth()
  if (usuario?.role !== 'admin') return <Navigate to="/lancar" replace />
  return <Outlet />
}

function RequerPermissao({ permissao }: { permissao: string }) {
  const { pode } = useAuth()
  if (!pode(permissao as Parameters<typeof pode>[0])) return <Navigate to="/lancar" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Exclusivo admin */}
          <Route element={<SomenteAdmin />}>
            <Route index element={<MapaPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="safras" element={<SafrasPage />} />
            <Route path="entradas" element={<EntradasPage />} />
          </Route>

          {/* Estoque: admin + funcionário (verEstoque) */}
          <Route element={<RequerPermissao permissao="verEstoque" />}>
            <Route path="estoque" element={<EstoquePage />} />
          </Route>

          {/* Todos autenticados */}
          <Route path="lancar" element={<LancarDespesaPage />} />
          <Route path="historico" element={<HistoricoPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
