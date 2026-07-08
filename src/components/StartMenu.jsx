import StartGlobe from './StartGlobe.jsx'
import { TIERS, formatTotalMinutes } from '../constants.js'

// Landing screen: the showcase planet fills the whole view with the title
// block floating in the sky above it. "Enter the garden" fades the text,
// flies the camera down onto the planet like a landing approach, then the
// whole menu fades into the real garden once it's ready.
export default function StartMenu({ plants, entering, fadeOut, onEnter, onFlightDone, onGone }) {
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
    </div>
  )
}
