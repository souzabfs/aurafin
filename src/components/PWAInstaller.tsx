import React, { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
    } catch {
      setShowPrompt(false)
    }

    setDeferredPrompt(null)
  }

  // Safe Service Worker Registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker
          .register('/sw.js')
          .catch(() => {
            // Silently ignore in iframe/preview environments where SW is restricted
          })
      } catch {
        // Safe fallback
      }
    }
  }, [])

  if (!showPrompt || isInstalled) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-4 max-w-sm z-50 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Smartphone size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Instalar AuraFin</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Aplicativo Offline</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-gray-600 dark:text-slate-400 mb-3 leading-relaxed">
        Instale o AuraFin na sua tela inicial para acesso rápido, navegação sem barras de navegador e funcionamento offline.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          Agora Não
        </button>
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition shadow-sm"
        >
          <Download size={14} />
          Instalar App
        </button>
      </div>
    </div>
  )
}
