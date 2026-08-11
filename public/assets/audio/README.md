# Efeitos sonoros e música do jogo

O sistema de áudio já está **pronto e ligado** no código (`src/game/audio.ts`
para SFX e `src/game/music.ts` para a trilha). Por padrão, CINZAS toca tudo
**sintetizado em 8-bit** (gerado por código, sem nenhum arquivo de áudio) —
isso evita qualquer dúvida de licenciamento e já soa bem no clima do jogo.

Colocar arquivos reais aqui é **opcional**: se você adicionar um `.mp3` com
o nome certo, ele passa a tocar automaticamente no lugar do som sintetizado.

## 🎵 Música de fundo → `music/`

| Arquivo                 | Quando toca                                     |
|--------------------------|-------------------------------------------------|
| `music/home-theme.mp3`  | Em loop na **tela inicial** (com fade in/out)   |
| `music/explore.mp3`     | Em loop durante a jornada pelas ruínas          |
| `music/battle.mp3`      | Reservado para uso futuro (tema de tensão)      |

Sem esses arquivos, toca a trilha sintetizada em modo menor, mais lenta e
sombria — pensada para o clima pós-apocalíptico do jogo.

## 🔊 Efeitos sonoros → `sfx/`

Sons **curtos** (menos de ~2s).

| Arquivo            | Dispara quando                    |
|---------------------|------------------------------------|
| `sfx/select.mp3`   | Escolher uma decisão               |
| `sfx/correct.mp3`  | Acertar um desafio de biologia     |
| `sfx/wrong.mp3`    | Errar um desafio de biologia       |

Você não precisa colocar todos — os que faltarem continuam usando o som
sintetizado. Se optar por arquivos reais, use apenas material com licença
clara para uso comercial (CC0, domínio público, ou licença própria) e
mantenha a atribuição correta na página de créditos do jogo.

## Onde achar efeitos grátis (CC0 / domínio público)

- https://freesound.org
- https://pixabay.com/sound-effects/
- https://opengameart.org

## Ajustes

O volume dos efeitos é controlado por `_volume` em `src/game/audio.ts`.
