import { useEffect, useState } from 'react'
import { resetGarden } from '../lib/storage.js'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

// Minimal settings overlay, opened from the landing screen. Currently holds
// just one real setting-shaped thing: resetting the garden, previously only
// reachable via the console (window.__groveReset()) — promoted here behind
// an explicit two-step confirm since it's destructive and permanent.
export default function SettingsPanel({ open, onClose }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) return
    setConfirming(false)
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-6"
      onClick={onClose}
    >
      <div className={`w-full max-w-[380px] p-6 ${card}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-[#2f3a26]">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="cursor-pointer rounded-lg px-2 py-1 text-lg text-[#7a8a66] transition hover:bg-white/60 hover:text-[#38452e]"
          >
            ×
          </button>
        </div>

        <div className="rounded-xl border border-[#a4613f]/25 bg-[#a4613f]/5 p-4">
          <p className="text-[13px] font-medium text-[#38452e]">Reset garden</p>
          <p className="mt-1 text-xs text-[#7a8a66]">
            Permanently deletes every plant, wilted or grown. This can't be undone.
          </p>
          {confirming ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="cursor-pointer rounded-lg border border-[#5a6946]/30 px-3 py-1.5 text-xs font-medium text-[#5c6b4d] transition hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetGarden()
                  window.location.reload()
                }}
                className="cursor-pointer rounded-lg bg-[#a4613f] px-3 py-1.5 text-xs font-medium text-[#f7f2ea] transition hover:bg-[#8f5335]"
              >
                Yes, reset everything
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 cursor-pointer rounded-lg border border-[#a4613f]/40 px-3 py-1.5 text-xs font-medium text-[#a4613f] transition hover:bg-[#a4613f]/10"
            >
              Reset garden
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
