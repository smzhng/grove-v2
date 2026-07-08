# Grove

A calm, diorama-style 3D productivity timer. Pick a focus duration, and a
plant grows in a persistent garden over the real session length. Finish the
session and the plant stays forever; leave early and it wilts instead
(staying in the garden as a dead plant, not deleted). Over time your
accumulated focus becomes a garden you can orbit and look back on.

Stack: Vite + React + `@react-three/fiber`/`drei` + Tailwind v4. No backend —
everything persists to `localStorage`. Dev server: `npm run dev`
(`.claude/launch.json` lets it pick any free port).

## Locked design decisions — do not relitigate these without asking

- **Sessions survive reload/tab-close.** Timing is timestamp-based
  (`startedAt` + `durationMs` in `localStorage`), not a running interval, so
  closing the tab and coming back mid-session just resumes correctly.
  Returning *after* the duration already elapsed marks the plant complete.
  Only the explicit in-app "Give up" → "Let it wilt" flow wilts a plant.
- **No pause button.** Strictly complete-or-cancel.
- **Wilted plants persist forever.** No delete UI. The only reset path is
  the console helper `window.__groveReset()`.
- **Hidden dev speed-up**: append `?speed=N` to the URL to make sessions run
  N× faster (shows a small "dev speed ×N" badge). Useful for testing growth/
  completion/wilt without waiting hours.
- **Plant visuals are placeholder primitives**, isolated entirely in
  `src/components/PlantAsset.jsx` (cones/spheres/cylinders/boxes only). That
  file has a commented-out map of the real GLTF filenames it should
  eventually load — **do not add `GLTFLoader` or any `three/examples/jsm`
  import until explicitly asked to.** Same goes for `src/components/
  Scenery.jsx` (decorative rocks/pebbles/path/petals — also placeholders).

## Where things live

- `src/hooks/useGrove.js` — all session/timer/persistence state and logic.
- `src/lib/placement.js` — scatter algorithm (per-tier clearance, keeps a
  hardcoded winding path clear, relaxes clearance if the garden gets full).
- `src/lib/sway.js` — the wind vertex-shader (`onBeforeCompile`), shared by
  every plant material via one time uniform.
- `src/constants.js` — tier definitions, growth-stage naming, friendly plant
  names, formatting helpers.
- `src/components/GardenCanvas.jsx` — the r3f `<Canvas>`, lighting, gradient
  sky, camera/orbit controls.
- `src/components/TimerOverlay.jsx` — the Tailwind UI on top of the canvas
  (tier picker, running session card w/ progress ring, toasts).

## History and provenance

This is v2 of Grove. v1 (`github.com/smzhng/grove`, no "2" — different repo,
same owner) was built as a single ~1200-line file with no component split,
which made it hard to extend — v2 exists mainly to rebuild it with a proper
component/hook structure. Several of v1's look-and-feel details (the serif/
sans font pairing, the "Tending the garden…" loading screen, the gradient
sky) were good and have already been ported over; v1 is worth diffing
against when porting more, but don't assume its architecture is right for
this codebase.

GitHub remote for this project: `github.com/smzhng/grove-v2.git` (remote
name in this local clone is `newaccount`; there's also a stale `origin`
pointing at a different account — ignore it unless told otherwise).

## Working conventions

- **Ask before building.** This project's owner wants clarifying questions
  asked and answered *before* new features get implemented, not after —
  including scope questions on ambiguous requests. Default assumptions are
  fine to state, but wait for explicit go-ahead on anything nontrivial.
- **Commit messages: lowercase, plain English, minimal.** e.g. "initial
  commit", "added a nice blue sky", "growth stages and friendly plant
  names". Add a `Co-Authored-By: Claude ...` trailer only on genuinely big/
  complex commits — small polish/config commits get no trailer.
- Verify UI changes in an actual running preview before calling them done
  (this is a visual/3D app — type-checking isn't enough).

## Backlog (nothing here is approved to build — ask first)

Remaining ports from the old `grove` repo:
- Real GLTF model loading (the old repo's actual pipeline is a good
  reference: `GLTFLoader` + `import.meta.glob` asset resolution + fallback
  to placeholder on load failure) + real decoration models.
- An explicit "still growing, resume or abandon?" modal on returning to a
  mid-session tab — note this conflicts with the locked silent-auto-resume
  decision above, so it needs a deliberate yes, not a default one.

Bigger speculative ideas from a brainstorm (all much larger in scope, none
approved): separate gardens per project/context (the strongest of these),
a walkable avatar, a sit-and-meditate "energy flows into the plant" ritual,
storylines/unlockable characters (tension: the original brief explicitly
did not want this to feel like "a gamified slot machine"), shared/
multiplayer co-working gardens (would require a backend + accounts —
reverses the current no-accounts/local-only design), and an eventual
desktop app (Tauri, once the web version is solid).
