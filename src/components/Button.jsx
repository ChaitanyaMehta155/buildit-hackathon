// A reusable Button component.
// Instead of writing button styles over and over on every page, we define
// them once here. "variant" lets us reuse this one component for the
// different button styles our design system defines (primary, secondary, ghost).
function Button({ variant = 'primary', children, className = '', ...props }) {
  // Shared styles every button gets, regardless of variant.
  const base =
    'inline-flex items-center justify-center rounded-[var(--radius-control)] px-5 py-2.5 font-sans font-medium text-sm transition-colors duration-150'

  // Styles specific to each variant.
  const variants = {
    // Filled button: solid accent background, used for the single most
    // important action on a page (e.g. "Register your team").
    primary:
      'bg-accent text-accent-ink hover:bg-accent-strong',
    // Outlined button: for secondary actions alongside a primary one.
    secondary:
      'border border-border-strong text-text hover:border-accent hover:text-accent',
    // Ghost button: text-only, for the least important actions.
    ghost:
      'text-text-muted hover:text-text',
  }

  // "className" is pulled out separately above (instead of living inside
  // ...props) specifically so we can append it here rather than let it
  // silently overwrite the button's own styling.
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
