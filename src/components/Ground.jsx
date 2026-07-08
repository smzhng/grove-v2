import { useMemo } from 'react'
import * as THREE from 'three'

const GROUND_RADIUS = 16.5

// Procedural grass texture: soft green base, mottled blotches, and a gentle
// darker vignette at the rim for a grounded diorama feel.
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

  // rim vignette
  ctx.globalAlpha = 1
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.32, size / 2, size / 2, size * 0.5)
  grad.addColorStop(0, 'rgba(40,60,25,0)')
  grad.addColorStop(1, 'rgba(40,60,25,0.28)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default function Ground() {
  const grass = useMemo(makeGrassTexture, [])
  return (
    <group>
      {/* grass top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[GROUND_RADIUS, 64]} />
        <meshStandardMaterial map={grass} roughness={1} metalness={0} />
      </mesh>
      {/* soil base of the diorama */}
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[GROUND_RADIUS, GROUND_RADIUS * 0.94, 1.4, 64]} />
        <meshStandardMaterial color="#6d5138" roughness={1} metalness={0} flatShading />
      </mesh>
    </group>
  )
}
