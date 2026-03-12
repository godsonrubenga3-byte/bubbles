import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needUpdate: [needUpdate, setNeedUpdate],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedUpdate(false)
  }

  return (
    <AnimatePresence>
      {(offlineReady || needUpdate) && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-80"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-xl">
              <RefreshCw className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold dark:text-white">
                {offlineReady ? 'App ready to work offline' : 'New version available!'}
              </p>
              {needUpdate && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline mt-1"
                >
                  Update now
                </button>
              )}
            </div>
            <button
              onClick={() => close()}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReloadPrompt
