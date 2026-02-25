import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ══════════════════════════════════════════
   FIREBASE
══════════════════════════════════════════ */
const app = initializeApp({
  apiKey:"",
  authDomain:"goattechneverdies.firebaseapp.com",
  projectId:"goattechneverdies",
  storageBucket:"goattechneverdies.firebasestorage.app",
  messagingSenderId:"1090005757417",
  appId:"1:1090005757417:web:8698673d23f79fb9886f78"
});
const db = getFirestore(app);
const REFS = {
  accounts : doc(db,"nebula","accounts"),
  threads  : doc(db,"nebula","threads"),
  messages : doc(db,"nebula","messages"),
  dms      : doc(db,"nebula","dms"),
  proxies  : doc(db,"nebula","proxies"),
  config   : doc(db,"nebula","config"),
};

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const ADMIN_USERNAME   = "GoatTech";
const ADMIN_PASSWORD   = "CanNeverSt0pTheGoat";
const ADMIN_NAME       = "Luke";
const MAX_CHANNEL_MSGS = 75;
const MAX_DM_MSGS      = 25;
const MAX_MSG_LEN      = 500;
const WARN_MSG_LEN     = 400;

const ZONE_URLS = [
  "https://cdn.jsdelivr.net/%67%68/%67%6e%2d%6d%61%74%68/%61%73%73%65%74%73@%6d%61%69%6e/%7a%6f%6e%65%73%2e%6a%73%6f%6e",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@master/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets/zones.json"
];
const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_URL  = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const EMOJIS    = ['👍','💔','😂','😭','🤯','🔥','😃','🥀','👀','💀'];
const PROFANITY = ['fuck','shit','bitch','dick','cock','pussy','bastard','slut','whore','fag','nigga','nigger','retard','cunt','asshole'];

const DEFAULT_THREADS = [
  {id:'general',       name:'general',       emoji:'💬', password:'', locked:false, announceOnly:false},
  {id:'announcements', name:'announcements', emoji:'📢', password:'', locked:false, announceOnly:true},
];

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let currentUser   = null;
let DB = { accounts:{}, threads:[], messages:{}, dms:{}, proxies:[], config:{} };
let activeSection = 'home';
let activeThread  = null;
let activeDM      = null;
let unreadThreads = {};
let unreadDMs     = {};
let rateLogs      = [];
let dmRateLogs    = [];
let pdel          = {ctx:null, idx:null, isDM:false};
let rankTarget    = null;
let pendingThread = null;
let atBottom      = true;
let newMsgCount   = 0;
let switching     = false;

/* vault */
let zones=[], gameFavs=JSON.parse(localStorage.getItem('nebula-gfavs')||'[]');
let showFavsOnly=false, vaultQuery='';
let featuredGames=[], carouselIdx=0, carouselTimer=null, carouselPause=null, carouselBusy=false;
let activeZone=null;

/* notif prefs */
const NOTIF_KEY      = 'nebula-notif-prefs';
const getNotifPrefs  = () => { try{return JSON.parse(localStorage.getItem(NOTIF_KEY)||'{}');}catch{return{};} };
const saveNotifPrefsData = p => localStorage.setItem(NOTIF_KEY, JSON.stringify(p));

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };
const deb = (fn,w) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),w); }; };
const filt = t => { PROFANITY.forEach(w=>{ t=t.replace(new RegExp(w,'gi'),'*'.repeat(w.length)); }); return t; };
const hashPass = async p => {
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
};
const userColor = u => {
  let h=0; for(let i=0;i<u.length;i++) h=u.charCodeAt(i)+((h<<5)-h);
  const c=[
    'linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)','linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#30cfd0,#330867)',
    'linear-gradient(135deg,#ff9a9e,#fecfef)','linear-gradient(135deg,#ffecd2,#fcb69f)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)','linear-gradient(135deg,#ff6e7f,#bfe9ff)'
  ];
  return c[Math.abs(h)%c.length];
};
const avatarLetter   = u => (u||'?').charAt(0).toUpperCase();
const isMod          = u => { if(!u) return false; return u.username===ADMIN_USERNAME||u.rank==='universal'; };
const rankBadge      = r => {
  r=r||'planetary';
  const L={planetary:'🌍 Planetary',solar:'☀️ Solar',galactic:'🌌 Galactic',universal:'✦ Universal'};
  return `<span class="rbadge ${r}">${L[r]}</span>`;
};
const rankColorText  = r => ({planetary:'#38bdf8',solar:'#f59e0b',galactic:'#a855f7',universal:'#e2e8f0'}[r]||'#38bdf8');
const tsNow          = () => new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',timeZone:'America/Los_Angeles'});
const dmKey          = (a,b) => [a,b].sort().join('__');
const relTime = ts => {
  if(!ts) return '';
  const [time,period]=ts.split(' '); if(!period) return ts;
  let [hh,mm]=time.split(':').map(Number);
  if(period==='PM'&&hh!==12) hh+=12; if(period==='AM'&&hh===12) hh=0;
  const d=new Date(); d.setHours(hh,mm,0,0); if(d>new Date()) d.setDate(d.getDate()-1);
  const diff=new Date()-d, mins=Math.floor(diff/60000), hrs=Math.floor(diff/3600000), days=Math.floor(diff/86400000);
  if(mins<1) return 'just now'; if(mins<60) return `${mins}m ago`;
  if(hrs<6) return `${hrs}h ago`;
  if(days===0) return `Today at ${ts}`; if(days===1) return `Yesterday at ${ts}`;
  const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${M[d.getMonth()]} ${d.getDate()} at ${ts}`;
};

function notify(msg, type='info'){
  const n=document.createElement('div'); n.className=`notif ${type}`;
  n.innerHTML=`<div class="ntype">${type}</div><div class="nmsg">${msg}</div>`;
  document.getElementById('notif-stack').appendChild(n);
  setTimeout(()=>{ n.style.animation='notifSlide .2s ease reverse'; setTimeout(()=>n.remove(),200); },2800);
}
function openModal(id){
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id){
  document.getElementById(id).classList.add('hidden');
  if(!document.querySelector('.modal:not(.hidden)'))
    document.getElementById('modal-overlay').classList.add('hidden');
}
window.closeTopModal = () => { const o=document.querySelector('.modal:not(.hidden)'); if(o) closeModal(o.id); };
function checkRate(logs, user){
  const now=Date.now(), win=60000;
  const limit=user?.username===ADMIN_USERNAME?200:isMod(user)?40:10;
  while(logs.length&&now-logs[0]>win) logs.shift();
  if(logs.length>=limit){ const wait=Math.ceil((win-(now-logs[0]))/1000); return{ok:false,wait}; }
  logs.push(now); return{ok:true};
}

/* ══════════════════════════════════════════
   BROWSER NOTIFICATIONS
══════════════════════════════════════════ */
function pushBrowserNotif(title, body, tag){
  const prefs=getNotifPrefs();
  if(prefs.muteAll||Notification.permission!=='granted') return;
  try{ new Notification(title,{body,tag,icon:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌌</text></svg>"}); }catch{}
}
window.requestNotifPerm = async () => {
  const result=await Notification.requestPermission();
  updateNotifPermUI();
  if(result==='granted') notify('Notifications enabled','success');
  else if(result==='denied') notify('Notifications blocked — check browser settings','warning');
};
function updateNotifPermUI(){
  const perm=Notification.permission;
  const btn=document.getElementById('notif-perm-btn');
  const stat=document.getElementById('notif-perm-status');
  if(!btn||!stat) return;
  if(perm==='granted'){
    btn.textContent='Enabled ✓'; btn.disabled=true;
    stat.textContent='✓ Browser notifications are active'; stat.className='nsc-status granted';
  }else if(perm==='denied'){
    btn.textContent='Blocked'; btn.disabled=true;
    stat.textContent='✕ Blocked — go to site settings to allow'; stat.className='nsc-status denied';
  }else{
    btn.textContent='Enable'; btn.disabled=false;
    stat.textContent='Click Enable to allow notifications'; stat.className='nsc-status default';
  }
}
window.saveNotifPrefs = () => {
  const prefs=getNotifPrefs();
  prefs.dms     = document.getElementById('ntog-dms')?.checked||false;
  prefs.muteAll = document.getElementById('ntog-mute')?.checked||false;
  prefs.channels=prefs.channels||{};
  document.querySelectorAll('.cnr-checkbox').forEach(cb=>{ prefs.channels[cb.dataset.tid]=cb.checked; });
  saveNotifPrefsData(prefs);
  notify('Preferences saved','success');
};
function renderNotifSection(){
  updateNotifPermUI();
  const prefs=getNotifPrefs();
  const dmTog=document.getElementById('ntog-dms');
  const muteTog=document.getElementById('ntog-mute');
  if(dmTog)   dmTog.checked  =prefs.dms||false;
  if(muteTog) muteTog.checked=prefs.muteAll||false;
  renderNotifChannels();
}
function renderNotifChannels(){
  const el=document.getElementById('notif-channel-list'); if(!el) return;
  el.innerHTML='';
  const prefs=getNotifPrefs(); const subs=prefs.channels||{};
  getThreads().forEach(t=>{
    const row=document.createElement('div'); row.className='channel-notif-row';
    row.innerHTML=`
      <span class="cnr-icon">${esc(t.emoji||'💬')}</span>
      <div style="flex:1">
        <div class="cnr-name">#${esc(t.name)}</div>
        <div class="cnr-sub">${t.announceOnly?'Announcements channel':'Community channel'}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" class="cnr-checkbox" data-tid="${esc(t.id)}" onchange="saveNotifPrefs()" ${subs[t.id]?'checked':''}>
        <span class="toggle-track"></span>
      </label>`;
    el.appendChild(row);
  });
}

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
window.authTab = tab => {
  ['signin','signup'].forEach(t=>{
    document.getElementById(`tab-${t}`).classList.toggle('active',t===tab);
    document.getElementById(`panel-${t}`).classList.toggle('hidden',t!==tab);
  });
  document.getElementById('si-err').textContent='';
  document.getElementById('su-err').textContent='';
};
window.doSignIn = async () => {
  const u=document.getElementById('si-user').value.trim().toLowerCase();
  const p=document.getElementById('si-pass').value;
  const err=document.getElementById('si-err'); err.textContent='';
  if(!u||!p){err.textContent='Fill all fields.';return;}
  if(u===ADMIN_USERNAME.toLowerCase()){
    if(p!==ADMIN_PASSWORD){err.textContent='Wrong password.';return;}
    await ensureAdminAccount();
    currentUser={username:ADMIN_USERNAME,name:ADMIN_NAME,rank:'universal',approved:true,banned:false,isAdmin:true,proxyAccess:true};
    localStorage.setItem('nebula_sess',JSON.stringify(currentUser));
    launchApp(); return;
  }
  await loadAccounts();
  const acct=DB.accounts[u];
  if(!acct){err.textContent='Account not found.';return;}
  if(await hashPass(p)!==acct.passHash){err.textContent='Wrong password.';return;}
  if(acct.banned){err.textContent='Account suspended.';return;}
  if(!acct.approved){currentUser={...acct,username:u};showPending();return;}
  currentUser={...acct,username:u,isAdmin:false};
  localStorage.setItem('nebula_sess',JSON.stringify(currentUser));
  launchApp();
};
window.doSignUp = async () => {
  const name=document.getElementById('su-name').value.trim();
  const u=document.getElementById('su-user').value.trim().toLowerCase().replace(/[^a-z0-9_\-]/g,'');
  const p=document.getElementById('su-pass').value;
  const p2=document.getElementById('su-pass2').value;
  const err=document.getElementById('su-err'); err.textContent='';
  if(!name||!u||!p||!p2){err.textContent='Fill all fields.';return;}
  if(u.length<2){err.textContent='Username too short (min 2).';return;}
  if(u===ADMIN_USERNAME.toLowerCase()){err.textContent='Reserved username.';return;}
  if(p.length<6){err.textContent='Password must be 6+ chars.';return;}
  if(p!==p2){err.textContent='Passwords do not match.';return;}
  await loadAccounts();
  if(DB.accounts[u]){err.textContent='Username taken.';return;}
  try{
    await setDoc(REFS.accounts,{...DB.accounts,[u]:{
      name,passHash:await hashPass(p),rank:'planetary',
      approved:false,banned:false,proxyAccess:false,joinedAt:tsNow()
    }});
    notify('Account requested! Awaiting approval.','success');
    authTab('signin');
    ['su-name','su-user','su-pass','su-pass2'].forEach(id=>document.getElementById(id).value='');
  }catch{err.textContent='Failed. Try again.';}
};
window.signOut = () => { currentUser=null; localStorage.removeItem('nebula_sess'); location.reload(); };
function showPending(){
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('pending-screen').classList.remove('hidden');
}
async function ensureAdminAccount(){
  await loadAccounts();
  if(!DB.accounts[ADMIN_USERNAME]){
    await setDoc(REFS.accounts,{...DB.accounts,[ADMIN_USERNAME]:{
      name:ADMIN_NAME,passHash:await hashPass(ADMIN_PASSWORD),
      rank:'universal',approved:true,banned:false,proxyAccess:true,joinedAt:tsNow()
    }});
    await loadAccounts();
  }
}
async function loadAccounts(){
  const snap=await getDoc(REFS.accounts);
  if(snap.exists()) DB.accounts=snap.data()||{};
}

/* ── restore session ── */
(async()=>{
  try{
    const saved=localStorage.getItem('nebula_sess');
    if(!saved) return;
    const sess=JSON.parse(saved);
    await loadAccounts();
    if(sess.username===ADMIN_USERNAME){
      await ensureAdminAccount();
      currentUser={...sess,isAdmin:true,proxyAccess:true};
      launchApp(); return;
    }
    const live=DB.accounts[sess.username];
    if(!live||live.banned){localStorage.removeItem('nebula_sess');return;}
    if(!live.approved){currentUser={...live,username:sess.username};showPending();return;}
    currentUser={...live,username:sess.username,isAdmin:false};
    launchApp();
  }catch{localStorage.removeItem('nebula_sess');}
})();

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
  if(currentUser.proxyAccess||currentUser.isAdmin)
    document.getElementById('snav-proxy').classList.remove('hidden');
  updateSidebarProfile();
  loadTooltips();
  startListeners();
  loadZones();
  loadProfileSection();
  document.addEventListener('keydown',globalKeyHandler);
  document.addEventListener('click',closeEmojiOutside);
  document.getElementById('si-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doSignIn();});
  document.getElementById('si-user').addEventListener('keydown',e=>{if(e.key==='Enter')doSignIn();});
  document.getElementById('tpass-inp').addEventListener('keydown',e=>{if(e.key==='Enter')submitTPass();});

  /* ── clear unread when tab is refocused ── */
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      if(activeSection==='chat'&&activeThread){
        unreadThreads[activeThread.id]=0;
        newMsgCount=0;
        updateChatBadge();
        renderThreadList();
        updateScrollBtn();
      }
      if(activeSection==='dms'&&activeDM){
        unreadDMs[activeDM]=0;
        updateDMBadge();
        renderDMList();
      }
    }
  });

  showSection('home');
}

function updateSidebarProfile(){
  if(!currentUser) return;
  const ava=document.getElementById('sp-ava');
  ava.style.background=currentUser.username===ADMIN_USERNAME
    ?'linear-gradient(135deg,#f43f5e,#a855f7)':userColor(currentUser.username);
  ava.textContent=avatarLetter(currentUser.username);
  document.getElementById('sp-name').textContent=currentUser.username;
  const rEl=document.getElementById('sp-rank');
  rEl.style.color=rankColorText(currentUser.rank);
  const rN={planetary:'🌍 Planetary',solar:'☀️ Solar',galactic:'🌌 Galactic',universal:'✦ Universal'};
  rEl.textContent=rN[currentUser.rank]||'';
}

/* ══════════════════════════════════════════
   LISTENERS
══════════════════════════════════════════ */
function startListeners(){
  onSnapshot(REFS.accounts,snap=>{
    if(!snap.exists()) return;
    DB.accounts=snap.data()||{};
    if(currentUser&&currentUser.username!==ADMIN_USERNAME){
      const live=DB.accounts[currentUser.username];
      if(live){
        currentUser.rank=live.rank; currentUser.banned=live.banned;
        currentUser.approved=live.approved; currentUser.proxyAccess=live.proxyAccess;
        if(live.proxyAccess) document.getElementById('snav-proxy').classList.remove('hidden');
        updateSidebarProfile();
      }
    }
    if(isMod(currentUser)) renderAdminPanel();
    renderMembersList(); renderDMList();
  });

  onSnapshot(REFS.threads,snap=>{
    if(!snap.exists()) return;
    DB.threads=snap.data().list||DEFAULT_THREADS;
    renderThreadList(); renderNotifChannels();
    if(isMod(currentUser)) renderAdminPanel();
  });

  onSnapshot(REFS.messages,snap=>{
    if(!snap.exists()) return;
    const old={...DB.messages};
    DB.messages=snap.data()||{};
    const prefs=getNotifPrefs();
    Object.keys(DB.messages).forEach(tid=>{
      const oldLen=(old[tid]||[]).filter(m=>!m.deleted).length;
      const newArr=DB.messages[tid]||[];
      const newLen=newArr.filter(m=>!m.deleted).length;
      if(newLen>oldLen){
        const diff=newLen-oldLen;
        // only mark unread if NOT currently visible in this thread
        const isActiveAndVisible =
          activeThread?.id===tid &&
          activeSection==='chat' &&
          document.visibilityState==='visible';
        if(!isActiveAndVisible){
          unreadThreads[tid]=(unreadThreads[tid]||0)+diff;
          if(!prefs.muteAll&&prefs.channels?.[tid]&&Notification.permission==='granted'){
            const lastMsg=newArr.filter(m=>!m.deleted).slice(-1)[0];
            const t=getThreads().find(x=>x.id===tid);
            if(lastMsg&&lastMsg.user!==currentUser.username)
              pushBrowserNotif(`#${t?.name||tid}`,`${lastMsg.user}: ${lastMsg.text}`,`ch-${tid}`);
          }
        }else if(!atBottom){
          newMsgCount+=diff; updateScrollBtn();
        }
      }
    });
    updateChatBadge(); renderThreadList();
    if(activeThread) renderMessages();
  });

  onSnapshot(REFS.dms,snap=>{
    if(!snap.exists()) return;
    const old={...DB.dms};
    DB.dms=snap.data()||{};
    const prefs=getNotifPrefs(); const myU=currentUser.username;
    Object.keys(DB.dms).forEach(k=>{
      if(!k.includes(myU)) return;
      const oldLen=(old[k]||[]).length;
      const newArr=DB.dms[k]||[];
      const newLen=newArr.length;
      const other=k.split('__').find(p=>p!==myU);
      const isActiveAndVisible =
        other===activeDM &&
        activeSection==='dms' &&
        document.visibilityState==='visible';
      if(other&&newLen>oldLen&&!isActiveAndVisible){
        unreadDMs[other]=(unreadDMs[other]||0)+(newLen-oldLen);
        if(!prefs.muteAll&&prefs.dms&&Notification.permission==='granted'){
          const lastMsg=newArr.slice(-1)[0];
          if(lastMsg&&lastMsg.user!==myU)
            pushBrowserNotif(`DM from ${other}`,lastMsg.text,`dm-${other}`);
        }
      }
    });
    updateDMBadge(); renderDMList();
    if(activeDM) renderDMMessages();
  });

  onSnapshot(REFS.proxies,snap=>{
    if(!snap.exists()) return;
    DB.proxies=snap.data().list||[];
    if(activeSection==='proxy') renderProxies();
  });

  onSnapshot(REFS.config,snap=>{
    if(!snap.exists()) return;
    DB.config=snap.data()||{};
    if(isMod(currentUser)) renderAdminPanel();
  });
}

/* ══════════════════════════════════════════
   SECTIONS
══════════════════════════════════════════ */
window.showSection = s => {
  if(s==='proxy'&&!currentUser?.proxyAccess&&!currentUser?.isAdmin){notify('Access denied','error');return;}
  if(s==='admin'&&!isMod(currentUser)){notify('Access denied','error');return;}
  document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(x=>x.classList.remove('active'));
  const sec=document.getElementById(`section-${s}`);
  if(sec){sec.classList.remove('hidden');sec.classList.add('active');}
  document.getElementById(`snav-${s}`)?.classList.add('active');
  activeSection=s;
  if(s==='chat'){
    if(activeThread){
      unreadThreads[activeThread.id]=0;
      newMsgCount=0;
    }
    updateChatBadge(); renderThreadList();
  }
  if(s==='dms'){
    if(activeDM){
      unreadDMs[activeDM]=0;
    }
    updateDMBadge(); renderDMList();
  }
  if(s==='admin')         renderAdminPanel();
  if(s==='proxy')         renderProxies();
  if(s==='profile')       loadProfileSection();
  if(s==='notifications') renderNotifSection();
};

/* ══════════════════════════════════════════
   BADGES
══════════════════════════════════════════ */
function updateChatBadge(){
  const total=Object.values(unreadThreads).reduce((a,b)=>a+b,0);
  const b=document.getElementById('chat-badge'); if(!b) return;
  b.textContent=total>9?'9+':total; b.classList.toggle('hidden',total===0);
}
function updateDMBadge(){
  const total=Object.values(unreadDMs).reduce((a,b)=>a+b,0);
  const b=document.getElementById('dm-badge'); if(!b) return;
  b.textContent=total>9?'9+':total; b.classList.toggle('hidden',total===0);
}

/* ══════════════════════════════════════════
   THREADS
══════════════════════════════════════════ */
function getThreads(){ return DB.threads?.length?DB.threads:DEFAULT_THREADS; }
function canEnterThread(t){
  if(!t.locked&&!t.password) return true;
  if(isMod(currentUser)) return true;
  return JSON.parse(localStorage.getItem('joined_threads')||'[]').includes(t.id);
}
function renderThreadList(){
  const list=document.getElementById('thread-list'); if(!list) return;
  list.innerHTML='';
  getThreads().forEach(t=>{
    const unrd=unreadThreads[t.id]||0;
    const div=document.createElement('div');
    div.className=`titem${activeThread?.id===t.id&&activeSection==='chat'?' active':''}`;
    div.onclick=()=>handleThreadClick(t);
    div.innerHTML=`<span class="titem-icon">${esc(t.emoji||'💬')}</span>`
      +`<span class="titem-name">${esc(t.name)}</span>`
      +(unrd>0&&activeThread?.id!==t.id?`<span class="titem-badge">${unrd>9?'9+':unrd}</span>`:'');
    list.appendChild(div);
  });
}
function handleThreadClick(t){
  if(t.password&&!canEnterThread(t)){
    pendingThread=t;
    document.getElementById('tpass-inp').value='';
    document.getElementById('tp-err').textContent='';
    openModal('tpass-modal'); return;
  }
  switchThread(t);
}
window.closeTPass=()=>{closeModal('tpass-modal');pendingThread=null;};
window.submitTPass=async()=>{
  const pass=document.getElementById('tpass-inp').value;
  const err=document.getElementById('tp-err');
  if(!pendingThread){closeTPass();return;}
  if(pass===pendingThread.password){
    const j=JSON.parse(localStorage.getItem('joined_threads')||'[]');
    if(!j.includes(pendingThread.id))j.push(pendingThread.id);
    localStorage.setItem('joined_threads',JSON.stringify(j));
    const t=pendingThread; closeTPass(); switchThread(t);
  }else{
    err.textContent='Wrong password.';
    const inp=document.getElementById('tpass-inp');
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
  }
};
async function switchThread(t){
  if(switching) return; switching=true;
  activeThread=t; unreadThreads[t.id]=0; newMsgCount=0;
  updateChatBadge(); renderThreadList(); atBottom=true;
  document.getElementById('chat-no-select').classList.add('hidden');
  const win=document.getElementById('chat-window'); win.classList.remove('hidden');
  document.getElementById('ctb-name').textContent=t.name;
  const ann=document.getElementById('ctb-announce');
  ann.classList.toggle('hidden',!t.announceOnly);
  // rebuild input area
  const ia=document.getElementById('chat-input-area');
  if(t.announceOnly&&!isMod(currentUser)){
    ia.innerHTML=`<div class="announce-notice">📢 Only moderators can post here. You may react to messages.</div>`;
  }else{
    ia.innerHTML=`
      <div class="chat-input-wrap">
        <input type="text" id="chat-input" placeholder="Message #${esc(t.name)}…" maxlength="500" autocomplete="off" spellcheck="false">
        <span class="char-ctr" id="char-ctr"></span>
        <button class="send-btn" id="send-btn" onclick="sendMessage()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="rate-msg hidden" id="rate-msg"></div>`;
    document.getElementById('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}});
    document.getElementById('chat-input').addEventListener('input',updateCharCtr);
  }
  // topbar controls
  const ctbRight=document.getElementById('ctb-right'); ctbRight.innerHTML='';
  if(isMod(currentUser)){
    const wb=document.createElement('button'); wb.className='btn btn-ghost btn-sm'; wb.textContent='🗑 Wipe';
    wb.onclick=()=>wipeThread(t.id); ctbRight.appendChild(wb);
  }
  renderMessages(); switching=false;
  if(activeSection!=='chat') showSection('chat');
  setTimeout(()=>{ const mw=document.getElementById('messages-wrap'); if(mw){mw.scrollTop=mw.scrollHeight;atBottom=true;} },80);
}
async function wipeThread(tid){
  if(!confirm(`Wipe all messages in #${tid}?`)) return;
  try{ await setDoc(REFS.messages,{...DB.messages,[tid]:[]}); notify('Wiped','success'); }
  catch{ notify('Failed','error'); }
}
window.openCreateThread=()=>{
  ['ct-name','ct-emoji'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ct-announce').checked=false;
  document.getElementById('ct-err').textContent='';
  openModal('ct-modal');
};
window.closeCT=()=>closeModal('ct-modal');
window.submitCT=async()=>{
  const name=document.getElementById('ct-name').value.trim().toLowerCase().replace(/[^a-z0-9\-_]/g,'');
  const emoji=document.getElementById('ct-emoji').value.trim()||'💬';
  const announce=document.getElementById('ct-announce').checked;
  const err=document.getElementById('ct-err');
  if(!name){err.textContent='Name required.';return;}
  if(getThreads().find(x=>x.id===name)){err.textContent='Name taken.';return;}
  try{
    await setDoc(REFS.threads,{list:[...getThreads(),{id:name,name,emoji,password:'',locked:false,announceOnly:announce}]});
    closeCT(); notify(`#${name} created`,'success');
  }catch{err.textContent='Failed.';}
};
async function deleteThread(id){
  if(!confirm(`Delete #${id}?`)) return;
  try{
    await setDoc(REFS.threads,{list:getThreads().filter(t=>t.id!==id)});
    if(activeThread?.id===id){
      activeThread=null;
      document.getElementById('chat-window').classList.add('hidden');
      document.getElementById('chat-no-select').classList.remove('hidden');
    }
    notify('Deleted','success');
  }catch{notify('Failed','error');}
}

/* ══════════════════════════════════════════
   RENDER MESSAGES
══════════════════════════════════════════ */
function renderMessages(){
  if(!activeThread) return;
  const msgs=DB.messages[activeThread.id]||[];
  const wrap=document.getElementById('messages-wrap'); if(!wrap) return;
  const wasBottom=wrap.scrollHeight-wrap.scrollTop<=wrap.clientHeight+140;
  const container=document.getElementById('messages'); container.innerHTML='';
  let lastUser=null, lastDate=null;
  msgs.forEach((m,idx)=>{
    if(m.deleted&&!isMod(currentUser)){lastUser=null;return;}
    const ts=m.time||'', ds=ts.split(' at ')[0];
    if(ds&&ds!==lastDate&&(ds==='Today'||ds==='Yesterday'||/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(ds))){
      const dd=document.createElement('div'); dd.className='date-divider';
      dd.innerHTML=`<span>${ds}</span>`; container.appendChild(dd); lastDate=ds;
    }
    container.appendChild(buildMessage(m,idx,m.user!==lastUser,activeThread.id,false));
    lastUser=m.user;
  });
  if(wasBottom){wrap.scrollTop=wrap.scrollHeight;atBottom=true;newMsgCount=0;}
  updateScrollBtn(); ensureScrollListener(wrap);
}
function ensureScrollListener(wrap){
  if(wrap._scrollBound) return; wrap._scrollBound=true;
  wrap.addEventListener('scroll',deb(()=>{
    atBottom=wrap.scrollHeight-wrap.scrollTop<=wrap.clientHeight+140;
    if(atBottom) newMsgCount=0; updateScrollBtn();
  },40));
  if(!document.getElementById('scroll-to-bottom')){
    const btn=document.createElement('button');
    btn.className='scroll-to-bottom'; btn.id='scroll-to-bottom';
    btn.innerHTML='↓<span class="stb-unread hidden" id="stb-unread">0</span>';
    btn.onclick=()=>{ wrap.scrollTop=wrap.scrollHeight; newMsgCount=0; updateScrollBtn(); };
    wrap.parentElement.style.position='relative';
    wrap.parentElement.appendChild(btn);
  }
}
function updateScrollBtn(){
  const btn=document.getElementById('scroll-to-bottom'); if(!btn) return;
  btn.classList.toggle('show',!atBottom&&newMsgCount>0);
  const u=document.getElementById('stb-unread');
  if(u){u.textContent=newMsgCount>9?'9+':newMsgCount; u.classList.toggle('hidden',newMsgCount===0);}
}

/* ══════════════════════════════════════════
   BUILD MESSAGE
══════════════════════════════════════════ */
function buildMessage(m, idx, isFirst, ctxId, isDM){
  const div=document.createElement('div');
  div.className=`msg${isFirst?' first-in-group':''}${m.deleted?' deleted':''}`;
  div.dataset.idx=idx; div.dataset.ctx=ctxId; div.dataset.dm=isDM?'1':'0';
  const canAct=currentUser&&(currentUser.username===m.user||isMod(currentUser));
  const isOwn=currentUser&&currentUser.username===m.user;
  const bg=m.user===ADMIN_USERNAME?'linear-gradient(135deg,#f43f5e,#a855f7)':userColor(m.user);
  const rank=(DB.accounts[m.user]?.rank)||'planetary';
  const avaWrap=document.createElement('div'); avaWrap.className='msg-ava-wrap';
  if(isFirst){
    avaWrap.innerHTML=`<div class="msg-ava" style="background:${bg}">${avatarLetter(m.user)}</div>`;
  }else{
    avaWrap.innerHTML=`<div class="msg-ava-spacer"></div><div class="msg-ts-inline">${(m.time||'').split(' ').slice(0,2).join(' ')}</div>`;
  }
  div.appendChild(avaWrap);
  const content=document.createElement('div'); content.className='msg-content';
  if(isFirst){
    content.innerHTML=`<div class="msg-header">
      <span class="msg-name" style="color:${rankColorText(rank)}">${esc(m.user)}</span>
      ${rankBadge(rank)}
      <span class="msg-ts">${relTime(m.time)}</span>
    </div>`;
  }
  const textDiv=document.createElement('div'); textDiv.className='msg-text';
  if(m.deleted){
    textDiv.style.cssText='color:var(--text-faint);font-style:italic;';
    textDiv.textContent='[message deleted]';
  }else{
    textDiv.textContent=m.text;
    if(m.edited){const ed=document.createElement('span');ed.className='msg-edited';ed.textContent=' (edited)';textDiv.appendChild(ed);}
  }
  content.appendChild(textDiv);
  if(!m.deleted){
    const rct=m.reactions||{};
    const rkeys=Object.keys(rct).filter(e=>rct[e]&&rct[e].length>0);
    if(rkeys.length){
      const rDiv=document.createElement('div'); rDiv.className='msg-reactions';
      rkeys.forEach(e=>{
        const users=rct[e]||[], mine=currentUser&&users.includes(currentUser.username);
        const chip=document.createElement('span'); chip.className=`rchip${mine?' mine':''}`;
        chip.innerHTML=`${e}<span class="rcnt">${users.length}</span>`;
        chip.onclick=()=>toggleReact(ctxId,idx,e,isDM);
        rDiv.appendChild(chip);
      });
      content.appendChild(rDiv);
    }
  }
  div.appendChild(content);
  if(!m.deleted&&(canAct||currentUser)){
    const acts=document.createElement('div'); acts.className='msg-actions';
    if(currentUser){
      const rb=document.createElement('button'); rb.className='mab'; rb.textContent='😊';
      rb.onclick=e=>{e.stopPropagation();openEmoji(e,ctxId,idx,isDM);}; acts.appendChild(rb);
    }
    if(isOwn&&!isDM){
      const eb=document.createElement('button'); eb.className='mab'; eb.textContent='✎';
      eb.onclick=()=>startEdit(ctxId,idx); acts.appendChild(eb);
    }
    if(canAct){
      const db=document.createElement('button'); db.className='mab d'; db.textContent='✕';
      db.onclick=()=>promptDel(ctxId,idx,isDM); acts.appendChild(db);
    }
    div.appendChild(acts);
  }
  return div;
}

/* ══════════════════════════════════════════
   SEND / EDIT / DELETE
══════════════════════════════════════════ */
window.sendMessage=async()=>{
  const input=document.getElementById('chat-input'); if(!input) return;
  const text=input.value.trim();
  if(!text||!currentUser||!activeThread) return;
  if(text.length>MAX_MSG_LEN){notify('Too long','warning');return;}
  if(activeThread.announceOnly&&!isMod(currentUser)){notify('Only mods can post here','warning');return;}
  const rl=checkRate(rateLogs,currentUser);
  if(!rl.ok){
    const rm=document.getElementById('rate-msg');
    if(rm){rm.textContent=`Rate limited — wait ${rl.wait}s.`;rm.classList.remove('hidden');
      setTimeout(()=>rm.classList.add('hidden'),rl.wait*1000);}
    return;
  }
  const sb=document.getElementById('send-btn'); if(sb)sb.disabled=true;
  try{
    const existing=DB.messages[activeThread.id]||[];
    const updated=[...existing,{user:currentUser.username,text:filt(text),time:tsNow(),reactions:{}}]
      .slice(-MAX_CHANNEL_MSGS);
    await setDoc(REFS.messages,{...DB.messages,[activeThread.id]:updated});
    input.value=''; updateCharCtr();
  }catch{notify('Failed to send','error');}
  finally{if(sb)sb.disabled=false;input.focus();}
};
function updateCharCtr(){
  const input=document.getElementById('chat-input');
  const ctr=document.getElementById('char-ctr');
  if(!input||!ctr) return;
  const len=input.value.length;
  if(len>=WARN_MSG_LEN){ctr.textContent=MAX_MSG_LEN-len;ctr.className=`char-ctr${len>=MAX_MSG_LEN?' danger':' warn'}`;}
  else{ctr.textContent='';ctr.className='char-ctr';}
}
window.promptDel=(ctx,idx,isDM=false)=>{pdel={ctx,idx:+idx,isDM};openModal('del-modal');};
window.cancelDel=()=>{pdel={ctx:null,idx:null,isDM:false};closeModal('del-modal');};
window.confirmDel=async()=>{
  const{ctx,idx,isDM}=pdel; if(ctx===null) return;
  try{
    if(isDM){
      const k=dmKey(currentUser.username,ctx);
      let ms=[...(DB.dms[k]||[])]; ms[idx]={...ms[idx],deleted:true};
      await setDoc(REFS.dms,{...DB.dms,[k]:ms});
    }else{
      let ms=[...(DB.messages[ctx]||[])]; ms[idx]={...ms[idx],deleted:true};
      await setDoc(REFS.messages,{...DB.messages,[ctx]:ms});
    }
    notify('Deleted','success');
  }catch{notify('Failed','error');}
  cancelDel();
};
window.startEdit=(tid,idx)=>{
  const msgs=DB.messages[tid]||[]; const m=msgs[idx];
  if(!m||m.deleted) return;
  const els=document.querySelectorAll(`#messages .msg[data-idx="${idx}"][data-ctx="${tid}"]`);
  if(!els.length) return;
  const el=els[0];
  document.querySelectorAll('.edit-wrap').forEach(e=>e.remove());
  document.querySelectorAll('.msg.editing').forEach(e=>e.classList.remove('editing'));
  el.classList.add('editing');
  const textDiv=el.querySelector('.msg-text'); textDiv.style.display='none';
  const wrap=document.createElement('div'); wrap.className='edit-wrap';
  const inp=document.createElement('input'); inp.type='text'; inp.className='edit-inp';
  inp.value=m.text; inp.maxLength=MAX_MSG_LEN;
  const save=document.createElement('button'); save.className='esave'; save.textContent='Save';
  const can=document.createElement('button'); can.className='ecancel'; can.textContent='Cancel';
  const doSave=async()=>{
    const nv=inp.value.trim();
    if(!nv){notify('Empty','warning');return;} if(nv===m.text){doCancel();return;}
    save.disabled=true;
    try{
      let ms=[...(DB.messages[tid]||[])]; ms[idx]={...ms[idx],text:filt(nv),edited:true};
      await setDoc(REFS.messages,{...DB.messages,[tid]:ms}); notify('Edited','success');
    }catch{notify('Failed','error');save.disabled=false;}
  };
  const doCancel=()=>{wrap.remove();textDiv.style.display='';el.classList.remove('editing');};
  save.onclick=doSave; can.onclick=doCancel;
  inp.onkeydown=e=>{if(e.key==='Enter')doSave();if(e.key==='Escape')doCancel();};
  wrap.append(inp,save,can); el.querySelector('.msg-content').appendChild(wrap);
  setTimeout(()=>{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);},40);
};

/* ══════════════════════════════════════════
   REACTIONS
══════════════════════════════════════════ */
window.openEmoji=(e,ctx,idx,isDM=false)=>{
  e.stopPropagation();
  const picker=document.getElementById('epicker'); picker.innerHTML='';
  EMOJIS.forEach(em=>{
    const btn=document.createElement('span'); btn.className='eopt'; btn.textContent=em;
    btn.onclick=ev=>{ev.stopPropagation();toggleReact(ctx,idx,em,isDM);picker.classList.add('hidden');};
    picker.appendChild(btn);
  });
  const rect=e.target.getBoundingClientRect();
  picker.style.bottom=(window.innerHeight-rect.top+6)+'px';
  picker.style.left=Math.min(rect.left,window.innerWidth-224)+'px';
  picker.classList.remove('hidden');
};
window.toggleReact=async(ctx,idx,emoji,isDM=false)=>{
  if(!currentUser){notify('Sign in to react','warning');return;}
  const toggle=(arr,u)=>{ const i=arr.indexOf(u); if(i>=0)arr.splice(i,1); else arr.push(u); return arr; };
  try{
    if(isDM){
      const k=dmKey(currentUser.username,ctx);
      let ms=[...(DB.dms[k]||[])]; const m={...ms[idx]};
      const rct={...m.reactions||{}}; rct[emoji]=toggle([...(rct[emoji]||[])],currentUser.username);
      ms[idx]={...m,reactions:rct}; await setDoc(REFS.dms,{...DB.dms,[k]:ms});
    }else{
      let ms=[...(DB.messages[ctx]||[])]; const m={...ms[idx]};
      const rct={...m.reactions||{}}; rct[emoji]=toggle([...(rct[emoji]||[])],currentUser.username);
      ms[idx]={...m,reactions:rct}; await setDoc(REFS.messages,{...DB.messages,[ctx]:ms});
    }
  }catch{notify('Failed','error');}
};
function closeEmojiOutside(e){
  if(!e.target.closest('.epicker')&&!e.target.closest('.mab'))
    document.getElementById('epicker')?.classList.add('hidden');
}

/* ══════════════════════════════════════════
   MEMBERS LIST
══════════════════════════════════════════ */
function renderMembersList(){
  const list=document.getElementById('members-list'); if(!list) return;
  list.innerHTML='';
  const mods=[], regular=[];
  Object.entries(DB.accounts).forEach(([u,a])=>{
    if(!a.approved||a.banned) return;
    if(u===ADMIN_USERNAME||a.rank==='universal') mods.push([u,a]);
    else regular.push([u,a]);
  });
  const adminIdx=mods.findIndex(([u])=>u===ADMIN_USERNAME);
  if(adminIdx>0){const [ad]=mods.splice(adminIdx,1);mods.unshift(ad);}
  const addSec=(label,arr)=>{
    if(!arr.length) return;
    const lbl=document.createElement('div'); lbl.className='ms-section-label'; lbl.textContent=label;
    list.appendChild(lbl);
    arr.forEach(([u,a])=>{
      const div=document.createElement('div'); div.className='ms-item';
      div.onclick=()=>openDMWith(u);
      div.innerHTML=`<div class="ms-ava" style="background:${u===ADMIN_USERNAME?'linear-gradient(135deg,#f43f5e,#a855f7)':userColor(u)}">${avatarLetter(u)}</div>`
        +`<span class="ms-name">${esc(u)}</span>${rankBadge(a.rank)}`;
      list.appendChild(div);
    });
  };
  addSec('MODERATORS',mods);
  addSec('MEMBERS',regular);
}

/* ══════════════════════════════════════════
   DIRECT MESSAGES
══════════════════════════════════════════ */
function renderDMList(){
  const list=document.getElementById('dm-list'); if(!list) return;
  list.innerHTML='';
  const myU=currentUser.username; const seen=new Set();
  Object.keys(DB.dms).filter(k=>k.includes(myU)).forEach(k=>{
    const other=k.split('__').find(p=>p!==myU);
    if(!other||seen.has(other)) return; seen.add(other);
    const acct=DB.accounts[other]; if(!acct) return;
    const unrd=unreadDMs[other]||0;
    const div=document.createElement('div');
    div.className=`titem${activeDM===other&&activeSection==='dms'?' active':''}`;
    div.onclick=()=>openDMWith(other);
    div.innerHTML=
      `<div style="width:22px;height:22px;border-radius:50%;background:${userColor(other)};display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.6rem;flex-shrink:0;">${avatarLetter(other)}</div>`
      +`<span class="titem-name" style="margin-left:.4rem">${esc(other)}</span>`
      +(unrd>0?`<span class="titem-badge">${unrd>9?'9+':unrd}</span>`:'');
    list.appendChild(div);
  });
}
window.openNewDM=()=>{
  document.getElementById('dm-search-inp').value='';
  document.getElementById('dm-search-results').innerHTML='';
  openModal('newdm-modal');
};
window.closeNewDM=()=>closeModal('newdm-modal');
window.filterDMSearch=()=>{
  const q=document.getElementById('dm-search-inp').value.toLowerCase();
  const res=document.getElementById('dm-search-results'); res.innerHTML='';
  Object.entries(DB.accounts)
    .filter(([u,a])=>u!==currentUser.username&&a.approved&&!a.banned
      &&(u.toLowerCase().includes(q)||(a.name||'').toLowerCase().includes(q)))
    .slice(0,10)
    .forEach(([u,a])=>{
      const div=document.createElement('div');
      div.style.cssText='display:flex;align-items:center;gap:.5rem;padding:.42rem .52rem;border-radius:7px;cursor:pointer;transition:background .14s;';
      div.onmouseenter=()=>div.style.background='rgba(255,255,255,.06)';
      div.onmouseleave=()=>div.style.background='';
      div.innerHTML=`<div style="width:28px;height:28px;border-radius:50%;background:${userColor(u)};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.7rem;flex-shrink:0;">${avatarLetter(u)}</div>`
        +`<div><div style="font-size:.8rem;font-weight:700;">${esc(u)}</div><div style="font-size:.66rem;color:var(--text-muted);">${esc(a.name||'')}</div></div>`;
      div.onclick=()=>{closeNewDM();openDMWith(u);};
      res.appendChild(div);
    });
};
function openDMWith(other){
  if(!DB.accounts[other]){notify('User not found','error');return;}
  activeDM=other; unreadDMs[other]=0;
  updateDMBadge(); renderDMList();
  document.getElementById('dm-no-select').classList.add('hidden');
  const win=document.getElementById('dm-window'); win.classList.remove('hidden');
  document.getElementById('dm-ctb-name').textContent=other;
  const inp=document.getElementById('dm-input');
  inp.placeholder=`Message ${other}…`;
  inp.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendDM();}};
  inp.oninput=updateDMCharCtr;
  renderDMMessages();
  if(activeSection!=='dms') showSection('dms');
  setTimeout(()=>{ const mw=document.getElementById('dm-messages-wrap'); if(mw)mw.scrollTop=mw.scrollHeight; },80);
}
function renderDMMessages(){
  if(!activeDM) return;
  const k=dmKey(currentUser.username,activeDM);
  const msgs=DB.dms[k]||[];
  const wrap=document.getElementById('dm-messages-wrap'); if(!wrap) return;
  const wasBottom=wrap.scrollHeight-wrap.scrollTop<=wrap.clientHeight+140;
  const container=document.getElementById('dm-messages'); container.innerHTML='';
  let lastUser=null, lastDate=null;
  msgs.forEach((m,idx)=>{
    if(m.deleted&&m.user!==currentUser.username&&!isMod(currentUser)){lastUser=null;return;}
    const ts=m.time||'', ds=ts.split(' at ')[0];
    if(ds&&ds!==lastDate&&(ds==='Today'||ds==='Yesterday'||/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(ds))){
      const dd=document.createElement('div'); dd.className='date-divider';
      dd.innerHTML=`<span>${ds}</span>`; container.appendChild(dd); lastDate=ds;
    }
    container.appendChild(buildMessage(m,idx,m.user!==lastUser,activeDM,true));
    lastUser=m.user;
  });
  if(wasBottom) wrap.scrollTop=wrap.scrollHeight;
}
window.sendDM=async()=>{
  const inp=document.getElementById('dm-input'); if(!inp) return;
  const text=inp.value.trim();
  if(!text||!currentUser||!activeDM) return;
  if(text.length>MAX_MSG_LEN){notify('Too long','warning');return;}
  const rl=checkRate(dmRateLogs,currentUser);
  if(!rl.ok){
    const rm=document.getElementById('dm-rate-msg');
    if(rm){rm.textContent=`Wait ${rl.wait}s.`;rm.classList.remove('hidden');setTimeout(()=>rm.classList.add('hidden'),rl.wait*1000);}
    return;
  }
  try{
    const k=dmKey(currentUser.username,activeDM);
    const existing=DB.dms[k]||[];
    const updated=[...existing,{user:currentUser.username,text:filt(text),time:tsNow(),reactions:{}}]
      .slice(-MAX_DM_MSGS);
    await setDoc(REFS.dms,{...DB.dms,[k]:updated});
    inp.value=''; updateDMCharCtr();
    const mw=document.getElementById('dm-messages-wrap'); if(mw)mw.scrollTop=mw.scrollHeight;
  }catch{notify('Failed to send','error');}
};
function updateDMCharCtr(){
  const inp=document.getElementById('dm-input');
  const ctr=document.getElementById('dm-char-ctr');
  if(!inp||!ctr) return;
  const len=inp.value.length;
  if(len>=WARN_MSG_LEN){ctr.textContent=MAX_MSG_LEN-len;ctr.className=`char-ctr${len>=MAX_MSG_LEN?' danger':' warn'}`;}
  else{ctr.textContent='';ctr.className='char-ctr';}
}

/* ══════════════════════════════════════════
   PROFILE
══════════════════════════════════════════ */
function loadProfileSection(){
  const card=document.getElementById('profile-card'); if(!card||!currentUser) return;
  const bg=currentUser.username===ADMIN_USERNAME?'linear-gradient(135deg,#f43f5e,#a855f7)':userColor(currentUser.username);
  card.innerHTML=`
    <div class="prof-ava" style="background:${bg}">${avatarLetter(currentUser.username)}</div>
    <div class="prof-name">${esc(currentUser.name||currentUser.username)}</div>
    <div class="prof-username">@${esc(currentUser.username)}</div>
    <div style="margin:.38rem 0 .75rem">${rankBadge(currentUser.rank)}</div>
    <div class="prof-meta">
      ${currentUser.isAdmin?'<div>👑 Site Administrator</div>':''}
      ${isMod(currentUser)&&!currentUser.isAdmin?'<div>🛡 Moderator</div>':''}
      ${currentUser.proxyAccess?'<div>🔗 Proxy Access</div>':''}
      <div style="margin-top:.45rem;color:var(--text-faint);font-size:.68rem;">Joined ${currentUser.joinedAt||'—'}</div>
    </div>`;
}

/* ══════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════ */
window.admTab = tab => {
  document.querySelectorAll('.adm-tab').forEach((b,i)=>{
    b.classList.toggle('active',['users','pending','channels','proxy-access'][i]===tab);
  });
  document.querySelectorAll('.adm-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(`adm-${tab}`)?.classList.add('active');
};
function renderAdminPanel(){
  if(!isMod(currentUser)) return;
  renderAdmUsers(); renderAdmPending(); renderAdmChannels(); renderAdmProxyAccess();
}
function renderAdmUsers(){
  const el=document.getElementById('adm-users'); if(!el) return;
  const users=Object.entries(DB.accounts).filter(([,a])=>a.approved&&!a.banned);
  el.innerHTML=`<div style="font-size:.63rem;color:var(--text-muted);margin-bottom:.75rem;">${users.length} approved user(s)</div>`;
  users.forEach(([u,a])=>{
    const isAdminUser=u===ADMIN_USERNAME;
    const row=document.createElement('div'); row.className='adm-row';
    row.innerHTML=`<div class="adm-ava" style="background:${isAdminUser?'linear-gradient(135deg,#f43f5e,#a855f7)':userColor(u)}">${avatarLetter(u)}</div>`
      +`<div class="adm-name">${esc(u)}</div>${rankBadge(a.rank)}`;
    if(!isAdminUser){
      if(currentUser.username===ADMIN_USERNAME){
        const rb=document.createElement('button'); rb.className='ta-btn ta-blue'; rb.textContent='✎ Rank';
        rb.onclick=()=>openRankModal(u); row.appendChild(rb);
      }
      const bb=document.createElement('button'); bb.className='ta-btn ta-red'; bb.textContent='Ban';
      bb.onclick=()=>banUser(u); row.appendChild(bb);
    }else{
      const lbl=document.createElement('span'); lbl.style.cssText='font-size:.58rem;color:var(--text-faint);';
      lbl.textContent='protected'; row.appendChild(lbl);
    }
    el.appendChild(row);
  });
  const banned=Object.entries(DB.accounts).filter(([,a])=>a.banned);
  if(banned.length){
    const lbl=document.createElement('div'); lbl.style.cssText='font-size:.63rem;color:var(--danger);margin:.85rem 0 .48rem;';
    lbl.textContent='Banned accounts'; el.appendChild(lbl);
    banned.forEach(([u])=>{
      const a=DB.accounts[u];
      const row=document.createElement('div'); row.className='adm-row';
      row.innerHTML=`<div class="adm-ava" style="background:${userColor(u)}">${avatarLetter(u)}</div>`
        +`<div class="adm-name" style="opacity:.5">${esc(u)}</div><span style="font-size:.63rem;color:var(--danger);">Banned</span>`;
      const ub=document.createElement('button'); ub.className='ta-btn ta-green'; ub.textContent='Unban';
      ub.onclick=()=>unbanUser(u); row.appendChild(ub); el.appendChild(row);
    });
  }
}
function renderAdmPending(){
  const el=document.getElementById('adm-pending'); if(!el) return;
  const pending=Object.entries(DB.accounts).filter(([,a])=>!a.approved&&!a.banned);
  const ct=document.getElementById('pending-ct');
  if(ct) ct.textContent=pending.length?`(${pending.length})`:'';
  el.innerHTML='';
  if(!pending.length){el.innerHTML='<div style="color:var(--text-muted);font-size:.78rem;">No pending accounts.</div>';return;}
  pending.forEach(([u,a])=>{
    const row=document.createElement('div'); row.className='adm-row';
    row.innerHTML=`<div class="adm-ava" style="background:${userColor(u)}">${avatarLetter(u)}</div>`
      +`<div class="adm-name">${esc(u)}</div>`
      +`<div style="font-size:.7rem;color:var(--text-muted);">${esc(a.name||'')}</div>`;
    const ap=document.createElement('button'); ap.className='ta-btn ta-green'; ap.textContent='✓ Approve';
    ap.onclick=()=>approveUser(u);
    const dn=document.createElement('button'); dn.className='ta-btn ta-red'; dn.textContent='✕ Deny';
    dn.onclick=()=>denyUser(u);
    row.append(ap,dn); el.appendChild(row);
  });
}
function renderAdmChannels(){
  const el=document.getElementById('adm-channels'); if(!el) return;
  el.innerHTML='';
  getThreads().forEach(t=>{
    const isDefault=DEFAULT_THREADS.find(d=>d.id===t.id);
    const row=document.createElement('div'); row.className='adm-row';
    row.innerHTML=`<span style="font-size:.88rem;">${esc(t.emoji||'💬')}</span>`
      +`<span class="adm-name">#${esc(t.name)}</span>`
      +`<span style="font-size:.63rem;color:var(--text-faint);">${t.announceOnly?'announce-only':'public'}</span>`;
    if(!isDefault){
      const del=document.createElement('button'); del.className='ta-btn ta-red'; del.textContent='✕ Delete';
      del.onclick=()=>deleteThread(t.id); row.appendChild(del);
    }else{
      const lbl=document.createElement('span'); lbl.style.cssText='font-size:.58rem;color:var(--text-faint);';
      lbl.textContent='protected'; row.appendChild(lbl);
    }
    el.appendChild(row);
  });
  const addBtn=document.createElement('button'); addBtn.className='btn btn-sm'; addBtn.style.marginTop='.65rem';
  addBtn.textContent='+ New Channel'; addBtn.onclick=openCreateThread; el.appendChild(addBtn);
}
function renderAdmProxyAccess(){
  if(currentUser.username!==ADMIN_USERNAME) return;
  const el=document.getElementById('adm-proxy-access'); if(!el) return;
  el.innerHTML='<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.75rem;">Toggle proxy page access per user.</div>';
  Object.entries(DB.accounts)
    .filter(([u,a])=>a.approved&&!a.banned&&u!==ADMIN_USERNAME)
    .forEach(([u,a])=>{
      const hasAccess=a.proxyAccess||false;
      const row=document.createElement('div'); row.className='adm-row';
      row.innerHTML=`<div class="adm-ava" style="background:${userColor(u)}">${avatarLetter(u)}</div>`
        +`<div class="adm-name">${esc(u)}</div>`;
      const toggle=document.createElement('button');
      toggle.className=`ta-btn ${hasAccess?'ta-red':'ta-green'}`;
      toggle.textContent=hasAccess?'Revoke':'Grant Access';
      toggle.onclick=()=>toggleProxyAccess(u,!hasAccess);
      row.appendChild(toggle); el.appendChild(row);
    });
}
async function approveUser(u){
  try{await setDoc(REFS.accounts,{...DB.accounts,[u]:{...DB.accounts[u],approved:true}});notify(`${u} approved`,'success');}
  catch{notify('Failed','error');}
}
async function denyUser(u){
  if(!confirm(`Deny and delete "${u}"?`)) return;
  try{const up={...DB.accounts};delete up[u];await setDoc(REFS.accounts,up);notify(`${u} denied`,'success');}
  catch{notify('Failed','error');}
}
async function banUser(u){
  if(!confirm(`Ban "${u}"?`)) return;
  try{await setDoc(REFS.accounts,{...DB.accounts,[u]:{...DB.accounts[u],banned:true}});notify(`${u} banned`,'success');}
  catch{notify('Failed','error');}
}
async function unbanUser(u){
  try{await setDoc(REFS.accounts,{...DB.accounts,[u]:{...DB.accounts[u],banned:false}});notify(`${u} unbanned`,'success');}
  catch{notify('Failed','error');}
}
async function toggleProxyAccess(u,grant){
  try{await setDoc(REFS.accounts,{...DB.accounts,[u]:{...DB.accounts[u],proxyAccess:grant}});
    notify(`${u} proxy access ${grant?'granted':'revoked'}`,'success');}
  catch{notify('Failed','error');}
}
window.openRankModal=u=>{rankTarget=u;document.getElementById('rank-mdesc').textContent=`Assign rank to ${u}`;openModal('rank-modal');};
window.closeRankModal=()=>{closeModal('rank-modal');rankTarget=null;};
window.grantRank=async rank=>{
  if(!rankTarget) return;
  if(rankTarget===ADMIN_USERNAME){notify('Cannot change admin rank','error');closeRankModal();return;}
  try{
    await setDoc(REFS.accounts,{...DB.accounts,[rankTarget]:{...DB.accounts[rankTarget],rank}});
    notify(`${rankTarget} → ${rank}`,'success'); closeRankModal();
  }catch{notify('Failed','error');}
};

/* ══════════════════════════════════════════
   PROXIES
══════════════════════════════════════════ */
function renderProxies(){
  const pl=document.getElementById('proxy-list'); if(!pl) return;
  const isAdmin=currentUser?.isAdmin;
  const ed=document.getElementById('proxy-editor'); if(ed) ed.classList.toggle('hidden',!isAdmin);
  pl.innerHTML=(DB.proxies||[]).map((p,i)=>`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.7rem;">
        <div class="card-title">${esc(p.name)}</div>
        ${isAdmin?`<button onclick="delCat(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.68rem;font-weight:800;font-family:'Inter',sans-serif;">REMOVE</button>`:''}
      </div>
      ${p.links.map((l,li)=>`
        <div style="display:flex;gap:5px;align-items:center;">
          <a href="${esc(l)}" target="_blank" rel="noopener noreferrer" class="blurred-link">${esc(l)}</a>
          ${isAdmin?`<button onclick="delLink(${i},${li})" style="color:var(--danger);background:none;border:none;cursor:pointer;font-size:1rem;flex-shrink:0;">×</button>`:''}
        </div>`).join('')}
      ${isAdmin?`<div style="margin-top:.85rem;padding-top:.7rem;border-top:1px solid var(--border2);">
        <input type="text" id="link-in-${i}" class="sinput" placeholder="Add URL…" autocomplete="off">
        <button class="btn btn-sm" onclick="addLink(${i})" style="width:100%;margin-top:.28rem">Save Link</button>
      </div>`:''}
    </div>`).join('');
}
window.addCat=async()=>{
  const n=document.getElementById('new-cat-name').value.trim();
  if(!n){notify('Name required','warning');return;}
  try{await setDoc(REFS.proxies,{list:[...DB.proxies,{name:n,links:[]}]});
    document.getElementById('new-cat-name').value='';notify('Created','success');}
  catch{notify('Failed','error');}
};
window.addLink=async i=>{
  const inp=document.getElementById(`link-in-${i}`); const url=inp.value.trim();
  if(!url){notify('URL required','warning');return;}
  try{new URL(url);}catch{notify('Invalid URL','error');return;}
  try{
    const p=[...DB.proxies]; p[i]={...p[i],links:[...p[i].links,url]};
    await setDoc(REFS.proxies,{list:p}); inp.value=''; notify('Added','success');
  }catch{notify('Failed','error');}
};
window.delLink=async(ci,li)=>{
  try{
    const p=[...DB.proxies]; p[ci]={...p[ci],links:p[ci].links.filter((_,i)=>i!==li)};
    await setDoc(REFS.proxies,{list:p}); notify('Removed','success');
  }catch{notify('Failed','error');}
};
window.delCat=async i=>{
  if(!confirm(`Delete "${DB.proxies[i].name}"?`)) return;
  try{const p=[...DB.proxies];p.splice(i,1);await setDoc(REFS.proxies,{list:p});notify('Deleted','success');}
  catch{notify('Failed','error');}
};

/* ══════════════════════════════════════════
   GAME VAULT
══════════════════════════════════════════ */
async function loadZones(){
  try{
    let zonesURL=ZONE_URLS[Math.floor(Math.random()*ZONE_URLS.length)];
    try{
      const shaRes=await fetch("https://api.github.com/repos/gn-math/assets/commits?t="+Date.now());
      if(shaRes.status===200){const j=await shaRes.json();const sha=j[0]?.sha;if(sha)zonesURL=`https://cdn.jsdelivr.net/gh/gn-math/assets@${sha}/zones.json`;}
    }catch{}
    const res=await fetch(zonesURL+"?t="+Date.now());
    zones=await res.json();
    zones=zones.filter(z=>!z.name.includes("SUGGEST"));
    document.getElementById('vault-loading')?.remove();
    setupFeatured(); renderVaultGrid(getFilteredZones());
  }catch{
    const loading=document.getElementById('vault-loading');
    if(loading) loading.innerHTML='<span>⚠️ Failed to load games</span>';
  }
}
function setupFeatured(){
  if(zones.length<5) return;
  const now=new Date();
  const seed=now.getFullYear()+'-'+now.getMonth()+'-'+now.getDate()+(now.getHours()<12?'AM':'PM');
  let h=0; for(let i=0;i<seed.length;i++) h=seed.charCodeAt(i)+((h<<5)-h);
  const rand=()=>{h=Math.sin(h)*10000;return h-Math.floor(h);};
  let pool=[...zones]; featuredGames=[];
  for(let i=0;i<Math.min(10,pool.length);i++){
    const idx=Math.floor(rand()*pool.length);
    featuredGames.push(pool.splice(idx,1)[0]);
  }
  renderFeatured();
}
function renderFeatured(){
  document.getElementById('vault-featured-block')?.remove();
  const wrap=document.createElement('div'); wrap.id='vault-featured-block'; wrap.className='vault-featured';
  wrap.innerHTML=`
    <div class="vault-featured-hdr">⭐ Featured Today</div>
    <button class="carousel-btn" id="carousel-prev" onclick="carouselNav(-1)">❮</button>
    <div class="carousel-viewport"><div id="feat-track"></div></div>
    <button class="carousel-btn" id="carousel-next" onclick="carouselNav(1)">❯</button>`;
  const scroll=document.getElementById('vault-scroll');
  scroll.insertBefore(wrap,document.getElementById('game-grid'));
  const vis=window.innerWidth>500?5:2;
  const track=document.getElementById('feat-track');
  const clonesBefore=featuredGames.slice(-vis);
  const clonesAfter=featuredGames.slice(0,vis);
  [...clonesBefore,...featuredGames,...clonesAfter].forEach(z=>{
    const d=document.createElement('div'); d.className='feat-item'; d.onclick=()=>openZone(z);
    const img=document.createElement('img');
    img.src=z.cover.replace('{COVER_URL}',COVER_URL).replace('{HTML_URL}',HTML_URL);
    img.loading='lazy'; img.alt=z.name;
    const p=document.createElement('div'); p.className='feat-item-name'; p.textContent=z.name;
    d.append(img,p); track.appendChild(d);
  });
  carouselIdx=vis; updateCarouselPos(false); startCarousel();
}
function updateCarouselPos(anim=true){
  const track=document.getElementById('feat-track'); if(!track) return;
  const vis=window.innerWidth>500?5:2;
  track.style.transition=anim?'transform .6s cubic-bezier(.23,1,.32,1)':'none';
  track.style.transform=`translateX(-${carouselIdx*(100/vis)}%)`;
}
function startCarousel(){ clearInterval(carouselTimer); carouselTimer=setInterval(()=>moveCarousel(1),3200); }
function moveCarousel(dir){
  if(carouselBusy) return;
  const vis=window.innerWidth>500?5:2, total=featuredGames.length;
  carouselBusy=true; carouselIdx+=dir; updateCarouselPos(true);
  setTimeout(()=>{
    if(carouselIdx>=total+vis){carouselIdx=vis;updateCarouselPos(false);}
    else if(carouselIdx<=0){carouselIdx=total;updateCarouselPos(false);}
    carouselBusy=false;
  },620);
}
window.carouselNav=dir=>{
  moveCarousel(dir); clearInterval(carouselTimer); clearTimeout(carouselPause);
  carouselPause=setTimeout(startCarousel,3000);
};
window.addEventListener('resize',()=>{ if(featuredGames.length) renderFeatured(); });
function getFilteredZones(){
  return zones.filter(z=>{
    const ms=z.name.toLowerCase().includes(vaultQuery.toLowerCase());
    const mf=showFavsOnly?gameFavs.includes(z.id):true;
    return ms&&mf;
  });
}
window.handleVaultSearch=()=>{ vaultQuery=document.getElementById('vault-search').value; renderVaultGrid(getFilteredZones()); };
window.toggleFavFilter=()=>{
  showFavsOnly=!showFavsOnly;
  document.getElementById('fav-filter-btn').classList.toggle('active',showFavsOnly);
  renderVaultGrid(getFilteredZones());
};
function renderVaultGrid(data){
  const grid=document.getElementById('game-grid'); if(!grid) return;
  grid.innerHTML='';
  if(!data.length){grid.innerHTML='<div class="vault-empty"><div class="vault-empty-ico">🎮</div><div>No games found</div></div>';return;}
  data.forEach(z=>{
    const card=document.createElement('div'); card.className='game-card'; card.onclick=()=>openZone(z);
    const fav=document.createElement('button');
    fav.className=`game-fav-btn${gameFavs.includes(z.id)?' active':''}`;
    fav.innerHTML='❤'; fav.title='Favorite';
    fav.onclick=e=>{e.stopPropagation();toggleGameFav(z.id);};
    const img=document.createElement('img');
    img.src=z.cover.replace('{COVER_URL}',COVER_URL).replace('{HTML_URL}',HTML_URL);
    img.loading='lazy'; img.alt=z.name;
    const body=document.createElement('div'); body.className='game-card-body';
    const name=document.createElement('div'); name.className='game-card-name'; name.textContent=z.name;
    body.appendChild(name); card.append(fav,img,body); grid.appendChild(card);
  });
}
function toggleGameFav(id){
  if(gameFavs.includes(id))gameFavs=gameFavs.filter(f=>f!==id);else gameFavs.push(id);
  localStorage.setItem('nebula-gfavs',JSON.stringify(gameFavs));
  renderVaultGrid(getFilteredZones());
}
function openZone(z){
  if(z.url.startsWith('http')){window.open(z.url,'_blank');return;}
  const url=z.url.replace('{COVER_URL}',COVER_URL).replace('{HTML_URL}',HTML_URL);
  fetch(url+"?t="+Date.now())
    .then(r=>r.text())
    .then(html=>{
      activeZone=z;
      const vault=document.getElementById('game-vault');
      const old=document.getElementById('game-frame'); if(old)old.remove();
      const frame=document.createElement('iframe');
      frame.id='game-frame'; frame.style.cssText='border:none;width:100%;flex-grow:1;display:block;';
      vault.appendChild(frame);
      frame.contentDocument.open(); frame.contentDocument.write(html); frame.contentDocument.close();
      document.getElementById('vault-title').textContent='VAULT: '+z.name.toUpperCase();
      vault.style.display='flex';
    })
    .catch(()=>notify('Failed to load game','error'));
}
window.closeGame=()=>{
  document.getElementById('game-vault').style.display='none';
  const old=document.getElementById('game-frame'); if(old)old.remove();
  const blank=document.createElement('iframe'); blank.id='game-frame';
  blank.style.cssText='border:none;width:100%;flex-grow:1;display:block;';
  document.getElementById('game-vault').appendChild(blank); activeZone=null;
};
window.toggleFS=()=>{
  const f=document.getElementById('game-frame'); if(!f) return;
  (f.requestFullscreen||f.webkitRequestFullscreen||f.msRequestFullscreen).call(f);
};

/* ══════════════════════════════════════════
   TOOLTIPS
══════════════════════════════════════════ */
async function loadTooltips(){
  const c=document.getElementById('tt-wrap'); if(!c) return;
  let msgs=["GOAT TECH INDUSTRIES","STAY ENCRYPTED","LEGENDS NEVER DIE","SYSTEM ONLINE"];
  try{const d=await(await fetch('tooltips.json')).json();if(d.messages?.length)msgs=d.messages;}catch{}
  const shuffle=arr=>{ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  let deck=[], last=null;
  const next=()=>{
    if(!deck.length){ deck=shuffle(msgs); if(deck[0]===last&&deck.length>1)deck.push(deck.shift()); }
    last=deck.shift(); return last;
  };
  const mk=t=>{const e=document.createElement('span');e.className='tt-el';e.textContent=t;return e;};
  async function show(t){
    const e=mk(t);e.classList.add('enter');c.appendChild(e);
    await new Promise(r=>setTimeout(r,550));e.classList.replace('enter','vis');
    await new Promise(r=>setTimeout(r,7500));e.classList.replace('vis','exit');
    await new Promise(r=>setTimeout(r,400));e.remove();
  }
  (async()=>{ while(true){await show(next());await new Promise(r=>setTimeout(r,80));} })();
}

/* ══════════════════════════════════════════
   PARTICLES
══════════════════════════════════════════ */
const pc=document.getElementById('particles');
for(let i=0;i<55;i++){
  const p=document.createElement('div'); p.className='pt';
  p.style.left=Math.random()*100+'vw'; p.style.top=Math.random()*100+'vh';
  p.style.width=p.style.height=(Math.random()*2+.5)+'px';
  p.style.animationDuration=(Math.random()*14+8)+'s';
  p.style.animationDelay=(-Math.random()*14)+'s';
  pc.appendChild(p);
}

/* ══════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════ */
function globalKeyHandler(e){
  if(e.key==='Escape'){
    const o=document.querySelector('.modal:not(.hidden)'); if(o){closeModal(o.id);return;}
    if(document.getElementById('game-vault').style.display==='flex'){closeGame();return;}
    document.getElementById('epicker')?.classList.add('hidden');
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){
    e.preventDefault();
    if(activeSection==='chat') document.getElementById('chat-input')?.focus();
    if(activeSection==='dms')  document.getElementById('dm-input')?.focus();
  }
}