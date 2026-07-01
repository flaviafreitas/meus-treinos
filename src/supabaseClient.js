import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Aviso amigável em dev caso o .env ainda não esteja preenchido.
if (!url || !anonKey) {
  console.warn(
    '[Meus Treinos] Supabase não configurado. Preencha VITE_SUPABASE_URL e ' +
      'VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')

// Nome do bucket de fotos no Supabase Storage.
export const FOTOS_BUCKET = 'fotos'
