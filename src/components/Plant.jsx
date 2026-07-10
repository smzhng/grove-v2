import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import PlantAsset from './PlantAsset.jsx'
import { TIERS, SPEED, growthScale, growthEase } from '../constants.js'

const moundGeo = new THREE.SphereGeometry(1, 8, 6)
const moundMat = new THREE.MeshStandardMaterial({
  color: '#7a5b40',
  roughness: 1,
  metalness: 0,
  flatShading: true,
})

// Positions a stored plant and, while it is growing, eases its scale up in
// lockstep with the real timer via useFrame (progress is derived from wall
// clock time, so it survives reloads and stays honest). A little dirt mound
// from planting sits at the base and shrinks away as the plant matures.
export default function Plant({ plant, session }) {
  const grow = useRef()
  const mound = useRef()
  const isGrowing = plant.status === 'growing' && session && session.plantId === plant.id
  const moundRadius = 0.22 * (0.7 + TIERS[plant.tier].clearance * 0.55)

  useFrame(() => {
    if (!grow.current) return
    let s = plant.scale
    if (isGrowing) {
      const progress = ((Date.now() - session.startedAt) * SPEED) / session.durationMs
      s = plant.scale * growthScale(progress)
      if (mound.current) {
        // gone by ~85% of the session, as if the plant absorbed it
        const m = Math.max(0, 1 - growthEase(progress) / 0.85)
        mound.current.scale.set(moundRadius * m, moundRadius * 0.45 * m, moundRadius * m)
        mound.current.visible = m > 0.01
      }
    }
    grow.current.scale.setScalar(s)
  })

  return (
    <group position={[plant.x, 0, plant.z]} rotation={[0, plant.rotation, 0]}>
      <group ref={grow} scale={plant.scale}>
        <PlantAsset
          tier={plant.tier}
          variationIndex={plant.variationIndex}
          isWilted={plant.status === 'wilted'}
        />
      </group>
      {isGrowing && (
        <mesh
          ref={mound}
          geometry={moundGeo}
          material={moundMat}
          scale={[moundRadius, moundRadius * 0.45, moundRadius]}
          castShadow
        />
      )}
    </group>
  )
}
