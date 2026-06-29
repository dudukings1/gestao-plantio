import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { MapaPage } from '@/pages/MapaPage'
import { LancarDespesaPage } from '@/pages/LancarDespesaPage'
import { HistoricoPage } from '@/pages/HistoricoPage'
import { DashboardPage } from '@/pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<MapaPage />} />
        <Route path="lancar" element={<LancarDespesaPage />} />
        <Route path="historico" element={<HistoricoPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
