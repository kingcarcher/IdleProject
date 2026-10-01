# Idle Freighter (working title)

A browser text idle game about hauling freight between the stars while the years slip past
at home. Melancholy sci-fi: loans, long silences, and the people you meant to call.

Design notes live in [docs/GameplayIdeas.txt](docs/GameplayIdeas.txt); the infrastructure plan
this repository implements is [docs/plan-idleGameInfrastructure.prompt.md](docs/plan-idleGameInfrastructure.prompt.md).

## Stack

- **TypeScript + React + Vite** — one web build covers desktop and Android browsers.
- **Vitest** — engine and content tests run in Node, no browser needed.
- **ESLint + Prettier** — `npm run check` is the single quality gate used by CI.
- **GitHub Actions → GitHub Pages** — every push to `main` deploys.

## Getting started

```sh
npm install
npm run dev        # http://localhost:5173/IdleProject/
```

| Script              | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                            |
| `npm run build`     | Typecheck + production build into `dist/`             |
| `npm run preview`   | Serve the production build locally                    |
| `npm run typecheck` | `tsc -b`                                              |
| `npm run lint`      | ESLint                                                |
| `npm run format`    | Prettier (write) — `format:check` only verifies       |
| `npm test`          | Run the test suite once (`test:watch` for watch mode) |
| `npm run check`     | typecheck + lint + format check + tests (CI gate)     |

## Architecture

```
src/
  content/   Plain data: types, ID constants, and one folder per content kind.
  engine/    Pure TypeScript game logic. No React, no DOM.
  ui/        React components and screens. Reads state, dispatches actions.
  main.tsx   Wires storage, store, tick loop and React together.
```

Dependencies flow one way only: **`ui → engine → content`**. ESLint enforces this with
`no-restricted-imports` (see [eslint.config.js](eslint.config.js)).

Key ideas:

- **State + reducer.** `GameState` is a plain object; every change goes through
  `reduce(state, action)` in [src/engine/actions.ts](src/engine/actions.ts). The save file _is_
  the state.
- **Hybrid time.** Real time only passes during journeys, delivered as `TICK { deltaMs }`
  actions, so journeys can be simulated instantly in tests and pause when the tab is hidden.
- **Time dilation.** Each journey freezes a `msPerDay` at departure from `eraDilation(day)` in
  [src/engine/journey.ts](src/engine/journey.ts): as the years pass, more in-game days go by per
  real second, while ship upgrades cut in-game days. Every run lands in a 45 s–6 min real-time band.
- **Ship's time.** While underway the player runs timed activities (maintenance, letters home,
  study, journal) that complete on an exact in-game day inside the tick, so results never depend
  on how ticks were split.
- **People who fade.** Relationships carry a `lastContactDay`; the clock applies per-character
  drift at every month boundary unless you wrote or visited. Characters have scheduled moves and
  can be relocated (or lost) by events.
- **Declarative content.** Events, jobs, bulletins, upgrades and activities are TypeScript data
  with declarative `Condition`s and `Effect`s. IDs come from [src/content/ids.ts](src/content/ids.ts)
  so typos are compile errors; [src/content/content.test.ts](src/content/content.test.ts)
  cross-checks every reference. Prose may use `{name}`, `{ship}` and `{target}` tokens.
- **Versioned saves.** `SAVE_VERSION` plus a migration chain in
  [src/engine/save.ts](src/engine/save.ts); saves live in `localStorage`. Currently v2.
- **Deterministic star map.** [src/ui/map/starfield.ts](src/ui/map/starfield.ts) seeds the
  decorative specks and their catalogue names; nothing in the game uses `Math.random`.
- **No router.** The screen is derived from `state.phase`, which avoids GitHub Pages 404s.

## Deploying

1. Create the GitHub repository **`IdleProject`** (the name must match `base` in
   [vite.config.ts](vite.config.ts)).
2. In the repository settings, set **Pages → Build and deployment → Source** to
   **GitHub Actions**.
3. Push to `main`. The `CI` workflow runs `npm run check`; the `Deploy to GitHub Pages` workflow
   builds and publishes to `https://kingcarcher.github.io/IdleProject/`.
