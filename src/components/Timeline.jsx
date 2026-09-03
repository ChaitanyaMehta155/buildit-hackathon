import Section from './Section'

const schedule = [
  { time: 'Sat 09:00', event: 'Opening ceremony and track briefing' },
  { time: 'Sat 10:00', event: 'Hacking begins' },
  { time: 'Sat 20:00', event: 'Mentor check-in round' },
  { time: 'Sun 09:00', event: 'Submissions close' },
  { time: 'Sun 11:00', event: 'Judging and live demos' },
  { time: 'Sun 15:00', event: 'Winners announced' },
]

function Timeline() {
  return (
    <Section id="timeline" title="Timeline">
      <ol className="max-w-xl mx-auto">
        {schedule.map((item, index) => (
          <li
            key={item.time}
            className={`flex gap-6 py-4 ${
              index !== schedule.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <span className="font-mono text-sm text-accent w-24 shrink-0">
              {item.time}
            </span>
            <span className="text-text-muted">{item.event}</span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export default Timeline
