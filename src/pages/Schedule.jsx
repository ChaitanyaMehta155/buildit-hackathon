import { useState } from 'react'
import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'

const saturdaySchedule = [
  {
    time: '08:00 AM',
    tag: 'Check-in',
    title: 'Participant Check-in & Breakfast',
    description: 'Arrive at the main auditorium, collect your hacker badge and kit, and grab breakfast.',
  },
  {
    time: '09:00 AM',
    tag: 'Ceremony',
    title: 'Opening Ceremony & Track Briefing',
    description: 'Keynote address, problem statement clarifications, and jury introductions.',
  },
  {
    time: '10:00 AM',
    tag: 'Milestone',
    title: 'Hacking Begins',
    description: 'Repositories initialized, team workspaces assigned, and clock starts ticking.',
  },
  {
    time: '01:30 PM',
    tag: 'Food',
    title: 'Lunch Break & Mini Tech Talks',
    description: 'Hot buffet served in dining hall. Optional 15-minute sponsor API walkthroughs.',
  },
  {
    time: '05:00 PM',
    tag: 'Mentorship',
    title: 'Mentor Round 1: Architecture Check',
    description: 'Industry mentors visit tables to review system design, track fit, and technical feasibility.',
  },
  {
    time: '08:30 PM',
    tag: 'Food',
    title: 'Dinner Served',
    description: 'Refuel and recharge with your team before night hacking.',
  },
  {
    time: '11:00 PM',
    tag: 'Mentorship',
    title: 'Mentor Round 2: Progress & Debugging',
    description: 'Hands-on debugging and guidance for teams hitting integration bottlenecks.',
  },
]

const sundaySchedule = [
  {
    time: '01:00 AM',
    tag: 'Activity',
    title: 'Midnight Snacks & Mini Games',
    description: 'Coffee, energy drinks, and fun casual mini-events to keep energy high.',
  },
  {
    time: '07:30 AM',
    tag: 'Food',
    title: 'Breakfast & Final Polish',
    description: 'Morning breakfast served. Begin preparing demo videos, slides, and final commits.',
  },
  {
    time: '09:00 AM',
    tag: 'Deadline',
    title: 'Submissions Hard Deadline',
    description: 'All code must be pushed to GitHub and submitted on the portal. Late submissions locked.',
  },
  {
    time: '10:30 AM',
    tag: 'Judging',
    title: 'Round 1 Judging: Technical Screening',
    description: 'Judges evaluate GitHub repositories, live deployments, and submitted videos.',
  },
  {
    time: '01:00 PM',
    tag: 'Food',
    title: 'Lunch & Finalist Announcements',
    description: 'Top 10 finalist teams selected for the main stage presentation.',
  },
  {
    time: '02:00 PM',
    tag: 'Judging',
    title: 'Grand Finale: Live Stage Demos',
    description: 'Finalist teams present 5-minute live demos followed by Q&A with executive jury.',
  },
  {
    time: '04:30 PM',
    tag: 'Awards',
    title: 'Closing Ceremony & Winner Felicitations',
    description: 'Announcement of Track Winners, Overall Podium, and prize distributions.',
  },
]

function SchedulePage() {
  const [activeDay, setActiveDay] = useState('sat')

  const scheduleList = activeDay === 'sat' ? saturdaySchedule : sundaySchedule

  return (
    <div className="py-8">
      <Section
        id="schedule-header"
        title="Event Schedule"
        subtitle="36 hours of relentless building, peer collaboration, and technical mentorship."
      >
        {/* Day Selector Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-[var(--radius-control)] bg-surface border border-border">
            <button
              type="button"
              onClick={() => setActiveDay('sat')}
              className={`px-6 py-2 text-sm font-medium rounded-[var(--radius-control)] transition-colors ${
                activeDay === 'sat'
                  ? 'bg-accent text-accent-ink font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Day 1: Saturday (14 Nov)
            </button>
            <button
              type="button"
              onClick={() => setActiveDay('sun')}
              className={`px-6 py-2 text-sm font-medium rounded-[var(--radius-control)] transition-colors ${
                activeDay === 'sun'
                  ? 'bg-accent text-accent-ink font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Day 2: Sunday (15 Nov)
            </button>
          </div>
        </div>

        {/* Timeline Table */}
        <div className="max-w-3xl mx-auto space-y-4">
          {scheduleList.map((item) => (
            <Card
              key={item.time + item.title}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.tag === 'Deadline' ? 'border-accent' : ''
              }`}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-24 shrink-0 font-mono text-sm text-accent font-medium">
                  {item.time}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-base text-text">
                      {item.title}
                    </h3>
                    <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Logistics notes */}
        <div className="max-w-3xl mx-auto mt-12 grid sm:grid-cols-2 gap-4">
          <Card className="bg-surface-2 border-border-strong">
            <h4 className="font-display font-semibold text-text">Need Assistance?</h4>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Volunteers and tech mentors will be on-ground across all labs and active on Discord 24/7.
            </p>
          </Card>
          <Card className="bg-surface-2 border-border-strong">
            <h4 className="font-display font-semibold text-text">Hard Deadline</h4>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Submission portal locks precisely at 09:00 AM on Sunday. Plan your final push early.
            </p>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <Link to="/register">
            <Button variant="primary">Register Your Team</Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}

export default SchedulePage
