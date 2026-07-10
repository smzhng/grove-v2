import { useRef, useState } from 'react'
import GardenCanvas from './components/GardenCanvas.jsx'
import TimerOverlay from './components/TimerOverlay.jsx'
import LoadingVeil from './components/LoadingVeil.jsx'
import StartMenu from './components/StartMenu.jsx'
import useGrove from './hooks/useGrove.js'

export default function App() {
  const grove = useGrove()
  // Show the start menu on open, unless a session is mid-run — then skip
  // straight to the garden so the timer is immediately visible.
  const startWithMenu = useRef(!grove.session).current
  const [entering, setEntering] = useState(false)
  const [flightDone, setFlightDone] = useState(false)
  const [menuGone, setMenuGone] = useState(!startWithMenu)
  const [sceneReady, setSceneReady] = useState(false)
  const [recenterSignal, setRecenterSignal] = useState(0)

  // Via the menu, the garden only mounts once "Enter" is clicked; the menu
  // stays up (covering the load) until the scene reports ready, then fades.
  const gardenMounted = !startWithMenu || entering

  return (
    <div className={`relative h-full w-full ${grove.placing ? 'cursor-shovel' : ''}`}>
      {gardenMounted && (
        <>
          <GardenCanvas
            plants={grove.plants}
            session={grove.session}
            onReady={() => setSceneReady(true)}
            intro={startWithMenu}
            introGo={flightDone && sceneReady}
            placing={grove.placing}
            planting={grove.planting}
            onConfirmPlacement={grove.confirmPlacement}
            onPlantingDone={grove.finishPlanting}
            recenterSignal={recenterSignal}
          />
          <TimerOverlay grove={grove} onRecenter={() => setRecenterSignal((n) => n + 1)} />
        </>
      )}
      {!startWithMenu && <LoadingVeil ready={sceneReady} />}
      {startWithMenu && !menuGone && (
        <StartMenu
          plants={grove.plants}
          entering={entering}
          fadeOut={flightDone && sceneReady}
          onEnter={() => setEntering(true)}
          onFlightDone={() => setFlightDone(true)}
          onGone={() => setMenuGone(true)}
        />
      )}
    </div>
  )
}
