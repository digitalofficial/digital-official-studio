import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createServiceRoleClient } from '@/lib/supabase/server'
import PortfolioContent from './PortfolioContent'

export const metadata = {
  title: 'Portfolio | Digital Official Studio',
  description: 'Browse our photography and videography portfolio.',
}

export default async function PortfolioPage() {
  const supabase = await createServiceRoleClient()

  const { data: media } = await supabase
    .from('media_files')
    .select('id, file_url, file_type, caption, gallery_id, client_galleries!inner(category)')
    .eq('is_portfolio', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const items = (media || []).map((m: any) => ({
    id: m.id,
    file_url: m.file_url,
    file_type: m.file_type,
    caption: m.caption,
    category: m.client_galleries?.category || 'Other',
  }))

  return (
    <div className="pb-16 md:pb-0">
      <Navbar />
      <main className="pt-0 md:pt-16 min-h-screen bg-navy">
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-icy text-sm tracking-[0.2em] uppercase mb-4">Our Work</p>
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-text">Portfolio</h1>
              <p className="text-silver mt-4 max-w-xl mx-auto">A curated selection of our finest moments, captured with cinematic artistry.</p>
            </div>
            <PortfolioContent items={items} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
