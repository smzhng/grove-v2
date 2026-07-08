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

export default function GardenCanvas({ plants, session, onReady }) {
  return (
    <Canvas
      shadows
      camera={{ position: [12, 7.5, 16], fov: 42 }}
      gl={{ antialias: true }}
      className="!absolute inset-0"
      onCreated={() => onReady?.()}
    >
      {/* warm, calm grade */}
      <color attach="background" args={['#e3e8d0']} />
      <fog attach="fog" args={['#e3e8d0', 42, 95]} />
      <ambientLight intensity={0.55} color="#fff3e0" />
      <hemisphereLight args={['#d8e8ff', '#7a9455', 0.45]} />
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
