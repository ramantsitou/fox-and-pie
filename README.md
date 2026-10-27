# Foxes & Pie

A browser game by Jan and Martin: place traps and protect the pie from foxes, wolves, bears, and hares. Features include Russian, English, and Dutch interfaces, alternating player turns, sound effects, trap upgrades, and a mobile layout.

Live site: https://fox-pie-yanchik-martin.freshflame33.chatgpt.site

## Development

Requires Node.js 22 or newer. There are no third-party dependencies.

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run package:sites
```

- `index.html` — the application interface, styles, translations, and game logic.
- `sw.js` — the PWA's offline cache.
- `manifest.webmanifest` and `icons/` — app installation settings and icons.
- `tests/game.test.cjs` — game rules, turn changes, bosses, upgrades, translations, and PWA event handlers.
- `tests/fullscreen.test.cjs` — Android fullscreen entry, hiding navigation controls, browser permission failures, and user-initiated exits.
- `tests/responsive-update.test.cjs` — filling the available screen, touch accuracy, automatic PWA updates, and progress preservation.
- `tests/sw.test.cjs` — service worker installation, caching, offline startup, and scope boundaries.
- `tests/build.test.mjs` — build contents, cache version updates, and rejection of invalid source files.
- `scripts/build.mjs` — validates the source and builds `dist/`. The cache version depends on the game's contents, so a changed build updates the PWA cache.
- `.openai/hosting.json` — the existing Sites project ID and the `dist` output directory. This is neither a secret nor a deployment credential.

For regular play, open the source HTML file directly. PWA features require HTTPS or localhost. After building, publish the contents of `dist/` while preserving the directory structure. See `INSTALL.txt` for installation details.

## Board size and installed PWA updates

On phones, the board fills the available area to the left of the shop. Horizontal and vertical scaling adjust independently, so cells may be rectangular. The canvas accounts for screen pixel density. Touch coordinates are calculated from its actual dimensions, including manual rotation.

The app checks for a new service worker when it opens, when the player returns to it, and once a minute while it is running. A new version activates only after the complete offline cache has downloaded successfully. The page waits until the current wave ends before restarting. Before the restart, it saves the level, player, pie, traps, coins, and speed settings in sessionStorage. The new page restores them. If the browser blocks sessionStorage, the game does not restart automatically, to avoid losing progress.

This behavior starts working after the player first opens a version that includes it. A closed PWA is not guaranteed to update immediately: it checks when it next opens or the player returns to it. Internet access is needed to download a new version, not for regular offline play.

## GitHub Actions

`.github/workflows/ci.yml` runs for pull requests targeting `main`, pushes to `main` (including merges), and manual runs.

The sequence is: install from the lockfile → tests → build → Sites archive → GitHub Actions artifact. If a step fails, later steps do not run. Pull request runs do not use secrets or repository write permissions.

The resulting archive is `artifacts/fox-and-pie-sites.tar.gz`. It contains `.openai/hosting.json` and the built `dist/` directory. The archive uses standard tar/gzip without third-party packages.

## Automatic publication status

**Automatic publication from GitHub Actions to the existing ChatGPT Site is not connected.**

The Sites tools available in this session provide authenticated operations to save versions and publish them. No permanent CI credential, deployment webhook, or GitHub Actions integration for the existing site has been provided. A short-lived source repository write token is not a deployment credential and cannot be used as a permanent GitHub Secret.

The workflow therefore tests and builds the game, but does not present an artifact upload as a site publication. Each workflow run explicitly states this in its summary.

The existing site can currently be updated through an authenticated ChatGPT/Codex session: push the verified source commit to the source repository for the same Sites project, save the matching version with its archive, and publish it through Sites. A GitHub SHA cannot simply be substituted for the SHA of the Sites source branch.

Fully automatic deployment to the same address requires a supported Sites authentication mechanism for CI. If that mechanism becomes available or is provided by the platform owner, add a separate publication step after testing and building. No migration to another host or address has been performed here.
