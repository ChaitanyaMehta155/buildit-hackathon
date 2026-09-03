import Section from './Section'
import Card from './Card'

const prizes = [
  { place: 'First place', amount: '₹2,00,000' },
  { place: 'Second place', amount: '₹1,00,000' },
  { place: 'Third place', amount: '₹50,000' },
]

function Prizes() {
  return (
    <Section id="prizes" title="Prizes">
      <div className="grid sm:grid-cols-3 gap-4">
        {prizes.map((prize, index) => (
          <Card
            key={prize.place}
            // The winning card gets a visible accent border - the *only*
            // place in the whole site we use a 2px border, so it reads as
            // deliberate emphasis rather than a repeated visual habit.
            className={
              index === 0 ? 'border-2 border-accent text-center' : 'text-center'
            }
          >
            <p className="text-text-muted text-sm">{prize.place}</p>
            <p className="mt-2 font-display font-semibold text-2xl">
              {prize.amount}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export default Prizes
