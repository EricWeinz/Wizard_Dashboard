# 🧙 Wizard Score Tracker

An interactive score tracker for the card game **Wizard** by Ken Fisher.  
Supports 3 to 6 players with a modern, mystical web interface – on one shared device
or **online, with everyone following the score live on their own phone**.

🌐 **Live:** [wizard-dashboard.vercel.app](https://wizard-dashboard.vercel.app)

---

## ✨ Features

- 3 to 6 players with custom names
- Official rules: round n is played with n cards (3 players: 20 rounds, 4: 15, 5: 12, 6: 10)
- Bidding in turn: a highlighted card at the top of the setup (and of the online lobby) asks who bids first –
  tap a name or draw at random; bids then go round the table in seat order, the start moves one seat on
  every round and the dealer bids last
- The bids may never add up to the number of cards in the round – the last bidder sees the forbidden
  number (e.g. "≠2"), and tricks can only be entered once all bids are in and valid
- Automatic point calculation per round
- Live scoreboard with animated totals
- Score progression chart
- Hit rate tracking per player
- Undo function
- Fully responsive
- 🎨 Eight switchable designs named after their colour – Violett, Orange, Türkis, Grün, Gold, Pink, a light Beige
  design in the style of the official rule book and **Dynamo** in black and yellow (like the Kniffel Dashboard):
  Dynamo Dresden crest in the headers and as favicon, stadium floodlights, a sporty font and „Abpfiff!“ on the
  winner screen; pick one on the start page or via 🎨 during the game

### 🌐 Online mode

Like the Kniffel Dashboard's online mode: one person creates a session, everybody else joins
with a **6-character code, an invite link or a QR code**. Every entry shows up on all screens
instantly (Firebase Realtime Database).

- **Everyone enters their own bid and tricks** in a bottom input bar made for phones;
  it shows who deals, whose turn it is to bid and which number the last bidder may not say
- **The host picks who bids first** in the lobby (or draws at random); the same bidding rules as on one
  device are enforced for every write, so nobody can bid out of turn or make the bids add up to the
  number of cards
- **Players without a phone** can be added by the host; anyone at the table can enter their values
- **Spectator mode** for a TV or laptop – sees everything live, isn't counted as a player
- **Live presence**, automatic reconnect after a reload, and anyone can take over as host
  when the host's phone dies (offline players' values can be filled in by the others)
- **Conflict-safe:** every write is a database transaction – nobody silently overwrites someone
  else's value, late entries from a previous game are discarded, corrections are announced to all
- Compact table layout on phones, trick-sum warnings, winner screen for everyone at once,
  rematch or back to the lobby to change players
- Sessions expire automatically 24 h after the last game start
- The local single-device mode keeps working without any setup

---

## 🛠️ Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) + [Zustand](https://zustand-demo.pmnd.rs/) (online mode only, lazy-loaded)
- Deployed via [Vercel](https://vercel.com/)

---

## 📸 Screenshots

GUI 3 players:
![3 players](https://github.com/EricWeinz/Wizard_Dashboard/blob/main/img1.png?raw=true)

GUI 6 players:
![6 players](https://github.com/EricWeinz/Wizard_Dashboard/blob/main/img2.png?raw=true)

---

## 🚀 Local Development
```bash
npm install
cp .env.example .env   # Firebase config – only needed for the online mode
npm run dev
npm test               # rules of the online mode (node --test)
```

## 📁 Project Structure
```
src/
├── App.jsx                 # Routing: login → start → local game / online mode (lazy)
├── lib/wizard.js           # Rules & scoring shared by both modes
├── lib/theme.js            # Designs (CSS variables, player palettes, logos, decorations)
├── components/             # Shared UI: GameBoard (table, cards, chart), WinnerScreen, …
└── online/
    ├── rules.js            # Pure session logic (tested)
    ├── session.js          # Firebase transactions, live subscription, presence
    ├── store.js            # Zustand store, reconnect
    └── *.jsx               # Lobby, waiting room, live game, input bar
public/                     # Dynamo Dresden crest (logo + favicon of the Dynamo design)
```
