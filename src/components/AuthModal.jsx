import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import Button from './Button'

function AuthModal({ isOpen, onClose }) {
  const { signIn, signUp } = useAuth()

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin')

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [college, setCollege] = useState('')
  const [phone, setPhone] = useState('')

  // Feedback State
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mode switcher handler that resets state directly on user interaction
  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMessage(null)
  }

  // Close modal and reset fields
  const handleClose = () => {
    setError(null)
    setSuccessMessage(null)
    onClose()
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Basic client validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Full name is required.')
        return
      }
      if (!college.trim()) {
        setError('College / university name is required.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === 'signin') {
        const { error: signInError } = await signIn({ email, password })
        if (signInError) {
          setError(signInError.message || 'Failed to sign in. Please check your credentials.')
          setIsSubmitting(false)
          return
        }
        // Success
        setIsSubmitting(false)
        handleClose()
      } else {
        const { data, error: signUpError } = await signUp({
          email,
          password,
          fullName,
          college,
          phone,
        })

        if (signUpError) {
          setError(signUpError.message || 'Failed to create account.')
          setIsSubmitting(false)
          return
        }

        setIsSubmitting(false)

        // Check if user session was created immediately or confirmation email was sent
        if (data?.session) {
          handleClose()
        } else {
          setSuccessMessage(
            'Account created! A confirmation email has been sent. Please verify your email before logging in.'
          )
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-panel)] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text p-1 text-sm font-mono transition-colors"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Header & Mode Switcher */}
        <div className="mb-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            BuildIt Authentication
          </span>
          <h2 id="auth-modal-title" className="font-display font-semibold text-2xl text-text mt-1">
            {mode === 'signin' ? 'Sign In to BuildIt' : 'Create Participant Account'}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            {mode === 'signin'
              ? 'Access your participant dashboard and manage your team.'
              : 'Register your hacker account to join or lead a team.'}
          </p>

          {/* Tab Switcher */}
          <div className="flex border-b border-border mt-4">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`pb-2.5 px-4 text-xs font-mono font-medium transition-colors border-b-2 -mb-px ${
                mode === 'signin'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`pb-2.5 px-4 text-xs font-mono font-medium transition-colors border-b-2 -mb-px ${
                mode === 'signup'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-500/60 text-xs text-red-300 font-mono" role="alert">
            ✕ {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded bg-accent/15 border border-accent/40 text-xs text-accent font-mono" role="status">
            ✓ {successMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block font-mono uppercase text-text-muted mb-1">
                Full Name <span className="text-accent">*</span>
              </label>
              <input
                id="auth-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block font-mono uppercase text-text-muted mb-1">
              College / University Email <span className="text-accent">*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@college.edu"
              className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block font-mono uppercase text-text-muted mb-1">
              Password <span className="text-accent">*</span>
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
              required
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="auth-college" className="block font-mono uppercase text-text-muted mb-1">
                  College / University <span className="text-accent">*</span>
                </label>
                <input
                  id="auth-college"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="VIT Bhopal University"
                  className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label htmlFor="auth-phone" className="block font-mono uppercase text-text-muted mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-xs font-mono ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSubmitting
                ? mode === 'signin'
                  ? 'Signing In...'
                  : 'Creating Account...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-border text-center text-xs text-text-muted">
          {mode === 'signin' ? (
            <p>
              New participant?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-accent underline hover:text-accent-strong"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="text-accent underline hover:text-accent-strong"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
