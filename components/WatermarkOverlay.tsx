'use client'

export interface WatermarkConfig {
  watermarkText: string
  watermarkImageUrl: string
  watermarkStyle: 'angled-repeat' | 'horizontal-repeat' | 'center-once' | 'angled-once' | 'horizontal-once'
  watermarkOpacity: number
}

export const DEFAULT_WATERMARK: WatermarkConfig = {
  watermarkText: 'DIGITAL OFFICIAL STUDIO',
  watermarkImageUrl: '',
  watermarkStyle: 'angled-repeat',
  watermarkOpacity: 20,
}

interface Props {
  config?: WatermarkConfig
  size?: 'sm' | 'lg'
}

export default function WatermarkOverlay({ config = DEFAULT_WATERMARK, size = 'sm' }: Props) {
  const { watermarkText, watermarkImageUrl, watermarkStyle, watermarkOpacity } = config
  const opacity = watermarkOpacity / 100

  if (!watermarkText && !watermarkImageUrl) return null

  const isRepeat = watermarkStyle.includes('repeat')
  const isAngled = watermarkStyle.includes('angled') || watermarkStyle === 'angled-repeat'
  const rotation = isAngled ? -30 : 0

  if (isRepeat) {
    const count = size === 'lg' ? 40 : 20
    const gap = size === 'lg' ? 'gap-16' : 'gap-12'
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div
          className={`absolute inset-[-50%] flex flex-wrap items-center justify-center ${gap}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <WatermarkUnit
              key={i}
              text={watermarkText}
              imageUrl={watermarkImageUrl}
              opacity={opacity}
              large={size === 'lg'}
            />
          ))}
        </div>
      </div>
    )
  }

  // Single watermark
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div style={{ transform: `rotate(${rotation}deg)` }}>
        <WatermarkUnit
          text={watermarkText}
          imageUrl={watermarkImageUrl}
          opacity={opacity}
          large
        />
      </div>
    </div>
  )
}

function WatermarkUnit({
  text,
  imageUrl,
  opacity,
  large = false,
}: {
  text: string
  imageUrl: string
  opacity: number
  large?: boolean
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap" style={{ opacity }}>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className={large ? 'w-16 h-16' : 'w-8 h-8'}
          style={{ objectFit: 'contain', userSelect: 'none' }}
          draggable={false}
        />
      )}
      {text && (
        <span
          className={`text-white font-bold ${large ? 'text-2xl' : 'text-lg'}`}
          style={{ userSelect: 'none' }}
        >
          {text}
        </span>
      )}
    </div>
  )
}
