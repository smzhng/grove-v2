import StartGlobe from './StartGlobe.jsx'
import { TIERS, formatTotalMinutes } from '../constants.js'

// Landing screen: spinning showcase globe, wordmark, focus stat, and one
// button in. Shown on open unless a session is mid-run (silent auto-resume
// skips straight to the garden). While the real garden loads behind it, the
// button reads "Tending the garden…"; once ready, the whole menu fades out.
export default function StartMenu({ plants, entering, fadeOut, onEnter, onGone }) {
  const completed = plants.filter((p) => p.status === 'complete')
  const minutes = completed.reduce((sum, p) => sum + TIERS[p.tier].minutes, 0)

  return (
    <div
      onTransitionEnd={(e) => {
        if (fadeOut && e.target === e.currentTarget && e.propertyName === 'opacity') onGone()
      }}
      className={`absolute inset-0 z-20 overflow-hidden bg-[linear-gradient(180deg,#7fb2d9_0%,#abd0e9_55%,#e3f0f7_100%)] transition-opacity duration-700 ${
        fadeOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* planet dome rising from the bottom of the screen */}
      <div className="absolute inset-x-0 bottom-0 h-[58%]">
        <StartGlobe />
      </div>

      <div className="pointer-events-none relative z-10 flex flex-col items-center pt-[13vh] text-center">
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
          className="pointer-events-auto mt-9 cursor-pointer rounded-2xl bg-[#4a6b3f] px-10 py-4 text-[17px] font-semibold text-[#f7f5ea] shadow-[0_3px_10px_rgba(58,84,48,0.35)] transition hover:-translate-y-0.5 hover:bg-[#557a49] active:translate-y-0 disabled:cursor-default disabled:translate-y-0 disabled:opacity-80"
        >
          {entering ? 'Tending the garden…' : 'Enter the garden'}
        </button>
      </div>
    </div>
  )
}
