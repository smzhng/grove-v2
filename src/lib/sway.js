import * as THREE from 'three'

// Shared time uniform driven once per frame (see <WindTicker /> in
// GardenCanvas.jsx). Every sway material references this same object.
export const windTime = { value: 0 }

const cache = new Map()

// MeshStandardMaterial with a vertex-shader wind sway injected via
// onBeforeCompile. Displacement is a sine wave driven by uTime, scaled by a
// squared height factor: zero at the base (world Y = 0), strongest at the top
// of the model (Y > 0). Phase varies with world XZ so plants don't sway in
// lockstep.
export function swayMaterial(color, { roughness = 0.9 } = {}) {
  const key = `${color}|${roughness}`
  if (cache.has(key)) return cache.get(key)

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    flatShading: true,
  })

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windTime
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           vec4 groveWorld = modelMatrix * vec4(transformed, 1.0);
           float groveH = max(groveWorld.y, 0.0);
           float groveF = min(groveH * groveH, 12.0) * 0.014;
           float grovePhase = groveWorld.x * 0.55 + groveWorld.z * 0.55;
           transformed.x += sin(uTime * 1.35 + grovePhase) * groveF;
           transformed.z += sin(uTime * 1.05 + grovePhase * 1.3 + 1.7) * groveF * 0.55;
         }`,
      )
  }
  // Ensure distinct program per material despite shared shader source edits.
  mat.customProgramCacheKey = () => 'grove-sway'

  cache.set(key, mat)
  return mat
}
