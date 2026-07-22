import { useCallback, useEffect, useRef, useState } from 'react'
import { TIERS, SPEED, growthScale, friendlyName, stageName } from '../constants.js'
import {
  loadPlants,
  savePlants,
  loadSession,
  saveSession,
  resetGarden,
  peekFreshTab,
  markTabAlive,
} from '../lib/storage.js'
import { isSpotValid } from '../lib/placement.js'

// Reconcile stored state on startup:
// - active session still within its duration, same tab (reload) -> resume it
// - active session still within its duration, fresh tab (closed + reopened,
//   or a new tab entirely) -> wilt it, since only a reload counts as "kept
//   the tab open"
// - session whose duration elapsed while away -> plant completes
// - orphaned "growing" plants (no matching session) -> wilt them small
function loadInitial() {
  let plants = loadPlants()
  let session = loadSession()
  let toast = null
  const freshTab = peekFreshTab()

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
        toast = `Your ${friendlyName(plant.tier, plant.variationIndex)} finished growing while you were away 🌿`
        session = null
      } else if (freshTab) {
        const progress = elapsed / session.durationMs
        const grown = Math.max(0.3, growthScale(progress))
        plants = plants.map((p) =>
          p.id === plant.id ? { ...p, status: 'wilted', scale: p.scale * grown } : p,
        )
        toast = `Your ${friendlyName(plant.tier, plant.variationIndex)} wilted while the tab was closed.`
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
  useEffect(() => markTabAlive(), [])

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
    const plant = plants.find((p) => p.id === plantId)
    const name = plant
      ? friendlyName(plant.tier, plant.variationIndex)
      : TIERS[tierKey].label.toLowerCase()
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, status: 'complete' } : p)),
    )
    setSession(null)
    showToast(`Your ${name} joined the garden 🌿`)
  }, [plants, showToast])

  // Watch for the running session hitting its full duration, and announce
  // each growth-stage transition (Sprouting -> Growing -> Flourishing) once.
  useEffect(() => {
    if (!session) return
    let lastStage = null
    const check = () => {
      const elapsed = (Date.now() - session.startedAt) * SPEED
      if (elapsed >= session.durationMs) {
        completeSession(session.plantId, session.tier)
        return
      }
      const progress = elapsed / session.durationMs
      const stage = stageName(progress)
      if (lastStage === null) {
        lastStage = stage
      } else if (stage !== lastStage) {
        lastStage = stage
        const plant = plants.find((p) => p.id === session.plantId)
        const name = plant
          ? friendlyName(plant.tier, plant.variationIndex)
          : TIERS[session.tier].label.toLowerCase()
        showToast(`Your ${name} is ${stage.toLowerCase()} 🌿`)
      }
    }
    check()
    const id = setInterval(check, 500)
    return () => clearInterval(id)
  }, [session, completeSession, plants, showToast])

  // Manual placement flow: pick a tier -> ghost preview follows the mouse
  // (`placing`) -> click a valid spot -> dig/seed animation plays
  // (`planting`) -> seed buried -> plant + session actually begin. Neither
  // transient phase is persisted; a reload mid-flow just cancels it.
  const [placing, setPlacing] = useState(null)
  const [planting, setPlanting] = useState(null)

  const beginPlacement = useCallback(
    (tierKey, intention = '') => {
      if (session || placing || planting) return
      setPlacing({
        tier: tierKey,
        variationIndex: Math.floor(Math.random() * TIERS[tierKey].variations),
        rotation: Math.random() * Math.PI * 2,
        scale: 0.85 + Math.random() * 0.3,
        intention: intention.trim().slice(0, 80),
      })
    },
    [session, placing, planting],
  )

  const cancelPlacement = useCallback(() => setPlacing(null), [])

  const confirmPlacement = useCallback(
    (x, z) => {
      if (!placing || !isSpotValid(x, z, placing.tier, plants)) return
      setPlanting({ ...placing, x, z })
      setPlacing(null)
    },
    [placing, plants],
  )

  // Called when the dig/seed animation finishes: the session starts now.
  const finishPlanting = useCallback(() => {
    if (!planting) return
    const plantedAt = Date.now()
    const plant = {
      id: crypto.randomUUID(),
      tier: planting.tier,
      variationIndex: planting.variationIndex,
      x: planting.x,
      z: planting.z,
      rotation: planting.rotation,
      scale: planting.scale,
      status: 'growing',
      plantedAt,
      intention: planting.intention || '',
    }
    setPlants((prev) => [...prev, plant])
    setSession({
      plantId: plant.id,
      tier: planting.tier,
      startedAt: plantedAt,
      durationMs: TIERS[planting.tier].minutes * 60 * 1000,
      intention: planting.intention || '',
    })
    setPlanting(null)
  }, [planting])

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

  return {
    plants,
    session,
    toast,
    placing,
    planting,
    beginPlacement,
    cancelPlacement,
    confirmPlacement,
    finishPlanting,
    cancelSession,
  }
}
