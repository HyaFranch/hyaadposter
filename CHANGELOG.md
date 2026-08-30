# Changelog

All notable changes to HyaAdPoster are documented here.

---

## [2.0.0] — 2026

### Rewrite — Electron + React

Complete rewrite from Tkinter (Python) to Electron + React + Vite.

**New UI**
- Custom frameless titlebar with native window controls
- Sidebar navigation: Dashboard, Profiles, Accounts, Logs, Settings
- Live status indicator in titlebar (idle / running / stopping / expired)
- Dark navy design with accent blue and semantic colors

**Dashboard**
- Stats row: status, ads posted this session, session timer, active account
- Bot control panel with profile selector and queue preview
- Recent activity feed (last 5 log entries)

**Profiles**
- Side-by-side profile list + queue panel
- Add/rename/delete profiles
- Per-profile trade queue with drag-to-reorder (up/down buttons)
- Add/edit/remove trades with inventory picker and tag selector

**Accounts**
- Multi-account management with active account indicator
- Cookie paste flow with step-by-step instructions
- Re-verify (update cookie) without losing profiles

**Logs**
- Full live log with color-coded levels (ok / warn / error / info)
- Export to .txt
- Clear button
- Auto-scroll to latest entry

**Settings**
- Discord webhook toggle + URL input with live validation
- About section with links

**Core**
- `BotRunner` class replaces Python `BotThread` — same loop logic, pure JS
- `useAppState` React context replaces global Tkinter state
- Config persisted in localStorage (browser) / electron-store (production)
- Cookie obfuscation with base64 (browser) or DPAPI bridge (Electron, Windows)
- Item market data cached for 30 minutes (was re-fetched every dialog open)
- Batch thumbnail fetch (unchanged from v1)

---

## [1.x] — Python / Tkinter

Original single-file Python app (`HyaAdPoster.py`).
- Tkinter GUI with custom dark theme
- Multi-account, multi-profile, trade queue
- Discord webhook (pt-BR embeds)
- Cookie capture via pywebview subprocess
- DPAPI cookie encryption on Windows
