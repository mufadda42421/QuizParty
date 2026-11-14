# Quiz Party

A free, open, multiplayer quiz game platform — create your own quizzes and play
them live with friends, students, or coworkers from any device with a browser.
Works as an installable **Progressive Web App**, requires **no accounts**, and
costs nothing to run.

## How it works

- **Create** original quizzes in the browser (stored locally on your device).
- **Host** a game: a big screen shows the questions and a 5-character room code.
- **Players join** from their phones/laptops by entering the code — no sign-up.
- The **host's browser is authoritative**: it tracks the timer, scores answers
  (speed-based), and syncs everyone peer-to-peer via WebRTC (signaled through
  the free public PeerJS broker — no game server, no database, no accounts).
- **Reports** for every finished game live in History & Reports on the host
  device: standings, winner, and per-question answer distribution.

## Tech

- React 19 + Vite
- `vite-plugin-pwa` (Workbox) — offline shell, installable
- PeerJS — WebRTC data channels between host and players
- `localStorage` — quizzes and game history (your device, your data)

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build -> dist/
npm run preview  # serve the production build
```

## Notes & limitations

- Multiplayer needs internet access (the free PeerJS signaling broker + STUN).
  Symmetric NAT/firewall setups may prevent a direct peer connection; there is
  no TURN relay because that would cost money — by design the app stays free.
- Game content syncs peer-to-peer; quiz data never leaves devices except
  between the players in your game.
- Icons are SVG; generating dedicated maskable PNG icons (192/512) is a good
  follow-up for maximal install prompt compatibility.
- Unrelated to any other quiz platform; all names and artwork are original.
