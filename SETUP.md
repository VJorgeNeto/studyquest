# 🛠 Configurando o Supabase para o StudyQuest

> Leva ~5 minutos. Conta gratuita, sem cartão de crédito.

---

## 1. Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) e clique em **Start your project**
2. Crie uma conta (GitHub ou e-mail)
3. Clique em **New project**
4. Escolha um nome (ex: `studyquest`) e uma senha para o banco
5. Aguarde ~2 minutos enquanto o projeto é criado

---

## 2. Criar a tabela

1. No dashboard do projeto, vá em **SQL Editor** → **New query**
2. Cole o conteúdo do arquivo `supabase-schema.sql` que está neste repositório
3. Clique em **Run**
4. Você verá: `Success. No rows returned`

---

## 3. Obter as credenciais

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** — algo como `https://xyzxyz.supabase.co`
   - **anon / public** key — começa com `eyJhbGci...`

> ⚠️ Use apenas a **anon key**. A `service_role` key tem permissões admin e nunca deve ser exposta no browser.

---

## 4. Configurar no StudyQuest

1. Abra o StudyQuest
2. Na tela de configuração, cole a **Project URL** e a **anon key**
3. Clique em **Conectar e continuar**

Pronto! Seu progresso agora é salvo na nuvem e você aparece no leaderboard global.

---

## Dúvidas frequentes

**O leaderboard é público?**
Sim. O nome e emoji que você escolheu, tecnologia, XP e streak ficam visíveis para todos. Progresso detalhado (quais aulas você fez) é salvo mas não exibido no ranking.

**Posso usar um Supabase diferente para cada grupo?**
Sim. Cada instância do StudyQuest com URL/key diferentes tem seu próprio leaderboard separado.

**Como remover meus dados?**
No Supabase Dashboard → Table Editor → `user_progress`, encontre sua linha pelo `user_id` (disponível no `localStorage` do navegador com a chave `studyquest_uid`) e delete.
