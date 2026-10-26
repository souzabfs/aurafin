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

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: CategoryType
  description: string
  date: string
  dueDate?: string
  status: 'pending' | 'completed'
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly'
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
  removeTransaction: (id: string) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  clearTransactions: () => void

  addAccount: (account: Omit<Account, 'id'>) => void
  removeAccount: (id: string) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  resetFinanceData: () => void

  getTotalIncome: (startDate?: string, endDate?: string) => number
  getTotalExpense: (startDate?: string, endDate?: string) => number
  getBalance: () => number
  getTransactionsByCategory: (category: CategoryType) => Transaction[]
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
      // ZERADO: Inicializado completamente zerado conforme solicitado pelo usuário
      transactions: [],
      accounts: initialAccounts,

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            { ...transaction, id: Date.now().toString() + Math.random().toString(36).substring(2, 6) },
            ...state.transactions,
          ],
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
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

      getTotalIncome: (startDate, endDate) => {
        const { transactions } = get()
        return transactions
          .filter((t) => {
            if (t.type !== 'income') return false
            if (startDate && t.date < startDate) return false
            if (endDate && t.date > endDate) return false
            return true
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      },

      getTotalExpense: (startDate, endDate) => {
        const { transactions } = get()
        return transactions
          .filter((t) => {
            if (t.type !== 'expense') return false
            if (startDate && t.date < startDate) return false
            if (endDate && t.date > endDate) return false
            return true
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      },

      getBalance: () => {
        const { transactions, accounts } = get()
        const initialAccountBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
        const netTransactions = transactions.reduce((sum, t) => {
          const val = Number(t.amount) || 0
          if (t.type === 'income') return sum + val
          if (t.type === 'expense') return sum - val
          return sum
        }, 0)
        return initialAccountBalance + netTransactions
      },

      getTransactionsByCategory: (category) => {
        const { transactions } = get()
        return transactions.filter((t) => t.category === category)
      },
    }),
    {
      name: 'aura-fin-finance',
      version: 2, // Bumped to 2 to clear old sample/registered entries & exits
      migrate: (persistedState: any) => {
        // Garantir que todas as entradas e saídas estejam zeradas
        return {
          ...(persistedState || {}),
          transactions: [],
          accounts: (persistedState?.accounts && persistedState.accounts.length > 0)
            ? persistedState.accounts.map((acc: Account) => ({ ...acc, balance: 0 }))
            : initialAccounts,
        }
      },
    }
  )
)
