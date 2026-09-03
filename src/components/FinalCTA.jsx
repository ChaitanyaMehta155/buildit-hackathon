import { Link } from 'react-router-dom'
import Button from './Button'

function FinalCTA() {
  return (
    <section className="border-t border-border px-6 py-24 text-center">
      <h2 className="font-display font-semibold text-3xl md:text-4xl max-w-lg mx-auto">
        Registrations close 10 November.
      </h2>
      <p className="mt-3 text-text-muted">
        Teams of up to four. No entry fee.
      </p>
      <div className="mt-8">
        <Link to="/register">
          <Button variant="primary">Register your team</Button>
        </Link>
      </div>
    </section>
  )
}

export default FinalCTA
