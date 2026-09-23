import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendBookingNotification } from '@/lib/email'

// A booking request is the studio's entire lead pipeline, so it gets TWO independent
// survival paths — the DB row AND the owner email. The request only fails if BOTH fail,
// and when both fail the full payload is logged so the lead is recoverable from logs.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, eventType, eventDate, package: pkg, message, photographerId } = body

    if (!name || !email || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking = { name, email, eventType, eventDate, package: pkg, message, photographerId }

    // Path 1 — persist. Do NOT return early on failure; the email is an independent path.
    let stored = false
    try {
      const supabase = await createServiceRoleClient()
      const { error } = await supabase.from('bookings').insert({
        name,
        email,
        event_type: eventType,
        event_date: eventDate || null,
        package: pkg || null,
        message: message || null,
        photographer_id: photographerId || null,
      })
      if (error) console.error('Booking insert error:', error)
      else stored = true
    } catch (dbError) {
      console.error('Booking insert threw:', dbError)
    }

    // Path 2 — notify. Independent of the insert above.
    let emailed = false
    try {
      emailed = await sendBookingNotification(booking)
    } catch (emailError) {
      console.error('Email notification error:', emailError)
    }

    // Lead survives if either path worked.
    if (stored || emailed) {
      return NextResponse.json({ success: true })
    }

    // Both failed — log the payload so nothing is lost, and tell the client to reach out directly.
    console.error('BOOKING LOST — both persistence and email failed:', JSON.stringify(booking))
    return NextResponse.json(
      { error: 'We could not submit your request. Please email us directly so we do not miss you.' },
      { status: 502 },
    )
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
