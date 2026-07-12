import { useEffect } from 'react'
import { TIERS } from '../constants.js'
import { plantCatalog, isPlantUnlocked, ANIMALS } from '../lib/library.js'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

// One catalog tile: an unlocked entry shows its name under a filled circle;
// a locked one shows a "?" silhouette and reveals the unlock condition on
// hover, Pokédex/Bestiary-style.
function CatalogEntry({ unlocked, label, hint, colorClass }) {
  return (
    <div className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-[#5a6946]/15 bg-white/50 p-3 text-center">
      <div
        className={`grid h-12 w-12 place-items-center rounded-full ${
          unlocked ? colorClass : 'bg-[#3a4230]/70'
        }`}
      >
        {!unlocked && <span className="text-lg font-bold text-[#f7f5ea]">?</span>}
      </div>
      <span className="text-[12px] font-medium text-[#38452e]">{unlocked ? label : '???'}</span>
      {!unlocked && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-max max-w-[160px] -translate-x-1/2 -translate-y-full rounded-lg bg-[#2f3a26] px-2.5 py-1.5 text-[11px] text-[#f7f5ea] opacity-0 shadow-lg transition group-hover:opacity-100">
          {hint}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-[#7a8a66] uppercase">
      {children}
    </p>
  )
}

export default function Library({ open, onClose, plants }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const catalog = plantCatalog()
  const unlockedCount = catalog.filter((e) => isPlantUnlocked(e.tier, e.variationIndex, plants)).length

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-6"
      onClick={onClose}
    >
      <div
        className={`max-h-[80vh] w-full max-w-[720px] overflow-y-auto p-6 ${card}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl text-[#2f3a26]">Garden Library</h2>
            <p className="mt-0.5 text-xs text-[#7a8a66]">
              {unlockedCount} of {catalog.length} plants discovered
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close library"
            className="cursor-pointer rounded-lg px-2 py-1 text-lg text-[#7a8a66] transition hover:bg-white/60 hover:text-[#38452e]"
          >
            ×
          </button>
        </div>

        <SectionLabel>Plants</SectionLabel>
        <div className="mb-6 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {catalog.map((entry) => (
            <CatalogEntry
              key={`${entry.tier}-${entry.variationIndex}`}
              unlocked={isPlantUnlocked(entry.tier, entry.variationIndex, plants)}
              label={entry.name}
              hint={`Finish growing a ${TIERS[entry.tier].label.toLowerCase()}`}
              colorClass="bg-[#7a8a66]"
            />
          ))}
        </div>

        <SectionLabel>Creatures</SectionLabel>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {ANIMALS.map((a) => (
            <CatalogEntry
              key={a.id}
              unlocked={a.isUnlocked(plants)}
              label={a.name}
              hint={a.hint}
              colorClass="bg-[#b5793f]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
