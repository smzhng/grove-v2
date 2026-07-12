import { useMemo } from 'react'
import * as THREE from 'three'
import { mulberry32, GARDEN_RADIUS } from '../lib/placement.js'

/*
 * The world beyond the clearing — Amazon-rainforest vibe, all primitive
 * placeholders. Layered like the classics fake an endless world:
 *   1. flat clearing (the plantable garden, unchanged, r <= 14)
 *   2. natural boundary ring (~r 15-21): dense jungle treeline, underbrush,
 *      rocky outcrops, a creek and small ponds — "the wild starts here"
 *   3. rolling forested wilderness (~r 22-52)
 *   4. mountain silhouettes (~r 58-92) fading into the fog, so the terrain
 *      edge itself is never visible (Minecraft/No Man's Sky fog trick, plus
 *      one tall anchor peak, Journey-style)
 * Everything is generated once from a fixed seed so it never reshuffles.
 */

const flat = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, flatShading: true })

const MAT = {
  terrain: flat('#639a4a'),
  trunk: flat('#7d5a3c'),
  trunkDark: flat('#5f4530'),
  canopy: flat('#3e7534'),
  canopyDark: flat('#2f5e2a'),
  canopyLight: flat('#4f8f3e'),
  underbrush: flat('#41763a'),
  rock: flat('#8d8878'),
  mountain: flat('#7c96a8'),
  mountainFar: flat('#8fa8bd'),
  hill: flat('#527f40'),
  sand: flat('#c2b490'),
}
MAT.water = new THREE.MeshStandardMaterial({
  color: '#6db5cf',
  roughness: 0.35,
  metalness: 0,
  transparent: true,
  opacity: 0.85,
})

const GEO = {
  sphere: new THREE.SphereGeometry(1, 8, 6),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 7),
  box: new THREE.BoxGeometry(1, 1, 1),
  disc: new THREE.CylinderGeometry(1, 1, 1, 24),
}

// Creek control points (x, z) — winds through the eastern boundary and
// slips away into the fog. Terrain is carved down along this line.
const CREEK = [
  [9, -27],
  [13, -17],
  [17, -8],
  [19, 2],
  [24, 10],
  [31, 17],
  [38, 24],
]
// [x, z, radius] — creek widens into one pond; a second sits on the west side
const PONDS = [
  [24.5, 10.5, 3.2],
  [-21.5, -6, 2.4],
]

function creekCarve(x, z) {
  let dip = 0
  for (let i = 0; i < CREEK.length - 1; i++) {
    const [ax, az] = CREEK[i]
    const [bx, bz] = CREEK[i + 1]
    const abx = bx - ax
    const abz = bz - az
    const len2 = abx * abx + abz * abz
    const t = Math.min(Math.max(((x - ax) * abx + (z - az) * abz) / len2, 0), 1)
    const d = Math.hypot(x - (ax + abx * t), z - (az + abz * t))
    dip = Math.max(dip, Math.exp(-(d * d) / 4.5))
  }
  for (const [px, pz, pr] of PONDS) {
    const d = Math.hypot(x - px, z - pz)
    dip = Math.max(dip, Math.exp(-(d * d) / (pr * pr * 1.6)))
  }
  return dip
}

// Height field: dead flat across the clearing, gentle hills beyond, land
// swelling upward toward the mountain ring; creek/ponds carved below zero.
function terrainHeight(x, z) {
  const r = Math.hypot(x, z)
  const ramp = THREE.MathUtils.smoothstep(r, 17, 42)
  const hills =
    Math.sin(x * 0.11 + 1.7) * Math.cos(z * 0.13 + 4.2) * 1.5 +
    Math.sin(x * 0.05 - 2.1) * Math.cos(z * 0.06 + 0.8) * 2.4
  const rise = THREE.MathUtils.smoothstep(r, 52, 95) * 7
  return ramp * (2.4 + hills) + rise - creekCarve(x, z) * 1.1
}

// Big broad-canopy jungle tree (kapok-ish): buttressed trunk + stacked
// ellipsoid canopy. Returns primitive part descriptors.
function jungleTree(rand, scale) {
  const parts = []
  const trunkH = (4.5 + rand() * 2.5) * scale
  const trunkR = (0.28 + rand() * 0.14) * scale
  parts.push({ geo: GEO.cyl, mat: MAT.trunk, pos: [0, trunkH / 2, 0], scl: [trunkR, trunkH, trunkR] })
  parts.push({
    geo: GEO.cone,
    mat: MAT.trunkDark,
    pos: [0, trunkH * 0.14, 0],
    scl: [trunkR * 2.6, trunkH * 0.28, trunkR * 2.6],
  })
  const canopyR = (2.4 + rand() * 1.4) * scale
  const mats = [MAT.canopy, MAT.canopyDark, MAT.canopyLight]
  parts.push({
    geo: GEO.sphere,
    mat: mats[Math.floor(rand() * 3)],
    pos: [0, trunkH + canopyR * 0.25, 0],
    scl: [canopyR, canopyR * 0.55, canopyR],
  })
  parts.push({
    geo: GEO.sphere,
    mat: mats[Math.floor(rand() * 3)],
    pos: [canopyR * 0.5 * (rand() - 0.5), trunkH + canopyR * 0.55, canopyR * 0.5 * (rand() - 0.5)],
    scl: [canopyR * 0.62, canopyR * 0.4, canopyR * 0.62],
  })
  return parts
}

function buildWorld() {
  const rand = mulberry32(19970707)
  const items = [] // { geo, mat, pos, scl, rot?, shadow? }
  const add = (geo, mat, pos, scl, rot = [0, 0, 0], shadow = false) =>
    items.push({ geo, mat, pos, scl, rot, shadow })

  const houseAz = Math.atan2(18.5, -1.5) // keep the treeline open around the house
  const creekAz = 0.1 // and where the creek crosses the ring

  // --- boundary treeline (dense, casts shadows, encloses the clearing) ---
  for (let i = 0; i < 30; i++) {
    const az = (i / 30) * Math.PI * 2 + rand() * 0.18
    if (Math.abs(az - houseAz) < 0.34) continue
    if (Math.abs(az - creekAz) < 0.22) continue
    const r = 15.8 + rand() * 4.5
    const x = Math.cos(az) * r
    const z = Math.sin(az) * r
    const y = terrainHeight(x, z)
    const s = 0.85 + rand() * 0.5
    for (const p of jungleTree(rand, s)) {
      add(p.geo, p.mat, [x + p.pos[0], y + p.pos[1], z + p.pos[2]], p.scl, [0, rand() * 6.3, 0], true)
    }
  }

  // --- underbrush + rocky outcrops along the ring ---
  for (let i = 0; i < 42; i++) {
    const az = rand() * Math.PI * 2
    if (Math.abs(az - houseAz) < 0.25) continue
    const r = 14.6 + rand() * 6
    const x = Math.cos(az) * r
    const z = Math.sin(az) * r
    const y = terrainHeight(x, z)
    if (y < -0.2) continue // not in the creek
    const s = 0.5 + rand() * 0.9
    if (rand() < 0.72) {
      add(GEO.sphere, MAT.underbrush, [x, y + s * 0.4, z], [s, s * 0.62, s], [0, rand() * 6.3, 0], true)
    } else {
      add(GEO.sphere, MAT.rock, [x, y + s * 0.3, z], [s, s * 0.62, s * 0.8], [rand() * 0.4, rand() * 6.3, 0], true)
    }
  }

  // --- rolling forested wilderness ---
  for (let i = 0; i < 38; i++) {
    const az = rand() * Math.PI * 2
    const r = 23 + rand() * 30
    const x = Math.cos(az) * r
    const z = Math.sin(az) * r
    const y = terrainHeight(x, z)
    if (y < 0) continue
    const s = 1.1 + rand() * 1.1
    for (const p of jungleTree(rand, s)) {
      add(p.geo, p.mat, [x + p.pos[0], y + p.pos[1], z + p.pos[2]], p.scl, [0, rand() * 6.3, 0], false)
    }
  }

  // --- foothills and mountain ring, fading into the fog ---
  for (let i = 0; i < 7; i++) {
    const az = (i / 7) * Math.PI * 2 + rand()
    const r = 46 + rand() * 12
    const h = 6 + rand() * 7
    add(GEO.cone, MAT.hill, [Math.cos(az) * r, h / 2 - 1, Math.sin(az) * r], [10 + rand() * 8, h, 10 + rand() * 8])
  }
  for (let i = 0; i < 12; i++) {
    const az = (i / 12) * Math.PI * 2 + rand() * 0.5
    const r = 60 + rand() * 30
    const h = 15 + rand() * 14
    add(
      GEO.cone,
      rand() < 0.5 ? MAT.mountain : MAT.mountainFar,
      [Math.cos(az) * r, h / 2 - 2, Math.sin(az) * r],
      [14 + rand() * 10, h, 14 + rand() * 10],
    )
  }
  // one tall anchor peak, Journey-style, roughly opposite the house
  add(GEO.cone, MAT.mountain, [26, 16, -68], [24, 38, 24])

  // --- creek water: chained flat discs along the carved line ---
  for (let i = 0; i < CREEK.length - 1; i++) {
    const [ax, az] = CREEK[i]
    const [bx, bz] = CREEK[i + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const steps = Math.ceil(len / 1.6)
    for (let sIdx = 0; sIdx <= steps; sIdx++) {
      const t = sIdx / steps
      const x = ax + (bx - ax) * t
      const z = az + (bz - az) * t
      add(GEO.disc, MAT.water, [x + (rand() - 0.5) * 0.4, -0.42, z + (rand() - 0.5) * 0.4], [1.5 + rand() * 0.5, 0.08, 1.5 + rand() * 0.5])
    }
  }
  for (const [px, pz, pr] of PONDS) {
    add(GEO.disc, MAT.water, [px, -0.42, pz], [pr, 0.08, pr])
    // sandy rim
    add(GEO.disc, MAT.sand, [px, -0.52, pz], [pr * 1.25, 0.06, pr * 1.25])
  }

  return items
}

const WORLD = buildWorld()

// Terrain mesh: a big displaced plane. Flat where the garden lives, hills
// beyond, carved along the creek. Fog fully swallows it long before its
// actual edge (r ~140), so the world never visibly ends.
function makeTerrainGeometry() {
  const geo = new THREE.PlaneGeometry(280, 280, 110, 110)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, terrainHeight(x, z))
  }
  geo.computeVertexNormals()
  return geo
}

// Procedural grass texture for the clearing (moved here from the old
// diorama Ground component).
function makeGrassTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#74a655'
  ctx.fillRect(0, 0, size, size)
  const tones = ['#82b45f', '#699b4c', '#8cbd68', '#619247', '#79ab58']
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 4 + Math.random() * 22
    ctx.globalAlpha = 0.05 + Math.random() * 0.09
    ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)]
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default function World() {
  const terrainGeo = useMemo(makeTerrainGeometry, [])
  const grass = useMemo(makeGrassTexture, [])
  return (
    <group>
      <mesh geometry={terrainGeo} material={MAT.terrain} receiveShadow />
      {/* the clearing: flat textured grass disc flush over the flat center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[GARDEN_RADIUS + 2.5, 64]} />
        <meshStandardMaterial map={grass} roughness={1} metalness={0} />
      </mesh>
      {WORLD.map((p, i) => (
        <mesh
          key={i}
          geometry={p.geo}
          material={p.mat}
          position={p.pos}
          scale={p.scl}
          rotation={p.rot}
          castShadow={p.shadow}
          receiveShadow={p.shadow}
        />
      ))}
    </group>
  )
}
