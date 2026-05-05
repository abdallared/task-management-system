import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://')
    
    setIsStandalone(standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after user has been on site for 30 seconds
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000) // 30 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt after 30 seconds if not standalone
    if (ios && !standalone) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Desktop - use native prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } else if (isIOS) {
      // iOS - show instructions
      // Keep the prompt open to show instructions
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  if (isStandalone) return null
  
  const dismissedTime = localStorage.getItem('installPromptDismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Install TaskFlow
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isIOS ? 'Add to your home screen' : 'Install our app for quick access'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          // iOS Instructions
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">
                To install on iOS:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Tap the Share button <span className="inline-block">⬆️</span> at the bottom</li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full btn btn-secondary text-sm"
            >
              Got it
            </button>
          </div>
        ) : (
          // Android/Desktop - Install button
          <div className="space-y-2">
            <button
              onClick={handleInstallClick}
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
