import * as THREE from 'three'
import { mulberry32, distToPath, PATH_POINTS, OBSTACLES, GARDEN_RADIUS } from '../lib/placement.js'

/*
 * Decorative environment, generated once with a fixed seed so it never
 * reshuffles between visits. Placeholder primitives for:
 *   Pebble_Round_1..5, Pebble_Square_1..6, Rock_Medium_1..3,
 *   RockPath pieces, Petal_1..5
 */

const GEO = {
  rock: new THREE.SphereGeometry(1, 5, 4), // low-poly sphere reads as a rock
  box: new THREE.BoxGeometry(1, 1, 1),
  disc: new THREE.CylinderGeometry(1, 1.1, 1, 7),
}

const flat = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, flatShading: true })

const MAT = {
  grayLight: flat('#b3aea2'),
  gray: flat('#9a958a'),
  grayDark: flat('#837e73'),
  sand: flat('#cabd9f'),
  sandDark: flat('#b5a88b'),
  petalPink: flat('#e3a2ba'),
  petalDeep: flat('#d2789c'),
}

function buildScenery() {
  const rand = mulberry32(20260707)
  const items = []
  const grays = [MAT.grayLight, MAT.gray, MAT.grayDark]

  // Rock_Medium_1..3 — big enough to block plant placement, so register them
  // as obstacles for the scatter algorithm.
  for (let i = 0; i < 9; i++) {
    let x, z
    let tries = 0
    do {
      const a = rand() * Math.PI * 2
      const r = 3 + rand() * (GARDEN_RADIUS - 2)
      x = Math.cos(a) * r
      z = Math.sin(a) * r
      tries++
    } while (distToPath(x, z) < 2.4 && tries < 30)
    const s = 0.35 + rand() * 0.45
    items.push({
      geo: GEO.rock,
      mat: grays[i % 3],
      pos: [x, s * 0.35, z],
      scl: [s, s * 0.7, s * 0.85],
      rot: [rand() * 0.3, rand() * Math.PI * 2, rand() * 0.3],
    })
    OBSTACLES.push([x, z, s])
  }

  // Pebble_Round / Pebble_Square
  for (let i = 0; i < 60; i++) {
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * (GARDEN_RADIUS + 1.5)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const s = 0.05 + rand() * 0.09
    const square = rand() < 0.4
    items.push({
      geo: square ? GEO.box : GEO.rock,
      mat: grays[i % 3],
      pos: [x, s * 0.5, z],
      scl: [s, s * 0.6, s * 0.85],
      rot: [0, rand() * Math.PI * 2, 0],
    })
  }

  // RockPath pieces: flattened stepping stones along the winding path.
  for (let seg = 0; seg < PATH_POINTS.length - 1; seg++) {
    const [ax, az] = PATH_POINTS[seg]
    const [bx, bz] = PATH_POINTS[seg + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const steps = Math.max(1, Math.round(len / 1.15))
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps
      const px = ax + (bx - ax) * t
      const pz = az + (bz - az) * t
      // path now runs a little past the clearing edge, up to the house
      if (Math.hypot(px, pz) > GARDEN_RADIUS + 4) continue
      // lateral wobble so stones don't sit in a perfect line
      const nx = -(bz - az) / len
      const nz = (bx - ax) / len
      const off = (rand() - 0.5) * 0.7
      items.push({
        geo: GEO.disc,
        mat: rand() < 0.5 ? MAT.sand : MAT.sandDark,
        pos: [px + nx * off, 0.035, pz + nz * off],
        scl: [0.42 + rand() * 0.2, 0.07, 0.38 + rand() * 0.18],
        rot: [0, rand() * Math.PI * 2, 0],
      })
    }
  }

  // Petal_1..5 scattered on the grass
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * (GARDEN_RADIUS - 1)
    items.push({
      geo: GEO.box,
      mat: rand() < 0.5 ? MAT.petalPink : MAT.petalDeep,
      pos: [Math.cos(a) * r, 0.015, Math.sin(a) * r],
      scl: [0.09, 0.012, 0.06],
      rot: [0, rand() * Math.PI * 2, 0],
    })
  }

  return items
}

// Module-level: built exactly once, and OBSTACLES is populated before any
// React render calls findSpot().
const SCENERY = buildScenery()

export default function Scenery() {
  return (
    <group>
      {SCENERY.map((p, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          geometry={p.geo}
          material={p.mat}
          position={p.pos}
          scale={p.scl}
          rotation={p.rot}
        />
      ))}
    </group>
  )
}
