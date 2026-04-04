const testimonials = [
  {
    quote: "Digital Official Studio captured our daughter's Sweet 16 beautifully. Every photo feels like it belongs in a magazine. We couldn't be happier with the results.",
    name: "Maria Santos",
    event: "Sweet 16",
  },
  {
    quote: "The cinematic film they created for our Quinceañera was absolutely breathtaking. They captured every moment with such artistry and care.",
    name: "Sofia Rodriguez",
    event: "Quinceañera",
  },
  {
    quote: "From start to finish, the experience was professional and seamless. The photos exceeded our expectations and the private gallery made sharing so easy.",
    name: "Jessica Alvarez",
    event: "Birthday Celebration",
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-icy text-sm tracking-[0.2em] uppercase mb-4">Testimonials</p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-text">What Our Clients Say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card rounded-xl p-8">
              <svg className="w-8 h-8 text-icy/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-silver leading-relaxed mb-6">{t.quote}</p>
              <div>
                <p className="text-text font-medium">{t.name}</p>
                <p className="text-muted text-sm">{t.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
