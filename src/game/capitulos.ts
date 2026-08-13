// ─────────────────────────────────────────────────────────
// Os capítulos de CINZAS.
//
// Cada capítulo é uma cena: uma ilustração, um bloco de narração e as
// escolhas que levam adiante. O campo `foco` é a posição do recorte
// dentro da ilustração — a janela é uma faixa larga e as artes são
// quadradas ou em retrato, então cada uma precisa dizer que parte da
// composição não pode ser cortada.
// ─────────────────────────────────────────────────────────

export interface Opcao {
  label: string;
  /** id do próximo capítulo, ou null para encerrar */
  proximo: string | null;
}

export interface Capitulo {
  id: string;
  titulo: string;
  marcador: string;
  imagem: string;
  /** object-position do recorte, escolhido para não cortar o essencial */
  foco: string;
  texto: string;
  opcoes: Opcao[];
}

export const CAPITULOS: Record<string, Capitulo> = {
  torre: {
    id: 'torre',
    titulo: 'CINZAS',
    marcador: 'DIA 01',
    imagem: '/assets/cenas/torre.jpg',
    // o cavaleiro fica no terço de baixo; centralizar cortaria ele fora
    foco: 'center 63%',
    texto:
      'A torre continua de pé, e é a única coisa que continua. O musgo subiu ' +
      'pela pedra até onde a chuva alcança e parou numa linha reta, como se ' +
      'alguém tivesse marcado a régua. Você desce do cavalo e olha a porta ' +
      'verde no alto da escadaria. Quem fechou aquela porta fechou por dentro.',
    opcoes: [
      { label: 'Subir a escadaria e testar a porta', proximo: 'arcos' },
      { label: 'Contornar a base e procurar outra entrada', proximo: 'arcos' },
    ],
  },

  arcos: {
    id: 'arcos',
    titulo: 'CINZAS',
    marcador: 'DIA 02',
    imagem: '/assets/cenas/arcos.jpg',
    // o viajante está na borda de baixo, e é ele que dá escala à cena
    foco: 'center 77%',
    texto:
      'Do outro lado dos arcos o capim vai até o joelho e é verde de um jeito ' +
      'que você não vê há anos. No meio dele está caída uma coisa de casco ' +
      'vermelho, grande como uma casa, com a boca aberta virada para cima. ' +
      'O capim mais alto de todo o campo é justamente o que cresce em volta ' +
      'dela. Não é coincidência, e você sabe que não é.',
    opcoes: [
      { label: 'Colher uma amostra do capim que cresce rente ao casco', proximo: null },
      { label: 'Manter distância e seguir pela borda do campo', proximo: null },
    ],
  },
};

export const PRIMEIRO = 'torre';
