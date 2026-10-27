# Foxes & Pie

Created by my son **Jan** and his friend **Martin** through **vibe coding**, turning their ideas into a playable game with AI assistance.

A browser game by Jan and Martin: place traps and protect the pie from foxes, wolves, bears, and hares. Features include Russian, English, and Dutch interfaces, alternating player turns, sound effects, trap upgrades, and a mobile layout.

Live site: https://ramantsitou.github.io/fox-and-pie/

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
- `tests/responsive-update.test.cjs` — proportional screen fitting, touch accuracy, automatic PWA updates, and progress preservation.
- `tests/sw.test.cjs` — service worker installation, caching, offline startup, and scope boundaries.
- `tests/build.test.mjs` — build contents, cache version updates, and rejection of invalid source files.
- `scripts/build.mjs` — validates the source and builds `dist/`. The cache version depends on the game's contents, so a changed build updates the PWA cache.
- `.openai/hosting.json` — the existing Sites project ID and the `dist` output directory. This is neither a secret nor a deployment credential.

For regular play, open the source HTML file directly. PWA features require HTTPS or localhost. After building, publish the contents of `dist/` while preserving the directory structure. See `INSTALL.txt` for installation details.

## Language, fullscreen, and installed PWA updates

On first launch, the interface follows the browser’s preferred supported language (Russian, English, or Dutch), including regional variants. If none matches, it uses English. A language chosen in the menu is saved and takes priority on later visits.

The installed PWA requests fullscreen landscape mode at launch. On phones in a regular browser, the first ready/start gesture requests immersive fullscreen; browser restrictions may prevent it. There is no fullscreen menu button.

On phones, the board fits the largest possible 14:10 rectangle in the available area to the left of the shop, keeping cells square and artwork proportional. Mobile controls use short labels with complete accessible names, a single-line coin balance, and a two-column settings menu. Installation help is collapsed. The workshop and settings scroll independently, including touch scrolling after manual rotation. Gameplay notices use larger temporary messages; routine turn instructions stay in the handoff dialog. On desktop, the workshop scrolls within the available height. The canvas accounts for screen pixel density. Touch coordinates are calculated from its actual dimensions, including manual rotation.

The app checks for a new service worker when it opens, when the player returns to it, and once a minute while it is running. A new version activates only after the complete offline cache has downloaded successfully. The page waits until the current wave ends before restarting. Before the restart, it saves the level, player, pie, traps, coins, and speed settings in sessionStorage. The new page restores them. If the browser blocks sessionStorage, the game does not restart automatically, to avoid losing progress.

This behavior starts working after the player first opens a version that includes it. A closed PWA is not guaranteed to update immediately: it checks when it next opens or the player returns to it. Internet access is needed to download a new version, not for regular offline play.

## GitHub Actions and deployment

`.github/workflows/ci.yml` runs for pull requests targeting `main`, pushes to `main` (including merges), and manual runs.

The sequence is: install from the lockfile → tests → build → upload the Pages artifact → deploy to GitHub Pages. The deployment job depends on successful verification and runs only for `main`, never for pull requests. A failed test or build prevents publication. Only the deployment job receives `pages: write` and `id-token: write`; pull requests have read-only repository access. No personal deployment token is required.

The site is published from the contents of `dist/` at:

https://ramantsitou.github.io/fox-and-pie/

The app's manifest, service worker, and icon paths are relative, so the `/fox-and-pie/` project-site path works for installation and offline play. The `github-pages` environment links to each deployment. In repository settings, Pages uses **GitHub Actions** as its publishing source.

### Moving from the previous Sites address

The previous site was hosted at https://fox-pie-yanchik-martin.freshflame33.chatgpt.site. It is not updated by this workflow. GitHub Pages is now the deployment target.

If you installed the PWA from the old address, open the new GitHub Pages address and install it again once. The old installation cannot change its origin automatically. Future updates are downloaded from GitHub Pages; you do not need to reinstall for each release. Browser storage and existing game progress do not transfer between the two origins.

### Optional legacy Sites packaging

`scripts/package-sites.mjs`, the `npm run package:sites` command, and `.openai/hosting.json` remain available for legacy compatibility, but they are not part of the GitHub Pages deployment workflow. GitHub Actions does not publish to ChatGPT Sites.
