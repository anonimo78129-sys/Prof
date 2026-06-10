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

## Estrutura

```
src/
├── App.tsx        # Aplicação principal (telas, hooks, geração com IA)
├── bncc-data.ts   # Banco local de habilidades BNCC validadas
├── firebase.ts    # Configuração Firebase (Auth, Firestore, Storage, FCM)
├── sw.ts          # Service worker (PWA, notificações push)
└── index.css      # Estilos globais (Tailwind)

functions/         # Cloud Functions (lembretes de aula via FCM)
firestore.rules    # Regras de segurança do Firestore
storage.rules      # Regras de segurança do Storage
```

## Deploy

O app pode ser publicado em **Vercel** (`vercel.json` incluso), **Firebase Hosting** (`firebase.json`) ou qualquer host de site estático servindo o `dist/`.
