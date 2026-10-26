import React, { useState } from 'react'
import { useFinanceStore, TransactionType, CategoryType } from '@/store/finance'
import { useSettingsStore } from '@/store/theme'
import { formatCurrency, getCategoryLabel, getCategoryColor, getMonthRange, formatDate } from '@/lib/utils'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
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
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'

export const CashFlowModule: React.FC = () => {
  const { transactions, addTransaction, removeTransaction, clearTransactions, getTotalIncome, getTotalExpense, getBalance } = useFinanceStore()
  const { currency, theme } = useSettingsStore()

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Filtro de data
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Modal de confirmação para zerar
  const [showClearModal, setShowClearModal] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Form State
  const [formData, setFormData] = useState<{
    type: TransactionType
    amount: string
    category: CategoryType
    description: string
    date: string
  }>({
    type: 'expense',
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  // Range de data baseado no mês selecionado
  const selectedDateObj = new Date(`${selectedMonth}-15T12:00:00`)
  const { start, end } = getMonthRange(selectedDateObj)

  const monthTransactions = transactions.filter(
    (t) => t.date >= start && t.date <= end
  )

  const income = getTotalIncome(start, end)
  const expense = getTotalExpense(start, end)
  const monthBalance = income - expense
  const totalAccumulatedBalance = getBalance()

  const handleTypeChange = (newType: TransactionType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'income' ? 'salary' : 'food',
    }))
  }

  const categoryTotals = (type: 'income' | 'expense') => {
    const grouped: Record<string, number> = {}
    monthTransactions
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(formData.amount.replace(',', '.'))
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) return
    if (!formData.description.trim()) return

    addTransaction({
      type: formData.type,
      amount: numericAmount,
      category: formData.category,
      description: formData.description.trim(),
      date: formData.date,
      status: 'completed',
    })

    setFormData((prev) => ({
      ...prev,
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    }))
  }

  const handleClearAll = () => {
    clearTransactions()
    setShowClearModal(false)
  }

  // Filtragem de lista
  const filteredTransactions = monthTransactions
    .filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const descMatch = t.description.toLowerCase().includes(term)
        const catMatch = getCategoryLabel(t.category).toLowerCase().includes(term)
        if (!descMatch && !catMatch) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const expenseCategories = categoryTotals('expense')
  const incomeCategories = categoryTotals('income')

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Mês e Botão de Zerar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Calendar size={20} />
          </div>
          <div>
            <label htmlFor="month-select" className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
              Mês de Referência
            </label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-semibold text-gray-900 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer text-base"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition border border-rose-200 dark:border-rose-900/50"
            title="Zerar todas as entradas e saídas cadastradas"
          >
            <RotateCcw size={16} />
            <span>Zerar Entradas e Saídas</span>
          </button>
        </div>
      </div>

      {/* Resumo de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Entradas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-emerald-950/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Entradas (Mês)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(income, currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>{monthTransactions.filter(t => t.type === 'income').length} lançamento(s)</span>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-100 dark:border-rose-950/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Saídas (Mês)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(expense, currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <TrendingDown size={14} className="text-rose-500" />
            <span>{monthTransactions.filter(t => t.type === 'expense').length} lançamento(s)</span>
          </div>
        </div>

        {/* Balanço do Mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Saldo do Mês</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              monthBalance >= 0
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                : 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
            }`}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${
            monthBalance >= 0
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}>
            {formatCurrency(monthBalance, currency)}
          </p>
          <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
            {monthBalance >= 0 ? 'Superávit no período' : 'Déficit no período'}
          </div>
        </div>

        {/* Saldo Acumulado Total */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Saldo Geral Total</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Wallet size={18} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${
            totalAccumulatedBalance >= 0
              ? 'text-gray-900 dark:text-slate-100'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(totalAccumulatedBalance, currency)}
          </p>
          <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
            {transactions.length === 0 ? 'Registros zerados' : `${transactions.length} transação(ões) no total`}
          </div>
        </div>
      </div>

      {/* Gráficos / Distribuição por Categoria */}
      {monthTransactions.length > 0 && (expenseCategories.length > 0 || incomeCategories.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expenseCategories.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Despesas por Categoria
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-exp-${index}`} fill={entry.fill} stroke={isDarkMode ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]
                          const val = Number(item.value) || 0
                          const pct = expense > 0 ? ((val / expense) * 100).toFixed(1) : '0'
                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-800 px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-slate-300">{formatCurrency(val, currency)} ({pct}%)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                {expenseCategories.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}: {formatCurrency(item.value, currency)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {incomeCategories.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Entradas por Categoria
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell key={`cell-inc-${index}`} fill={entry.fill} stroke={isDarkMode ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]
                          const val = Number(item.value) || 0
                          const pct = income > 0 ? ((val / income) * 100).toFixed(1) : '0'
                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-800 px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-slate-300">{formatCurrency(val, currency)} ({pct}%)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                {incomeCategories.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}: {formatCurrency(item.value, currency)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulário de Novo Lançamento */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Plus size={16} />
          </div>
          Novo Lançamento
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alternador de Tipo */}
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg max-w-md">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
                formData.type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft size={16} />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
                formData.type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpRight size={16} />
              Saída
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {formData.type === 'income' ? (
                  <>
                    <option value="salary">Salário</option>
                    <option value="freelance">Freelance / Serviços</option>
                    <option value="investment">Rendimentos / Investimentos</option>
                    <option value="other">Outras Entradas</option>
                  </>
                ) : (
                  <>
                    <option value="food">Alimentação</option>
                    <option value="transport">Transporte / Combustível</option>
                    <option value="utilities">Contas Fixas / Moradia</option>
                    <option value="health">Saúde</option>
                    <option value="education">Educação</option>
                    <option value="entertainment">Lazer e Entretenimento</option>
                    <option value="other">Outras Despesas</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Compra supermercado, Salário mensal, Combustível..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition shadow-sm ${
                formData.type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Plus size={18} />
              <span>Registrar {formData.type === 'income' ? 'Entrada' : 'Saída'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
              Lançamentos do Período ({filteredTransactions.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Visualizando registros de {selectedMonth}
            </p>
          </div>

          {/* Filtros */}
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

            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Entradas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterType === 'expense'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Saídas
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Filter size={20} />
              </div>
              <p className="text-gray-900 dark:text-slate-100 font-medium">Nenhum lançamento registrado</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Todas as entradas e saídas estão zeradas para este período. Utilize o formulário acima para adicionar novas operações.
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income'
              return (
                <div
                  key={transaction.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition group"
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
                      <p className="font-medium text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.category) }}
                        />
                        <span>{getCategoryLabel(transaction.category)}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-semibold text-base sm:text-lg ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeTransaction(transaction.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
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
              Esta ação removerá todos os {transactions.length} lançamentos registrados no sistema e restaurará o saldo para R$ 0,00. Essa operação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition shadow-sm"
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
