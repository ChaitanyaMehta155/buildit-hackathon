import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'

const detailedTracks = [
  {
    id: 'ai-ml',
    title: 'AI & Machine Learning',
    badge: 'Track 01',
    description:
      'Build intelligent autonomous agents, multimodal systems, developer tools, or domain-specific assistive intelligence.',
    focusAreas: [
      'Autonomous agents & multi-agent workflows',
      'Local-first & edge AI models',
      'Intelligent developer tooling & code comprehension',
      'Computer vision and real-time inference',
    ],
    techStack: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Ollama', 'Transformers'],
  },
  {
    id: 'web3-infra',
    title: 'Web3 & Infrastructure',
    badge: 'Track 02',
    description:
      'Create scalable decentralized applications, developer infrastructure, zero-knowledge proofs, or peer-to-peer protocols.',
    focusAreas: [
      'Decentralized identity & reputation systems',
      'Developer tooling & smart contract testing',
      'High-throughput indexing & state channels',
      'Censorship-resistant data storage & networks',
    ],
    techStack: ['Solidity', 'Rust', 'TypeScript', 'Foundry', 'IPFS', 'GraphQL'],
  },
  {
    id: 'climate-sustainability',
    title: 'Climate & Sustainability',
    badge: 'Track 03',
    description:
      'Leverage software and data engineering to solve pressing environmental challenges, resource management, and clean energy optimization.',
    focusAreas: [
      'Real-time carbon accounting & supply chain audits',
      'Smart grid energy monitoring & load prediction',
      'Precision agriculture & ecological mapping',
      'Circular economy & e-waste tracking platforms',
    ],
    techStack: ['Python', 'GIS APIs', 'IoT / MQTT', 'React', 'TimescaleDB', 'Tailwind'],
  },
  {
    id: 'open-innovation',
    title: 'Open Innovation',
    badge: 'Track 04',
    description:
      'No boundaries. Build breakthrough utilities, accessibility tech, educational platforms, hardware hacks, or developer superpowers.',
    focusAreas: [
      'Accessibility & assistive technology for disabilities',
      'Next-gen interactive learning & EdTech',
      'High-performance desktop & CLI tools',
      'Novel hardware & software hybrid systems',
    ],
    techStack: ['WebSockets', 'Tauri', 'WebAssembly', 'Go', 'Next.js', 'PostgreSQL'],
  },
]

const criteria = [
  { name: 'Technical Depth', weight: '30%', desc: 'Complexity of architecture, code quality, and engineering rigor.' },
  { name: 'Practical Impact', weight: '30%', desc: 'Real-world usability and value delivered to the target audience.' },
  { name: 'Execution & Polish', weight: '25%', desc: 'Completeness of the prototype and seamless user experience.' },
  { name: 'Presentation & Demo', weight: '15%', desc: 'Clarity of the live walkthrough and question-answering during judging.' },
]

function TracksPage() {
  return (
    <div className="py-8">
      {/* Page Header */}
      <Section
        id="tracks-header"
        title="Hackathon Tracks"
        subtitle="Choose your problem domain. Teams can submit one project under any of the four tracks."
      >
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {detailedTracks.map((track) => (
            <Card key={track.id} className="flex flex-col justify-between hover:border-border-strong transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-xs uppercase px-2 py-1 rounded bg-surface-2 text-accent border border-border">
                    {track.badge}
                  </span>
                  <span className="font-mono text-xs text-text-muted">36-Hour Sprint</span>
                </div>

                <h3 className="font-display font-semibold text-2xl text-text">
                  {track.title}
                </h3>

                <p className="mt-3 text-text-muted text-sm leading-relaxed">
                  {track.description}
                </p>

                <div className="mt-6">
                  <p className="text-xs font-mono uppercase text-text-muted tracking-wider mb-2">
                    Key Focus Areas
                  </p>
                  <ul className="space-y-1.5">
                    {track.focusAreas.map((area) => (
                      <li key={area} className="text-sm text-text flex items-start gap-2">
                        <span className="text-accent font-mono">›</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-mono uppercase text-text-muted tracking-wider mb-2">
                  Suggested Tech
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {track.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-xs px-2 py-0.5 rounded bg-ink border border-border text-text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Evaluation Rubric */}
      <Section
        id="evaluation-criteria"
        title="Judging Criteria"
        subtitle="Every project will be evaluated across four standardized dimensions by our jury."
        className="border-t border-border"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {criteria.map((item) => (
            <Card key={item.name} className="text-center flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xl font-bold text-accent">{item.weight}</span>
                <h4 className="font-display font-semibold text-lg mt-2">{item.name}</h4>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button variant="primary">Register for a Track</Button>
          </Link>
          <Link to="/rules">
            <Button variant="secondary">View Submission Rules</Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}

export default TracksPage
