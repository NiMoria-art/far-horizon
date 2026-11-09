# Far Horizon

Far Horizon is a browser-first prototype of a 2D space civilization sandbox. The current preview explores the five planets of the test system H-09 as the expedition AI E.O.S. Names and prototype balance remain temporary.

## Run locally

Requires Node.js 24 and npm.

```sh
npm install
npm run dev
```

Create and preview a production build with:

```sh
npm run build
npm run preview
```

Run the simulation checks with `npm test`.

## GitHub Pages

The Vite base path is configured for the `far-horizon` project repository. The workflow in `.github/workflows/deploy.yml` builds `dist` and deploys it to GitHub Pages on pushes to `main`. GitHub Pages uses **Settings → Pages → Build and deployment → GitHub Actions** as its source.

**Far Horizon Preview:** [https://nimoria-art.github.io/far-horizon/](https://nimoria-art.github.io/far-horizon/)

**Source repository:** [NiMoria-art/far-horizon](https://github.com/NiMoria-art/far-horizon)

## Exploration prototype

Tap/click a planet on the 2D map or select it from the system panel. Scanning spends energy, reveals data, awards science, advances game time, and adds an expedition log entry. Travel moves the ship between the star and planets at an energy cost. The separate technology panel contains three prototype research projects. Save data is local to the current browser and origin; clearing browser storage removes it.

On narrow screens, use the bottom navigation to switch between overview, system details, technology research, and the expedition log. The Canvas map supports pointer and touch input and resizes with its container.

The expedition can survey up to four nearby systems in the current prototype. System generation is deterministic from the save seed. New system and stellar properties are revealed gradually by observation and scanning. The ship recovers energy as game time advances; the displayed rate depends on stellar luminosity and distance. System discovery, inter-system travel, scanning, and recharge all use the same turn-based game clock. Prototype costs and generation limits are temporary.

## Project structure

Simulation, world data, DOM panels, Canvas rendering, and save storage are separate under `src/`. See [architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), [roadmap](docs/ROADMAP.md), and [status](docs/STATUS.md).

## Prototype limits

H-09 remains the starting system alongside a small, seeded set of generated systems. This prototype has no large galaxy, passive real-time simulation, production economy, colonies, population simulation, other civilizations, or Android package. Capacitor and offline service workers are not included.
