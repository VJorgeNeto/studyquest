/**
 * gamification.js — XP, Levels, Badges, Achievements, Trophies
 */
const Gamification = (() => {

  const LEVELS = [
    { level:1,  title:'Iniciante',      xp:0,     avatar:'🌱' },
    { level:2,  title:'Curioso',        xp:100,   avatar:'🔍' },
    { level:3,  title:'Aprendiz',       xp:250,   avatar:'📖' },
    { level:4,  title:'Estudante',      xp:500,   avatar:'✏️' },
    { level:5,  title:'Praticante',     xp:900,   avatar:'⚙️' },
    { level:6,  title:'Desenvolvedor',  xp:1400,  avatar:'💻' },
    { level:7,  title:'Engenheiro',     xp:2000,  avatar:'🔧' },
    { level:8,  title:'Especialista',   xp:2800,  avatar:'🎯' },
    { level:9,  title:'Expert',         xp:3800,  avatar:'⚡' },
    { level:10, title:'Mestre',         xp:5000,  avatar:'🏆' },
    { level:11, title:'Sênior',         xp:6500,  avatar:'👑' },
    { level:12, title:'Arquiteto',      xp:8500,  avatar:'🌟' },
    { level:13, title:'Principal',      xp:11000, avatar:'💎' },
    { level:14, title:'Lenda',          xp:14000, avatar:'🦄' },
    { level:15, title:'Grand Master',   xp:18000, avatar:'🌌' },
  ];

  const XP = {
    video: 10, hands: 20, quiz: 25,
    module: 100, streak_3: 50, streak_7: 150, streak_14: 350,
    halfway: 200, course_done: 500,
  };

  const SPECIAL = [
    { id:'first_blood', icon:'🩸', name:'First Blood',      desc:'Complete sua primeira aula',       xp:20,
      check: s => Object.values(s.progress).filter(p=>p.done).length >= 1 },
    { id:'streak_3',    icon:'🔥', name:'Em Chamas',        desc:'3 dias seguidos estudando',        xp:50,
      check: s => (s.streak||0) >= 3 },
    { id:'streak_7',    icon:'⚡', name:'Semana Imparável', desc:'7 dias de streak',                 xp:150,
      check: s => (s.streak||0) >= 7 },
    { id:'streak_14',   icon:'🌪️', name:'Força da Rotina', desc:'14 dias de streak',                xp:350,
      check: s => (s.streak||0) >= 14 },
    { id:'halfway',     icon:'🏁', name:'Meio Caminho',     desc:'50% do curso concluído',           xp:200,
      check: (s, mods) => { const t=mods.reduce((a,m)=>a+m.lessons.length,0); const d=Object.values(s.progress).filter(p=>p.done).length; return t>0&&d>=Math.floor(t/2); } },
    { id:'quiz_master', icon:'🧠', name:'Quiz Master',      desc:'Complete todos os quizzes',        xp:200,
      check: (s, mods) => { const q=mods.flatMap(m=>m.lessons.filter(l=>l.type==='quiz')); return q.length>0&&q.every(l=>s.progress[String(l.id)]?.done); } },
    { id:'hands_on',    icon:'🛠️', name:'Mão na Massa',    desc:'Complete 5 aulas hands-on',        xp:100,
      check: (s, mods) => { const h=mods.flatMap(m=>m.lessons.filter(l=>l.type==='hands')); return h.filter(l=>s.progress[String(l.id)]?.done).length>=5; } },
    { id:'night_owl',   icon:'🦉', name:'Coruja Noturna',   desc:'Estude após 22h',                  xp:30,
      check: s => Object.values(s.progress).some(p=>{ if(!p.doneAt)return false; const h=new Date(p.doneAt).getHours(); return h>=22||h<3; }) },
    { id:'early_bird',  icon:'🐦', name:'Madrugador',       desc:'Estude antes das 7h',              xp:30,
      check: s => Object.values(s.progress).some(p=>{ if(!p.doneAt)return false; const h=new Date(p.doneAt).getHours(); return h>=5&&h<7; }) },
    { id:'speed_run',   icon:'🚀', name:'Speed Run',        desc:'Complete 10 aulas em um dia',      xp:150,
      check: s => { const d={}; Object.values(s.progress).forEach(p=>{if(!p.done||!p.doneAt)return; const k=p.doneAt.slice(0,10); d[k]=(d[k]||0)+1;}); return Object.values(d).some(v=>v>=10); } },
    { id:'completionist',icon:'💯',name:'Completionist',    desc:'Finalize 100% do curso',           xp:500,
      check: (s, mods) => { const t=mods.reduce((a,m)=>a+m.lessons.length,0); return t>0&&Object.values(s.progress).filter(p=>p.done).length>=t; } },
  ];

  const TROPHIES = [
    { id:'bronze',   icon:'🥉', name:'Troféu Bronze',  desc:'Complete 25% do curso', xp:100,
      check: (s,m) => { const t=m.reduce((a,x)=>a+x.lessons.length,0); return t>0&&Object.values(s.progress).filter(p=>p.done).length>=Math.floor(t*.25); } },
    { id:'silver',   icon:'🥈', name:'Troféu Prata',   desc:'Complete 50% do curso', xp:250,
      check: (s,m) => { const t=m.reduce((a,x)=>a+x.lessons.length,0); return t>0&&Object.values(s.progress).filter(p=>p.done).length>=Math.floor(t*.5);  } },
    { id:'gold',     icon:'🥇', name:'Troféu Ouro',    desc:'Complete 75% do curso', xp:400,
      check: (s,m) => { const t=m.reduce((a,x)=>a+x.lessons.length,0); return t>0&&Object.values(s.progress).filter(p=>p.done).length>=Math.floor(t*.75); } },
    { id:'platinum', icon:'💎', name:'Troféu Platina', desc:'Complete 100% do curso',xp:1000,
      check: (s,m) => { const t=m.reduce((a,x)=>a+x.lessons.length,0); return t>0&&Object.values(s.progress).filter(p=>p.done).length>=t; } },
  ];

  function getLevelInfo(xp) {
    let cur = LEVELS[0], nxt = LEVELS[1];
    for (let i=LEVELS.length-1;i>=0;i--) { if(xp>=LEVELS[i].xp){cur=LEVELS[i];nxt=LEVELS[i+1]||null;break;} }
    const inLvl   = nxt ? xp - cur.xp : 0;
    const forNext = nxt ? nxt.xp - cur.xp : 0;
    const pct     = nxt ? Math.round(inLvl/forNext*100) : 100;
    return { current:cur, next:nxt, xpInLevel:inLvl, xpForNext:forNext, pct };
  }

  function getLessonXP(lesson) {
    return lesson.type==='quiz' ? XP.quiz : lesson.type==='hands' ? XP.hands : XP.video;
  }

  function getModuleBadge(mod, idx) {
    const icons = ['🔭','🔧','⚙️','📡','🏗️','📐','🔄','🐛','🎯','🧪','🌐','💡','🛰️','🔬','🎓'];
    return { id:'module_'+mod.id, icon:mod.icon||icons[idx%icons.length], name:mod.title+' — Concluído', xp:XP.module };
  }

  function updateStreak(state) {
    const today = new Date().toISOString().slice(0,10);
    const yest  = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if (state.lastStudyDate === today) return state;
    state.streak = state.lastStudyDate === yest ? (state.streak||0)+1 : 1;
    state.streakMax = Math.max(state.streak, state.streakMax||0);
    state.lastStudyDate = today;
    state.studyDays = state.studyDays || {};
    state.studyDays[today] = (state.studyDays[today]||0)+1;
    return state;
  }

  function checkUnlocks(state, modules) {
    const newBadges=[], newAch=[], newTrophies=[];
    modules.forEach((mod,i) => {
      const bid = 'module_'+mod.id;
      if (state.unlockedBadges.includes(bid)) return;
      if (mod.lessons.every(l=>state.progress[String(l.id)]?.done)) {
        state.unlockedBadges.push(bid);
        const b = getModuleBadge(mod,i); state.xp += b.xp; newBadges.push(b);
      }
    });
    SPECIAL.forEach(a => {
      if (state.unlockedAchievements.includes(a.id)) return;
      if (a.check(state,modules)) { state.unlockedAchievements.push(a.id); state.xp+=a.xp; newAch.push(a); }
    });
    TROPHIES.forEach(t => {
      if (state.unlockedTrophies.includes(t.id)) return;
      if (t.check(state,modules)) { state.unlockedTrophies.push(t.id); state.xp+=t.xp; newTrophies.push(t); }
    });
    state.level = getLevelInfo(state.xp).current.level;
    return { state, newBadges, newAch, newTrophies };
  }

  return { LEVELS, XP, SPECIAL, TROPHIES, getLevelInfo, getLessonXP, getModuleBadge, updateStreak, checkUnlocks };
})();
