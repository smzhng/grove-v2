import { useEffect } from 'react'
import { TIERS, friendlyName, formatDuration } from '../constants.js'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

function formatDate(ts) {
  if (!ts) return 'Before the log started'
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// A record of what you've actually studied, not just how much has grown —
// every plant that isn't currently growing, newest first, with its intention
// text (if one was set) alongside the tier/duration/outcome. Plants are
// never deleted, so this is just a different view of the same persisted
// list Library.jsx and the garden itself already read from.
export default function HistoryPanel({ open, onClose, plants }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const entries = plants
    .filter((p) => p.status !== 'growing')
    .sort((a, b) => (b.plantedAt ?? 0) - (a.plantedAt ?? 0))

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-6"
      onClick={onClose}
    >
      <div
        className={`max-h-[80vh] w-full max-w-[560px] overflow-y-auto p-6 ${card}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-[#2f3a26]">Study Log</h2>
          <button
            onClick={onClose}
            aria-label="Close study log"
            className="cursor-pointer rounded-lg px-2 py-1 text-lg text-[#7a8a66] transition hover:bg-white/60 hover:text-[#38452e]"
          >
            ×
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-[13px] text-[#7a8a66]">
            Nothing logged yet — finish or wilt a session to start your log.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#5a6946]/15 bg-white/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#38452e]">
                    {p.intention || friendlyName(p.tier, p.variationIndex)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7a8a66]">
                    {formatDate(p.plantedAt)} · {formatDuration(TIERS[p.tier].minutes)}{' '}
                    {TIERS[p.tier].label.toLowerCase()}
                    {p.status === 'wilted' ? ' · wilted' : ''}
                  </p>
                </div>
                <span
                  title={p.status === 'complete' ? 'Completed' : 'Wilted'}
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    p.status === 'complete' ? 'bg-[#7a8a66]' : 'bg-[#a4613f]'
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
