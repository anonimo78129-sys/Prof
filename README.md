# 🦉 Prof. Corujão

**Assistente pedagógico completo para professores brasileiros**, da Educação Infantil ao Ensino Médio. Planeje aulas alinhadas à BNCC, gere materiais didáticos com IA, organize sua agenda e crie atividades gamificadas — tudo em um só lugar.

## Funcionalidades

### 📚 Planejador
- **Planos de aula** completos e alinhados à BNCC (com códigos de habilidades reais validados localmente)
- **Slides profissionais** com 11 layouts, exportação para PowerPoint (.pptx)
- **Atividades e provas** com gabarito, exportação para Word (.docx) e PDF
- Adaptação automática por **nível de ensino** (Ed. Infantil, Fundamental, Médio, EJA) — incluindo Campos de Experiências da BNCC-EI para a Educação Infantil

### 🎮 Estúdio
- **Sequência Didática** — passo a passo com etapas, diferenciação/inclusão e avaliação formativa
- **Flashcards** — cartões de revisão frente e verso para imprimir
- **Escape Room** educacional com 4 ambientações temáticas
- Storytelling gamificado, Quiz, Caça-Palavras, Palavras Cruzadas, Bingo e Jogo da Memória
- Tudo pronto para imprimir em A4

### 🕹️ Jogos narrativos
Quatro jogos completos na tela inicial, cada um com uma técnica de imagem diferente:

| Jogo | Do que trata | Técnica |
|---|---|---|
| **O POÇO** — Quem desce, sobe outro | Terror rural · três descidas e dois fins | Plataforma 2D em canvas, com criador de personagem |
| **SEMENTE** — O que volta a crescer | Biologia de quintal no mundo depois do Colapso | Grade vista de cima, tiles de 16px |
| **CINZAS** — O último abrigo | Plantas e o mundo vivo | Ilustração em camadas com parallax |
| **SILO ALPHA** — O último ciclo | Plantas, ar e o ciclo fechado | Cena 3D (Three.js) |

**O POÇO** é o único que não é de conteúdo escolar. Água Preta tem um poço que
nunca secou, e todo inverno alguém desce a corda para limpar o fundo — este ano
saiu o nome da sua irmã. São três descidas guardadas por nove paradas com as
Vigias, que não fazem prova: fazem pergunta, e a resposta que abre a passagem
está sempre dita por elas ou plantada no cenário. Errar custa uma flecha e a
pergunta volta. O fim tem duas saídas, e o jogo não avisa qual é qual.

Abre com um criador de personagem de mais de 250 peças (pele, cabelo, orelhas,
roupa em três casas, braços, chapéu, máscara e item de mão), com cão ou raposa
de companhia. É jogado deitado, em tela cheia.

### 🏆 Turma Gamificada
- **Pontos e níveis** com avatares corujinha que evoluem (🥚 → 👑), medalhas automáticas e sequências de dias
- **Equipes** com ranking semanal, **missões coletivas** e **loja de privilégios** (moedas 🪙 trocadas por recompensas sem custo)
- **Temporadas** por bimestre com Hall da Fama
- **Kit ao Vivo** para usar na aula com projetor ou só com o celular do professor: sorteador justo, timer com coruja, gerador de grupos com regras de separação, medidor de barulho (microfone do celular), semáforo, dado, placar, evento do dia, contador de participação e **Batalha de Revisão** (quiz oral por equipes gerado por IA — sem precisar de celular dos alunos)
- **Modo Projetor** com missão, pódio de equipes e destaques da semana

### 🧰 Kit do Professor
- **Parecer descritivo** individual para o boletim, por período e com tom configurável
- **Adaptação inclusiva** de atividades (TEA, TDAH, dislexia, baixa visão, surdez e mais), com base no DUA
- **Rubrica de avaliação** em tabela pronta para imprimir
- **Nivelador de texto** para o nível de leitura da turma, com glossário e perguntas
- **Comunicação com famílias**: bilhetes, comunicados e mensagens com envio direto pelo WhatsApp
- **Material de vídeo**: a IA assiste a um vídeo do YouTube e gera roteiro de aula, resumo, atividade ou debate
- **Material do meu PDF**: atividades, provas e planos gerados a partir do livro/apostila do professor
- **Diário de classe**: chamada P/F/A com um toque, notas, anotações do dia e impressão — lista de alunos compartilhada com a gamificação

### 💬 Assistente
- Chat pedagógico com contexto das suas turmas e agenda
- Apoio em **gestão de sala**, **inclusão** (TDAH, TEA, dislexia), comunicação com famílias e dúvidas de conteúdo
- Controla o app por comando: agenda aulas, gera materiais, navega entre telas

### 📅 Agenda
- Turmas com horários por dia da semana
- Notificações push ~30 min antes da aula
- Importação de calendário escolar (Excel/PDF)
- Feriados nacionais e datas comemorativas

### 📂 Histórico e Biblioteca
- Busca e filtro nos materiais gerados
- Reimpressão em PDF de planos, atividades e provas
- Biblioteca compartilhada com materiais prontos

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 · TypeScript · Tailwind CSS 4 · Vite · Motion |
| IA | Google Gemini 2.5 Flash (`@google/genai`) |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions, FCM) |
| Exportação | pptxgenjs (PowerPoint) · docx (Word) · impressão nativa (PDF) |
| PWA | vite-plugin-pwa · Workbox |

## Rodando localmente

**Pré-requisitos:** Node.js 20+

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com sua GEMINI_API_KEY (obrigatória)
# e PIXABAY_API_KEY (opcional, para imagens nos slides)

# 3. Rode em desenvolvimento
npm run dev

# Build de produção
npm run build

# Verificação de tipos
npm run lint
```

### Arte de O POÇO

Os sprites vêm de pacotes de pixel art do GandalfHardcore, cuja licença permite
uso em jogo mas proíbe redistribuir os pacotes. Por isso o repositório guarda só
o recorte que o jogo carrega, já renomeado e com os atlas de miniatura do criador
de personagem. Para reimportar a partir dos pacotes originais descompactados:

```bash
node scripts/gen-poco.mjs --src <pasta com os pacotes>
```

O script grava em `public/assets/poco/` e regenera `src/game/pocoCatalogo.ts`.

A arte dos pacotes é de dia claro — céu azul, maçã vermelha, capim verde. O jogo
não repinta nada: cada quadro leva uma demão de cor por cima (drena a saturação,
multiplica por uma cor, escurece as bordas) e a última fase ganha uma lanterna em
volta do jogador. É por isso que o mesmo cenário serve para um povoado ao sol e
para o fundo de um poço.

## Estrutura

```
src/
├── App.tsx        # Aplicação principal (telas, hooks, geração com IA)
├── bncc-data.ts   # Banco local de habilidades BNCC validadas
├── firebase.ts    # Configuração Firebase (Auth, Firestore, Storage, FCM)
├── sw.ts          # Service worker (PWA, notificações push)
├── index.css      # Estilos globais (Tailwind)
├── game/          # Conteúdo dos jogos (roteiro, mapas, escolhas, créditos)
└── components/Shell/   # Motores: plataforma (Bosque), grade (Semente), 3D (Silo)

functions/         # Cloud Functions (lembretes de aula via FCM)
firestore.rules    # Regras de segurança do Firestore
storage.rules      # Regras de segurança do Storage
```

## Deploy

O app pode ser publicado em **Vercel** (`vercel.json` incluso), **Firebase Hosting** (`firebase.json`) ou qualquer host de site estático servindo o `dist/`.
