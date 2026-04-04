export default function About() {
  return (
    <section className="py-24 bg-slate-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-icy text-sm tracking-[0.2em] uppercase mb-4">About Us</p>
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-text leading-snug mb-6">
              Capturing Life&apos;s Most Beautiful Moments
            </h2>
            <p className="text-silver leading-relaxed mb-4">
              At Digital Official Studio, we believe every celebration deserves to be remembered in its fullest beauty. We specialize in cinematic photography and videography for Sweet 16s, Quinceañeras, parties, and life&apos;s most cherished events.
            </p>
            <p className="text-silver leading-relaxed">
              Our approach blends editorial aesthetics with authentic storytelling — creating images that feel like scenes from a film. Every frame is carefully composed to capture the emotion, energy, and elegance of your special day.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-card to-slate-dark border border-white/5 overflow-hidden flex items-center justify-center">
              <div className="text-center px-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-icy/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-icy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
                <p className="text-muted text-sm">Studio Photo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
