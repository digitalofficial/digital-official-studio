'use client'

import { useState, useEffect, type FormEvent } from 'react'

interface Photographer {
  id: string
  display_name: string | null
}

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [photographers, setPhotographers] = useState<Photographer[]>([])

  useEffect(() => {
    fetch('/api/photographers')
      .then(res => res.ok ? res.json() : [])
      .then(setPhotographers)
      .catch(() => {})
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      eventType: (form.elements.namedItem('eventType') as HTMLSelectElement).value,
      eventDate: (form.elements.namedItem('eventDate') as HTMLInputElement).value,
      package: (form.elements.namedItem('package') as HTMLSelectElement).value,
      photographerId: (form.elements.namedItem('photographerId') as HTMLSelectElement)?.value || '',
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to submit')

      setStatus('success')
      setMessage('Thank you! We\'ll be in touch soon.')
      form.reset()
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  const inputClass = "w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-icy/50 focus:ring-1 focus:ring-icy/50 transition-colors"
  const labelClass = "block text-sm text-silver mb-2"

  return (
    <section id="contact" className="py-24 bg-navy">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-icy text-sm tracking-[0.2em] uppercase mb-4">Get In Touch</p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-text">Book Your Event</h2>
          <p className="text-silver mt-4">Ready to create something beautiful? Fill out the form below and we&apos;ll get back to you within 24 hours.</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className={labelClass}>Full Name *</label>
              <input id="name" name="name" type="text" required className={inputClass} placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email *</label>
              <input id="email" name="email" type="email" required className={inputClass} placeholder="your@email.com" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="eventType" className={labelClass}>Event Type *</label>
              <select id="eventType" name="eventType" required className={inputClass}>
                <option value="">Select event type</option>
                <option>Sweet 16</option>
                <option>Quinceañera</option>
                <option>Birthday Party</option>
                <option>Corporate Event</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="eventDate" className={labelClass}>Event Date</label>
              <input id="eventDate" name="eventDate" type="date" className={inputClass} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="package" className={labelClass}>Preferred Package</label>
              <select id="package" name="package" className={inputClass}>
                <option value="">Select a package</option>
                <option>Photo Coverage - $499</option>
                <option>Cinematic Film - $799</option>
                <option>Full Experience - $1,199</option>
              </select>
            </div>
            <div>
              <label htmlFor="photographerId" className={labelClass}>Preferred Photographer</label>
              <select id="photographerId" name="photographerId" className={inputClass}>
                <option value="">Any available photographer</option>
                {photographers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || 'Photographer'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="message" className={labelClass}>Message</label>
            <textarea id="message" name="message" rows={4} className={inputClass} placeholder="Tell us about your event..." />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : 'Send Booking Request'}
          </button>
          {status === 'success' && <p className="text-center text-green-400">{message}</p>}
          {status === 'error' && <p className="text-center text-red-400">{message}</p>}
        </form>
      </div>
    </section>
  )
}
