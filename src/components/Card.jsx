// A reusable Card component.
// Note there's no box-shadow here, on purpose - our design system uses a
// 1px hairline border instead of a soft drop-shadow, and a small radius
// (--radius-panel) instead of the bouncy rounded corners common on most
// "SaaS" websites. This makes cards read like schematic panels.
function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-surface border border-border rounded-[var(--radius-panel)] p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
