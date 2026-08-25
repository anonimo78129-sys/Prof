# Rinha de Vira-Lata

O conteúdo anterior foi removido para dar lugar a um jogo novo, que não é
educacional: cachorros caramelos brigando estilo Mortal Kombat, em celular
na vertical. A escolha da tecnologia é do zero — não há toolchain ainda.

## Estado atual

Só o design das telas por enquanto, em [`design/layout-mobile.html`](design/layout-mobile.html)
— abra o arquivo direto no navegador. Duas telas:

- **Explorar**: o jogador anda pela cidade, sobe (escada de incêndio,
  medidor de altura na borda) e entra em lugares (porta com prompt
  contextual). Sem botão de ataque — só direção e uma ação que muda de
  sentido pelo que está por perto.
- **Lutar**: tela cheia, corpo a corpo, sem direcional — soco, chute,
  defesa e um especial que carrega. Entra quando um inimigo barra o
  caminho na exploração.

Nenhuma das duas tem lógica de jogo ainda — é HTML/CSS estático mostrando
como cada tela se organiza no formato retrato.

Nada foi perdido: o histórico do git está inteiro, sem reescrita. Para
recuperar qualquer coisa, `git checkout <commit> -- <caminho>`.

## Onde está o que saiu

| Commit / branch | O que tem |
|---|---|
| `c51f5ca` | Os quatro jogos completos: CINZAS, SEMENTE, SILO ALPHA e O POÇO. É o que está publicado em produção neste momento. |
| `167f905` | A casca do aplicativo sem os quatro jogos: tela inicial, chassi de interface em pixel, tema, música, PWA, quiz do professor e créditos. |
| `claude/pokemon-battle-act-6-bn1mbk` | Outro aplicativo, o "Prof. Coruja" com Firebase. História de raiz própria, intacta, sem relação com este. |

Também saíram daqui, e estão em `167f905`: o README do Prof. Corujão, as
configurações do Firebase, as cloud functions, `app/applet/` e a landing
page.

## Atenção antes de publicar

A branch padrão é `claude/code-github-upload-bwr2rm`, e a Vercel publica
produção a cada push nela. Sem `package.json` o build falha, então
publicar este estado derruba `prof-taupe.vercel.app`. Enquanto o jogo
novo não existir, este trabalho fica só na branch de trabalho.
