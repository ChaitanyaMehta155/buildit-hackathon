import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'
import AuthModal from '../components/AuthModal'

const tracks = [
  { id: 'ai-ml', label: 'AI & Machine Learning' },
  { id: 'web3-infra', label: 'Web3 & Infrastructure' },
  { id: 'climate-sustainability', label: 'Climate & Sustainability' },
  { id: 'open-innovation', label: 'Open Innovation' },
]

function RegisterPage() {
  const { user, isConfigured } = useAuth()

  // Form State
  const [teamName, setTeamName] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('ai-ml')

  // Team Leader (Counts as Member 1)
  const [leader, setLeader] = useState(() => ({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    college: user?.user_metadata?.college || '',
  }))

  // Additional Team Members (0 to 3 extra members, for total team size 1-4)
  const [members, setMembers] = useState([])

  // UI / Submission State
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedSummary, setSubmittedSummary] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Existing Team State (if user already registered a team in Supabase)
  const [existingTeam, setExistingTeam] = useState(null)

  // Total Team Size: Leader (1) + Additional Members
  const totalTeamSize = 1 + members.length

  // Prefill leader information if user logs in after mounting
  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setLeader((prev) => ({
        fullName: prev.fullName || user.user_metadata?.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.user_metadata?.phone || '',
        college: prev.college || user.user_metadata?.college || '',
      }))
    }, 0)
    return () => clearTimeout(timer)
  }, [user])

  // Check if authenticated user already belongs to a team in Supabase
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      return
    }

    let isMounted = true

    async function checkCurrentTeam() {
      try {
        const { data: teamId, error: teamIdError } = await supabase.rpc('current_team_id')
        if (teamIdError || !teamId || !isMounted) return

        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, track_id, invite_code')
          .eq('id', teamId)
          .maybeSingle()

        if (isMounted && !teamError && teamData) {
          setExistingTeam(teamData)
        }
      } catch {
        // Non-blocking check
      }
    }

    checkCurrentTeam()

    return () => {
      isMounted = false
    }
  }, [user])

  // Helper to clear a single error when user edits a field
  const clearError = (key) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  // Handle Team Leader field change
  const handleLeaderChange = (field, value) => {
    setLeader((prev) => ({ ...prev, [field]: value }))
    clearError(`leader_${field}`)
  }

  // Add an additional team member (up to 3 extra, making max 4 total)
  const handleAddMember = () => {
    if (members.length >= 3) return
    const newMember = {
      id: Date.now().toString(),
      fullName: '',
      email: '',
      college: '',
    }
    setMembers((prev) => [...prev, newMember])
    clearError('teamSize')
  }

  // Remove an additional team member
  const handleRemoveMember = (indexToRemove) => {
    setMembers((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    // Clear errors related to removed members
    setErrors((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`member_${indexToRemove}_`)) {
          delete next[k]
        }
      })
      return next
    })
  }

  // Handle member field change
  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    clearError(`member_${index}_${field}`)
  }

  // Email validation regex
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  // Phone number validation: strips non-digits and checks length (10-15 digits)
  const isValidPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length >= 10 && digitsOnly.length <= 15
  }

  // Comprehensive Client-Side Validation
  const validateForm = () => {
    const newErrors = {}

    // 1. Team Information Validation
    if (!teamName.trim()) {
      newErrors.teamName = 'Team name is required.'
    } else if (teamName.trim().length < 2) {
      newErrors.teamName = 'Team name must be at least 2 characters.'
    } else if (teamName.trim().length > 60) {
      newErrors.teamName = 'Team name must be 60 characters or fewer.'
    }

    if (totalTeamSize < 1 || totalTeamSize > 4) {
      newErrors.teamSize = 'Team size must be between 1 and 4 members.'
    }

    // 2. Team Leader Validation
    if (!leader.fullName.trim()) {
      newErrors.leader_fullName = 'Team leader full name is required.'
    } else if (leader.fullName.trim().length > 120) {
      newErrors.leader_fullName = 'Full name must be 120 characters or fewer.'
    }

    if (!leader.email.trim()) {
      newErrors.leader_email = 'Team leader email is required.'
    } else if (!isValidEmail(leader.email)) {
      newErrors.leader_email = 'Please enter a valid email address (e.g. name@college.edu).'
    }

    if (!leader.phone.trim()) {
      newErrors.leader_phone = 'Phone number is required.'
    } else if (!isValidPhone(leader.phone)) {
      newErrors.leader_phone = 'Please enter a valid phone number (between 10 and 15 digits).'
    }

    if (!leader.college.trim()) {
      newErrors.leader_college = 'College/university name is required.'
    }

    // 3. Additional Members Validation
    members.forEach((member, index) => {
      if (!member.fullName.trim()) {
        newErrors[`member_${index}_fullName`] = `Member ${index + 2} full name is required.`
      }

      if (!member.email.trim()) {
        newErrors[`member_${index}_email`] = `Member ${index + 2} email is required.`
      } else if (!isValidEmail(member.email)) {
        newErrors[`member_${index}_email`] = `Please enter a valid email address for Member ${index + 2}.`
      }

      if (!member.college.trim()) {
        newErrors[`member_${index}_college`] = `College/university for Member ${index + 2} is required.`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    // 1. Check Authentication if Supabase is active
    if (isConfigured && !user) {
      setErrors({ auth: 'Authentication required. Please sign in or create an account to register your team.' })
      setIsAuthModalOpen(true)
      return
    }

    // 2. Validate Form Inputs
    const isValid = validateForm()
    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField)
        if (el) el.focus()
      }
      return
    }

    setIsSubmitting(true)
    clearError('submit')

    // 3. Persist to Supabase Database (if configured and authenticated)
    if (isConfigured && supabase && user) {
      try {
        // Step A: Persist Leader's Profile Details (phone, college, full name)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: leader.fullName.trim(),
            college: leader.college.trim(),
            phone: leader.phone.trim(),
          })

        if (profileError) {
          setErrors({ submit: `Unable to update profile: ${profileError.message}` })
          setIsSubmitting(false)
          return
        }

        // Step B: Create Team using the Stage 3 create_team RPC
        const { data: createdTeam, error: teamError } = await supabase.rpc('create_team', {
          p_name: teamName.trim(),
          p_track_id: selectedTrack,
        })

        if (teamError) {
          let friendlyError = teamError.message || 'Failed to create team.'
          if (friendlyError.includes('teams_name_lower_key') || friendlyError.includes('already exists')) {
            friendlyError = `A team named "${teamName.trim()}" already exists. Please choose a distinct team name.`
          } else if (friendlyError.includes('already belong to a team')) {
            friendlyError = 'You already belong to a registered team. Each participant may only belong to one team.'
          }
          setErrors({ submit: friendlyError })
          setIsSubmitting(false)
          return
        }

        // Step C: Build Unified Summary Object
        const summaryData = {
          id: `BID-${createdTeam.invite_code || Math.floor(1000 + Math.random() * 9000)}`,
          teamId: createdTeam.id,
          inviteCode: createdTeam.invite_code,
          teamName: createdTeam.name || teamName.trim(),
          trackId: createdTeam.track_id || selectedTrack,
          trackLabel: tracks.find((t) => t.id === (createdTeam.track_id || selectedTrack))?.label || selectedTrack,
          teamSize: totalTeamSize,
          leader: {
            id: user.id,
            fullName: leader.fullName.trim(),
            email: leader.email.trim() || user.email,
            phone: leader.phone.trim(),
            college: leader.college.trim(),
          },
          members: members.map((m) => ({
            id: m.id,
            fullName: m.fullName.trim(),
            email: m.email.trim(),
            college: m.college.trim(),
          })),
          submittedAt: new Date().toLocaleString(),
          isSupabaseSynced: true,
        }

        // Mirror to sessionStorage for dashboard compatibility
        try {
          sessionStorage.setItem('buildit_demo_registration', JSON.stringify(summaryData))
        } catch {
          // Non-blocking storage fallback
        }

        setSubmittedSummary(summaryData)
        setIsSubmitting(false)
        setIsSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      } catch (err) {
        setErrors({ submit: err.message || 'An unexpected error occurred during database registration.' })
        setIsSubmitting(false)
        return
      }
    }

    // 4. Safe Fallback: Offline / Demo mode simulation
    setTimeout(() => {
      const summaryData = {
        id: `BID-${Math.floor(1000 + Math.random() * 9000)}`,
        inviteCode: 'DEMO8CODE',
        teamName: teamName.trim(),
        trackId: selectedTrack,
        trackLabel: tracks.find((t) => t.id === selectedTrack)?.label || selectedTrack,
        teamSize: totalTeamSize,
        leader: {
          fullName: leader.fullName.trim(),
          email: leader.email.trim(),
          phone: leader.phone.trim(),
          college: leader.college.trim(),
        },
        members: members.map((m) => ({
          id: m.id,
          fullName: m.fullName.trim(),
          email: m.email.trim(),
          college: m.college.trim(),
        })),
        submittedAt: new Date().toLocaleString(),
        isSupabaseSynced: false,
      }

      try {
        sessionStorage.setItem('buildit_demo_registration', JSON.stringify(summaryData))
      } catch {
        // Non-blocking fallback
      }

      setSubmittedSummary(summaryData)
      setIsSubmitting(false)
      setIsSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 600)
  }

  // Copy invite code to clipboard
  const handleCopyInviteCode = (code) => {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2200)
  }

  // Reset form to register another team
  const handleReset = () => {
    setTeamName('')
    setSelectedTrack('ai-ml')
    setLeader({
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      college: user?.user_metadata?.college || '',
    })
    setMembers([])
    setErrors({})
    setIsSubmitted(false)
    setSubmittedSummary(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Base input classes
  const getInputClasses = (hasError) =>
    `w-full bg-ink border rounded-[var(--radius-control)] px-3.5 py-2.5 text-sm text-text placeholder-text-muted/50 transition-colors focus:outline-none ${
      hasError
        ? 'border-red-500/80 focus:border-red-500'
        : 'border-border focus:border-accent'
    }`

  // Render Confirmation Screen when submitted
  if (isSubmitted && submittedSummary) {
    return (
      <div className="py-8">
        <Section id="registration-success" className="text-center">
          <div className="max-w-2xl mx-auto">
            {/* Schematic Success Badge */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/15 border border-accent flex items-center justify-center text-accent text-3xl font-mono">
              ✓
            </div>

            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent px-2.5 py-1 rounded bg-surface border border-border">
              <span>Registration Confirmed</span>
              {submittedSummary.isSupabaseSynced && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Database Synced
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display font-semibold text-3xl md:text-4xl text-text">
              Team Registered Successfully
            </h1>

            <p className="mt-3 text-text-muted text-sm max-w-lg mx-auto leading-relaxed">
              Your team has been securely recorded. Use your official Team Invite Code to invite your teammates so they can join your database roster.
            </p>

            {/* Official Team Invite Code Card */}
            {submittedSummary.inviteCode && (
              <div className="mt-6 p-4 rounded-[var(--radius-panel)] bg-surface border border-accent/60 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted block">
                      Team Invite Code
                    </span>
                    <span className="font-mono text-2xl font-bold text-accent tracking-widest mt-0.5 block">
                      {submittedSummary.inviteCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyInviteCode(submittedSummary.inviteCode)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-[var(--radius-control)] bg-surface-2 border border-border hover:border-accent text-xs font-mono text-text transition-colors"
                  >
                    {copiedCode ? '✓ Code Copied!' : 'Copy Invite Code'}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  Share this 8-character code with your teammates. When they log into BuildIt, they can join this team directly.
                </p>
              </div>
            )}

            {/* Registration Summary Card */}
            <Card className="mt-8 text-left border-border-strong bg-surface">
              <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 mb-4 gap-2">
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted">Registration ID</span>
                  <p className="font-mono text-base text-accent font-semibold">
                    {submittedSummary.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs uppercase text-text-muted">Registered At</span>
                  <p className="font-mono text-xs text-text">{submittedSummary.submittedAt}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted block">Team Name</span>
                  <span className="font-display font-semibold text-text text-base">
                    {submittedSummary.teamName}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted block">Track</span>
                  <span className="text-accent font-medium">{submittedSummary.trackLabel}</span>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted block">Team Size</span>
                  <span className="text-text font-mono">
                    {submittedSummary.teamSize} {submittedSummary.teamSize === 1 ? 'Member (Solo)' : 'Members'}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted block">Database Status</span>
                  <span className="font-mono text-xs text-emerald-400">
                    {submittedSummary.isSupabaseSynced ? '✓ Verified in Supabase' : 'Offline Session Mode'}
                  </span>
                </div>
              </div>

              {/* Roster Breakdown */}
              <div className="border-t border-border pt-4">
                <p className="font-mono text-xs uppercase text-text-muted mb-3">
                  Team Roster
                </p>

                <div className="space-y-2 text-xs">
                  {/* Team Leader */}
                  <div className="p-2.5 rounded bg-ink border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-medium text-text">{submittedSummary.leader.fullName}</span>
                      <span className="text-accent text-[10px] uppercase font-mono ml-2">(Team Leader)</span>
                      <p className="text-text-muted text-[11px]">{submittedSummary.leader.email} • {submittedSummary.leader.phone}</p>
                    </div>
                    <span className="font-mono text-text-muted text-[11px] sm:text-right">
                      {submittedSummary.leader.college}
                    </span>
                  </div>

                  {/* Additional Members */}
                  {submittedSummary.members.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded bg-ink border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div>
                        <span className="font-medium text-text">{m.fullName}</span>
                        <span className="text-text-muted text-[10px] uppercase font-mono ml-2">
                          (Member {idx + 2} • Pending Join via Code)
                        </span>
                        <p className="text-text-muted text-[11px]">{m.email}</p>
                      </div>
                      <span className="font-mono text-text-muted text-[11px] sm:text-right">
                        {m.college}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Next Steps & Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/">
                <Button variant="secondary">Back to Home</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="primary">View in Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={handleReset}>
                Register Another Team
              </Button>
            </div>
          </div>
        </Section>
      </div>
    )
  }

  // Render Interactive Form
  return (
    <div className="py-8">
      <Section
        id="register-header"
        title="Team Registration"
        subtitle="Sign up your team of 1 to 4 members for BuildIt 2026. Registration is completely free."
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* If authenticated user already belongs to a registered team */}
          {existingTeam && (
            <div className="p-4 rounded-[var(--radius-panel)] bg-surface border border-accent/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <span className="font-mono uppercase text-accent font-semibold block">
                  Existing Registration Detected
                </span>
                <p className="text-text font-medium text-sm">
                  You already belong to team &ldquo;{existingTeam.name}&rdquo;
                </p>
                <p className="text-text-muted">
                  Invite Code: <strong className="text-accent font-mono">{existingTeam.invite_code}</strong> • Hackathon rules allow membership in only one team.
                </p>
              </div>
              <Link to="/dashboard" className="shrink-0">
                <Button variant="primary" className="text-xs">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}

          {/* Authentication Banner when logged out */}
          {!user && isConfigured && (
            <div className="p-4 rounded-[var(--radius-panel)] bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-accent font-mono text-lg font-bold">🔒</span>
                <div className="text-xs text-text-muted leading-relaxed">
                  <span className="font-semibold text-text block text-sm">Sign in Required</span>
                  You must be logged in to register a team. This secures your team leadership and generates your official database invite code.
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs shrink-0"
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}

          {/* Signed-in identity banner */}
          {user && (
            <div className="p-3.5 rounded-[var(--radius-panel)] bg-surface border border-border flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-text-muted">Registering as:</span>
                <span className="text-text font-medium">{user.user_metadata?.full_name || user.email}</span>
              </div>
              <span className="text-accent text-[11px]">Authenticated</span>
            </div>
          )}

          {/* Submit / Server Error Banner */}
          {errors.submit && (
            <div className="p-4 rounded-[var(--radius-panel)] bg-red-950/40 border border-red-500/60 text-xs text-red-300 font-mono flex items-start gap-2" role="alert">
              <span>✕</span>
              <span>{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Section 1: Team Basics */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg text-text">
                  1. Team Information
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
                  Team Size: {totalTeamSize} / 4
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="teamName" className="block text-xs font-mono uppercase text-text-muted mb-1.5">
                    Team Name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value)
                      clearError('teamName')
                    }}
                    placeholder="e.g. ByteCraft Hackers"
                    maxLength={60}
                    aria-invalid={!!errors.teamName}
                    aria-describedby={errors.teamName ? 'teamName-error' : undefined}
                    className={getInputClasses(!!errors.teamName)}
                    disabled={isSubmitting}
                  />
                  {errors.teamName && (
                    <p id="teamName-error" className="mt-1 text-xs text-red-400 font-mono flex items-center gap-1" role="alert">
                      <span>✕</span> {errors.teamName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="trackSelect" className="block text-xs font-mono uppercase text-text-muted mb-1.5">
                    Preferred Track <span className="text-accent">*</span>
                  </label>
                  <select
                    id="trackSelect"
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-accent"
                    disabled={isSubmitting}
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.teamSize && (
                  <p className="mt-1 text-xs text-red-400 font-mono flex items-center gap-1" role="alert">
                    <span>✕</span> {errors.teamSize}
                  </p>
                )}
              </div>
            </Card>

            {/* Section 2: Team Leader Details */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg text-text">
                  2. Team Leader (Primary Contact)
                </h2>
                <span className="font-mono text-xs text-accent">Member 1</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="leader_fullName" className="block text-xs font-mono uppercase text-text-muted mb-1.5">
                    Full Name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="leader_fullName"
                    type="text"
                    value={leader.fullName}
                    onChange={(e) => handleLeaderChange('fullName', e.target.value)}
                    placeholder="Jane Doe"
                    maxLength={120}
                    aria-invalid={!!errors.leader_fullName}
                    aria-describedby={errors.leader_fullName ? 'leader_fullName-error' : undefined}
                    className={getInputClasses(!!errors.leader_fullName)}
                    disabled={isSubmitting}
                  />
                  {errors.leader_fullName && (
                    <p id="leader_fullName-error" className="mt-1 text-xs text-red-400 font-mono flex items-center gap-1" role="alert">
                      <span>✕</span> {errors.leader_fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="leader_email" className="block text-xs font-mono uppercase text-text-muted mb-1.5">
                    Email Address <span className="text-accent">*</span>
                  </label>
                  <input
                    id="leader_email"
                    type="email"
                    value={leader.email}
                    onChange={(e) => handleLeaderChange('email', e.target.value)}
                    placeholder="jane@college.edu"
                    aria-invalid={!!errors.leader_email}
                    aria-describedby={errors.leader_email ? 'leader_email-error' : undefined}
                    className={getInputClasses(!!errors.leader_email)}
                    disabled={isSubmitting}
                  />
                  {errors.leader_email && (
                    <p id="leader_email-error" className="mt-1 text-xs text-red-400 font-mono flex items-center gap-1" role="alert">
                      <span>✕</span> {errors.leader_email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="leader_phone" className="block text-xs font-mono uppercase text-text-muted mb-1.5">
                    Phone Number <span className="text-accent">*</span>
                  </label>
                  <input
                    id="leader_phone"
                    type="tel"
                    value={leader.phone}
                    onChange={(e) => handleLeaderChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    aria-invalid={!!errors.leader_phone}
                    aria-describedby={errors.leader_phone ? 'leader_phone-error' : undefined}
                    className={getInputClasses(!!errors.leader_phone)}
                    disabled={isSubmitting}
                  />
                  {errors.leader_phone && (
                    <p id="leader_phone-error" className="mt-1 text-xs text-red-400 font-mono flex items-center gap-1" role="alert">
                      <span>✕</span> {errors.leader_phone}
                    </p>
                  )}
                </div>

                {/* College / University */}
                <div>
                  <label htmlFor="leader_college" className="block text-xs font-mono uppercase text-text-muted mb-1.5">
                    College / University <span className="text-accent">*</span>
                  </label>
                  <input
                    id="leader_college"
                    type="text"
                    value={leader.college}
                    onChange={(e) => handleLeaderChange('college', e.target.value)}
                    placeholder="VIT Bhopal University"
                    aria-invalid={!!errors.leader_college}
                    aria-describedby={errors.leader_college ? 'leader_college-error' : undefined}
                    className={getInputClasses(!!errors.leader_college)}
                    disabled={isSubmitting}
                  />
                  {errors.leader_college && (
                    <p id="leader_college-error" className="mt-1 text-xs text-red-400 font-mono flex items-center gap-1" role="alert">
                      <span>✕</span> {errors.leader_college}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Section 3: Additional Team Members */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-semibold text-lg text-text">
                    3. Additional Team Members
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Add up to 3 more members (maximum team size of 4).
                  </p>
                </div>

                {/* Add Member Button */}
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={members.length >= 3 || isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-mono font-medium transition-colors ${
                    members.length >= 3 || isSubmitting
                      ? 'bg-surface-2 text-text-muted/40 cursor-not-allowed border border-border'
                      : 'bg-surface-2 text-accent border border-border-strong hover:border-accent hover:text-accent-strong'
                  }`}
                >
                  <span>+</span>
                  <span>Add Member ({members.length + 1}/4)</span>
                </button>
              </div>

              {members.length === 0 ? (
                <div className="p-4 rounded bg-ink border border-border text-center">
                  <p className="text-xs text-text-muted">
                    No additional members added yet (registering as Solo Hacker).
                  </p>
                  <p className="text-xs text-text-muted/70 mt-1">
                    Click <strong>&ldquo;+ Add Member&rdquo;</strong> above if you are competing with teammates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member, index) => {
                    const memberNum = index + 2
                    const nameErr = errors[`member_${index}_fullName`]
                    const emailErr = errors[`member_${index}_email`]
                    const collegeErr = errors[`member_${index}_college`]

                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded bg-ink border border-border space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <span className="font-mono text-xs text-accent font-medium uppercase">
                            Member {memberNum}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(index)}
                            disabled={isSubmitting}
                            className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors p-1 -mr-1 flex items-center gap-1"
                            title={`Remove Member ${memberNum}`}
                          >
                            <span>✕</span>
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                          {/* Member Full Name */}
                          <div>
                            <label
                              htmlFor={`member_${index}_fullName`}
                              className="block text-[11px] font-mono uppercase text-text-muted mb-1"
                            >
                              Full Name <span className="text-accent">*</span>
                            </label>
                            <input
                              id={`member_${index}_fullName`}
                              type="text"
                              value={member.fullName}
                              onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                              placeholder={`Member ${memberNum} Name`}
                              aria-invalid={!!nameErr}
                              aria-describedby={nameErr ? `member_${index}_fullName-error` : undefined}
                              className={getInputClasses(!!nameErr)}
                              disabled={isSubmitting}
                            />
                            {nameErr && (
                              <p
                                id={`member_${index}_fullName-error`}
                                className="mt-1 text-[11px] text-red-400 font-mono flex items-center gap-1"
                                role="alert"
                              >
                                <span>✕</span> {nameErr}
                              </p>
                            )}
                          </div>

                          {/* Member Email */}
                          <div>
                            <label
                              htmlFor={`member_${index}_email`}
                              className="block text-[11px] font-mono uppercase text-text-muted mb-1"
                            >
                              Email <span className="text-accent">*</span>
                            </label>
                            <input
                              id={`member_${index}_email`}
                              type="email"
                              value={member.email}
                              onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                              placeholder="colleague@college.edu"
                              aria-invalid={!!emailErr}
                              aria-describedby={emailErr ? `member_${index}_email-error` : undefined}
                              className={getInputClasses(!!emailErr)}
                              disabled={isSubmitting}
                            />
                            {emailErr && (
                              <p
                                id={`member_${index}_email-error`}
                                className="mt-1 text-[11px] text-red-400 font-mono flex items-center gap-1"
                                role="alert"
                              >
                                <span>✕</span> {emailErr}
                              </p>
                            )}
                          </div>

                          {/* Member College */}
                          <div>
                            <label
                              htmlFor={`member_${index}_college`}
                              className="block text-[11px] font-mono uppercase text-text-muted mb-1"
                            >
                              College / University <span className="text-accent">*</span>
                            </label>
                            <input
                              id={`member_${index}_college`}
                              type="text"
                              value={member.college}
                              onChange={(e) => handleMemberChange(index, 'college', e.target.value)}
                              placeholder="University Name"
                              aria-invalid={!!collegeErr}
                              aria-describedby={collegeErr ? `member_${index}_college-error` : undefined}
                              className={getInputClasses(!!collegeErr)}
                              disabled={isSubmitting}
                            />
                            {collegeErr && (
                              <p
                                id={`member_${index}_college-error`}
                                className="mt-1 text-[11px] text-red-400 font-mono flex items-center gap-1"
                                role="alert"
                              >
                                <span>✕</span> {collegeErr}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {members.length >= 3 && (
                <p className="mt-3 text-xs font-mono text-accent text-right">
                  ✓ Maximum team size reached (4 members total).
                </p>
              )}
            </Card>

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-xs text-text-muted">
                By submitting, your team agrees to the{' '}
                <Link to="/rules" className="text-accent underline hover:text-accent-strong">
                  BuildIt Rules & Code of Conduct
                </Link>
                .
              </p>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto min-w-[220px] ${
                  isSubmitting ? 'opacity-80 cursor-wait' : ''
                }`}
              >
                {isSubmitting ? 'Registering Team in Database...' : 'Submit Team Registration'}
              </Button>
            </div>
          </form>
        </div>
      </Section>

      {/* Auth Modal for unauthenticated participants */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}

export default RegisterPage
