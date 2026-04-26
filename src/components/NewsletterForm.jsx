import { useState } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../services/supabaseClient'

export default function NewsletterForm({ initialEmail = '', className = '' }) {
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cleanEmail = email.trim()
    setStatus({ type: '', message: '' })

    if (!cleanEmail) {
      setStatus({ type: 'error', message: 'Please enter your email.' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('newsletter')
        .insert([{ email: cleanEmail }])

      if (error) {
        if (error.code === '23505') {
          setStatus({ type: 'error', message: "You're already subscribed!" })
        } else {
          setStatus({ type: 'error', message: 'Something went wrong. Please try again.' })
        }
        return
      }

      setStatus({ type: 'success', message: 'Thank you for subscribing!' })
      setEmail('')
    } catch {
      setStatus({ type: 'error', message: 'Server error. Please try again later.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="bg-secondary/20 px-4 py-2 rounded-lg text-secondary placeholder:text-secondary/40 border border-[#A0C28A] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full pr-12 transition-colors duration-200"
        />
        <button
          type="submit"
          aria-label="Send email"
          disabled={loading}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            flex items-center justify-center
            w-8 h-8 rounded-md bg-green-700 text-white
            transition-opacity duration-200
            disabled:opacity-50
            disabled:cursor-not-allowed
            disabled:pointer-events-none
          "
        >
          <Icon icon="iconoir:send" className="size-5" />
        </button>
      </form>
      {status.message && (
        <span className={`text-xs mt-2 block ${status.type === 'error' ? 'text-red-500' : 'text-green-400'}`}>
          {status.message}
        </span>
      )}
    </div>
  )
}
