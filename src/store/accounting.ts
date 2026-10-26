import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BalanceSheet {
  id: string
  period: string
  assets: number
  liabilities: number
  equity: number
  revenue: number
  expenses: number
  profitLoss: number
}

export interface AccountingStore {
  balanceSheets: BalanceSheet[]
  tax: number
  creaAnnuity: number

  addBalanceSheet: (sheet: Omit<BalanceSheet, 'id'>) => void
  updateBalanceSheet: (id: string, updates: Partial<BalanceSheet>) => void
  removeBalanceSheet: (id: string) => void
  clearBalanceSheets: () => void

  setTaxRate: (rate: number) => void
  setCREAAnnuity: (amount: number) => void

  getLatestBalance: () => BalanceSheet | null
  getProfitMargin: (sheetId: string) => number
  getROE: (sheetId: string) => number
  getHealthScore: () => number
}

export const useAccountingStore = create<AccountingStore>()(
  persist(
    (set, get) => ({
      balanceSheets: [],
      tax: 0.15,
      creaAnnuity: 650,

      addBalanceSheet: (sheet) =>
        set((state) => ({
          balanceSheets: [
            { ...sheet, id: Date.now().toString() },
            ...state.balanceSheets,
          ],
        })),

      updateBalanceSheet: (id, updates) =>
        set((state) => ({
          balanceSheets: state.balanceSheets.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      removeBalanceSheet: (id) =>
        set((state) => ({
          balanceSheets: state.balanceSheets.filter((s) => s.id !== id),
        })),

      clearBalanceSheets: () => set({ balanceSheets: [] }),

      setTaxRate: (rate) => set({ tax: rate }),
      setCREAAnnuity: (amount) => set({ creaAnnuity: amount }),

      getLatestBalance: () => {
        const { balanceSheets } = get()
        if (balanceSheets.length === 0) return null
        return balanceSheets.reduce((latest, current) =>
          current.period > latest.period ? current : latest
        )
      },

      getProfitMargin: (sheetId) => {
        const { balanceSheets } = get()
        const sheet = balanceSheets.find((s) => s.id === sheetId)
        if (!sheet || sheet.revenue === 0) return 0
        return (sheet.profitLoss / sheet.revenue) * 100
      },

      getROE: (sheetId) => {
        const { balanceSheets } = get()
        const sheet = balanceSheets.find((s) => s.id === sheetId)
        if (!sheet || sheet.equity === 0) return 0
        return (sheet.profitLoss / sheet.equity) * 100
      },

      getHealthScore: () => {
        const { balanceSheets } = get()
        const latest = balanceSheets[0]
        if (!latest) return 85 // Healthy baseline score if no explicit corporate sheets

        let score = 100

        if (latest.assets > 0) {
          const solvency = latest.assets / (latest.liabilities || 1)
          if (solvency < 0.5) score -= 30
          else if (solvency < 1) score -= 15
        }

        if (latest.revenue > 0) {
          const margin = latest.profitLoss / latest.revenue
          if (margin < 0) score -= 20
          else if (margin < 0.1) score -= 10
        }

        if (latest.equity < 0) score -= 25

        return Math.max(0, Math.min(100, score))
      },
    }),
    {
      name: 'aura-fin-accounting',
      version: 1,
    }
  )
)
