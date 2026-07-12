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

const TAB_ALIVE_KEY = 'grove.tabAlive.v1'

// sessionStorage survives a reload but is wiped when a tab is closed, so it
// doubles as a "is this the same tab as before" signal: true only before the
// first time markTabAlive() has run in a given tab (a fresh tab, or one
// reopened after close). Read-only and side-effect-free so it's safe to call
// from a useState lazy initializer, which React (StrictMode) may invoke more
// than once per mount.
export function peekFreshTab() {
  return !sessionStorage.getItem(TAB_ALIVE_KEY)
}

// Call once per mount (from an effect, not a lazy initializer) to record
// that this tab has been seen.
export function markTabAlive() {
  sessionStorage.setItem(TAB_ALIVE_KEY, '1')
}
