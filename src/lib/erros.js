export function traduzErroAuth(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já tem conta. Tente entrar.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('password should be') || m.includes('at least 6')) return 'A senha precisa de pelo menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.'
  if (m.includes('supabaseurl') || m.includes('fetch')) return 'App ainda não conectado ao Supabase.'
  return msg || 'Algo deu errado. Tente de novo.'
}
