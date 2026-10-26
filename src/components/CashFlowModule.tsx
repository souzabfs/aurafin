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
  parseCurrencyInput,
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
  CheckCheck,
  Wallet,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Layers,
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

  // Filtro de período: 'YYYY-MM' ou 'all' (Todos os Períodos)
  const currentMonthStr = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const isAllTime = selectedMonth === 'all'

  // Modais e filtros de visualização
  const [showClearModal, setShowClearModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'recurring'>('all')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showComparisonPanel, setShowComparisonPanel] = useState(true)
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
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Range de datas baseado no filtro
  let start = ''
  let end = ''
  if (!isAllTime) {
    const selectedDateObj = new Date(`${selectedMonth}-15T12:00:00`)
    const range = getMonthRange(selectedDateObj)
    start = range.start
    end = range.end
  }

  // Transações do escopo ativo (Mês selecionado ou Todas)
  const scopedTransactions = isAllTime
    ? transactions
    : transactions.filter((t) => t.date >= start && t.date <= end)

  // CÁLCULO GERAL: Contabiliza TUDO o que foi salvo no sistema conforme solicitado
  const totalIncome = getTotalIncome(start, end, false) // Todas as receitas registradas
  const totalExpense = getTotalExpense(start, end, false) // Todas as despesas registradas
  const totalBalance = totalIncome - totalExpense

  // Sub-métricas de Efetivação
  const completedIncome = getTotalIncome(start, end, true)
  const completedExpense = getTotalExpense(start, end, true)
  const completedBalance = completedIncome - completedExpense

  const pendingIncome = Math.max(0, totalIncome - completedIncome)
  const pendingExpense = Math.max(0, totalExpense - completedExpense)

  // Saldo geral total acumulado em todo o histórico
  const totalAccumulatedBalance = getBalance(false)
  const completedAccumulatedBalance = getBalance(true)

  // Comparação consolidada
  const flow = getFlowComparison(start, end)

  const handleTypeChange = (newType: TransactionType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'income' ? 'salary' : 'food',
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Parsing robusto do valor (suporta "100", "150,50", "1.500,00", etc.)
    const numericAmount = parseCurrencyInput(formData.amount)
    if (!numericAmount || numericAmount <= 0) {
      showToast('Por favor, informe um valor válido maior que zero.')
      return
    }

    // 2. Descrição garantida (se vazia, utiliza a categoria como descrição padrão)
    const finalDescription = formData.description.trim() || getCategoryLabel(formData.category)
    const finalDate = formData.date || new Date().toISOString().split('T')[0]

    if (formData.isRecurring) {
      addRecurringTransaction(
        {
          type: formData.type,
          amount: numericAmount,
          category: formData.category,
          description: finalDescription,
          date: finalDate,
          status: formData.status,
        },
        {
          frequency: formData.recurrenceFrequency,
          occurrences: formData.recurrenceOccurrences,
          firstIsCompleted: formData.firstIsCompleted,
        }
      )
      showToast(`Série de ${formData.recurrenceOccurrences} lançamentos recorrentes salva e calculada com sucesso!`)
    } else {
      addTransaction({
        type: formData.type,
        amount: numericAmount,
        category: formData.category,
        description: finalDescription,
        date: finalDate,
        status: formData.status,
      })

      showToast(
        `${formData.type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(
          numericAmount,
          currency
        )} registrada e calculada!`
      )
    }

    // Se o lançamento pertencer a outro mês e o filtro estiver num mês fixo, ajusta para exibir
    const txMonth = finalDate.slice(0, 7)
    if (!isAllTime && selectedMonth !== txMonth) {
      setSelectedMonth(txMonth)
    }

    // Limpa formulário para o próximo lançamento
    setFormData((prev) => ({
      ...prev,
      amount: '',
      description: '',
      isRecurring: false,
    }))
  }

  const handleConfirmAllPending = () => {
    const pendingItems = scopedTransactions.filter((t) => t.status === 'pending')
    if (pendingItems.length === 0) return

    pendingItems.forEach((t) => setTransactionStatus(t.id, 'completed'))
    showToast(`${pendingItems.length} lançamento(s) pendente(s) foram efetivados e calculados!`)
  }

  const handleClearAll = () => {
    clearTransactions()
    setShowClearModal(false)
    showToast('Todas as entradas e saídas foram zeradas com sucesso!')
  }

  // Filtragem da lista
  const filteredTransactions = scopedTransactions
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

  // Gráficos por Categoria
  const categoryTotals = (type: 'income' | 'expense') => {
    const grouped: Record<string, number> = {}
    scopedTransactions
      .filter((t) => t.type === type)
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
      Registrado: totalIncome,
      Efetivado: completedIncome,
      Pendente: pendingIncome,
    },
    {
      name: 'Despesas',
      Registrado: totalExpense,
      Efetivado: completedExpense,
      Pendente: pendingExpense,
    },
    {
      name: 'Saldo Líquido',
      Registrado: totalBalance,
      Efetivado: completedBalance,
      Pendente: 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-semibold animate-slide-up border border-emerald-500">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar: Seletor de Período e Botões */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
              Período de Visualização
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {!isAllTime ? (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="font-bold text-gray-900 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer text-base"
                />
              ) : (
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
                  Todos os Períodos (Histórico Completo)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alternador de Escopo & Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonthStr)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedMonth === currentMonthStr
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                isAllTime
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Ver Tudo ({transactions.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition border border-rose-200 dark:border-rose-900/50 cursor-pointer"
            title="Zerar todos os lançamentos"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Zerar Dados</span>
          </button>
        </div>
      </div>

      {/* PAINEL PRINCIPAL: CARDS DE TOTAIS CALCULADOS (CALCULA TUDO O QUE FOR SALVO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entradas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Total Entradas {isAllTime ? '(Geral)' : '(Período)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalIncome, currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span>Efetivado: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(completedIncome, currency)}</strong></span>
            {pendingIncome > 0 && (
              <span>A receber: <strong className="text-amber-500">{formatCurrency(pendingIncome, currency)}</strong></span>
            )}
          </div>
        </div>

        {/* Total Saídas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-100 dark:border-rose-950/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Total Saídas {isAllTime ? '(Geral)' : '(Período)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpense, currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span>Efetivado: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(completedExpense, currency)}</strong></span>
            {pendingExpense > 0 && (
              <span>A pagar: <strong className="text-amber-500">{formatCurrency(pendingExpense, currency)}</strong></span>
            )}
          </div>
        </div>

        {/* Saldo do Período */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Saldo Líquido {isAllTime ? '(Geral)' : '(Período)'}
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                totalBalance >= 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                  : 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Scale size={18} />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black ${
              totalBalance >= 0
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(totalBalance, currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span>Real Efetivado: <strong>{formatCurrency(completedBalance, currency)}</strong></span>
            <span>{totalBalance >= 0 ? 'Superávit' : 'Déficit'}</span>
          </div>
        </div>

        {/* Saldo Geral Acumulado */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Saldo Consolidado Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Wallet size={18} />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black ${
              totalAccumulatedBalance >= 0
                ? 'text-gray-900 dark:text-slate-100'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(totalAccumulatedBalance, currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span>Efetivado em Caixa: <strong>{formatCurrency(completedAccumulatedBalance, currency)}</strong></span>
            <span>{transactions.length} registros</span>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE NOVO LANÇAMENTO (SEMPRE SALVA E CONTABILIZA) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus size={18} />
            </div>
            <span>Novo Lançamento</span>
          </h3>

          <span className="text-xs text-gray-500 dark:text-slate-400">
            Todos os lançamentos salvos são automaticamente calculados no sistema.
          </span>
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Valor ({currency}) *
              </label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-base"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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

            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Status: Efetivado vs Pendente */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`w-full px-3 py-2.5 rounded-xl font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formData.status === 'completed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                <option value="completed">✓ Efetivado (Pago / Recebido)</option>
                <option value="pending">⏳ Pendente (A confirmar)</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Descrição (Opcional - se vazio, utiliza o nome da categoria)
            </label>
            <input
              type="text"
              placeholder={`Ex: ${getCategoryLabel(formData.category)}`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recorrência */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
              />
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Repeat size={16} className="text-indigo-600 dark:text-indigo-400" />
                Repetir este lançamento (Recorrência automática)
              </span>
            </label>

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
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                    Quantidade de Parcelas
                  </label>
                  <select
                    value={formData.recurrenceOccurrences}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceOccurrences: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100"
                  >
                    <option value="3">3 repetições (Trimestral)</option>
                    <option value="6">6 repetições (Semestral)</option>
                    <option value="12">12 repetições (1 Ano)</option>
                    <option value="24">24 repetições (2 Anos)</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={formData.firstIsCompleted}
                      onChange={(e) =>
                        setFormData({ ...formData, firstIsCompleted: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>1ª parcela já efetivada</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition shadow-md cursor-pointer ${
                formData.type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              <Plus size={18} />
              <span>
                {formData.isRecurring
                  ? `Salvar Série (${formData.recurrenceOccurrences} Lançamentos)`
                  : `Salvar e Registrar ${formData.type === 'income' ? 'Receita' : 'Despesa'}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* PAINEL COMPARATIVO: FLUXO PROJETADO X EFETIVADO */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20 mb-1">
              <Scale size={13} />
              <span>Comparativo Oficial de Caixa</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Fluxo Projetado vs. Fluxo Efetivado {isAllTime ? '(Geral)' : `(${selectedMonth})`}
            </h3>
            <p className="text-xs text-slate-300">
              Total registrado no período: <strong>{scopedTransactions.length} lançamentos</strong>
            </p>
          </div>

          {pendingExpense > 0 || pendingIncome > 0 ? (
            <button
              type="button"
              onClick={handleConfirmAllPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition shrink-0 cursor-pointer"
            >
              <CheckCheck size={16} />
              <span>Efetivar Pendências ({scopedTransactions.filter(t => t.status === 'pending').length})</span>
            </button>
          ) : null}
        </div>

        {/* 3 Colunas: Receitas, Despesas, Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider">Receitas</span>
              <span className="text-[11px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full">
                {flow.incomeExecutionRate.toFixed(0)}% efetivado
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Registrado:</span>
                <span className="font-bold text-white">{formatCurrency(totalIncome, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                <span>Efetivado (Recebido):</span>
                <span>{formatCurrency(completedIncome, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-400">
                <span>Pendente a Receber:</span>
                <span>{formatCurrency(pendingIncome, currency)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-rose-400 uppercase tracking-wider">Despesas</span>
              <span className="text-[11px] text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full">
                {flow.expenseExecutionRate.toFixed(0)}% efetivado
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Registrado:</span>
                <span className="font-bold text-white">{formatCurrency(totalExpense, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-400 font-semibold">
                <span>Efetivado (Pago):</span>
                <span>{formatCurrency(completedExpense, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-400">
                <span>Pendente a Pagar:</span>
                <span>{formatCurrency(pendingExpense, currency)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-400 uppercase tracking-wider">Resultado Líquido</span>
              <span className="text-[11px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full">
                {totalBalance >= 0 ? 'Positivo' : 'Negativo'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Saldo Total Registrado:</span>
                <span className="font-bold text-white">{formatCurrency(totalBalance, currency)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-indigo-400">
                <span>Saldo Real em Caixa:</span>
                <span>{formatCurrency(completedBalance, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Caixa Geral Consolidado:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totalAccumulatedBalance, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Comparativo */}
        {scopedTransactions.length > 0 && (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                <Bar dataKey="Registrado" name="Total Registrado" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Efetivado" name="Efetivado (Real)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* LISTA COMPLETA DE LANÇAMENTOS COM STATUS INTERATIVO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header da Lista com Filtros */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">
                Lançamentos Registrados ({filteredTransactions.length})
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Clique no botão de status para alternar entre <strong>Efetivado</strong> e <strong>Pendente</strong> a qualquer momento.
            </p>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
              />
            </div>

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
                Efetivados ({scopedTransactions.filter((t) => t.status === 'completed').length})
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
                Pendentes ({scopedTransactions.filter((t) => t.status === 'pending').length})
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

        {/* Itens */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Filter size={20} />
              </div>
              <p className="text-gray-900 dark:text-slate-100 font-bold text-sm">
                Nenhum lançamento encontrado neste filtro
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {transactions.length === 0
                  ? 'Nenhuma receita ou despesa registrada ainda. Use o formulário acima para adicionar novos lançamentos.'
                  : `Existem ${transactions.length} lançamentos no histórico total. Clique em "Ver Tudo" no topo para visualizar todos.`}
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
                      : 'bg-amber-50/20 dark:bg-amber-950/20 hover:bg-amber-50/50 dark:hover:bg-amber-950/40 border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                          {transaction.description}
                        </p>

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
                    {/* Botão Interativo de Confirmação */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTransactionStatus(transaction.id)
                        showToast(
                          !isCompleted
                            ? `"${transaction.description}" foi marcado como EFETIVADO!`
                            : `"${transaction.description}" foi marcado como PENDENTE!`
                        )
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
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
                      className={`font-black text-base sm:text-lg min-w-24 text-right ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
                    </span>

                    {/* Excluir */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecurring && transaction.recurrenceId) {
                          const removeAll = window.confirm(
                            'Este lançamento faz parte de uma série recorrente.\n\nDeseja excluir TODA a série de lançamentos recorrentes?\n\n- OK: Exclui toda a série\n- Cancelar: Exclui apenas esta parcela'
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition shadow-sm cursor-pointer"
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
