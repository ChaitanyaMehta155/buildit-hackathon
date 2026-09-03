import { useState } from 'react'
import Section from './Section'

const faqs = [
  {
    question: 'Who can participate?',
    answer:
      'Any student currently enrolled at a college or university, individually or in teams of up to four.',
  },
  {
    question: 'Is there a registration fee?',
    answer: 'No, participation is completely free.',
  },
  {
    question: 'Do I need a team before registering?',
    answer:
      "No. You can register solo and we'll help you find teammates at the opening ceremony.",
  },
  {
    question: 'What should I bring?',
    answer:
      'Your laptop, charger, and a valid college ID. We provide food and a place to sleep if you need to rest.',
  },
]

function FAQ() {
  // "openIndex" stores which single FAQ item is currently expanded (its
  // position in the list), or null if none are open. Storing just the
  // index (instead of one true/false value per question) means only one
  // answer can be open at a time, and adding more questions later needs
  // no extra state.
  const [openIndex, setOpenIndex] = useState(null)

  function toggle(index) {
    // Clicking an already-open question closes it; otherwise open it.
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <Section id="faq" title="Frequently asked questions">
      <div className="max-w-2xl mx-auto divide-y divide-border border-t border-b border-border">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium">{faq.question}</span>
                {/* The plus rotates into a cross when open - a small,
                    purposeful animation that shows state, not decoration. */}
                <span
                  className={`shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p
                  id={`faq-answer-${index}`}
                  className="pb-5 text-text-muted text-sm"
                >
                  {faq.answer}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default FAQ
