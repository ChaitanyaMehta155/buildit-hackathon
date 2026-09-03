import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Button from './Button'
import AuthModal from './AuthModal'

// The primary navigation routes across the multi-page BuildIt site
const links = [
  { href: '/tracks', label: 'Tracks' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/prizes', label: 'Prizes' },
  { href: '/rules', label: 'Rules' },
  { href: '/dashboard', label: 'Dashboard' },
]

function Navbar() {
  // "isOpen" remembers whether the mobile menu is currently expanded.
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const { user, signOut } = useAuth()

  return (
    <>
      {/* Sticky positioning keeps the navbar pinned to the top of the viewport */}
      <header className="sticky top-0 z-50 border-b border-border bg-ink/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="font-display font-semibold text-lg hover:text-accent transition-colors duration-150"
          >
            BuildIt
          </Link>

          {/* Desktop links - hidden on small screens, shown from md breakpoint up */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm transition-colors duration-150 ${
                    isActive ? 'text-accent font-medium' : 'text-text-muted hover:text-text'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth & CTA actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-xs text-text-muted truncate max-w-[130px] border border-border rounded px-2 py-1 bg-surface"
                  title={user.email}
                >
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs font-mono text-text-muted hover:text-red-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setIsAuthOpen(true)}
                className="text-xs px-3.5 py-1.5"
              >
                Sign In
              </Button>
            )}

            <Link to="/register">
              <Button variant="primary" className="text-xs px-4 py-1.5">
                Register
              </Button>
            </Link>
          </div>

          {/* Hamburger button - only shown on small screens (hidden from md up) */}
          <button
            type="button"
            className="md:hidden text-text p-2 -mr-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {/* Hamburger / close icon drawn with plain SVG lines */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {isOpen ? (
                <path
                  d="M6 6L18 18M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7H20M4 12H20M4 17H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu panel - only rendered in the DOM when open */}
        {isOpen && (
          <nav
            className="md:hidden border-t border-border px-6 py-4 flex flex-col gap-4 bg-ink"
            aria-label="Mobile"
          >
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm transition-colors duration-150 ${
                    isActive ? 'text-accent font-medium' : 'text-text-muted hover:text-text'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-border flex flex-col gap-2">
              {user ? (
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="font-mono text-text-muted truncate max-w-[200px]">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="font-mono text-red-400 hover:text-red-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => {
                    setIsOpen(false)
                    setIsAuthOpen(true)
                  }}
                >
                  Sign In
                </Button>
              )}

              <Link to="/register" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full text-xs">
                  Register
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Auth Modal for Sign In / Sign Up */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}

export default Navbar
