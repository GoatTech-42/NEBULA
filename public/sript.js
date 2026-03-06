// script.js — NEBULA core (Firebase, auth, state, chat, DMs, admin, proxies, vault, UI)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { initCanvas, initParallax } from "./ui.js";

const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const REFS = {
  accounts : doc(db,"nebula","accounts"),
  threads  : doc(db,"nebula","threads"),
  messages : doc(db,"nebula","messages"),
  dms      : doc(db,"nebula","dms"),
  proxies  : doc(db,"nebula","proxies"),
  config   : doc(db,"nebula","config"),
  typing   : doc(db,"nebula","typing"),
};

const ADMIN_USERNAME   = "__ADMIN_USERNAME__";
const ADMIN_PASSWORD   = "__ADMIN_PASSWORD__";
const ADMIN_NAME       = "__ADMIN_NAME__";
const MAX_CHANNEL_MSGS = 75;
const MAX_DM_MSGS      = 100;
const MAX_MSG_LEN      = 500;
const WARN_MSG_LEN     = 400;
const WRITE_DELAY      = 320;
const TYPING_TTL       = 4000;
window.addEventListener('beforeunload', () => {
  if(activeThread) clearTyping(activeThread.id, false);
  if(activeDM)     clearTyping(activeDM, true);
});
const ZONE_URLS = [
  "https://cdn.jsdelivr.net/%67%68/%67%6e%2d%6d%61%74%68/%61%73%73%65%74%73@%6d%61%69%6e/%7a%6f%6e%65%73%2e%6a%73%6f%6e",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@master/zones.json",
];
const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_URL  = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const EMOJIS    = ['👍','💔','😂','😭','🤯','🔥','😃','🥀','👀','💀'];
const PROFANITY = ['\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x32','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x39\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x39\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x38','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x39\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x32','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x30\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x39','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x31\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x31\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x31\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x39\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x39\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x31\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x32\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x34','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x34','\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x31\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x37\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x36\x5c\x78\x33\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x35\x5c\x78\x36\x33\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x37\x5c\x78\x33\x38\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x36\x5c\x78\x35\x63\x5c\x78\x37\x38\x5c\x78\x33\x33\x5c\x78\x33\x35'];
const DEFAULT_THREADS = [
  {id:'general',       name:'general',       emoji:'💬', password:'', locked:false, announceOnly:false},
  {id:'announcements', name:'announcements', emoji:'📢', password:'', locked:false, announceOnly:true},
];
const RANKS       = ['earthbound','planetary','solar','galactic','universal'];
const RANK_LABELS = {
  earthbound:'🌱 Earthbound', planetary:'🌍 Planetary', solar:'☀️ Solar',
  galactic:'🌌 Galactic',    universal:'✦ Universal',   goat:'🐐 Goat'
};

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let currentUser    = null;
let DB             = { accounts:{}, threads:[], messages:{}, dms:{}, proxies:[], config:{}, typing:{} };
let activeSection  = 'home';
let activeThread   = null;
let activeDM       = null;
let unreadThreads  = {};
let unreadDMs      = {};
let rateLogs       = [];
let dmRateLogs     = [];
let pdel           = {ctx:null, idx:null, isDM:false};
let rankTarget     = null;
let pendingThread  = null;
let atBottom       = true;
let newMsgCount    = 0;
let switching      = false;
let msgWriteTimer  = null, pendingMsgWrite = null;
let dmWriteTimer   = null, pendingDMWrite  = null;
let typingTimer    = null;
let tsRefreshTimer = null;
let gameObserver   = null;
let zones = [], gameFavs = JSON.parse(localStorage.getItem('gn-favs')||'[]');
let showFavsOnly = false, vaultQuery = '';
let featuredGames = [], carouselIdx = 0, carouselTimer = null, carouselPause = null, carouselBusy = false;
let popularityData = {};
let vaultSortBy = 'popular';

// The game viewer iframe — may be recreated on close like GhostLink
let zoneFrame = null;
let zoneFrameIsDynamic = false;

const NOTIF_KEY          = 'nebula-notif-prefs';
const getNotifPrefs      = () => { try{ return JSON.parse(localStorage.getItem(NOTIF_KEY)||'{}'); }catch{ return {}; } };
const saveNotifPrefsData = p => localStorage.setItem(NOTIF_KEY, JSON.stringify(p));

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
const deb = (fn, w) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), w); }; };

const filt = t => {
  PROFANITY.forEach(w => {
    const rx = new RegExp('(?<![a-z0-9])' + w.split('').join('[^a-z0-9]*') + '(?![a-z0-9])', 'gi');
    t = t.replace(rx, '*'.repeat(w.length));
  });
  return t;
};

const hashPass = async p => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
};

const userColor = u => {
  let h = 0; for(let i = 0; i < u.length; i++) h = u.charCodeAt(i) + ((h << 5) - h);
  const c = [
    'linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)','linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#30cfd0,#330867)',
    'linear-gradient(135deg,#ff9a9e,#fecfef)','linear-gradient(135deg,#ffecd2,#fcb69f)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)','linear-gradient(135deg,#ff6e7f,#bfe9ff)'
  ];
  return c[Math.abs(h) % c.length];
};

const avatarLetter   = u => (u||'?').charAt(0).toUpperCase();
const isMod          = u => u && (u.username === ADMIN_USERNAME || u.rank === 'universal' || u.rank === 'goat');
const isAdmin        = u => u && (u.isAdmin || u.rank === 'goat');
const canAccessGames = u => u && (u.isAdmin || u.rank !== 'earthbound');
const canAccessProxy = u => u && (u.proxyAccess || u.isAdmin) && u.rank !== 'earthbound';

const rankBadge = r => {
  r = r || 'earthbound';
  return `<span class="rbadge ${r}">${RANK_LABELS[r]||r}</span>`;
};
const rankColorText = r => ({
  earthbound:'#6ee7b7', planetary:'#38bdf8', solar:'#f59e0b',
  galactic:'#a855f7',   universal:'#e2e8f0', goat:'#fde68a'
}[r] || '#38bdf8');

// Return an ISO timestamp string (UTC) for server-agnostic exact time storage
const tsNow = () => new Date().toISOString();
const dmKey = (a, b) => [a, b].sort().join('__');

// Parse various timestamp types into a JS Date
function parseTS(ts){
  if(!ts) return null;
  // Firestore Timestamp-like (has toDate)
  if(typeof ts === 'object' && typeof ts.toDate === 'function') return ts.toDate();
  // number (epoch ms)
  if(typeof ts === 'number') return new Date(ts);
  // ISO string or other date string
  try{ return new Date(ts); }catch{ return null; }
}

// Short time like "2:34 PM"
function formatShortTime(ts){
  const d = parseTS(ts); if(!d) return '';
  return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

// Date label used between message groups: Today, Yesterday, or formatted date
function formatDateLabel(ts){
  const d = parseTS(ts); if(!d) return '';
  const now = new Date();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thenMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((nowMid - thenMid) / 86400000);
  if(diffDays === 0) return 'Today';
  if(diffDays === 1) return 'Yesterday';
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(d.getFullYear() === now.getFullYear()) return `${M[d.getMonth()]} ${d.getDate()}`;
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Human-friendly relative time (minutes/hours/days)
function relTime(ts){
  const d = parseTS(ts); if(!d) return '';
  const now = new Date();
  const diff = now - d; // ms
  const mins = Math.floor(diff/60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs/24);
  if(days === 1) return `Yesterday at ${formatShortTime(ts)}`;
  if(days < 7) return `${days} days ago`;
  // fallback to date
  return formatDateLabel(ts) + ' at ' + formatShortTime(ts);
}

const renderMentions = escText => escText.replace(/@([a-z0-9_\-]+)/gi, (m, u) => {
  const isMe = currentUser && u.toLowerCase() === currentUser.username.toLowerCase();
  return `<span class="mention${isMe?' mine':''}">${m}</span>`;
});

/* ══════════════════════════════════════════
   CLEAN HTML (GhostLink-style ad/injector removal)
══════════════════════════════════════════ */
function cleanHTML(html) {
  html = html.replace(/#sidebarad1\s*,\s*\n?#sidebarad2[\s\S]*?\.sidebar-frame\s*\{[\s\S]*?\}/g, '');
  html = html.replace(/<div\s+id=["']sidebarad[12]["'][^>]*>[\s\S]*?<\/div>\s*(<\/div>)?/g, '');
  html = html.replace(/<script>\s*\(function\(_0x[a-f0-9]+[\s\S]*?duplace\.ne[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style>[^<]*#sidebarad[\s\S]*?<\/style>/g, '');
  return html;
}

/* ══════════════════════════════════════════
   NOTIFY
══════════════════════════════════════════ */
function notify(msg, type = 'info'){
  const n = document.createElement('div');
  n.className = `notif ${type}`;
  n.innerHTML = `<div class="notif-dot"></div><div class="nmsg">${msg}</div>`;
  document.getElementById('notif-stack').appendChild(n);
  setTimeout(() => {
    n.style.transition = 'opacity .18s ease,transform .18s ease';
    n.style.opacity    = '0';
    n.style.transform  = 'translateX(12px)';
    setTimeout(() => n.remove(), 200);
  }, 2600);
}

/* ══════════════════════════════════════════
   MODALS
══════════════════════════════════════════ */
function openModal(id){
  document.getElementById('modal-overlay').classList.remove('hidden','closing');
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.querySelector('.modal-box')?.classList.remove('closing');
}

function closeModal(id){
  const el = document.getElementById(id); if(!el) return;
  const box = el.querySelector('.modal-box');
  if(box) box.classList.add('closing');
  setTimeout(() => {
    el.classList.add('hidden');
    if(!document.querySelector('.modal:not(.hidden)')){
      const ov = document.getElementById('modal-overlay');
      ov.classList.add('closing');
      setTimeout(() => { ov.classList.add('hidden'); ov.classList.remove('closing'); }, 200);
    }
  }, 180);
}

// showConfirm: reusable async confirm dialog that returns a boolean
function showConfirm(message, title = 'Confirm'){
  return new Promise((resolve) => {
    const modalId = 'confirm-modal';
    const titleEl = document.getElementById('confirm-title');
    const msgEl   = document.getElementById('confirm-msg');
    const okBtn   = document.getElementById('confirm-accept');
    const noBtn   = document.getElementById('confirm-cancel');
    if(!msgEl || !okBtn || !noBtn || !titleEl){ resolve(window.confirm(message)); return; }
    titleEl.textContent = title;
    msgEl.textContent = message;
    // cleanup handlers
    const cleanup = () => {
      okBtn.onclick = null; noBtn.onclick = null;
      closeModal(modalId);
    };
    okBtn.onclick = (e) => { e.stopPropagation(); cleanup(); resolve(true); };
    noBtn.onclick = (e) => { e.stopPropagation(); cleanup(); resolve(false); };
    openModal(modalId);
  });
}

window.closeTopModal = () => {
  const o = document.querySelector('.modal:not(.hidden)'); if(o) closeModal(o.id);
};

/* ══════════════════════════════════════════
   RATE LIMITING
══════════════════════════════════════════ */
function checkRate(logs, user){
  const now = Date.now(), win = 60000;
  const limit = user?.username === ADMIN_USERNAME ? 200 : isMod(user) ? 40 : 10;
  while(logs.length && now - logs[0] > win) logs.shift();
  if(logs.length >= limit){ const wait = Math.ceil((win - (now - logs[0])) / 1000); return { ok:false, wait }; }
  logs.push(now);
  return { ok:true };
}

/* ══════════════════════════════════════════
   WRITE SCHEDULERS
══════════════════════════════════════════ */
function scheduleMsgWrite(data){
  pendingMsgWrite = data; clearTimeout(msgWriteTimer);
  msgWriteTimer = setTimeout(async () => { if(pendingMsgWrite) await setDoc(REFS.messages, pendingMsgWrite); pendingMsgWrite = null; }, WRITE_DELAY);
}

function scheduleDMWrite(data){
  pendingDMWrite = data; clearTimeout(dmWriteTimer);
  dmWriteTimer = setTimeout(async () => { if(pendingDMWrite) await setDoc(REFS.dms, pendingDMWrite); pendingDMWrite = null; }, WRITE_DELAY);
}

/* ══════════════════════════════════════════
   TYPING INDICATOR
══════════════════════════════════════════ */
async function broadcastTyping(ctx, isDM){
  if(!currentUser) return;
  const key = isDM ? `dm_${dmKey(currentUser.username, ctx)}` : `ch_${ctx}`;
  const now = Date.now();
  try{
    await setDoc(REFS.typing, { ...(DB.typing||{}), [key]:{ ...((DB.typing||{})[key]||{}), [currentUser.username]:now } });
  }catch{}
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => clearTyping(ctx, isDM), TYPING_TTL);
}

async function clearTyping(ctx, isDM){
  if(!currentUser) return;
  const key = isDM ? `dm_${dmKey(currentUser.username, ctx)}` : `ch_${ctx}`;
  try{
    const entry = { ...((DB.typing||{})[key]||{}) };
    delete entry[currentUser.username];
    await setDoc(REFS.typing, { ...(DB.typing||{}), [key]:entry });
  }catch{}
}

function renderTypingBar(ctx, isDM, barId){
  const bar = document.getElementById(barId); if(!bar || !currentUser) return;
  const key = isDM ? `dm_${dmKey(currentUser.username, ctx)}` : `ch_${ctx}`;
  const entry = (DB.typing||{})[key] || {};
  const now = Date.now();
  const typers = Object.entries(entry)
    .filter(([u, t]) => u !== currentUser.username && now - t < TYPING_TTL)
    .map(([u]) => u);
  if(!typers.length){ bar.innerHTML = ''; return; }
  const names = typers.length > 2
    ? `${typers.slice(0,-1).join(', ')} and ${typers[typers.length-1]}`
    : typers.join(' and ');
  bar.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div><span>${esc(names)} ${typers.length === 1 ? 'is' : 'are'} typing…</span>`;
}

/* ══════════════════════════════════════════
   BROWSER NOTIFICATIONS
══════════════════════════════════════════ */
function pushBrowserNotif(title, body, tag){
  const prefs = getNotifPrefs();
  if(prefs.muteAll || Notification.permission !== 'granted') return;
  try{ new Notification(title, { body, tag, icon:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌌</text></svg>" }); }catch{}
}

document.getElementById('notif-perm-btn')?.addEventListener('click', async () => {
  const r = await Notification.requestPermission();
  updateNotifPermUI();
  if(r === 'granted') notify('Notifications enabled','success');
  else if(r === 'denied') notify('Blocked — check site settings','warning');
});

function updateNotifPermUI(){
  const perm = Notification.permission;
  const btn  = document.getElementById('notif-perm-btn');
  const stat = document.getElementById('notif-perm-status');
  if(!btn || !stat) return;
  if(perm === 'granted'){
    btn.textContent = 'Enabled ✓'; btn.disabled = true;
    stat.textContent = '✓ Active'; stat.className = 'nsc-status granted';
  } else if(perm === 'denied'){
    btn.textContent = 'Blocked'; btn.disabled = true;
    stat.textContent = '✕ Blocked — allow in site settings'; stat.className = 'nsc-status denied';
  } else {
    btn.textContent = 'Enable'; btn.disabled = false;
    stat.textContent = 'Click to allow'; stat.className = 'nsc-status default';
  }
}

window.saveNotifPrefs = () => {
  const prefs = getNotifPrefs();
  prefs.dms     = document.getElementById('ntog-dms')?.checked  || false;
  prefs.muteAll = document.getElementById('ntog-mute')?.checked || false;
  prefs.channels = prefs.channels || {};
  document.querySelectorAll('.cnr-checkbox').forEach(cb => { prefs.channels[cb.dataset.tid] = cb.checked; });
  saveNotifPrefsData(prefs);
  notify('Preferences saved','success');
};

function renderNotifSection(){
  updateNotifPermUI();
  const prefs = getNotifPrefs();
  const dt = document.getElementById('ntog-dms');
  const mt = document.getElementById('ntog-mute');
  if(dt) dt.checked = prefs.dms    || false;
  if(mt) mt.checked = prefs.muteAll || false;
  renderNotifChannels();
}

function renderNotifChannels(){
  const el = document.getElementById('notif-channel-list'); if(!el) return;
  el.innerHTML = '';
  const prefs = getNotifPrefs();
  const subs  = prefs.channels || {};
  getThreads().forEach(t => {
    const row = document.createElement('div');
    row.className = 'channel-notif-row';
    row.innerHTML = `<span class="cnr-icon">${esc(t.emoji||'💬')}</span>
      <div style="flex:1"><div class="cnr-name">#${esc(t.name)}</div>
      <div class="cnr-sub">${t.announceOnly ? 'Announcements' : 'Community channel'}</div></div>
      <label class="toggle-switch"><input type="checkbox" class="cnr-checkbox" data-tid="${esc(t.id)}" onchange="saveNotifPrefs()" ${subs[t.id]?'checked':''}><span class="toggle-track"></span></label>`;
    el.appendChild(row);
  });
}

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    ['signin','signup'].forEach(t => {
      document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
      document.getElementById(`panel-${t}`).classList.toggle('hidden', t !== tab);
    });
    document.getElementById('si-err').textContent = '';
    document.getElementById('su-err').textContent = '';
  });
});

document.getElementById('signin-btn')?.addEventListener('click', doSignIn);
document.getElementById('signup-btn')?.addEventListener('click', doSignUp);
document.getElementById('pending-signout-btn')?.addEventListener('click', signOut);

async function doSignIn(){
  const u   = document.getElementById('si-user').value.trim().toLowerCase();
  const p   = document.getElementById('si-pass').value;
  const err = document.getElementById('si-err');
  err.textContent = '';
  if(!u || !p){ err.textContent = 'Fill all fields.'; return; }
  if(u === ADMIN_USERNAME.toLowerCase()){
    if(p !== ADMIN_PASSWORD){ err.textContent = 'Wrong password.'; return; }
    await ensureAdminAccount();
    currentUser = { username:ADMIN_USERNAME, name:ADMIN_NAME, rank:'goat', approved:true, banned:false, isAdmin:true, proxyAccess:true };
    localStorage.setItem('nebula_sess', JSON.stringify({ username:ADMIN_USERNAME }));
    launchApp(); return;
  }
  await loadAccounts();
  const acct = DB.accounts[u];
  if(!acct){ err.textContent = 'Account not found.'; return; }
  if(await hashPass(p) !== acct.passHash){ err.textContent = 'Wrong password.'; return; }
  if(acct.banned){ err.textContent = 'Account suspended.'; return; }
  if(!acct.approved){ currentUser = { ...acct, username:u }; showPending(); return; }
  currentUser = { ...acct, username:u, isAdmin:false };
  localStorage.setItem('nebula_sess', JSON.stringify({ username:u }));
  launchApp();
}

async function doSignUp(){
  const name  = document.getElementById('su-name').value.trim();
  const rawU  = document.getElementById('su-user').value.trim().toLowerCase();
  const u     = rawU.replace(/[^a-z0-9_\-]/g,'');
  const p     = document.getElementById('su-pass').value;
  const p2    = document.getElementById('su-pass2').value;
  const err   = document.getElementById('su-err');
  err.textContent = '';
  if(!name || !u || !p || !p2){ err.textContent = 'Fill all fields.'; return; }
  if(u.length < 2 || u.length > 20){ err.textContent = 'Username must be 2–20 chars.'; return; }
  if(!/^[a-z0-9_\-]+$/.test(u)){ err.textContent = 'Username: letters, numbers, _ or - only.'; return; }
  if(u === ADMIN_USERNAME.toLowerCase()){ err.textContent = 'Reserved username.'; return; }
  if(p.length < 6){ err.textContent = 'Password must be 6+ chars.'; return; }
  if(p !== p2){ err.textContent = 'Passwords do not match.'; return; }
  await loadAccounts();
  if(DB.accounts[u]){ err.textContent = 'Username taken.'; return; }
  try{
    await setDoc(REFS.accounts, { ...DB.accounts, [u]:{ name, passHash:await hashPass(p), rank:'earthbound', approved:false, banned:false, proxyAccess:false, joinedAt:tsNow() } });
    notify('Account requested! Awaiting approval.','success');
    document.getElementById('tab-signin').click();
    ['su-name','su-user','su-pass','su-pass2'].forEach(id => document.getElementById(id).value = '');
  }catch{ err.textContent = 'Failed. Try again.'; }
}

function signOut(){
  if(activeThread) clearTyping(activeThread.id, false).catch(() => {});
  if(activeDM)     clearTyping(activeDM, true).catch(() => {});
  currentUser = null;
  localStorage.removeItem('nebula_sess');
  location.reload();
}

function showPending(){
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('pending-screen').classList.remove('hidden');
}

async function ensureAdminAccount(){
  await loadAccounts();
  if(!DB.accounts[ADMIN_USERNAME]){
    await setDoc(REFS.accounts, { ...DB.accounts, [ADMIN_USERNAME]:{ name:ADMIN_NAME, passHash:await hashPass(ADMIN_PASSWORD), rank:'goat', approved:true, banned:false, proxyAccess:true, joinedAt:tsNow() } });
    await loadAccounts();
  }
}

async function loadAccounts(){
  const snap = await getDoc(REFS.accounts);
  if(snap.exists()) DB.accounts = snap.data() || {};
}

/* ── Restore session ── */
(async () => {
  initCanvas();
  initParallax();
  showSkeleton();
  try{
    const saved = localStorage.getItem('nebula_sess');
    if(!saved){ hideSkeleton(); return; }
    const sess = JSON.parse(saved);
    await loadAccounts();
    if(sess.username === ADMIN_USERNAME){
      await ensureAdminAccount();
      currentUser = { ...DB.accounts[ADMIN_USERNAME], username:ADMIN_USERNAME, isAdmin:true, proxyAccess:true };
      launchApp(); return;
    }
    const live = DB.accounts[sess.username];
    if(!live || live.banned){ localStorage.removeItem('nebula_sess'); hideSkeleton(); return; }
    if(!live.approved){ currentUser = { ...live, username:sess.username }; showPending(); hideSkeleton(); return; }
    currentUser = { ...live, username:sess.username, isAdmin:false };
    launchApp();
  }catch{ localStorage.removeItem('nebula_sess'); hideSkeleton(); }
})();

function showSkeleton(){ document.getElementById('app-skeleton')?.classList.remove('hidden'); }

function hideSkeleton(){
  const sk = document.getElementById('app-skeleton'); if(!sk) return;
  sk.classList.add('fade-out');
  setTimeout(() => {
    sk.classList.add('hidden');
    if(!currentUser && document.getElementById('app').classList.contains('hidden')){
      document.getElementById('auth-screen').classList.remove('hidden');
    }
  }, 400);
}

/* ══════════════════════════════════════════
   LAUNCH
══════════════════════════════════════════ */
async function launchApp(){
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('pending-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  if(isMod(currentUser)){
    document.getElementById('snav-admin').classList.remove('hidden');
    document.getElementById('ts-add-btn').classList.remove('hidden');
  }
  if(canAccessProxy(currentUser)) document.getElementById('snav-proxy').classList.remove('hidden');
  if(!canAccessGames(currentUser)) document.getElementById('snav-games').classList.add('hidden');

  updateSidebarProfile();
  loadTooltips();
  wireStaticListeners();
  startListeners();
  if(canAccessGames(currentUser)) loadZones();
  loadProfileSection();

  tsRefreshTimer = setInterval(() => {
    if(activeThread) renderMessages();
    if(activeDM)     renderDMMessages();
  }, 60000);

  hideSkeleton();
  showSection('home');
}

function updateSidebarProfile(){
  if(!currentUser) return;
  const ava = document.getElementById('sp-ava');
  ava.style.background = currentUser.username === ADMIN_USERNAME ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : userColor(currentUser.username);
  ava.textContent = avatarLetter(currentUser.username);
  document.getElementById('sp-name').textContent = currentUser.username;
  const rEl = document.getElementById('sp-rank');
  rEl.style.color = rankColorText(currentUser.rank);
  rEl.textContent = RANK_LABELS[currentUser.rank] || '';
}

/* ══════════════════════════════════════════
   STATIC EVENT LISTENERS
══════════════════════════════════════════ */
function wireStaticListeners(){
  document.querySelectorAll('.snav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });
  document.querySelectorAll('.home-card[data-section]').forEach(card => {
    card.addEventListener('click', () => showSection(card.dataset.section));
  });
  document.getElementById('sidebar-profile')?.addEventListener('click', () => showSection('profile'));
  document.getElementById('signout-btn')?.addEventListener('click', e => { e.stopPropagation(); signOut(); });
  document.getElementById('sidebar-logo')?.addEventListener('click', () => showSection('home'));

  document.getElementById('ts-add-btn')?.addEventListener('click', openCreateThread);
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });
  document.getElementById('chat-input')?.addEventListener('input', () => { updateCharCtr(); if(activeThread) broadcastTyping(activeThread.id, false); });
  document.getElementById('si-pass')?.addEventListener('keydown', e => { if(e.key === 'Enter') doSignIn(); });
  document.getElementById('si-user')?.addEventListener('keydown', e => { if(e.key === 'Enter') doSignIn(); });

  document.getElementById('new-dm-btn')?.addEventListener('click', openNewDM);
  document.getElementById('dm-send-btn')?.addEventListener('click', sendDM);
  document.getElementById('dm-input')?.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendDM(); } });
  document.getElementById('dm-input')?.addEventListener('input', () => { updateDMCharCtr(); if(activeDM) broadcastTyping(activeDM, true); });

  // Vault controls
  document.getElementById('vault-search')?.addEventListener('input', deb(() => {
    vaultQuery = document.getElementById('vault-search').value;
    renderVaultGrid(getFilteredZones());
  }, 180));
  document.getElementById('vault-sort')?.addEventListener('change', () => {
    vaultSortBy = document.getElementById('vault-sort').value;
    renderVaultGrid(getFilteredZones());
  });
  document.getElementById('fav-filter-btn')?.addEventListener('click', toggleFavFilter);

  document.getElementById('cancel-del-btn')?.addEventListener('click', cancelDel);
  document.getElementById('confirm-del-btn')?.addEventListener('click', confirmDel);
  document.getElementById('close-ct-btn')?.addEventListener('click', () => closeModal('ct-modal'));
  document.getElementById('submit-ct-btn')?.addEventListener('click', submitCT);
  document.getElementById('close-tpass-btn')?.addEventListener('click', closeTPass);
  document.getElementById('submit-tpass-btn')?.addEventListener('click', submitTPass);
  document.getElementById('tpass-inp')?.addEventListener('keydown', e => { if(e.key === 'Enter') submitTPass(); });
  document.getElementById('close-newdm-btn')?.addEventListener('click', () => closeModal('newdm-modal'));
  document.getElementById('dm-search-inp')?.addEventListener('input', filterDMSearch);
  document.getElementById('close-rank-btn')?.addEventListener('click', closeRankModal);
  document.getElementById('modal-overlay')?.addEventListener('click', closeTopModal);

  // Game vault buttons
  document.getElementById('game-close-btn')?.addEventListener('click', e => { e.stopPropagation(); doCloseGame(); });
  document.getElementById('game-fs-btn')?.addEventListener('click', toggleFS);
  document.getElementById('game-dl-btn')?.addEventListener('click', downloadZone);
  document.getElementById('game-close-confirm-btn')?.addEventListener('click', e => { e.stopPropagation(); doCloseGame(); });
  document.getElementById('game-close-cancel-btn')?.addEventListener('click', e => { e.stopPropagation(); closeModal('game-close-modal'); });

  document.getElementById('close-mention-btn')?.addEventListener('click', () => closeModal('mention-modal'));
  document.getElementById('mention-search-inp')?.addEventListener('input', filterMentionSearch);

  document.getElementById('mobile-drawer-overlay')?.addEventListener('click', closeMobileDrawer);
  document.getElementById('mobile-drawer-close')?.addEventListener('click', closeMobileDrawer);
  document.getElementById('chat-open-drawer')?.addEventListener('click', () => openMobileDrawer('chat'));
  document.getElementById('dm-open-drawer')?.addEventListener('click', () => openMobileDrawer('dms'));
  document.getElementById('chat-show-channels-btn')?.addEventListener('click', () => openMobileDrawer('chat'));

  document.querySelectorAll('.adm-tab[data-adm]').forEach(btn => {
    btn.addEventListener('click', () => admTab(btn.dataset.adm));
  });

  document.getElementById('add-cat-btn')?.addEventListener('click', addCat);

  document.getElementById('ntog-dms')?.addEventListener('change', saveNotifPrefs);
  document.getElementById('ntog-mute')?.addEventListener('change', saveNotifPrefs);

  document.addEventListener('keydown', globalKeyHandler);
  document.addEventListener('click', closeEmojiOutside);
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible'){
      if(activeSection === 'chat' && activeThread){ unreadThreads[activeThread.id] = 0; newMsgCount = 0; updateChatBadge(); renderThreadList(); updateScrollBtn(); }
      if(activeSection === 'dms' && activeDM){ unreadDMs[activeDM] = 0; updateDMBadge(); renderDMList(); }
    }
  });
}

/* ══════════════════════════════════════════
   FIRESTORE LISTENERS
══════════════════════════════════════════ */
function startListeners(){
  onSnapshot(REFS.accounts, snap => {
    if(!snap.exists()) return;
    DB.accounts = snap.data() || {};
    if(currentUser && currentUser.username !== ADMIN_USERNAME){
      const live = DB.accounts[currentUser.username];
      if(live){
        currentUser.rank        = live.rank;
        currentUser.banned      = live.banned;
        currentUser.approved    = live.approved;
        currentUser.proxyAccess = live.proxyAccess;
        if(canAccessProxy(currentUser)) document.getElementById('snav-proxy').classList.remove('hidden');
        if(!canAccessGames(currentUser)) document.getElementById('snav-games').classList.add('hidden');
        else document.getElementById('snav-games').classList.remove('hidden');
        updateSidebarProfile();
      }
    }
    if(isMod(currentUser)) renderAdminPanel();
    renderMembersList();
    renderDMList();
  });

  onSnapshot(REFS.threads, snap => {
    if(!snap.exists()) return;
    DB.threads = snap.data().list || DEFAULT_THREADS;
    renderThreadList();
    renderNotifChannels();
    if(isMod(currentUser)) renderAdminPanel();
  });

  onSnapshot(REFS.messages, snap => {
    if(!snap.exists()) return;
    const old = { ...DB.messages };
    DB.messages = snap.data() || {};
    const prefs = getNotifPrefs();
    Object.keys(DB.messages).forEach(tid => {
      const oldLen = (old[tid]||[]).filter(m => !m.deleted).length;
      const newArr = DB.messages[tid] || [];
      const newLen = newArr.filter(m => !m.deleted).length;
      if(newLen > oldLen){
        const diff = newLen - oldLen;
        const live = activeThread?.id === tid && activeSection === 'chat' && document.visibilityState === 'visible';
        if(!live){
          unreadThreads[tid] = (unreadThreads[tid]||0) + diff;
          if(!prefs.muteAll && prefs.channels?.[tid] && Notification.permission === 'granted'){
            const last = newArr.filter(m => !m.deleted).slice(-1)[0];
            const t    = getThreads().find(x => x.id === tid);
            if(last && last.user !== currentUser?.username) pushBrowserNotif(`#${t?.name||tid}`, `${last.user}: ${last.text}`, `ch-${tid}`);
          }
        } else if(!atBottom){ newMsgCount += diff; updateScrollBtn(); }
      }
    });
    renderThreadList();
    if(activeThread) renderMessages();
  });

  onSnapshot(REFS.dms, snap => {
    if(!snap.exists()) return;
    const old = { ...DB.dms };
    DB.dms = snap.data() || {};
    const prefs = getNotifPrefs();
    const myU   = currentUser?.username;
    Object.keys(DB.dms).forEach(k => {
      if(!k.includes(myU)) return;
      const newArr = DB.dms[k] || [], oldLen = (old[k]||[]).length, newLen = newArr.length;
      const other  = k.split('__').find(p => p !== myU);
      const live   = other === activeDM && activeSection === 'dms' && document.visibilityState === 'visible';
      if(other && newLen > oldLen && !live){
        unreadDMs[other] = (unreadDMs[other]||0) + (newLen - oldLen);
        if(!prefs.muteAll && prefs.dms && Notification.permission === 'granted'){
          const last = newArr.slice(-1)[0];
          if(last && last.user !== myU) pushBrowserNotif(`DM from ${other}`, last.text, `dm-${other}`);
        }
      }
    });
    renderDMList();
    if(activeDM) renderDMMessages();
  });

  onSnapshot(REFS.proxies, snap => {
    if(!snap.exists()) return;
    DB.proxies = snap.data().list || [];
    if(activeSection === 'proxy') renderProxies();
  });

  onSnapshot(REFS.config, snap => {
    if(!snap.exists()) return;
    DB.config = snap.data() || {};
    if(isMod(currentUser)) renderAdminPanel();
  });

  onSnapshot(REFS.typing, snap => {
    if(!snap.exists()) return;
    DB.typing = snap.data() || {};
    if(activeThread) renderTypingBar(activeThread.id, false, 'typing-bar');
    if(activeDM)     renderTypingBar(activeDM, true, 'dm-typing-bar');
  });

  document.addEventListener('visibilitychange', () => {
    window._canvasPaused = (document.visibilityState === 'hidden');
  });
}

/* ══════════════════════════════════════════
   SECTIONS
══════════════════════════════════════════ */
function showSection(s){
  if(s === 'proxy'  && !canAccessProxy(currentUser)){ notify('Access denied','error'); return; }
  if(s === 'games'  && !canAccessGames(currentUser)){ notify('Access denied','error'); return; }
  if(s === 'admin'  && !isMod(currentUser)){ notify('Access denied','error'); return; }
  document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(x => x.classList.remove('active'));
  const sec = document.getElementById(`section-${s}`);
  if(sec){ sec.classList.remove('hidden'); sec.classList.add('active'); }
  document.getElementById(`snav-${s}`)?.classList.add('active');
  activeSection = s;
  if(s === 'chat'){ if(activeThread){ unreadThreads[activeThread.id] = 0; newMsgCount = 0; } updateChatBadge(); renderThreadList(); }
  if(s === 'dms'){ if(activeDM) unreadDMs[activeDM] = 0; updateDMBadge(); renderDMList(); }
  if(s === 'admin')         renderAdminPanel();
  if(s === 'proxy')         renderProxies();
  if(s === 'profile')       loadProfileSection();
  if(s === 'notifications') renderNotifSection();
  // Toggle system meters (FPS & Battery) when on Home
  try{ toggleSystemMeters(s === 'home'); }catch(e){}
}

/* ══════════════════════════════════════════
   SYSTEM METERS (FPS & BATTERY)
   - Visible only when `showSection('home')` is active
══════════════════════════════════════════ */
let _fpsRaf = null, _fpsLast = 0, _fpsCount = 0, _fpsLastReport = 0;
let _fpsVisible = false;
let _battery = null;

function _fpsLoop(ts){
  if(!_fpsVisible){ _fpsRaf = null; return; }
  if(!_fpsLast) _fpsLast = ts;
  _fpsCount++;
  const delta = ts - _fpsLastReport;
  if(delta >= 500){
    const fps = Math.round((_fpsCount / delta) * 1000);
    _updateFPSDisplay(fps);
    _fpsCount = 0; _fpsLastReport = ts;
  }
  _fpsLast = ts;
  _fpsRaf = requestAnimationFrame(_fpsLoop);
}

function _updateFPSDisplay(fps){
  const el = document.getElementById('fps-value'); const wrap = document.getElementById('sys-meters');
  if(!el || !wrap) return;
  el.textContent = fps;
  wrap.classList.remove('status-good','status-warn','status-bad');
  if(fps >= 50) wrap.classList.add('status-good');
  else if(fps >= 30) wrap.classList.add('status-warn');
  else wrap.classList.add('status-bad');
}

async function _initBattery(){
  if(!('getBattery' in navigator)){
    const el = document.getElementById('batt-value'); if(el) el.textContent = 'n/a';
    return;
  }
  try{
    _battery = await navigator.getBattery();
    const upd = () => {
      const el = document.getElementById('batt-value'); const icon = document.getElementById('batt-icon'); const wrap = document.getElementById('sys-meters');
      if(!el) return;
      const pct = Math.round((_battery.level || 0) * 100);
      el.textContent = pct + '%';
      if(icon) icon.textContent = _battery.charging ? '⚡' : '🔋';
      if(wrap){ wrap.classList.toggle('charging', !!_battery.charging); wrap.classList.toggle('batt-low', pct <= 18); }
    };
    _battery.addEventListener('levelchange', upd);
    _battery.addEventListener('chargingchange', upd);
    upd();
  }catch(e){ const el = document.getElementById('batt-value'); if(el) el.textContent = 'n/a'; }
}

function toggleSystemMeters(show){
  const wrap = document.getElementById('sys-meters'); if(!wrap) return;
  if(show){
    wrap.classList.remove('hidden');
    if(!_fpsRaf){ _fpsLast = 0; _fpsLastReport = 0; _fpsCount = 0; _fpsVisible = true; _fpsRaf = requestAnimationFrame(_fpsLoop); }
    if(!_battery) _initBattery();
  } else {
    wrap.classList.add('hidden');
    _fpsVisible = false; if(_fpsRaf){ cancelAnimationFrame(_fpsRaf); _fpsRaf = null; }
  }
}

function updateChatBadge(){ document.getElementById('chat-badge')?.classList.add('hidden'); }
function updateDMBadge(){   document.getElementById('dm-badge')?.classList.add('hidden'); }

/* ══════════════════════════════════════════
   MOBILE DRAWER
══════════════════════════════════════════ */
function openMobileDrawer(ctx){
  const drawer  = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  const list    = document.getElementById('mobile-drawer-list');
  const title   = document.getElementById('mobile-drawer-title');
  drawer.classList.remove('hidden');
  overlay.classList.remove('hidden');
  if(ctx === 'chat'){
    title.textContent = 'Channels';
    list.innerHTML = '';
    getThreads().forEach(t => {
      const div = document.createElement('div');
      div.className = `titem${activeThread?.id === t.id ? ' active' : ''}`;
      div.innerHTML = `<span class="titem-icon">${esc(t.emoji||'💬')}</span><span class="titem-name">${esc(t.name)}</span>`;
      div.addEventListener('click', () => { closeMobileDrawer(); handleThreadClick(t); });
      list.appendChild(div);
    });
  } else {
    title.textContent = 'Messages';
    list.innerHTML = '';
    const myU = currentUser.username;
    const seen = new Set();
    Object.keys(DB.dms).filter(k => k.includes(myU)).forEach(k => {
      const other = k.split('__').find(p => p !== myU);
      if(!other || seen.has(other) || !DB.accounts[other]) return;
      seen.add(other);
      const div = document.createElement('div');
      div.className = `titem${activeDM === other ? ' active' : ''}`;
      div.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:${userColor(other)};display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.6rem;flex-shrink:0;">${avatarLetter(other)}</div><span class="titem-name" style="margin-left:.4rem">${esc(other)}</span>`;
      div.addEventListener('click', () => { closeMobileDrawer(); openDMWith(other); });
      list.appendChild(div);
    });
  }
}

function closeMobileDrawer(){
  document.getElementById('mobile-drawer').classList.add('hidden');
  document.getElementById('mobile-drawer-overlay').classList.add('hidden');
}

/* ══════════════════════════════════════════
   THREADS
══════════════════════════════════════════ */
function getThreads(){ return DB.threads?.length ? DB.threads : DEFAULT_THREADS; }

function canEnterThread(t){
  if(!t.locked && !t.password) return true;
  if(isMod(currentUser)) return true;
  return JSON.parse(localStorage.getItem('joined_threads')||'[]').includes(t.id);
}

function renderThreadList(){
  const list = document.getElementById('thread-list'); if(!list) return;
  list.innerHTML = '';
  getThreads().forEach(t => {
    const div  = document.createElement('div');
    div.className = `titem${activeThread?.id === t.id && activeSection === 'chat' ? ' active' : ''}`;
    div.addEventListener('click', () => handleThreadClick(t));
    const msgs    = (DB.messages[t.id]||[]).filter(m => !m.deleted);
    const last    = msgs[msgs.length - 1];
    const preview = last ? `${last.user}: ${last.text}` : '';
    div.innerHTML = `<span class="titem-icon">${esc(t.emoji||'💬')}</span>
      <div style="flex:1;min-width:0;">
        <div class="titem-name">${esc(t.name)}</div>
        ${preview ? `<div class="titem-preview">${esc(preview.slice(0,40))}</div>` : ''}
      </div>`;
    list.appendChild(div);
  });
}

function handleThreadClick(t){
  if(t.password && !canEnterThread(t)){
    pendingThread = t;
    document.getElementById('tpass-inp').value = '';
    document.getElementById('tp-err').textContent = '';
    openModal('tpass-modal'); return;
  }
  switchThread(t);
}

function closeTPass(){ closeModal('tpass-modal'); pendingThread = null; }

async function submitTPass(){
  const pass = document.getElementById('tpass-inp').value;
  const err  = document.getElementById('tp-err');
  if(!pendingThread){ closeTPass(); return; }
  if(pass === pendingThread.password){
    const j = JSON.parse(localStorage.getItem('joined_threads')||'[]');
    if(!j.includes(pendingThread.id)) j.push(pendingThread.id);
    localStorage.setItem('joined_threads', JSON.stringify(j));
    const t = pendingThread; closeTPass(); switchThread(t);
  } else {
    err.textContent = 'Wrong password.';
    const inp = document.getElementById('tpass-inp');
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
  }
}

async function switchThread(t){
  if(switching) return; switching = true;
  if(activeThread) clearTyping(activeThread.id, false);
  activeThread = t; unreadThreads[t.id] = 0; newMsgCount = 0; atBottom = true;
  updateChatBadge(); renderThreadList();
  document.getElementById('chat-no-select').classList.add('hidden');
  const win = document.getElementById('chat-window'); win.classList.remove('hidden');
  document.getElementById('ctb-name').textContent = t.name;
  document.getElementById('ctb-announce').classList.toggle('hidden', !t.announceOnly);
  const ia = document.getElementById('chat-input-area');
  if(t.announceOnly && !isMod(currentUser)){
    ia.innerHTML = `<div class="announce-notice"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 3L2 10l7.5 2.5L12 21l3-6 7-12z"/></svg> Only moderators can post here.</div>`;
  } else {
    ia.innerHTML = `<div class="chat-input-wrap">
      <input type="text" id="chat-input" placeholder="Message #${esc(t.name)}…" maxlength="500" autocomplete="off" spellcheck="false">
      <span class="char-ctr" id="char-ctr"></span>
      <button class="mention-btn" id="mention-open-btn" title="Mention a user">@</button>
      <button class="send-btn" id="send-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button>
    </div>
    <div class="rate-msg hidden" id="rate-msg"></div>`;
    document.getElementById('chat-input').addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });
    document.getElementById('chat-input').addEventListener('input', () => { updateCharCtr(); broadcastTyping(t.id, false); });
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('mention-open-btn').addEventListener('click', () => openMentionModal('chat'));
  }
  const ctbRight = document.getElementById('ctb-right'); ctbRight.innerHTML = '';
  if(isMod(currentUser)){
    const wb = document.createElement('button'); wb.className = 'btn btn-ghost btn-sm'; wb.textContent = '🗑 Wipe';
    wb.addEventListener('click', () => wipeThread(t.id)); ctbRight.appendChild(wb);
  }
  renderMessages(); switching = false;
  if(activeSection !== 'chat') showSection('chat');
  requestAnimationFrame(() => {
    const mw = document.getElementById('messages-wrap');
    if(mw){ mw.scrollTop = mw.scrollHeight; atBottom = true; }
  });
}

async function wipeThread(tid){
  if(!(await showConfirm(`Wipe all messages in #${tid}?`, 'Wipe messages'))) return;
  try{ await setDoc(REFS.messages, { ...DB.messages, [tid]:[] }); notify('Wiped','success'); }
  catch{ notify('Failed','error'); }
}

function openCreateThread(){
  ['ct-name','ct-emoji'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ct-announce').checked = false;
  document.getElementById('ct-err').textContent  = '';
  openModal('ct-modal');
}

async function submitCT(){
  const name    = document.getElementById('ct-name').value.trim().toLowerCase().replace(/[^a-z0-9\-_]/g,'');
  const emoji   = document.getElementById('ct-emoji').value.trim() || '💬';
  const announce = document.getElementById('ct-announce').checked;
  const err     = document.getElementById('ct-err');
  if(!name){ err.textContent = 'Name required.'; return; }
  if(getThreads().find(x => x.id === name)){ err.textContent = 'Name taken.'; return; }
  try{
    await setDoc(REFS.threads, { list:[...getThreads(), { id:name, name, emoji, password:'', locked:false, announceOnly:announce }] });
    closeModal('ct-modal'); notify(`#${name} created`,'success');
  }catch{ err.textContent = 'Failed.'; }
}

async function deleteThread(id){
  if(!(await showConfirm(`Delete #${id}?`, 'Delete channel'))) return;
  try{
    await setDoc(REFS.threads, { list:getThreads().filter(t => t.id !== id) });
    if(activeThread?.id === id){
      activeThread = null;
      document.getElementById('chat-window').classList.add('hidden');
      document.getElementById('chat-no-select').classList.remove('hidden');
    }
    notify('Deleted','success');
  }catch{ notify('Failed','error'); }
}

/* ══════════════════════════════════════════
   RENDER MESSAGES
══════════════════════════════════════════ */
function renderMessages(){
  if(!activeThread) return;
  const msgs = DB.messages[activeThread.id] || [];
  const wrap = document.getElementById('messages-wrap'); if(!wrap) return;
  const prevTop = wrap.scrollTop, prevH = wrap.scrollHeight;
  const wasAtBottom = prevH - prevTop <= wrap.clientHeight + 150;
  const container = document.getElementById('messages');
  container.innerHTML = '';
  let lastUser = null, lastDate = null;
  msgs.forEach((m, idx) => {
    if(m.deleted && !isMod(currentUser)){ lastUser = null; return; }
    const ds = formatDateLabel(m.time);
    if(ds && ds !== lastDate){ const dd = document.createElement('div'); dd.className = 'date-divider'; dd.innerHTML = `<span>${ds}</span>`; container.appendChild(dd); lastDate = ds; }
    // show header/avatar when it's a new user group OR when the message is from the current user
    // Show header/avatar when message starts a new group, or when this is the
    // first message of a consecutive group from the current user. If the
    // previous message is also from the current user, hide the avatar (Discord-like).
    const showHeader = (m.user !== lastUser) || (currentUser && m.user === currentUser.username && lastUser !== currentUser.username);
    container.appendChild(buildMessage(m, idx, showHeader, activeThread.id, false));
    lastUser = m.user;
  });
  requestAnimationFrame(() => {
    if(wasAtBottom){ wrap.scrollTop = wrap.scrollHeight; atBottom = true; newMsgCount = 0; }
    else{ wrap.scrollTop = prevTop + (wrap.scrollHeight - prevH); atBottom = false; }
    updateScrollBtn();
  });
  ensureScrollListener(wrap);
  renderTypingBar(activeThread.id, false, 'typing-bar');
}

function ensureScrollListener(wrap){
  if(wrap._scrollBound) return; wrap._scrollBound = true;
  wrap.addEventListener('scroll', deb(() => {
    atBottom = wrap.scrollHeight - wrap.scrollTop <= wrap.clientHeight + 150;
    if(atBottom) newMsgCount = 0;
    updateScrollBtn();
  }, 40));
  if(!document.getElementById('scroll-to-bottom')){
    const btn = document.createElement('button');
    btn.className = 'scroll-to-bottom'; btn.id = 'scroll-to-bottom';
    btn.innerHTML = '↓<span class="stb-unread hidden" id="stb-unread">0</span>';
    btn.addEventListener('click', () => {
      const mw = document.getElementById('messages-wrap'); if(mw) mw.scrollTop = mw.scrollHeight;
      newMsgCount = 0; updateScrollBtn();
    });
    wrap.parentElement.style.position = 'relative';
    wrap.parentElement.appendChild(btn);
  }
}

function updateScrollBtn(){
  const btn = document.getElementById('scroll-to-bottom'); if(!btn) return;
  btn.classList.toggle('show', !atBottom && newMsgCount > 0);
  const u = document.getElementById('stb-unread');
  if(u){ u.textContent = newMsgCount > 9 ? '9+' : newMsgCount; u.classList.toggle('hidden', newMsgCount === 0); }
}

/* ══════════════════════════════════════════
   BUILD MESSAGE
══════════════════════════════════════════ */
function buildMessage(m, idx, isFirst, ctxId, isDM){
  const div = document.createElement('div');
  div.className = `msg${isFirst?' first-in-group':''}${m.deleted?' deleted':''}`;
  div.dataset.idx = idx; div.dataset.ctx = ctxId; div.dataset.dm = isDM ? '1' : '0';
  const canAct = currentUser && (currentUser.username === m.user || isMod(currentUser));
  const isOwn  = currentUser && currentUser.username === m.user;
  const bg     = m.user === ADMIN_USERNAME ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : userColor(m.user);
  const rank   = (DB.accounts[m.user]?.rank) || 'earthbound';

  const avaWrap = document.createElement('div'); avaWrap.className = 'msg-ava-wrap';
  if(isFirst){
    avaWrap.innerHTML = `<div class="msg-ava" style="background:${bg}">${avatarLetter(m.user)}</div>`;
  } else {
    const short = formatShortTime(m.time);
    avaWrap.innerHTML = `<div class="msg-ava-spacer"></div><div class="msg-ts-inline">${esc(short)}</div>`;
  }
  div.appendChild(avaWrap);

  const content = document.createElement('div'); content.className = 'msg-content';
  if(isFirst){
    content.innerHTML = `<div class="msg-header">
      <span class="msg-name" style="color:${rankColorText(rank)}">${esc(m.user)}</span>
      ${rankBadge(rank)}
      <span class="msg-ts">${relTime(m.time)}</span>
    </div>`;
  }

  const textDiv = document.createElement('div'); textDiv.className = 'msg-text';
  if(m.deleted){
    textDiv.style.cssText = 'color:var(--text-faint);font-style:italic;';
    textDiv.textContent = '[message deleted]';
  } else {
    textDiv.innerHTML = renderMentions(esc(m.text));
    if(m.edited){ const ed = document.createElement('span'); ed.className = 'msg-edited'; ed.textContent = ' (edited)'; textDiv.appendChild(ed); }
  }
  content.appendChild(textDiv);

  if(!m.deleted){
    const rct   = m.reactions || {};
    const rkeys = Object.keys(rct).filter(e => rct[e] && rct[e].length > 0);
    if(rkeys.length){
      const rDiv = document.createElement('div'); rDiv.className = 'msg-reactions';
      rkeys.forEach(e => {
        const users = rct[e] || [], mine = currentUser && users.includes(currentUser.username);
        const chip  = document.createElement('span'); chip.className = `rchip${mine?' mine':''}`;
        chip.innerHTML = `${e}<span class="rcnt">${users.length}</span>`;
        chip.addEventListener('click', () => toggleReact(ctxId, idx, e, isDM));
        rDiv.appendChild(chip);
      });
      content.appendChild(rDiv);
    }
  }
  div.appendChild(content);

  if(!m.deleted && (canAct || currentUser)){
    const acts = document.createElement('div'); acts.className = 'msg-actions';
    if(currentUser){
      const rb = document.createElement('button'); rb.className = 'mab'; rb.textContent = '😊';
      rb.addEventListener('click', e => { e.stopPropagation(); openEmoji(e, ctxId, idx, isDM); });
      acts.appendChild(rb);
    }
    if(isOwn){
      const eb = document.createElement('button'); eb.className = 'mab'; eb.textContent = '✎';
      eb.addEventListener('click', () => startEdit(ctxId, idx, isDM));
      acts.appendChild(eb);
    }
    if(canAct){
      const db2 = document.createElement('button'); db2.className = 'mab d'; db2.textContent = '✕';
      db2.addEventListener('click', () => promptDel(ctxId, idx, isDM));
      acts.appendChild(db2);
    }
    div.appendChild(acts);
  }
  return div;
}

/* ══════════════════════════════════════════
   SEND / EDIT / DELETE
══════════════════════════════════════════ */
async function sendMessage(){
  const input = document.getElementById('chat-input'); if(!input) return;
  const text  = input.value.trim();
  if(!text || !currentUser || !activeThread) return;
  if(text.length > MAX_MSG_LEN){ notify('Too long','warning'); return; }
  if(activeThread.announceOnly && !isMod(currentUser)){ notify('Only mods can post here','warning'); return; }
  const rl = checkRate(rateLogs, currentUser);
  if(!rl.ok){
    const rm = document.getElementById('rate-msg');
    if(rm){ rm.textContent = `Rate limited — wait ${rl.wait}s.`; rm.classList.remove('hidden'); setTimeout(() => rm.classList.add('hidden'), rl.wait * 1000); }
    return;
  }
  const sb = document.getElementById('send-btn'); if(sb) sb.disabled = true;
  try{
    const existing = DB.messages[activeThread.id] || [];
    const updated  = [...existing, { user:currentUser.username, text:filt(text), time:tsNow(), reactions:{} }].slice(-MAX_CHANNEL_MSGS);
    const newMsgs  = { ...DB.messages, [activeThread.id]:updated };
    DB.messages = newMsgs; scheduleMsgWrite(newMsgs);
    input.value = ''; updateCharCtr();
    clearTyping(activeThread.id, false);
    renderMessages();
    const mw = document.getElementById('messages-wrap');
    if(mw){ mw.scrollTop = mw.scrollHeight; atBottom = true; newMsgCount = 0; }
  }catch{ notify('Failed to send','error'); }
  finally{ if(sb) sb.disabled = false; input.focus(); }
}

function updateCharCtr(){
  const input = document.getElementById('chat-input');
  const ctr   = document.getElementById('char-ctr');
  if(!input || !ctr) return;
  const len = input.value.length;
  if(len >= WARN_MSG_LEN){ ctr.textContent = MAX_MSG_LEN - len; ctr.className = `char-ctr${len >= MAX_MSG_LEN ? ' danger' : ' warn'}`; }
  else{ ctr.textContent = ''; ctr.className = 'char-ctr'; }
}

function promptDel(ctx, idx, isDM = false){ pdel = { ctx, idx:+idx, isDM }; openModal('del-modal'); }
function cancelDel(){ pdel = { ctx:null, idx:null, isDM:false }; closeModal('del-modal'); }

async function confirmDel(){
  const { ctx, idx, isDM } = pdel; if(ctx === null) return;
  try{
    if(isDM){
      const k = dmKey(currentUser.username, ctx);
      let ms = [...(DB.dms[k]||[])]; ms[idx] = { ...ms[idx], deleted:true };
      const nd = { ...DB.dms, [k]:ms }; DB.dms = nd; scheduleDMWrite(nd);
    } else {
      let ms = [...(DB.messages[ctx]||[])]; ms[idx] = { ...ms[idx], deleted:true };
      const nm = { ...DB.messages, [ctx]:ms }; DB.messages = nm; scheduleMsgWrite(nm);
    }
    notify('Deleted','success');
  }catch{ notify('Failed','error'); }
  cancelDel();
}

function startEdit(ctxId, idx, isDM = false){
  const msgs = isDM ? (DB.dms[dmKey(currentUser.username, ctxId)]||[]) : (DB.messages[ctxId]||[]);
  const m = msgs[idx]; if(!m || m.deleted) return;
  const containerSel = isDM ? '#dm-messages' : '#messages';
  const el = document.querySelector(`${containerSel} .msg[data-idx="${idx}"][data-ctx="${ctxId}"]`);
  if(!el) return;
  document.querySelectorAll('.edit-wrap').forEach(e => e.remove());
  document.querySelectorAll('.msg.editing').forEach(e => e.classList.remove('editing'));
  el.classList.add('editing');
  const textDiv = el.querySelector('.msg-text'); textDiv.style.display = 'none';
  const wrap = document.createElement('div'); wrap.className = 'edit-wrap';
  const inp  = document.createElement('input'); inp.type = 'text'; inp.className = 'edit-inp';
  inp.value  = m.text; inp.maxLength = MAX_MSG_LEN;
  const save = document.createElement('button'); save.className = 'esave'; save.textContent = 'Save';
  const can  = document.createElement('button'); can.className  = 'ecancel'; can.textContent = 'Cancel';
  const doSave = async () => {
    const nv = inp.value.trim();
    if(!nv){ notify('Empty','warning'); return; }
    if(nv === m.text){ doCancel(); return; }
    save.disabled = true;
    try{
      if(isDM){
        const k  = dmKey(currentUser.username, ctxId);
        let ms   = [...(DB.dms[k]||[])]; ms[idx] = { ...ms[idx], text:filt(nv), edited:true };
        const nd = { ...DB.dms, [k]:ms }; DB.dms = nd; scheduleDMWrite(nd);
      } else {
        let ms   = [...(DB.messages[ctxId]||[])]; ms[idx] = { ...ms[idx], text:filt(nv), edited:true };
        const nm = { ...DB.messages, [ctxId]:ms }; DB.messages = nm; scheduleMsgWrite(nm);
      }
      notify('Edited','success');
    }catch{ notify('Failed','error'); save.disabled = false; }
  };
  const doCancel = () => { wrap.remove(); textDiv.style.display = ''; el.classList.remove('editing'); };
  save.addEventListener('click', doSave);
  can.addEventListener('click', doCancel);
  inp.addEventListener('keydown', e => { if(e.key === 'Enter') doSave(); if(e.key === 'Escape') doCancel(); });
  wrap.append(inp, save, can);
  el.querySelector('.msg-content').appendChild(wrap);
  setTimeout(() => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }, 40);
}

/* ══════════════════════════════════════════
   REACTIONS
══════════════════════════════════════════ */
function openEmoji(e, ctx, idx, isDM = false){
  e.stopPropagation();
  const picker = document.getElementById('epicker'); picker.innerHTML = '';
  EMOJIS.forEach(em => {
    const btn = document.createElement('span'); btn.className = 'eopt'; btn.textContent = em;
    btn.addEventListener('click', ev => { ev.stopPropagation(); toggleReact(ctx, idx, em, isDM); picker.classList.add('hidden'); });
    picker.appendChild(btn);
  });
  const rect = e.target.getBoundingClientRect();
  picker.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
  picker.style.left   = Math.min(rect.left, window.innerWidth - 224) + 'px';
  picker.classList.remove('hidden');
}

async function toggleReact(ctx, idx, emoji, isDM = false){
  if(!currentUser){ notify('Sign in to react','warning'); return; }
  const toggle = (arr, u) => { const i = arr.indexOf(u); if(i >= 0) arr.splice(i,1); else arr.push(u); return arr; };
  try{
    if(isDM){
      const k   = dmKey(currentUser.username, ctx);
      let ms    = [...(DB.dms[k]||[])]; const mm = { ...ms[idx] };
      const rct = { ...mm.reactions||{} }; rct[emoji] = toggle([...(rct[emoji]||[])], currentUser.username);
      ms[idx]   = { ...mm, reactions:rct }; const nd = { ...DB.dms, [k]:ms }; DB.dms = nd; scheduleDMWrite(nd);
    } else {
      let ms    = [...(DB.messages[ctx]||[])]; const mm = { ...ms[idx] };
      const rct = { ...mm.reactions||{} }; rct[emoji] = toggle([...(rct[emoji]||[])], currentUser.username);
      ms[idx]   = { ...mm, reactions:rct }; const nm = { ...DB.messages, [ctx]:ms }; DB.messages = nm; scheduleMsgWrite(nm);
    }
  }catch{ notify('Failed','error'); }
}

function closeEmojiOutside(e){
  if(!e.target.closest('.epicker') && !e.target.closest('.mab'))
    document.getElementById('epicker')?.classList.add('hidden');
}

/* ══════════════════════════════════════════
   @MENTION MODAL
══════════════════════════════════════════ */
let _mentionCtx = 'chat';

function openMentionModal(ctx){
  _mentionCtx = ctx;
  document.getElementById('mention-search-inp').value = '';
  document.getElementById('mention-results').innerHTML = '';
  filterMentionSearch();
  openModal('mention-modal');
}

function filterMentionSearch(){
  const q   = document.getElementById('mention-search-inp').value.toLowerCase();
  const res = document.getElementById('mention-results'); res.innerHTML = '';
  Object.entries(DB.accounts)
    .filter(([u, a]) => a.approved && !a.banned && u.toLowerCase().includes(q))
    .slice(0,10)
    .forEach(([u]) => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:.42rem .54rem;border-radius:7px;cursor:pointer;transition:background .14s;';
      div.onmouseenter = () => div.style.background = 'rgba(255,255,255,.06)';
      div.onmouseleave = () => div.style.background = '';
      div.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:${userColor(u)};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.6rem;">${avatarLetter(u)}</div><span style="font-size:.8rem;font-weight:700;">${esc(u)}</span>`;
      div.addEventListener('click', () => {
        closeModal('mention-modal');
        const inputId = _mentionCtx === 'chat' ? 'chat-input' : 'dm-input';
        const inp = document.getElementById(inputId); if(!inp) return;
        const cur = inp.value; const pos = inp.selectionStart || cur.length;
        const before = cur.slice(0, pos); const after = cur.slice(pos);
        inp.value = before + (before.endsWith(' ') || before === '' ? '' : ' ') + `@${u} ` + after;
        inp.focus();
      });
      res.appendChild(div);
    });
}

/* ══════════════════════════════════════════
   MEMBERS LIST
══════════════════════════════════════════ */
function renderMembersList(){
  const list = document.getElementById('members-list'); if(!list) return;
  list.innerHTML = '';
  const mods = [], regular = [];
  Object.entries(DB.accounts).forEach(([u, a]) => {
    if(!a.approved || a.banned) return;
    if(u === ADMIN_USERNAME || a.rank === 'universal' || a.rank === 'goat') mods.push([u,a]);
    else regular.push([u,a]);
  });
  const ai = mods.findIndex(([u]) => u === ADMIN_USERNAME);
  if(ai > 0){ const [ad] = mods.splice(ai,1); mods.unshift(ad); }
  const addSec = (label, arr) => {
    if(!arr.length) return;
    const lbl = document.createElement('div'); lbl.className = 'ms-section-label'; lbl.textContent = label;
    list.appendChild(lbl);
    arr.forEach(([u, a]) => {
      const div = document.createElement('div'); div.className = 'ms-item';
      div.addEventListener('click', () => openDMWith(u));
      div.innerHTML = `<div class="ms-ava" style="background:${u === ADMIN_USERNAME ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : userColor(u)}">${avatarLetter(u)}</div>`
        + `<span class="ms-name">${esc(u)}</span>${rankBadge(a.rank)}`;
      list.appendChild(div);
    });
  };
  addSec('MODERATORS', mods); addSec('MEMBERS', regular);
}

/* ══════════════════════════════════════════
   DIRECT MESSAGES
══════════════════════════════════════════ */
function renderDMList(){
  const list = document.getElementById('dm-list'); if(!list) return;
  list.innerHTML = '';
  const myU = currentUser.username; const seen = new Set();
  Object.keys(DB.dms).filter(k => k.includes(myU)).forEach(k => {
    const other = k.split('__').find(p => p !== myU);
    if(!other || seen.has(other)) return; seen.add(other);
    const acct = DB.accounts[other]; if(!acct) return;
    const msgs    = DB.dms[k] || [];
    const last    = msgs.filter(m => !m.deleted).slice(-1)[0];
    const preview = last ? `${last.user === myU ? 'You' : last.user}: ${last.text}` : '';
    const div     = document.createElement('div');
    div.className = `titem${activeDM === other && activeSection === 'dms' ? ' active' : ''}`;
    div.addEventListener('click', () => openDMWith(other));
    div.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:${userColor(other)};display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.6rem;flex-shrink:0;">${avatarLetter(other)}</div>
      <div style="flex:1;min-width:0;margin-left:.4rem;">
        <div class="titem-name">${esc(other)}</div>
        ${preview ? `<div class="titem-preview">${esc(preview.slice(0,36))}</div>` : ''}
      </div>`;
    list.appendChild(div);
  });
}

function openNewDM(){
  document.getElementById('dm-search-inp').value = '';
  document.getElementById('dm-search-results').innerHTML = '';
  filterDMSearch();
  openModal('newdm-modal');
}

function filterDMSearch(){
  const q   = document.getElementById('dm-search-inp').value.toLowerCase();
  const res = document.getElementById('dm-search-results'); res.innerHTML = '';
  Object.entries(DB.accounts)
    .filter(([u, a]) => u !== currentUser.username && a.approved && !a.banned && (u.toLowerCase().includes(q) || (isMod(currentUser) && (a.name||'').toLowerCase().includes(q))))
    .slice(0,10)
    .forEach(([u, a]) => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:.44rem .54rem;border-radius:7px;cursor:pointer;transition:background .14s;';
      div.onmouseenter = () => div.style.background = 'rgba(255,255,255,.06)';
      div.onmouseleave = () => div.style.background = '';
      div.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${userColor(u)};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.7rem;flex-shrink:0;">${avatarLetter(u)}</div>`
        + `<div><div style="font-size:.8rem;font-weight:700;">${esc(u)}</div>${isMod(currentUser) ? `<div style="font-size:.66rem;color:var(--text-muted);">${esc(a.name||'')}</div>` : ''}</div>`;
      div.addEventListener('click', () => { closeModal('newdm-modal'); openDMWith(u); });
      res.appendChild(div);
    });
}

function openDMWith(other){
  if(!DB.accounts[other]){ notify('User not found','error'); return; }
  if(activeDM) clearTyping(activeDM, true);
  activeDM = other; unreadDMs[other] = 0; updateDMBadge(); renderDMList();
  document.getElementById('dm-no-select').classList.add('hidden');
  const win = document.getElementById('dm-window'); win.classList.remove('hidden');
  document.getElementById('dm-ctb-name').textContent = other;
  const inp = document.getElementById('dm-input');
  if(inp){
    inp.placeholder = `Message ${other}…`;
    const wrap = inp.closest('.chat-input-wrap');
    if(wrap && !wrap.querySelector('.mention-btn')){
      const mb = document.createElement('button');
      mb.className = 'mention-btn'; mb.title = 'Mention a user'; mb.textContent = '@';
      mb.addEventListener('click', () => openMentionModal('dms'));
      inp.after(mb);
    }
  }
  renderDMMessages();
  if(activeSection !== 'dms') showSection('dms');
  requestAnimationFrame(() => { const mw = document.getElementById('dm-messages-wrap'); if(mw) mw.scrollTop = mw.scrollHeight; });
  // wire delete button
  const delBtn = document.getElementById('dm-delete-btn');
  if(delBtn){
    delBtn.onclick = (e) => { e.stopPropagation(); deleteCurrentDM(); };
    delBtn.style.display = 'inline-flex';
  }
}

async function deleteCurrentDM(){
  if(!activeDM || !currentUser) return;
  const other = activeDM;
  if(!(await showConfirm(`Delete the conversation with ${other}? This will remove it for everyone.`, 'Delete conversation'))) return;
  try{
    const k = dmKey(currentUser.username, other);
    const nd = { ...DB.dms };
    if(nd.hasOwnProperty(k)) delete nd[k];
    DB.dms = nd;
    scheduleDMWrite(nd);
    notify('Conversation deleted','success');
    // close UI
    activeDM = null;
    document.getElementById('dm-window')?.classList.add('hidden');
    document.getElementById('dm-no-select')?.classList.remove('hidden');
    renderDMList();
  }catch(e){ notify('Failed to delete conversation','error'); }
}

function renderDMMessages(){
  if(!activeDM) return;
  const k    = dmKey(currentUser.username, activeDM);
  const msgs = DB.dms[k] || [];
  const wrap = document.getElementById('dm-messages-wrap'); if(!wrap) return;
  const prevTop = wrap.scrollTop, prevH = wrap.scrollHeight;
  const wasAtBottom = prevH - prevTop <= wrap.clientHeight + 150;
  const container = document.getElementById('dm-messages'); container.innerHTML = '';
  let lastUser = null, lastDate = null;
  msgs.forEach((m, idx) => {
    if(m.deleted && m.user !== currentUser.username && !isMod(currentUser)){ lastUser = null; return; }
    const ds = formatDateLabel(m.time);
    if(ds && ds !== lastDate){ const dd = document.createElement('div'); dd.className = 'date-divider'; dd.innerHTML = `<span>${ds}</span>`; container.appendChild(dd); lastDate = ds; }
    const showHeader = (m.user !== lastUser) || (currentUser && m.user === currentUser.username && lastUser !== currentUser.username);
    container.appendChild(buildMessage(m, idx, showHeader, activeDM, true));
    lastUser = m.user;
  });
  requestAnimationFrame(() => {
    if(wasAtBottom) wrap.scrollTop = wrap.scrollHeight;
    else wrap.scrollTop = prevTop + (wrap.scrollHeight - prevH);
  });
  renderTypingBar(activeDM, true, 'dm-typing-bar');
}

async function sendDM(){
  const inp = document.getElementById('dm-input'); if(!inp) return;
  const text = inp.value.trim();
  if(!text || !currentUser || !activeDM) return;
  if(text.length > MAX_MSG_LEN){ notify('Too long','warning'); return; }
  const rl = checkRate(dmRateLogs, currentUser);
  if(!rl.ok){
    const rm = document.getElementById('dm-rate-msg');
    if(rm){ rm.textContent = `Wait ${rl.wait}s.`; rm.classList.remove('hidden'); setTimeout(() => rm.classList.add('hidden'), rl.wait * 1000); }
    return;
  }
  try{
    const k       = dmKey(currentUser.username, activeDM);
    const existing = DB.dms[k] || [];
    const updated  = [...existing, { user:currentUser.username, text:filt(text), time:tsNow(), reactions:{} }].slice(-MAX_DM_MSGS);
    const nd = { ...DB.dms, [k]:updated }; DB.dms = nd; scheduleDMWrite(nd);
    inp.value = ''; updateDMCharCtr();
    clearTyping(activeDM, true);
    renderDMMessages();
    const mw = document.getElementById('dm-messages-wrap'); if(mw) mw.scrollTop = mw.scrollHeight;
  }catch{ notify('Failed to send','error'); }
}

function updateDMCharCtr(){
  const inp = document.getElementById('dm-input');
  const ctr = document.getElementById('dm-char-ctr');
  if(!inp || !ctr) return;
  const len = inp.value.length;
  if(len >= WARN_MSG_LEN){ ctr.textContent = MAX_MSG_LEN - len; ctr.className = `char-ctr${len >= MAX_MSG_LEN ? ' danger' : ' warn'}`; }
  else{ ctr.textContent = ''; ctr.className = 'char-ctr'; }
}

/* ══════════════════════════════════════════
   PROFILE
══════════════════════════════════════════ */
function loadProfileSection(){
  const card = document.getElementById('profile-card'); if(!card || !currentUser) return;
  const bg   = currentUser.username === ADMIN_USERNAME ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : userColor(currentUser.username);
  card.innerHTML = `
    <div class="prof-ava" style="background:${bg}">${avatarLetter(currentUser.username)}</div>
    <div class="prof-name">${isMod(currentUser) ? esc(currentUser.name||currentUser.username) : esc(currentUser.username)}</div>
    <div class="prof-username">@${esc(currentUser.username)}</div>
    <div style="margin:.4rem 0 .78rem">${rankBadge(currentUser.rank)}</div>
    <div class="prof-meta">
      ${currentUser.isAdmin ? '<div>👑 Site Administrator</div>' : ''}
      ${isMod(currentUser) && !currentUser.isAdmin ? '<div>🛡 Moderator</div>' : ''}
      ${currentUser.proxyAccess ? '<div>🔗 Proxy Access</div>' : ''}
      <div style="margin-top:.48rem;color:var(--text-faint);font-size:.68rem;">Joined ${currentUser.joinedAt||'—'}</div>
    </div>`;
}

/* ══════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════ */
function admTab(tab){
  document.querySelectorAll('.adm-tab').forEach(b => b.classList.toggle('active', b.dataset.adm === tab));
  document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`adm-${tab}`)?.classList.add('active');
}

function renderAdminPanel(){
  if(!isMod(currentUser)) return;
  renderAdmUsers(); renderAdmPending(); renderAdmChannels(); renderAdmProxyAccess();
}

function renderAdmUsers(){
  const el = document.getElementById('adm-users'); if(!el) return;
  const users = Object.entries(DB.accounts).filter(([,a]) => a.approved && !a.banned);
  // Sort users by rank (highest first) then by username
  const rankOrder = { goat:0, universal:1, galactic:2, solar:3, planetary:4, earthbound:5 };
  users.sort(([,a],[,b]) => {
    const ra = rankOrder[a.rank] ?? rankOrder['earthbound'];
    const rb = rankOrder[b.rank] ?? rankOrder['earthbound'];
    if(ra !== rb) return ra - rb;
    // fallback: alphabetical by username
    const ua = (a.username || '').toLowerCase();
    const ub = (b.username || '').toLowerCase();
    if(ua < ub) return -1; if(ua > ub) return 1; return 0;
  });
  el.innerHTML = `<div style="font-size:.63rem;color:var(--text-muted);margin-bottom:.75rem;">${users.length} approved user(s)</div>`;
  users.forEach(([u, a]) => {
    const isAdminUser = u === ADMIN_USERNAME;
    const row = document.createElement('div'); row.className = 'adm-row';
    row.innerHTML = `<div class="adm-ava" style="background:${isAdminUser ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : userColor(u)}">${avatarLetter(u)}</div>`
      + `<div class="adm-name">${esc(u)}</div><div style="font-size:.63rem;color:var(--text-muted);margin-left:.3rem;">${esc(a.name||'')}</div>${rankBadge(a.rank)}`;
    if(!isAdminUser){
      if(isAdmin(currentUser) || isMod(currentUser)){
        const rb = document.createElement('button'); rb.className = 'ta-btn ta-blue'; rb.textContent = '✎ Rank';
        rb.addEventListener('click', () => openRankModal(u)); row.appendChild(rb);
      }
      const bb = document.createElement('button'); bb.className = 'ta-btn ta-red'; bb.textContent = 'Ban';
      bb.addEventListener('click', () => banUser(u)); row.appendChild(bb);
    } else {
      const lbl = document.createElement('span'); lbl.style.cssText = 'font-size:.58rem;color:var(--text-faint);';
      lbl.textContent = 'protected'; row.appendChild(lbl);
    }
    el.appendChild(row);
  });
  const banned = Object.entries(DB.accounts).filter(([,a]) => a.banned);
  if(banned.length){
    const lbl = document.createElement('div'); lbl.style.cssText = 'font-size:.63rem;color:var(--danger);margin:.88rem 0 .5rem;';
    lbl.textContent = 'Banned'; el.appendChild(lbl);
    banned.forEach(([u]) => {
      const row = document.createElement('div'); row.className = 'adm-row';
      row.innerHTML = `<div class="adm-ava" style="background:${userColor(u)}">${avatarLetter(u)}</div>`
        + `<div class="adm-name" style="opacity:.5">${esc(u)}</div><span style="font-size:.63rem;color:var(--danger);">Banned</span>`;
      const ub = document.createElement('button'); ub.className = 'ta-btn ta-green'; ub.textContent = 'Unban';
      ub.addEventListener('click', () => unbanUser(u)); row.appendChild(ub); el.appendChild(row);
    });
  }
}

function renderAdmPending(){
  const el = document.getElementById('adm-pending'); if(!el) return;
  const pending = Object.entries(DB.accounts).filter(([,a]) => !a.approved && !a.banned);
  const ct = document.getElementById('pending-ct');
  if(ct) ct.textContent = pending.length ? `(${pending.length})` : '';
  el.innerHTML = '';
  if(!pending.length){ el.innerHTML = '<div style="color:var(--text-muted);font-size:.78rem;">No pending accounts.</div>'; return; }
  pending.forEach(([u, a]) => {
    const row = document.createElement('div'); row.className = 'adm-row';
    row.innerHTML = `<div class="adm-ava" style="background:${userColor(u)}">${avatarLetter(u)}</div>`
      + `<div class="adm-name">${esc(u)}</div>`
      + `<div style="font-size:.7rem;color:var(--text-muted);">${esc(a.name||'')}</div>`;
    const ap = document.createElement('button'); ap.className = 'ta-btn ta-green'; ap.textContent = '✓ Approve';
    ap.addEventListener('click', () => approveUser(u));
    const dn = document.createElement('button'); dn.className = 'ta-btn ta-red'; dn.textContent = '✕ Deny';
    dn.addEventListener('click', () => denyUser(u));
    row.append(ap, dn); el.appendChild(row);
  });
}

function renderAdmChannels(){
  const el = document.getElementById('adm-channels'); if(!el) return;
  el.innerHTML = '';
  getThreads().forEach(t => {
    const isDefault = DEFAULT_THREADS.find(d => d.id === t.id);
    const row = document.createElement('div'); row.className = 'adm-row';
    row.innerHTML = `<span style="font-size:.88rem;">${esc(t.emoji||'💬')}</span>`
      + `<span class="adm-name">#${esc(t.name)}</span>`
      + `<span style="font-size:.63rem;color:var(--text-faint);">${t.announceOnly ? 'announce-only' : 'public'}</span>`;
    if(!isDefault){
      const del = document.createElement('button'); del.className = 'ta-btn ta-red'; del.textContent = '✕ Delete';
      del.addEventListener('click', () => deleteThread(t.id)); row.appendChild(del);
    } else {
      const lbl = document.createElement('span'); lbl.style.cssText = 'font-size:.58rem;color:var(--text-faint);';
      lbl.textContent = 'protected'; row.appendChild(lbl);
    }
    el.appendChild(row);
  });
  const addBtn = document.createElement('button'); addBtn.className = 'btn btn-sm'; addBtn.style.marginTop = '.65rem';
  addBtn.textContent = '+ New Channel'; addBtn.addEventListener('click', openCreateThread); el.appendChild(addBtn);
}

function renderAdmProxyAccess(){
  if(!isAdmin(currentUser)) return;
  const el = document.getElementById('adm-proxy-access'); if(!el) return;
  el.innerHTML = '<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.75rem;">Toggle proxy access per user.</div>';
  Object.entries(DB.accounts).filter(([u, a]) => a.approved && !a.banned && u !== ADMIN_USERNAME).forEach(([u, a]) => {
    const hasAccess = a.proxyAccess || false;
    const row = document.createElement('div'); row.className = 'adm-row';
    row.innerHTML = `<div class="adm-ava" style="background:${userColor(u)}">${avatarLetter(u)}</div><div class="adm-name">${esc(u)}</div>`;
    const toggle = document.createElement('button');
    toggle.className = `ta-btn ${hasAccess ? 'ta-red' : 'ta-green'}`;
    toggle.textContent = hasAccess ? 'Revoke' : 'Grant Access';
    toggle.addEventListener('click', () => toggleProxyAccess(u, !hasAccess));
    row.appendChild(toggle); el.appendChild(row);
  });
}

async function approveUser(u){
  try{ await setDoc(REFS.accounts, { ...DB.accounts, [u]:{ ...DB.accounts[u], approved:true } }); notify(`${u} approved`,'success'); }
  catch{ notify('Failed','error'); }
}
async function denyUser(u){
  if(!(await showConfirm(`Deny and delete "${u}"?`, 'Deny user'))) return;
  try{ const up = { ...DB.accounts }; delete up[u]; await setDoc(REFS.accounts, up); notify(`${u} denied`,'success'); }
  catch{ notify('Failed','error'); }
}
async function banUser(u){
  if(!(await showConfirm(`Ban "${u}"?`, 'Ban user'))) return;
  try{ await setDoc(REFS.accounts, { ...DB.accounts, [u]:{ ...DB.accounts[u], banned:true } }); notify(`${u} banned`,'success'); }
  catch{ notify('Failed','error'); }
}
async function unbanUser(u){
  try{ await setDoc(REFS.accounts, { ...DB.accounts, [u]:{ ...DB.accounts[u], banned:false } }); notify(`${u} unbanned`,'success'); }
  catch{ notify('Failed','error'); }
}
async function toggleProxyAccess(u, grant){
  try{
    await setDoc(REFS.accounts, { ...DB.accounts, [u]:{ ...DB.accounts[u], proxyAccess:grant } });
    notify(`${u} proxy access ${grant ? 'granted' : 'revoked'}`,'success');
  }catch{ notify('Failed','error'); }
}

function openRankModal(u){
  rankTarget = u;
  document.getElementById('rank-mdesc').textContent = `Assign rank to ${u}`;
  const container = document.getElementById('rank-buttons'); container.innerHTML = '';
  const allowed   = isAdmin(currentUser) ? RANKS : [...RANKS].filter(r => r !== 'universal');
  allowed.forEach(rank => {
    const btn = document.createElement('button');
    btn.className = `rank-btn ${rank}`;
    btn.textContent = RANK_LABELS[rank] || rank;
    btn.addEventListener('click', () => grantRank(rank));
    container.appendChild(btn);
  });
  openModal('rank-modal');
}
function closeRankModal(){ closeModal('rank-modal'); rankTarget = null; }
async function grantRank(rank){
  if(!rankTarget) return;
  if(rankTarget === ADMIN_USERNAME){ notify('Cannot change admin rank','error'); closeRankModal(); return; }
  if(!isAdmin(currentUser) && (rank === 'universal' || rank === 'goat')){ notify('Only the admin can grant that rank','error'); closeRankModal(); return; }
  try{
    await setDoc(REFS.accounts, { ...DB.accounts, [rankTarget]:{ ...DB.accounts[rankTarget], rank } });
    notify(`${rankTarget} → ${rank}`,'success'); closeRankModal();
  }catch{ notify('Failed','error'); }
}

/* ══════════════════════════════════════════
   PROXIES
══════════════════════════════════════════ */
function renderProxies(){
  const pl = document.getElementById('proxy-list'); if(!pl) return;
  // Use `isAdmin` helper so `goat` rank (and explicit admins) can edit
  const canEdit = typeof isAdmin === 'function' ? isAdmin(currentUser) : !!currentUser?.isAdmin;
  // Toggle edit mode UI state
  window.proxyEditMode = window.proxyEditMode || false;
  const ed = document.getElementById('proxy-editor');
  if(ed) ed.classList.toggle('hidden', !(canEdit && window.proxyEditMode));

  // Ensure a single global Edit toggle above the proxy grid (not per-card)
  const container = pl.parentElement || pl;
  let controls = container.querySelector('.proxy-controls');
  if(!controls && container){
    controls = document.createElement('div');
    controls.className = 'proxy-controls';
    controls.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:.8rem;';
    container.insertBefore(controls, pl);
  }
  if(controls) controls.innerHTML = canEdit ? `<button id="proxy-edit-toggle" class="btn btn-sm">${window.proxyEditMode ? 'Done' : 'Edit'}</button>` : '';

  // Sort categories alphabetically for display but keep original indices for edits
  const proxies = (DB.proxies||[]).map((p,idx) => ({ ...p, __origIndex: idx }))
    .slice()
    .sort((a,b) => ( (a.name||'').localeCompare(b.name||'', undefined, { sensitivity: 'base' }) ));

  pl.innerHTML = proxies.map((p) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.72rem;">
        <div style="display:flex;align-items:center;gap:.6rem;"><div class="card-title">${esc(p.name)}</div></div>
        ${canEdit && window.proxyEditMode ? `<div><button onclick="delCat(${p.__origIndex})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.68rem;font-weight:800;font-family:'Inter',sans-serif;margin-right:8px;">REMOVE</button></div>` : ''}
      </div>
      ${p.links.map((l,li) => `
        <div style="display:flex;gap:5px;align-items:center;">
          <a href="${esc(l)}" target="_blank" rel="noopener noreferrer" class="blurred-link">${esc(l)}</a>
          ${canEdit && window.proxyEditMode ? `<button onclick="delLink(${p.__origIndex},${li})" style="color:var(--danger);background:none;border:none;cursor:pointer;font-size:1rem;flex-shrink:0;">×</button>` : ''}
        </div>`).join('')}
      ${canEdit && window.proxyEditMode ? `<div style="margin-top:.88rem;padding-top:.72rem;border-top:1px solid var(--border2);">
        <input type="text" id="link-in-${p.__origIndex}" class="sinput" placeholder="Add URL…" autocomplete="off">
        <button class="btn btn-sm" onclick="addLink(${p.__origIndex})" style="width:100%;margin-top:.3rem">Save Link</button>
      </div>` : ''}
    </div>`).join('');

  // Wire the edit toggle button after rendering
  const toggle = document.getElementById('proxy-edit-toggle');
  if(toggle){
    toggle.addEventListener('click', () => { window.proxyEditMode = !window.proxyEditMode; renderProxies(); });
  }
}

window.addCat = async () => {
  const n = document.getElementById('new-cat-name').value.trim();
  if(!n){ notify('Name required','warning'); return; }
  try{ await setDoc(REFS.proxies, { list:[...DB.proxies, { name:n, links:[] }] }); document.getElementById('new-cat-name').value = ''; notify('Created','success'); }
  catch{ notify('Failed','error'); }
};
window.addLink = async i => {
  const inp = document.getElementById(`link-in-${i}`); const url = inp.value.trim();
  if(!url){ notify('URL required','warning'); return; }
  try{ new URL(url); }catch{ notify('Invalid URL','error'); return; }
  try{
    const p = [...DB.proxies]; p[i] = { ...p[i], links:[...p[i].links, url] };
    await setDoc(REFS.proxies, { list:p }); inp.value = ''; notify('Added','success');
  }catch{ notify('Failed','error'); }
};
window.delLink = async (ci, li) => {
  try{
    const p = [...DB.proxies]; p[ci] = { ...p[ci], links:p[ci].links.filter((_,i) => i !== li) };
    await setDoc(REFS.proxies, { list:p }); notify('Removed','success');
  }catch{ notify('Failed','error'); }
};
window.delCat = async i => {
  if(!(await showConfirm(`Delete "${DB.proxies[i].name}"?`, 'Delete category'))) return;
  try{ const p = [...DB.proxies]; p.splice(i,1); await setDoc(REFS.proxies, { list:p }); notify('Deleted','success'); }
  catch{ notify('Failed','error'); }
};

/* ══════════════════════════════════════════
   GAME VAULT
══════════════════════════════════════════ */
async function loadZones(){
  const cacheKey = 'nebula-zones-cache', cacheTTL = 30 * 60 * 1000;
  try{
    const cached = sessionStorage.getItem(cacheKey);
    if(cached){
      const { ts, data } = JSON.parse(cached);
      if(Date.now() - ts < cacheTTL){ zones = data; await fetchPopularity(); finishZonesLoad(); return; }
    }
  }catch{}
  try{
    let url = ZONE_URLS[0];
    try{
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 4000);
      const r = await fetch("https://api.github.com/repos/gn-math/assets/commits?t=" + Date.now(), { signal:controller.signal });
      clearTimeout(tid);
      if(r.status === 200){ const j = await r.json(); const sha = j[0]?.sha; if(sha) url = `https://cdn.jsdelivr.net/gh/gn-math/assets@${sha}/zones.json`; }
    }catch{}
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url + "?t=" + Date.now(), { signal:controller.signal });
    clearTimeout(tid);
    zones = await res.json();
    zones = zones.filter(z => !z.name.includes("SUGGEST"));
    try{ sessionStorage.setItem(cacheKey, JSON.stringify({ ts:Date.now(), data:zones })); }catch{}
    await fetchPopularity();
    finishZonesLoad();
  }catch{
    const loading = document.getElementById('vault-loading');
    if(loading) loading.innerHTML = '<span>⚠️ Failed to load games</span>';
  }
}

/* Fetch jsDelivr popularity stats — identical to GhostLink */
async function fetchPopularity(){
  try{
    const res  = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
    const data = await res.json();
    data.forEach(file => {
      const m = file.name.match(/\/(\d+)\.html$/);
      if(m) popularityData[parseInt(m[1])] = file.hits.total;
    });
  }catch{ popularityData[0] = 0; }
}

function finishZonesLoad(){
  document.getElementById('vault-loading')?.remove();
  showGameSkeletons();
  setTimeout(() => {
    document.getElementById('game-skel-grid')?.remove();
    setupFeatured();
    renderVaultGrid(getFilteredZones());
    setupGameObserver();
  }, 300);
}

function showGameSkeletons(){
  const wrap = document.getElementById('vault-featured-wrap'); if(!wrap) return;
  const grid = document.createElement('div'); grid.className = 'game-skel-grid'; grid.id = 'game-skel-grid';
  for(let i = 0; i < 12; i++){
    const c = document.createElement('div'); c.className = 'game-skel-card';
    c.innerHTML = '<div class="game-skel-img"></div><div class="game-skel-name"></div>';
    grid.appendChild(c);
  }
  document.getElementById('vault-scroll').insertBefore(grid, document.getElementById('vault-featured-wrap'));
}

function setupGameObserver(){
  if(gameObserver) gameObserver.disconnect();
  gameObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const img = entry.target;
        if(img.dataset.src){ img.src = img.dataset.src; delete img.dataset.src; }
        gameObserver.unobserve(img);
      }
    });
  }, { rootMargin:'200px' });
  document.querySelectorAll('#game-grid img[data-src]').forEach(img => gameObserver.observe(img));
}

/* setupFeatured — seeded random, exactly as GhostLink */
function setupFeatured(){
  if(zones.length < 5) return;
  const now  = new Date();
  const seed = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + (now.getHours() < 12 ? 'AM' : 'PM');
  let h = 0; for(let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const rand = () => { h = Math.sin(h) * 10000; return h - Math.floor(h); };
  let pool = [...zones].filter(z => !z.name.includes("SUGGEST")); featuredGames = [];
  for(let i = 0; i < Math.min(10, pool.length); i++){
    const idx = Math.floor(rand() * pool.length);
    featuredGames.push(pool.splice(idx,1)[0]);
  }
  renderFeatured();
}

function renderFeatured(){
  document.getElementById('vault-featured-block')?.remove();
  const wrap = document.createElement('div'); wrap.id = 'vault-featured-block'; wrap.className = 'vault-featured';

  const itemsVisible = window.innerWidth > 800 ? 5 : 2;
  const clonesBefore = featuredGames.slice(-itemsVisible);
  const clonesAfter  = featuredGames.slice(0, itemsVisible);
  const displayPool  = [...clonesBefore, ...featuredGames, ...clonesAfter];

  wrap.innerHTML = `
    <div class="vault-featured-hdr">⭐ Featured Today</div>
    <button class="carousel-btn" id="carousel-prev">❮</button>
    <div class="carousel-viewport"><div id="feat-track"></div></div>
    <button class="carousel-btn" id="carousel-next">❯</button>`;
  document.getElementById('vault-featured-wrap').appendChild(wrap);

  const track = document.getElementById('feat-track');
  displayPool.forEach(z => {
    const d   = document.createElement('div'); d.className = 'feat-item';
    d.addEventListener('click', () => openZone(z));
    const img = document.createElement('img');
    img.src     = z.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL);
    img.loading = 'lazy'; img.alt = z.name;
    const p   = document.createElement('div');
    p.style.cssText = 'font-size:.63rem;color:var(--text-muted);margin-top:7px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    p.textContent = z.name;
    d.append(img, p); track.appendChild(d);
  });

  carouselIdx = itemsVisible;
  updateCarouselPos(false);

  document.getElementById('carousel-prev').addEventListener('click', () => carouselNav(-1));
  document.getElementById('carousel-next').addEventListener('click', () => carouselNav(1));

  startCarousel();
}

function updateCarouselPos(anim = true){
  const track = document.getElementById('feat-track'); if(!track) return;
  const vis   = window.innerWidth > 800 ? 5 : 2;
  track.style.transition = anim ? 'transform .6s cubic-bezier(.23,1,.32,1)' : 'none';
  track.style.transform  = `translateX(-${carouselIdx * (100 / vis)}%)`;
}

function startCarousel(){ clearInterval(carouselTimer); carouselTimer = setInterval(() => moveCarousel(1), 4000); }

function moveCarousel(dir){
  if(carouselBusy) return;
  const vis   = window.innerWidth > 800 ? 5 : 2;
  const total = featuredGames.length;
  carouselBusy = true; carouselIdx += dir; updateCarouselPos(true);
  setTimeout(() => {
    if(carouselIdx >= total + vis){ carouselIdx = vis; updateCarouselPos(false); }
    else if(carouselIdx <= 0){ carouselIdx = total; updateCarouselPos(false); }
    carouselBusy = false;
  }, 620);
}

function carouselNav(dir){
  moveCarousel(dir); clearInterval(carouselTimer); clearTimeout(carouselPause);
  carouselPause = setTimeout(startCarousel, 4000);
}

window.addEventListener('resize', () => { if(featuredGames.length) renderFeatured(); });

/* getFilteredZones — includes sort exactly as GhostLink */
function getFilteredZones(){
  let filtered = zones.filter(z => {
    const ms = z.name.toLowerCase().includes(vaultQuery.toLowerCase());
    const mf = showFavsOnly ? gameFavs.includes(z.id) : true;
    return ms && mf;
  });
  if(vaultSortBy === 'name'){
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if(vaultSortBy === 'id'){
    filtered.sort((a, b) => b.id - a.id);
  } else {
    // popular (default)
    filtered.sort((a, b) => (popularityData[b.id]||0) - (popularityData[a.id]||0));
  }
  return filtered;
}

function toggleFavFilter(){
  showFavsOnly = !showFavsOnly;
  document.getElementById('fav-filter-btn').classList.toggle('active', showFavsOnly);
  renderVaultGrid(getFilteredZones());
}

function renderVaultGrid(data){
  const grid = document.getElementById('game-grid'); if(!grid) return;
  grid.innerHTML = '';
  if(!data.length){
    grid.innerHTML = '<div class="vault-empty"><div class="vault-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 12h.01M18 12h.01"/></svg></div><div>No games found</div></div>';
    return;
  }
  data.forEach(z => {
    const card = document.createElement('div'); card.className = 'game-card';
    card.addEventListener('click', () => openZone(z));
    const fav = document.createElement('button'); fav.className = `game-fav-btn${gameFavs.includes(z.id) ? ' active' : ''}`;
    fav.innerHTML = '<svg viewBox="0 0 24 24" stroke-width="2" width="13" height="13"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
    fav.title = 'Favorite'; fav.addEventListener('click', e => { e.stopPropagation(); toggleGameFav(z.id); });
    const img = document.createElement('img');
    img.dataset.src = z.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL);
    img.src     = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="%230d1c33" width="1" height="1"/></svg>';
    img.loading = 'lazy'; img.alt = z.name;
    const body = document.createElement('div'); body.className = 'game-card-body';
    const name = document.createElement('div'); name.className = 'game-card-name'; name.textContent = z.name;
    body.appendChild(name); card.append(fav, img, body); grid.appendChild(card);
  });
  requestAnimationFrame(setupGameObserver);
}

function toggleGameFav(id){
  if(gameFavs.includes(id)) gameFavs = gameFavs.filter(f => f !== id); else gameFavs.push(id);
  localStorage.setItem('gn-favs', JSON.stringify(gameFavs));
  renderVaultGrid(getFilteredZones());
}

/* ── openZone — matches GhostLink exactly ── */
function openZone(z){
  if(z.name === "[!] SUGGEST GAMES .gg/D4c9VFYWyU"){
    window.open("https://discord.com/invite/dKs2sUNUXd", "_blank"); return;
  }
  if(z.url.startsWith('http')){ window.open(z.url, '_blank'); return; }

  const url   = z.url.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL);
  const vault = document.getElementById('game-vault');

  // Prefer the existing static iframe in the DOM (declared in main.html).
  const existing = document.getElementById('game-frame');
  if(existing && existing.parentNode === vault){
    zoneFrame = existing;
    zoneFrameIsDynamic = false;
    // Ensure it uses flex to fill remaining space beneath the header
    zoneFrame.style.cssText = 'border:none;width:100%;flex:1 1 auto;min-height:0;display:block;background:transparent;height:auto;';
  } else if(!zoneFrame || !zoneFrame.parentNode){
    // Create a dynamic iframe (will be removed on close)
    zoneFrame = document.createElement('iframe');
    zoneFrame.id = 'game-frame';
    zoneFrame.style.cssText = 'border:none;width:100%;flex:1 1 auto;min-height:0;display:block;background:transparent;height:auto;';
    vault.appendChild(zoneFrame);
    zoneFrameIsDynamic = true;
  }

  fetch(url + "?t=" + Date.now())
    .then(r => r.text())
    .then(html => {
      html = cleanHTML(html);
      zoneFrame.contentDocument.open();
      zoneFrame.contentDocument.write(html);
      zoneFrame.contentDocument.close();
      document.getElementById('vault-title').textContent = 'VAULT: ' + z.name.toUpperCase();
      vault.dataset.zoneId = z.id;
      vault.style.display = 'flex';
    })
    .catch(e => { if(e?.name !== 'AbortError') notify('Failed to load game','error'); });
}

/* ── doCloseGame — removes iframe like GhostLink ── */
function doCloseGame(){
  const vault = document.getElementById('game-vault');
  if(vault) vault.style.display = 'none';

  if(zoneFrame && zoneFrame.parentNode){
    try{ zoneFrame.contentWindow?.stop?.(); }catch{}
    if(zoneFrameIsDynamic){
      // remove dynamically created iframe
      zoneFrame.parentNode.removeChild(zoneFrame);
    } else {
      // static iframe: reset to blank and keep it in DOM
      try{ zoneFrame.contentDocument.open(); zoneFrame.contentDocument.write(''); zoneFrame.contentDocument.close(); }catch{}
      zoneFrame.src = 'about:blank';
    }
  }
  zoneFrame = null;
  zoneFrameIsDynamic = false;

  const title = document.getElementById('vault-title');
  if(title) title.textContent = 'NEBULA VAULT';

  const modal = document.getElementById('game-close-modal');
  if(modal && !modal.classList.contains('hidden')){
    modal.classList.add('hidden');
    if(!document.querySelector('.modal:not(.hidden)')){
      const ov = document.getElementById('modal-overlay');
      if(ov){ ov.classList.add('hidden'); ov.classList.remove('closing'); }
    }
  }
}

/* ── downloadZone — identical to GhostLink ── */
function downloadZone(){
  const vault = document.getElementById('game-vault'); if(!vault) return;
  const z = zones.find(z => String(z.id) === String(vault.dataset.zoneId));
  if(!z){ notify('Zone not found','error'); return; }
  const url = z.url.replace('{HTML_URL}', HTML_URL).replace('{COVER_URL}', COVER_URL);
  fetch(url + "?t=" + Date.now())
    .then(r => r.text())
    .then(text => {
      text = cleanHTML(text);
      const blob = new Blob([text], { type:'text/plain;charset=utf-8' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = z.name + '.html';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(a.href);
    })
    .catch(() => notify('Download failed','error'));
}

function toggleFS(){
  const f = zoneFrame; if(!f) return;
  const req = f.requestFullscreen || f.webkitRequestFullscreen || f.mozRequestFullScreen || f.msRequestFullscreen;
  if(req) req.call(f);
}

/* ══════════════════════════════════════════
   TOOLTIPS
══════════════════════════════════════════ */
async function loadTooltips(){
  const c = document.getElementById('tt-wrap'); if(!c) return;
  let msgs = ["GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE","SYSTEM ONLINE"];
  try{ const d = await (await fetch('tooltips.json')).json(); if(d.messages?.length) msgs = d.messages; }catch{}
  const shuffle = arr => { const a = [...arr]; for(let i = a.length-1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
  let deck = [], last = null;
  const next = () => {
    if(!deck.length){ deck = shuffle(msgs); if(deck[0] === last && deck.length > 1) deck.push(deck.shift()); }
    last = deck.shift(); return last;
  };
  const mk = t => { const e = document.createElement('span'); e.className = 'tt-el'; e.textContent = t; return e; };
  async function show(t){
    const e = mk(t); e.classList.add('enter'); c.appendChild(e);
    await new Promise(r => setTimeout(r, 550)); e.classList.replace('enter','vis');
    await new Promise(r => setTimeout(r, 7500)); e.classList.replace('vis','exit');
    await new Promise(r => setTimeout(r, 400)); e.remove();
  }
  (async () => { while(true){ await show(next()); await new Promise(r => setTimeout(r, 80)); } })();
}

/* ══════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════ */
function globalKeyHandler(e){
  if(e.key === 'Escape'){
    const o = document.querySelector('.modal:not(.hidden)'); if(o){ closeModal(o.id); return; }
    if(document.getElementById('game-vault')?.style.display === 'flex'){ doCloseGame(); return; }
    if(!document.getElementById('mobile-drawer')?.classList.contains('hidden')){ closeMobileDrawer(); return; }
    document.getElementById('epicker')?.classList.add('hidden');
  }
  if((e.ctrlKey || e.metaKey) && e.key === 'k'){
    e.preventDefault();
    if(activeSection === 'chat') document.getElementById('chat-input')?.focus();
    if(activeSection === 'dms')  document.getElementById('dm-input')?.focus();
  }
}