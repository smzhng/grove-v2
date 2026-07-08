import { useEffect, useState } from 'react'

// "Tending the garden…" veil shown while the 3D scene spins up. Holds a
// beat after the canvas reports ready so it doesn't flash, then fades out
// and unmounts.
export default function LoadingVeil({ ready }) {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setFading(true), 500)
    return () => clearTimeout(t)
  }, [ready])

  if (gone) return null
  return (
    <div
      onTransitionEnd={() => setGone(true)}
      className={`absolute inset-0 z-10 grid place-items-center bg-[#e3e8d0] transition-opacity duration-700 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <p className="font-heading text-lg text-[#5c6b4d]">Tending the garden…</p>
    </div>
  )
}
