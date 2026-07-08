import { useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { windTime } from '../lib/sway.js'
import Ground from './Ground.jsx'
import Scenery from './Scenery.jsx'
import Plant from './Plant.jsx'

// Drives the shared wind uniform for every sway material, once per frame.
function WindTicker() {
  useFrame((state) => {
    windTime.value = state.clock.elapsedTime
  })
  return null
}

// Gradient sky: deeper blue overhead fading to a pale horizon, rendered to a
// small canvas strip and used as the scene background.
function Sky() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, '#7fb2d9')
    grad.addColorStop(0.55, '#abd0e9')
    grad.addColorStop(1, '#e3f0f7')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 2, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
  return <primitive attach="background" object={texture} />
}

export default function GardenCanvas({ plants, session, onReady }) {
  return (
    <Canvas
      shadows
      camera={{ position: [12, 7.5, 16], fov: 42 }}
      gl={{ antialias: true }}
      className="!absolute inset-0"
      onCreated={() => onReady?.()}
    >
      {/* warm, calm grade under a blue gradient sky */}
      <Sky />
      <fog attach="fog" args={['#ddecf6', 42, 95]} />
      <ambientLight intensity={0.55} color="#fff3e0" />
      <hemisphereLight args={['#cbe2f7', '#a89369', 0.6]} />
      <directionalLight
        castShadow
        position={[14, 20, 9]}
        intensity={1.7}
        color="#ffe6bd"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />

      <Ground />
      <Scenery />
      {plants.map((p) => (
        <Plant key={p.id} plant={p} session={session} />
      ))}

      <WindTicker />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={5}
        maxDistance={45}
        maxPolarAngle={Math.PI * 0.46}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  )
}
