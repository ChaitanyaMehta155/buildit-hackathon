import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Button from '../components/Button'

function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword, session } = useAuth()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingSession(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!newPassword || !confirmPassword) {
      setError('Please fill out all fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)

    const { error: updateError } = await updatePassword(newPassword)
    
    setIsSubmitting(false)

    if (updateError) {
      setError(updateError.message || 'Failed to update password. Please try again.')
    } else {
      setSuccess(true)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center font-mono text-text-muted text-sm animate-pulse">
          Verifying secure session...
        </div>
      </div>
    )
  }

  if (!session && !success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-panel)] p-8 text-center shadow-2xl">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950/30 text-red-500 border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="font-display font-semibold text-2xl text-text mb-2">Invalid or Expired Link</h2>
          <p className="text-text-muted text-sm mb-6">
            The password reset link you used is invalid, expired, or has already been used. Please request a new one.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-panel)] p-6 md:p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Account Recovery
          </span>
          <h2 className="font-display font-semibold text-2xl text-text mt-1">
            {success ? 'Password Updated' : 'Reset Your Password'}
          </h2>
          {!success && (
            <p className="text-sm text-text-muted mt-2">
              Please enter your new password below.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-950/40 border border-red-500/60 text-xs text-red-300 font-mono" role="alert">
            ✕ {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded bg-accent/10 border border-accent/30 text-sm text-text font-mono inline-block">
              Your password has been successfully updated.
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block font-mono text-xs uppercase text-text-muted mb-1.5">
                New Password <span className="text-accent">*</span>
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2.5 text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block font-mono text-xs uppercase text-text-muted mb-1.5">
                Confirm New Password <span className="text-accent">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2.5 text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-mono ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
