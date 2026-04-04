'use client'

import { useState } from 'react'
import MasonryGrid from '@/components/MasonryGrid'

interface PortfolioItem {
  id: string
  file_url: string
  file_type: 'photo' | 'video'
  caption: string | null
  category: string
}

const tabs = ['All', 'Sweet 16', 'Quinceañera', 'Parties']

export default function PortfolioContent({ items }: { items: PortfolioItem[] }) {
  const [activeTab, setActiveTab] = useState('All')

  const filtered = activeTab === 'All'
    ? items
    : items.filter((item) => item.category === activeTab)

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm transition-all ${
              activeTab === tab
                ? 'bg-icy text-navy font-semibold'
                : 'bg-card text-silver hover:bg-card-hover'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {filtered.length > 0 ? (
        <MasonryGrid items={filtered} />
      ) : (
        <div className="text-center py-16">
          <p className="text-muted">No items in this category yet.</p>
        </div>
      )}
    </>
  )
}
