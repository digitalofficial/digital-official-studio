import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-slate-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(126,184,212,0.08)_0%,transparent_70%)]" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-icy text-sm tracking-[0.3em] uppercase mb-6 animate-fade-up">Photography & Videography</p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-5xl md:text-7xl lg:text-8xl font-light text-text leading-tight animate-fade-up animate-delay-100">
          Digital Official<br />Studio
        </h1>
        <p className="text-silver text-lg md:text-xl mt-6 max-w-xl mx-auto animate-fade-up animate-delay-200">
          Every moment, beautifully captured.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up animate-delay-300">
          <Link href="/portfolio" className="btn-primary">View Portfolio</Link>
          <a href="#contact" className="btn-secondary">Book Your Event</a>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
