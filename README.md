<div align="center">

```
███╗   ██╗███████╗██████╗ ██╗   ██╗██╗      █████╗
████╗  ██║██╔════╝██╔══██╗██║   ██║██║     ██╔══██╗
██╔██╗ ██║█████╗  ██████╔╝██║   ██║██║     ███████║
██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║██║     ██╔══██║
██║ ╚████║███████╗██████╔╝╚██████╔╝███████╗██║  ██║
╚═╝  ╚═══╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝
```

**A real-time community platform by GoatTech Industries**

[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Deployed](https://img.shields.io/badge/Deployed-Firebase%20Hosting-yellow?style=flat-square&logo=firebase&logoColor=white)](https://goattechneverdies.web.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Build Step](https://img.shields.io/badge/Build%20Step-None-success?style=flat-square)](#)

</div>

---

## 🌌 What is NEBULA?

NEBULA is a **zero-dependency, real-time web platform** for a private community. It combines live chat, direct messaging, a game vault, and an admin panel — all in a single-page app backed by **Firebase Firestore**, with no framework, no bundler, and no build step.

The UI leans hard into a deep-space aesthetic: layered CSS nebula blobs, a canvas starfield with shooting stars, and a mouse/gyroscope parallax system that gives the background genuine depth.

---

## ✨ Features

### 💬 Chat
- Real-time public channels powered by Firestore `onSnapshot`
- Password-protected private channels
- Announce-only channels (moderators post, members react)
- Emoji reactions with per-user toggle
- Message editing and soft-deletion
- `@mention` highlighting with a searchable user picker
- Live typing indicators
- Scroll-anchor preserving re-renders (no history jumps)
- "New messages" scroll-to-bottom button with unread count
- Unread badges per channel with live counts

### ✉️ Direct Messages
- 1-to-1 DMs between any approved users
- Last-message preview in the conversation list
- Unread badges that update in real time
- Typing indicators
- Emoji reactions and message editing

### 🎮 Game Vault
- Loads a game catalogue from a CDN JSON feed
- Rotating featured carousel (seeded by date — changes twice a day)
- Instant search with debounce
- Favourites with `localStorage` persistence
- `IntersectionObserver` lazy-loading for cover images
- Zone catalogue cached in `sessionStorage` (30-minute TTL)
- In-page iframe game viewer with fullscreen support
- Fetch timeout (8 s) with user-facing error feedback

### 🔗 Proxies *(restricted)*
- Category-based blurred link list — links reveal on hover
- Admin can create/delete categories and add/remove URLs

### 🔔 Notifications
- Browser Push Notifications (Notification API) with permission flow
- Per-channel subscription toggles
- DM notification toggle
- Global mute override

### 👑 Admin Panel *(moderators & admin)*
- Approve / deny pending account requests
- Ban / unban users
- Change user ranks (with role-gated restrictions, see below)
- Create / delete channels
- Wipe channel message history
- Toggle per-user proxy access

---

## 🐐 Rank System

| Rank | Badge | Who can grant it |
|---|---|---|
| 🌱 Earthbound | Default for new users | — |
| 🌍 Planetary | Basic member | Admin or Mod |
| ☀️ Solar | Trusted member | Admin or Mod |
| 🌌 Galactic | Senior member | Admin or Mod |
| ✦ Universal | Moderator | **Admin only** |
| 🐐 Goat | Site administrator | Reserved for GoatTech |

> Moderators (`Universal`) can change ranks up to **Galactic**. Only the **Goat** admin can grant or revoke the `Universal` (moderator) rank.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla ES Modules (no framework) |
| Realtime DB | Firebase Firestore (`onSnapshot`) |
| Hosting | Firebase Hosting |
| Auth | Custom SHA-256 hashed password auth (stored in Firestore) |
| Styling | Pure CSS with custom properties, no preprocessor |
| Build | **None** — files are served as-is |

---

## 📁 Project Structure

```
NEBULA/
├── public/
│   ├── rehhehehehheh.html  # Single-page app shell — all HTML
│   ├── style.css        # All styles (~900 lines, no preprocessor)
│   ├── sript.js         # App logic — Firebase, auth, chat, DMs, admin, vault
│   ├── ui.js            # Visual layer — canvas starfield + parallax nebula
│   ├── icons.js         # SVG icon library (inline, no external icon font)
│   ├── tooltips.json    # Rotating home-screen taglines
│   ├── 404.html         # Firebase Hosting 404 page
│   └── index.html       # Separate landing page (GoatTech encyclopedia)
├── firebase.json        # Hosting config
├── .firebaserc          # Firebase project alias
├── .gitignore
└── LICENSE
```

---

## 🚀 Running Locally

No install required. Just serve the `public/` folder over HTTP — ES Modules require a real server (not `file://`).

**Option A — Python**
```bash
cd public
python -m http.server 5500
# open http://localhost:5500/rehhehehehheh.html
```

**Option B — Node `serve`**
```bash
npx serve public
# open http://localhost:3000/rehhehehehheh.html
```

**Option C — VS Code Live Server**

Right-click `public/rehhehehehheh.html` → *Open with Live Server*.

> **Firebase credentials** are baked into `sript.js`. The project uses Firestore security rules — contact the admin if you need write access.

---

## 🌐 Deploying

Deployment uses the included `push.py` script, which:

1. Asks for a commit message
2. Diffs the working tree and shows only changed files
3. Obfuscates secrets and the profanity list before pushing to GitHub
4. Restores the real files locally after the push
5. Deploys the unobfuscated version to Firebase Hosting

```bash
python push.py
```

Requirements: `git`, `firebase-tools` (`npm i -g firebase-tools`), logged in via `firebase login`.

---

## 🎨 Visual Design

The space aesthetic is built from three layers:

| Layer | How it works |
|---|---|
| **CSS nebula blobs** | Three `#neb-1/2/3` `div`s with large blurred radial gradients — no images |
| **Parallax** | `ui.js → initParallax()` — mouse on desktop, `deviceorientation` on mobile, with idle sinusoidal drift when neither is active |
| **Canvas starfield** | `ui.js → initCanvas()` — 160 twinkling particles, 6 slow nebula blobs, procedural shooting stars; loop pauses when the tab is hidden |

The parallax loop respects `prefers-reduced-motion` — all motion is disabled and layers are held at their rest position.

---

## 🔐 Security Notes

- Passwords are **SHA-256 hashed client-side** before storage. This is not as strong as bcrypt — do not reuse passwords from other services.
- Session persistence stores **only the username** in `localStorage`. Rank and access are always read live from Firestore, so a tampered session cannot escalate privileges.
- The profanity filter uses word-boundary regex and is obfuscated in the public repo. It is not a substitute for moderation.
- Firestore rules control who can read and write — the client-side role checks are a UX layer, not a security boundary.

---

## 📜 License

[MIT](LICENSE) — GoatTech Industries

Readme totally not ai generated trust