import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import PlantAsset from './PlantAsset.jsx'
import { SPEED, growthScale } from '../constants.js'

// Positions a stored plant and, while it is growing, eases its scale up in
// lockstep with the real timer via useFrame (progress is derived from wall
// clock time, so it survives reloads and stays honest).
export default function Plant({ plant, session }) {
  const group = useRef()
  const isGrowing = plant.status === 'growing' && session && session.plantId === plant.id

  useFrame(() => {
    if (!group.current) return
    let s = plant.scale
    if (isGrowing) {
      const progress = ((Date.now() - session.startedAt) * SPEED) / session.durationMs
      s = plant.scale * growthScale(progress)
    }
    group.current.scale.setScalar(s)
  })

  return (
    <group
      ref={group}
      position={[plant.x, 0, plant.z]}
      rotation={[0, plant.rotation, 0]}
      scale={plant.scale}
    >
      <PlantAsset
        tier={plant.tier}
        variationIndex={plant.variationIndex}
        isWilted={plant.status === 'wilted'}
      />
    </group>
  )
}
