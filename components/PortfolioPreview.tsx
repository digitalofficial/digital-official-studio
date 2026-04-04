import Image from 'next/image'
import Link from 'next/link'

interface Photo {
  id: string
  file_url: string
  caption: string | null
}

export default function PortfolioPreview({ photos }: { photos: Photo[] }) {
  return (
    <section className="py-24 bg-navy">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-icy text-sm tracking-[0.2em] uppercase mb-4">Our Work</p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-text">Featured Portfolio</h2>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
                <Image
                  src={photo.file_url}
                  alt={photo.caption || 'Portfolio photo'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted">Portfolio coming soon.</p>
          </div>
        )}
        <div className="text-center mt-12">
          <Link href="/portfolio" className="btn-secondary">View Full Portfolio</Link>
        </div>
      </div>
    </section>
  )
}
