import { Link } from 'react-router-dom'
import Button from './Button'

function Hero() {
  return (
    <section
      id="hero"
      className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 scroll-mt-20"
    >
      <p className="font-mono text-sm text-accent">14-15 Nov 2026, VIT Bhopal</p>
      <h1 className="mt-4 font-display font-semibold text-5xl md:text-7xl leading-tight max-w-3xl">
        Ship something real in 36 hours.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-text-muted">
        BuildIt is VIT Bhopal's hackathon for students who'd rather build
        than just talk about building.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link to="/register">
          <Button variant="primary">Register your team</Button>
        </Link>
        <Link to="/rules">
          <Button variant="secondary">Read the rules</Button>
        </Link>
      </div>
    </section>
  )
}

export default Hero
