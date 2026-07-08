// Tier definitions: duration, placement clearance radius, and how many
// model variations exist per tier (see PlantAsset.jsx for the variation map).
export const TIERS = {
  sprout: { label: 'Sprout', minutes: 15, clearance: 0.4, variations: 5 },
  small: { label: 'Small Plant', minutes: 30, clearance: 0.6, variations: 7 },
  medium: { label: 'Bush', minutes: 60, clearance: 1.0, variations: 6 },
  large: { label: 'Pine', minutes: 120, clearance: 1.5, variations: 6 },
  hero: { label: 'Grand Tree', minutes: 300, clearance: 2.2, variations: 10 },
}

export const TIER_ORDER = ['sprout', 'small', 'medium', 'large', 'hero']

// DeadTree_1 .. DeadTree_5
export const WILTED_VARIATIONS = 5

// Dev-only time acceleration: append ?speed=60 to the URL to make timers run
// 60x faster. Invisible in normal use (defaults to 1).
export const SPEED = (() => {
  if (typeof window === 'undefined') return 1
  const raw = new URLSearchParams(window.location.search).get('speed')
  const n = parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : 1
})()

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = minutes / 60
  return `${h} hr${h > 1 ? 's' : ''}`
}

export function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// Eased growth curve: gentle start and finish, visible progress throughout.
export function growthEase(t) {
  const p = Math.min(Math.max(t, 0), 1)
  return 0.5 - 0.5 * Math.cos(Math.PI * p)
}

// Scale multiplier applied to a plant's base scale while it grows.
export function growthScale(progress) {
  return 0.04 + 0.96 * growthEase(progress)
}
