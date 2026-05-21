/**
 * storage.js
 * Dual-layer: localStorage (always) + Supabase REST (when configured).
 * No authentication — user identified by a random UUID stored locally.
 */
const Storage = (() => {
  const VER      = '3';
  const KEY      = 'studyquest_v' + VER;
  const CONF_KEY = 'studyquest_conf';
  const UID_KEY  = 'studyquest_uid';

  // ── USER ID ──────────────────────────────────────────────────────
  function getUserId() {
    let uid = localStorage.getItem(UID_KEY);
    if (!uid) {
      uid = crypto.randomUUID ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(UID_KEY, uid);
    }
    return uid;
  }

  // ── DEFAULTS ─────────────────────────────────────────────────────
  const defaults = () => ({
    version: VER,
    tech: '',
    modules: [],
    progress: {},
    xp: 0,
    level: 1,
    streak: 0,
    streakMax: 0,
    lastStudyDate: null,
    studyDays: {},
    unlockedBadges: [],
    unlockedAchievements: [],
    unlockedTrophies: [],
    displayName: 'Anônimo',
    avatarEmoji: '⚡',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ── LOCAL ────────────────────────────────────────────────────────
  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaults(), ...JSON.parse(raw) } : null;
    } catch { return null; }
  }

  function saveLocal(state) {
    try {
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { console.warn('local save failed', e); }
  }

  function clearLocal() { localStorage.removeItem(KEY); }

  // ── SUPABASE CONFIG ──────────────────────────────────────────────
  function getConf() {
    try { return JSON.parse(localStorage.getItem(CONF_KEY)) || null; }
    catch { return null; }
  }
  function setConf(url, anonKey) {
    localStorage.setItem(CONF_KEY, JSON.stringify({ url: url.replace(/\/$/, ''), anonKey }));
  }
  function hasConf() {
    const c = getConf();
    return !!(c && c.url && c.url !== '__skip__' && c.anonKey);
  }

  // ── SUPABASE REST ────────────────────────────────────────────────
  async function _req(method, path, body) {
    const conf = getConf();
    if (!conf || !hasConf()) return null;
    const res = await fetch(`${conf.url}/rest/v1/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': conf.anonKey,
        'Authorization': `Bearer ${conf.anonKey}`,
        'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.message || res.status); }
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  }

  async function saveRemote(state) {
    if (!hasConf()) return;
    const uid = getUserId();
    try {
      await _req('POST', 'user_progress', {
        user_id:       uid,
        display_name:  state.displayName || 'Anônimo',
        avatar_emoji:  state.avatarEmoji || '⚡',
        tech:          state.tech || '',
        xp:            state.xp || 0,
        level:         state.level || 1,
        streak:        state.streak || 0,
        streak_max:    state.streakMax || 0,
        lessons_done:  Object.values(state.progress||{}).filter(p=>p.done).length,
        total_lessons: (state.modules||[]).reduce((s,m)=>s+m.lessons.length,0),
        state_json:    state,
        updated_at:    new Date().toISOString(),
      });
    } catch (e) { console.warn('remote save failed', e); }
  }

  async function fetchLeaderboard(limit = 30) {
    if (!hasConf()) return [];
    try {
      const rows = await _req('GET',
        `user_progress?select=user_id,display_name,avatar_emoji,tech,xp,level,streak_max,lessons_done,total_lessons&order=xp.desc&limit=${limit}`
      );
      return rows || [];
    } catch { return []; }
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  function init(tech, modules, displayName, avatarEmoji) {
    const existing = loadLocal() || defaults();
    const s = {
      ...existing,
      tech,
      modules,
      // preserve progress if same course
      progress:     existing.tech === tech ? (existing.progress || {}) : {},
      displayName:  displayName || existing.displayName || 'Anônimo',
      avatarEmoji:  avatarEmoji || existing.avatarEmoji || '⚡',
    };
    saveLocal(s);
    return s;
  }

  function load() { return loadLocal(); }

  async function save(state) {
    saveLocal(state);
    await saveRemote(state);
  }

  function clear() { clearLocal(); }

  return { load, save, init, clear, getConf, setConf, hasConf, getUserId, fetchLeaderboard, defaults };
})();
