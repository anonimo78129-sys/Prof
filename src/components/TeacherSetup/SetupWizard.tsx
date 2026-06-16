import { useState } from 'react';
import type { GameConfig, GameStory, MCQuestion, MatchPair } from '../../types/game';
import { DEFAULT_NARRATIVE_CHOICES } from '../../data/narrative';
import { hasApiKey, saveApiKey, resolveApiKey } from '../../ai/gemini';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface Props {
  onGameCreated: (config: GameConfig) => void;
}

type Mode = 'input' | 'generating' | 'review';

function uid() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}
function emptyQ(): MCQuestion {
  return { text: '', options: ['', '', '', ''], correct: 0 };
}
function emptyPair(): MatchPair {
  return { concept: '', definition: '' };
}

const LEVELS = ['Ensino Fundamental I', 'Ensino Fundamental II', 'Ensino Médio', 'Ensino Superior'];

const GEN_MESSAGES = [
  'Consultando os guardiões do Éter...',
  'Transformando seu conteúdo em desafios...',
  'Criando perguntas e enigmas...',
  'Adaptando a história à sua disciplina...',
  'Equilibrando as batalhas...',
];

export default function SetupWizard({ onGameCreated }: Props) {
  const [mode, setMode] = useState<Mode>('input');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState(LEVELS[1]);
  const [apiKey, setApiKeyState] = useState(resolveApiKey());
  const [genMsg, setGenMsg] = useState(GEN_MESSAGES[0]);

  const [story, setStory] = useState<GameStory | undefined>(undefined);
  const [narratives, setNarratives] = useState({
    forest: DEFAULT_NARRATIVE_CHOICES.forest,
    city: DEFAULT_NARRATIVE_CHOICES.city,
    caves: DEFAULT_NARRATIVE_CHOICES.caves,
  });
  const [forestQs, setForestQs] = useState<MCQuestion[]>([emptyQ(), emptyQ(), emptyQ()]);
  const [cityPairs, setCityPairs] = useState<MatchPair[]>([emptyPair(), emptyPair(), emptyPair(), emptyPair()]);
  const [cavesQs, setCavesQs] = useState<MCQuestion[]>([emptyQ(), emptyQ(), emptyQ(), emptyQ(), emptyQ()]);
  const [towerQs, setTowerQs] = useState<MCQuestion[]>([emptyQ(), emptyQ(), emptyQ()]);

  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const keyAvailable = hasApiKey() || apiKey.trim().length > 10;

  const handleGenerate = async () => {
    if (!subject.trim()) { setError('Digite o conteúdo/assunto da aula.'); return; }
    if (apiKey.trim()) saveApiKey(apiKey.trim());
    if (!keyAvailable) { setError('Cole uma chave do Google Gemini para a IA gerar o jogo (ou crie manualmente).'); return; }

    setError('');
    setMode('generating');
    let i = 0;
    const ticker = setInterval(() => { i = (i + 1) % GEN_MESSAGES.length; setGenMsg(GEN_MESSAGES[i]); }, 1600);

    try {
      const { generateGame } = await import('../../ai/generateGame');
      const { config, warnings } = await generateGame(subject, level);
      clearInterval(ticker);
      setStory(config.story);
      setNarratives({
        forest: config.scenes.forest.narrative,
        city: config.scenes.city.narrative,
        caves: config.scenes.caves.narrative,
      });
      setForestQs(config.scenes.forest.questions.length ? config.scenes.forest.questions : [emptyQ(), emptyQ(), emptyQ()]);
      setCityPairs(config.scenes.city.pairs.length ? config.scenes.city.pairs : [emptyPair(), emptyPair(), emptyPair(), emptyPair()]);
      setCavesQs(config.scenes.caves.questions.length ? config.scenes.caves.questions : [emptyQ(), emptyQ(), emptyQ(), emptyQ(), emptyQ()]);
      setTowerQs(config.scenes.tower.questions.length ? config.scenes.tower.questions : [emptyQ(), emptyQ(), emptyQ()]);
      setWarnings(warnings);
      setMode('review');
    } catch (e) {
      clearInterval(ticker);
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'NO_API_KEY') setError('Chave da IA não configurada.');
      else if (msg === 'PARSE_ERROR') setError('A IA retornou um formato inesperado. Tente gerar novamente.');
      else setError('Não foi possível gerar agora. Verifique a chave/conexão e tente de novo.');
      setMode('input');
    }
  };

  const handleManual = () => {
    setStory(undefined);
    setWarnings([]);
    setMode('review');
  };

  const handleSave = async () => {
    if (!subject.trim()) { setError('Informe o conteúdo da aula.'); return; }
    setSaving(true);
    setError('');
    const id = uid();
    const config: GameConfig = {
      id,
      subject: subject.trim(),
      level,
      createdAt: Date.now(),
      story,
      scenes: {
        forest: { questions: forestQs, narrative: narratives.forest },
        city: { pairs: cityPairs, narrative: narratives.city },
        caves: { questions: cavesQs, narrative: narratives.caves },
        tower: { questions: towerQs },
      },
      assets: {},
    };
    try {
      await setDoc(doc(db, 'games', id), config);
      onGameCreated(config);
    } catch {
      setError('Erro ao salvar. Verifique a conexão.');
      setSaving(false);
    }
  };

  const updateQ = (
    setter: React.Dispatch<React.SetStateAction<MCQuestion[]>>,
    idx: number,
    field: 'text' | 'correct' | 'opt0' | 'opt1' | 'opt2' | 'opt3',
    value: string | number,
  ) => {
    setter(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      if (field === 'text') return { ...q, text: value as string };
      if (field === 'correct') return { ...q, correct: value as 0 | 1 | 2 | 3 };
      const optIdx = parseInt(field[3]);
      const opts = [...q.options] as [string, string, string, string];
      opts[optIdx] = value as string;
      return { ...q, options: opts };
    }));
  };
  const updatePair = (idx: number, field: 'concept' | 'definition', value: string) => {
    setCityPairs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const QEditor = ({ questions, setter, label }: {
    questions: MCQuestion[];
    setter: React.Dispatch<React.SetStateAction<MCQuestion[]>>;
    label: string;
  }) => (
    <div className="flex flex-col gap-4">
      <p className="font-pixel" style={{ color: '#9f7aea', fontSize: 7 }}>{label}</p>
      {questions.map((q, idx) => (
        <div key={idx} style={{ background: '#0a0a1a', border: '2px solid #2a2350', padding: 12 }}>
          <p className="font-vt mb-2" style={{ color: '#ffc800', fontSize: 16 }}>Pergunta {idx + 1}</p>
          <textarea
            value={q.text}
            onChange={e => updateQ(setter, idx, 'text', e.target.value)}
            placeholder="Digite a pergunta..."
            rows={2}
            style={{ width: '100%', background: '#050518', border: '1px solid #333', color: '#fff', padding: 8, fontSize: 14, fontFamily: 'sans-serif', resize: 'none' }}
          />
          <div className="flex flex-col gap-1 mt-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  onClick={() => updateQ(setter, idx, 'correct', oi)}
                  style={{ width: 24, height: 24, background: q.correct === oi ? '#00ff88' : '#222', border: `2px solid ${q.correct === oi ? '#00ff88' : '#444'}`, cursor: 'pointer', flexShrink: 0 }}
                  title="Marcar como correta"
                />
                <span className="font-pixel text-gray-400 flex-shrink-0" style={{ fontSize: 8, width: 12 }}>{String.fromCharCode(65 + oi)}</span>
                <input
                  value={opt}
                  onChange={e => updateQ(setter, idx, `opt${oi}` as 'opt0', e.target.value)}
                  placeholder={`Opção ${String.fromCharCode(65 + oi)}`}
                  style={{ flex: 1, background: '#050518', border: '1px solid #333', color: '#fff', padding: '4px 8px', fontSize: 14 }}
                />
              </div>
            ))}
          </div>
          <p className="font-vt mt-1" style={{ color: '#00ff88', fontSize: 14 }}>✓ Correta: {String.fromCharCode(65 + q.correct)}</p>
        </div>
      ))}
    </div>
  );

  // ───────────────── INPUT ─────────────────
  if (mode === 'input') {
    return (
      <div className="fixed inset-0 bg-[#050518] overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-8 pb-16">
          <div className="text-center mb-8">
            <h1 className="font-pixel text-white" style={{ fontSize: 14, lineHeight: 2, textShadow: '0 0 16px #7c3aed' }}>ÉTER</h1>
            <p className="font-vt text-gray-400" style={{ fontSize: 18 }}>Crie a Jornada da sua aula</p>
          </div>

          <div className="panel-pixel p-5" style={{ background: '#0a0820', borderColor: '#2a2350' }}>
            <label className="font-pixel block mb-2" style={{ color: '#ffc800', fontSize: 8 }}>📚 CONTEÚDO DA AULA</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Fotossíntese, Revolução Francesa, Frações..."
              style={{ width: '100%', background: '#050518', border: '2px solid #ffc800', color: '#fff', padding: '12px 14px', fontSize: 16, fontFamily: 'sans-serif' }}
              autoFocus
            />

            <label className="font-pixel block mt-5 mb-2" style={{ color: '#9f7aea', fontSize: 8 }}>🎓 NÍVEL DOS ALUNOS</label>
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className="font-vt py-2 px-2"
                  style={{ background: level === l ? '#7c3aed' : '#14102a', color: level === l ? '#fff' : '#9f7aea', border: `2px solid ${level === l ? '#a855f7' : '#2a2350'}`, fontSize: 15, cursor: 'pointer' }}
                >
                  {l}
                </button>
              ))}
            </div>

            {!hasApiKey() && (
              <div className="mt-5">
                <label className="font-pixel block mb-2" style={{ color: '#888', fontSize: 7 }}>🔑 CHAVE GEMINI (grátis em aistudio.google.com/apikey)</label>
                <input
                  value={apiKey}
                  onChange={e => setApiKeyState(e.target.value)}
                  placeholder="Cole sua chave da IA aqui..."
                  type="password"
                  style={{ width: '100%', background: '#050518', border: '1px solid #333', color: '#fff', padding: '8px 12px', fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>
            )}

            {error && <p className="font-vt mt-4" style={{ color: '#ff5577', fontSize: 16 }}>{error}</p>}
          </div>

          <button
            onClick={handleGenerate}
            className="btn-pixel w-full py-4 mt-5"
            style={{ background: '#00ff88', color: '#000', fontSize: 10 }}
          >
            ✨ GERAR JOGO COM IA
          </button>
          <p className="font-vt text-center mt-2" style={{ color: '#6d5a9c', fontSize: 14 }}>
            A IA cria as perguntas, os enigmas e a história sobre o seu conteúdo.
          </p>

          <button
            onClick={handleManual}
            className="font-vt w-full mt-5"
            style={{ background: 'none', border: '1px solid #2a2350', color: '#7c6aad', padding: '10px', fontSize: 15, cursor: 'pointer' }}
          >
            ✏️ Prefiro montar manualmente
          </button>
        </div>
      </div>
    );
  }

  // ───────────────── GENERATING ─────────────────
  if (mode === 'generating') {
    return (
      <div className="fixed inset-0 bg-[#050518] flex flex-col items-center justify-center gap-6 px-6">
        <div className="portal-spin" style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #7c3aed', boxShadow: '0 0 30px #7c3aed, inset 0 0 30px rgba(124,58,237,0.4)' }} />
        <p className="font-pixel text-center text-white" style={{ fontSize: 9, lineHeight: 2 }}>GERANDO SUA JORNADA</p>
        <p className="font-vt text-center" style={{ color: '#9f7aea', fontSize: 19, minHeight: 26 }}>{genMsg}</p>
        <p className="font-vt text-center" style={{ color: '#555', fontSize: 14 }}>Pode levar alguns segundos...</p>
      </div>
    );
  }

  // ───────────────── REVIEW ─────────────────
  return (
    <div className="fixed inset-0 bg-[#050518] overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 pb-28">
        <div className="text-center mb-4">
          <h1 className="font-pixel text-white" style={{ fontSize: 10, lineHeight: 2 }}>REVISÃO</h1>
          <p className="font-vt" style={{ color: '#9f7aea', fontSize: 17 }}>{subject} · {level}</p>
          <p className="font-vt" style={{ color: '#6d5a9c', fontSize: 14 }}>Edite o que quiser e crie o jogo.</p>
        </div>

        {story?.hook && (
          <div className="dialog-rpg p-3 mb-4" style={{ borderColor: '#a855f7' }}>
            <p className="font-pixel mb-1" style={{ color: '#a855f7', fontSize: 6 }}>✦ HISTÓRIA (IA)</p>
            <p className="font-vt text-white" style={{ fontSize: 16 }}>{story.hook}</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4 p-3" style={{ background: '#2a1a00', border: '1px solid #aa7700' }}>
            {warnings.map((w, i) => (
              <p key={i} className="font-vt" style={{ color: '#ffb84d', fontSize: 14 }}>⚠ {w} Você pode completar abaixo.</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-7">
          <QEditor questions={forestQs} setter={setForestQs} label="🌲 FLORESTA — 3 PERGUNTAS" />

          <div className="flex flex-col gap-3">
            <p className="font-pixel" style={{ color: '#9f7aea', fontSize: 7 }}>🏙️ CIDADE — 4 PARES (CONCEITO ↔ DEFINIÇÃO)</p>
            {cityPairs.map((pair, idx) => (
              <div key={idx} style={{ background: '#0a0a1a', border: '2px solid #2a2350', padding: 12 }}>
                <p className="font-vt mb-2" style={{ color: '#ffc800', fontSize: 16 }}>Par {idx + 1}</p>
                <input value={pair.concept} onChange={e => updatePair(idx, 'concept', e.target.value)} placeholder="Conceito" style={{ width: '100%', background: '#050518', border: '1px solid #333', color: '#fff', padding: '6px 10px', fontSize: 14, marginBottom: 6 }} />
                <input value={pair.definition} onChange={e => updatePair(idx, 'definition', e.target.value)} placeholder="Definição" style={{ width: '100%', background: '#050518', border: '1px solid #333', color: '#fff', padding: '6px 10px', fontSize: 14 }} />
              </div>
            ))}
          </div>

          <QEditor questions={cavesQs} setter={setCavesQs} label="💎 CAVERNAS — 5 PERGUNTAS" />
          <QEditor questions={towerQs} setter={setTowerQs} label="👑 TORRE/BATALHAS — 3 PERGUNTAS DE SÍNTESE" />
        </div>

        {error && <p className="font-vt mt-4 text-center" style={{ color: '#ff5577', fontSize: 16 }}>{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 p-4" style={{ background: 'rgba(5,5,24,0.96)', borderTop: '2px solid #222' }}>
        <button onClick={() => { setMode('input'); setError(''); }} className="btn-pixel flex-1 py-3" style={{ background: '#222', color: '#aaa', fontSize: 8 }}>← VOLTAR</button>
        <button onClick={handleSave} disabled={saving} className="btn-pixel flex-1 py-3" style={{ background: saving ? '#333' : '#00ff88', color: '#000', fontSize: 8 }}>
          {saving ? 'SALVANDO...' : '🎮 CRIAR JOGO'}
        </button>
      </div>
    </div>
  );
}
