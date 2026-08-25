// ─────────────────────────────────────────────────────────
// O catálogo de jogos do app. A tela inicial percorre esta lista.
//
// Está vazia de propósito: os quatro jogos educacionais foram removidos
// e o jogo novo ainda não existe. O que sobra aqui é o encaixe — a tela
// inicial, o chassi de interface e o carregamento sob demanda continuam
// de pé, esperando a primeira entrada.
//
// Para plugar um jogo: acrescente uma entrada abaixo, ponha o id no tipo
// `View` de App.tsx e o componente no `lazy()` ao lado dos outros.
// ─────────────────────────────────────────────────────────

export interface Jogo {
  id: string;
  titulo: string;
  subtitulo: string;
  /** frase de chamada, sem entregar a virada */
  chamada: string;
  /** linha curta de rodapé no cartão: gênero, duração, o que for */
  conteudo: string;
  /** imagem de capa, se houver; sem ela o cartão desenha um padrão */
  capa?: string;
  /** enquadramento da capa dentro do cartão */
  foco?: string;
}

export const JOGOS: Jogo[] = [];
