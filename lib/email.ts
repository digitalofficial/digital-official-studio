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

export async function sendBookingNotification(booking: BookingEmail) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Booking Request - ${booking.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7eb8d4;">New Booking Request</h2>
        <p><strong>Name:</strong> ${booking.name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Event Type:</strong> ${booking.eventType}</p>
        ${booking.eventDate ? `<p><strong>Event Date:</strong> ${booking.eventDate}</p>` : ''}
        ${booking.package ? `<p><strong>Package:</strong> ${booking.package}</p>` : ''}
        ${booking.message ? `<p><strong>Message:</strong> ${booking.message}</p>` : ''}
        <hr style="border-color: #1c2433;" />
        <p style="color: #6b7a8d; font-size: 12px;">Digital Official Studio - Booking System</p>
      </div>
    `,
  })
}
