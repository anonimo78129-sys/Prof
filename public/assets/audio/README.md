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

Sons **curtos** (menos de ~2s).

| Arquivo            | Dispara quando                    | Origem (pack Watabou)  |
|--------------------|------------------------------------|-------------------------|
| `sfx/tap.mp3`      | Avançar uma fala de diálogo        | `snd_click.mp3`         |
| `sfx/select.mp3`   | Clicar num botão/opção             | `snd_unlock.mp3`        |
| `sfx/correct.mp3`  | Acertar uma pergunta                | `snd_gold.mp3`          |
| `sfx/wrong.mp3`    | Errar uma pergunta                  | `snd_miss.mp3`          |
| `sfx/gate.mp3`     | Portão abrindo / pedra afundando   | `snd_door_open.mp3`     |
| `sfx/walk.mp3`     | Passo do personagem (opcional)     | `snd_step.mp3`          |
| `sfx/attack.mp3`   | Ataque do jogador no combate        | `snd_zap.mp3`           |
| `sfx/hurt.mp3`     | Jogador leva dano no combate        | `snd_hit.mp3`           |
| `sfx/victory.mp3`  | Vencer o combate                    | `snd_levelup.mp3`       |

Você não precisa colocar todos — só os que tiver. Os que faltarem continuam
usando o som sintetizado.

⚠️ **Licença:** estes 9 arquivos vêm do pack "Watabou Pixel Dungeon Sound
Effects" (efeitos do jogo *Pixel Dungeon*, de watabou). O `LICENSE.txt`
incluído no pack é uma cópia da licença do **código-fonte** do jogo
(GPLv3) — não há uma declaração explícita e separada sobre a licença
dos *sons* em si. Confirme os termos de uso reais (ex. na fonte original
de onde o pack foi baixado) antes de publicar o jogo publicamente; se o
pacote for mesmo GPLv3, isso pode exigir que o projeto inteiro seja
distribuído sob a mesma licença.

---

## Onde achar efeitos grátis (CC0 / domínio público)

- https://freesound.org
- https://pixabay.com/sound-effects/
- https://opengameart.org

## Ajustes

O volume dos efeitos é controlado por `_volume` em `src/game/audio.ts`.
