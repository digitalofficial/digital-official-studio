import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import PortfolioPreview from '@/components/PortfolioPreview'
import Services from '@/components/Services'
import Testimonials from '@/components/Testimonials'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServiceRoleClient()
  const { data: photos } = await supabase
    .from('media_files')
    .select('id, file_url, caption')
    .eq('is_portfolio', true)
    .eq('file_type', 'photo')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="pb-16 md:pb-0">
      <Navbar />
      <Hero />
      <About />
      <PortfolioPreview photos={photos || []} />
      <Services />
      <Testimonials />
      <ContactForm />
      <Footer />
    </div>
  )
}
