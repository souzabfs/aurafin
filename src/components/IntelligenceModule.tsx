import React, { useMemo } from 'react'
import { useFinanceStore } from '@/store/finance'
import { usePayrollStore } from '@/store/payroll'
import { useAccountingStore } from '@/store/accounting'
import { useSettingsStore } from '@/store/theme'
import { formatCurrency, getMonthRange } from '@/lib/utils'
import {
  TrendingUp,
  AlertCircle,
  Target,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'

export const IntelligenceModule: React.FC = () => {
  const financeStore = useFinanceStore()
  const payrollStore = usePayrollStore()
  const accountingStore = useAccountingStore()
  const { currency } = useSettingsStore()

  const today = new Date()
  const { start, end } = getMonthRange(today)

  const monthlyIncome = financeStore.getTotalIncome(start, end)
  const monthlyExpense = financeStore.getTotalExpense(start, end)
  const balance = financeStore.getBalance()
  const averageNetSalary = payrollStore.getAverageNetSalary()
  const creaFee = payrollStore.creaFee

  // Análise Inteligente de Saúde Financeira
  const insights = useMemo(() => {
    const results: Array<{
      type: 'warning' | 'info' | 'success'
      title: string
      description: string
      action?: string
    }> = []

    // Caso não haja transações registradas (estado zerado)
    if (financeStore.transactions.length === 0) {
      results.push({
        type: 'info',
        title: 'Sistema Zerado e Pronto',
        description: 'Todas as entradas e saídas foram zeradas. Conforme você for registrando os lançamentos, a inteligência financeira gerará análises personalizadas.',
        action: 'Adicione suas primeiras receitas e despesas no módulo de Caixa',
      })
      return results
    }

    // Análise de fluxo projetado vs efetivado
    const flow = financeStore.getFlowComparison(start, end)
    if (flow.pendingExpense > 0) {
      results.push({
        type: 'info',
        title: 'Despesas Projetadas a Quitar',
        description: `Existem ${formatCurrency(flow.pendingExpense, currency)} em despesas pendentes para este mês (${flow.expenseExecutionRate.toFixed(0)}% já efetivado). Saldo projetado após liquidação: ${formatCurrency(flow.projectedNet, currency)}.`,
        action: 'Acompanhe as datas de vencimento no módulo de Caixa para confirmar a efetivação',
      })
    }

    // Análise de fluxo de caixa efetivado
    if (monthlyIncome > 0 && monthlyExpense > monthlyIncome) {
      results.push({
        type: 'warning',
        title: 'Déficit Efetivado no Mês Atual',
        description: `Suas despesas efetivadas (${formatCurrency(monthlyExpense, currency)}) superam suas receitas recebidas (${formatCurrency(monthlyIncome, currency)}) em ${formatCurrency(monthlyExpense - monthlyIncome, currency)}.`,
        action: 'Avalie cortar despesas variáveis para reequilibrar o fluxo de caixa',
      })
    } else if (flow.projectedExpense > flow.projectedIncome && flow.projectedIncome > 0) {
      results.push({
        type: 'warning',
        title: 'Alerta de Projeção Negativa',
        description: `O fluxo total projetado para este mês aponta déficit de ${formatCurrency(flow.projectedExpense - flow.projectedIncome, currency)} se todas as despesas previstas forem confirmadas.`,
        action: 'Provisione recursos extras ou adie despesas não urgentes',
      })
    }

    // Alertas de reserva de emergência
    if (balance < 0) {
      results.push({
        type: 'warning',
        title: 'Saldo Negativo',
        description: `Seu saldo acumulado está negativo em ${formatCurrency(balance, currency)}.`,
        action: 'Priorize a liquidação de pendências com juros mais altos',
      })
    } else if (averageNetSalary > 0 && balance < averageNetSalary * 3) {
      const emergencyTarget = averageNetSalary * 6
      results.push({
        type: 'info',
        title: 'Construção da Reserva de Emergência',
        description: `Sua reserva atual (${formatCurrency(balance, currency)}) cobre menos de 3 meses de custo de vida base. O recomendado para CLT/Engenharia são de 3 a 6 meses (${formatCurrency(emergencyTarget, currency)}).`,
        action: 'Direcione 15% a 20% da sua renda mensal para liquidez diária (CDB 100% CDI ou Tesouro Selic)',
      })
    }

    // Sugestões de alocação de renda
    if (monthlyIncome > 0) {
      const expenseRatio = monthlyExpense / monthlyIncome
      if (expenseRatio <= 0.6) {
        results.push({
          type: 'success',
          title: 'Orçamento com Margem Confortável',
          description: `Apenas ${(expenseRatio * 100).toFixed(1)}% da sua receita está comprometida este mês. Excelente capacidade de poupança!`,
          action: 'Aproveite o excedente para aportes em investimentos de longo prazo',
        })
      } else if (expenseRatio > 0.85) {
        results.push({
          type: 'warning',
          title: 'Alerta de Alto Comprometimento',
          description: `Você está consumindo ${(expenseRatio * 100).toFixed(1)}% de todas as suas entradas. Há pouca margem para imprevistos.`,
          action: 'Revise assinaturas e gastos de entretenimento',
        })
      }
    }

    // CREA Anual
    if (creaFee > 0) {
      results.push({
        type: 'info',
        title: 'Provisão de Custos Profissionais (CREA)',
        description: `Anuidade do conselho de classe cadastrada em ${formatCurrency(creaFee, currency)}/ano. Provisão sugerida: ${formatCurrency(creaFee / 12, currency)}/mês.`,
        action: 'Mantenha o valor provisionado na virada do ano para aproveitar descontos de cota única',
      })
    }

    return results
  }, [monthlyIncome, monthlyExpense, balance, averageNetSalary, creaFee, currency, financeStore.transactions.length])

  // Regra 50-30-20
  const recommendedAllocations = useMemo(() => {
    if (monthlyIncome <= 0) {
      return [
        {
          category: 'Necessidades Básicas',
          percentage: 50,
          current: 0,
          description: 'Moradia, alimentação, contas fixas, saúde e transporte essencial',
        },
        {
          category: 'Estilo de Vida / Lazer',
          percentage: 30,
          current: 0,
          description: 'Restaurantes, compras, viagens e entretenimento',
        },
        {
          category: 'Poupança & Futuro',
          percentage: 20,
          current: 0,
          description: 'Reserva de emergência, previdência e investimentos',
        },
      ]
    }

    const currentExpensePct = Math.min(100, Math.max(0, (monthlyExpense / monthlyIncome) * 100))
    const currentSavingsPct = Math.min(100, Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))

    return [
      {
        category: 'Necessidades Básicas (Meta: 50%)',
        percentage: 50,
        current: currentExpensePct,
        description: 'Moradia, alimentação, contas essenciais e transporte',
      },
      {
        category: 'Estilo de Vida & Lazer (Meta: 30%)',
        percentage: 30,
        current: Math.min(30, currentExpensePct * 0.4),
        description: 'Entretenimento, compras pessoais e hobbies',
      },
      {
        category: 'Poupança & Investimentos (Meta: 20%)',
        percentage: 20,
        current: currentSavingsPct,
        description: 'Reserva de emergência, aportes e metas patrimoniais',
      },
    ]
  }, [monthlyIncome, monthlyExpense])

  const savingsRate = monthlyIncome > 0
    ? Math.max(0, (((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))
    : 0

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Inteligência */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taxa de Poupança */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Taxa de Poupança
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {savingsRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {monthlyIncome > 0 ? 'Da receita convertida em reserva' : 'Sem receitas no período'}
          </p>
        </div>

        {/* Saldo Patrimonial Líquido */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-emerald-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Saldo Líquido Geral
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(balance, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Posição consolidada
          </p>
        </div>

        {/* Comprometimento de Renda */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-amber-100 dark:border-amber-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Comprometimento
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PieChart size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {monthlyIncome > 0 ? ((monthlyExpense / monthlyIncome) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Meta ideal: abaixo de 70%
          </p>
        </div>

        {/* Média Líquida CLT */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-purple-100 dark:border-purple-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Salário Médio Base
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(averageNetSalary, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Média dos holerites CLT
          </p>
        </div>
      </div>

      {/* Modelo de Alocação de Renda (50 / 30 / 20) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
              Diretriz de Alocação Orçamentária (Regra 50 / 30 / 20)
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Referência financeira para equilíbrio patrimonial e independência
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {recommendedAllocations.map((alloc, idx) => {
            const safeCurrent = Math.max(0, Math.min(alloc.current, 100))
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800 dark:text-slate-200">
                    {alloc.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 dark:text-slate-400">
                      Atual: <strong className="text-gray-900 dark:text-slate-100">{safeCurrent.toFixed(1)}%</strong>
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      (Meta {alloc.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="relative h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${alloc.percentage}%` }}
                  />
                  {safeCurrent > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-1.5 bg-emerald-500 shadow-sm"
                      style={{ left: `calc(${safeCurrent}% - 3px)` }}
                    />
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {alloc.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de Insights & Diagnósticos */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
          Diagnósticos & Recomendações
        </h3>

        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border flex items-start gap-3 transition ${
              insight.type === 'warning'
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                : insight.type === 'success'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {insight.type === 'warning' && (
                <AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />
              )}
              {insight.type === 'success' && (
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              )}
              {insight.type === 'info' && (
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
              )}
            </div>

            <div className="flex-1">
              <h4
                className={`font-semibold text-sm ${
                  insight.type === 'warning'
                    ? 'text-rose-900 dark:text-rose-300'
                    : insight.type === 'success'
                    ? 'text-emerald-900 dark:text-emerald-300'
                    : 'text-indigo-900 dark:text-indigo-300'
                }`}
              >
                {insight.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 mt-1 leading-relaxed">
                {insight.description}
              </p>
              {insight.action && (
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mt-2 flex items-center gap-1">
                  <span>💡 Recomendação:</span>
                  <span>{insight.action}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
