import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface BookingEmail {
  name: string
  email: string
  eventType: string
  eventDate?: string
  package?: string
  message?: string
  photographerId?: string
}

// Escape client-supplied values before dropping them into the notification HTML,
// so a `<`/`&` in a name or message can't break the email markup.
function esc(v: string | undefined): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Returns true only if the notification was actually accepted for delivery, so the
// caller can treat it as a real second survival path rather than fire-and-forget.
export async function sendBookingNotification(booking: BookingEmail): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.NOTIFICATION_EMAIL) {
    console.error('sendBookingNotification: SMTP_HOST or NOTIFICATION_EMAIL not configured')
    return false
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFICATION_EMAIL,
      replyTo: booking.email,
      subject: `New Booking Request - ${esc(booking.name)}`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7eb8d4;">New Booking Request</h2>
        <p><strong>Name:</strong> ${esc(booking.name)}</p>
        <p><strong>Email:</strong> ${esc(booking.email)}</p>
        <p><strong>Event Type:</strong> ${esc(booking.eventType)}</p>
        ${booking.eventDate ? `<p><strong>Event Date:</strong> ${esc(booking.eventDate)}</p>` : ''}
        ${booking.package ? `<p><strong>Package:</strong> ${esc(booking.package)}</p>` : ''}
        ${booking.message ? `<p><strong>Message:</strong> ${esc(booking.message)}</p>` : ''}
        <hr style="border-color: #1c2433;" />
        <p style="color: #6b7a8d; font-size: 12px;">Digital Official Studio - Booking System</p>
      </div>
    `,
    })
    return true
  } catch (err) {
    console.error('sendBookingNotification failed:', err)
    return false
  }
}
