// ─────────────────────────────────────────────────────────
// Os dois jogos do app. A tela inicial escolhe entre eles.
//
// Cada um cobre um recorte diferente de biologia e usa uma técnica de
// imagem diferente, de propósito: um é ilustração em camadas com
// parallax, o outro é cena 3D gerada por código. Assim dá para comparar
// as duas na prática antes de padronizar.
// ─────────────────────────────────────────────────────────

export interface Jogo {
  id: 'cinzas' | 'silo';
  titulo: string;
  subtitulo: string;
  /** o que o aluno aprende, em uma linha, para a tela de escolha */
  conteudo: string;
  /** frase de chamada, sem entregar a virada */
  chamada: string;
  tecnica: 'ilustracao' | '3d';
}

export const JOGOS: Jogo[] = [
  {
    id: 'cinzas',
    titulo: 'CINZAS',
    subtitulo: 'O ÚLTIMO ABRIGO',
    conteudo: 'Plantas e o mundo vivo',
    chamada: 'A cidade virou mato. O que cresce nas ruínas diz onde há água, onde é seguro e o que se pode comer.',
    tecnica: 'ilustracao',
  },
  {
    id: 'silo',
    titulo: 'SILO ALPHA',
    subtitulo: 'O ÚLTIMO CICLO',
    conteudo: 'Plantas, ar e o ciclo fechado',
    chamada: 'A Dra. Mara foi hospitalizada e o Núcleo Verde está entrando em colapso. As mudas tombam, as folhas amarelam e as flores não dão fruto.',
    tecnica: '3d',
  },
];
