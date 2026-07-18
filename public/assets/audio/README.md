# Efeitos sonoros e música do jogo

O sistema de áudio já está **pronto e ligado** no código (`src/game/audio.ts`
para SFX e `src/game/music.ts` para a trilha). Tudo é **opcional**: enquanto
não houver arquivos aqui, o jogo toca os sons **sintetizados em 8-bit**
(gerados por código, estilo chiptune). Assim que você colocar os arquivos com
os nomes abaixo, eles passam a tocar **automaticamente** — não precisa mexer
em código.

## 🎵 Música de fundo → `music/`

| Arquivo                 | Quando toca                                     |
|-------------------------|--------------------------------------------------|
| `music/home-theme.mp3`  | Em loop na **tela inicial** (com fade in/out)   |
| `music/explore.mp3`     | Em loop durante a intro e a exploração do jogo  |
| `music/battle.mp3`      | Em loop durante o **combate** (Consciência Verde) |

`home-theme.mp3`, `explore.mp3` e `battle.mp3` já estão presentes.
`home-theme.mp3` toca assim que a tela inicial abre — ou no primeiro
toque, se o navegador bloquear o autoplay — e some com fade ao sair
para o jogo. `explore.mp3` toca em loop pela intro e pela aventura;
ao entrar em combate, ela pausa suavemente e `battle.mp3` assume,
retomando de onde parou assim que a luta termina. Sem esses arquivos,
o jogo cai de volta no **tema de exploração chiptune** sintetizado
(Dó maior pentatônica, 96 BPM, 8 compassos em loop) — inclusive
durante o combate, se faltar só o `battle.mp3`. Todas as trilhas
respeitam o mudo/volume do jogo.

⚠️ **Licença:** `explore.mp3` traz metadados de uma faixa comercial
(artista "Beau Buckley", gênero "Soundtrack"); `battle.mp3` também
(artista "Trevor Lentz", gênero "Chiptune", título "Pixel River").
Confirme que há licença de uso para ambas antes de publicar o jogo
publicamente.

Formato recomendado: **.mp3** (compatível com todos os navegadores).
Também aceita `.ogg`/`.wav` se você trocar a extensão no mapa `SFX_FILES` do `audio.ts`.

---

## 🔊 Efeitos sonoros  → `sfx/`

**Esta pasta está vazia de propósito.** Os 9 arquivos que estavam aqui vinham
do pack "Watabou Pixel Dungeon Sound Effects", cujo `LICENSE.txt` cobre só o
código-fonte do jogo (GPLv3) — sem declaração separada sobre a licença dos
*sons* em si. Para não carregar esse risco, eles foram removidos.

No lugar deles, todo efeito sonoro do jogo agora é **sintetizado em código**
(`SYNTH_SFX` em `src/game/audio.ts`) — camadas de osciladores e ruído filtrado
compostas na hora, sem depender de nenhum arquivo. É 100% original do
projeto, sem risco de licença, e já é o que toca por padrão.

Sons **curtos** (menos de ~2s).

| Arquivo            | Dispara quando                    |
|--------------------|------------------------------------|
| `sfx/tap.mp3`      | Avançar uma fala de diálogo        |
| `sfx/select.mp3`   | Clicar num botão/opção             |
| `sfx/correct.mp3`  | Acertar uma pergunta                |
| `sfx/wrong.mp3`    | Errar uma pergunta                  |
| `sfx/gate.mp3`     | Portão abrindo / pedra afundando   |
| `sfx/walk.mp3`     | Passo do personagem (opcional)     |
| `sfx/attack.mp3`   | Ataque do jogador no combate        |
| `sfx/hurt.mp3`     | Jogador leva dano no combate        |
| `sfx/victory.mp3`  | Vencer o combate                    |

Se um dia você quiser trocar algum efeito por um arquivo gravado (de uma
fonte com licença **CC0 confirmada**), é só colocar o `.mp3` com o nome acima
nesta pasta — ele passa a tocar automaticamente no lugar do sintetizado, sem
mexer em código.

---

## Onde achar efeitos grátis (CC0 / domínio público)

- https://freesound.org
- https://pixabay.com/sound-effects/
- https://opengameart.org

## Ajustes

O volume dos efeitos é controlado por `_volume` em `src/game/audio.ts`.
