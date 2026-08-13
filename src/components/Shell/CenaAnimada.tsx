import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────
// Duas técnicas de animar a ilustração, para comparar.
//
// CAMADAS  — a arte foi recortada em planos (céu, meio, frente) e cada um
//   anda numa velocidade. É parallax de verdade: a frente cobre o fundo,
//   e o deslocamento relativo dá a profundidade. Exige a arte recortada.
//
// PROFUNDIDADE — a arte continua achatada, e um mapa de profundidade diz
//   o quanto cada pixel deve deslocar. Um shader empurra os pixels perto
//   mais que os longe. Não precisa de recorte, mas estica o pixel na
//   borda dos objetos, porque atrás deles não existe informação.
//
// Nos dois casos o movimento tem duas fontes: uma deriva lenta constante,
// para a cena nunca ficar parada, e um empurrão quando o jogador escolhe
// uma resposta — que é o gatilho que o jogo usa.
// ─────────────────────────────────────────────────────────

/** 0 = parado; sobe até 1 quando o jogador escolhe, e volta a 0. */
function useAvanco(gatilho: number) {
  const ref = useRef(0);
  useEffect(() => {
    if (!gatilho) return;
    let raf = 0;
    const inicio = performance.now();
    const DUR = 900;
    const passo = (t: number) => {
      const k = Math.min(1, (t - inicio) / DUR);
      // sobe rápido e desce devagar: dá a sensação de passo dado
      ref.current = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
      if (k < 1) raf = requestAnimationFrame(passo); else ref.current = 0;
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [gatilho]);
  return ref;
}

// ── TÉCNICA 1: camadas recortadas ────────────────────────

export interface CamadasProps {
  /** do fundo para a frente; o fator diz o quanto cada uma anda */
  camadas: { src: string; fator: number }[];
  foco?: string;
  gatilho: number;
}

export function CenaCamadas({ camadas, foco = 'center', gatilho }: CamadasProps) {
  const caixa = useRef<HTMLDivElement>(null);
  const avanco = useAvanco(gatilho);

  useEffect(() => {
    let raf = 0;
    const anima = (t: number) => {
      const el = caixa.current;
      if (el) {
        // deriva lenta: a cena respira mesmo sem ninguém tocar
        const deriva = Math.sin(t / 3400);
        const filhos = el.children;
        for (let i = 0; i < filhos.length; i++) {
          const fator = Number((filhos[i] as HTMLElement).dataset.fator || 0);
          const x = deriva * 5 * fator;
          // o empurrão da escolha vem para a frente: plano perto anda mais
          const z = avanco.current * 13 * fator;
          (filhos[i] as HTMLElement).style.transform =
            `translate3d(${x - z * 0.15}px, ${z * 0.10}px, 0) scale(${1 + z * 0.004})`;
        }
      }
      raf = requestAnimationFrame(anima);
    };
    raf = requestAnimationFrame(anima);
    return () => cancelAnimationFrame(raf);
  }, [avanco]);

  return (
    <div ref={caixa} style={{ position: 'absolute', inset: 0 }}>
      {camadas.map(c => (
        <img
          key={c.src}
          src={c.src}
          alt=""
          data-fator={c.fator}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: foco,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}

// ── TÉCNICA 2: deslocamento por mapa de profundidade ─────

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2((p.x + 1.0) * 0.5, 1.0 - (p.y + 1.0) * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// Empurra cada pixel na direção de "desloc" proporcional à profundidade.
// Perto (branco no mapa) anda muito, longe (preto) quase nada. O
// resultado é 2,5D: convence enquanto o deslocamento for pequeno, e
// começa a esticar a borda dos objetos se for longe demais.
const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D arte;
uniform sampler2D prof;
uniform vec2 desloc;
uniform vec4 recorte;   // escala e offset para simular object-fit: cover
void main() {
  vec2 c = uv * recorte.xy + recorte.zw;
  float d = texture2D(prof, c).r;
  vec2 off = desloc * (d - 0.35);
  vec2 s = clamp(c + off, vec2(0.001), vec2(0.999));
  gl_FragColor = texture2D(arte, s);
}`;

function compila(gl: WebGLRenderingContext, tipo: number, fonte: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'shader');
  }
  return s;
}

function textura(gl: WebGLRenderingContext, img: HTMLImageElement) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return t;
}

export interface ProfundidadeProps {
  arte: string;
  mapa: string;
  /** fração vertical da arte que fica visível, e onde ela começa */
  recorte?: { escalaY: number; offsetY: number };
  gatilho: number;
}

export function CenaProfundidade({ arte, mapa, recorte, gatilho }: ProfundidadeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avanco = useAvanco(gatilho);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;   // sem WebGL a janela fica no fundo chapado, sem quebrar

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compila(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compila(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uDesloc = gl.getUniformLocation(prog, 'desloc');
    const uRecorte = gl.getUniformLocation(prog, 'recorte');
    const esc = recorte?.escalaY ?? 1;
    const off = recorte?.offsetY ?? 0;
    gl.uniform4f(uRecorte, 1, esc, 0, off);

    let raf = 0, vivo = true;
    Promise.all([arte, mapa].map(src => new Promise<HTMLImageElement>((ok, erro) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => ok(im);
      im.onerror = erro;
      im.src = src;
    }))).then(([imArte, imMapa]) => {
      if (!vivo) return;
      gl.activeTexture(gl.TEXTURE0);
      textura(gl, imArte);
      gl.uniform1i(gl.getUniformLocation(prog, 'arte'), 0);
      gl.activeTexture(gl.TEXTURE1);
      textura(gl, imMapa);
      gl.uniform1i(gl.getUniformLocation(prog, 'prof'), 1);

      const desenha = (t: number) => {
        const r = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cw = Math.round(r.width * dpr), ch = Math.round(r.height * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw; canvas.height = ch;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        const deriva = Math.sin(t / 3400) * 0.012;
        const passo = avanco.current * 0.05;
        gl.uniform2f(uDesloc, deriva, -passo);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(desenha);
      };
      raf = requestAnimationFrame(desenha);
    }).catch(() => { /* imagem faltando: janela fica no fundo chapado */ });

    return () => { vivo = false; cancelAnimationFrame(raf); };
  }, [arte, mapa, recorte, avanco]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}
