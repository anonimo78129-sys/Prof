# Efeitos sonoros do jogo

O sistema de áudio já está **pronto e ligado** no código (`src/game/audio.ts`).
Tudo é **opcional**: enquanto não houver arquivos aqui, o jogo continua tocando
os sons sintetizados (gerados por código). Assim que você colocar os arquivos
com os nomes abaixo, eles passam a tocar **automaticamente** — não precisa mexer
em código.

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
