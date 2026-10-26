import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (
  value: number,
  currency: string = 'BRL'
): string => {
  const safeValue = isNaN(value) || !isFinite(value) ? 0 : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(safeValue)
}

export const parseCurrencyInput = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null) return 0
  if (typeof input === 'number') return isNaN(input) ? 0 : input

  let str = input.toString().replace(/[R$\s]/g, '').trim()
  if (!str) return 0

  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      str = str.replace(/,/g, '')
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.')
  }

  const num = parseFloat(str)
  return isNaN(num) || !isFinite(num) ? 0 : num
}

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '-'
  try {
    let d: Date
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        d = parse(date, 'yyyy-MM-dd', new Date())
      } else if (/^\d{4}-\d{2}$/.test(date)) {
        d = parse(`${date}-01`, 'yyyy-MM-dd', new Date())
      } else {
        d = new Date(date)
      }
    } else {
      d = date
    }

    if (!isValid(d)) return typeof date === 'string' ? date : '-'
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return typeof date === 'string' ? date : '-'
  }
}

export const formatMonth = (date: string | Date | undefined | null): string => {
  if (!date) return '-'
  try {
    let d: Date
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}$/.test(date)) {
        d = parse(`${date}-01`, 'yyyy-MM-dd', new Date())
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        d = parse(date, 'yyyy-MM-dd', new Date())
      } else {
        d = new Date(date)
      }
    } else {
      d = date
    }

    if (!isValid(d)) return typeof date === 'string' ? date : '-'
    const formatted = format(d, 'MMMM / yyyy', { locale: ptBR })
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  } catch {
    return typeof date === 'string' ? date : '-'
  }
}

export const getMonthRange = (date: Date): { start: string; end: string } => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    salary: 'Salário',
    freelance: 'Freelancer',
    investment: 'Investimentos',
    food: 'Alimentação',
    transport: 'Transporte',
    utilities: 'Contas Fixas',
    health: 'Saúde',
    education: 'Educação',
    entertainment: 'Lazer e Entretenimento',
    other: 'Outros',
  }
  return labels[category] || category
}

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    salary: '#10b981',
    freelance: '#06b6d4',
    investment: '#3b82f6',
    food: '#f59e0b',
    transport: '#8b5cf6',
    utilities: '#ef4444',
    health: '#ec4899',
    education: '#6366f1',
    entertainment: '#14b8a6',
    other: '#6b7280',
  }
  return colors[category] || '#6b7280'
}

export const calculateAge = (birthDate: string | Date): number => {
  const today = new Date()
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export const calculateMonthsDifference = (startDate: Date, endDate: Date): number => {
  return (
    endDate.getFullYear() * 12 +
    endDate.getMonth() -
    (startDate.getFullYear() * 12 + startDate.getMonth())
  )
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const sumArray = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

export const averageArray = (arr: number[]): number =>
  arr.length > 0 ? sumArray(arr) / arr.length : 0

export const percentageChange = (initial: number, final: number): number => {
  if (initial === 0) return final === 0 ? 0 : 100
  return ((final - initial) / initial) * 100
}
