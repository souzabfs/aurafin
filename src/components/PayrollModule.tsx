import React, { useState } from 'react'
import {
  usePayrollStore,
  TerminationType,
  TerminationSimulation,
  VacationSimulation,
  ThirteenthSimulation
} from '@/store/payroll'
import { useSettingsStore } from '@/store/theme'
import { formatCurrency, formatMonth } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Briefcase,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Info,
  DollarSign,
  Palmtree,
  Gift,
  FileText,
  AlertOctagon,
  Scale,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react'

type CLTModuleTab = 'holerite' | 'rescisao' | 'ferias' | 'decimo-terceiro'

export const PayrollModule: React.FC = () => {
  const {
    payrolls,
    creaFee,
    registrationNumber,
    addPayroll,
    removePayroll,
    calculateTaxes,
    simulateTermination,
    simulateVacation,
    simulateThirteenth,
    getAverageNetSalary,
    setCREAFee,
    setRegistrationNumber,
  } = usePayrollStore()

  const { currency } = useSettingsStore()

  // Aba ativa do módulo CLT
  const [activeTab, setActiveTab] = useState<CLTModuleTab>('rescisao')

  // 1. Estado: Holerite Mensal
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    baseSalary: '',
    grossSalary: '',
    company: 'HNR Engenharia',
    role: 'Engenheiro Mecânico',
  })

  // 2. Estado: Simulador de Rescisão
  const [terminationForm, setTerminationForm] = useState<{
    baseSalary: string
    monthsWorked: string
    type: TerminationType
    daysWorkedInMonth: string
    hasExpiredVacation: boolean
  }>({
    baseSalary: '7500',
    monthsWorked: '24',
    type: 'sem_justa_causa_indenizado',
    daysWorkedInMonth: '30',
    hasExpiredVacation: false,
  })
  const [terminationResult, setTerminationResult] = useState<TerminationSimulation | null>(() => {
    return simulateTermination({
      baseSalary: 7500,
      monthsWorked: 24,
      type: 'sem_justa_causa_indenizado',
      daysWorkedInMonth: 30,
      hasExpiredVacation: false,
    })
  })

  // 3. Estado: Simulador de Férias
  const [vacationForm, setVacationForm] = useState({
    baseSalary: '7500',
    vacationDays: '30',
    sellTenDays: false,
    advanceThirteenth: false,
    dependents: '0',
  })
  const [vacationResult, setVacationResult] = useState<VacationSimulation | null>(() => {
    return simulateVacation({
      baseSalary: 7500,
      vacationDays: 30,
      sellTenDays: false,
      advanceThirteenth: false,
      dependents: 0,
    })
  })

  // 4. Estado: Simulador de 13º Salário
  const [thirteenthForm, setThirteenthForm] = useState({
    baseSalary: '7500',
    monthsWorked: '12',
    extraAdditions: '0',
    dependents: '0',
  })
  const [thirteenthResult, setThirteenthResult] = useState<ThirteenthSimulation | null>(() => {
    return simulateThirteenth({
      baseSalary: 7500,
      monthsWorked: 12,
      extraAdditions: 0,
      dependents: 0,
    })
  })

  // CREA Input State
  const [creaInput, setCreaInput] = useState(creaFee ? creaFee.toString() : '650')
  const [creaSuccess, setCreaSuccess] = useState(false)
  const [creaRegInput, setCreaRegInput] = useState(registrationNumber || '')

  // Live calculation para holerite
  const previewGross = parseFloat(formData.grossSalary.replace(',', '.')) || 0
  const { inss: previewInss, irrf: previewIrrf } = calculateTaxes(previewGross)
  const previewNet = Math.max(0, previewGross - previewInss - previewIrrf)

  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base = parseFloat(formData.baseSalary.replace(',', '.'))
    const gross = parseFloat(formData.grossSalary.replace(',', '.'))
    if (!base || isNaN(base) || !gross || isNaN(gross)) return

    const { inss, irrf } = calculateTaxes(gross)
    const netSalary = gross - inss - irrf

    addPayroll({
      month: formData.month,
      baseSalary: base,
      grossSalary: gross,
      inss,
      irrf,
      netSalary,
      discounts: inss + irrf,
      bonuses: 0,
      company: formData.company.trim() || 'Empresa',
      role: formData.role.trim() || 'Colaborador',
    })

    setFormData((prev) => ({
      ...prev,
      baseSalary: '',
      grossSalary: '',
    }))
  }

  const handleTerminationCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const base = parseFloat(terminationForm.baseSalary.replace(',', '.')) || 0
    const months = parseInt(terminationForm.monthsWorked, 10) || 1
    const days = parseInt(terminationForm.daysWorkedInMonth, 10) || 30

    const result = simulateTermination({
      baseSalary: base,
      monthsWorked: months,
      type: terminationForm.type,
      daysWorkedInMonth: days,
      hasExpiredVacation: terminationForm.hasExpiredVacation,
    })
    setTerminationResult(result)
  }

  const handleVacationCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const base = parseFloat(vacationForm.baseSalary.replace(',', '.')) || 0
    const days = parseInt(vacationForm.vacationDays, 10) || 30
    const deps = parseInt(vacationForm.dependents, 10) || 0

    const result = simulateVacation({
      baseSalary: base,
      vacationDays: days,
      sellTenDays: vacationForm.sellTenDays,
      advanceThirteenth: vacationForm.advanceThirteenth,
      dependents: deps,
    })
    setVacationResult(result)
  }

  const handleThirteenthCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const base = parseFloat(thirteenthForm.baseSalary.replace(',', '.')) || 0
    const months = parseInt(thirteenthForm.monthsWorked, 10) || 12
    const extras = parseFloat(thirteenthForm.extraAdditions.replace(',', '.')) || 0
    const deps = parseInt(thirteenthForm.dependents, 10) || 0

    const result = simulateThirteenth({
      baseSalary: base,
      monthsWorked: months,
      extraAdditions: extras,
      dependents: deps,
    })
    setThirteenthResult(result)
  }

  const handleSaveCREA = () => {
    const val = parseFloat(creaInput.replace(',', '.'))
    if (!isNaN(val)) {
      setCREAFee(val)
      setRegistrationNumber(creaRegInput)
      setCreaSuccess(true)
      setTimeout(() => setCreaSuccess(false), 3000)
    }
  }

  const averageSalary = getAverageNetSalary()

  return (
    <div className="space-y-6">
      {/* Sub-navegação das Ferramentas CLT */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('rescisao')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'rescisao'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale size={18} />
            <span>Simulador de Rescisão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ferias')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'ferias'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Palmtree size={18} />
            <span>Cálculo de Férias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decimo-terceiro')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'decimo-terceiro'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Gift size={18} />
            <span>13º Salário Completo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('holerite')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'holerite'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase size={18} />
            <span>Holerites & CREA</span>
          </button>
        </div>
      </div>

      {/* ABA 1: SIMULADOR DE RESCISÃO COMPLETO */}
      {activeTab === 'rescisao' && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
                <Scale size={14} />
                <span>Legislação Trabalhista Brasileira (CLT)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Simulador Completo de Rescisão de Contrato
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Calcule os direitos rescisórios conforme o tipo de desligamento: <strong>Normal (aviso indenizado)</strong>, <strong>aviso trabalhado</strong>, <strong>justa causa</strong>, pedido de demissão ou acordo mútuo (Art. 484-A).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário de Parâmetros */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Calculator size={18} className="text-indigo-600 dark:text-indigo-400" />
                Dados do Desligamento
              </h3>

              <form onSubmit={handleTerminationCalculate} className="space-y-4">
                {/* Tipo de Rescisão */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Modalidade da Rescisão
                  </label>
                  <select
                    value={terminationForm.type}
                    onChange={(e) =>
                      setTerminationForm({
                        ...terminationForm,
                        type: e.target.value as TerminationType,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="sem_justa_causa_indenizado">
                      1. Demissão Sem Justa Causa (Aviso Indenizado - Padrão)
                    </option>
                    <option value="sem_justa_causa_trabalhado">
                      2. Demissão Sem Justa Causa (Aviso Trabalhado)
                    </option>
                    <option value="justa_causa">
                      3. Demissão COM Justa Causa (Falta Grave - Art. 482)
                    </option>
                    <option value="pedido_demissao">
                      4. Pedido de Demissão pelo Colaborador
                    </option>
                    <option value="acordo_comum">
                      5. Demissão por Acordo Mútuo (Art. 484-A CLT)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Último Salário Base ({currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={terminationForm.baseSalary}
                      onChange={(e) =>
                        setTerminationForm({ ...terminationForm, baseSalary: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Meses Trabalhados na Empresa
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={terminationForm.monthsWorked}
                      onChange={(e) =>
                        setTerminationForm({ ...terminationForm, monthsWorked: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Dias Trabalhados no Mês de Saída (Saldo de Salário)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={terminationForm.daysWorkedInMonth}
                    onChange={(e) =>
                      setTerminationForm({
                        ...terminationForm,
                        daysWorkedInMonth: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                    Informe os dias trabalhados até o desligamento (padrão CLT: 30 dias se mês integral).
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terminationForm.hasExpiredVacation}
                      onChange={(e) =>
                        setTerminationForm({
                          ...terminationForm,
                          hasExpiredVacation: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 block">
                        Possui férias vencidas pendentes?
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400">
                        Período aquisitivo completo ainda não gozado (+ 1/3 constitucional).
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  Recalcular Rescisão
                </button>
              </form>
            </div>

            {/* Demonstrativo Rescisório Completo */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-5">
              {terminationResult ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Demonstrativo de Verbas Rescisórias
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {terminationResult.typeLabel}
                      </h3>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full self-start ${
                        terminationResult.type === 'justa_causa'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {terminationResult.type === 'justa_causa'
                        ? 'Sem Direito a Multa/FGTS'
                        : `${terminationResult.monthsWorked} meses de vínculo`}
                    </span>
                  </div>

                  {/* Verbas discriminadas */}
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    {/* Saldo de Salário */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-slate-400">
                        Saldo de Salário ({terminationResult.daysWorkedInMonth} dias trabalhados):
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(terminationResult.salaryBalance, currency)}
                      </span>
                    </div>

                    {/* Aviso Prévio */}
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-gray-600 dark:text-slate-400">Aviso Prévio:</span>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 ml-1">
                          {terminationResult.type === 'sem_justa_causa_indenizado'
                            ? `(${terminationResult.noticeDays} dias pela Lei 12.506/11)`
                            : terminationResult.type === 'sem_justa_causa_trabalhado'
                            ? '(Cumprido / Trabalhado em folha)'
                            : terminationResult.type === 'acordo_comum'
                            ? '(50% indenizado por acordo)'
                            : '(Sem indenização)'}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(terminationResult.noticePay, currency)}
                      </span>
                    </div>

                    {/* 13º Salário Proporcional */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-slate-400">
                        13º Salário Proporcional:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(terminationResult.thirteenthSalary, currency)}
                      </span>
                    </div>

                    {/* Férias Proporcionais */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-slate-400">
                        Férias Proporcionais ({terminationResult.vacationDays} dias):
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(terminationResult.vacationValue, currency)}
                      </span>
                    </div>

                    {/* 1/3 Constitucional de Férias Proporcionais */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-slate-400">
                        1/3 Constitucional de Férias Proporcionais:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(terminationResult.vacationThird, currency)}
                      </span>
                    </div>

                    {/* Férias Vencidas se houver */}
                    {terminationResult.expiredVacationValue > 0 && (
                      <div className="flex justify-between items-center py-1 text-indigo-600 dark:text-indigo-400">
                        <span>Férias Vencidas não Gozadas + 1/3:</span>
                        <span className="font-semibold">
                          +{formatCurrency(terminationResult.expiredVacationValue, currency)}
                        </span>
                      </div>
                    )}

                    {/* Multa Rescisória do FGTS */}
                    {terminationResult.severancePenalty > 0 && (
                      <div className="flex justify-between items-center py-1 text-emerald-600 dark:text-emerald-400">
                        <span>
                          Multa Rescisória do FGTS (
                          {terminationResult.type === 'acordo_comum' ? '20%' : '40%'}):
                        </span>
                        <span className="font-bold">
                          +{formatCurrency(terminationResult.severancePenalty, currency)}
                        </span>
                      </div>
                    )}

                    {/* Descontos INSS e IRRF */}
                    {terminationResult.totalDiscounts > 0 && (
                      <div className="flex justify-between items-center py-1 text-rose-600 dark:text-rose-400">
                        <span>Descontos Legais (INSS e IRRF sobre verbas remuneratórias):</span>
                        <span className="font-semibold">
                          -{formatCurrency(terminationResult.totalDiscounts, currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Totalizador da Rescisão */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400">
                          Total Líquido da Rescisão
                        </span>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Valor total a ser creditado em conta pelo empregador
                        </p>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(terminationResult.totalTermination, currency)}
                      </span>
                    </div>

                    {/* Bloco FGTS */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-indigo-950 dark:text-indigo-200">
                        <span>Saldo FGTS depositado durante o contrato (8%/mês):</span>
                        <span>{formatCurrency(terminationResult.severanceFund, currency)}</span>
                      </div>
                      {terminationResult.fgtsWithdrawnAllowed ? (
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-bold">
                          <span>Total Liberado para Saque na Caixa (FGTS + Multa):</span>
                          <span>{formatCurrency(terminationResult.fgtsWithdrawal, currency)}</span>
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Na modalidade selecionada ({terminationResult.typeLabel}), o saldo do FGTS fica retido na conta vinculada do trabalhador.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CALCULADORA DE FÉRIAS CLT */}
      {activeTab === 'ferias' && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-900/50 shadow-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/20">
                <Palmtree size={14} />
                <span>Artigos 129 a 153 da CLT</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Calculadora Completa de Férias CLT
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 leading-relaxed">
                Calcule a remuneração das férias com <strong>1/3 constitucional</strong>, opção de <strong>abono pecuniário (venda de 10 dias)</strong>, adiantamento da 1ª parcela do 13º salário e deduções de INSS/IRRF.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Férias */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Palmtree size={18} className="text-emerald-600 dark:text-emerald-400" />
                Parâmetros das Férias
              </h3>

              <form onSubmit={handleVacationCalculate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Salário Bruto Base ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={vacationForm.baseSalary}
                    onChange={(e) =>
                      setVacationForm({ ...vacationForm, baseSalary: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Dias de Férias Solicitados
                    </label>
                    <select
                      value={vacationForm.vacationDays}
                      onChange={(e) =>
                        setVacationForm({ ...vacationForm, vacationDays: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100"
                    >
                      <option value="30">30 dias corridos (Padrão)</option>
                      <option value="20">20 dias corridos</option>
                      <option value="15">15 dias corridos</option>
                      <option value="10">10 dias corridos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Dependentes (IRRF)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={vacationForm.dependents}
                      onChange={(e) =>
                        setVacationForm({ ...vacationForm, dependents: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Opções extras */}
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vacationForm.sellTenDays}
                      onChange={(e) =>
                        setVacationForm({ ...vacationForm, sellTenDays: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-slate-200 block">
                        Vender 10 dias (Abono Pecuniário)?
                      </span>
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">
                        Converte 1/3 das férias em dinheiro (isento de INSS e IRRF).
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={vacationForm.advanceThirteenth}
                      onChange={(e) =>
                        setVacationForm({
                          ...vacationForm,
                          advanceThirteenth: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-slate-200 block">
                        Adiantar 1ª parcela do 13º salário?
                      </span>
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">
                        Adiantamento de 50% do salário sem descontos no período de férias.
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  Calcular Férias
                </button>
              </form>
            </div>

            {/* Resultado Férias */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              {vacationResult && (
                <>
                  <div className="pb-3 border-b border-gray-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Recibo Estimado de Férias CLT
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      Período de Descanso: {vacationResult.vacationDays} dias
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-slate-400">
                        Remuneração dos {vacationResult.vacationDays} dias de férias:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(vacationResult.salaryVacation, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-slate-400">
                        1/3 Constitucional de Férias (Art. 7º, XVII da CF):
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(vacationResult.constitutionalThird, currency)}
                      </span>
                    </div>

                    {vacationResult.sellTenDays && (
                      <>
                        <div className="flex justify-between items-center py-1 text-emerald-600 dark:text-emerald-400">
                          <span>Abono Pecuniário (10 dias vendidos - Isento de impostos):</span>
                          <span className="font-semibold">
                            +{formatCurrency(vacationResult.abonoPecuniario, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 text-emerald-600 dark:text-emerald-400">
                          <span>1/3 Constitucional sobre o Abono Pecuniário:</span>
                          <span className="font-semibold">
                            +{formatCurrency(vacationResult.abonoThird, currency)}
                          </span>
                        </div>
                      </>
                    )}

                    {vacationResult.advanceThirteenth && (
                      <div className="flex justify-between items-center py-1 text-indigo-600 dark:text-indigo-400">
                        <span>Adiantamento da 1ª Parcela do 13º Salário (50% sem descontos):</span>
                        <span className="font-semibold">
                          +{formatCurrency(vacationResult.advanceThirteenthValue, currency)}
                        </span>
                      </div>
                    )}

                    {/* Descontos */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1 text-rose-600 dark:text-rose-400">
                      <div className="flex justify-between items-center">
                        <span>INSS sobre férias e 1/3:</span>
                        <span>-{formatCurrency(vacationResult.inssDiscount, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>IRRF retido na fonte:</span>
                        <span>-{formatCurrency(vacationResult.irrfDiscount, currency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-emerald-900 dark:text-emerald-300">
                          Total Líquido a Receber das Férias
                        </span>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Pagamento obrigatório até 2 dias antes do início do gozo (Art. 145 CLT)
                        </p>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(vacationResult.netVacation, currency)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: CALCULADORA DE 13º SALÁRIO */}
      {activeTab === 'decimo-terceiro' && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-purple-900/50 shadow-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-400/20">
                <Gift size={14} />
                <span>Lei 4.090/1962 e Lei 4.749/1965</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Calculadora Completa de 13º Salário
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 mt-1 leading-relaxed">
                Discriminativo oficial da <strong>1ª Parcela (Adiantamento sem descontos)</strong> e da <strong>2ª Parcela (Fechamento com INSS e IRRF)</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form 13º */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Gift size={18} className="text-purple-600 dark:text-purple-400" />
                Dados do 13º Salário
              </h3>

              <form onSubmit={handleThirteenthCalculate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Salário Bruto Base ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={thirteenthForm.baseSalary}
                    onChange={(e) =>
                      setThirteenthForm({ ...thirteenthForm, baseSalary: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Meses Trabalhados no Ano (Avos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={thirteenthForm.monthsWorked}
                      onChange={(e) =>
                        setThirteenthForm({ ...thirteenthForm, monthsWorked: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Dependentes (IRRF)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={thirteenthForm.dependents}
                      onChange={(e) =>
                        setThirteenthForm({ ...thirteenthForm, dependents: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Média de Horas Extras e Adicionais ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={thirteenthForm.extraAdditions}
                    onChange={(e) =>
                      setThirteenthForm({ ...thirteenthForm, extraAdditions: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                    Média de periculosidade, insalubridade, comissões ou horas extras apuradas no ano.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  Calcular 13º Salário
                </button>
              </form>
            </div>

            {/* Resultado 13º Salário */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              {thirteenthResult && (
                <>
                  <div className="pb-3 border-b border-gray-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Demonstrativo de Parcelas do 13º Salário
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      Proporção: {thirteenthResult.monthsWorked}/12 avos
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card 1ª Parcela */}
                    <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase text-purple-900 dark:text-purple-300">
                          1ª Parcela (Adiantamento)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100">
                          Fev a Nov
                        </span>
                      </div>
                      <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                        {formatCurrency(thirteenthResult.firstInstallment, currency)}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-slate-400">
                        Exatamente 50% do valor bruto. Sem deduções de INSS ou Imposto de Renda.
                      </p>
                    </div>

                    {/* Card 2ª Parcela */}
                    <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase text-indigo-900 dark:text-indigo-300">
                          2ª Parcela (Líquida)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100">
                          Até 20/Dez
                        </span>
                      </div>
                      <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                        {formatCurrency(thirteenthResult.secondInstallmentNet, currency)}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-slate-400">
                        Restante após desconto integral de INSS (-{formatCurrency(thirteenthResult.inssDiscount, currency)}) e IRRF (-{formatCurrency(thirteenthResult.irrfDiscount, currency)}).
                      </p>
                    </div>
                  </div>

                  {/* Resumo Consolidado */}
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-slate-400">
                      <span>Valor Bruto Total ({thirteenthResult.monthsWorked}/12 avos):</span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(thirteenthResult.grossTotal, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Total de Deduções Legais (INSS e IRRF):</span>
                      <span className="font-semibold">
                        -{formatCurrency(thirteenthResult.totalDiscounts, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800">
                      <span className="font-bold text-gray-900 dark:text-slate-100">
                        Total Líquido Anual do 13º Salário:
                      </span>
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                        {formatCurrency(thirteenthResult.totalNet, currency)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: HOLERITES MENSAIS & ANUIDADE CREA */}
      {activeTab === 'holerite' && (
        <div className="space-y-6 animate-slide-up">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-blue-100 dark:border-blue-950/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  Média Salarial Líquida
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(averageSalary, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {payrolls.length > 0
                  ? `Baseado em ${payrolls.length} holerite(s)`
                  : 'Nenhum holerite registrado'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-purple-100 dark:border-purple-950/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  Anuidade CREA Anual
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(creaFee, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {registrationNumber
                  ? `Registro: ${registrationNumber}`
                  : 'Conselho de Classe Profissional'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  Provisão Mensal CREA
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {formatCurrency(creaFee / 12, currency)}
                <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                  /mês
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Custo diluído no ano</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário: Registrar Holerite */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Briefcase size={18} />
                </div>
                Registrar Holerite Mensal
              </h3>

              <form onSubmit={handlePayrollSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Mês / Ano
                    </label>
                    <input
                      type="month"
                      required
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Salário Base ({currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 8500.00"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Salário Bruto Total (com adicionais) ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 8500.00"
                    value={formData.grossSalary}
                    onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Prévia automática */}
                {previewGross > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-600 dark:text-slate-400">
                      <span>INSS Progressivo:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(previewInss, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-slate-400">
                      <span>IRRF Progressivo:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(previewIrrf, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 font-bold text-sm">
                      <span>Salário Líquido Estimado:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(previewNet, currency)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Salvar Holerite</span>
                </button>
              </form>
            </div>

            {/* Anuidade CREA */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                Anuidade Profissional CREA
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Valor da Anuidade Anual ({currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={creaInput}
                      onChange={(e) => setCreaInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Nº Registro / Carteira CREA
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 506999999-SP"
                      value={creaRegInput}
                      onChange={(e) => setCreaRegInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {creaSuccess ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={14} /> Dados do CREA salvos!
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Incluído nas projeções de custos profissionais anuais.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveCREA}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Salvar CREA
                  </button>
                </div>
              </div>

              {/* Histórico dos holerites cadastrados */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm mb-3">
                  Holerites Cadastrados ({payrolls.length})
                </h4>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                  {payrolls.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400 text-center py-4">
                      Nenhum holerite cadastrado ainda.
                    </p>
                  ) : (
                    payrolls.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-gray-900 dark:text-slate-100">
                            {formatMonth(p.month)}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            {p.company} • Líquido: {formatCurrency(p.netSalary, currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePayroll(p.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
