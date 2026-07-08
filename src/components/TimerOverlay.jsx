import { useEffect, useState } from 'react'
import { TIERS, TIER_ORDER, SPEED, formatDuration, formatRemaining } from '../constants.js'

function IdlePanel({ startSession }) {
  return (
    <div className="pointer-events-auto rounded-2xl bg-white/75 px-5 py-4 shadow-lg backdrop-blur-md">
      <p className="mb-3 text-center text-sm font-medium text-stone-600">
        Plant a focus session
      </p>
      <div className="flex gap-2">
        {TIER_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => startSession(key)}
            className="flex w-20 flex-col items-center rounded-xl bg-emerald-800/90 px-2 py-2.5 text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
          >
            <span className="text-sm font-semibold">{formatDuration(TIERS[key].minutes)}</span>
            <span className="mt-0.5 text-[11px] text-emerald-100/90">{TIERS[key].label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActivePanel({ session, cancelSession }) {
  const [now, setNow] = useState(Date.now())
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const tier = TIERS[session.tier]
  const remaining = session.durationMs - (now - session.startedAt) * SPEED

  return (
    <div className="pointer-events-auto flex flex-col items-center rounded-2xl bg-white/75 px-8 py-4 shadow-lg backdrop-blur-md">
      <p className="text-xs font-medium tracking-wide text-emerald-800 uppercase">
        Growing: {tier.label}
      </p>
      <p className="my-1 font-mono text-4xl font-semibold tabular-nums text-stone-800">
        {formatRemaining(remaining)}
      </p>
      {confirming ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-stone-600">Give up? Your {tier.label.toLowerCase()} will wilt.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Keep going
            </button>
            <button
              onClick={cancelSession}
              className="rounded-lg bg-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-red-200 hover:text-red-900"
            >
              Wilt it
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-stone-500 underline-offset-2 hover:text-red-700 hover:underline"
        >
          Give up
        </button>
      )}
    </div>
  )
}

export default function TimerOverlay({ grove }) {
  const { plants, session, toast, startSession, cancelSession } = grove
  const completed = plants.filter((p) => p.status === 'complete').length
  const wilted = plants.filter((p) => p.status === 'wilted').length

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* header */}
      <div className="flex items-start justify-between p-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950/85">Grove</h1>
          <p className="mt-0.5 text-xs text-emerald-950/50">
            {completed} grown{wilted > 0 ? ` · ${wilted} wilted` : ''}
          </p>
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
          <div className="rounded-full bg-emerald-900/90 px-4 py-2 text-sm text-emerald-50 shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* bottom panel */}
      <div className="mt-auto flex justify-center pb-6">
        {session ? (
          <ActivePanel key={session.plantId} session={session} cancelSession={cancelSession} />
        ) : (
          <IdlePanel startSession={startSession} />
        )}
      </div>
    </div>
  )
}
