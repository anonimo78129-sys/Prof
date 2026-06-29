# Áudio do jogo — música e efeitos sonoros

O sistema de áudio já está **pronto e ligado** no código (`src/game/audio.ts`).
Tudo é **opcional**: enquanto não houver arquivos aqui, o jogo continua tocando
os sons sintetizados (gerados por código). Assim que você colocar os arquivos
com os nomes abaixo, eles passam a tocar **automaticamente** — não precisa mexer
em código.

Formato recomendado: **.mp3** (compatível com todos os navegadores).
Também aceita `.ogg`/`.wav` se você trocar a extensão nos mapas do `audio.ts`.

---

## 🎵 Música de fundo  → `music/`

Faixas em **loop** (~1 a 3 minutos), trocam com *crossfade* ao mudar de cenário.

| Arquivo                 | Toca em                                  |
|-------------------------|------------------------------------------|
| `music/intro.mp3`       | Tela inicial / noite                     |
| `music/floresta.mp3`    | Floresta, Clareira e Macieira (Atos 1-3) |
| `music/estufa.mp3`      | A Estufa (Ato 4)                         |
| `music/pantano.mp3`     | O Pântano (Ato 5)                        |
| `music/corredor.mp3`    | O Corredor de Luz (Ato 6)               |
| `music/final.mp3`       | O Laboratório Final (Ato 7)             |

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

---

## Onde achar áudio grátis (CC0 / domínio público)

- https://freesound.org
- https://pixabay.com/sound-effects/  e  https://pixabay.com/music/
- https://opengameart.org

## Ajustes finos

No jogo, o botão 🔊/🔇 (canto superior direito) liga/desliga todo o som,
e a preferência fica salva. O volume da música vs. efeitos é controlado por
`TARGET_MUSIC_GAIN` em `src/game/audio.ts`.
