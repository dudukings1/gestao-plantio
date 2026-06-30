import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './store/DataContext.tsx'
import { AuthProvider } from './store/AuthContext.tsx'
import { ConfirmDialogProvider } from './components/ui/confirm-dialog.tsx'
import { Toaster } from './components/ui/toast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmDialogProvider>
          <DataProvider>
            <App />
            <Toaster />
          </DataProvider>
        </ConfirmDialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
