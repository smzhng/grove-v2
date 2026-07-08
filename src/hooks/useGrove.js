import { useCallback, useEffect, useRef, useState } from 'react'
import { TIERS, SPEED, growthScale } from '../constants.js'
import { loadPlants, savePlants, loadSession, saveSession, resetGarden } from '../lib/storage.js'
import { findSpot } from '../lib/placement.js'

// Reconcile stored state on startup:
// - active session still within its duration -> resume it
// - session whose duration elapsed while the tab was closed -> plant completes
// - orphaned "growing" plants (no matching session) -> wilt them small
function loadInitial() {
  let plants = loadPlants()
  let session = loadSession()
  let toast = null

  if (session) {
    const plant = plants.find((p) => p.id === session.plantId && p.status === 'growing')
    if (!plant) {
      session = null
    } else {
      const elapsed = (Date.now() - session.startedAt) * SPEED
      if (elapsed >= session.durationMs) {
        plants = plants.map((p) =>
          p.id === plant.id ? { ...p, status: 'complete' } : p,
        )
        toast = `Your ${TIERS[plant.tier].label.toLowerCase()} finished growing while you were away 🌿`
        session = null
      }
    }
  }

  plants = plants.map((p) =>
    p.status === 'growing' && (!session || session.plantId !== p.id)
      ? { ...p, status: 'wilted', scale: p.scale * 0.4 }
      : p,
  )

  return { plants, session, toast }
}

export default function useGrove() {
  const [initial] = useState(loadInitial)
  const [plants, setPlants] = useState(initial.plants)
  const [session, setSession] = useState(initial.session)
  const [toast, setToast] = useState(initial.toast)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }, [])

  // auto-dismiss a toast restored from startup reconciliation
  useEffect(() => {
    if (initial.toast) {
      toastTimer.current = setTimeout(() => setToast(null), 6000)
    }
    return () => clearTimeout(toastTimer.current)
  }, [initial.toast])

  useEffect(() => savePlants(plants), [plants])
  useEffect(() => saveSession(session), [session])

  // Hidden dev helper: window.__groveReset() wipes the garden.
  useEffect(() => {
    window.__groveReset = () => {
      resetGarden()
      window.location.reload()
    }
    return () => {
      delete window.__groveReset
    }
  }, [])

  const completeSession = useCallback((plantId, tierKey) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, status: 'complete' } : p)),
    )
    setSession(null)
    showToast(`Your ${TIERS[tierKey].label.toLowerCase()} joined the garden 🌿`)
  }, [showToast])

  // Watch for the running session hitting its full duration.
  useEffect(() => {
    if (!session) return
    const check = () => {
      const elapsed = (Date.now() - session.startedAt) * SPEED
      if (elapsed >= session.durationMs) completeSession(session.plantId, session.tier)
    }
    check()
    const id = setInterval(check, 500)
    return () => clearInterval(id)
  }, [session, completeSession])

  const startSession = useCallback(
    (tierKey) => {
      if (session) return
      const tier = TIERS[tierKey]
      const { x, z } = findSpot(tierKey, plants)
      const plant = {
        id: crypto.randomUUID(),
        tier: tierKey,
        variationIndex: Math.floor(Math.random() * tier.variations),
        x,
        z,
        rotation: Math.random() * Math.PI * 2,
        scale: 0.85 + Math.random() * 0.3,
        status: 'growing',
      }
      setPlants((prev) => [...prev, plant])
      setSession({
        plantId: plant.id,
        tier: tierKey,
        startedAt: Date.now(),
        durationMs: tier.minutes * 60 * 1000,
      })
    },
    [session, plants],
  )

  // Cancel = the plant wilts at roughly the size it had reached.
  const cancelSession = useCallback(() => {
    if (!session) return
    const progress = ((Date.now() - session.startedAt) * SPEED) / session.durationMs
    const grown = Math.max(0.3, growthScale(progress))
    setPlants((prev) =>
      prev.map((p) =>
        p.id === session.plantId
          ? { ...p, status: 'wilted', scale: p.scale * grown }
          : p,
      ),
    )
    setSession(null)
    showToast('The plant wilted. Its remains stay in the garden.')
  }, [session, showToast])

  return { plants, session, toast, startSession, cancelSession }
}
