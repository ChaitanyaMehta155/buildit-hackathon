import Section from './Section'

const stats = [
  { value: '500+', label: 'Participants' },
  { value: '120', label: 'Teams' },
  { value: '36', label: 'Hours' },
  { value: '₹4L', label: 'Prize pool' },
]

function Stats() {
  return (
    <Section className="border-t border-border">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display font-semibold text-4xl md:text-5xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Stats
