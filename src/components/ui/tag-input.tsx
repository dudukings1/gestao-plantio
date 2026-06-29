import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  sugestoes?: string[]
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, sugestoes = [], placeholder = 'Adicionar tag…', className }: TagInputProps) {
  const [input, setInput] = React.useState('')
  const [aberto, setAberto] = React.useState(false)

  const filtradas = sugestoes.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s) && input.length > 0
  )

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
    setAberto(false)
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex min-h-9 flex-wrap gap-1 rounded-md border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/50">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {aberto && filtradas.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md">
          {filtradas.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
