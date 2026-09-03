import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Button from '../components/Button'

function NotFoundPage() {
  return (
    <Section id="not-found" className="min-h-[70vh] flex items-center justify-center text-center">
      <div className="max-w-md mx-auto py-12">
        <p className="font-mono text-7xl md:text-8xl font-bold text-accent tracking-widest">
          404
        </p>

        <h1 className="mt-4 font-display font-semibold text-2xl md:text-3xl text-text">
          Route Not Found
        </h1>

        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          The page or schematic branch you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary">Return to Home</Button>
          </Link>
          <Link to="/tracks">
            <Button variant="secondary">Browse Tracks</Button>
          </Link>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex justify-center gap-6 text-xs font-mono text-text-muted">
          <Link to="/schedule" className="hover:text-accent transition-colors">Schedule</Link>
          <span>•</span>
          <Link to="/prizes" className="hover:text-accent transition-colors">Prizes</Link>
          <span>•</span>
          <Link to="/rules" className="hover:text-accent transition-colors">Rules</Link>
        </div>
      </div>
    </Section>
  )
}

export default NotFoundPage
