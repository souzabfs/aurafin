import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TransactionType = 'income' | 'expense' | 'transfer'
export type CategoryType =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'health'
  | 'education'
  | 'entertainment'
  | 'other'

export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'yearly'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: CategoryType
  description: string
  date: string // YYYY-MM-DD
  dueDate?: string
  status: 'pending' | 'completed' // pending = projetado / a confirmar; completed = efetivado
  effectiveDate?: string // data em que foi efetivado
  recurrence?: RecurrenceType
  recurrenceId?: string // identificador de série recorrente
  installmentCurrent?: number // ex: 1
  installmentTotal?: number // ex: 12
}

export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit'
  balance: number
  currency: string
  color?: string
}

export interface FinanceStore {
  transactions: Transaction[]
  accounts: Account[]

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  addRecurringTransaction: (
    baseTransaction: Omit<Transaction, 'id'>,
    options: {
      frequency: RecurrenceType
      occurrences: number
      firstIsCompleted?: boolean
    }
  ) => void
  removeTransaction: (id: string) => void
  removeRecurrenceSeries: (recurrenceId: string) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  toggleTransactionStatus: (id: string) => void
  setTransactionStatus: (id: string, status: 'pending' | 'completed') => void
  clearTransactions: () => void

  addAccount: (account: Omit<Account, 'id'>) => void
  removeAccount: (id: string) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  resetFinanceData: () => void

  // Contabilização apenas das despesas e receitas efetivadas por padrão
  getTotalIncome: (startDate?: string, endDate?: string, onlyCompleted?: boolean) => number
  getTotalExpense: (startDate?: string, endDate?: string, onlyCompleted?: boolean) => number
  getBalance: (onlyCompleted?: boolean) => number

  // Métricas comparativas de Fluxo Projetado x Efetivado
  getFlowComparison: (startDate?: string, endDate?: string) => {
    projectedIncome: number
    completedIncome: number
    pendingIncome: number
    projectedExpense: number
    completedExpense: number
    pendingExpense: number
    projectedNet: number
    completedNet: number
    pendingNet: number
    incomeExecutionRate: number
    expenseExecutionRate: number
  }

  getTransactionsByCategory: (category: CategoryType, onlyCompleted?: boolean) => Transaction[]
}

const initialAccounts: Account[] = [
  {
    id: '1',
    name: 'Conta Principal',
    type: 'checking',
    balance: 0,
    currency: 'BRL',
    color: '#6366f1',
  },
]

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      accounts: initialAccounts,

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            {
              ...transaction,
              id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
              effectiveDate: transaction.status === 'completed' ? (transaction.effectiveDate || transaction.date) : undefined,
            },
            ...state.transactions,
          ],
        })),

      addRecurringTransaction: (baseTransaction, options) => {
        const { frequency, occurrences, firstIsCompleted = false } = options
        const count = Math.max(1, Math.min(60, occurrences || 12))
        const recurrenceId = 'rec_' + Date.now().toString() + Math.random().toString(36).substring(2, 6)

        const startDate = new Date(baseTransaction.date + 'T12:00:00')
        const newTransactions: Transaction[] = []

        for (let i = 0; i < count; i++) {
          const itemDate = new Date(startDate)

          if (frequency === 'weekly') {
            itemDate.setDate(startDate.getDate() + i * 7)
          } else if (frequency === 'yearly') {
            itemDate.setFullYear(startDate.getFullYear() + i)
          } else {
            // default: monthly
            itemDate.setMonth(startDate.getMonth() + i)
          }

          const year = itemDate.getFullYear()
          const month = String(itemDate.getMonth() + 1).padStart(2, '0')
          const day = String(itemDate.getDate()).padStart(2, '0')
          const dateString = `${year}-${month}-${day}`

          const isFirst = i === 0
          const status = isFirst && firstIsCompleted ? 'completed' : 'pending'

          newTransactions.push({
            ...baseTransaction,
            id: Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substring(2, 5),
            date: dateString,
            recurrence: frequency,
            recurrenceId,
            installmentCurrent: i + 1,
            installmentTotal: count,
            status,
            effectiveDate: status === 'completed' ? dateString : undefined,
          })
        }

        set((state) => ({
          transactions: [...newTransactions, ...state.transactions],
        }))
      },

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      removeRecurrenceSeries: (recurrenceId) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.recurrenceId !== recurrenceId),
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      toggleTransactionStatus: (id) =>
        set((state) => ({
          transactions: state.transactions.map((t) => {
            if (t.id !== id) return t
            const nextStatus = t.status === 'completed' ? 'pending' : 'completed'
            return {
              ...t,
              status: nextStatus,
              effectiveDate: nextStatus === 'completed' ? (t.effectiveDate || new Date().toISOString().split('T')[0]) : undefined,
            }
          }),
        })),

      setTransactionStatus: (id, status) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  effectiveDate: status === 'completed' ? (t.effectiveDate || new Date().toISOString().split('T')[0]) : undefined,
                }
              : t
          ),
        })),

      clearTransactions: () => {
        set({ transactions: [] })
      },

      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, { ...account, id: Date.now().toString() }],
        })),

      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      resetFinanceData: () => {
        set({
          transactions: [],
          accounts: initialAccounts,
        })
      },

      // Por padrão calcula todos os lançamentos salvos no sistema
      getTotalIncome: (startDate, endDate, onlyCompleted = false) => {
        const { transactions } = get()
        return transactions
          .filter((t) => {
            if (t.type !== 'income') return false
            if (onlyCompleted && t.status !== 'completed') return false
            if (startDate && t.date < startDate) return false
            if (endDate && t.date > endDate) return false
            return true
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      },

      getTotalExpense: (startDate, endDate, onlyCompleted = false) => {
        const { transactions } = get()
        return transactions
          .filter((t) => {
            if (t.type !== 'expense') return false
            if (onlyCompleted && t.status !== 'completed') return false
            if (startDate && t.date < startDate) return false
            if (endDate && t.date > endDate) return false
            return true
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      },

      // Saldo geral: calcula todos os lançamentos cadastrados por padrão
      getBalance: (onlyCompleted = false) => {
        const { transactions, accounts } = get()
        const initialAccountBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
        const netTransactions = transactions.reduce((sum, t) => {
          if (onlyCompleted && t.status !== 'completed') return sum
          const val = Number(t.amount) || 0
          if (t.type === 'income') return sum + val
          if (t.type === 'expense') return sum - val
          return sum
        }, 0)
        return initialAccountBalance + netTransactions
      },

      // Comparação consolidada: Fluxo Projetado x Efetivado
      getFlowComparison: (startDate, endDate) => {
        const { transactions } = get()

        let projectedIncome = 0
        let completedIncome = 0
        let projectedExpense = 0
        let completedExpense = 0

        transactions.forEach((t) => {
          if (startDate && t.date < startDate) return
          if (endDate && t.date > endDate) return

          const val = Number(t.amount) || 0
          if (t.type === 'income') {
            projectedIncome += val
            if (t.status === 'completed') {
              completedIncome += val
            }
          } else if (t.type === 'expense') {
            projectedExpense += val
            if (t.status === 'completed') {
              completedExpense += val
            }
          }
        })

        const pendingIncome = Math.max(0, projectedIncome - completedIncome)
        const pendingExpense = Math.max(0, projectedExpense - completedExpense)

        const projectedNet = projectedIncome - projectedExpense
        const completedNet = completedIncome - completedExpense
        const pendingNet = pendingIncome - pendingExpense

        const incomeExecutionRate = projectedIncome > 0 ? (completedIncome / projectedIncome) * 100 : 0
        const expenseExecutionRate = projectedExpense > 0 ? (completedExpense / projectedExpense) * 100 : 0

        return {
          projectedIncome,
          completedIncome,
          pendingIncome,
          projectedExpense,
          completedExpense,
          pendingExpense,
          projectedNet,
          completedNet,
          pendingNet,
          incomeExecutionRate,
          expenseExecutionRate,
        }
      },

      getTransactionsByCategory: (category, onlyCompleted = false) => {
        const { transactions } = get()
        return transactions.filter((t) => {
          if (t.category !== category) return false
          if (onlyCompleted && t.status !== 'completed') return false
          return true
        })
      },
    }),
    {
      name: 'aura-fin-finance',
      version: 3, // Bumped to 3 to support recurring transactions and confirmed status
    }
  )
)
