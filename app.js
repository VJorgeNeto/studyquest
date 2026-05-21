/**
 * app.js — Main orchestration. No auth. User identified by random UUID.
 */

let _state         = null;
let _pendingModals = [];
let _sidebarOpen   = false;

// ── BOOT ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  Tracker.injectSVGDefs();

  const conf = Storage.getConf();
  if (!conf) {
    _showScreen('config');
    return;
  }
  _start();
});

function _start() {
  _state = Storage.load();
  if (_state && _state.modules && _state.modules.length > 0) {
    _showTracker();
  } else {
    _showScreen('setup');
  }
}

// ── SCREENS ───────────────────────────────────────────────────────
function _showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = document.getElementById('screen-'+name);
  if (s) s.classList.add('active');
}

function _showTracker() {
  _showScreen('tracker');
  Tracker.renderAll(_state);
}

// ── CONFIG SCREEN ─────────────────────────────────────────────────
function saveSupabaseConfig() {
  const url   = (document.getElementById('cfg-url')?.value||'').trim().replace(/\/$/,'');
  const key   = (document.getElementById('cfg-key')?.value||'').trim();
  const errEl = document.getElementById('cfg-error');
  errEl.style.display = 'none';
  if (!url.startsWith('https://')) { errEl.textContent='⚠️ URL deve começar com https://'; errEl.style.display='block'; return; }
  if (key.length < 20)             { errEl.textContent='⚠️ Anon key parece inválida.';      errEl.style.display='block'; return; }
  Storage.setConf(url, key);
  _start();
}

function skipConfig() {
  Storage.setConf('__skip__', '__skip__');
  _start();
}

// ── SETUP SCREEN ──────────────────────────────────────────────────
function setTech(name) { document.getElementById('tech-name').value = name; }

function toggleApiKey() {
  const inp = document.getElementById('api-key');
  inp.type  = inp.type === 'password' ? 'text' : 'password';
}

async function parseCourse() {
  const tech   = (document.getElementById('tech-name').value||'').trim();
  const apiKey = (document.getElementById('api-key').value||'').trim();
  const raw    = (document.getElementById('course-raw').value||'').trim();
  const errEl  = document.getElementById('parse-error');
  const btn    = document.getElementById('btn-parse');
  errEl.style.display = 'none';
  if (!tech)               { _showErr(errEl,'⚠️ Informe a tecnologia (campo 01).'); return; }
  if (!apiKey)             { _showErr(errEl,'⚠️ Informe sua Anthropic API Key (campo 02).'); return; }
  if (raw.length < 20)     { _showErr(errEl,'⚠️ Cole a grade do curso no campo 03.'); return; }
  sessionStorage.setItem('sq_api', apiKey);
  btn.disabled=true; btn.querySelector('.btn-text').style.display='none'; btn.querySelector('.btn-loader').style.display='inline';
  try {
    const parsed = await Parser.parse(raw, apiKey, tech);
    const name   = (document.getElementById('player-name-input')?.value||'').trim() || 'Anônimo';
    const emoji  = _selectedEmoji || '⚡';
    _state = Storage.init(tech||parsed.tech||'Curso', parsed.modules, name, emoji);
    await Storage.save(_state);
    _showTracker();
  } catch(e) {
    _showErr(errEl, '❌ '+(e.message||'Erro desconhecido. Verifique sua API Key.'));
  } finally {
    btn.disabled=false; btn.querySelector('.btn-text').style.display='inline'; btn.querySelector('.btn-loader').style.display='none';
  }
}

function _showErr(el, msg) { el.textContent=msg; el.style.display='block'; }

function loadDemo() {
  const name  = (document.getElementById('player-name-input')?.value||'').trim() || 'Anônimo';
  const emoji = _selectedEmoji || '⚡';
  _state = Storage.init(Parser.DEMO.tech, Parser.DEMO.modules, name, emoji);
  Storage.save(_state);
  _showTracker();
}

// Emoji picker
let _selectedEmoji = '⚡';
const AVATARS = ['⚡','🔥','🚀','🧠','💎','🦊','🐉','👾','🌟','🎯','⚔️','🛡️','🦁','🐺','🦅'];
function initEmojiPicker() {
  const grid = document.getElementById('emoji-picker-grid');
  if (!grid) return;
  grid.innerHTML = AVATARS.map(e =>
    `<span class="emoji-opt${e===_selectedEmoji?' selected':''}" onclick="selectEmoji('${e}')">${e}</span>`
  ).join('');
}
function selectEmoji(e) {
  _selectedEmoji = e;
  document.querySelectorAll('.emoji-opt').forEach(el => el.classList.toggle('selected', el.textContent===e));
  const prev = document.getElementById('emoji-preview'); if(prev) prev.textContent = e;
}

// ── LESSON TOGGLE ─────────────────────────────────────────────────
const AppCore = {
  async toggleLesson(lessonId) {
    if (!_state) return;
    const lid    = String(lessonId);
    const wasDone= !!_state.progress[lid]?.done;

    if (!wasDone) {
      _state.progress[lid] = { done:true, doneAt:new Date().toISOString() };
      const lesson = (_state.modules||[]).flatMap(m=>m.lessons).find(l=>String(l.id)===lid);
      if (lesson) { const xp=Gamification.getLessonXP(lesson); _state.xp=(_state.xp||0)+xp; showXpPopup('+'+xp+' XP'); }
      _state = Gamification.updateStreak(_state);
      const {state:ns, newBadges, newAch, newTrophies} = Gamification.checkUnlocks(_state, _state.modules);
      _state = ns;
      newBadges.forEach(b  => { _pendingModals.push({icon:b.icon, title:'🎖 Badge Desbloqueado!', sub:b.name, xp:b.xp}); showToast(`${b.icon} ${b.name}`, 'badge'); });
      newAch.forEach(a     => { _pendingModals.push({icon:a.icon, title:'🏅 Conquista!',          sub:a.name+' — '+a.desc, xp:a.xp}); showToast(`${a.icon} ${a.name}`, 'badge'); });
      newTrophies.forEach(t=> { _pendingModals.push({icon:t.icon, title:'🏆 Troféu!',             sub:t.name, xp:t.xp}); showToast(`${t.icon} ${t.name} conquistado!`, 'badge'); });
      const info = Gamification.getLevelInfo(_state.xp);
      if (info.current.level > (_state.level||1)) { _state.level=info.current.level; showToast(`⚡ Level Up! Nível ${info.current.level} — ${info.current.title}`, 'xp'); }
    } else {
      _state.progress[lid] = { done:false };
    }

    await Storage.save(_state);
    Tracker.renderAll(_state);
    if (!wasDone && _pendingModals.length > 0) _showNextModal();
  }
};

// ── VIEWS ─────────────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const v = document.getElementById('view-'+name); if(v) v.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{ if(n.getAttribute('onclick')?.includes(name)) n.classList.add('active'); });
  if (name==='achievements') Tracker.renderAchievements(_state);
  if (name==='stats')        Tracker.renderStats(_state);
  if (name==='leaderboard')  Tracker.renderLeaderboard(_state);
  if (_sidebarOpen && window.innerWidth<=768) toggleSidebar();
}

function toggleSidebar() {
  _sidebarOpen = !_sidebarOpen;
  document.getElementById('sidebar').classList.toggle('open', _sidebarOpen);
}

document.addEventListener('click', e => {
  if (_sidebarOpen && window.innerWidth<=768) {
    const sb=document.getElementById('sidebar'), btn=document.querySelector('.topbar-menu');
    if (!sb?.contains(e.target) && e.target!==btn) toggleSidebar();
  }
});

// ── RESET ─────────────────────────────────────────────────────────
function confirmReset() {
  if (confirm('Apagar todo o progresso e iniciar um novo curso?')) {
    Storage.clear(); _state=null; _pendingModals=[];
    _showScreen('setup'); initEmojiPicker();
  }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────
function showToast(msg, type='success') {
  const c=document.getElementById('toast-container'), t=document.createElement('div');
  t.className=`toast toast-${type}`; t.textContent=msg; c.appendChild(t);
  setTimeout(()=>{ t.style.cssText='opacity:0;transform:translateX(20px);transition:all .3s'; setTimeout(()=>t.remove(),300); },3500);
}

function showXpPopup(text) {
  const p=document.getElementById('xp-popup'); if(!p) return;
  document.getElementById('xp-popup-text').textContent=text;
  p.style.display='block'; p.style.animation='none'; void p.offsetWidth;
  p.style.animation='xp-float 1.5s ease forwards';
  setTimeout(()=>p.style.display='none',1500);
}

function _showNextModal() {
  if (!_pendingModals.length) return;
  const d=_pendingModals.shift();
  document.getElementById('modal-badge-icon').textContent=d.icon;
  document.getElementById('modal-title').textContent=d.title;
  document.getElementById('modal-sub').textContent=d.sub;
  document.getElementById('modal-xp').textContent=`+${d.xp} XP`;
  document.getElementById('badge-modal').style.display='flex';
}

function closeBadgeModal() {
  document.getElementById('badge-modal').style.display='none';
  setTimeout(()=>{ if(_pendingModals.length) _showNextModal(); },200);
}

// Init on load
window.addEventListener('DOMContentLoaded', () => { setTimeout(initEmojiPicker, 100); });
