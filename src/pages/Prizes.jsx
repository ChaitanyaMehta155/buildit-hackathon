import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'

const podiumPrizes = [
  {
    place: '1st Place',
    title: 'Overall Champion',
    amount: '₹2,00,000',
    highlight: true,
    perks: [
      'Cash prize of ₹2,00,000',
      'BuildIt Winner Trophy & Medals',
      '$5,000 Cloud Infrastructure Credits',
      'Direct interview fast-track with partner companies',
      'Exclusive Champion Swag Pack',
    ],
  },
  {
    place: '2nd Place',
    title: 'First Runner-Up',
    amount: '₹1,00,000',
    highlight: false,
    perks: [
      'Cash prize of ₹1,00,000',
      'Runner-Up Trophy & Medals',
      '$2,500 Cloud Infrastructure Credits',
      'Mentorship sessions with venture architects',
      'Premium Swag Pack',
    ],
  },
  {
    place: '3rd Place',
    title: 'Second Runner-Up',
    amount: '₹50,000',
    highlight: false,
    perks: [
      'Cash prize of ₹50,000',
      'Second Runner-Up Trophy',
      '$1,000 Cloud Credits',
      'Developer tool subscriptions',
      'BuildIt Swag Pack',
    ],
  },
]

const trackPrizes = [
  { track: 'Best AI / ML Project', amount: '₹12,500', desc: 'Awarded for exceptional depth in models, agents, or LLM tooling.' },
  { track: 'Best Web3 & Infra Hack', amount: '₹12,500', desc: 'Awarded to the top decentralized or developer tooling project.' },
  { track: 'Best Climate Impact Solution', amount: '₹12,500', desc: 'Awarded for actionable software addressing environmental challenges.' },
  { track: 'Best Freshman / Beginner Team', amount: '₹12,500', desc: 'Awarded to the top team composed entirely of 1st-year students.' },
]

const hackerPerks = [
  { title: 'Verified Certificate', desc: 'Official certificate of participation recognized by VIT Bhopal.' },
  { title: 'Full Catering & Drinks', desc: 'Meals, midnight snacks, and endless coffee for 36 hours.' },
  { title: 'Exclusive Hacker Swag', desc: 'Limited-edition T-shirts, stickers, notebooks, and badges.' },
  { title: 'Direct Mentor Access', desc: '1-on-1 guidance from seasoned industry engineers and founders.' },
]

function PrizesPage() {
  return (
    <div className="py-8">
      {/* Page Header & Podium */}
      <Section
        id="prizes-header"
        title="Prizes & Recognition"
        subtitle="A total prize pool of ₹4,00,000 cash, plus cloud credits, trophies, and career opportunities."
      >
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {podiumPrizes.map((prize) => (
            <Card
              key={prize.place}
              className={`flex flex-col justify-between ${
                prize.highlight
                  ? 'border-2 border-accent bg-surface md:-translate-y-2'
                  : 'bg-surface'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-surface-2 text-accent border border-border">
                    {prize.place}
                  </span>
                  {prize.highlight && (
                    <span className="text-xs font-mono text-accent font-semibold uppercase">
                      Top Prize
                    </span>
                  )}
                </div>

                <h3 className="font-display font-semibold text-xl text-text mt-3">
                  {prize.title}
                </h3>

                <p className="font-display font-bold text-3xl md:text-4xl text-accent mt-3">
                  {prize.amount}
                </p>

                <ul className="mt-6 space-y-2.5">
                  {prize.perks.map((perk) => (
                    <li key={perk} className="text-sm text-text-muted flex items-start gap-2">
                      <span className="text-accent font-mono">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Track Awards */}
      <Section
        id="track-awards"
        title="Category & Special Awards"
        subtitle="Special cash bounties for excellence within specific tracks and student categories."
        className="border-t border-border"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {trackPrizes.map((item) => (
            <Card key={item.track} className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-display font-semibold text-lg text-text">
                    {item.track}
                  </h4>
                  <span className="font-mono text-lg font-bold text-accent shrink-0">
                    {item.amount}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-muted">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Participant Perks */}
      <Section
        id="perks"
        title="Perks for Every Hacker"
        subtitle="Regardless of podium standing, every participant receives high-value experience and perks."
        className="border-t border-border"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hackerPerks.map((perk) => (
            <Card key={perk.title} className="text-center">
              <h4 className="font-display font-semibold text-base">{perk.title}</h4>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">{perk.desc}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/register">
            <Button variant="primary">Register to Compete</Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}

export default PrizesPage
