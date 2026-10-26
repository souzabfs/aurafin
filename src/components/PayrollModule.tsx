import React, { useState } from 'react'
import { usePayrollStore, PayrollSimulation } from '@/store/payroll'
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
  DollarSign
} from 'lucide-react'

export const PayrollModule: React.FC = () => {
  const {
    payrolls,
    creaFee,
    registrationNumber,
    addPayroll,
    removePayroll,
    calculateTaxes,
    simulateTermination,
    getAverageNetSalary,
    setCREAFee,
    setRegistrationNumber,
  } = usePayrollStore()

  const { currency } = useSettingsStore()

  // Form State
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    baseSalary: '',
    grossSalary: '',
    company: 'HNR Engenharia',
    role: 'Engenheiro Mecânico',
  })

  // Simulation State
  const [simulationData, setSimulationData] = useState({
    baseSalary: '',
    monthsWorked: '12',
    withNotice: true,
  })
  const [simResult, setSimResult] = useState<PayrollSimulation | null>(null)

  // CREA Input State
  const [creaInput, setCreaInput] = useState(creaFee ? creaFee.toString() : '650')
  const [creaSuccess, setCreaSuccess] = useState(false)
  const [creaRegInput, setCreaRegInput] = useState(registrationNumber || '')

  // Live calculation for preview
  const previewGross = parseFloat(formData.grossSalary.replace(',', '.')) || 0
  const { inss: previewInss, irrf: previewIrrf } = calculateTaxes(previewGross)
  const previewNet = Math.max(0, previewGross - previewInss - previewIrrf)

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleSimulation = (e: React.FormEvent) => {
    e.preventDefault()
    const base = parseFloat(simulationData.baseSalary.replace(',', '.'))
    const months = parseInt(simulationData.monthsWorked, 10)
    if (!base || isNaN(base) || !months || isNaN(months)) return

    const result = simulateTermination(base, months, simulationData.withNotice)
    setSimResult(result)
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
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Média Salarial Líquida */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-blue-100 dark:border-blue-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Média Salarial Líquida</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(averageSalary, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {payrolls.length > 0 ? `Baseado em ${payrolls.length} holerite(s)` : 'Nenhum holerite registrado'}
          </p>
        </div>

        {/* Anuidade CREA */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-purple-100 dark:border-purple-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Anuidade CREA Anual</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(creaFee, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {registrationNumber ? `Registro: ${registrationNumber}` : 'Registro profissional CLT/CREA'}
          </p>
        </div>

        {/* Impacto Mensal CREA */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Provisão Mensal CREA</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {formatCurrency(creaFee / 12, currency)}
            <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">/mês</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Custo diluído no ano
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário: Registrar Holerite */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            Registrar Holerite
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Prévia automática dos descontos CLT */}
            {previewGross > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>INSS (calculado progressivo):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(previewInss, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>IRRF (tabela progressiva):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(previewIrrf, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 font-bold text-sm">
                  <span>Estimativa Líquida:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(previewNet, currency)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
            >
              <Plus size={18} />
              <span>Salvar Holerite</span>
            </button>
          </form>
        </div>

        {/* Gestão CREA e Simulação */}
        <div className="space-y-6">
          {/* Anuidade CREA Config */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              Anuidade e Registro Profissional (CREA)
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Valor Anuidade Anual ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="650.00"
                    value={creaInput}
                    onChange={(e) => setCreaInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Nº Registro / Carteira
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 506999999-SP"
                    value={creaRegInput}
                    onChange={(e) => setCreaRegInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {creaSuccess ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 size={14} /> Dados do CREA atualizados!
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    A anuidade é considerada nas métricas de custos fixos anuais.
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveCREA}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Atualizar CREA
                </button>
              </div>
            </div>
          </div>

          {/* Simulador de Rescisão */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Calculator size={16} />
              </div>
              Simulador de Rescisão CLT
            </h3>

            <form onSubmit={handleSimulation} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Salário Base Atual ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 7500.00"
                    value={simulationData.baseSalary}
                    onChange={(e) => setSimulationData({ ...simulationData, baseSalary: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    placeholder="Ex: 24"
                    value={simulationData.monthsWorked}
                    onChange={(e) => setSimulationData({ ...simulationData, monthsWorked: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="noticeCheck"
                  checked={simulationData.withNotice}
                  onChange={(e) => setSimulationData({ ...simulationData, withNotice: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700"
                />
                <label htmlFor="noticeCheck" className="text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
                  Aviso Prévio Indenizado pela empresa
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium py-2 rounded-lg text-sm transition"
              >
                Calcular Rescisão Detalhada
              </button>
            </form>

            {/* Resultado da Simulação (Substitui window.alert) */}
            {simResult && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 animate-slide-up">
                <div className="flex items-center justify-between mb-3 border-b border-amber-200/80 dark:border-amber-900/60 pb-2">
                  <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm flex items-center gap-1.5">
                    <Info size={16} /> Demonstrativo Estimado de Rescisão
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                    Sem justa causa
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Férias proporcionais ({simResult.vacationDays} dias):</span>
                    <span className="font-medium">{formatCurrency(simResult.vacationValue, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1/3 Constitucional de Férias:</span>
                    <span className="font-medium">{formatCurrency(simResult.vacationThird, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>13º Salário proporcional:</span>
                    <span className="font-medium">{formatCurrency(simResult.thirteenthSalary, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldo FGTS acumulado (8%/mês):</span>
                    <span className="font-medium">{formatCurrency(simResult.severanceFund, currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>Multa rescisória FGTS (40%):</span>
                    <span>+{formatCurrency(simResult.severancePenalty, currency)}</span>
                  </div>
                  {simResult.noticePay > 0 && (
                    <div className="flex justify-between text-indigo-700 dark:text-indigo-400 font-medium">
                      <span>Aviso Prévio Indenizado:</span>
                      <span>+{formatCurrency(simResult.noticePay, currency)}</span>
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-amber-200 dark:border-amber-900/80 flex justify-between text-sm font-bold text-gray-900 dark:text-slate-100">
                    <span>Total Estimado Líquido:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base">
                      {formatCurrency(simResult.totalTermination, currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Holerites Registrados */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">
            Histórico de Holerites Registrados ({payrolls.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {payrolls.length === 0 ? (
            <p className="p-8 text-center text-gray-500 dark:text-slate-400 text-sm">
              Nenhum holerite cadastrado ainda. Preencha o formulário acima para registrar seus comprovantes mensais.
            </p>
          ) : (
            payrolls
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((p) => (
                <div key={p.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 text-base">
                        {formatMonth(p.month)}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {p.company} • {p.role}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePayroll(p.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                      title="Excluir holerite"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-slate-400">Salário Bruto</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                        {formatCurrency(p.grossSalary, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-slate-400">INSS Retido</p>
                      <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                        -{formatCurrency(p.inss, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-slate-400">IRRF Retido</p>
                      <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                        -{formatCurrency(p.irrf, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-slate-400">Salário Líquido</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(p.netSalary, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
