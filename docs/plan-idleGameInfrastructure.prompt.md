# Plan: Browser Text Idle Game — Infrastructure & Skeleton

**TL;DR:** Build a single TypeScript web app with **Vite + React**, a strictly separated **pure game engine** (no DOM), **TypeScript data modules** for story content, **Vitest** for tests, and **GitHub Actions → GitHub Pages** for free hosting. The browser build covers Windows/Mac/Linux/Android at once; a PWA plugin later makes it installable. The whole toolchain is ~6 dev dependencies and one `npm run check` command.

**Why this stack**

- Browser-first + Android/Mac/Linux → web tech is the only option that needs no ports. Text + buttons needs no game engine (Godot/Phaser would be overhead).
- Vite's `react-ts` template gives TS, React, ESLint and hot-reload in one command — the least setup that still counts as professional.
- The "deterministic, many simultaneous timed events" design maps perfectly onto a **state + reducer** engine: the save file _is_ the state, and every rule is unit-testable without a browser.
- Hybrid time is handled by treating real-time ticks as just another action (`TICK { deltaMs }`), so journeys can be simulated instantly in tests and paused when the tab closes.

---

## Steps

### Phase 0 — Environment (blocks everything)

1. Install Node.js LTS and Git (via `winget` or installers). Configure git `user.name`/`user.email`.
2. Move the project to a non-synced folder (e.g. `C:\dev\IdleProject`); OneDrive + `node_modules` causes sync thrash and lock errors.
3. Install VS Code extensions: ESLint, Prettier. Create the GitHub repository (empty), keep the repo name handy for the Vite `base` path.

### Phase 1 — Scaffold (_depends on 0_)

4. `npm create vite@latest` with the `react-ts` template into the project folder; `git init`, commit, push.
5. Add Prettier and Vitest; add npm scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`, and `check` (runs typecheck + lint + format check + test — the single CI gate).
6. Add project hygiene files: `.vscode/settings.json` (format on save) + `extensions.json`, `.editorconfig`, `.gitattributes` (LF line endings), `.gitignore`, `README.md`. Set `@/` path alias and Vite `base: '/<repo-name>/'`. Move `GameplayIdeas.txt` into `docs/`.

### Phase 2 — Architecture skeleton (_depends on 1_; engine/content/ui can be built in parallel once `content/types.ts` exists)

7. **`src/content/`** — `types.ts` (defs for Location, Character, Job, Event, Upgrade, Bulletin, plus a _declarative_ condition union: `flagSet`, `relationshipAtLeast`, `moneyAtLeast`, `eventCompleted`, `dateBetween`), `ids.ts` (const ID objects so typos are compile errors), one folder per content kind, and `index.ts` building keyed registries. Placeholder content only: home planet, the bar, the robot bartender, one freight job, one timed side event, one bulletin.
8. **`src/engine/`** — pure TS, no React/DOM imports:
   - `state.ts`: `GameState` (phase: `station | journey | bar`, calendar date, money, loan, ship, relationships, flags, completed events, event log) + `createInitialState()`.
   - `actions.ts`: discriminated `Action` union + `reduce(state, action)`; all mutations go through here.
   - `time.ts`: in-game calendar math (days → months/years, formatting).
   - `economy.ts`: loan interest per period, payment, bankruptcy check (game-over condition).
   - `journey.ts`: `TICK` handling — converts real ms → in-game time using job distance/ship speed; arrival transition.
   - `events.ts`: availability evaluation (location + time window + conditions) and choice resolution/effects; expiry of missed events.
   - `save.ts`: `SAVE_VERSION`, serialize/deserialize, migration chain, `localStorage` adapter.
   - `store.ts`: `getState()`, `dispatch()`, `subscribe()`; autosave (debounced) on dispatch.
9. **`src/ui/`** — React: `useGame()` hook via `useSyncExternalStore`; shared components (`StatusBar`, `Panel`, `ChoiceList`, `TextLog`); screens `StationScreen`, `JourneyScreen`, `BarScreen`, `MapScreen`. Current screen derived from `state.phase` — **no router** (avoids GitHub Pages 404 issues). Plain CSS with custom properties for the melancholy palette.
10. **`src/main.tsx`** — load save or create initial state → create store → render `App`; start a `requestAnimationFrame`/interval loop that dispatches `TICK` only while `phase === 'journey'` and the tab is visible.
11. Add an ESLint `no-restricted-imports` override so `src/engine/**` and `src/content/**` cannot import `react`/`react-dom`/`src/ui` — enforces the one-way `ui → engine → content` dependency.

### Phase 3 — Tests (_parallel with step 9/10 once engine exists_)

12. Engine unit tests: reducer determinism (same actions → identical state), calendar math, loan interest/bankruptcy, journey `TICK` conversion and arrival, event window open/close/expiry, save round-trip + a migration.
13. Content integrity test: walks registries and asserts every referenced ID exists, `availableFrom < availableUntil`, no duplicate IDs, every event reachable at some location.

### Phase 4 — CI/CD (_depends on 1; can be done before Phase 2 finishes_)

14. `.github/workflows/ci.yml`: on push/PR → `npm ci` → `npm run check`.
15. `.github/workflows/deploy.yml`: on push to `main` → build → `actions/upload-pages-artifact` → `actions/deploy-pages`. Set repo Pages source to "GitHub Actions".

### Phase 5 — Later (not part of initial setup)

16. `vite-plugin-pwa` for installable/offline on Android; save export/import as JSON file; optional Preact swap via `@preact/preset-vite`.

---

## Relevant files

(all new; paths relative to the moved project root)

- `package.json` — scripts listed in step 5; devDeps: `vite`, `typescript`, `@vitejs/plugin-react`, `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks` (from template), `prettier`, `vitest`.
- `vite.config.ts` — `base`, `@/` alias, `test` block for Vitest (node environment).
- `eslint.config.js` — template config + `no-restricted-imports` guard (step 11) + Prettier compatibility.
- `src/engine/*`, `src/content/*`, `src/ui/*`, `src/main.tsx` — as in steps 7–10.
- `.github/workflows/ci.yml`, `deploy.yml` — steps 14–15.
- `docs/GameplayIdeas.txt` — moved from `GameplayIdeas.txt`; later add `docs/ARCHITECTURE.md` stating the layering rules.

## Verification

1. `node -v` and `git --version` print versions; `npm run dev` opens the app at `localhost:5173`.
2. `npm run check` passes (typecheck, lint, format, tests). `npm run build && npm run preview` serves the production build at the configured base path.
3. Push to `main` → both Actions workflows green → game loads at `https://<user>.github.io/<repo>/`; open on an Android phone browser and confirm it plays.
4. End-to-end placeholder loop: station → accept job → journey screen ticks in real time → arrival → timed event appears/expires correctly → bar screen. Reload page → state persists from `localStorage`.
5. Negative test: change one character ID in a content file to a typo → `npm run test` fails on the integrity test; TypeScript also flags it if using `ids.ts` constants.
6. Determinism test: dispatching the same action sequence (including `TICK` deltas) twice yields deep-equal states.

## Decisions

- TypeScript + React (via Vite template); no Redux/Zustand — `useSyncExternalStore` over the engine store is sufficient.
- Content = TypeScript data modules with `satisfies` typing; conditions are declarative data, not inline functions (keeps content inspectable and serializable).
- Saves in `localStorage` with a versioned schema; a save is just the serialized `GameState`.
- Hybrid time: real-time ticks only during journeys; journey **pauses** while the tab is closed (simplest, exploit-free). Because ticks carry `deltaMs`, capped offline catch-up can be added later with one change in `main.tsx`.
- Plain CSS, no Tailwind/UI kit. No router. npm, not pnpm/yarn.
- **Excluded:** real narrative content and balancing, art/audio, Tauri/Electron/Capacitor, backend or cloud saves, analytics, custom domain, i18n.

## Further Considerations

1. **Offline progress on journeys** — Option A: pause (recommended to start). Option B: capped catch-up (e.g. max 8 real hours) on load. Decide when journeys' real-time lengths are tuned.
2. **Content authoring ergonomics** — TS modules are great for a solo dev; if content volume balloons, a small script can later export/import JSON without changing the engine, since defs are already plain data.
3. **Save-slot strategy** — single autosave slot to start (recommended); the "many runs to see everything" design may later want a run history/codex stored alongside the save.
