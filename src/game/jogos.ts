// ─────────────────────────────────────────────────────────
// Os jogos do app. A tela inicial escolhe entre eles.
//
// Cada um cobre um recorte diferente de biologia e usa uma técnica de
// imagem diferente, de propósito: um é ilustração em camadas com
// parallax, o outro é cena 3D gerada por código. Assim dá para comparar
// as duas na prática antes de padronizar.
// ─────────────────────────────────────────────────────────

export interface Jogo {
  id: 'cinzas' | 'silo' | 'semente' | 'fonte';
  titulo: string;
  subtitulo: string;
  /** o que o aluno aprende, em uma linha, para a tela de escolha */
  conteudo: string;
  /** frase de chamada, sem entregar a virada */
  chamada: string;
  tecnica: 'ilustracao' | '3d' | 'pixel' | 'plataforma';
}

export const JOGOS: Jogo[] = [
  {
    id: 'fonte',
    titulo: 'A FONTE',
    subtitulo: 'ÁGUA QUE SOBE, ÁGUA QUE VOLTA',
    conteudo: 'Ciclo da água e mudanças de estado, em três estações',
    chamada: 'A fonte que enche três povoados virou um fio, e a aguadeira que subiu a serra atrás da nascente não voltou. As Sentinelas da Ordem só abrem passagem para quem entende a água.',
    tecnica: 'plataforma',
  },
  {
    id: 'semente',
    titulo: 'SEMENTE',
    subtitulo: 'O QUE VOLTA A CRESCER',
    conteudo: 'Biologia de quintal, no mundo depois do Colapso',
    chamada: 'Barro Alto tem cento e onze bocas e uma horta que dá para setenta. Desce a trilha do sul e fala com quem encontrar: quem ficou vivo aprendeu a olhar.',
    tecnica: 'pixel',
  },
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
