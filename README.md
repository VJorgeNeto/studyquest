# 🎯 StudyQuest — Gamified Course Tracker

> Transforme qualquer curso em uma jornada épica. Cole a grade, escolha a tecnologia e acompanhe seu progresso com XP, badges, streaks e leaderboard global.

![License](https://img.shields.io/badge/license-MIT-green?style=flat)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ready-blue?style=flat&logo=github)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES6+-yellow?style=flat&logo=javascript)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat&logo=supabase)
![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=flat)

---

## ✨ Funcionalidades

- **Parser com IA** — Cole a grade em qualquer formato; Claude organiza em módulos automaticamente
- **Gamificação completa** — XP, 15 níveis, streaks, badges por módulo, 10+ conquistas, 4 troféus
- **Leaderboard global** — Ranking público via Supabase (sem login, apenas nome + emoji)
- **Heatmap de atividade** — Visualize seus dias de estudo
- **Progresso detalhado** — Barra SVG, tempo assistido vs restante, stats por módulo
- **Offline first** — Tudo funciona com localStorage; Supabase é opcional para nuvem

---

## 🚀 Deploy no GitHub Pages

```bash
git clone https://github.com/seu-usuario/studyquest.git
cd studyquest
# Abra index.html — funciona direto no browser ou em qualquer servidor estático
```

No GitHub: **Settings → Pages → Source: main branch / root**

URL: `https://seu-usuario.github.io/studyquest`

---

## ⚙️ Configuração (opcional — para leaderboard)

Veja o [guia completo de setup do Supabase](SETUP.md).

Em resumo:
1. Crie um projeto gratuito em [supabase.com](https://supabase.com)
2. Execute o `supabase-schema.sql` no SQL Editor
3. Cole a Project URL e anon key na tela de configuração do StudyQuest

---

## 🎮 Como usar

1. Abra o site
2. Escolha seu **nome** e **emoji** para o leaderboard
3. Informe a **tecnologia** que vai estudar
4. Cole sua **Anthropic API Key** (para o parser de IA)
5. Cole a **grade do curso** em qualquer formato
6. Clique em **Organizar com IA e começar**

Ou clique em **"Ver demo"** para testar com o curso de OpenTelemetry OTCA.

---

## 🎖 Sistema de Gamificação

| Ação | XP |
|---|---|
| Vídeo concluído | +10 XP |
| Aula hands-on | +20 XP |
| Quiz concluído | +25 XP |
| Módulo 100% | +100 XP |
| Streak 3 dias | +50 XP |
| Streak 7 dias | +150 XP |
| Curso completo | +500 XP |

**15 níveis** · **10+ conquistas especiais** · **4 troféus** (Bronze → Platina)

---

## 🏗️ Estrutura

```
studyquest/
├── index.html            # SPA entry point
├── css/main.css          # Design system
├── js/
│   ├── storage.js        # localStorage + Supabase REST
│   ├── gamification.js   # XP, níveis, badges, conquistas
│   ├── parser.js         # Claude API parser + demo data
│   ├── tracker.js        # Rendering engine
│   └── app.js            # Orquestração
├── supabase-schema.sql   # Schema do banco
├── SETUP.md              # Guia de configuração
└── README.md
```

---

## 📄 Licença

MIT © 2026
