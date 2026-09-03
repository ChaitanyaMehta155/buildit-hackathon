import Section from './Section'

// Placeholder sponsor names - swap these for real logos once sponsors are
// confirmed. Using plain text for now instead of fake logo images, since
// inventing fake company logos would be misleading.
const sponsors = ['Sponsor One', 'Sponsor Two', 'Sponsor Three', 'Sponsor Four']

function Sponsors() {
  return (
    <Section id="sponsors" title="Sponsors">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {sponsors.map((name) => (
          <div
            key={name}
            className="border border-border rounded-[var(--radius-panel)] py-8 text-center text-text-muted text-sm"
          >
            {name}
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Sponsors
