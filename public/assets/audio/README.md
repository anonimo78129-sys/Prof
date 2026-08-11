# Áudio do jogo

O sistema de áudio fica em `src/game/audio.ts` (efeitos) e
`src/game/music.ts` (trilha). Os arquivos abaixo já estão no repositório,
todos com licença livre verificada para uso comercial. A atribuição
detalhada de cada arquivo está nos `CREDITS.txt` de cada pasta e aparece
também na tela de créditos do jogo.

## Música: `music/`

| Arquivo                | Quando toca                          |
|------------------------|--------------------------------------|
| `music/home-theme.mp3` | Em loop na tela inicial, com fade     |
| `music/explore.mp3`    | Em loop durante os capítulos          |

Ambas do Pixabay Music (Licença de Conteúdo Pixabay). Ver
`music/CREDITS.txt`.

## Efeitos: `sfx/`

Efeitos da Kenney (kenney.nl), todos CC0. Ver `sfx/CREDITS.txt` para o
pack de origem de cada arquivo.

CINZAS dispara três deles: `select.mp3` ao escolher, `correct.mp3` ao
acertar um desafio e `wrong.mp3` ao errar. Os demais (`tap`, `gate`,
`walk`, `attack`, `hurt`, `victory`) continuam disponíveis no mapa
`SFX_FILES` de `audio.ts` para uso futuro.

## Sem arquivo, o jogo não fica mudo

Se algum arquivo estiver ausente ou o navegador bloquear a reprodução,
`audio.ts` e `music.ts` caem automaticamente para sons e trilha
sintetizados em 8-bit via WebAudio (Lá menor, 72 BPM). Por isso os
arquivos são substituíveis: basta trocar o `.mp3` mantendo o nome.

Se você trocar algum arquivo, use apenas material com licença clara para
uso comercial e atualize o `CREDITS.txt` correspondente e a lista em
`src/game/credits.ts`.

## Volume

O volume dos efeitos e da trilha respeita o mudo e o controle de volume
da tela de ajustes (`_volume` em `audio.ts`).
