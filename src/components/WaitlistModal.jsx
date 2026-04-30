import { useEffect } from 'react'
import { Icon } from '@iconify/react'
import NewsletterForm from './NewsletterForm'

export default function WaitlistModal({ isOpen, onClose, userEmail = '' }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-primary text-secondary rounded-2xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary/60 hover:text-secondary transition-colors"
          aria-label="Close"
        >
          <Icon icon="lucide:x" width="20" height="20" />
        </button>

        <h2 className="text-2xl font-poltawski font-bold mb-2">Join the Waitlist</h2>
        <p className="text-sm text-secondary/70 mb-6">
          Be the first to know when the ScanMyFrame marketplace launches. Enter your email and we'll keep you posted.
        </p>

        <NewsletterForm initialEmail={userEmail} />
      </div>
    </div>
  )
}
