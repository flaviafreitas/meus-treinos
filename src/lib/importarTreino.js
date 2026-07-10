import { supabase } from '../supabaseClient'
import biblioteca from '../data/exercicios.json'

// Texto pronto para a pessoa colar no ChatGPT (ou qualquer IA de chat grátis).
// A IA conversa normalmente e, no fim, devolve o treino no formato que o app lê.
export const PROMPT_IA = `Você é meu personal trainer. Vamos conversar sobre o treino que eu quero (objetivo, dias por semana, equipamentos que tenho, lesões, etc). Pode me fazer perguntas.

Quando eu disser "pode montar", sua resposta final deve conter APENAS um bloco de código JSON (nada de texto fora do bloco), exatamente neste formato:

\`\`\`json
{
  "rotinas": [
    {
      "nome": "Treino A - Peito e tríceps",
      "exercicios": [
        { "nome": "Supino reto com barra", "series": 4, "repeticoes": "8-12", "observacoes": "descanso de 90s" },
        { "nome": "Tríceps na polia", "series": 3, "repeticoes": "12-15", "observacoes": "" }
      ]
    }
  ]
}
\`\`\`

Regras do JSON:
- "nome" da rotina e de cada exercício são obrigatórios.
- "series" é um número inteiro (ou null se não se aplica).
- "repeticoes" é texto (pode ser uma faixa como "8-12" ou algo como "até a falha").
- "observacoes" é um texto curto (pode ser "").
- IMPORTANTE (para o app achar a foto): use nos exercícios EXATAMENTE os nomes da "Lista de exercícios disponíveis" que está no fim desta mensagem. Não invente, não traduza e não altere os nomes. Se não houver um nome exato, escolha o mais próximo que exista na lista.
- Não adicione fotos, comentários ou campos além dos mostrados acima.`

// Lista de nomes disponíveis, agrupada por grupo muscular, para embutir no prompt.
const listaExercicios = (() => {
  const grupos = {}
  for (const e of biblioteca) (grupos[e.grupo] ??= []).push(e.nome)
  return Object.keys(grupos)
    .sort((a, b) => a.localeCompare(b, 'pt'))
    .map((g) => `== ${g} ==\n${grupos[g].sort((a, b) => a.localeCompare(b, 'pt')).join('\n')}`)
    .join('\n\n')
})()

// Prompt pronto para copiar: instrução + a lista de exercícios que o app conhece.
// Assim o ChatGPT só usa nomes que existem e a foto casa sempre.
export const PROMPT_COMPLETO = `${PROMPT_IA}

--- Lista de exercícios disponíveis (use EXATAMENTE estes nomes) ---
${listaExercicios}`

// Remove acentos e normaliza para comparar nomes de exercícios.
function normalizar(texto) {
  return (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Índice de nome normalizado -> URL da imagem, montado uma única vez.
const indiceFotos = biblioteca.map((e) => ({ chave: normalizar(e.nome), imagem: e.imagem }))

// Tenta achar a foto da biblioteca que melhor casa com o nome do exercício.
export function casarFoto(nome) {
  const alvo = normalizar(nome)
  if (!alvo) return null
  const exato = indiceFotos.find((e) => e.chave === alvo)
  if (exato) return exato.imagem
  const contem = indiceFotos.find((e) => e.chave.includes(alvo) || alvo.includes(e.chave))
  return contem ? contem.imagem : null
}

// Extrai o JSON de dentro da resposta da IA, mesmo que venha com texto ao redor
// ou dentro de um bloco de código markdown (```json ... ```).
function extrairJson(texto) {
  if (!texto || !texto.trim()) {
    throw new Error('Cole aqui a resposta que o ChatGPT te deu.')
  }
  let t = texto.trim()

  // Se veio dentro de um bloco de código, pega só o conteúdo do bloco.
  const bloco = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (bloco) t = bloco[1].trim()

  // Caso ainda haja texto solto antes/depois, recorta do primeiro { ao último }.
  const ini = t.indexOf('{')
  const fim = t.lastIndexOf('}')
  if (ini !== -1 && fim !== -1 && fim > ini) t = t.slice(ini, fim + 1)

  try {
    return JSON.parse(t)
  } catch {
    throw new Error('Não consegui ler o treino. Confira se você colou a resposta completa (o bloco que começa com { e termina com }).')
  }
}

function normalizarSeries(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function textoOuNulo(valor) {
  const s = (valor ?? '').toString().trim()
  return s || null
}

// Recebe o texto colado e devolve uma lista de rotinas já validadas e limpas.
// Aceita { rotinas: [...] }, um array de rotinas, ou uma única rotina.
export function analisarTexto(texto) {
  const dados = extrairJson(texto)

  let rotinasBrutas
  if (Array.isArray(dados)) rotinasBrutas = dados
  else if (Array.isArray(dados?.rotinas)) rotinasBrutas = dados.rotinas
  else if (dados?.nome) rotinasBrutas = [dados]
  else throw new Error('Não encontrei nenhuma rotina no texto colado.')

  const rotinas = rotinasBrutas
    .map((r) => {
      const nome = textoOuNulo(r?.nome)
      if (!nome) return null
      const exercicios = (Array.isArray(r?.exercicios) ? r.exercicios : [])
        .map((ex) => {
          const nomeEx = textoOuNulo(ex?.nome)
          if (!nomeEx) return null
          return {
            nome: nomeEx,
            series: normalizarSeries(ex?.series),
            repeticoes: textoOuNulo(ex?.repeticoes),
            observacoes: textoOuNulo(ex?.observacoes),
          }
        })
        .filter(Boolean)
      return { nome, exercicios }
    })
    .filter(Boolean)

  if (rotinas.length === 0) throw new Error('Não encontrei nenhuma rotina válida no texto colado.')
  return rotinas
}

// Insere as rotinas e seus exercícios no Supabase, casando as fotos pelo nome.
// Retorna um resumo { rotinas, exercicios } com o que foi criado.
export async function importarRotinas(rotinas, userId) {
  let totalExercicios = 0

  for (const rotina of rotinas) {
    const { data: rotinaCriada, error: erroRotina } = await supabase
      .from('rotinas')
      .insert({ nome: rotina.nome, user_id: userId })
      .select('id')
      .single()
    if (erroRotina) throw new Error(`Erro ao criar a rotina "${rotina.nome}": ${erroRotina.message}`)

    if (rotina.exercicios.length > 0) {
      const linhas = rotina.exercicios.map((ex) => ({
        rotina_id: rotinaCriada.id,
        user_id: userId,
        nome: ex.nome,
        series: ex.series,
        repeticoes: ex.repeticoes,
        observacoes: ex.observacoes,
        foto_url: casarFoto(ex.nome),
      }))
      const { error: erroEx } = await supabase.from('exercicios').insert(linhas)
      if (erroEx) throw new Error(`Erro ao adicionar exercícios em "${rotina.nome}": ${erroEx.message}`)
      totalExercicios += linhas.length
    }
  }

  return { rotinas: rotinas.length, exercicios: totalExercicios }
}
