import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="font-display font-semibold hover:text-accent transition-colors duration-150">
          BuildIt
        </Link>
        <nav className="flex gap-6 flex-wrap" aria-label="Footer">
          <Link
            to="/tracks"
            className="text-sm text-text-muted hover:text-text transition-colors duration-150"
          >
            Tracks
          </Link>
          <Link
            to="/schedule"
            className="text-sm text-text-muted hover:text-text transition-colors duration-150"
          >
            Schedule
          </Link>
          <Link
            to="/prizes"
            className="text-sm text-text-muted hover:text-text transition-colors duration-150"
          >
            Prizes
          </Link>
          <Link
            to="/rules"
            className="text-sm text-text-muted hover:text-text transition-colors duration-150"
          >
            Rules
          </Link>
          <a
            href="mailto:hello@buildit.example"
            className="text-sm text-text-muted hover:text-text transition-colors duration-150"
          >
            Contact
          </a>
        </nav>
        <p className="text-sm text-text-muted">
          © 2026 BuildIt, VIT Bhopal
        </p>
      </div>
    </footer>
  )
}

export default Footer
