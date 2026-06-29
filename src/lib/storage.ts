/**
 * Camada de persistência de baixo nível (localStorage).
 *
 * Toda a app fala com os dados através desta camada e do DataContext.
 * Para trocar por uma API/back-end no futuro, basta reimplementar estas
 * funções (ou o repositório que as usa) sem mexer nas telas.
 */

const PREFIX = 'gestao-plantio:'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // armazenamento cheio ou indisponível — ignora silenciosamente no MVP
  }
}

/** Gera um id único simples (suficiente para uso local). */
export function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
