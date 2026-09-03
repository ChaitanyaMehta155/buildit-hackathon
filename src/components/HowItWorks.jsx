import Section from './Section'

const steps = [
  {
    step: 1,
    title: 'Register your team',
    description: 'Sign up with 2-4 members before 10 Nov.',
  },
  {
    step: 2,
    title: 'Pick a track and build',
    description: 'You get 36 hours starting Saturday morning.',
  },
  {
    step: 3,
    title: 'Submit your project',
    description: 'Push your code and a short demo video before the deadline.',
  },
  {
    step: 4,
    title: 'Present to judges',
    description: 'Top teams get a 5-minute slot to demo live.',
  },
]

function HowItWorks() {
  return (
    <Section id="how-it-works" title="How it works">
      <ol className="grid sm:grid-cols-2 gap-8">
        {steps.map((item) => (
          <li key={item.step} className="flex gap-4">
            <span className="font-mono text-accent text-lg shrink-0">
              {String(item.step).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-display font-semibold">{item.title}</h3>
              <p className="mt-1 text-text-muted text-sm">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export default HowItWorks
