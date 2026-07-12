import { TIERS, TIER_ORDER, friendlyName } from '../constants.js'

// Every plant tier/variation combo that can ever grow, in catalog order.
// Which variation you get is random at planting time, so filling this out
// is a discovery process, not something the player directly controls.
export function plantCatalog() {
  return TIER_ORDER.flatMap((tier) =>
    Array.from({ length: TIERS[tier].variations }, (_, variationIndex) => ({
      tier,
      variationIndex,
      name: friendlyName(tier, variationIndex),
    })),
  )
}

// Unlocked once a plant of that exact tier/variation has finished growing.
// Plants are never deleted, so scanning the full (persistent) list is enough
// — no separate "ever seen" tracking needed.
export function isPlantUnlocked(tier, variationIndex, plants) {
  return plants.some(
    (p) => p.tier === tier && p.variationIndex === variationIndex && p.status === 'complete',
  )
}

// Ecology-driven creature unlocks. No live 3D presence yet — library only.
export const ANIMALS = [
  {
    id: 'fox',
    name: 'fox',
    hint: 'Grow 3 pines or grand trees',
    isUnlocked: (plants) =>
      plants.filter((p) => (p.tier === 'large' || p.tier === 'hero') && p.status === 'complete')
        .length >= 3,
  },
]
