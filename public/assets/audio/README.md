# Efeitos sonoros e música do jogo

O sistema de áudio já está **pronto e ligado** no código (`src/game/audio.ts`
para SFX e `src/game/music.ts` para a trilha). Tudo é **opcional**: enquanto
não houver arquivos aqui, o jogo toca os sons **sintetizados em 8-bit**
(gerados por código, estilo chiptune). Assim que você colocar os arquivos com
os nomes abaixo, eles passam a tocar **automaticamente** — não precisa mexer
em código.

## 🎵 Música de fundo → `music/`

| Arquivo              | Quando toca                                      |
|----------------------|--------------------------------------------------|
| `music/explore.mp3`  | Em loop durante toda a aventura (intro + jogo)   |

Sem o arquivo, toca o **tema de exploração chiptune** sintetizado
(Dó maior pentatônica, 96 BPM, 8 compassos em loop — melodia quadrada,
baixo triangular, pad e eco). A trilha respeita o mudo/volume do jogo.

Formato recomendado: **.mp3** (compatível com todos os navegadores).
Também aceita `.ogg`/`.wav` se você trocar a extensão no mapa `SFX_FILES` do `audio.ts`.

---

## 🔊 Efeitos sonoros  → `sfx/`

Sons **curtos** (menos de ~2s).

| Arquivo            | Dispara quando                          |
|--------------------|-----------------------------------------|
| `sfx/tap.mp3`      | Avançar uma fala de diálogo             |
| `sfx/select.mp3`   | Clicar num botão/opção                   |
| `sfx/correct.mp3`  | Acertar uma pergunta                     |
| `sfx/wrong.mp3`    | Errar uma pergunta                       |
| `sfx/gate.mp3`     | Portão abrindo / pedra afundando        |
| `sfx/walk.mp3`     | Passo do personagem (opcional)          |
| `sfx/attack.mp3`   | Ataque do jogador no combate            |
| `sfx/hurt.mp3`     | Jogador leva dano no combate            |
| `sfx/victory.mp3`  | Vencer o combate                        |

Você não precisa colocar todos — só os que tiver. Os que faltarem continuam
usando o som sintetizado.

---

## Onde achar efeitos grátis (CC0 / domínio público)

- https://freesound.org
- https://pixabay.com/sound-effects/
- https://opengameart.org

## Ajustes

O volume dos efeitos é controlado por `_volume` em `src/game/audio.ts`.
