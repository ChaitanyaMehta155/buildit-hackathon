import Section from './Section'
import Card from './Card'

const tracks = [
  {
    name: 'AI and machine learning',
    description: 'Models, agents, and tools that make software smarter.',
  },
  {
    name: 'Web3 and infrastructure',
    description: 'Decentralized systems, tooling, and developer platforms.',
  },
  {
    name: 'Climate and sustainability',
    description: 'Software addressing real environmental problems.',
  },
  {
    name: 'Open innovation',
    description: "Anything else you're excited to build.",
  },
]

function Tracks() {
  return (
    <Section
      id="tracks"
      title="Hackathon tracks"
      subtitle="Pick a track when you register. You can build anything within it."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {tracks.map((track) => (
          <Card key={track.name}>
            <h3 className="font-display font-semibold text-lg">
              {track.name}
            </h3>
            <p className="mt-2 text-text-muted text-sm">
              {track.description}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export default Tracks
