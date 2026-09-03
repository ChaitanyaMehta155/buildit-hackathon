// Section is a layout wrapper, not a visual "section" with its own opinions
// about color. It just handles the two things every section needs:
// 1. consistent horizontal padding + a max content width (so text doesn't
//    stretch edge-to-edge on a wide monitor)
// 2. an optional heading, styled the same way everywhere
//
// "id" lets the navbar link directly to this section (e.g. href="#tracks"),
// and "className" lets a specific section add its own background color
// without needing a new wrapper component.
function Section({ id, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={`px-6 py-20 md:py-28 scroll-mt-20 ${className}`}>
      <div className="max-w-5xl mx-auto">
        {title && (
          <div className="mb-12 text-center">
            <h2 className="font-display font-semibold text-3xl md:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3 text-text-muted max-w-xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export default Section
