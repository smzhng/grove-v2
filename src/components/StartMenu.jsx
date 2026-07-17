import { useState } from 'react'
import StartGlobe from './StartGlobe.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import { TIERS, formatTotalMinutes } from '../constants.js'

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

function SettingsButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Settings"
      aria-label="Settings"
      className={`pointer-events-auto grid h-10 w-10 cursor-pointer place-items-center text-[#5c6b4d] transition hover:text-[#38452e] ${card}`}
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

// Landing screen: the showcase planet fills the whole view with the title
// and world-select grid floating in the sky above it. Picking the one
// unlocked world (Forest) fades the text, flies the camera down onto the
// planet like a landing approach, then the whole menu fades into the real
// garden once it's ready.
export default function StartMenu({ plants, entering, fadeOut, onEnter, onFlightDone, onGone }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const completed = plants.filter((p) => p.status === 'complete')
  const minutes = completed.reduce((sum, p) => sum + TIERS[p.tier].minutes, 0)

  return (
    <div
      onTransitionEnd={(e) => {
        if (fadeOut && e.target === e.currentTarget && e.propertyName === 'opacity') onGone()
      }}
      className={`absolute inset-0 z-20 overflow-hidden bg-[linear-gradient(180deg,#7fb2d9_0%,#abd0e9_55%,#e3f0f7_100%)] transition-opacity duration-[1600ms] ${
        fadeOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* the planet fills the whole menu; its dome sits in the lower half */}
      <div className="absolute inset-0">
        <StartGlobe flying={entering} onFlightDone={onFlightDone} />
      </div>

      {!entering && (
        <div className="absolute top-5 right-5 z-10">
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </div>
      )}

      <div
        className={`relative z-10 flex flex-col items-center pt-[9vh] text-center transition-opacity duration-500 ${
          entering ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <h1 className="font-heading text-[68px] leading-none tracking-[0.5px] text-[#38452e]">
          Grove
        </h1>
        <p className="mt-3 text-[16px] text-[#5c6b4d]">
          {completed.length > 0
            ? `${completed.length} plant${completed.length === 1 ? '' : 's'} · ${formatTotalMinutes(minutes)} of focus grown`
            : 'Grow your focus into a garden.'}
        </p>

        <div className="pointer-events-auto mt-8 flex flex-wrap justify-center gap-3 px-6">
          {WORLDS.map((world) => (
            <WorldTile key={world.id} world={world} onEnter={onEnter} />
          ))}
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
