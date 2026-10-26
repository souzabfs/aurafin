import React, { useState } from 'react'
import {
  useFinanceStore,
  TransactionType,
  CategoryType,
  RecurrenceType,
  Transaction
} from '@/store/finance'
import { useSettingsStore } from '@/store/theme'
import {
  formatCurrency,
  getCategoryLabel,
  getCategoryColor,
  getMonthRange,
  formatDate
} from '@/lib/utils'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'
import {
  Plus,
  Trash2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Repeat,
  Layers,
  CheckCheck,
  TrendingUp,
  Wallet,
  Scale,
  Sparkles,
  ChevronDown,
  CalendarDays
} from 'lucide-react'

export const CashFlowModule: React.FC = () => {
  const {
    transactions,
    addTransaction,
    addRecurringTransaction,
    removeTransaction,
    removeRecurrenceSeries,
    toggleTransactionStatus,
    setTransactionStatus,
    clearTransactions,
    getTotalIncome,
    getTotalExpense,
    getBalance,
    getFlowComparison,
  } = useFinanceStore()

  const { currency, theme } = useSettingsStore()

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Filtro de mês de referência
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Modais e filtros de visualização
  const [showClearModal, setShowClearModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'recurring'>('all')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewTab, setViewTab] = useState<'summary' | 'comparison' | 'charts'>('comparison')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<{
    type: TransactionType
    amount: string
    category: CategoryType
    description: string
    date: string
    status: 'pending' | 'completed'
    isRecurring: boolean
    recurrenceFrequency: RecurrenceType
    recurrenceOccurrences: number
    firstIsCompleted: boolean
  }>({
    type: 'expense',
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    isRecurring: false,
    recurrenceFrequency: 'monthly',
    recurrenceOccurrences: 6,
    firstIsCompleted: true,
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Range de datas do mês selecionado
  const selectedDateObj = new Date(`${selectedMonth}-15T12:00:00`)
  const { start, end } = getMonthRange(selectedDateObj)

  const monthTransactions = transactions.filter(
    (t) => t.date >= start && t.date <= end
  )

  // Métricas do Mês: Efetivado (apenas concluídas) vs Projetado (total)
  const completedIncome = getTotalIncome(start, end, true)
  const completedExpense = getTotalExpense(start, end, true) // Apenas despesas efetivadas!
  const completedBalance = completedIncome - completedExpense

  const projectedIncome = getTotalIncome(start, end, false)
  const projectedExpense = getTotalExpense(start, end, false)
  const projectedBalance = projectedIncome - projectedExpense

  // Métricas comparativas consolidadas
  const flow = getFlowComparison(start, end)
  const totalAccumulatedBalance = getBalance(true) // Saldo real consolidado (apenas efetivado)

  const handleTypeChange = (newType: TransactionType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'income' ? 'salary' : 'food',
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(formData.amount.replace(',', '.'))
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) return
    if (!formData.description.trim()) return

    if (formData.isRecurring) {
      addRecurringTransaction(
        {
          type: formData.type,
          amount: numericAmount,
          category: formData.category,
          description: formData.description.trim(),
          date: formData.date,
          status: formData.status,
        },
        {
          frequency: formData.recurrenceFrequency,
          occurrences: formData.recurrenceOccurrences,
          firstIsCompleted: formData.firstIsCompleted,
        }
      )
      showToast(`${formData.recurrenceOccurrences} lançamentos recorrentes criados com sucesso!`)
    } else {
      addTransaction({
        type: formData.type,
        amount: numericAmount,
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        status: formData.status,
      })
      showToast(
        formData.status === 'completed'
          ? 'Lançamento efetivado com sucesso!'
          : 'Lançamento registrado como projetado (pendente)!'
      )
    }

    setFormData((prev) => ({
      ...prev,
      amount: '',
      description: '',
      isRecurring: false,
      date: new Date().toISOString().split('T')[0],
    }))
  }

  const handleConfirmAllPending = () => {
    const pendingMonth = monthTransactions.filter((t) => t.status === 'pending')
    if (pendingMonth.length === 0) return

    pendingMonth.forEach((t) => setTransactionStatus(t.id, 'completed'))
    showToast(`${pendingMonth.length} lançamento(s) pendente(s) foram efetivados!`)
  }

  const handleClearAll = () => {
    clearTransactions()
    setShowClearModal(false)
    showToast('Todas as entradas e saídas foram zeradas!')
  }

  // Filtragem da lista
  const filteredTransactions = monthTransactions
    .filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterStatus === 'completed' && t.status !== 'completed') return false
      if (filterStatus === 'pending' && t.status !== 'pending') return false
      if (filterStatus === 'recurring' && !t.recurrenceId) return false

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const descMatch = t.description.toLowerCase().includes(term)
        const catMatch = getCategoryLabel(t.category).toLowerCase().includes(term)
        if (!descMatch && !catMatch) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Gráficos por Categoria (apenas despesas e receitas efetivadas)
  const categoryTotals = (type: 'income' | 'expense') => {
    const grouped: Record<string, number> = {}
    monthTransactions
      .filter((t) => t.type === type && t.status === 'completed')
      .forEach((t) => {
        grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount)
      })

    return Object.entries(grouped).map(([category, total]) => ({
      name: getCategoryLabel(category),
      value: total,
      fill: getCategoryColor(category),
    }))
  }

  const expenseCategories = categoryTotals('expense')
  const incomeCategories = categoryTotals('income')

  // Dados para o Gráfico Comparativo: Projetado x Efetivado
  const comparisonChartData = [
    {
      name: 'Receitas',
      Efetivado: completedIncome,
      Projetado: projectedIncome,
      Pendente: flow.pendingIncome,
    },
    {
      name: 'Despesas',
      Efetivado: completedExpense,
      Projetado: projectedExpense,
      Pendente: flow.pendingExpense,
    },
    {
      name: 'Saldo Líquido',
      Efetivado: completedBalance,
      Projetado: projectedBalance,
      Pendente: 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-up">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar: Mês, Modo de visualização e Botão de Zerar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Calendar size={20} />
          </div>
          <div>
            <label
              htmlFor="month-select"
              className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block"
            >
              Mês de Referência
            </label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-bold text-gray-900 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer text-base"
            />
          </div>
        </div>

        {/* Abas de visão rápida */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewTab('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewTab === 'comparison'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Scale size={14} />
              <span>Projetado x Efetivado</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewTab === 'summary'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>Resumo Real</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition border border-rose-200 dark:border-rose-900/50"
            title="Zerar todos os lançamentos"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Zerar Registros</span>
          </button>
        </div>
      </div>

      {/* PAINEL COMPARATIVO: FLUXO PROJETADO X FLUXO EFETIVADO */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-400/20 mb-1">
                <Scale size={13} />
                <span>Análise de Conciliação e Projeção</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Comparativo: Fluxo Projetado vs. Fluxo Efetivado
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Apenas lançamentos confirmados como <strong className="text-emerald-400">efetivados</strong> alteram o saldo real em caixa.
              </p>
            </div>

            {flow.pendingExpense > 0 || flow.pendingIncome > 0 ? (
              <button
                type="button"
                onClick={handleConfirmAllPending}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition shrink-0 cursor-pointer"
                title="Marcar todos os lançamentos pendentes deste mês como efetivados"
              >
                <CheckCheck size={16} />
                <span>Efetivar Pendências do Mês</span>
              </button>
            ) : null}
          </div>

          {/* Comparativo em 3 Colunas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Coluna 1: Receitas */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ArrowDownLeft size={16} />
                  Receitas
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                  {flow.incomeExecutionRate.toFixed(0)}% realizado
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Efetivado (Recebido):</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {formatCurrency(completedIncome, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-400">
                  <span>Projetado Total:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(projectedIncome, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs pt-1 border-t border-slate-800 text-amber-300">
                  <span>Pendente a Receber:</span>
                  <span className="font-semibold">{formatCurrency(flow.pendingIncome, currency)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, flow.incomeExecutionRate)}%` }}
                />
              </div>
            </div>

            {/* Coluna 2: Despesas */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <ArrowUpRight size={16} />
                  Despesas
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/40">
                  {flow.expenseExecutionRate.toFixed(0)}% pago
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Efetivado (Pago):</span>
                  <span className="text-xl font-bold text-rose-400">
                    {formatCurrency(completedExpense, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-400">
                  <span>Projetado Total:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(projectedExpense, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs pt-1 border-t border-slate-800 text-amber-300">
                  <span>Pendente a Pagar:</span>
                  <span className="font-semibold">{formatCurrency(flow.pendingExpense, currency)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, flow.expenseExecutionRate)}%` }}
                />
              </div>
            </div>

            {/* Coluna 3: Saldo do Mês & Caixa Real */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Wallet size={16} />
                  Resultado do Período
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    completedBalance >= 0 ? 'bg-indigo-950 text-indigo-300' : 'bg-amber-950 text-amber-300'
                  }`}
                >
                  {completedBalance >= 0 ? 'Superávit Real' : 'Déficit Real'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Saldo Efetivado:</span>
                  <span
                    className={`text-xl font-bold ${
                      completedBalance >= 0 ? 'text-indigo-400' : 'text-amber-400'
                    }`}
                  >
                    {formatCurrency(completedBalance, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-400">
                  <span>Saldo Final Projetado:</span>
                  <span
                    className={`font-semibold ${
                      projectedBalance >= 0 ? 'text-slate-200' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(projectedBalance, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs pt-1 border-t border-slate-800 text-slate-400">
                  <span>Caixa Geral Acumulado:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(totalAccumulatedBalance, currency)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-0.5">
                {flow.pendingNet !== 0 ? (
                  <span>
                    Diferença a realizar: <strong>{formatCurrency(flow.pendingNet, currency)}</strong>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Todas as movimentações deste mês foram efetivadas!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de Barras Comparativo */}
          {monthTransactions.length > 0 && (
            <div className="pt-2">
              <div className="h-48 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `R$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0, currency)]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar
                      dataKey="Efetivado"
                      name="Efetivado (Real)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Projetado"
                      name="Projetado (Previsto)"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Lançamento (com Recorrência e Confirmação de Efetivação) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus size={18} />
            </div>
            <span>Novo Lançamento</span>
          </h3>

          {formData.isRecurring && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800/60">
              <Repeat size={14} />
              Recorrência Ativa ({formData.recurrenceOccurrences}x {formData.recurrenceFrequency})
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alternador de Tipo: Entrada vs Saída */}
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                formData.type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft size={16} />
              Receita / Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                formData.type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpRight size={16} />
              Despesa / Saída
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Valor ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {formData.type === 'income' ? (
                  <>
                    <option value="salary">Salário / Remuneração</option>
                    <option value="freelance">Freelancer / Projetos</option>
                    <option value="investment">Rendimentos / Investimentos</option>
                    <option value="other">Outras Entradas</option>
                  </>
                ) : (
                  <>
                    <option value="food">Alimentação</option>
                    <option value="transport">Transporte / Combustível</option>
                    <option value="utilities">Contas Fixas / Moradia</option>
                    <option value="health">Saúde / Medicamentos</option>
                    <option value="education">Educação / Cursos</option>
                    <option value="entertainment">Lazer e Entretenimento</option>
                    <option value="other">Outras Despesas</option>
                  </>
                )}
              </select>
            </div>

            {/* Data de Competência / Vencimento */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Inicial: Efetivado vs Pendente */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Status do Lançamento
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`w-full px-3 py-2.5 rounded-xl font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formData.status === 'completed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                <option value="completed">✓ Efetivado (Já realizado / Pago)</option>
                <option value="pending">⏳ Pendente (Projetado / A confirmar)</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Salário HNR, Academia, Cartão de Crédito..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Seção de Recorrência */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Repeat size={16} className="text-indigo-600 dark:text-indigo-400" />
                  Repetir lançamento automaticamente (Recorrência)
                </span>
              </label>

              {formData.isRecurring && (
                <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
                  Gera projeções futuras com base na frequência selecionada
                </span>
              )}
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-slate-700 animate-slide-up">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                    Frequência
                  </label>
                  <select
                    value={formData.recurrenceFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceFrequency: e.target.value as RecurrenceType,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100"
                  >
                    <option value="monthly">Mensal (a cada 30 dias)</option>
                    <option value="weekly">Semanal (a cada 7 dias)</option>
                    <option value="yearly">Anual (a cada 1 ano)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                    Quantidade de Repetições
                  </label>
                  <select
                    value={formData.recurrenceOccurrences}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceOccurrences: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100"
                  >
                    <option value="3">3 ocorrências (Trimestral)</option>
                    <option value="6">6 ocorrências (Semestral)</option>
                    <option value="12">12 ocorrências (1 Ano)</option>
                    <option value="24">24 ocorrências (2 Anos)</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.firstIsCompleted}
                      onChange={(e) =>
                        setFormData({ ...formData, firstIsCompleted: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>1º lançamento já efetivado</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition shadow-sm cursor-pointer ${
                formData.type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Plus size={18} />
              <span>
                {formData.isRecurring
                  ? `Criar Série Recorrente (${formData.recurrenceOccurrences}x)`
                  : `Salvar ${formData.type === 'income' ? 'Receita' : 'Despesa'}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Transações e Controle de Confirmação */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header da Tabela com Filtros de Efetivação */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">
                Lançamentos do Mês
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                {filteredTransactions.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Clique no status para alternar entre <strong>Efetivado</strong> e <strong>Pendente</strong>.
            </p>
          </div>

          {/* Filtros de Status (Efetivado / Pendente / Recorrente) e Busca */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar lançamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filtro por Status de Efetivação */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('completed')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'completed'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Efetivados ({monthTransactions.filter((t) => t.status === 'completed').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'pending'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Pendentes ({monthTransactions.filter((t) => t.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('recurring')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  filterStatus === 'recurring'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Recorrentes
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Filter size={20} />
              </div>
              <p className="text-gray-900 dark:text-slate-100 font-semibold">
                Nenhum lançamento encontrado
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Não há lançamentos para os filtros selecionados no mês de {selectedMonth}. Utilize o formulário acima para registrar despesas e receitas.
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income'
              const isCompleted = transaction.status === 'completed'
              const isRecurring = Boolean(transaction.recurrenceId)

              return (
                <div
                  key={transaction.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isCompleted
                      ? 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                      : 'bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Ícone de Tipo */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                          {transaction.description}
                        </p>

                        {/* Tag de Recorrência */}
                        {isRecurring && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                            title={`Série recorrente (${transaction.installmentCurrent}/${transaction.installmentTotal})`}
                          >
                            <Repeat size={11} />
                            <span>
                              {transaction.installmentCurrent && transaction.installmentTotal
                                ? `${transaction.installmentCurrent}/${transaction.installmentTotal}`
                                : 'Recorrente'}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.category) }}
                        />
                        <span>{getCategoryLabel(transaction.category)}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                        {isCompleted && transaction.effectiveDate && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                            (Efetivado em {formatDate(transaction.effectiveDate)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-13 sm:pl-0">
                    {/* Botão Interativo de Status: Efetivado / Pendente */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTransactionStatus(transaction.id)
                        showToast(
                          !isCompleted
                            ? `"${transaction.description}" foi marcado como EFETIVADO!`
                            : `"${transaction.description}" foi marcado como PENDENTE (Projetado)!`
                        )
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                      }`}
                      title={isCompleted ? 'Clique para marcar como pendente' : 'Clique para efetivar este lançamento'}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Efetivado</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                          <span>Confirmar Efetivação</span>
                        </>
                      )}
                    </button>

                    {/* Valor Formatado */}
                    <span
                      className={`font-bold text-base sm:text-lg min-w-24 text-right ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      } ${!isCompleted ? 'opacity-70' : ''}`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
                    </span>

                    {/* Botão de Excluir */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecurring && transaction.recurrenceId) {
                          const removeAll = window.confirm(
                            'Este lançamento faz parte de uma série recorrente.\n\nDeseja excluir TODA a série de lançamentos recorrentes?\n\n- Clique em OK para excluir TODA a série.\n- Clique em Cancelar para excluir apenas este mês.'
                          )
                          if (removeAll) {
                            removeRecurrenceSeries(transaction.recurrenceId)
                            showToast('Toda a série recorrente foi excluída!')
                            return
                          }
                        }
                        removeTransaction(transaction.id)
                        showToast('Lançamento removido!')
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Zerar */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-slate-100 mb-2">
              Zerar todas as entradas e saídas?
            </h3>

            <p className="text-sm text-center text-gray-600 dark:text-slate-400 mb-6">
              Esta ação removerá todos os {transactions.length} lançamentos registrados no sistema (incluindo séries recorrentes) e restaurará o saldo para R$ 0,00.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition shadow-sm"
              >
                Confirmar e Zerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
