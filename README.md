 # NEBULA — Real-time Community Platform

 A compact, zero-dependency single-page app for private communities. NEBULA bundles public chat, direct messages, a game vault, and a moderator/admin panel into a single static site backed by Firebase Firestore.

 ![Firebase Firestore](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase&logoColor=white) ![MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

 Why this project exists: a fast, framework-free realtime UI that can be deployed to Firebase Hosting with no build step and minimal operational overhead.

 ---

 ## Key Features

 - Real-time public channels with live updates via Firestore `onSnapshot`
 - Password-protected private channels and announce-only channels
 - Direct messages (1:1) with unread counts and typing indicators
 - Message editing, soft-delete, and per-user emoji reactions
 - Game vault: CDN-fed catalogue, lazy-loading covers, iframe viewer
 - Admin/moderation: approve users, ban/unban, rank management, channel tools
 - Browser push notifications and per-channel subscription toggles

 ---

 ## Quickstart (local)

 Serve the `public/` folder over HTTP (ES modules require a server):

 Option A — Python
 ```bash
 cd public
 python -m http.server 5500
 # Open: http://localhost:5500/rehhehehehheh.html
 ```

 Option B — Node
 ```bash
 npx serve public
 # Open: http://localhost:3000/rehhehehehheh.html
 ```

 Option C — VS Code Live Server
 - Right-click `public/rehhehehehheh.html` → *Open with Live Server*

 Notes:
 - Firebase credentials are present in `sript.js` for the hosted demo. Firestore security rules enforce server-side access control — contact the admin for write access.

 ---

 ## Deploying

 Deployment is automated with `push.py` (included). It obfuscates secrets locally before pushing and then deploys to Firebase Hosting.

 ```bash
 python push.py
 ```

 Prerequisites: `git`, `firebase-tools` installed and authenticated (`npm i -g firebase-tools` and `firebase login`).

 ---

 ## Project layout

 public/ — Static frontend (ES modules)
 - `rehhehehehheh.html` — App shell
 - `sript.js` — App logic (Firebase, auth, chat, DMs, admin, vault)
 - `ui.js` — Visual layer (canvas starfield, parallax)
 - `style.css` — All styles (no preprocessor)

 Top-level files:
 - `firebase.json` — hosting config
 - `push.py` — deploy helper
 - `LICENSE` — MIT license

 ---

 ## Security notes

 - Passwords are hashed client-side with SHA-256 before storage (not as strong as bcrypt; avoid reusing passwords).
 - Session stores only the username locally; rank/permissions are read from Firestore.
 - Client-side checks are UX-only — Firestore security rules are the real gatekeepers.

 ---

 ## Contributing

 This is a single-developer project. If you'd like to contribute, open an issue or submit a PR with a short description of the change. For substantial changes, run the app locally to verify behavior before submitting.

 ---

 ## License

 MIT — see `LICENSE`.

 ---

 If you'd like further edits (tone, examples, or shorter/longer variants), tell me which section to focus on.