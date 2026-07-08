import { useEffect, useState } from 'react'
import { TIERS, TIER_ORDER, SPEED, formatDuration, formatRemaining } from '../constants.js'

const card =
  'rounded-[18px] border border-[#5a6946]/20 bg-[#faf9f0]/90 shadow-[0_10px_34px_rgba(50,65,38,0.16)] backdrop-blur-md'

function IdlePanel({ startSession }) {
  const [picked, setPicked] = useState('sprout')
  const tier = TIERS[picked]

  return (
    <div className={`pointer-events-auto w-full max-w-[560px] px-5 pt-[18px] pb-4 ${card}`}>
      <p className="mb-2.5 text-[11.5px] font-medium tracking-[0.14em] text-[#7a8a66] uppercase">
        Plant a session
      </p>
      <div className="mb-3.5 flex flex-wrap gap-2">
        {TIER_ORDER.map((key) => {
          const sel = picked === key
          return (
            <button
              key={key}
              onClick={() => setPicked(key)}
              className={`flex flex-1 basis-[88px] cursor-pointer flex-col items-center gap-0.5 rounded-xl border-[1.5px] px-1.5 py-2.5 text-[#38452e] transition ${
                sel
                  ? 'border-[#4a6b3f] bg-[#e4ecd6]'
                  : 'border-[#5a6946]/20 bg-white/55 hover:bg-white/80'
              }`}
            >
              <span className="text-[15px] font-bold">{formatDuration(TIERS[key].minutes)}</span>
              <span className="text-[11.5px] font-medium opacity-65">{TIERS[key].label}</span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] leading-snug text-[#6c7a5a]">
          Stay the full {formatDuration(tier.minutes)} and a {tier.label.toLowerCase()} takes
          root. Leave early and it wilts.
        </p>
        <button
          onClick={() => startSession(picked)}
          className="cursor-pointer rounded-xl bg-[#4a6b3f] px-[26px] py-3 text-[15px] font-semibold whitespace-nowrap text-[#f7f5ea] shadow-[0_3px_10px_rgba(58,84,48,0.35)] transition hover:-translate-y-0.5 hover:bg-[#557a49] active:translate-y-0"
        >
          Plant
        </button>
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
    <div className={`pointer-events-auto flex flex-col items-center px-8 py-4 ${card}`}>
      <p className="text-[11.5px] font-medium tracking-[0.14em] text-[#7a8a66] uppercase">
        Growing: {tier.label}
      </p>
      <p className="font-heading my-1 text-4xl text-[#2f3a26] tabular-nums">
        {formatRemaining(remaining)}
      </p>
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8a5a44]">It will wilt.</span>
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
          className="cursor-pointer text-sm text-[#5c6b4d] underline-offset-2 hover:text-[#8a5a44] hover:underline"
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
          <h1 className="font-heading text-[26px] tracking-[0.5px] text-[#38452e]">Grove</h1>
          <p className="mt-0.5 text-[12.5px] text-[#38452e]/70">
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
          <div className={`rounded-full px-5 py-2.5 text-[13.5px] text-[#38452e] ${card}`}>
            {toast}
          </div>
        </div>
      )}

      {/* bottom panel */}
      <div className="mt-auto flex justify-center px-4 pb-6">
        {session ? (
          <ActivePanel key={session.plantId} session={session} cancelSession={cancelSession} />
        ) : (
          <IdlePanel startSession={startSession} />
        )}
      </div>
    </div>
  )
}
