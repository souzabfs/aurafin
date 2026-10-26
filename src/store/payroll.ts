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

export type TerminationType =
  | 'sem_justa_causa_indenizado' // Normal / Sem justa causa (aviso indenizado)
  | 'sem_justa_causa_trabalhado' // Sem justa causa (aviso trabalhado)
  | 'justa_causa' // Demissão por justa causa (falta grave)
  | 'pedido_demissao' // Pedido de demissão pelo empregado
  | 'acordo_comum' // Demissão por acordo mútuo (Art. 484-A)

export interface TerminationSimulation {
  type: TerminationType
  typeLabel: string
  baseSalary: number
  monthsWorked: number
  daysWorkedInMonth: number
  noticeDays: number
  noticePay: number
  salaryBalance: number
  vacationDays: number
  vacationValue: number
  vacationThird: number
  expiredVacationValue: number
  thirteenthSalary: number
  severanceFund: number
  severancePenalty: number
  inssDiscount: number
  irrfDiscount: number
  totalGross: number
  totalDiscounts: number
  totalTermination: number
  fgtsWithdrawal: number // valor liberado para saque imediato do FGTS
  fgtsWithdrawnAllowed: boolean
}

export interface VacationSimulation {
  baseSalary: number
  vacationDays: number
  sellTenDays: boolean // Abono pecuniário
  advanceThirteenth: boolean // Adiantamento 50% do 13º
  salaryVacation: number
  constitutionalThird: number
  abonoPecuniario: number
  abonoThird: number
  advanceThirteenthValue: number
  grossTotal: number
  inssDiscount: number
  irrfDiscount: number
  totalDiscounts: number
  netVacation: number
}

export interface ThirteenthSimulation {
  baseSalary: number
  monthsWorked: number
  extraAdditions: number
  grossTotal: number
  firstInstallment: number
  secondInstallmentGross: number
  inssDiscount: number
  irrfDiscount: number
  totalDiscounts: number
  secondInstallmentNet: number
  totalNet: number
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

  // Métodos de cálculo CLT completo
  simulateTermination: (params: {
    baseSalary: number
    monthsWorked: number
    type: TerminationType
    daysWorkedInMonth?: number
    hasExpiredVacation?: boolean
  }) => TerminationSimulation

  simulateVacation: (params: {
    baseSalary: number
    vacationDays: number
    sellTenDays: boolean
    advanceThirteenth: boolean
    dependents?: number
  }) => VacationSimulation

  simulateThirteenth: (params: {
    baseSalary: number
    monthsWorked: number
    extraAdditions?: number
    dependents?: number
  }) => ThirteenthSimulation

  calculateTaxes: (grossSalary: number, dependents?: number) => { inss: number; irrf: number }
  getAverageNetSalary: () => number
}

export const usePayrollStore = create<PayrollStore>()(
  persist(
    (set, get) => ({
      payrolls: [],
      creaFee: 650.0,
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

      // CÁLCULO COMPLETO DE RESCISÃO CLT
      simulateTermination: ({
        baseSalary,
        monthsWorked,
        type,
        daysWorkedInMonth = 30,
        hasExpiredVacation = false,
      }) => {
        const safeSalary = Math.max(0, baseSalary || 0)
        const safeMonths = Math.max(1, monthsWorked || 1)
        const safeDays = Math.max(0, Math.min(30, daysWorkedInMonth))

        // 1. Saldo de Salário
        const salaryBalance = (safeSalary / 30) * safeDays

        // 2. Aviso Prévio (Lei 12.506/2011: 30 dias + 3 dias por ano completo de serviço, máx 90 dias)
        const yearsCompleted = Math.floor(safeMonths / 12)
        const noticeDays = Math.min(90, 30 + yearsCompleted * 3)

        let noticePay = 0
        if (type === 'sem_justa_causa_indenizado') {
          noticePay = (safeSalary / 30) * noticeDays
        } else if (type === 'acordo_comum') {
          // No acordo comum, o aviso indenizado é pago pela metade (50%)
          noticePay = ((safeSalary / 30) * noticeDays) * 0.5
        } else {
          // sem_justa_causa_trabalhado, justa_causa e pedido_demissao = 0 indenizado
          noticePay = 0
        }

        // Projeção do aviso prévio indenizado para contagem de avos
        const noticeMonthsProjection =
          type === 'sem_justa_causa_indenizado' || type === 'acordo_comum'
            ? Math.round(noticeDays / 30)
            : 0

        // 3. Férias Vencidas (devidas em qualquer demissão se o trabalhador acumulou 1 período sem gozo)
        const expiredVacationValue = hasExpiredVacation ? safeSalary + safeSalary / 3 : 0

        // 4. Férias Proporcionais + 1/3
        let vacationDays = 0
        let vacationValue = 0
        let vacationThird = 0

        if (type !== 'justa_causa') {
          const rawCycleMonths = (safeMonths % 12 || (safeMonths >= 12 ? 12 : safeMonths)) + noticeMonthsProjection
          const vacationMonths = Math.min(12, rawCycleMonths)
          vacationDays = Math.round((vacationMonths / 12) * 30)
          vacationValue = (safeSalary / 12) * vacationMonths
          vacationThird = vacationValue / 3
        }

        // 5. 13º Salário Proporcional
        let thirteenthSalary = 0
        if (type !== 'justa_causa') {
          const yearMonths = (safeMonths % 12 || (safeMonths >= 12 ? 12 : safeMonths)) + noticeMonthsProjection
          const thirteenthMonths = Math.min(12, Math.max(1, yearMonths))
          thirteenthSalary = (safeSalary / 12) * thirteenthMonths
        }

        // 6. FGTS e Multa Rescisória
        const severanceFund = safeSalary * safeMonths * 0.08
        let severancePenalty = 0
        let fgtsWithdrawal = 0
        let fgtsWithdrawnAllowed = false

        if (type === 'sem_justa_causa_indenizado' || type === 'sem_justa_causa_trabalhado') {
          severancePenalty = severanceFund * 0.4 // 40% de multa
          fgtsWithdrawal = severanceFund + severancePenalty
          fgtsWithdrawnAllowed = true
        } else if (type === 'acordo_comum') {
          severancePenalty = severanceFund * 0.2 // 20% de multa
          fgtsWithdrawal = severanceFund * 0.8 + severancePenalty // saca até 80% do saldo + multa
          fgtsWithdrawnAllowed = true
        } else {
          // Justa causa e pedido de demissão não têm multa nem saque de FGTS
          severancePenalty = 0
          fgtsWithdrawal = 0
          fgtsWithdrawnAllowed = false
        }

        // 7. Descontos fiscais (INSS e IRRF sobre verbas remuneratórias: Saldo de Salário e 13º)
        // Aviso indenizado e férias indenizadas são verbas indenizatórias isentas de INSS
        const taxBase = salaryBalance + thirteenthSalary
        const { inss: inssDiscount, irrf: irrfDiscount } = get().calculateTaxes(taxBase)
        const totalDiscounts = inssDiscount + irrfDiscount

        // 8. Totais
        const totalGross =
          salaryBalance +
          noticePay +
          vacationValue +
          vacationThird +
          expiredVacationValue +
          thirteenthSalary

        // Valor a ser pago na rescisão (as multas de FGTS são pagas via Guia GRRF na conta do FGTS)
        const totalTermination = totalGross - totalDiscounts + (type !== 'justa_causa' && type !== 'pedido_demissao' ? severancePenalty : 0)

        const typeLabels: Record<TerminationType, string> = {
          sem_justa_causa_indenizado: 'Demissão Sem Justa Causa (Aviso Indenizado)',
          sem_justa_causa_trabalhado: 'Demissão Sem Justa Causa (Aviso Trabalhado)',
          justa_causa: 'Demissão com Justa Causa (Falta Grave - Art. 482 CLT)',
          pedido_demissao: 'Pedido de Demissão pelo Colaborador',
          acordo_comum: 'Demissão por Acordo Mútuo (Art. 484-A CLT)',
        }

        return {
          type,
          typeLabel: typeLabels[type] || 'Rescisão CLT',
          baseSalary: safeSalary,
          monthsWorked: safeMonths,
          daysWorkedInMonth: safeDays,
          noticeDays,
          noticePay,
          salaryBalance,
          vacationDays,
          vacationValue,
          vacationThird,
          expiredVacationValue,
          thirteenthSalary,
          severanceFund,
          severancePenalty,
          inssDiscount,
          irrfDiscount,
          totalGross,
          totalDiscounts,
          totalTermination,
          fgtsWithdrawal,
          fgtsWithdrawnAllowed,
        }
      },

      // CÁLCULO COMPLETO DE FÉRIAS CLT
      simulateVacation: ({
        baseSalary,
        vacationDays,
        sellTenDays,
        advanceThirteenth,
        dependents = 0,
      }) => {
        const safeSalary = Math.max(0, baseSalary || 0)
        const days = Math.min(30, Math.max(10, vacationDays || 30))

        // Se vendeu 10 dias, goza o restante (ex: 20 dias de gozo e 10 vendidos)
        const effectiveVacationDays = sellTenDays ? Math.max(10, days - 10) : days
        const salaryVacation = (safeSalary / 30) * effectiveVacationDays
        const constitutionalThird = salaryVacation / 3

        // Abono Pecuniário (venda de até 1/3 das férias = 10 dias)
        const abonoPecuniario = sellTenDays ? (safeSalary / 30) * 10 : 0
        const abonoThird = sellTenDays ? abonoPecuniario / 3 : 0

        // Adiantamento 50% do 13º Salário
        const advanceThirteenthValue = advanceThirteenth ? safeSalary * 0.5 : 0

        // Tributação: INSS e IRRF incidem SOMENTE sobre os dias de gozo e seu 1/3.
        // O abono pecuniário e seu 1/3 são ISENTOS de INSS e IRRF (Súmula 125 STJ / Art. 144 CLT).
        // O adiantamento do 13º não sofre desconto na primeira parcela.
        const taxableBase = salaryVacation + constitutionalThird
        const { inss: inssDiscount, irrf: irrfDiscount } = get().calculateTaxes(taxableBase, dependents)
        const totalDiscounts = inssDiscount + irrfDiscount

        const grossTotal =
          salaryVacation +
          constitutionalThird +
          abonoPecuniario +
          abonoThird +
          advanceThirteenthValue

        const netVacation = grossTotal - totalDiscounts

        return {
          baseSalary: safeSalary,
          vacationDays: effectiveVacationDays,
          sellTenDays,
          advanceThirteenth,
          salaryVacation,
          constitutionalThird,
          abonoPecuniario,
          abonoThird,
          advanceThirteenthValue,
          grossTotal,
          inssDiscount,
          irrfDiscount,
          totalDiscounts,
          netVacation,
        }
      },

      // CÁLCULO COMPLETO DE 13º SALÁRIO CLT
      simulateThirteenth: ({
        baseSalary,
        monthsWorked,
        extraAdditions = 0,
        dependents = 0,
      }) => {
        const safeSalary = Math.max(0, baseSalary || 0)
        const safeMonths = Math.min(12, Math.max(1, monthsWorked || 12))
        const safeExtras = Math.max(0, extraAdditions || 0)

        const totalSalaryBase = safeSalary + safeExtras
        const grossTotal = (totalSalaryBase / 12) * safeMonths

        // 1ª Parcela (Paga entre fev e nov): exatamente 50% do bruto sem NENHUM desconto!
        const firstInstallment = grossTotal * 0.5

        // 2ª Parcela (Paga até 20 de dezembro): restante com incidência integral na fonte de INSS e IRRF
        const secondInstallmentGross = grossTotal - firstInstallment

        // INSS calculado sobre o valor TOTAL bruto do 13º salário
        const { inss: inssDiscount, irrf: irrfDiscount } = get().calculateTaxes(grossTotal, dependents)
        const totalDiscounts = inssDiscount + irrfDiscount

        // O desconto integral do INSS e IRRF é deduzido da 2ª parcela
        const secondInstallmentNet = Math.max(0, secondInstallmentGross - totalDiscounts)
        const totalNet = firstInstallment + secondInstallmentNet

        return {
          baseSalary: safeSalary,
          monthsWorked: safeMonths,
          extraAdditions: safeExtras,
          grossTotal,
          firstInstallment,
          secondInstallmentGross,
          inssDiscount,
          irrfDiscount,
          totalDiscounts,
          secondInstallmentNet,
          totalNet,
        }
      },

      calculateTaxes: (grossSalary, dependents = 0) => {
        const safeGross = Math.max(0, grossSalary || 0)

        // Tabela Progressiva INSS 2024 / 2025
        let inss = 0
        const faixasINSS = [
          { limite: 1412.0, aliq: 0.075 },
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

        // Teto de contribuição INSS
        const tetoINSS = 908.85
        inss = Math.min(inss, tetoINSS)

        // Dedução por dependente legal (R$ 189,59 por dependente)
        const dependentDeduction = (dependents || 0) * 189.59

        // Base de cálculo IRRF = Bruto - INSS - Dependentes
        const baseIRRF = Math.max(0, safeGross - inss - dependentDeduction)
        let irrf = 0

        // Tabela Progressiva IRRF 2024 / 2025
        if (baseIRRF > 4664.68) {
          irrf = baseIRRF * 0.275 - 896.0
        } else if (baseIRRF > 3751.05) {
          irrf = baseIRRF * 0.225 - 662.77
        } else if (baseIRRF > 2826.65) {
          irrf = baseIRRF * 0.15 - 370.4
        } else if (baseIRRF > 2259.2) {
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
      version: 2, // Bumped to 2 for complete termination, vacation, and 13th simulators
    }
  )
)
