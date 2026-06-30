import * as React from 'react'
import { Button } from '@/components/ui/button'

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmFn | null>(null)

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<{
    opts: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = React.useCallback<ConfirmFn>(
    (opts) => new Promise((resolve) => setPending({ opts, resolve })),
    []
  )

  function responder(valor: boolean) {
    pending?.resolve(valor)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={() => responder(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-background p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {pending.opts.title && (
              <h2 className="mb-1.5 font-semibold">{pending.opts.title}</h2>
            )}
            <p className="text-sm text-muted-foreground">{pending.opts.description}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => responder(false)}>
                {pending.opts.cancelText ?? 'Cancelar'}
              </Button>
              <Button
                variant={pending.opts.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => responder(true)}
              >
                {pending.opts.confirmText ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de <ConfirmDialogProvider>')
  return ctx
}
