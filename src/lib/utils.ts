/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarMoeda(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function formatCurrency(value: number): string {
  return formatarMoeda(value)
}

export function formatarData(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d =
      typeof date === 'string' ? new Date(date.includes('T') ? date : `${date}T12:00:00`) : date
    if (isNaN(d.getTime())) return String(date)
    return new Intl.DateTimeFormat('pt-BR').format(d)
  } catch {
    return String(date)
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  return formatarData(date)
}
