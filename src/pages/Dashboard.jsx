import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'
import JoinTeamModal from '../components/JoinTeamModal'

// Official track descriptions matching the BuildIt project
const trackMetadata = {
  'ai-ml': {
    title: 'AI & Machine Learning',
    badge: 'Track 01',
    description:
      'Build intelligent autonomous agents, multimodal systems, developer tools, or domain-specific assistive intelligence.',
  },
  'web3-infra': {
    title: 'Web3 & Infrastructure',
    badge: 'Track 02',
    description:
      'Create scalable decentralized applications, developer infrastructure, zero-knowledge proofs, or peer-to-peer protocols.',
  },
  'climate-sustainability': {
    title: 'Climate & Sustainability',
    badge: 'Track 03',
    description:
      'Leverage software and data engineering to solve pressing environmental challenges, resource management, and clean energy optimization.',
  },
  'open-innovation': {
    title: 'Open Innovation',
    badge: 'Track 04',
    description:
      'No boundaries. Build breakthrough utilities, accessibility tech, educational platforms, hardware hacks, or developer superpowers.',
  },
}

// Progress checklist steps
const checklistSteps = [
  { id: 'step-1', label: 'Team registered', done: true, note: 'Confirmed in session' },
  { id: 'step-2', label: 'Check-in at VIT Bhopal (14 Nov, 08:00 AM)', done: false, note: 'Auditorium' },
  { id: 'step-3', label: 'Build project during 36h sprint', done: false, note: '14-15 Nov' },
  { id: 'step-4', label: 'Submit repo & demo link', done: false, note: 'Deadline: 15 Nov, 09:00 AM' },
  { id: 'step-5', label: 'Present to jury & finalist demos', done: false, note: '15 Nov afternoon' },
]

function DashboardPage() {
  const { user, isConfigured } = useAuth()
  const [copiedCode, setCopiedCode] = useState(false)
  const [dbRegistration, setDbRegistration] = useState(null)
  const [isLoadingDb, setIsLoadingDb] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Read registration data from sessionStorage (set during /register)
  const [sessionRegistration] = useState(() => {
    try {
      const saved = sessionStorage.getItem('buildit_demo_registration')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Hydrate team directly from Supabase if user is logged in
  useEffect(() => {
    if (!user || !isConfigured || !supabase) return

    let isMounted = true

    async function loadTeam() {
      try {
        setIsLoadingDb(true)
        const { data: teamId } = await supabase.rpc('current_team_id')
        if (!teamId || !isMounted) {
          setIsLoadingDb(false)
          return
        }

        const { data: team } = await supabase
          .from('teams')
          .select('id, name, track_id, invite_code, created_at')
          .eq('id', teamId)
          .maybeSingle()

        if (!team || !isMounted) {
          setIsLoadingDb(false)
          return
        }

        const { data: membersList } = await supabase
          .from('team_members')
          .select('id, role, profile_id, joined_at, profiles(id, full_name, email, college, phone)')
          .eq('team_id', teamId)

        if (!isMounted) return

        const leaderMember = membersList?.find((m) => m.role === 'leader')
        const otherMembers = membersList?.filter((m) => m.role !== 'leader') || []

        const liveData = {
          id: `BID-${team.invite_code}`,
          teamId: team.id,
          inviteCode: team.invite_code,
          teamName: team.name,
          trackId: team.track_id,
          trackLabel: trackMetadata[team.track_id]?.title || team.track_id,
          teamSize: membersList?.length || 1,
          leader: {
            id: leaderMember?.profiles?.id,
            fullName: leaderMember?.profiles?.full_name || 'Team Leader',
            email: leaderMember?.profiles?.email || '',
            phone: leaderMember?.profiles?.phone || '',
            college: leaderMember?.profiles?.college || '',
          },
          members: otherMembers.map((m, idx) => ({
            id: m.id,
            fullName: m.profiles?.full_name || `Member ${idx + 2}`,
            email: m.profiles?.email || '',
            college: m.profiles?.college || '',
          })),
          submittedAt: new Date(team.created_at).toLocaleString(),
          isSupabaseSynced: true,
        }

        setDbRegistration(liveData)
        try {
          sessionStorage.setItem('buildit_demo_registration', JSON.stringify(liveData))
        } catch {
          // Non-blocking storage cache
        }
        setIsLoadingDb(false)
      } catch {
        if (isMounted) setIsLoadingDb(false)
      }
    }

    loadTeam()
    return () => {
      isMounted = false
    }
  }, [user, isConfigured, refreshKey])

  const handleJoinSuccess = () => {
    setIsLoadingDb(true)
    setRefreshKey((prev) => prev + 1)
  }

  const registration = dbRegistration || sessionRegistration

  // State for the submission area demo interaction
  const [submissionForm, setSubmissionForm] = useState({
    projectName: '',
    repoUrl: '',
    demoUrl: '',
    description: '',
  })
  const [submissionFeedback, setSubmissionFeedback] = useState(null)

  const handleDemoSubmit = (e) => {
    e.preventDefault()
    if (!submissionForm.projectName.trim() && !submissionForm.repoUrl.trim()) {
      setSubmissionFeedback({
        type: 'warning',
        message: 'Enter a project name or GitHub link to test the submission preview.',
      })
      return
    }

    setSubmissionFeedback({
      type: 'info',
      message:
        'Demo Submission Preview: Your draft has been validated locally. Live submission endpoints will open on Sunday, 15 Nov at 06:00 AM when the official backend portal activates. No remote server data was altered.',
    })
  }

  // Loading state while checking Supabase for authenticated user's team
  if (isLoadingDb && !registration) {
    return (
      <div className="py-8">
        <Section id="dashboard-loading" className="text-center">
          <div className="max-w-xl mx-auto py-16">
            <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Loading participant team from database...
            </span>
          </div>
        </Section>
      </div>
    )
  }

  // EMPTY STATE: Displayed when no registration exists in sessionStorage or Supabase
  if (!registration) {
    return (
      <div className="py-8">
        <Section id="dashboard-empty" className="text-center">
          <div className="max-w-xl mx-auto py-12">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted font-mono text-xl">
              [ ! ]
            </div>

            <span className="font-mono text-xs uppercase tracking-wider text-text-muted px-2.5 py-1 rounded bg-surface border border-border">
              Participant Workspace
            </span>

            <h1 className="mt-4 font-display font-semibold text-3xl md:text-4xl text-text">
              No Team Registered Yet
            </h1>

            <p className="mt-3 text-text-muted text-sm leading-relaxed">
              You are viewing the participant dashboard in guest mode. Register your team of 1–4 members to activate your live roster, track overview, and project submission portal.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button variant="primary">Register Your Team</Button>
              </Link>
              <Button variant="secondary" onClick={() => setIsJoinModalOpen(true)}>
                Join a Team
              </Button>
              <Link to="/tracks">
                <Button variant="ghost">Browse Tracks</Button>
              </Link>
            </div>

            {/* Quick links to explore hackathon info */}
            <div className="mt-14 pt-8 border-t border-border text-left">
              <p className="font-mono text-xs uppercase text-text-muted mb-4 text-center">
                Explore Event Information
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <Link
                  to="/rules"
                  className="p-3 rounded bg-surface border border-border hover:border-accent transition-colors block text-center"
                >
                  <span className="font-medium text-text block">Rules & Guide</span>
                  <span className="text-text-muted text-[11px]">Eligibility criteria</span>
                </Link>
                <Link
                  to="/schedule"
                  className="p-3 rounded bg-surface border border-border hover:border-accent transition-colors block text-center"
                >
                  <span className="font-medium text-text block">Schedule</span>
                  <span className="text-text-muted text-[11px]">36-hour timeline</span>
                </Link>
                <Link
                  to="/prizes"
                  className="p-3 rounded bg-surface border border-border hover:border-accent transition-colors block text-center"
                >
                  <span className="font-medium text-text block">Prizes</span>
                  <span className="text-text-muted text-[11px]">₹4L prize pool</span>
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* Join Team Modal */}
        <JoinTeamModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      </div>
    )
  }

  // Retrieve track information matching the team's selected track
  const trackInfo = trackMetadata[registration.trackId] || {
    title: registration.trackLabel,
    badge: 'Track',
    description: 'Explore problem statements and build your solution within this domain.',
  }

  return (
    <div className="py-8">
      <Section
        id="dashboard-header"
        title="Participant Dashboard"
        subtitle="Manage your team, track upcoming milestones, and access hackathon resources in one place."
      >
        {/* 1. Header / Welcome Banner */}
        <div className="max-w-5xl mx-auto mb-8">
          <Card className="border-border-strong bg-surface">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 mb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-semibold">
                    REGISTRATION CONFIRMED
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    ID: <strong className="text-text font-semibold">{registration.id}</strong>
                  </span>
                  {registration.inviteCode && (
                    <div className="flex items-center gap-1 font-mono text-xs bg-surface-2 border border-accent/40 rounded px-2 py-0.5 text-accent">
                      <span>Invite Code: <strong>{registration.inviteCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(registration.inviteCode)
                          setCopiedCode(true)
                          setTimeout(() => setCopiedCode(false), 2000)
                        }}
                        className="ml-1 text-[10px] text-text-muted hover:text-text px-1 rounded bg-surface border border-border"
                        title="Copy invite code"
                      >
                        {copiedCode ? '✓' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl text-text mt-2">
                  Welcome to BuildIt, {registration.teamName}
                </h1>
                <p className="text-text-muted text-xs sm:text-sm mt-1">
                  Registered on {registration.submittedAt} • {registration.isSupabaseSynced ? 'Database synced' : 'Demo session active'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link to="/register">
                  <Button variant="secondary" className="text-xs">
                    Edit / Register Again
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="font-mono text-text-muted uppercase block">Team Name</span>
                <span className="font-medium text-text text-sm">{registration.teamName}</span>
              </div>
              <div>
                <span className="font-mono text-text-muted uppercase block">Assigned Track</span>
                <span className="font-medium text-accent text-sm">{trackInfo.title}</span>
              </div>
              <div>
                <span className="font-mono text-text-muted uppercase block">Team Composition</span>
                <span className="font-medium text-text text-sm">
                  {registration.teamSize} {registration.teamSize === 1 ? 'Member (Solo)' : 'Members'}
                </span>
              </div>
              <div>
                <span className="font-mono text-text-muted uppercase block">Primary Contact</span>
                <span className="font-medium text-text text-sm truncate block" title={registration.leader.email}>
                  {registration.leader.fullName}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Layout (2 Columns on Desktop) */}
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Left Column: Team, Track, and Submission Portal (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 2. Event Status Card */}
            <Card>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted">Event Status</span>
                  <h2 className="font-display font-semibold text-lg text-text mt-0.5">
                    BuildIt Hackathon 2026
                  </h2>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-surface-2 border border-border text-accent font-semibold">
                  HACKATHON UPCOMING
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono mb-4">
                <div>
                  <span className="text-text-muted block">EVENT DATES</span>
                  <span className="text-text font-medium text-sm">14-15 Nov 2026</span>
                </div>
                <div>
                  <span className="text-text-muted block">VENUE</span>
                  <span className="text-text font-medium text-sm">VIT Bhopal</span>
                </div>
                <div>
                  <span className="text-text-muted block">KICKOFF</span>
                  <span className="text-accent font-medium text-sm">Sat 09:00 AM</span>
                </div>
              </div>

              <div className="p-3 rounded bg-ink border border-border text-xs text-text-muted leading-relaxed">
                <span className="font-semibold text-text font-mono">Next Milestone:</span> Participant check-in and breakfast begins at 08:00 AM on Saturday, 14 November. Ensure all team members carry their student ID cards.
              </div>
            </Card>

            {/* 3. Team Roster Card */}
            <Card>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted">Roster</span>
                  <h2 className="font-display font-semibold text-lg text-text mt-0.5">
                    Team Members ({registration.teamSize} / 4)
                  </h2>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
                  ID: {registration.id}
                </span>
              </div>

              <div className="space-y-3">
                {/* Team Leader */}
                <div className="p-3 rounded bg-ink border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text text-sm">{registration.leader.fullName}</span>
                      <span className="text-accent text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                        Team Leader
                      </span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      {registration.leader.email} • {registration.leader.phone}
                    </p>
                  </div>
                  <span className="font-mono text-text-muted text-xs sm:text-right">
                    {registration.leader.college}
                  </span>
                </div>

                {/* Additional Members */}
                {registration.members.length > 0 ? (
                  registration.members.map((member, idx) => (
                    <div
                      key={member.id || idx}
                      className="p-3 rounded bg-ink border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text text-sm">{member.fullName}</span>
                          <span className="text-text-muted text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                            Member {idx + 2}
                          </span>
                        </div>
                        <p className="text-text-muted text-xs mt-1">{member.email}</p>
                      </div>
                      <span className="font-mono text-text-muted text-xs sm:text-right">
                        {member.college}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted p-2 rounded bg-ink/50 border border-border/50 text-center">
                    Registered as a solo participant. If you connect with teammates before the kickoff, you can update your roster.
                  </p>
                )}
              </div>
            </Card>

            {/* 4. Track Information Card */}
            <Card>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted">Domain</span>
                  <h2 className="font-display font-semibold text-lg text-text mt-0.5">
                    Selected Track
                  </h2>
                </div>
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-surface-2 text-accent border border-border">
                  {trackInfo.badge}
                </span>
              </div>

              <h3 className="font-display font-semibold text-xl text-accent">
                {trackInfo.title}
              </h3>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                {trackInfo.description}
              </p>

              <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-mono text-text-muted">
                  Need to inspect judging criteria or focus areas?
                </span>
                <Link to="/tracks">
                  <Button variant="secondary" className="text-xs">
                    View Track Guidelines →
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 5. Project Submission Area (DEMO) */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 mb-4 gap-2">
                <div>
                  <span className="font-mono text-xs uppercase text-text-muted">Deliverable</span>
                  <h2 className="font-display font-semibold text-lg text-text mt-0.5">
                    Project Submission Portal
                  </h2>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                  Portal Opens 15 Nov, 06:00 AM
                </span>
              </div>

              {/* Submission notice */}
              <div className="mb-4 p-3 rounded bg-ink border border-border text-xs text-text-muted leading-relaxed">
                <span className="text-accent font-semibold font-mono">Demo Workspace:</span> Use this form to test or stage your prospective project details. Real submissions will be submitted to the official review jury on Sunday, 15 November.
              </div>

              <form onSubmit={handleDemoSubmit} className="space-y-3 text-xs">
                <div>
                  <label htmlFor="projectName" className="block font-mono uppercase text-text-muted mb-1">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={submissionForm.projectName}
                    onChange={(e) =>
                      setSubmissionForm({ ...submissionForm, projectName: e.target.value })
                    }
                    placeholder="e.g. EcoGrid AI Optimizer"
                    className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="repoUrl" className="block font-mono uppercase text-text-muted mb-1">
                    GitHub Repository URL (Public)
                  </label>
                  <input
                    id="repoUrl"
                    type="url"
                    value={submissionForm.repoUrl}
                    onChange={(e) =>
                      setSubmissionForm({ ...submissionForm, repoUrl: e.target.value })
                    }
                    placeholder="https://github.com/your-team/buildit-2026"
                    className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="demoUrl" className="block font-mono uppercase text-text-muted mb-1">
                    Live Demo / Video Link (YouTube / Loom)
                  </label>
                  <input
                    id="demoUrl"
                    type="url"
                    value={submissionForm.demoUrl}
                    onChange={(e) =>
                      setSubmissionForm({ ...submissionForm, demoUrl: e.target.value })
                    }
                    placeholder="https://youtu.be/... or deployed web application"
                    className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="projectDesc" className="block font-mono uppercase text-text-muted mb-1">
                    Short Project Description
                  </label>
                  <textarea
                    id="projectDesc"
                    rows={2}
                    value={submissionForm.description}
                    onChange={(e) =>
                      setSubmissionForm({ ...submissionForm, description: e.target.value })
                    }
                    placeholder="Brief 2-3 sentence overview of what problem your project solves..."
                    className="w-full bg-ink border border-border rounded-[var(--radius-control)] px-3 py-2 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                {submissionFeedback && (
                  <div
                    className={`p-3 rounded text-xs leading-relaxed border ${
                      submissionFeedback.type === 'warning'
                        ? 'bg-ink border-red-500/80 text-red-400'
                        : 'bg-surface-2 border-accent/50 text-text'
                    }`}
                  >
                    {submissionFeedback.message}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-text-muted font-mono">
                    Hard Deadline: 15 Nov, 09:00 AM
                  </span>
                  <Button variant="primary" type="submit" className="text-xs">
                    Test Demo Submission
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Progress Checklist & Quick Resources (1 Col) */}
          <div className="space-y-6">
            {/* 7. Progress / Checklist Card */}
            <Card>
              <h2 className="font-display font-semibold text-base text-text mb-1">
                Participant Checklist
              </h2>
              <p className="text-xs text-text-muted mb-4">
                Track your team's hackathon milestones.
              </p>

              <div className="space-y-3">
                {checklistSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 font-mono text-xs mt-0.5 ${
                        step.done
                          ? 'bg-accent text-accent-ink font-bold'
                          : 'border border-border text-text-muted bg-ink'
                      }`}
                    >
                      {step.done ? '✓' : '○'}
                    </div>
                    <div>
                      <p
                        className={`text-xs ${
                          step.done ? 'text-text font-medium' : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </p>
                      <span className="text-[10px] font-mono text-text-muted block">
                        {step.note}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 6. Important Resources Card */}
            <Card>
              <h2 className="font-display font-semibold text-base text-text mb-1">
                Important Resources
              </h2>
              <p className="text-xs text-text-muted mb-4">
                Quick reference guides and event information.
              </p>

              <nav className="space-y-2.5 text-xs" aria-label="Dashboard quick links">
                <Link
                  to="/rules"
                  className="block p-2.5 rounded bg-surface-2 border border-border hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">Rules & Guidelines</span>
                    <span className="text-accent font-mono">→</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Eligibility, code of conduct & submission criteria.
                  </p>
                </Link>

                <Link
                  to="/schedule"
                  className="block p-2.5 rounded bg-surface-2 border border-border hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">Event Schedule</span>
                    <span className="text-accent font-mono">→</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Check-in, meal breaks, and jury evaluation slots.
                  </p>
                </Link>

                <Link
                  to="/tracks"
                  className="block p-2.5 rounded bg-surface-2 border border-border hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">Tracks & Domains</span>
                    <span className="text-accent font-mono">→</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    AI/ML, Web3, Climate, and Open Innovation details.
                  </p>
                </Link>

                <Link
                  to="/prizes"
                  className="block p-2.5 rounded bg-surface-2 border border-border hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">Prizes & Bounties</span>
                    <span className="text-accent font-mono">→</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Podium breakdown and special track cash awards.
                  </p>
                </Link>

                <a
                  href="/#faq"
                  className="block p-2.5 rounded bg-surface-2 border border-border hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">Frequently Asked Questions</span>
                    <span className="text-accent font-mono">↗</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Hardware, food, travel, and campus guidance.
                  </p>
                </a>
              </nav>
            </Card>

            {/* Campus Wi-Fi & Support Card */}
            <Card className="text-xs">
              <span className="font-mono text-text-muted uppercase text-[10px]">On-Ground Support</span>
              <h3 className="font-display font-semibold text-text text-sm mt-0.5 mb-2">
                Campus Logistics
              </h3>
              <div className="space-y-1.5 text-text-muted">
                <p>
                  <strong className="text-text">Wi-Fi:</strong> VITB-Hackathon-5G
                </p>
                <p>
                  <strong className="text-text">Helpdesk:</strong> Main Auditorium, Ground Floor
                </p>
                <p>
                  <strong className="text-text">Emergency Contact:</strong> +91 755 123 4567
                </p>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default DashboardPage
