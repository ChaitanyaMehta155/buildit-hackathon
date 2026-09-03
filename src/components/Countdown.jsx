import { useState, useEffect } from 'react'
import Section from './Section'

// The hackathon's start date/time. Changing the whole countdown just means
// changing this one line. "+05:30" is India's timezone offset, so the
// countdown is correct no matter what timezone the visitor's browser is in.
const TARGET_DATE = new Date('2026-11-14T09:00:00+05:30')

// Given the target date, work out how many whole days/hours/minutes/seconds
// remain until it. This is plain JavaScript math - no library needed.
function getTimeRemaining() {
  const total = TARGET_DATE.getTime() - new Date().getTime()

  // If the date has already passed, don't show negative numbers.
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

function Countdown() {
  // "timeLeft" is state: a value React remembers and re-renders the
  // component whenever it changes. We start it off with today's real value.
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining)

  // useEffect runs this code once, when the component first appears on
  // screen ("mounts"). setInterval schedules a function to run every 1000ms
  // (1 second) - each time it runs, we recalculate the remaining time and
  // update state, which makes React re-render the numbers on screen.
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(getTimeRemaining())
    }, 1000)

    // The "cleanup function" - React runs this if the component is ever
    // removed from the page. Without this, the timer would keep running
    // forever in the background even after the component is gone, wasting
    // memory and battery. This is a very common React pattern.
    return () => clearInterval(intervalId)
  }, [])

  // Each unit (days/hours/minutes/seconds) rendered the same way, so we
  // loop over an array instead of writing four nearly-identical blocks.
  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <Section id="countdown" title="Time until kickoff">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="bg-surface border border-border rounded-[var(--radius-panel)] py-6 text-center"
          >
            {/* String(value).padStart(2, '0') turns "5" into "05" so the
                numbers don't visually jump width as they change. */}
            <p className="font-mono text-4xl font-medium text-accent" aria-hidden="true">
              {String(unit.value).padStart(2, '0')}
            </p>
            <p className="mt-1 text-sm text-text-muted">{unit.label}</p>
          </div>
        ))}
      </div>
      {/* A visually-hidden live region: screen readers will announce this
          text when it changes, without us needing to visually duplicate it. */}
      <p className="sr-only" role="status">
        {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes}{' '}
        minutes and {timeLeft.seconds} seconds until BuildIt starts.
      </p>
    </Section>
  )
}

export default Countdown
