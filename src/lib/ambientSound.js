// Procedural ambient focus sound — a soft, filtered noise bed with slow
// volume drift so it doesn't sit dead flat, entirely synthesized (no audio
// files to source/ship). One shared AudioContext graph, faded in/out rather
// than hard on/off so tab-switching and toggling both feel gentle.

const PREF_KEY = 'grove.ambientEnabled.v1'

export function isAmbientEnabled() {
  return localStorage.getItem(PREF_KEY) === '1'
}

export function setAmbientEnabled(enabled) {
  localStorage.setItem(PREF_KEY, enabled ? '1' : '0')
}

const TARGET_GAIN = 0.11
const FADE_IN = 1.4
const FADE_OUT = 0.5

let ctx = null
let gainNode = null

function ensureGraph() {
  if (ctx) return
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return
  ctx = new AudioCtx()

  // Brownian noise: integrate white noise for a soft, deep texture (raw
  // white noise reads as harsh static; this reads closer to wind/rain).
  const bufferSize = 4 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  noise.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 850

  gainNode = ctx.createGain()
  gainNode.gain.value = 0

  // Slow, subtle breathing so the bed doesn't feel static.
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.06
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.015
  lfo.connect(lfoGain)
  lfoGain.connect(gainNode.gain)

  noise.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(ctx.destination)

  noise.start()
  lfo.start()
}

export function startAmbient() {
  ensureGraph()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  gainNode.gain.cancelScheduledValues(ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(TARGET_GAIN, ctx.currentTime + FADE_IN)
}

export function pauseAmbient() {
  if (!ctx || !gainNode) return
  gainNode.gain.cancelScheduledValues(ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_OUT)
}

export const stopAmbient = pauseAmbient
export const resumeAmbient = startAmbient
