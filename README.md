# 💪 Meus Treinos

App pessoal (PWA) para montar rotinas de treino com exercícios, fotos, séries,
repetições e observações. Feito para usar no celular.

**Stack:** React + Vite + SCSS · Supabase (login, banco e fotos) · GitHub Pages.

---

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha com os dados do seu Supabase
npm run dev
```

## Configurar o Supabase (uma vez)

1. Crie um projeto grátis em https://supabase.com.
2. Em **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**
   para o arquivo `.env` (veja `.env.example`).

## Publicar (GitHub Pages)

O deploy é automático a cada `push` na branch `main` (veja
`.github/workflows/deploy.yml`). Basta configurar dois *secrets* no repositório
(**Settings → Secrets and variables → Actions**):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

E ativar o Pages em **Settings → Pages → Source: GitHub Actions**.
