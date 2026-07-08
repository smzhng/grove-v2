const PLANTS_KEY = 'grove.plants.v1'
const SESSION_KEY = 'grove.session.v1'

export function loadPlants() {
  try {
    const raw = localStorage.getItem(PLANTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePlants(plants) {
  localStorage.setItem(PLANTS_KEY, JSON.stringify(plants))
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const s = raw ? JSON.parse(raw) : null
    if (s && typeof s.startedAt === 'number' && typeof s.durationMs === 'number' && s.plantId) {
      return s
    }
    return null
  } catch {
    return null
  }
}

export function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function resetGarden() {
  localStorage.removeItem(PLANTS_KEY)
  localStorage.removeItem(SESSION_KEY)
}
