import { useMemo } from 'react'
import * as THREE from 'three'
import { swayMaterial } from '../lib/sway.js'

/*
 * PlantAsset — the ONLY place plant visuals live.
 *
 * Currently renders primitive placeholders (cones/spheres/cylinders/boxes).
 * When the real GLTF models are ready, swap the placeholder builder for a
 * loader keyed by this map, without touching the timer or placement engines:
 *
 * const ASSET_MAP = {
 *   sprout: [
 *     'Clover_1.gltf',
 *     'Clover_2.gltf',
 *     'Grass_Common_Short.gltf',
 *     'Grass_Wispy_Short.gltf',
 *     'Mushroom_Common.gltf',
 *   ],
 *   small: [
 *     'Grass_Common_Tall.gltf',
 *     'Grass_Wispy_Tall.gltf',
 *     'Fern_1.gltf',
 *     'Flower_3_Single.gltf',
 *     'Flower_4_Single.gltf',
 *     'Plant_1.gltf',
 *     'Plant_7.gltf',
 *   ],
 *   medium: [
 *     'Flower_3_Group.gltf',
 *     'Flower_4_Group.gltf',
 *     'Plant_1_Big.gltf',
 *     'Plant_7_Big.gltf',
 *     'Mushroom_Laetiporus.gltf',
 *     'Bush_Common.gltf',
 *   ],
 *   large: [
 *     'Bush_Common_Flowers.gltf',
 *     'Pine_1.gltf',
 *     'Pine_2.gltf',
 *     'Pine_3.gltf',
 *     'Pine_4.gltf',
 *     'Pine_5.gltf',
 *   ],
 *   hero: [
 *     'CommonTree_1.gltf',
 *     'CommonTree_2.gltf',
 *     'CommonTree_3.gltf',
 *     'CommonTree_4.gltf',
 *     'CommonTree_5.gltf',
 *     'TwistedTree_1.gltf',
 *     'TwistedTree_2.gltf',
 *     'TwistedTree_3.gltf',
 *     'TwistedTree_4.gltf',
 *     'TwistedTree_5.gltf',
 *   ],
 *   wilted: [
 *     'DeadTree_1.gltf',
 *     'DeadTree_2.gltf',
 *     'DeadTree_3.gltf',
 *     'DeadTree_4.gltf',
 *     'DeadTree_5.gltf',
 *   ],
 *   // Decorative scenery (see Scenery.jsx):
 *   // Pebble_Round_1..5, Pebble_Square_1..6, Rock_Medium_1..3,
 *   // RockPath pieces, Petal_1..5
 * }
 */

// Four shared unit geometries; every part is a scaled/rotated instance.
const GEO = {
  sphere: new THREE.SphereGeometry(1, 8, 6),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 7),
  box: new THREE.BoxGeometry(1, 1, 1),
}

const MAT = {
  leaf: swayMaterial('#4f8f3e'),
  leafLight: swayMaterial('#6fae4e'),
  leafDark: swayMaterial('#3e7534'),
  wispy: swayMaterial('#8fbf62'),
  trunk: swayMaterial('#7d5a3c'),
  trunkDark: swayMaterial('#5f4530'),
  stem: swayMaterial('#5c8f45'),
  pink: swayMaterial('#d9749c'),
  yellow: swayMaterial('#e5bd4e'),
  white: swayMaterial('#efe9d8'),
  center: swayMaterial('#f0cf62'),
  mushStem: swayMaterial('#e6dcc3'),
  mushCap: swayMaterial('#bf5540'),
  mushOrange: swayMaterial('#d98a3d'),
  dead: swayMaterial('#6b5a49'),
  deadDark: swayMaterial('#514336'),
}

// --- placeholder builders -------------------------------------------------
// Each builder pushes parts: { geo, mat, pos, scl, rot }

function buildSprout(vi, add) {
  if (vi === 0 || vi === 1) {
    // Clover_1 / Clover_2
    const n = vi === 0 ? 3 : 4
    for (let i = 0; i < n; i++) {
      const a = i * ((Math.PI * 2) / n) + vi * 0.7
      const x = Math.cos(a) * 0.07
      const z = Math.sin(a) * 0.07
      add(GEO.cyl, MAT.stem, [x, 0.07, z], [0.012, 0.14, 0.012])
      add(GEO.sphere, MAT.leafLight, [x, 0.15, z], [0.06, 0.035, 0.06])
    }
  } else if (vi === 2 || vi === 3) {
    // Grass_Common_Short / Grass_Wispy_Short
    const wispy = vi === 3
    const n = wispy ? 6 : 4
    for (let i = 0; i < n; i++) {
      const a = i * 2.4 + vi
      const x = Math.cos(a) * 0.06
      const z = Math.sin(a) * 0.06
      const h = wispy ? 0.34 : 0.28
      add(
        GEO.cone,
        wispy ? MAT.wispy : MAT.leaf,
        [x, h / 2, z],
        [wispy ? 0.02 : 0.035, h, wispy ? 0.02 : 0.035],
        [Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3],
      )
    }
  } else {
    // Mushroom_Common
    add(GEO.cyl, MAT.mushStem, [0, 0.09, 0], [0.05, 0.18, 0.05])
    add(GEO.sphere, MAT.mushCap, [0, 0.2, 0], [0.16, 0.09, 0.16])
    add(GEO.cyl, MAT.mushStem, [0.14, 0.05, 0.05], [0.03, 0.1, 0.03])
    add(GEO.sphere, MAT.mushCap, [0.14, 0.12, 0.05], [0.09, 0.05, 0.09])
  }
}

function buildFlower(add, x, z, h, headMat, coneHead = false) {
  add(GEO.cyl, MAT.stem, [x, h / 2, z], [0.025, h, 0.025])
  if (coneHead) {
    add(GEO.cone, headMat, [x, h + 0.07, z], [0.12, 0.15, 0.12], [Math.PI, 0, 0])
  } else {
    add(GEO.sphere, headMat, [x, h + 0.04, z], [0.13, 0.07, 0.13])
    add(GEO.sphere, MAT.center, [x, h + 0.09, z], [0.05, 0.05, 0.05])
  }
  add(GEO.cone, MAT.leaf, [x + 0.08, 0.09, z], [0.04, 0.18, 0.04], [0, 0, -0.5])
}

function buildSmall(vi, add) {
  if (vi === 0 || vi === 1) {
    // Grass_Common_Tall / Grass_Wispy_Tall
    const wispy = vi === 1
    const n = wispy ? 7 : 5
    for (let i = 0; i < n; i++) {
      const a = i * 2.2 + vi
      const x = Math.cos(a) * 0.09
      const z = Math.sin(a) * 0.09
      const h = wispy ? 0.95 : 0.8
      add(
        GEO.cone,
        wispy ? MAT.wispy : MAT.leaf,
        [x, h / 2, z],
        [wispy ? 0.03 : 0.05, h, wispy ? 0.03 : 0.05],
        [Math.sin(a) * 0.28, 0, Math.cos(a) * 0.28],
      )
    }
  } else if (vi === 2) {
    // Fern_1: fronds tilted outward
    for (let i = 0; i < 7; i++) {
      const a = i * ((Math.PI * 2) / 7)
      add(
        GEO.cone,
        MAT.leafDark,
        [Math.cos(a) * 0.2, 0.28, Math.sin(a) * 0.2],
        [0.05, 0.72, 0.05],
        [Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7],
      )
    }
  } else if (vi === 3) {
    buildFlower(add, 0, 0, 0.55, MAT.pink) // Flower_3_Single
  } else if (vi === 4) {
    buildFlower(add, 0, 0, 0.6, MAT.yellow, true) // Flower_4_Single
  } else if (vi === 5) {
    // Plant_1
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1
      add(
        GEO.cone,
        MAT.leaf,
        [Math.cos(a) * 0.08, 0.3, Math.sin(a) * 0.08],
        [0.09, 0.6, 0.09],
        [Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25],
      )
    }
    add(GEO.sphere, MAT.leafLight, [0, 0.22, 0], [0.14, 0.1, 0.14])
  } else {
    // Plant_7
    add(GEO.cyl, MAT.stem, [0, 0.25, 0], [0.04, 0.5, 0.04])
    add(GEO.sphere, MAT.leafDark, [0, 0.58, 0], [0.24, 0.2, 0.24])
    add(GEO.sphere, MAT.leaf, [0.14, 0.44, 0.06], [0.12, 0.1, 0.12])
  }
}

function buildMedium(vi, add) {
  if (vi === 0 || vi === 1) {
    // Flower_3_Group / Flower_4_Group
    const spots = [
      [0.26, -0.05, 0.6],
      [-0.2, 0.18, 0.72],
      [-0.02, -0.28, 0.52],
    ]
    const mats = vi === 0 ? [MAT.pink, MAT.pink, MAT.white] : [MAT.yellow, MAT.white, MAT.yellow]
    spots.forEach(([x, z, h], i) => buildFlower(add, x, z, h, mats[i], vi === 1))
  } else if (vi === 2) {
    // Plant_1_Big
    for (let i = 0; i < 4; i++) {
      const a = i * 1.6
      add(
        GEO.cone,
        MAT.leaf,
        [Math.cos(a) * 0.14, 0.55, Math.sin(a) * 0.14],
        [0.16, 1.1, 0.16],
        [Math.sin(a) * 0.22, 0, Math.cos(a) * 0.22],
      )
    }
    add(GEO.sphere, MAT.leafLight, [0, 0.35, 0], [0.24, 0.16, 0.24])
  } else if (vi === 3) {
    // Plant_7_Big
    add(GEO.cyl, MAT.stem, [0, 0.4, 0], [0.07, 0.8, 0.07])
    add(GEO.sphere, MAT.leafDark, [0, 0.95, 0], [0.42, 0.34, 0.42])
    add(GEO.sphere, MAT.leaf, [0.26, 0.7, 0.1], [0.2, 0.16, 0.2])
  } else if (vi === 4) {
    // Mushroom_Laetiporus: shelf fungus on a stump
    add(GEO.box, MAT.trunkDark, [0, 0.25, 0], [0.32, 0.5, 0.32], [0, 0.4, 0])
    add(GEO.sphere, MAT.mushOrange, [0.16, 0.3, 0.05], [0.32, 0.1, 0.28])
    add(GEO.sphere, MAT.mushOrange, [0.1, 0.46, -0.08], [0.4, 0.12, 0.34])
    add(GEO.sphere, MAT.mushOrange, [-0.12, 0.58, 0.08], [0.28, 0.09, 0.24])
  } else {
    // Bush_Common
    add(GEO.sphere, MAT.leafDark, [0, 0.42, 0], [0.55, 0.45, 0.55])
    add(GEO.sphere, MAT.leaf, [0.36, 0.34, 0.12], [0.38, 0.32, 0.38])
    add(GEO.sphere, MAT.leaf, [-0.32, 0.32, -0.14], [0.34, 0.28, 0.34])
  }
}

function buildLarge(vi, add) {
  if (vi === 0) {
    // Bush_Common_Flowers
    add(GEO.sphere, MAT.leafDark, [0, 0.5, 0], [0.7, 0.55, 0.7])
    add(GEO.sphere, MAT.leaf, [0.45, 0.4, 0.15], [0.45, 0.38, 0.45])
    add(GEO.sphere, MAT.leaf, [-0.4, 0.38, -0.18], [0.4, 0.34, 0.4])
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9
      add(
        GEO.sphere,
        MAT.white,
        [Math.cos(a) * 0.55, 0.55 + Math.sin(i * 2.7) * 0.25, Math.sin(a) * 0.5],
        [0.07, 0.06, 0.07],
      )
    }
  } else {
    // Pine_1 .. Pine_5: stacked cones, proportions vary by index
    const p = vi - 1 // 0..4
    add(GEO.cyl, MAT.trunk, [0, 0.28, 0], [0.14, 0.56, 0.14])
    const layers = 3 + (p % 2)
    const baseR = 0.8 + p * 0.06
    const coneH = 0.85 + p * 0.08
    const gap = 0.5 + p * 0.05
    const mat = p % 2 === 0 ? MAT.leafDark : MAT.leaf
    for (let i = 0; i < layers; i++) {
      const r = baseR * Math.pow(0.72, i)
      const y = 0.5 + coneH / 2 + i * gap
      add(GEO.cone, mat, [0, y, 0], [r, coneH, r])
    }
  }
}

function buildHero(vi, add) {
  if (vi < 5) {
    // CommonTree_1 .. 5
    add(GEO.cyl, MAT.trunk, [0, 1.2, 0], [0.28, 2.4, 0.28])
    add(GEO.cyl, MAT.trunk, [0.3, 1.9, 0.1], [0.12, 1.2, 0.12], [0, 0, -0.5])
    add(GEO.sphere, MAT.leaf, [0, 3.15, 0], [1.5, 1.25, 1.5])
    const a0 = vi * 1.3
    for (let k = 0; k < 3; k++) {
      const a = a0 + k * 2.1
      add(
        GEO.sphere,
        k % 2 === 0 ? MAT.leafDark : MAT.leafLight,
        [Math.cos(a) * 1.0, 2.75 + k * 0.35, Math.sin(a) * 1.0],
        [0.95 - k * 0.12, 0.8 - k * 0.1, 0.95 - k * 0.12],
      )
    }
  } else {
    // TwistedTree_1 .. 5
    const t = vi - 5
    const lean = 0.2 + t * 0.04
    add(GEO.cyl, MAT.trunkDark, [-0.3, 1.25, 0], [0.2, 2.6, 0.2], [0, 0, lean])
    add(GEO.cyl, MAT.trunkDark, [0.35, 1.35, 0.1], [0.15, 2.4, 0.15], [0.15, 0, -lean - 0.08])
    add(GEO.cyl, MAT.trunkDark, [0.1, 2.4, -0.2], [0.08, 1.1, 0.08], [-0.5, 0, 0.3])
    add(GEO.sphere, MAT.leafDark, [0.5, 3.15, 0.1], [1.05, 0.85, 1.05])
    add(GEO.sphere, MAT.leaf, [-0.65, 2.85, -0.1], [0.8, 0.65, 0.8])
    add(GEO.sphere, MAT.leafLight, [0.05 + t * 0.08, 3.65, 0.25], [0.6, 0.5, 0.6])
  }
}

// Approximate full height of each tier, so a wilted sprout stays tiny and a
// wilted hero is a proper dead tree.
const WILT_HEIGHT = { sprout: 0.35, small: 0.75, medium: 1.15, large: 2.3, hero: 3.4 }

function buildWilted(tier, vi, add) {
  // DeadTree_1 .. 5: slumped dark trunk + bare branches
  const dv = vi % 5
  const H = WILT_HEIGHT[tier] ?? 1
  const lean = 0.18 + dv * 0.07
  const r = 0.04 + H * 0.04
  add(
    GEO.cyl,
    MAT.deadDark,
    [Math.sin(lean) * (H / 2), Math.cos(lean) * (H / 2), 0],
    [r, H, r],
    [0, dv * 1.3, lean],
  )
  const topX = Math.sin(lean) * H * 0.75
  const topY = Math.cos(lean) * H * 0.75
  const branches = 2 + (dv % 2)
  for (let i = 0; i < branches; i++) {
    const side = i % 2 === 0 ? 1 : -1
    add(
      GEO.cyl,
      MAT.dead,
      [topX + side * H * 0.14, topY - i * H * 0.16, side * H * 0.05],
      [r * 0.45, H * 0.42, r * 0.45],
      [side * 0.3, 0, side * (0.75 + dv * 0.08) + lean],
    )
  }
}

// overrideMaterial replaces every part's material — used for the translucent
// ghost preview during placement.
export default function PlantAsset({ tier, variationIndex, isWilted, overrideMaterial }) {
  const parts = useMemo(() => {
    const list = []
    const add = (geo, mat, pos, scl, rot = [0, 0, 0]) => list.push({ geo, mat, pos, scl, rot })
    if (isWilted) buildWilted(tier, variationIndex, add)
    else if (tier === 'sprout') buildSprout(variationIndex, add)
    else if (tier === 'small') buildSmall(variationIndex, add)
    else if (tier === 'medium') buildMedium(variationIndex, add)
    else if (tier === 'large') buildLarge(variationIndex, add)
    else buildHero(variationIndex, add)
    return list
  }, [tier, variationIndex, isWilted])

  return (
    <group>
      {parts.map((p, i) => (
        <mesh
          key={i}
          castShadow={!overrideMaterial}
          geometry={p.geo}
          material={overrideMaterial || p.mat}
          position={p.pos}
          scale={p.scl}
          rotation={p.rot}
        />
      ))}
    </group>
  )
}
