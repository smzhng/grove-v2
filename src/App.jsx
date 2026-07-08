import GardenCanvas from './components/GardenCanvas.jsx'
import TimerOverlay from './components/TimerOverlay.jsx'
import useGrove from './hooks/useGrove.js'

export default function App() {
  const grove = useGrove()
  return (
    <div className="relative h-full w-full">
      <GardenCanvas plants={grove.plants} session={grove.session} />
      <TimerOverlay grove={grove} />
    </div>
  )
}
