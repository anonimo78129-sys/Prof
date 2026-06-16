import { useState } from 'react';
import type { GameConfig, MCQuestion, MatchPair } from '../../types/game';
import { DEFAULT_NARRATIVE_CHOICES } from '../../data/narrative';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface Props {
  onGameCreated: (config: GameConfig) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

function emptyQ(): MCQuestion {
  return { text: '', options: ['', '', '', ''], correct: 0 };
}

function emptyPair(): MatchPair {
  return { concept: '', definition: '' };
}

export default function SetupWizard({ onGameCreated }: Props) {
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('');
  const [forestQs, setForestQs] = useState<MCQuestion[]>([emptyQ(), emptyQ(), emptyQ()]);
  const [cityPairs, setCityPairs] = useState<MatchPair[]>([emptyPair(), emptyPair(), emptyPair(), emptyPair()]);
  const [cavesQs, setCavesQs] = useState<MCQuestion[]>([emptyQ(), emptyQ(), emptyQ(), emptyQ(), emptyQ()]);
  const [towerQs, setTowerQs] = useState<MCQuestion[]>([emptyQ(), emptyQ(), emptyQ()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Tema', 'Floresta', 'Cidade', 'Cavernas', 'Torre'];

  const updateQ = (
    setter: React.Dispatch<React.SetStateAction<MCQuestion[]>>,
    idx: number,
    field: keyof MCQuestion | 'opt0' | 'opt1' | 'opt2' | 'opt3',
    value: string | number,
  ) => {
    setter(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      if (field === 'text') return { ...q, text: value as string };
      if (field === 'correct') return { ...q, correct: value as 0 | 1 | 2 | 3 };
      if (field.startsWith('opt')) {
        const optIdx = parseInt(field[3]);
        const opts = [...q.options] as [string, string, string, string];
        opts[optIdx] = value as string;
        return { ...q, options: opts };
      }
      return q;
    }));
  };

  const updatePair = (idx: number, field: 'concept' | 'definition', value: string) => {
    setCityPairs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (!subject.trim()) { setError('Informe o tema da aula'); setStep(0); return; }
    setSaving(true);
    setError('');

    const id = uid();
    const config: GameConfig = {
      id,
      subject: subject.trim(),
      createdAt: Date.now(),
      scenes: {
        forest: { questions: forestQs, narrative: DEFAULT_NARRATIVE_CHOICES.forest },
        city: { pairs: cityPairs, narrative: DEFAULT_NARRATIVE_CHOICES.city },
        caves: { questions: cavesQs, narrative: DEFAULT_NARRATIVE_CHOICES.caves },
        tower: { questions: towerQs },
      },
      assets: {},
    };

    try {
      await setDoc(doc(db, 'games', id), config);
      onGameCreated(config);
    } catch (e) {
      setError('Erro ao salvar. Verifique a conexão.');
      setSaving(false);
    }
  };

  const QEditor = ({
    questions,
    setter,
    label,
  }: {
    questions: MCQuestion[];
    setter: React.Dispatch<React.SetStateAction<MCQuestion[]>>;
    label: string;
  }) => (
    <div className="flex flex-col gap-5">
      <p className="font-pixel text-center" style={{ color: '#aaa', fontSize: 7 }}>{label}</p>
      {questions.map((q, idx) => (
        <div key={idx} style={{ background: '#0a0a1a', border: '2px solid #333', padding: 12 }}>
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
                  style={{
                    width: 24, height: 24,
                    background: q.correct === oi ? '#00ff88' : '#222',
                    border: `2px solid ${q.correct === oi ? '#00ff88' : '#444'}`,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Marcar como correta"
                />
                <span className="font-pixel text-gray-400 flex-shrink-0" style={{ fontSize: 8, width: 12 }}>{String.fromCharCode(65 + oi)}</span>
                <input
                  value={opt}
                  onChange={e => updateQ(setter, idx, `opt${oi}` as any, e.target.value)}
                  placeholder={`Opção ${String.fromCharCode(65 + oi)}`}
                  style={{ flex: 1, background: '#050518', border: '1px solid #333', color: '#fff', padding: '4px 8px', fontSize: 14 }}
                />
              </div>
            ))}
          </div>
          <p className="font-vt mt-1" style={{ color: '#00ff88', fontSize: 14 }}>
            ✓ Resposta correta: {String.fromCharCode(65 + q.correct)}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#050518] overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-white" style={{ fontSize: 10, lineHeight: 2 }}>ÉTER</h1>
          <p className="font-vt text-gray-400" style={{ fontSize: 18 }}>Configurar a Jornada</p>
          <p className="font-vt" style={{ color: '#7c6aad', fontSize: 14 }}>
            Suas perguntas viram puzzles E batalhas por turnos.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 mb-6 justify-center">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div style={{
                width: 28, height: 28,
                background: i === step ? '#ffc800' : i < step ? '#00ff88' : '#222',
                border: '2px solid #333',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="font-pixel" style={{ color: i <= step ? '#000' : '#555', fontSize: 7 }}>
                  {i < step ? '✓' : i + 1}
                </span>
              </div>
              <span className="font-pixel" style={{ color: i === step ? '#ffc800' : '#555', fontSize: 5 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <div>
            <p className="font-vt text-white mb-3" style={{ fontSize: 18 }}>Qual é o tema da aula?</p>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Fotossíntese, Revolução Francesa..."
              style={{ width: '100%', background: '#0a0a1a', border: '2px solid #ffc800', color: '#fff', padding: '10px 14px', fontSize: 16, fontFamily: 'sans-serif' }}
              autoFocus
            />
            <p className="font-vt mt-4" style={{ color: '#aaa', fontSize: 16 }}>
              Este tema aparece no score final como contexto. As perguntas são configuradas nas próximas etapas.
            </p>
          </div>
        )}

        {step === 1 && (
          <QEditor questions={forestQs} setter={setForestQs} label="FLORESTA DOS ECOS — 3 PERGUNTAS" />
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="font-pixel text-center" style={{ color: '#aaa', fontSize: 7 }}>CIDADE FLUTUANTE — 4 PARES</p>
            <p className="font-vt text-gray-400" style={{ fontSize: 16 }}>O aluno conecta conceito à definição.</p>
            {cityPairs.map((pair, idx) => (
              <div key={idx} style={{ background: '#0a0a1a', border: '2px solid #333', padding: 12 }}>
                <p className="font-vt mb-2" style={{ color: '#ffc800', fontSize: 16 }}>Par {idx + 1}</p>
                <input
                  value={pair.concept}
                  onChange={e => updatePair(idx, 'concept', e.target.value)}
                  placeholder="Conceito (ex: Mitose)"
                  style={{ width: '100%', background: '#050518', border: '1px solid #333', color: '#fff', padding: '6px 10px', fontSize: 14, marginBottom: 6 }}
                />
                <input
                  value={pair.definition}
                  onChange={e => updatePair(idx, 'definition', e.target.value)}
                  placeholder="Definição (ex: Divisão celular mitótica)"
                  style={{ width: '100%', background: '#050518', border: '1px solid #333', color: '#fff', padding: '6px 10px', fontSize: 14 }}
                />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <QEditor questions={cavesQs} setter={setCavesQs} label="CAVERNAS DE CRISTAL — 5 PERGUNTAS" />
        )}

        {step === 4 && (
          <QEditor questions={towerQs} setter={setTowerQs} label="TORRE DO PORTAL — 3 PERGUNTAS DE SÍNTESE" />
        )}

        {error && (
          <p className="font-vt mt-3 text-center" style={{ color: '#ff4444', fontSize: 18 }}>{error}</p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-3 p-4" style={{ background: 'rgba(5,5,24,0.95)', borderTop: '2px solid #222' }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-pixel flex-1 py-3" style={{ background: '#222', color: '#aaa', fontSize: 8 }}>
            ← VOLTAR
          </button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-pixel flex-1 py-3" style={{ background: '#ffc800', color: '#000', fontSize: 8 }}>
            AVANÇAR →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-pixel flex-1 py-3"
            style={{ background: saving ? '#333' : '#00ff88', color: '#000', fontSize: 8 }}
          >
            {saving ? 'SALVANDO...' : '🎮 CRIAR JOGO'}
          </button>
        )}
      </div>
    </div>
  );
}
