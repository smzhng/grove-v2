import { TIERS } from '../constants.js'

// Circular garden area. Plants scatter inside this radius.
export const GARDEN_RADIUS = 14

// Hardcoded winding path through the center of the garden (x, z waypoints).
// Kept clear of plants; the rock path pieces in Scenery.jsx follow it.
export const PATH_POINTS = [
  [0.5, -17],
  [-1.0, -12],
  [-2.4, -7.5],
  [-1.6, -3.5],
  [0.6, 0.0],
  [2.4, 3.5],
  [1.6, 7.5],
  [-0.2, 11.5],
  [-1.2, 17],
]

export const PATH_HALF_WIDTH = 1.7

function distToSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax
  const abz = bz - az
  const apx = px - ax
  const apz = pz - az
  const lenSq = abx * abx + abz * abz
  const t = lenSq === 0 ? 0 : Math.min(Math.max((apx * abx + apz * abz) / lenSq, 0), 1)
  const cx = ax + abx * t
  const cz = az + abz * t
  return Math.hypot(px - cx, pz - cz)
}

export function distToPath(x, z) {
  let min = Infinity
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const [ax, az] = PATH_POINTS[i]
    const [bx, bz] = PATH_POINTS[i + 1]
    min = Math.min(min, distToSegment(x, z, ax, az, bx, bz))
  }
  return min
}

// Static obstacles (large scenery rocks) registered by Scenery.jsx so plants
// don't spawn inside them. [x, z, radius]
export const OBSTACLES = []

// Can a plant of this tier be placed at (x, z) right now? Same rules the
// scatter algorithm uses: inside the garden circle, off the path, clear of
// scenery rocks and other plants. Drives the ghost preview's valid/invalid
// tint during manual placement.
export function isSpotValid(x, z, tierKey, plants) {
  const clearance = TIERS[tierKey].clearance
  if (Math.hypot(x, z) > GARDEN_RADIUS - clearance * 0.5) return false
  if (distToPath(x, z) < PATH_HALF_WIDTH + clearance * 0.6) return false
  const hitsObstacle = OBSTACLES.some(
    ([ox, oz, or_]) => Math.hypot(x - ox, z - oz) < or_ + clearance * 0.7,
  )
  if (hitsObstacle) return false
  return !plants.some(
    (p) => Math.hypot(x - p.x, z - p.z) < clearance + TIERS[p.tier].clearance,
  )
}

// Rejection-sampled scatter with per-tier clearance. If the garden gets
// crowded, the clearance relaxes gradually so planting never fails outright.
export function findSpot(tierKey, plants, rand = Math.random) {
  const baseClearance = TIERS[tierKey].clearance
  let clearance = baseClearance

  for (let round = 0; round < 8; round++) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const angle = rand() * Math.PI * 2
      const radius = (GARDEN_RADIUS - baseClearance) * Math.sqrt(rand())
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      if (distToPath(x, z) < PATH_HALF_WIDTH + clearance * 0.6) continue

      const hitsObstacle = OBSTACLES.some(
        ([ox, oz, or_]) => Math.hypot(x - ox, z - oz) < or_ + clearance * 0.7,
      )
      if (hitsObstacle) continue

      const hitsPlant = plants.some(
        (p) => Math.hypot(x - p.x, z - p.z) < clearance + TIERS[p.tier].clearance,
      )
      if (!hitsPlant) return { x, z }
    }
    clearance *= 0.82
  }

  // Extremely crowded garden: give up on plant clearance, keep the path clear.
  for (let attempt = 0; attempt < 200; attempt++) {
    const angle = rand() * Math.PI * 2
    const radius = (GARDEN_RADIUS - baseClearance) * Math.sqrt(rand())
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (distToPath(x, z) >= PATH_HALF_WIDTH) return { x, z }
  }
  return { x: 0, z: -GARDEN_RADIUS + 2 }
}

// Deterministic RNG for the decorative scenery, so pebbles/rocks/petals stay
// in the same spots on every visit.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
