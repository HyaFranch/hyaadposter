# HyaAdPoster

> Automated trade ad poster for [Rolimons](https://www.rolimons.com) — built with Electron + React.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0.0-accent.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey.svg)

---

## What it does

HyaAdPoster automates the process of posting trade ads on Rolimons. Instead of manually re-posting your trade every 15 minutes, the bot handles it for you — rotating through a queue of configured trades, with optional Discord webhook notifications.

**Features:**
- 🔄 Auto-posts trade ads every 15 minutes
- 📋 Profile & queue system — multiple trade setups per account
- 👥 Multi-account support
- 🔔 Discord webhook notifications (success + failure)
- 📊 Live activity log with export
- 🔐 Cookie stored locally (never leaves your machine)
- 🎨 Clean Electron desktop UI — no more Tkinter

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) 18+
- A Rolimons account with a valid `_RoliVerification` cookie

### Development
```bash
git clone https://github.com/your-org/HyaAdPoster
cd HyaAdPoster
npm install

# Run in browser (Vite dev server, no Electron):
npm run dev

# Run as desktop app (requires Electron):
npm run electron:dev
```

### Build for distribution
```bash
npm run electron:build
# Output: dist-electron/
```

---

## How to get your cookie

1. Open [rolimons.com/verify](https://www.rolimons.com/verify) and log in with your Roblox account
2. Open DevTools (F12) → Application tab → Cookies → `www.rolimons.com`
3. Copy the value of `_RoliVerification`
4. Paste it in the **Accounts** tab

> ⚠️ Your cookie is only stored locally in your browser's localStorage (or Electron's secure store in production). It is never sent anywhere except Rolimons' own API.

---

## Usage

1. **Add account** — paste your Rolimons cookie
2. **Create profile** — give it a name (e.g. "Main Trade")
3. **Add trades** — pick items from your inventory, select tags
4. **Start bot** — hit ▶ on the Dashboard

The bot cycles through the queue in order, posting each trade ad in turn, then loops. It waits 15 minutes between posts (Rolimons' cooldown).

---

## Discord Webhook

In **Settings**, paste a Discord webhook URL to receive notifications:
- ✅ Green embed when an ad posts successfully
- ⚠️ Red embed on failure or cooldown

---

## Project Structure

```
HyaAdPoster/
├── electron/          # Electron main process & preload
│   ├── main.js
│   └── preload.js
├── src/
│   ├── components/    # Shared UI primitives (Button, Modal, etc.)
│   ├── pages/         # Dashboard, Profiles, Accounts, Logs, Settings
│   ├── hooks/         # Global state (useAppState)
│   ├── utils/         # API calls, config, bot runner
│   └── styles/        # Global CSS + design tokens
├── index.html
├── vite.config.js
└── package.json
```

---

## Disclaimer

- This tool automates calls to Rolimons' public API. Use responsibly.
- Rolimons may change their API at any time, which could break functionality.
- The author is not responsible for any account actions taken by Rolimons.
- **Never share your `_RoliVerification` cookie with anyone.**

---

## License

MIT — see [LICENSE](LICENSE) for details.
