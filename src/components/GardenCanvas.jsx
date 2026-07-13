import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { windTime } from '../lib/sway.js'
import { isSpotValid, GARDEN_RADIUS } from '../lib/placement.js'
import { TIERS } from '../constants.js'
import World from './World.jsx'
import House, { HOUSE_POSITION } from './House.jsx'
import Scenery from './Scenery.jsx'
import Plant from './Plant.jsx'
import PlantAsset from './PlantAsset.jsx'

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

const ghostValidMat = new THREE.MeshStandardMaterial({
  color: '#7fb668',
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
})
const ghostInvalidMat = new THREE.MeshStandardMaterial({
  color: '#c65540',
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
})
const dirtMat = new THREE.MeshStandardMaterial({
  color: '#7a5b40',
  roughness: 1,
  metalness: 0,
  flatShading: true,
})
const holeMat = new THREE.MeshStandardMaterial({ color: '#3e2f23', roughness: 1, metalness: 0 })
const seedMat = new THREE.MeshStandardMaterial({
  color: '#8a6a3f',
  roughness: 0.9,
  metalness: 0,
  flatShading: true,
})
const sphereGeo = new THREE.SphereGeometry(1, 8, 6)
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16)

// Translucent preview that follows the mouse during placement. Green when
// the spot is plantable, red when it isn't; click confirms.
function GhostPlanter({ placing, plants, onConfirm }) {
  const ghost = useRef()
  const ring = useRef()
  const spot = useRef(null)
  const [valid, setValid] = useState(false)
  const [hovering, setHovering] = useState(false)
  const clearance = TIERS[placing.tier].clearance

  const handleMove = (e) => {
    const { x, z } = e.point
    const v = isSpotValid(x, z, placing.tier, plants)
    spot.current = { x, z, v }
    if (ghost.current) ghost.current.position.set(x, 0, z)
    if (ring.current) ring.current.position.set(x, 0.03, z)
    if (v !== valid) setValid(v)
    if (!hovering) setHovering(true)
  }

  return (
    <>
      {/* invisible raycast target covering the whole garden area */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.005, 0]}
        onPointerMove={handleMove}
        onPointerOut={() => setHovering(false)}
        onClick={() => {
          if (spot.current?.v) onConfirm(spot.current.x, spot.current.z)
        }}
      >
        <circleGeometry args={[GARDEN_RADIUS + 5, 48]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={ghost} visible={hovering} rotation={[0, placing.rotation, 0]} scale={placing.scale}>
        <PlantAsset
          tier={placing.tier}
          variationIndex={placing.variationIndex}
          isWilted={false}
          overrideMaterial={valid ? ghostValidMat : ghostInvalidMat}
        />
      </group>
      <mesh ref={ring} visible={hovering} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[clearance * 0.85, clearance, 32]} />
        <meshBasicMaterial
          color={valid ? '#4a6b3f' : '#a03d2e'}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// The planting ritual at the chosen spot: a hole opens and dirt clods pop
// out, a seed drops from the sky into it, then the dirt covers back over
// into a little mound. Fires onDone once the mound has settled — that's
// when the session actually starts.
function PlantingFX({ planting, onDone }) {
  const t = useRef(0)
  const done = useRef(false)
  const hole = useRef()
  const seed = useRef()
  const mound = useRef()
  const clods = useRef([])
  const f = 0.7 + TIERS[planting.tier].clearance * 0.55
  const moundR = 0.22 * f
  const clodDirs = useMemo(
    () => [0.4, 2.5, 4.6].map((a) => [Math.cos(a), Math.sin(a)]),
    [],
  )

  useFrame((_, delta) => {
    if (done.current) return
    t.current += delta
    const T = t.current

    // hole: open (0-0.3s), hold, close (0.95-1.45s)
    const holeS =
      T < 0.3 ? T / 0.3 : T < 0.95 ? 1 : Math.max(0, 1 - (T - 0.95) / 0.5)
    if (hole.current) {
      hole.current.scale.set(0.3 * f * holeS, 0.03, 0.3 * f * holeS)
      hole.current.visible = holeS > 0.01
    }

    // dirt clods: arc out with the dig, sink away as the hole closes
    clods.current.forEach((c, i) => {
      if (!c) return
      const [dx, dz] = clodDirs[i]
      const u = Math.min(T / 0.3, 1)
      const rest = 0.45 * f
      c.position.set(dx * u * rest, Math.sin(u * Math.PI) * 0.3 * f + 0.03, dz * u * rest)
      const shrink = T < 0.95 ? 1 : Math.max(0, 1 - (T - 0.95) / 0.5)
      c.scale.setScalar(0.07 * f * shrink)
      c.visible = shrink > 0.01
    })

    // seed: falls from the sky (0.3-0.95s), buried once the dirt covers it
    if (seed.current) {
      const u = Math.min(Math.max((T - 0.3) / 0.65, 0), 1)
      seed.current.position.y = 0.05 + (7 - 0.05) * (1 - u * u)
      seed.current.visible = T >= 0.3 && T < 1.2
    }

    // mound: rises as the hole closes
    const mS = T < 0.95 ? 0 : Math.min((T - 0.95) / 0.5, 1)
    if (mound.current) {
      mound.current.scale.set(moundR * mS, moundR * 0.45 * mS, moundR * mS)
      mound.current.visible = mS > 0.01
    }

    if (T >= 1.75) {
      done.current = true
      onDone?.()
    }
  })

  return (
    <group position={[planting.x, 0, planting.z]}>
      <mesh ref={hole} geometry={cylGeo} material={holeMat} position={[0, 0.015, 0]} />
      {clodDirs.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (clods.current[i] = el)}
          geometry={sphereGeo}
          material={dirtMat}
          castShadow
        />
      ))}
      <mesh
        ref={seed}
        geometry={sphereGeo}
        material={seedMat}
        scale={[0.06 * f, 0.09 * f, 0.06 * f]}
        visible={false}
        castShadow
      />
      <mesh ref={mound} geometry={sphereGeo} material={dirtMat} visible={false} castShadow />
    </group>
  )
}

// Default resting view, expressed as an orbit around the garden center so
// the entry sweep can end exactly on it: [12, 7.5, 16] = angle ~0.927 rad,
// radius 20 in the XZ plane.
const ORBIT_TARGET = new THREE.Vector3(0, 0.8, 0)
const REST_ANGLE = Math.atan2(16, 12)
const REST_RADIUS = 20
const REST_Y = 7.5
const INTRO_SWEEP = 1.2 // extra radians the entry sweep starts back from
const INTRO_SECONDS = 5

export function introStartPosition() {
  const a = REST_ANGLE + INTRO_SWEEP
  return [Math.cos(a) * REST_RADIUS, REST_Y + 3, Math.sin(a) * REST_RADIUS]
}

// Entry sweep when arriving via the start menu: a slow orbit around the
// garden that eases into the default view, then hands off to OrbitControls.
function IntroRig({ go, onDone }) {
  const t = useRef(0)
  const done = useRef(false)
  useFrame((state, delta) => {
    if (!go || done.current) return
    t.current = Math.min(t.current + delta / INTRO_SECONDS, 1)
    const p = t.current
    const e = 1 - Math.pow(1 - p, 3)
    const angle = REST_ANGLE + INTRO_SWEEP * (1 - e)
    state.camera.position.set(
      Math.cos(angle) * REST_RADIUS,
      REST_Y + 3 * (1 - e),
      Math.sin(angle) * REST_RADIUS,
    )
    state.camera.lookAt(ORBIT_TARGET)
    if (p >= 1) {
      done.current = true
      onDone?.()
    }
  })
  return null
}

const REST_POSITION = new THREE.Vector3(12, 7.5, 16)

// Eye-level view of a growing plant: height and distance scale with the
// tier's clearance radius so small sprouts aren't viewed from a giant's eye
// and grand trees aren't viewed from inside their own trunk. The camera
// sits a little above its own look-height so it stays within the orbit
// controls' polar-angle range instead of landing exactly horizontal.
function plantFocusPose(plant) {
  const clearance = TIERS[plant.tier].clearance
  const eyeY = 0.6 + clearance * 0.5
  const radius = 1.8 + clearance * 1.2
  const angle = 0.6
  return {
    target: new THREE.Vector3(plant.x, eyeY, plant.z),
    camPos: new THREE.Vector3(
      plant.x + Math.cos(angle) * radius,
      eyeY + radius * 0.22,
      plant.z + Math.sin(angle) * radius,
    ),
  }
}

// Close-up view of the house: a three-quarter angle from the path side, so
// the sunlit east face and the porch both read (dead-on south is in shadow).
const HOUSE_VIEW_POSITION = new THREE.Vector3(HOUSE_POSITION[0] + 5.5, 3.4, HOUSE_POSITION[2] - 6.3)
const HOUSE_VIEW_TARGET = new THREE.Vector3(HOUSE_POSITION[0], 1.6, HOUSE_POSITION[2])

// Eases the camera to a destination pose when `signal` changes (a simple
// incrementing counter from the parent). Takes over from OrbitControls for
// the duration, then hands control back with the orbit pivot moved too.
// Used for both "recenter view" and "look at the house".
function FlyToRig({ signal, camPos, lookAt, controlsRef, setEnabled }) {
  const t = useRef(0)
  const active = useRef(false)
  const prevSignal = useRef(signal)
  const start = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (signal !== prevSignal.current && !active.current) {
      prevSignal.current = signal
      active.current = true
      t.current = 0
      start.current.copy(state.camera.position)
      if (controlsRef.current) startTarget.current.copy(controlsRef.current.target)
      setEnabled(false)
    }
    if (!active.current) return
    t.current = Math.min(t.current + delta / 1.1, 1)
    const e = 1 - Math.pow(1 - t.current, 3)
    state.camera.position.lerpVectors(start.current, camPos, e)
    target.current.lerpVectors(startTarget.current, lookAt, e)
    state.camera.lookAt(target.current)
    if (controlsRef.current) controlsRef.current.target.copy(target.current)
    if (t.current >= 1) {
      active.current = false
      setEnabled(true)
    }
  })
  return null
}

// Google-Earth-style pan bounds: keeps the orbit pivot within a radius of
// world center (so "fly" never wanders past the mountain ring) and pinned
// to a fixed height (screen-space panning would otherwise drag it up into
// the sky). Runs after OrbitControls' own update each frame.
const MAX_TARGET_RADIUS = 48
function PanBoundsRig({ controlsRef, active, homeY = ORBIT_TARGET.y }) {
  useFrame(() => {
    if (!active) return
    const controls = controlsRef.current
    if (!controls) return
    const t = controls.target
    let changed = false
    const r = Math.hypot(t.x, t.z)
    if (r > MAX_TARGET_RADIUS) {
      const s = MAX_TARGET_RADIUS / r
      t.x *= s
      t.z *= s
      changed = true
    }
    if (Math.abs(t.y - homeY) > 0.01) {
      t.y = homeY
      changed = true
    }
    if (changed) controls.update()
  })
  return null
}

// After a stretch of no input, slowly auto-orbits the camera around the
// current pivot (Y-axis only, radius/height preserved) so an idle garden
// still feels alive. Any pointer/wheel activity resets the idle clock and
// hands control straight back to OrbitControls.
const IDLE_DELAY = 30 // seconds of no input before drift starts
const IDLE_SPEED = 0.025 // radians/sec
function IdleDriftRig({ controlsRef, active }) {
  const idleFor = useRef(0)
  useEffect(() => {
    if (!active) return
    const reset = () => {
      idleFor.current = 0
    }
    window.addEventListener('pointerdown', reset)
    window.addEventListener('pointermove', reset)
    window.addEventListener('wheel', reset)
    return () => {
      window.removeEventListener('pointerdown', reset)
      window.removeEventListener('pointermove', reset)
      window.removeEventListener('wheel', reset)
    }
  }, [active])
  useFrame((state, delta) => {
    if (!active) return
    idleFor.current += delta
    if (idleFor.current < IDLE_DELAY) return
    const controls = controlsRef.current
    if (!controls) return
    const cam = state.camera
    const t = controls.target
    const dx = cam.position.x - t.x
    const dz = cam.position.z - t.z
    const angle = IDLE_SPEED * delta
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    cam.position.x = t.x + dx * cos - dz * sin
    cam.position.z = t.z + dx * sin + dz * cos
    controls.update()
  })
  return null
}

export default function GardenCanvas({
  plants,
  session,
  onReady,
  intro = false,
  introGo = false,
  placing = null,
  planting = null,
  onConfirmPlacement,
  onPlantingDone,
  recenterSignal = 0,
}) {
  const [introDone, setIntroDone] = useState(!intro)
  const [controlsEnabled, setControlsEnabled] = useState(!intro)
  const [houseSignal, setHouseSignal] = useState(0)
  // While inspecting the house the orbit pivot sits on it, so the zoom-out
  // leash shrinks — otherwise "zoom out" retreats deep into the treeline.
  const [focusHouse, setFocusHouse] = useState(false)
  const controlsRef = useRef()
  useEffect(() => {
    if (recenterSignal > 0) {
      setFocusHouse(false)
      setSessionFocused(false)
    }
  }, [recenterSignal])

  // While a session is running, the camera flies to eye-level with the
  // growing plant and orbits it (still overridable by drag/zoom, same as
  // idle drift, which naturally continues orbiting whatever the current
  // pivot is). Fires on a fresh plant right after PlantingFX finishes, and
  // also on mount if a session is already active (resumed from a reload).
  const [focusPlant, setFocusPlant] = useState(null)
  const [sessionFocused, setSessionFocused] = useState(false)
  const [plantFocusSignal, setPlantFocusSignal] = useState(0)
  const [homeSignal, setHomeSignal] = useState(0)
  const prevSessionId = useRef(session?.plantId ?? null)
  useEffect(() => {
    const id = session?.plantId ?? null
    if (id && id !== prevSessionId.current) {
      const plant = plants.find((p) => p.id === id)
      if (plant) {
        setFocusPlant(plant)
        setSessionFocused(true)
        setPlantFocusSignal((n) => n + 1)
      }
    } else if (!id && prevSessionId.current) {
      setSessionFocused(false)
      setHomeSignal((n) => n + 1)
    }
    prevSessionId.current = id
  }, [session, plants])
  const plantPose = useMemo(() => (focusPlant ? plantFocusPose(focusPlant) : null), [focusPlant])
  return (
    <Canvas
      shadows
      camera={{ position: intro ? introStartPosition() : [12, 7.5, 16], fov: 42 }}
      gl={{ antialias: true }}
      className="!absolute inset-0"
      onCreated={({ camera, scene }) => {
        camera.lookAt(ORBIT_TARGET)
        // dev helper, same spirit as window.__groveReset
        window.__groveDebug = { camera, scene }
        onReady?.()
      }}
    >
      {/* warm, calm grade under a blue gradient sky */}
      <Sky />
      <fog attach="fog" args={['#ddecf6', 45, 105]} />
      <ambientLight intensity={0.55} color="#fff3e0" />
      <hemisphereLight args={['#cbe2f7', '#a89369', 0.6]} />
      <directionalLight
        castShadow
        position={[14, 20, 9]}
        intensity={1.7}
        color="#ffe6bd"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />

      <World />
      <House
        onFocus={() => {
          setFocusHouse(true)
          setHouseSignal((n) => n + 1)
        }}
        disabled={!!placing}
      />
      <Scenery />
      {plants.map((p) => (
        <Plant key={p.id} plant={p} session={session} />
      ))}
      {placing && (
        <GhostPlanter placing={placing} plants={plants} onConfirm={onConfirmPlacement} />
      )}
      {planting && (
        <PlantingFX key={`${planting.x},${planting.z}`} planting={planting} onDone={onPlantingDone} />
      )}

      <WindTicker />
      {intro && !introDone && (
        <IntroRig
          go={introGo}
          onDone={() => {
            setIntroDone(true)
            setControlsEnabled(true)
          }}
        />
      )}
      {introDone && (
        <>
          <FlyToRig
            signal={recenterSignal}
            camPos={REST_POSITION}
            lookAt={ORBIT_TARGET}
            controlsRef={controlsRef}
            setEnabled={setControlsEnabled}
          />
          <FlyToRig
            signal={houseSignal}
            camPos={HOUSE_VIEW_POSITION}
            lookAt={HOUSE_VIEW_TARGET}
            controlsRef={controlsRef}
            setEnabled={setControlsEnabled}
          />
          {plantPose && (
            <FlyToRig
              signal={plantFocusSignal}
              camPos={plantPose.camPos}
              lookAt={plantPose.target}
              controlsRef={controlsRef}
              setEnabled={setControlsEnabled}
            />
          )}
          <FlyToRig
            signal={homeSignal}
            camPos={REST_POSITION}
            lookAt={ORBIT_TARGET}
            controlsRef={controlsRef}
            setEnabled={setControlsEnabled}
          />
        </>
      )}
      <PanBoundsRig
        controlsRef={controlsRef}
        active={controlsEnabled}
        homeY={sessionFocused && plantPose ? plantPose.target.y : ORBIT_TARGET.y}
      />
      <IdleDriftRig controlsRef={controlsRef} active={controlsEnabled} />
      <OrbitControls
        ref={controlsRef}
        enabled={controlsEnabled}
        enableDamping
        dampingFactor={0.08}
        enablePan
        panSpeed={0.7}
        screenSpacePanning={false}
        minDistance={sessionFocused ? 1.2 : 5}
        maxDistance={sessionFocused ? 9 : focusHouse ? 10 : 22}
        maxPolarAngle={sessionFocused ? Math.PI * 0.5 : Math.PI * 0.46}
        target={ORBIT_TARGET}
      />
    </Canvas>
  )
}
