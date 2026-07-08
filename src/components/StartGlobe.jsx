import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { windTime } from '../lib/sway.js'
import PlantAsset from './PlantAsset.jsx'

/*
 * The start-menu globe: a little planet whose top dome carries a hand-placed
 * "end-game" garden — what an accumulated Grove can look like. It spins
 * slowly; plants sway with the same wind shader as the real garden. Built
 * from the same PlantAsset placeholders, so it upgrades automatically when
 * real models arrive.
 *
 * On "Enter the garden" the camera flies forward and down over the dome like
 * an airplane on final approach while the planet rolls toward the viewer;
 * the menu then fades straight into the real garden.
 */

const R = 26
// The entity catalog below was laid out for an R=8 globe; this rescales the
// polar angles so arc distances stretch across the bigger, flatter dome.
const POLAR_SCALE = 0.7
const UP = new THREE.Vector3(0, 1, 0)

// Pose for an entity standing on the sphere surface.
// polar = angle from the top pole, azimuth = angle around it.
function surfacePose(rawPolar, azimuth, yaw = 0) {
  const polar = rawPolar * POLAR_SCALE
  const n = new THREE.Vector3(
    Math.sin(polar) * Math.cos(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.sin(azimuth),
  )
  const q = new THREE.Quaternion().setFromUnitVectors(UP, n)
  q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw))
  const p = n.clone().multiplyScalar(R)
  return { position: [p.x, p.y, p.z], quaternion: q }
}

// Hand-placed showcase garden: [tier, variationIndex, polar, azimuth, scale]
const SHOWCASE_PLANTS = [
  ['hero', 1, 0.2, 0.55, 0.5],
  ['hero', 8, 0.34, 3.3, 0.42],
  ['large', 2, 0.3, 4.45, 0.48],
  ['large', 4, 0.5, 5.05, 0.42],
  ['large', 5, 0.52, 1.3, 0.4],
  ['medium', 5, 0.33, 1.55, 0.55],
  ['medium', 0, 0.47, 3.75, 0.55],
  ['medium', 4, 0.58, 2.9, 0.5],
  ['small', 2, 0.24, 5.95, 0.55],
  ['small', 3, 0.52, 0.35, 0.55],
  ['small', 6, 0.62, 4.15, 0.5],
  ['sprout', 4, 0.42, 6.15, 0.6],
  ['sprout', 0, 0.63, 0.95, 0.6],
  // outer ring — fills the far side that rolls into view during the landing
  ['large', 1, 0.85, 3.6, 0.46],
  ['hero', 3, 0.75, 4.6, 0.45],
  ['large', 3, 0.95, 5.5, 0.44],
  ['medium', 1, 0.7, 5.9, 0.5],
  ['small', 0, 0.8, 4.1, 0.55],
  ['medium', 3, 0.85, 2.2, 0.5],
  ['small', 1, 0.9, 0.2, 0.55],
  ['large', 2, 0.78, 1.75, 0.42],
  ['sprout', 2, 0.7, 3.05, 0.6],
  ['small', 4, 0.68, 2.55, 0.5],
]

// [polar, azimuth, scale]
const ROCKS = [
  [0.55, 3.05, 0.5],
  [0.28, 1.9, 0.3],
  [0.62, 0.75, 0.38],
  [0.8, 5.2, 0.42],
  [0.72, 0.35, 0.3],
  [0.95, 3.3, 0.5],
]
const PEBBLES = [
  [0.42, 2.6, 0.12],
  [0.58, 5.0, 0.1],
  [0.25, 4.3, 0.09],
  [0.5, 5.9, 0.14],
  [0.75, 1.1, 0.11],
  [0.88, 4.4, 0.13],
  [0.68, 3.4, 0.1],
  [0.82, 6.0, 0.12],
]
const PETALS = [
  [0.2, 3.8],
  [0.5, 2.0],
  [0.35, 5.0],
  [0.65, 0.9],
  [0.45, 4.6],
  [0.75, 2.7],
  [0.85, 5.7],
  [0.7, 4.9],
  [0.92, 1.5],
]

const GEO = {
  rock: new THREE.SphereGeometry(1, 5, 4),
  disc: new THREE.CylinderGeometry(1, 1.1, 1, 7),
  box: new THREE.BoxGeometry(1, 1, 1),
}
const flat = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, flatShading: true })
const MAT = {
  gray: flat('#9a958a'),
  grayDark: flat('#837e73'),
  sand: flat('#cabd9f'),
  sandDark: flat('#b5a88b'),
  petal: flat('#e3a2ba'),
  petalDeep: flat('#d2789c'),
}

function Globe({ flying }) {
  const spin = useRef()

  useFrame((state, delta) => {
    if (spin.current) {
      spin.current.rotation.y += delta * 0.06
      // during the landing, the ground rolls toward the viewer
      if (flying) spin.current.rotation.x += delta * 0.15
    }
    windTime.value = state.clock.elapsedTime
  })

  // Stepping-stone path arcing over the pole.
  const pathDiscs = useMemo(() => {
    const discs = []
    for (let s = -5; s <= 5; s++) {
      const polar = 0.07 + Math.abs(s) * 0.105
      const az = 5.6 + (s < 0 ? Math.PI : 0) + s * 0.05
      discs.push({ pose: surfacePose(polar, az, s * 0.9), even: (s + 5) % 2 === 0 })
    }
    return discs
  }, [])

  return (
    <group position={[0, -R + 6, 0]}>
      <group ref={spin}>
        <mesh receiveShadow>
          <sphereGeometry args={[R, 48, 32]} />
          <meshStandardMaterial color="#6fa350" roughness={1} metalness={0} flatShading />
        </mesh>

        {SHOWCASE_PLANTS.map(([tier, vi, polar, az, s], i) => {
          const pose = surfacePose(polar, az, i * 1.7)
          return (
            <group key={i} position={pose.position} quaternion={pose.quaternion} scale={s * 1.2}>
              <PlantAsset tier={tier} variationIndex={vi} isWilted={false} />
            </group>
          )
        })}

        {pathDiscs.map(({ pose, even }, i) => (
          <mesh
            key={`p${i}`}
            castShadow
            receiveShadow
            geometry={GEO.disc}
            material={even ? MAT.sand : MAT.sandDark}
            position={pose.position}
            quaternion={pose.quaternion}
            scale={[0.5, 0.06, 0.44]}
          />
        ))}

        {ROCKS.map(([polar, az, s], i) => {
          const pose = surfacePose(polar, az, i * 2.3)
          return (
            <mesh
              key={`r${i}`}
              castShadow
              receiveShadow
              geometry={GEO.rock}
              material={i % 2 === 0 ? MAT.gray : MAT.grayDark}
              position={pose.position}
              quaternion={pose.quaternion}
              scale={[s * 1.3, s * 0.9, s * 1.1]}
            />
          )
        })}
        {PEBBLES.map(([polar, az, s], i) => {
          const pose = surfacePose(polar, az, i)
          return (
            <mesh
              key={`e${i}`}
              castShadow
              geometry={GEO.rock}
              material={i % 2 === 0 ? MAT.grayDark : MAT.gray}
              position={pose.position}
              quaternion={pose.quaternion}
              scale={[s * 1.3, s * 0.8, s * 1.1]}
            />
          )
        })}
        {PETALS.map(([polar, az], i) => {
          const pose = surfacePose(polar, az, i * 1.3)
          return (
            <mesh
              key={`t${i}`}
              geometry={GEO.box}
              material={i % 2 === 0 ? MAT.petal : MAT.petalDeep}
              position={pose.position}
              quaternion={pose.quaternion}
              scale={[0.12, 0.015, 0.08]}
            />
          )
        })}
      </group>
    </group>
  )
}

// Airplane-landing camera path: forward over the dome, descending onto it,
// nose easing down toward the horizon. Fires onDone partway through so the
// fade to the real garden starts before touchdown; the flight keeps playing
// underneath the fade.
const CAM_START = new THREE.Vector3(0, 9, 30)
const CAM_END = new THREE.Vector3(0, 7.5, 2)
const LOOK_START = new THREE.Vector3(0, 6, 0)
const LOOK_END = new THREE.Vector3(0, 4.2, -10)
const FLY_SECONDS = 2.0
const FADE_AT = 0.68

function FlightRig({ flying, onDone }) {
  const t = useRef(0)
  const fired = useRef(false)
  const look = useRef(new THREE.Vector3())
  useFrame((state, delta) => {
    if (!flying || t.current >= 1) return
    t.current = Math.min(t.current + delta / FLY_SECONDS, 1)
    const p = t.current
    const e = 1 - Math.pow(1 - p, 3) // ease-out: swoop in, settle onto the surface
    state.camera.position.lerpVectors(CAM_START, CAM_END, e)
    look.current.lerpVectors(LOOK_START, LOOK_END, e)
    state.camera.lookAt(look.current)
    if (p >= FADE_AT && !fired.current) {
      fired.current = true
      onDone?.()
    }
  })
  return null
}

export default function StartGlobe({ flying, onFlightDone }) {
  return (
    <Canvas
      shadows
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 9, 30], fov: 35 }}
      onCreated={({ camera }) => camera.lookAt(0, 6, 0)}
    >
      <ambientLight intensity={0.6} color="#fff3e0" />
      <hemisphereLight args={['#cbe2f7', '#a89369', 0.5]} />
      <directionalLight
        castShadow
        position={[10, 18, 8]}
        intensity={1.5}
        color="#ffe6bd"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />
      <Globe flying={flying} />
      <FlightRig flying={flying} onDone={onFlightDone} />
    </Canvas>
  )
}
