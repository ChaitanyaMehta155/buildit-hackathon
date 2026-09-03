import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import Button from './Button'
import AuthModal from './AuthModal'

function JoinTeamModal({ isOpen, onClose, onJoinSuccess }) {
  const { user, isConfigured } = useAuth()

  const [inviteCode, setInviteCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Reset and close
  const handleClose = () => {
    setInviteCode('')
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(false)
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

  const handleInputChange = (e) => {
    // Keep only alphanumeric characters and force uppercase
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (cleaned.length <= 8) {
      setInviteCode(cleaned)
      if (error) setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!isConfigured || !supabase) {
      setError('Database connection is not configured. Please check your settings.')
      return
    }

    if (!user) {
      setError('You must be signed in to join a team.')
      setIsAuthModalOpen(true)
      return
    }

    const cleanCode = inviteCode.trim().toUpperCase()

    if (!cleanCode) {
      setError('Please enter a team invite code.')
      return
    }

    if (cleanCode.length !== 8) {
      setError('Invite code must be exactly 8 alphanumeric characters.')
      return
    }

    setIsSubmitting(true)

    try {
      // Invoke the Stage 3 join_team_by_code RPC
      const { data: joinedTeamId, error: rpcError } = await supabase.rpc('join_team_by_code', {
        p_invite_code: cleanCode,
      })

      if (rpcError) {
        let message = rpcError.message || 'Failed to join team.'

        if (message.includes('not match any team')) {
          message = `Invite code "${cleanCode}" was not found. Please double-check the 8-character code with your team leader.`
        } else if (message.includes('already belong to a team')) {
          message = 'You already belong to a registered team. Hackathon rules permit membership in only one team.'
        } else if (message.includes('full')) {
          message = 'This team has already reached the maximum limit of 4 members.'
        } else if (message.includes('signed in')) {
          message = 'You must be signed in to join a team.'
          setIsAuthModalOpen(true)
        }

        setError(message)
        setIsSubmitting(false)
        return
      }

      setSuccessMessage('Successfully joined the team! Updating your dashboard...')
      setIsSubmitting(false)

      // Notify parent to refresh data immediately
      setTimeout(() => {
        if (onJoinSuccess) {
          onJoinSuccess(joinedTeamId)
        }
        handleClose()
      }, 750)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while joining the team.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-team-modal-title"
      >
        <div className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-panel)] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text p-1 text-sm font-mono transition-colors"
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            ✕
          </button>

          {/* Header */}
          <div className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
              Team Roster
            </span>
            <h2 id="join-team-modal-title" className="font-display font-semibold text-2xl text-text mt-1">
              Join a Team
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Enter the 8-character invite code provided by your team leader to join their official roster.
            </p>
          </div>

          {/* Unauthenticated User Warning */}
          {!user && (
            <div className="mb-4 p-3.5 rounded-[var(--radius-panel)] bg-surface-2 border border-border flex flex-col gap-2">
              <p className="text-xs text-text-muted">
                You must be logged in to join a team so your profile is linked to the team roster.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full text-xs font-mono"
              >
                Sign In to Your Account
              </Button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-500/60 text-xs text-red-300 font-mono flex items-start gap-2" role="alert">
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded bg-emerald-950/40 border border-emerald-500/60 text-xs text-emerald-300 font-mono flex items-start gap-2" role="status">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Join Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="team-invite-code" className="block font-mono uppercase text-xs text-text-muted mb-1.5">
                Invite Code <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id="team-invite-code"
                  type="text"
                  value={inviteCode}
                  onChange={handleInputChange}
                  placeholder="e.g. A7B9K2X1"
                  maxLength={8}
                  className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-text placeholder-text-muted/40 focus:outline-none focus:border-accent uppercase"
                  disabled={isSubmitting || !user}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-text-muted font-mono flex justify-between">
                <span>Format: 8 uppercase letters or digits</span>
                <span>{inviteCode.length}/8</span>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-xs font-mono"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !user || inviteCode.length !== 8}
                className={`text-xs font-mono min-w-[140px] ${
                  isSubmitting ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isSubmitting ? 'Joining Team...' : 'Join Team'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded AuthModal if participant needs to sign in */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}

export default JoinTeamModal
