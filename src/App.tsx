import React, { useState, Suspense } from 'react'
import { CashFlowModule } from './components/CashFlowModule'
import { PayrollModule } from './components/PayrollModule'
import { IntelligenceModule } from './components/IntelligenceModule'
import { PWAInstaller } from './components/PWAInstaller'
import { useSettingsStore, ThemeMode } from './store/theme'
import { useFinanceStore } from './store/finance'
import { usePayrollStore } from './store/payroll'
import { formatCurrency } from './lib/utils'
import {
  Wallet,
  Briefcase,
  Brain,
  Settings,
  Home,
  Moon,
  Sun,
  Monitor,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Sparkles
} from 'lucide-react'

type TabType = 'home' | 'cash-flow' | 'payroll' | 'intelligence' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const { theme, toggleTheme } = useSettingsStore()
  const { transactions, getBalance } = useFinanceStore()
  const { payrolls } = usePayrollStore()

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const modules = [
    {
      id: 'cash-flow' as TabType,
      label: 'Caixa & Fluxo',
      icon: Wallet,
      badge: transactions.length > 0 ? transactions.length.toString() : '0',
    },
    {
      id: 'payroll' as TabType,
      label: 'Holerite CLT',
      icon: Briefcase,
      badge: payrolls.length > 0 ? payrolls.length.toString() : undefined,
    },
    {
      id: 'intelligence' as TabType,
      label: 'Inteligência',
      icon: Brain,
    },
    {
      id: 'settings' as TabType,
      label: 'Ajustes',
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Nome */}
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg tracking-wider">AF</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    AuraFin
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 hidden sm:block">
                  Finanças Pessoais & CLT
                </p>
              </div>
            </button>

            {/* Quick Actions no Header */}
            <div className="flex items-center gap-2">
              {/* Saldo Rápido (Discreto) */}
              <div
                onClick={() => setActiveTab('cash-flow')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition"
                title="Ver Caixa"
              >
                <span className="text-gray-500 dark:text-slate-400">Saldo:</span>
                <span className={`font-semibold ${getBalance() >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(getBalance())}
                </span>
              </div>

              {/* Botão de Alternar Modo Noturno */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo noturno'}
                className="p-2.5 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition"
                title={isDarkMode ? 'Ativar Modo Claro' : 'Ativar Modo Noturno'}
              >
                {isDarkMode ? (
                  <Sun size={20} className="text-amber-400 animate-spin-once" />
                ) : (
                  <Moon size={20} className="text-indigo-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-100 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex overflow-x-auto gap-1 py-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Home size={18} />
                <span>Início</span>
              </button>

              {modules.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    activeTab === id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'home' && <HomePage onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'cash-flow' && <CashFlowModule />}
          {activeTab === 'payroll' && <PayrollModule />}
          {activeTab === 'intelligence' && <IntelligenceModule />}
          {activeTab === 'settings' && <SettingsPage />}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 text-center text-xs text-gray-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>AuraFin • Controle Financeiro & Trabalhista com Modo Noturno</p>
          <p className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            100% Local-First & Seguro
          </p>
        </div>
      </footer>

      <PWAInstaller />
    </div>
  )
}

function HomePage({ onNavigate }: { onNavigate: (tab: TabType) => void }) {
  const { transactions, getBalance } = useFinanceStore()
  const { payrolls } = usePayrollStore()
  const { currency } = useSettingsStore()

  const balance = getBalance()

  return (
    <div className="space-y-6">
      {/* Banner Principal de Boas-Vindas com Modo Noturno integrado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/30">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles size={14} className="text-indigo-300" />
            <span>Sistema Atualizado • Modo Noturno Ativo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestão Financeira & Holerite CLT
          </h2>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Painel inteligente de controle de entradas, saídas, previsão de rescisão e impostos com privacidade garantida.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('cash-flow')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-indigo-50 transition shadow-sm"
            >
              <Wallet size={16} />
              <span>Acessar Fluxo de Caixa</span>
            </button>
            <button
              onClick={() => onNavigate('payroll')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-sm border border-indigo-500/40 transition"
            >
              <Briefcase size={16} />
              <span>Módulo Holerite</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 right-20 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Aviso informativo de estado zerado */}
      {transactions.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Entradas e saídas zeradas
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                O histórico anterior de transações foi limpo. Você pode iniciar seus novos lançamentos a partir do zero.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('cash-flow')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shrink-0"
          >
            <span>Novo Lançamento</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Resumo Rápido dos Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Caixa */}
        <div
          onClick={() => onNavigate('cash-flow')}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1 flex items-center justify-between">
            <span>Gestão de Caixa</span>
            <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Registre entradas e despesas com categorização, gráficos circulares e saldo em tempo real.
          </p>
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Saldo Atual:</span>
            <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(balance, currency)}</span>
          </div>
        </div>

        {/* Card Holerite */}
        <div
          onClick={() => onNavigate('payroll')}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Briefcase size={24} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1 flex items-center justify-between">
            <span>Holerite CLT & CREA</span>
            <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Cálculo progressivo de INSS e IRRF, histórico de contracheques, anuidade CREA e simulador de rescisão.
          </p>
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Holerites Registrados:</span>
            <span className="font-bold text-gray-900 dark:text-slate-100">{payrolls.length}</span>
          </div>
        </div>

        {/* Card Inteligência */}
        <div
          onClick={() => onNavigate('intelligence')}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain size={24} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1 flex items-center justify-between">
            <span>Inteligência & Diagnósticos</span>
            <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Recomendações financeiras automáticas, regra 50/30/20 e análise de taxa de poupança.
          </p>
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">Diagnóstico:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Ativo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsPage() {
  const { theme, setTheme, currency, setCurrency, notifications, setNotifications } = useSettingsStore()
  const { clearTransactions, resetFinanceData, transactions } = useFinanceStore()
  const { clearPayrolls, payrolls } = usePayrollStore()

  const [confirmClearTransactions, setConfirmClearTransactions] = useState(false)
  const [confirmResetAll, setConfirmResetAll] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3000)
  }

  const handleExportJSON = () => {
    const backup = {
      version: '1.0',
      date: new Date().toISOString(),
      finance: localStorage.getItem('aura-fin-finance'),
      payroll: localStorage.getItem('aura-fin-payroll'),
      accounting: localStorage.getItem('aura-fin-accounting'),
      settings: localStorage.getItem('aura-fin-settings'),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aurafin-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showNotification('Backup exportado com sucesso!')
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (parsed.finance) localStorage.setItem('aura-fin-finance', parsed.finance)
        if (parsed.payroll) localStorage.setItem('aura-fin-payroll', parsed.payroll)
        if (parsed.accounting) localStorage.setItem('aura-fin-accounting', parsed.accounting)
        if (parsed.settings) localStorage.setItem('aura-fin-settings', parsed.settings)
        showNotification('Dados restaurados com sucesso! Recarregando...')
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        alert('Arquivo de backup inválido')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-up">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Tema & Aparência (Modo Noturno) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Moon size={20} className="text-indigo-600 dark:text-indigo-400" />
          Aparência & Modo Noturno
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Personalize a exibição do aplicativo para conforto visual durante o dia ou à noite.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2 transition cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
              <Moon size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">Modo Noturno</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Escuro para menor fadiga visual</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2 transition cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sun size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">Modo Claro</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Visual limpo e brilhante</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2 transition cursor-pointer ${
              theme === 'system'
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 flex items-center justify-center">
              <Monitor size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">Automático</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Sincronizar com o sistema</p>
            </div>
          </button>
        </div>
      </div>

      {/* Preferências Gerais */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
          Preferências Gerais
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Moeda Principal
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="BRL">BRL - Real Brasileiro (R$)</option>
              <option value="USD">USD - Dólar Americano ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Lembretes e Alertas
            </label>
            <div className="flex items-center h-11">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  Exibir avisos de reserva e vencimentos
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Gerenciamento de Dados (Zerar Entradas e Saídas) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-950/60 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <RotateCcw size={20} />
          Gerenciamento e Limpeza de Dados
        </h2>
        <p className="text-xs text-gray-600 dark:text-slate-400">
          Você pode zerar registros individualmente ou restaurar o estado inicial do sistema.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => setConfirmClearTransactions(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 font-medium text-sm transition"
          >
            <RotateCcw size={16} />
            <span>Zerar Todas Entradas e Saídas ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmResetAll(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-gray-700 dark:text-slate-300 rounded-xl border border-gray-200 dark:border-slate-700 font-medium text-sm transition"
          >
            <AlertTriangle size={16} />
            <span>Restaurar Fábrica (Zerar Tudo)</span>
          </button>
        </div>

        {/* Backup & Restauração */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <Download size={14} />
            <span>Exportar Backup JSON</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-gray-700 dark:text-slate-200 transition cursor-pointer">
            <Upload size={14} />
            <span>Importar Backup JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Informações da Versão e Segurança */}
      <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 text-center text-xs text-gray-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-gray-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
          <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
          AuraFin Pro v1.2.0 • Modo Noturno Completo
        </p>
        <p>Todos os dados são criptografados localmente no seu dispositivo através de LocalStorage e IndexedDB.</p>
      </div>

      {/* Modal: Confirmar Zerar Entradas e Saídas */}
      {confirmClearTransactions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 mx-auto">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-slate-100 mb-2">
              Zerar todas as entradas e saídas?
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-slate-400 mb-6">
              Todos os {transactions.length} registros de fluxo de caixa serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearTransactions(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearTransactions()
                  setConfirmClearTransactions(false)
                  showNotification('Todas as entradas e saídas foram zeradas!')
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Reset Total */}
      {confirmResetAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-slate-100 mb-2">
              Restaurar aos padrões originais?
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-slate-400 mb-6">
              Esta ação zerará todas as transações, holerites cadastrados e configurações salvas.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFinanceData()
                  clearPayrolls()
                  setConfirmResetAll(false)
                  showNotification('Sistema restaurado aos padrões de fábrica com registros zerados!')
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition shadow-sm"
              >
                Zerar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
}
