import { useState } from 'react'
import * as THREE from 'three'

// The player's little stilted cabin at the edge of the clearing, where the
// stone path arrives. Clicking it glides the camera in for a closer look —
// its interior/menu purpose comes in a future update. All primitives.

const flat = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, flatShading: true })

const MAT = {
  wall: flat('#a07850'),
  wallDark: flat('#8a6242'),
  roof: flat('#8a5a44'),
  trim: flat('#5f4530'),
  frame: flat('#d9c9a8'),
  window: new THREE.MeshStandardMaterial({ color: '#cfe3ea', roughness: 0.4, metalness: 0 }),
}

const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 7),
  pyramid: new THREE.ConeGeometry(1, 1, 4),
}

export const HOUSE_POSITION = [-1.5, 0, 18.5]

export default function House({ onFocus, disabled = false }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      position={HOUSE_POSITION}
      rotation={[0, -0.35, 0]}
      scale={hovered && !disabled ? 1.03 : 1}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (!disabled) {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onFocus?.()
      }}
    >
      {/* stilts */}
      {[
        [-1.1, -0.85],
        [1.1, -0.85],
        [-1.1, 0.85],
        [1.1, 0.85],
      ].map(([x, z], i) => (
        <mesh key={i} geometry={GEO.cyl} material={MAT.trim} position={[x, 0.25, z]} scale={[0.09, 0.5, 0.09]} castShadow />
      ))}
      {/* body */}
      <mesh geometry={GEO.box} material={MAT.wall} position={[0, 1.45, 0]} scale={[2.6, 1.9, 2.2]} castShadow receiveShadow />
      {/* roof: 4-sided pyramid, rotated so its faces align with the walls */}
      <mesh
        geometry={GEO.pyramid}
        material={MAT.roof}
        position={[0, 3.05, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[2.3, 1.3, 2.1]}
        castShadow
      />
      {/* chimney */}
      <mesh geometry={GEO.box} material={MAT.wallDark} position={[0.85, 3.35, 0.4]} scale={[0.3, 0.9, 0.3]} castShadow />
      {/* door + light frame (front faces the garden / path) */}
      <mesh geometry={GEO.box} material={MAT.frame} position={[0.35, 1.02, -1.11]} scale={[0.72, 1.14, 0.06]} />
      <mesh geometry={GEO.box} material={MAT.trim} position={[0.35, 1.0, -1.13]} scale={[0.55, 1.0, 0.06]} />
      {/* front window + frame */}
      <mesh geometry={GEO.box} material={MAT.frame} position={[-0.62, 1.6, -1.11]} scale={[0.72, 0.64, 0.05]} />
      <mesh geometry={GEO.box} material={MAT.window} position={[-0.62, 1.6, -1.13]} scale={[0.55, 0.48, 0.05]} />
      {/* side window on the sunlit east face */}
      <mesh geometry={GEO.box} material={MAT.frame} position={[1.31, 1.6, 0.2]} scale={[0.05, 0.64, 0.72]} />
      <mesh geometry={GEO.box} material={MAT.window} position={[1.33, 1.6, 0.2]} scale={[0.05, 0.48, 0.55]} />
      {/* porch platform + step */}
      <mesh geometry={GEO.box} material={MAT.wallDark} position={[0.35, 0.46, -1.55]} scale={[1.2, 0.1, 0.85]} castShadow />
      <mesh geometry={GEO.box} material={MAT.trim} position={[0.35, 0.2, -2.05]} scale={[0.7, 0.1, 0.35]} />
    </group>
  )
}
