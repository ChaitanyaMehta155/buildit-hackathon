import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'

const ruleSections = [
  {
    id: 'eligibility',
    title: '1. Eligibility & Verification',
    items: [
      'Open to all currently enrolled undergraduate, postgraduate, and diploma students from any recognized university or college.',
      'All team members must carry and present a valid student identity card during physical check-in at VIT Bhopal.',
      'Participation in BuildIt 2026 is 100% free of charge. No registration fees or hidden costs.',
    ],
  },
  {
    id: 'teams',
    title: '2. Team Formation & Composition',
    items: [
      'Teams must consist of a minimum of 2 and a maximum of 4 members.',
      'Inter-college and inter-disciplinary teams are fully permitted and encouraged.',
      'A participant may belong to only one team. Registering across multiple teams will result in disqualification.',
      'Solo applicants may register and will be assisted in team formation during the pre-event networking mixer.',
    ],
  },
  {
    id: 'development',
    title: '3. Development & Originality',
    items: [
      'All project code must be developed from scratch during the designated 36-hour hackathon window.',
      'The use of open-source libraries, publicly available frameworks, pre-trained AI models, and APIs is permitted and encouraged.',
      'Pre-built applications, prior commercial products, or projects submitted to previous hackathons are strictly prohibited.',
      'All source code must be maintained on a public GitHub repository with a verifiable, regular commit history during the event.',
    ],
  },
  {
    id: 'submissions',
    title: '4. Submission Standards',
    items: [
      'The final submission must include: (1) Public GitHub repo link, (2) Brief project summary in README, (3) 2-minute demo video or functional prototype link.',
      'Submissions close strictly at 09:00 AM on Sunday, 15 November 2026. Late submissions cannot be accepted under any circumstances.',
      'The project must fall under one of the four specified hackathon tracks chosen at registration.',
    ],
  },
  {
    id: 'judging',
    title: '5. Judging & Evaluation',
    items: [
      'Round 1: Screening evaluation of all submissions based on code quality, technical depth, and working demo.',
      'Round 2 (Grand Finale): Top 10 finalist teams will deliver a 5-minute live demo on the main stage followed by a 3-minute Q&A with the jury.',
      'The decisions of the judging panel and organizers are final and binding.',
    ],
  },
  {
    id: 'conduct',
    title: '6. Code of Conduct & Anti-Harassment',
    items: [
      'BuildIt is dedicated to providing a safe, inclusive, and welcoming experience for everyone regardless of gender, identity, disability, or background.',
      'Harassment, offensive behavior, discrimination, or disrespectful conduct of any kind will result in immediate expulsion from the venue and disqualification.',
      'Plagiarism or deliberate misrepresentation of intellectual property will lead to permanent blacklisting from future editions.',
    ],
  },
]

function RulesPage() {
  return (
    <div className="py-8">
      <Section
        id="rules-header"
        title="Rules & Guidelines"
        subtitle="Please read these official guidelines carefully to ensure fair play, safety, and a smooth hackathon experience."
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {ruleSections.map((section) => (
            <Card key={section.id}>
              <h3 className="font-display font-semibold text-xl text-text mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item, index) => (
                  <li key={index} className="text-sm text-text-muted flex items-start gap-3">
                    <span className="text-accent font-mono text-sm shrink-0">›</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button variant="primary">Agree & Register Team</Button>
          </Link>
          <Link to="/tracks">
            <Button variant="secondary">Explore Tracks</Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}

export default RulesPage
