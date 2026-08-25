# Rinha de Vira-Lata

Jogo de plataforma 2D em celular na vertical: um vira-lata caramelo anda
pela rua, sobe em toldo, muro e laje, e briga com os inimigos que
aparecem no caminho — no mesmo cenário em que anda, sem corte para uma
tela de luta separada.

## Estado atual

Só o design da tela de jogo, em [`design/index.html`](design/index.html).
Não há lógica de jogo: os botões não fazem nada e os caramelos só
respiram. É uma tela parada mostrando como o jogo se organiza no formato
retrato.

Publicado em <https://prof-taupe.vercel.app>.

Três faixas, e nada além delas — sem legenda, sem texto explicativo:

- **Placar**, em cima: retrato, corações, a fase, a barra de vida do
  jogador e a contagem de ossos. A vida do inimigo não fica aqui: ela
  flutua sobre a cabeça dele, dentro da cena.
- **Cenário**, no meio: desenhado em canvas, pixel a pixel. A rota de
  subida vai da calçada até a laje da caixa d'água — toldo da loja,
  laje do sobradinho, muro do terreno, ar-condicionado na parede.
- **Controle**, embaixo: direcional e quatro botões — soco, chute,
  especial e pulo.

## Como rodar

```
npm install
npm run dev
```

O Vite usa `design/` como raiz e gera em `dist/`. É o mesmo comando que
a Vercel roda.

### Pixel quadrado

A cena é autorada com 200 de largura. A altura do canvas é calculada da
proporção real da caixa na tela, e as posições são medidas a partir do
chão, não do topo. Assim o pixel nunca estica, o chão fica colado
embaixo e o que varia entre um celular e outro é só quanto céu existe
entre o horizonte e a rua.

## Onde está o que saiu daqui

O conteúdo anterior — um aplicativo educacional — foi removido para dar
lugar a este jogo. Nada foi perdido: o histórico do git está inteiro,
sem reescrita. Para recuperar qualquer coisa,
`git checkout <commit> -- <caminho>`.

| Commit / branch | O que tem |
|---|---|
| `c51f5ca` | Os quatro jogos completos: CINZAS, SEMENTE, SILO ALPHA e O POÇO. |
| `167f905` | A casca do aplicativo sem os quatro jogos: tela inicial, chassi de interface em pixel, tema, música, PWA, quiz do professor e créditos. Também o Firebase, as cloud functions, `app/applet/` e a landing page. |
| `claude/pokemon-battle-act-6-bn1mbk` | Outro aplicativo, o "Prof. Coruja" com Firebase. História de raiz própria, intacta, sem relação com este. |
