import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendBookingNotification } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, eventType, eventDate, package: pkg, message, photographerId } = body

    if (!name || !email || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    if (error) {
      console.error('Booking insert error:', error)
      return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 })
    }

    // Send email notification (don't fail the request if email fails)
    try {
      await sendBookingNotification({
        name,
        email,
        eventType,
        eventDate,
        package: pkg,
        message,
        photographerId,
      })
    } catch (emailError) {
      console.error('Email notification error:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
