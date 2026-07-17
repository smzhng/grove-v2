import { useEffect } from 'react'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

// The forest (this repo's original garden) is the only real, playable world
// today. The rest are hand-designed but unbuilt — shown as locked teasers,
// Pokédex-library-style, so the game reads as bigger than what's actually
// playable yet without pretending they're ready.
const WORLDS = [
  { id: 'forest', name: 'Forest', locked: false },
  {
    id: 'fishing-village',
    name: 'Fishing Village',
    locked: true,
    hint: 'Someone from the coast is waiting to meet you.',
  },
  {
    id: 'waterfall',
    name: 'The Waterfall',
    locked: true,
    hint: 'The sound of water calls from deep in the wild.',
  },
  {
    id: 'cave',
    name: 'The Cave',
    locked: true,
    hint: 'A hidden place, said to hold rare things.',
  },
  {
    id: 'woodlands',
    name: 'Abandoned Woodlands',
    locked: true,
    hint: 'Something forgotten still lingers here.',
  },
  {
    id: 'village',
    name: 'The Village',
    locked: true,
    hint: 'A bustling town somewhere beyond the treeline.',
  },
]

function WorldTile({ world, onEnter }) {
  const { locked } = world
  return (
    <button
      onClick={locked ? undefined : onEnter}
      disabled={locked}
      className={`group relative flex w-[108px] flex-col items-center gap-2 px-3 py-4 text-center transition ${card} ${
        locked ? 'cursor-default opacity-80' : 'cursor-pointer hover:-translate-y-1 hover:bg-white'
      }`}
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-full ${
          locked ? 'bg-[#3a4230]/70' : 'bg-[#7a8a66]'
        }`}
      >
        {locked && <span className="text-lg font-bold text-[#f7f5ea]">?</span>}
      </div>
      <span className={`text-[12px] font-medium ${locked ? 'text-[#5c6b4d]' : 'text-[#38452e]'}`}>
        {locked ? '???' : world.name}
      </span>
      {locked && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-max max-w-[170px] -translate-x-1/2 -translate-y-full rounded-lg bg-[#2f3a26] px-2.5 py-1.5 text-[11px] text-[#f7f5ea] opacity-0 shadow-lg transition group-hover:opacity-100">
          {world.hint}
        </div>
      )}
    </button>
  )
}

// Opened via the "Worlds" button on the landing screen — a secondary/browse
// screen, not the default view. Picking the one unlocked world (Forest) does
// the same thing "Enter the garden" does.
export default function WorldSelectPanel({ open, onClose, onEnterForest }) {
  useEffect(() => {
    if (!open) return
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
      <div className={`w-full max-w-[560px] p-6 ${card}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-[#2f3a26]">Worlds</h2>
          <button
            onClick={onClose}
            aria-label="Close worlds"
            className="cursor-pointer rounded-lg px-2 py-1 text-lg text-[#7a8a66] transition hover:bg-white/60 hover:text-[#38452e]"
          >
            ×
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {WORLDS.map((world) => (
            <WorldTile
              key={world.id}
              world={world}
              onEnter={world.id === 'forest' ? onEnterForest : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
