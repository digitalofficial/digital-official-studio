import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Digital Official Studio — Photography & Videography'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0d1117 0%, #161d27 50%, #1c2433 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Camera icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 32 32"
          style={{ marginBottom: 32 }}
        >
          <rect width="32" height="32" rx="8" fill="rgba(126,184,212,0.15)" />
          <path
            d="M8.5 11.5a1.5 1.5 0 011.5-1.5h1.17a1.5 1.5 0 001.34-.83l.49-.98A1.5 1.5 0 0114.33 7h3.34a1.5 1.5 0 011.34.83l.49.98a1.5 1.5 0 001.34.83H22a1.5 1.5 0 011.5 1.5V22a1.5 1.5 0 01-1.5 1.5H10A1.5 1.5 0 018.5 22z"
            fill="none"
            stroke="#7eb8d4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="16"
            cy="16.5"
            r="3.5"
            fill="none"
            stroke="#7eb8d4"
            strokeWidth="1.5"
          />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#e8edf2',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          Digital Official Studio
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#7eb8d4',
            textAlign: 'center',
          }}
        >
          Every moment, beautifully captured.
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 2,
            background: 'linear-gradient(90deg, #7eb8d4, #5a9ab8)',
            borderRadius: 1,
            marginTop: 24,
            marginBottom: 24,
          }}
        />

        {/* Services */}
        <div
          style={{
            fontSize: 18,
            color: '#a8b8c8',
            textAlign: 'center',
          }}
        >
          Photography · Videography · Events
        </div>
      </div>
    ),
    { ...size }
  )
}
