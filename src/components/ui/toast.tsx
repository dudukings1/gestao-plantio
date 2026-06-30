import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'destructive' | 'success'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

let toasts: ToastItem[] = []
let listeners: Array<(items: ToastItem[]) => void> = []

function emit() {
  listeners.forEach((l) => l(toasts))
}

function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function toast(opts: ToastOptions) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, {
    id, title: opts.title, description: opts.description,
    variant: opts.variant ?? 'default',
  }]
  emit()
  window.setTimeout(() => dismissToast(id), opts.duration ?? 5000)
  return id
}

function useToastList() {
  const [items, setItems] = React.useState(toasts)
  React.useEffect(() => {
    listeners.push(setItems)
    return () => {
      listeners = listeners.filter((l) => l !== setItems)
    }
  }, [])
  return items
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="size-4 shrink-0 text-foreground" />,
  destructive: <AlertCircle className="size-4 shrink-0 text-destructive" />,
  success: <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />,
}

export function Toaster() {
  const items = useToastList()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-2 rounded-lg border bg-background p-3 shadow-lg',
            t.variant === 'destructive' && 'border-destructive/50'
          )}
        >
          {ICONS[t.variant]}
          <div className="flex-1 text-sm">
            <p className="font-medium">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
