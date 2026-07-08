import { useState } from 'react'
import GardenCanvas from './components/GardenCanvas.jsx'
import TimerOverlay from './components/TimerOverlay.jsx'
import LoadingVeil from './components/LoadingVeil.jsx'
import useGrove from './hooks/useGrove.js'

export default function App() {
  const grove = useGrove()
  const [sceneReady, setSceneReady] = useState(false)

  return (
    <div className="relative h-full w-full">
      <GardenCanvas
        plants={grove.plants}
        session={grove.session}
        onReady={() => setSceneReady(true)}
      />
      <TimerOverlay grove={grove} />
      <LoadingVeil ready={sceneReady} />
    </div>
  )
}
