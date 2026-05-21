/**
 * parser.js — Claude API course parser + demo data
 */
const Parser = (() => {

  const SYSTEM = `You are a course curriculum parser. Convert any raw course text into structured JSON.

Rules:
1. Group lessons into logical modules. Use existing sections if present, otherwise infer from topics.
2. Each module: id (slug), title, icon (single emoji), lessons array.
3. Each lesson: id (unique string/number), name, time (minutes integer, 0 if unknown), type (video|quiz|hands).
4. Type rules: "quiz/test/teste/exam" → quiz | "hands-on/lab/prática/exercise" → hands | else → video.
5. Output ONLY valid JSON. Root: { "tech": "<inferred or empty>", "modules": [...] }
6. Do not translate or modify lesson names. Max 20 modules.`;

  async function parse(rawText, apiKey, techHint) {
    const prompt = (techHint ? `Technology: ${techHint}\n\n` : '') + `Course content:\n\n${rawText}`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:4000, system:SYSTEM, messages:[{role:'user',content:prompt}] }),
    });
    if (!res.ok) { const e=await res.json().catch(()=>{}); throw new Error(e?.error?.message||`API ${res.status}`); }
    const data = await res.json();
    const text = data.content?.find(b=>b.type==='text')?.text||'';
    const clean = text.replace(/^```[a-z]*\n?/i,'').replace(/\n?```$/i,'').trim();
    let parsed;
    try { parsed = JSON.parse(clean); } catch { throw new Error('IA retornou formato inválido. Tente novamente.'); }
    if (!Array.isArray(parsed.modules)) throw new Error('Estrutura inválida: "modules" não encontrado.');
    let ctr=1; const used=new Set();
    parsed.modules = parsed.modules.map((mod,mi) => {
      mod.id   = mod.id   || `module_${mi+1}`;
      mod.icon = mod.icon || '📚';
      mod.lessons = (mod.lessons||[]).map(l => {
        let lid = String(l.id||ctr); while(used.has(lid)) lid=String(++ctr); used.add(lid); ctr++;
        return { id:lid, name:l.name||'Aula', time:parseInt(l.time)||0, type:['video','quiz','hands'].includes(l.type)?l.type:'video' };
      });
      return mod;
    }).filter(m=>m.lessons.length>0);
    return parsed;
  }

  const DEMO = {
    tech: 'OpenTelemetry',
    modules: [
      { id:'intro',          icon:'🚀', title:'Introdução ao Curso',
        lessons:[{id:'1',name:'About this Course',time:3,type:'video'},{id:'2',name:'Your Instructor',time:1,type:'video'},{id:'3',name:'My Teaching Style',time:3,type:'video'},{id:'4',name:'Course Outline',time:5,type:'video'},{id:'5',name:'Course Resources',time:1,type:'video'}]},
      { id:'observability',  icon:'🔭', title:'Fundamentos de Observabilidade',
        lessons:[{id:'6',name:'What is Observability?',time:2,type:'video'},{id:'7',name:'Telemetry Signals',time:2,type:'video'},{id:'8',name:'Monitoring Vs Observability',time:4,type:'video'},{id:'9',name:'Reliability Metrics',time:3,type:'video'},{id:'10',name:'Observability Solutions',time:2,type:'video'},{id:'11',name:'Recap',time:3,type:'video'},{id:'q1',name:'Observability Quiz',time:0,type:'quiz'}]},
      { id:'environment',    icon:'⚙️', title:'Ambiente de Aprendizado',
        lessons:[{id:'12',name:'Introduction',time:2,type:'video'},{id:'13',name:'Setup Learning Environment',time:17,type:'video'},{id:'14',name:'About hello-telemetry',time:7,type:'video'},{id:'15',name:'About OpenTelemetry Demo',time:7,type:'video'},{id:'16',name:'OpenTelemetry Demo Operation',time:4,type:'video'},{id:'17',name:'Recap',time:4,type:'video'},{id:'q2',name:'Learning Environment Quiz',time:0,type:'quiz'}]},
      { id:'instrumentation',icon:'🔧', title:'Instrumentação',
        lessons:[{id:'18',name:'About OpenTelemetry',time:4,type:'video'},{id:'19',name:'Instrumentation',time:5,type:'video'},{id:'20',name:'APIs and SDKs',time:4,type:'video'},{id:'21',name:'Zero-code Instrumentation',time:3,type:'video'},{id:'22',name:'eBPF-based Instrumentation',time:4,type:'video'},{id:'23',name:'Hands-on Zero-code — Java',time:14,type:'hands'},{id:'24',name:'Hands-on Zero-code — Python',time:9,type:'hands'},{id:'25',name:'Zero-code Summary',time:1,type:'video'},{id:'26',name:'Zero-code — OTel Demo',time:3,type:'video'},{id:'27',name:'Code-based Instrumentation',time:2,type:'video'},{id:'28',name:'OTel Example Apps',time:1,type:'video'},{id:'29',name:'Recap',time:5,type:'video'},{id:'q3',name:'Instrumentation Quiz',time:0,type:'quiz'}]},
      { id:'signals',        icon:'📡', title:'Telemetry Signals',
        lessons:[{id:'30',name:'Signals Introduction',time:1,type:'video'},{id:'31',name:'Metrics',time:3,type:'video'},{id:'32',name:'Metrics — Kinds',time:3,type:'video'},{id:'33',name:'Hands-on Metrics',time:2,type:'hands'},{id:'34',name:'Hands-on Metrics — Java',time:17,type:'hands'},{id:'35',name:'Hands-on Metrics — Python',time:11,type:'hands'},{id:'36',name:'Hands-on Metrics — OTel Demo',time:10,type:'hands'},{id:'37',name:'Traces',time:2,type:'video'},{id:'38',name:'Traces — Span Data',time:5,type:'video'},{id:'39',name:'Hands-on Traces — Java',time:12,type:'hands'},{id:'40',name:'Hands-on Traces — Python',time:8,type:'hands'},{id:'41',name:'Traces — Context Propagation',time:6,type:'video'},{id:'42',name:'Hands-on — Context Propagation',time:12,type:'hands'},{id:'43',name:'Hands-on Traces — OTel Demo',time:6,type:'hands'},{id:'44',name:'Logs',time:4,type:'video'},{id:'45',name:'Hands-on Logs — Java',time:11,type:'hands'},{id:'46',name:'Hands-on Logs — Python',time:7,type:'hands'},{id:'47',name:'Hands-on Logs — OTel Demo',time:5,type:'hands'},{id:'48',name:'Hands-on — Zero-code + Code-based',time:11,type:'hands'},{id:'49',name:'Baggage',time:4,type:'video'},{id:'50',name:'Hands-on Baggage',time:9,type:'hands'},{id:'51',name:'Profiling',time:3,type:'video'},{id:'52',name:'Recap',time:7,type:'video'},{id:'q4',name:'Telemetry Signals Quiz',time:0,type:'quiz'}]},
      { id:'sdk',            icon:'🏗️', title:'SDK Architecture & Composability',
        lessons:[{id:'53',name:'Introduction',time:1,type:'video'},{id:'54',name:'SDK Architecture',time:6,type:'video'},{id:'55',name:'SDK and Plugins',time:4,type:'video'},{id:'56',name:'SDK Composability',time:4,type:'video'},{id:'57',name:'SDK Configuration',time:5,type:'video'},{id:'58',name:'Choosing the right SDK version',time:4,type:'video'},{id:'59',name:'Recap',time:6,type:'video'},{id:'q5',name:'SDK Quiz',time:0,type:'quiz'}]},
      { id:'standards',      icon:'📐', title:'Standards — OTLP & Semantic Conventions',
        lessons:[{id:'60',name:'Introduction',time:2,type:'video'},{id:'61',name:'OTLP',time:2,type:'video'},{id:'62',name:'Semantic Conventions',time:6,type:'video'},{id:'63',name:'Recap',time:4,type:'video'},{id:'q6',name:'Standards Quiz',time:0,type:'quiz'}]},
      { id:'collector',      icon:'🔄', title:'OpenTelemetry Collector',
        lessons:[{id:'64',name:'Purpose',time:4,type:'video'},{id:'65',name:'Installation',time:7,type:'video'},{id:'66',name:'Configuration',time:3,type:'video'},{id:'67',name:'Receiver',time:3,type:'video'},{id:'68',name:'Processor',time:2,type:'video'},{id:'69',name:'Exporter',time:2,type:'video'},{id:'70',name:'Extensions',time:2,type:'video'},{id:'71',name:'Service & Pipelines',time:3,type:'video'},{id:'72',name:'Hands-on Collector — mysql',time:7,type:'hands'},{id:'73',name:'Deployment Patterns',time:6,type:'video'},{id:'74',name:'Scaling Strategies',time:5,type:'video'},{id:'75',name:'SDK Exporters vs Collector Exporters',time:2,type:'video'},{id:'76',name:'Recap',time:7,type:'video'},{id:'q7',name:'Collector Quiz',time:0,type:'quiz'}]},
      { id:'debugging',      icon:'🐛', title:'Debugging & Maintenance',
        lessons:[{id:'77',name:'Introduction',time:3,type:'video'},{id:'78',name:'Troubleshooting Context Propagation',time:6,type:'video'},{id:'79',name:'Debugging Collector Pipelines',time:13,type:'video'},{id:'80',name:'Error Handling and Data Loss',time:8,type:'video'},{id:'81',name:'Schema Management',time:7,type:'video'},{id:'82',name:'Recap',time:4,type:'video'},{id:'q8',name:'Debugging Quiz',time:0,type:'quiz'}]},
      { id:'sre',            icon:'🎯', title:'SRE & Reliability',
        lessons:[{id:'83',name:'Introduction',time:1,type:'video'},{id:'84',name:'SRE Origins',time:5,type:'video'},{id:'85',name:'Reliability Targets',time:2,type:'video'},{id:'86',name:'SLIs, SLOs, and SLAs',time:4,type:'video'}]},
    ]
  };

  return { parse, DEMO };
})();
