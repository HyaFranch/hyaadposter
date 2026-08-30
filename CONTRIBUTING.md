# Contributing to HyaAdPoster

Thanks for wanting to help! Here's everything you need to get started.

---

## Development setup

### Prerequisites
- Node.js 18 or newer
- npm 9+
- Git

### First-time setup

```bash
git clone https://github.com/your-org/HyaAdPoster
cd HyaAdPoster
npm install
```

### Run in browser (fastest)

No Electron required — the full UI runs in your browser via Vite:

```bash
npm run dev
# → http://localhost:5173
```

All features work except native window controls (minimize/maximize/close).
Cookie encryption falls back to base64 in the browser build.

### Run as desktop app

Requires Electron to be installed (it's a dev dependency):

```bash
npm run electron:dev
```

This starts Vite, waits for it, then launches Electron pointing at localhost.

---

## Project layout

```
src/
├── components/
│   ├── Sidebar.jsx      # Left navigation
│   ├── Titlebar.jsx     # Frameless titlebar + window controls
│   └── ui.jsx           # Primitive components: Button, Input, Modal, Card, etc.
├── hooks/
│   └── useAppState.js   # Global React context: config, accounts, bot control
├── pages/
│   ├── Dashboard.jsx    # Bot start/stop + live stats
│   ├── Profiles.jsx     # Profile & queue management
│   ├── Accounts.jsx     # Account add / re-verify
│   ├── Logs.jsx         # Full live log output
│   └── Settings.jsx     # Webhook + app info
├── utils/
│   ├── api.js           # All Roblox + Rolimons + Discord API calls
│   ├── botRunner.js     # The posting loop (BotRunner class)
│   └── config.js        # localStorage persistence + cookie protect/unprotect
└── styles/
    └── globals.css      # CSS design tokens + base reset

electron/
├── main.js              # BrowserWindow creation + IPC handlers
└── preload.js           # Secure bridge: window controls, shell.openExternal
```

---

## How the bot loop works

`BotRunner` (in `src/utils/botRunner.js`) is a plain ES class — not a Web Worker — so it runs in the renderer thread. The loop is:

1. Resolve the username → user ID via Roblox API
2. Fetch the avatar URL for Discord embeds
3. `while (running)`: pick the next trade in the queue, call `postAd()`, log the result, send a Discord embed if configured, wait 15 minutes via a cancellable `sleep()`, repeat

`stop()` cancels the sleep timer and sets `running = false`. The loop exits cleanly at the next iteration boundary.

---

## Adding a new page

1. Create `src/pages/YourPage.jsx`
2. Add it to the `PAGES` map in `src/App.jsx`
3. Add a nav entry in `src/components/Sidebar.jsx`

---

## Design system

All colors, spacing, and radii are CSS custom properties defined in `src/styles/globals.css`. Use them — never hardcode hex values in components.

Key tokens:
```css
--bg, --bg-elevated       /* background layers */
--surface, --surface-2    /* card surfaces */
--text, --text-muted      /* text */
--accent                  /* primary blue */
--success, --warning, --danger
--font-sans, --font-mono
--r, --r-sm, --r-lg       /* border radii */
```

Primitive UI components live in `src/components/ui.jsx`:
`Button`, `Input`, `Card`, `Modal`, `Toggle`, `Badge`, `Alert`, `EmptyState`, `Stat`, `PageHeader`

---

## Submitting changes

1. Fork the repo and create a branch: `git checkout -b fix/my-fix`
2. Make your changes
3. Test in both browser (`npm run dev`) and Electron (`npm run electron:dev`) if your change touches IPC or native APIs
4. Open a PR with a clear description of what changed and why

### Good first issues

- [ ] Add item thumbnail images to the trade queue rows
- [ ] Add a "test webhook" button in Settings
- [ ] Persist the last selected profile across restarts
- [ ] Add keyboard shortcut (Space) to start/stop the bot
- [ ] i18n support (the codebase already has some pt-BR strings)

---

## Reporting bugs

Open an issue with:
- Your OS and Node.js version
- Steps to reproduce
- What you expected vs. what happened
- Console errors if any (DevTools → Console)

---

## Code style

- Functional React components, hooks for state
- No TypeScript (yet) — plain JS with JSDoc comments for complex functions
- CSS-in-JS via inline `style={{}}` for component-specific styles, globals.css for tokens
- No external UI libraries — all components are hand-built in `ui.jsx`
