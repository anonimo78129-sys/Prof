import type { MCQuestion } from '../types/game';

// Quem está falando numa caixa de diálogo
export type Speaker = 'narrador' | 'estudante' | 'corujao';

// Cenário/tema visual de fundo
export type SceneBg = 'noite' | 'floresta' | 'clareira' | 'ato3' | 'estufa' | 'pantano' | 'corredor' | 'final';

// Cada "beat" é um passo do roteiro, executado em sequência
export type Beat =
  // Caixa de diálogo: cada string é um "toque para continuar"
  | { t: 'say'; who: Speaker; lines: string[] }
  // Troca o cenário de fundo
  | { t: 'scene'; bg: SceneBg }
  // Transição em fade (com texto opcional centralizado)
  | { t: 'fade'; text?: string }
  // O jogador caminha livremente (← →) dentro do segmento de `dist` px.
  // Se houver `landmark`, ao chegar ao fim aparece o indicador + botão OK
  // para entrar na fase; sem landmark, o OK apenas segue o roteiro.
  | { t: 'walk'; dist: number; hint?: string; landmark?: 'gate' | 'estufa-ext' | 'trunk' | 'computer' }
  // Um objeto surge no caminho e propõe uma pergunta
  | {
      t: 'question';
      intro?: string;          // fala/narração antes da pergunta
      q: MCQuestion;           // a pergunta (vem do GameConfig ou fallback)
      success: string[];       // falas do estudante ao acertar
      hint?: string;           // dica extra do Prof. Corujão ao errar
    }
  // Pareamento: conectar cada item da esquerda à sua definição/função na direita
  | {
      t: 'match';
      intro?: string;
      pairs: Array<{ left: string; right: string }>;
      success: string[];
      hint?: string;
    }
  // Coleta: itens caem na tela, toque apenas nos corretos
  | {
      t: 'collect';
      intro?: string;
      instruction: string;
      items: Array<{ label: string; correct: boolean }>;
      success: string[];
      hint?: string;
    }
  // Sequência: ordene os passos na ordem correta (ex.: ciclo de vida).
  // Cada toque certo acende uma pedra/vitória-régia formando a ponte.
  | {
      t: 'sequence';
      intro?: string;
      instruction: string;
      steps: string[];        // já na ORDEM CORRETA (são embaralhados na tela)
      success: string[];
      hint?: string;
    }
  // Memória (Simon): a floresta pulsa os nós numa sequência crescente,
  // o jogador repete. A cada rodada a sequência aumenta.
  | {
      t: 'memory';
      intro?: string;
      instruction: string;
      nodes: string[];        // rótulos dos nós luminosos (4-5)
      rounds: number;         // nº de rodadas (a sequência cresce a cada uma)
      success: string[];
      hint?: string;
    }
  // Combate estilo Pokémon GBA: o jogador "prova que entende a natureza"
  // usando movimentos botânicos contra a Consciência Verde. Toda a lógica de
  // batalha (moves, inimigo, HP) é hardcoded no componente BattleBeat.
  | {
      t: 'battle';
      intro?: string;
      success: string[];      // falas do estudante ao vencer
      hint?: string;
    }
  // Escolha final: decisão com dois desfechos distintos
  | {
      t: 'choice';
      intro?: string;
      prompt: string;
      options: Array<{
        label: string;
        tone: 'luz' | 'sombra';
        ending: string[];     // epílogo mostrado após a escolha
      }>;
    };

export interface StoryScript {
  beats: Beat[];
}
