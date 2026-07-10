import { useEffect, useState } from 'react'
import {
  TIERS,
  TIER_ORDER,
  SPEED,
  formatDuration,
  formatRemaining,
  formatTotalMinutes,
  formatInvested,
  stageName,
  friendlyName,
} from '../constants.js'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

// Small plant silhouettes for the tier buttons, one per tier.
function TierIcon({ tier, className }) {
  const props = { viewBox: '0 0 32 32', fill: 'currentColor', className, 'aria-hidden': true }
  if (tier === 'sprout') {
    return (
      <svg {...props}>
        <path d="M16 28v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M15.5 22c-3.4-.2-5.5-2.3-5.7-5.6 3.4.2 5.5 2.3 5.7 5.6Z" />
        <path d="M16.5 19.5c3.4-.2 5.5-2.3 5.7-5.6-3.4.2-5.5 2.3-5.7 5.6Z" />
      </svg>
    )
  }
  if (tier === 'small') {
    return (
      <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 28c0-6-.5-9-2.5-13" />
        <path d="M16 28c0-5 2-9 5.5-12" />
        <path d="M16 28c-1-4-3.5-7-6.5-8.5" />
        <path d="M16 28c1.5-3 4.5-5 7-5.5" />
      </svg>
    )
  }
  if (tier === 'medium') {
    return (
      <svg {...props}>
        <circle cx="10.5" cy="23" r="5" />
        <circle cx="21.5" cy="23" r="5" />
        <circle cx="16" cy="18.5" r="6.5" />
      </svg>
    )
  }
  if (tier === 'large') {
    return (
      <svg {...props}>
        <path d="M16 5l7 10H9l7-10Z" />
        <path d="M16 11l8.5 12h-17L16 11Z" />
        <rect x="14.8" y="23" width="2.4" height="5" rx="0.5" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <rect x="14.8" y="17" width="2.4" height="11" rx="0.5" />
      <circle cx="16" cy="11.5" r="7" />
      <circle cx="9.5" cy="15.5" r="4.5" />
      <circle cx="22.5" cy="15.5" r="4.5" />
    </svg>
  )
}

function IdlePanel({ beginPlacement, plants }) {
  const [picked, setPicked] = useState('sprout')
  const tier = TIERS[picked]
  const grownCounts = TIER_ORDER.reduce((acc, key) => {
    acc[key] = plants.filter((p) => p.tier === key && p.status === 'complete').length
    return acc
  }, {})

  return (
    <div className={`pointer-events-auto w-full max-w-[620px] px-6 pt-5 pb-[18px] ${card}`}>
      <p className="mb-3 text-[11.5px] font-medium tracking-[0.14em] text-[#7a8a66] uppercase">
        Plant a session
      </p>
      <div className="mb-4 flex flex-wrap gap-2.5">
        {TIER_ORDER.map((key) => {
          const sel = picked === key
          const count = grownCounts[key]
          return (
            <button
              key={key}
              onClick={() => setPicked(key)}
              className={`relative flex flex-1 basis-[96px] cursor-pointer flex-col items-center gap-1 rounded-2xl border-[1.5px] px-2 py-3.5 text-[#38452e] transition ${
                sel
                  ? 'border-[#4a6b3f] bg-[#e4ecd6] shadow-[0_2px_8px_rgba(58,84,48,0.15)]'
                  : 'border-[#5a6946]/20 bg-white/55 hover:-translate-y-0.5 hover:bg-white/85'
              }`}
            >
              {count > 0 && (
                <span className="absolute top-1.5 right-1.5 rounded-full bg-[#4a6b3f]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[#f7f5ea]">
                  ×{count}
                </span>
              )}
              <TierIcon
                tier={key}
                className={`mb-0.5 h-8 w-8 ${sel ? 'text-[#4a6b3f]' : 'text-[#7a8a66]'}`}
              />
              <span className="text-[16px] font-bold">{formatDuration(TIERS[key].minutes)}</span>
              <span className="text-[11.5px] font-medium opacity-65">{TIERS[key].label}</span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[12.5px] leading-snug text-[#6c7a5a]">
          Stay the full {formatDuration(tier.minutes)} and a {tier.label.toLowerCase()} takes
          root. Leave early and it wilts.
        </p>
        <button
          onClick={() => beginPlacement(picked)}
          className="cursor-pointer rounded-xl bg-[#4a6b3f] px-[26px] py-3 text-[15px] font-semibold whitespace-nowrap text-[#f7f5ea] shadow-[0_3px_10px_rgba(58,84,48,0.35)] transition hover:-translate-y-0.5 hover:bg-[#557a49] active:translate-y-0"
        >
          Plant
        </button>
      </div>
    </div>
  )
}

const RING_R = 17
const RING_C = 2 * Math.PI * RING_R

// Progress ring around the countdown, with tick marks at 1/3 and 2/3 where
// the growth stage advances (Sprouting -> Growing -> Flourishing).
function ProgressRing({ progress }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
      <circle cx="23" cy="23" r={RING_R} fill="none" stroke="rgba(90,105,70,0.18)" strokeWidth="3" />
      <circle
        cx="23"
        cy="23"
        r={RING_R}
        fill="none"
        stroke="#4a6b3f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - progress)}
        transform="rotate(-90 23 23)"
        style={{ transition: 'stroke-dashoffset 400ms linear' }}
      />
      {[1 / 3, 2 / 3].map((f) => {
        const a = -Math.PI / 2 + f * Math.PI * 2
        return (
          <line
            key={f}
            x1={23 + Math.cos(a) * (RING_R - 3)}
            y1={23 + Math.sin(a) * (RING_R - 3)}
            x2={23 + Math.cos(a) * (RING_R + 3)}
            y2={23 + Math.sin(a) * (RING_R + 3)}
            stroke="#7a8a66"
            strokeWidth="1.6"
          />
        )
      })}
    </svg>
  )
}

function ActivePanel({ session, plant, cancelSession }) {
  const [now, setNow] = useState(Date.now())
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const elapsed = (now - session.startedAt) * SPEED
  const remaining = session.durationMs - elapsed
  const progress = Math.min(Math.max(elapsed / session.durationMs, 0), 1)
  const name = plant
    ? friendlyName(plant.tier, plant.variationIndex)
    : TIERS[session.tier].label.toLowerCase()

  // Countdown in the tab title, so it's visible while working in other tabs.
  useEffect(() => {
    document.title = `${formatRemaining(remaining)} · Grove`
    return () => {
      document.title = 'Grove'
    }
  }, [remaining])

  return (
    <div className={`pointer-events-auto flex items-center gap-3.5 py-3 pr-5 pl-3.5 ${card}`}>
      <ProgressRing progress={progress} />
      <div>
        <p className="font-heading text-2xl leading-none text-[#2f3a26] tabular-nums">
          {formatRemaining(remaining)}
        </p>
        <p className="mt-1 text-xs text-[#7a8a66]">
          {stageName(progress)} · {name}
        </p>
      </div>
      {confirming ? (
        <div className="ml-1.5 flex items-center gap-2">
          <span className="text-xs text-[#8a5a44]">
            {formatInvested(elapsed)} of growth will wilt.
          </span>
          <button
            onClick={() => setConfirming(false)}
            className="cursor-pointer rounded-lg border border-[#5a6946]/30 px-3 py-1.5 text-xs font-medium text-[#5c6b4d] transition hover:bg-white/60"
          >
            Keep going
          </button>
          <button
            onClick={cancelSession}
            className="cursor-pointer rounded-lg bg-[#a4613f] px-3 py-1.5 text-xs font-medium text-[#f7f2ea] transition hover:bg-[#8f5335]"
          >
            Let it wilt
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="ml-1.5 cursor-pointer rounded-lg border border-[#5a6946]/30 px-3 py-1.5 text-xs font-medium text-[#5c6b4d] transition hover:bg-white/60"
        >
          Give up
        </button>
      )}
    </div>
  )
}

// Instruction card while the ghost preview is active.
function PlacementPanel({ placing, cancelPlacement }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') cancelPlacement()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelPlacement])

  return (
    <div className={`pointer-events-auto flex items-center gap-4 px-6 py-3.5 ${card}`}>
      <div>
        <p className="text-[13.5px] font-medium text-[#38452e]">
          Choose a spot for your {friendlyName(placing.tier, placing.variationIndex)}
        </p>
        <p className="mt-0.5 text-xs text-[#7a8a66]">
          Click the ground to plant it · drag to look around
        </p>
      </div>
      <button
        onClick={cancelPlacement}
        className="cursor-pointer rounded-lg border border-[#5a6946]/30 px-3 py-1.5 text-xs font-medium text-[#5c6b4d] transition hover:bg-white/60"
      >
        Cancel
      </button>
    </div>
  )
}

// Small floating control, bottom-right, that eases the camera back to the
// default resting view.
function RecenterButton({ onRecenter }) {
  return (
    <button
      onClick={onRecenter}
      title="Recenter view"
      aria-label="Recenter view"
      className={`pointer-events-auto grid h-10 w-10 cursor-pointer place-items-center text-[#5c6b4d] transition hover:text-[#38452e] ${card}`}
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 2.5v4" />
          <path d="M12 17.5v4" />
          <path d="M2.5 12h4" />
          <path d="M17.5 12h4" />
        </g>
      </svg>
    </button>
  )
}

export default function TimerOverlay({ grove, onRecenter }) {
  const {
    plants,
    session,
    toast,
    placing,
    planting,
    beginPlacement,
    cancelPlacement,
    cancelSession,
  } = grove
  const completed = plants.filter((p) => p.status === 'complete')
  const wilted = plants.filter((p) => p.status === 'wilted').length
  const focusMinutes = completed.reduce((sum, p) => sum + TIERS[p.tier].minutes, 0)

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* header */}
      <div className="flex items-start justify-between p-5">
        <div>
          <h1 className="font-heading text-[26px] tracking-[0.5px] text-[#38452e]">Grove</h1>
          {(completed.length > 0 || wilted > 0) && (
            <p className="mt-0.5 text-[12.5px] text-[#38452e]/70">
              {completed.length} plant{completed.length === 1 ? '' : 's'} ·{' '}
              {formatTotalMinutes(focusMinutes)} of focus grown
              {wilted > 0 ? ` · ${wilted} wilted` : ''}
            </p>
          )}
        </div>
        {SPEED !== 1 && (
          <span className="rounded-full bg-amber-200/90 px-2.5 py-1 text-xs font-medium text-amber-900">
            dev speed ×{SPEED}
          </span>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2">
          <div className={`rounded-full px-5 py-2.5 text-[13.5px] text-[#38452e] ${card}`}>
            {toast}
          </div>
        </div>
      )}

      {/* bottom panel */}
      <div className="mt-auto flex justify-center px-4 pb-6">
        {session ? (
          <ActivePanel
            key={session.plantId}
            session={session}
            plant={plants.find((p) => p.id === session.plantId)}
            cancelSession={cancelSession}
          />
        ) : placing ? (
          <PlacementPanel placing={placing} cancelPlacement={cancelPlacement} />
        ) : planting ? (
          <div className={`pointer-events-auto px-6 py-3.5 text-[13.5px] text-[#5c6b4d] ${card}`}>
            Planting your {friendlyName(planting.tier, planting.variationIndex)}…
          </div>
        ) : (
          <IdlePanel beginPlacement={beginPlacement} plants={plants} />
        )}
      </div>

      {/* recenter view control */}
      <div className="absolute right-5 bottom-6">
        <RecenterButton onRecenter={onRecenter} />
      </div>
    </div>
  )
}
