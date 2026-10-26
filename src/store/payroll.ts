import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PayrollData {
  id: string
  month: string
  baseSalary: number
  grossSalary: number
  inss: number
  irrf: number
  netSalary: number
  discounts: number
  bonuses: number
  company: string
  role: string
}

export interface PayrollSimulation {
  vacationDays: number
  vacationValue: number
  vacationThird: number
  thirteenthSalary: number
  severanceFund: number
  severancePenalty: number
  noticePay: number
  totalTermination: number
}

export interface PayrollStore {
  payrolls: PayrollData[]
  creaFee: number
  registrationNumber: string

  addPayroll: (payroll: Omit<PayrollData, 'id'>) => void
  updatePayroll: (id: string, updates: Partial<PayrollData>) => void
  removePayroll: (id: string) => void
  clearPayrolls: () => void

  setCREAFee: (fee: number) => void
  setRegistrationNumber: (number: string) => void

  simulateTermination: (baseSalary: number, monthsWorked: number, withNotice?: boolean) => PayrollSimulation
  calculateVacationBonus: (baseSalary: number, days: number) => number
  calculateTaxes: (grossSalary: number) => { inss: number; irrf: number }
  getAverageNetSalary: () => number
}

export const usePayrollStore = create<PayrollStore>()(
  persist(
    (set, get) => ({
      payrolls: [],
      creaFee: 650.00,
      registrationNumber: '',

      addPayroll: (payroll) =>
        set((state) => ({
          payrolls: [{ ...payroll, id: Date.now().toString() }, ...state.payrolls],
        })),

      updatePayroll: (id, updates) =>
        set((state) => ({
          payrolls: state.payrolls.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removePayroll: (id) =>
        set((state) => ({
          payrolls: state.payrolls.filter((p) => p.id !== id),
        })),

      clearPayrolls: () => set({ payrolls: [] }),

      setCREAFee: (fee) => set({ creaFee: fee }),
      setRegistrationNumber: (number) => set({ registrationNumber: number }),

      simulateTermination: (baseSalary, monthsWorked, withNotice = true) => {
        const safeSalary = Math.max(0, baseSalary || 0)
        const safeMonths = Math.max(1, monthsWorked || 1)

        // Férias proporcionais (avos trabalhados no último ciclo)
        const cycleMonths = safeMonths % 12 || (safeMonths >= 12 ? 12 : safeMonths)
        const vacationDays = Math.round((cycleMonths / 12) * 30)
        const vacationValue = safeSalary * (vacationDays / 30)
        const vacationThird = vacationValue / 3

        // 13º Salário proporcional (no ano corrente)
        const thirteenthMonths = safeMonths % 12 || (safeMonths >= 12 ? 12 : safeMonths)
        const thirteenthSalary = (safeSalary / 12) * thirteenthMonths

        // FGTS depositado acumulado (8% ao mês)
        const severanceFund = safeSalary * safeMonths * 0.08
        // Multa rescisória 40% do FGTS
        const severancePenalty = severanceFund * 0.40

        // Aviso prévio indenizado (30 dias + 3 dias por ano completo)
        const years = Math.floor(safeMonths / 12)
        const noticeDays = withNotice ? Math.min(90, 30 + years * 3) : 0
        const noticePay = (safeSalary / 30) * noticeDays

        const totalTermination =
          vacationValue +
          vacationThird +
          thirteenthSalary +
          severanceFund +
          severancePenalty +
          noticePay

        return {
          vacationDays,
          vacationValue,
          vacationThird,
          thirteenthSalary,
          severanceFund,
          severancePenalty,
          noticePay,
          totalTermination,
        }
      },

      calculateVacationBonus: (baseSalary, days) => {
        const base = baseSalary * (days / 30)
        return base + base / 3
      },

      calculateTaxes: (grossSalary) => {
        const safeGross = Math.max(0, grossSalary || 0)

        // INSS Progressivo 2024 / 2025
        let inss = 0
        const faixasINSS = [
          { limite: 1412.00, aliq: 0.075 },
          { limite: 2666.68, aliq: 0.09 },
          { limite: 4000.03, aliq: 0.12 },
          { limite: 7786.02, aliq: 0.14 },
        ]

        let salarioRestante = safeGross
        let limiteAnterior = 0

        for (const faixa of faixasINSS) {
          if (salarioRestante <= 0) break
          const faixaBase = Math.min(salarioRestante, faixa.limite - limiteAnterior)
          if (faixaBase > 0) {
            inss += faixaBase * faixa.aliq
            salarioRestante -= faixaBase
          }
          limiteAnterior = faixa.limite
          if (safeGross <= faixa.limite) break
        }

        // Teto do INSS
        const tetoINSS = 908.85
        inss = Math.min(inss, tetoINSS)

        // Base IRRF = Bruto - INSS
        const baseIRRF = Math.max(0, safeGross - inss)
        let irrf = 0

        // Tabela Progressiva IRRF 2024 / 2025
        if (baseIRRF > 4664.68) {
          irrf = baseIRRF * 0.275 - 896.00
        } else if (baseIRRF > 3751.05) {
          irrf = baseIRRF * 0.225 - 662.77
        } else if (baseIRRF > 2826.65) {
          irrf = baseIRRF * 0.15 - 370.40
        } else if (baseIRRF > 2259.20) {
          irrf = baseIRRF * 0.075 - 169.44
        } else {
          irrf = 0
        }

        irrf = Math.max(0, irrf)

        return { inss: Number(inss.toFixed(2)), irrf: Number(irrf.toFixed(2)) }
      },

      getAverageNetSalary: () => {
        const { payrolls } = get()
        if (payrolls.length === 0) return 0
        const totalNet = payrolls.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0)
        return totalNet / payrolls.length
      },
    }),
    {
      name: 'aura-fin-payroll',
      version: 1,
    }
  )
)
