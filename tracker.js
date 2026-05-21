/**
 * tracker.js — All rendering: modules, progress, achievements, stats, leaderboard.
 */
const Tracker = (() => {
  const COLORS = ['#4fffb0','#7b68ee','#ffd700','#4dc9ff','#ff6b6b','#ff9f43','#a29bfe','#00cec9','#fd79a8','#6c5ce7','#fdcb6e','#81ecec','#e17055','#74b9ff','#55efc4'];
  const _exp = new Set();

  const fmt = m => !m?'':m<60?m+'m':`${Math.floor(m/60)}h${m%60?' '+(m%60)+'m':''}`;
  const el  = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };

  function injectSVGDefs() {
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.style.cssText='width:0;height:0;position:absolute';
    s.innerHTML=`<defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7b68ee"/><stop offset="100%" stop-color="#4fffb0"/></linearGradient></defs>`;
    document.body.prepend(s);
  }

  function renderModules(state) {
    const c = document.getElementById('modules-container');
    if (!c) return;
    c.innerHTML = '';
    (state.modules||[]).forEach((mod,mi) => {
      const color   = COLORS[mi%COLORS.length];
      const total   = mod.lessons.length;
      const done    = mod.lessons.filter(l=>state.progress[String(l.id)]?.done).length;
      const pct     = total ? Math.round(done/total*100) : 0;
      const unlocked= state.unlockedBadges.includes('module_'+mod.id);
      const badge   = Gamification.getModuleBadge(mod,mi);
      const isExp   = _exp.has(mod.id);

      const card = document.createElement('div');
      card.className = `module-card${pct===100?' mod-complete':''}${isExp?' expanded':''}`;
      card.id = `mc-${mod.id}`;
      card.innerHTML = `
        <div class="module-header" onclick="Tracker.toggleModule('${mod.id}')">
          <div class="mod-icon" style="background:${color}18;border-color:${color}33">${mod.icon||'📚'}</div>
          <div class="mod-meta">
            <div class="mod-tag">Módulo ${mi+1} · ${done}/${total}</div>
            <div class="mod-title">${mod.title}</div>
          </div>
          <div class="mod-badge-slot" title="${badge.name}" style="opacity:${unlocked?1:0}">${badge.icon}</div>
          <div class="mod-progress">
            <div class="mod-bar"><div class="mod-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${color}88,${color})"></div></div>
            <span class="mod-pct">${pct}%</span>
          </div>
          <span class="mod-toggle">▾</span>
        </div>
        <div class="lessons-list">
          ${mod.lessons.map((l,li)=>{
            const done2 = !!state.progress[String(l.id)]?.done;
            const tag   = l.type==='quiz'?'<span class="tag-pill tag-quiz">quiz</span>':l.type==='hands'?'<span class="tag-pill tag-hands">hands-on</span>':'<span class="tag-pill tag-video">vídeo</span>';
            return `<div class="lesson-row${done2?' lesson-done':''}" onclick="AppCore.toggleLesson('${l.id}')">
              <div class="lesson-chk">${done2?'✓':''}</div>
              <span class="lesson-num">${li+1}.</span>
              <span class="lesson-name">${l.name}</span>
              <div class="lesson-tags">${l.time?`<span class="lesson-time">${l.time}m</span>`:''} ${tag}</div>
            </div>`;
          }).join('')}
        </div>`;
      c.appendChild(card);
    });
  }

  function renderGlobalProgress(state) {
    const mods     = state.modules||[];
    const total    = mods.reduce((s,m)=>s+m.lessons.length,0);
    const done     = Object.values(state.progress||{}).filter(p=>p.done).length;
    const pct      = total ? Math.round(done/total*100) : 0;
    const allLess  = mods.flatMap(m=>m.lessons);
    const tMins    = allLess.reduce((s,l)=>s+(l.time||0),0);
    const dMins    = allLess.filter(l=>state.progress[String(l.id)]?.done).reduce((s,l)=>s+(l.time||0),0);
    el('gp-pct', pct+'%'); el('gp-sub',`${done} de ${total} aulas concluídas`); el('gp-ring-label',pct+'%');
    el('gp-time-done', fmt(dMins)||'0m'); el('gp-time-left', fmt(tMins-dMins)||'0m');
    const ring = document.getElementById('ring-fill');
    if (ring) { ring.style.strokeDashoffset = 213.6-(213.6*pct/100); ring.setAttribute('stroke', pct===100?'#4fffb0':'url(#ringGrad)'); }
  }

  function renderSidebar(state) {
    const info = Gamification.getLevelInfo(state.xp||0);
    el('player-level-badge','Nível '+info.current.level); el('player-title-text',info.current.title);
    const av = document.getElementById('player-avatar'); if(av) av.textContent = info.current.avatar;
    const xf = document.getElementById('xp-bar-fill'); if(xf) xf.style.width=info.pct+'%';
    el('xp-label', info.next?`${info.xpInLevel} / ${info.xpForNext} XP`:`${state.xp} XP (MAX)`);
    el('ss-streak',(state.streak||0)+(state.streak>=3?'🔥':'')); el('topbar-tech-name',state.tech||'Curso');
    el('topbar-xp-badge',`⚡ ${state.xp||0} XP`);
    const mods=state.modules||[], allLess=mods.flatMap(m=>m.lessons);
    const done=Object.values(state.progress||{}).filter(p=>p.done).length;
    const dMins=allLess.filter(l=>state.progress[String(l.id)]?.done).reduce((s,l)=>s+(l.time||0),0);
    el('ss-done',done); el('ss-time',fmt(dMins)||'0m');
    // user identity
    el('sb-display-name', state.displayName||'Anônimo');
    const emo = document.getElementById('sb-emoji'); if(emo) emo.textContent = state.avatarEmoji||'⚡';
  }

  function renderAchievements(state) {
    const mods = state.modules||[];
    const bg = document.getElementById('module-badges-grid');
    if (bg) bg.innerHTML = mods.map((mod,i)=>{
      const b=Gamification.getModuleBadge(mod,i), u=state.unlockedBadges.includes('module_'+mod.id);
      return `<div class="badge-card ${u?'unlocked':'locked'}">${u?'<div class="badge-unlocked-shine"></div>':''}
        <span class="badge-icon">${b.icon}</span><div class="badge-name">${mod.title}</div>
        <div class="badge-desc">Módulo ${i+1} concluído</div><div class="badge-xp">+${b.xp} XP</div></div>`;
    }).join('');
    const sg = document.getElementById('special-achievements-grid');
    if (sg) sg.innerHTML = Gamification.SPECIAL.map(a=>{
      const u=state.unlockedAchievements.includes(a.id);
      return `<div class="achievement-card ${u?'unlocked':'locked'}"><div class="ach-icon">${a.icon}</div>
        <div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div><div class="ach-xp">+${a.xp} XP</div></div></div>`;
    }).join('');
    const tg = document.getElementById('trophies-grid');
    if (tg) tg.innerHTML = Gamification.TROPHIES.map(t=>{
      const u=state.unlockedTrophies.includes(t.id);
      return `<div class="trophy-card ${u?'unlocked':'locked'}"><span class="trophy-icon">${t.icon}</span>
        <div class="trophy-name">${t.name}</div><div class="trophy-desc">${t.desc}</div><div class="badge-xp">+${t.xp} XP</div></div>`;
    }).join('');
  }

  function renderStats(state) {
    const mods=state.modules||[];
    const info=Gamification.getLevelInfo(state.xp||0);
    const dMins=mods.flatMap(m=>m.lessons).filter(l=>state.progress[String(l.id)]?.done).reduce((s,l)=>s+(l.time||0),0);
    el('sc-xp',state.xp||0); el('sc-level',info.current.level); el('sc-streak',state.streak||0);
    el('sc-streak-max',state.streakMax||0); el('sc-time',fmt(dMins)||'0h'); el('sc-days',Object.keys(state.studyDays||{}).length);
    _renderHeatmap(state);
    const ml = document.getElementById('module-stats-list');
    if (ml) ml.innerHTML = mods.map(mod=>{
      const t=mod.lessons.length, d=mod.lessons.filter(l=>state.progress[String(l.id)]?.done).length, p=t?Math.round(d/t*100):0;
      return `<div class="mstat-row"><div class="mstat-top"><span class="mstat-name">${mod.icon} ${mod.title}</span><span class="mstat-pct">${d}/${t} · ${p}%</span></div>
        <div class="mstat-bar"><div class="mstat-fill" style="width:${p}%"></div></div></div>`;
    }).join('');
  }

  function _renderHeatmap(state) {
    const hm = document.getElementById('heatmap'); if (!hm) return;
    const sd=state.studyDays||{}, max=Math.max(...Object.values(sd),1);
    const days=[]; for(let i=83;i>=0;i--){const d=new Date(Date.now()-i*86400000);days.push(d.toISOString().slice(0,10));}
    hm.innerHTML='';
    for(let w=0;w<12;w++){const col=document.createElement('div');col.className='heatmap-col';
      for(let d=0;d<7;d++){const date=days[w*7+d],cnt=sd[date]||0,lvl=cnt===0?0:Math.min(4,Math.ceil(cnt/max*4));
        const cell=document.createElement('div');cell.className=`hm-cell hm-${lvl}`;cell.title=`${date}: ${cnt} aulas`;col.appendChild(cell);}
      hm.appendChild(col);}
  }

  async function renderLeaderboard(state) {
    const list = document.getElementById('leaderboard-list');
    const load = document.getElementById('leaderboard-loading');
    if (!list) return;
    if (!Storage.hasConf()) {
      if (load) load.textContent = '⚠️ Leaderboard requer configuração do Supabase.';
      return;
    }
    if (load) load.style.display='block'; list.innerHTML='';
    const rows = await Storage.fetchLeaderboard(30);
    if (load) load.style.display='none';
    if (!rows.length) { list.innerHTML='<div class="lb-empty">Ninguém no leaderboard ainda. Seja o primeiro! 🚀</div>'; return; }
    const myUid = Storage.getUserId();
    list.innerHTML = rows.map((r,i)=>{
      const rank   = i+1;
      const isMe   = r.user_id === myUid;
      const medal  = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'#'+rank;
      const rClass = rank<=3?`top${rank}`:'';
      const pct    = r.total_lessons>0?Math.round(r.lessons_done/r.total_lessons*100):0;
      return `<div class="lb-row${isMe?' lb-me':''}">
        <div class="lb-rank ${rClass}">${medal}</div>
        <div class="lb-avatar">${r.avatar_emoji||'⚡'}</div>
        <div class="lb-info">
          <div class="lb-name">${r.display_name||'Anônimo'}${isMe?' <span class="lb-you">(você)</span>':''}</div>
          <div class="lb-meta">${r.tech||'—'} · Nv.${r.level||1} · ${pct}% concluído</div>
        </div>
        ${r.streak_max>=3?`<div class="lb-streak">🔥 ${r.streak_max}</div>`:''}
        <div class="lb-xp-block"><div class="lb-xp">${r.xp||0} XP</div><div class="lb-lvl">Nível ${r.level||1}</div></div>
      </div>`;
    }).join('');
  }

  function toggleModule(id) {
    const c=document.getElementById(`mc-${id}`); if(!c) return;
    _exp.has(id)?(_exp.delete(id),c.classList.remove('expanded')):(_exp.add(id),c.classList.add('expanded'));
  }

  function renderAll(state) {
    renderModules(state); renderGlobalProgress(state); renderSidebar(state);
    renderAchievements(state); renderStats(state);
  }

  return { injectSVGDefs, renderAll, renderModules, renderGlobalProgress, renderSidebar, renderAchievements, renderStats, renderLeaderboard, toggleModule };
})();
