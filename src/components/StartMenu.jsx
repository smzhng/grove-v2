import { useState } from 'react'
import StartGlobe from './StartGlobe.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import WorldSelectPanel from './WorldSelectPanel.jsx'
import { TIERS, formatTotalMinutes } from '../constants.js'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

function IconButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`pointer-events-auto grid h-10 w-10 cursor-pointer place-items-center text-[#5c6b4d] transition hover:text-[#38452e] ${card}`}
    >
      {children}
    </button>
  )
}

function WorldsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Landing screen: the showcase planet fills the whole view with the title
// block floating in the sky above it. "Enter the garden" fades the text,
// flies the camera down onto the planet like a landing approach, then the
// whole menu fades into the real garden once it's ready. "Worlds" opens a
// secondary panel previewing the other (locked, unbuilt) worlds — browsing,
// not the default flow, since Forest is the only one that actually exists.
export default function StartMenu({ plants, entering, fadeOut, onEnter, onFlightDone, onGone }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [worldsOpen, setWorldsOpen] = useState(false)
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
        <div className="pointer-events-auto absolute top-5 right-5 z-10 flex gap-2">
          <IconButton label="Worlds" onClick={() => setWorldsOpen(true)}>
            <WorldsIcon />
          </IconButton>
          <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </div>
      )}

      <div
        className={`pointer-events-none relative z-10 flex flex-col items-center pt-[13vh] text-center transition-opacity duration-500 ${
          entering ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <h1 className="font-heading text-[84px] leading-none tracking-[0.5px] text-[#38452e]">
          Grove
        </h1>
        <p className="mt-4 text-[17px] text-[#5c6b4d]">
          {completed.length > 0
            ? `${completed.length} plant${completed.length === 1 ? '' : 's'} · ${formatTotalMinutes(minutes)} of focus grown`
            : 'Grow your focus into a garden.'}
        </p>
        <button
          onClick={onEnter}
          disabled={entering}
          className="pointer-events-auto mt-9 cursor-pointer rounded-2xl bg-[#4a6b3f] px-10 py-4 text-[17px] font-semibold text-[#f7f5ea] shadow-[0_3px_10px_rgba(58,84,48,0.35)] transition hover:-translate-y-0.5 hover:bg-[#557a49] active:translate-y-0 disabled:cursor-default disabled:translate-y-0"
        >
          Enter the garden
        </button>
      </div>

      <WorldSelectPanel
        open={worldsOpen}
        onClose={() => setWorldsOpen(false)}
        onEnterForest={() => {
          setWorldsOpen(false)
          onEnter()
        }}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
