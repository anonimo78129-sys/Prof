# -*- coding: utf-8 -*-
"""
Desenha os três mapas do SEMENTE e reescreve o bloco MAPAS de
src/game/semente.ts. Rode com

    python3 scripts/semente/mapas.py

O chão sai de funções de terreno (trilha que ondula, mancha de mato por
ruído macio, lago, riacho) e os objetos entram por um grid de ocupação,
então nada nasce em cima de nada. No fim, `checa` percorre o mapa como o
jogador percorreria — mesma tabela de colisão de Semente.tsx — e reclama
se alguma saída ficou murada ou se algum NPC ficou sem um lado livre para
ser abordado. Mapa gerado sem essa verificação trava o jogo em silêncio.

Também grava rota.json: a mesma busca em largura devolve a sequência de
teclas da entrada até cada ponto, que é o que o passeio automático do
navegador usa para conferir o mundo sem ninguém dirigindo.
"""
import json, math, os

AQUI = os.path.dirname(os.path.abspath(__file__))
ALVO = os.path.join(AQUI, '..', '..', 'src', 'game', 'semente.ts')

# -*- coding: utf-8 -*-
"""Gera o bloco MAPAS de src/game/semente.ts para as peças do pacote novo."""
import math

TAM = {
    'arvore': (4, 5), 'arvoreMata': (4, 5), 'arvoreSeca': (4, 5),
    'arvoreMedia': (2, 3), 'arvoreMediaSeca': (2, 3),
    'arvorePeq': (2, 2), 'arvorePeqSeca': (2, 2),
    'casa': (6, 8), 'ponteH': (3, 3), 'ponteV': (3, 3),
    'poste': (1, 3), 'tora': (2, 1), 'vaca': (2, 1),
}
def tam(p): return TAM.get(p, (1, 1))

# o que barra o passo, e em que faixa de linhas — tem de bater com PECAS
# em Semente.tsx, senão o mapa "passa" aqui e tranca no jogo
SOLIDOS = {
    'casa': (0, 8),
    'arvore': (3, 2), 'arvoreMata': (3, 2), 'arvoreSeca': (3, 2),
    'arvoreMedia': (2, 1), 'arvoreMediaSeca': (2, 1),
    'arvorePeq': (1, 1), 'arvorePeqSeca': (1, 1),
    'cercaH': (0, 1), 'cercaV': (0, 1), 'bau': (0, 1), 'tora': (0, 1),
    'poste': (2, 1), 'placa': (0, 1), 'placa2': (0, 1), 'tocoSeco': (0, 1),
    'pedreira': (0, 1), 'pedreira2': (0, 1), 'pedreira3': (0, 1),
    'galinha': (0, 1), 'porco': (0, 1), 'ovelha': (0, 1), 'vaca': (0, 1),
}

def h(*v):
    n = 0
    for i, x in enumerate(v):
        n = (n * 1000003 + int(x) * (i * 2654435761 + 40503)) & 0xffffffff
    n ^= n >> 13; n = (n * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffffffff) / 0xffffffff

def ruido(x, y, esc, s):
    """valor macio, para manchas de mato em vez de xadrez"""
    fx, fy = x / esc, y / esc
    x0, y0 = math.floor(fx), math.floor(fy)
    tx, ty = fx - x0, fy - y0
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty)
    a = h(x0, y0, s); b = h(x0 + 1, y0, s)
    c = h(x0, y0 + 1, s); d = h(x0 + 1, y0 + 1, s)
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty


class Mapa:
    def __init__(self, id, nome, larg, alt, margem=(6, 6, 5, 5)):
        self.id, self.nome = id, nome
        self.L, self.A = larg, alt
        self.mo, self.md, self.mc, self.mb = margem   # oeste leste norte sul
        self.g = [['#'] * larg for _ in range(alt)]
        for y in range(self.mc, alt - self.mb):
            for x in range(self.mo, larg - self.md):
                self.g[y][x] = '.'
        self.obj = []
        self.falhas = []
        self.ocupado = set()
        self.npcs = []
        self.saidas = []

    # ── terreno ──
    def mato(self, esc=7, corte=0.56, s=3):
        for y in range(self.mc, self.A - self.mb):
            for x in range(self.mo, self.L - self.md):
                if self.g[y][x] == '.' and ruido(x, y, esc, s) > corte:
                    self.g[y][x] = ','

    def trilhaV(self, x, y0, y1, larg=2):
        for y in range(y0, y1 + 1):
            d = round(math.sin(y * 0.31 + x) * 0.8)
            for i in range(larg):
                cx = x + i + d
                if 0 <= cx < self.L: self.g[y][cx] = 't'
            if h(x, y, 5) < 0.3:
                cx = x + larg + d
                if 0 <= cx < self.L: self.g[y][cx] = 't'

    def trilhaH(self, y, x0, x1, larg=2):
        for x in range(x0, x1 + 1):
            d = round(math.sin(x * 0.27 + y) * 0.8)
            for i in range(larg):
                cy = y + i + d
                if 0 <= cy < self.A: self.g[cy][x] = 't'

    def lago(self, cx, cy, rx, ry):
        for y in range(cy - ry - 1, cy + ry + 2):
            for x in range(cx - rx - 1, cx + rx + 2):
                if not (self.mc <= y < self.A - self.mb and self.mo <= x < self.L - self.md):
                    continue
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d < 1 + (h(x, y, 9) - 0.5) * 0.5:
                    self.g[y][x] = '~'

    def piso(self):
        for y in range(self.mc, self.A - self.mb):
            for x in range(self.mo, self.L - self.md):
                self.g[y][x] = '='

    # ── objetos ──
    def livre(self, x, y, l, a, sobreTrilha=False):
        if x < 0 or y < 0 or x + l > self.L or y + a > self.A: return False
        for j in range(y, y + a):
            for i in range(x, x + l):
                if (i, j) in self.ocupado: return False
                c = self.g[j][i]
                if c == '~': return False
                if not sobreTrilha and c == 't': return False
        return True

    def poe(self, x, y, peca, forca=False, colide=None, busca=2):
        l, a = tam(peca)
        if not forca and not self.livre(x, y, l, a):
            # empurra um pouco em volta antes de desistir: o mapa é gerado,
            # e insistir na casa exata só faria sumir metade do cenário
            achou = False
            for r in range(1, busca + 1):
                for dy in range(-r, r + 1):
                    for dx in range(-r, r + 1):
                        if max(abs(dx), abs(dy)) != r: continue
                        if self.livre(x + dx, y + dy, l, a):
                            x, y = x + dx, y + dy; achou = True; break
                    if achou: break
                if achou: break
            if not achou:
                self.falhas.append((x, y, peca)); return False
        cy, ca = colide if colide else (0, a)
        for j in range(y + cy, y + cy + ca):
            for i in range(x, x + l):
                self.ocupado.add((i, j))
        self.obj.append((x, y, peca))
        return True

    def reserva(self, x, y, l=1, a=1):
        for j in range(y, y + a):
            for i in range(x, x + l): self.ocupado.add((i, j))

    def npc(self, id, x, y, arte, olhando, encontro=None, conversa=None):
        self.npcs.append(dict(id=id, x=x, y=y, arte=arte, olhando=olhando,
                              encontro=encontro, conversa=conversa))
        self.ocupado.add((x, y))

    def saida(self, x, y, para, dx, dy):
        self.saidas.append((x, y, para, dx, dy))
        self.reserva(x - 1, y - 1, 3, 3)

    # ── florestas de borda ──
    def bosque(self, pecas, passo=4, s=1):
        """enche a faixa sólida de mata, deixando a copa entrar um pouco no campo"""
        for y in range(-2, self.A, 3):
            for x in range(-2, self.L, passo):
                jx = x + int(h(x, y, s) * 3) - 1
                jy = y + int(h(x, y, s + 1) * 2) - 1
                l, a = 4, 5
                # copa cortada pela beirada da tela vira tronco solto no
                # meio do nada: árvore que não cabe inteira não entra
                if jx < 0 or jy < 0 or jx + l > self.L: continue
                # só onde o PÉ da árvore cai na faixa de borda
                pex, pey = jx + 2, jy + a - 1
                if not (0 <= pey < self.A and 0 <= pex < self.L): continue
                if self.g[pey][pex] != '#': continue
                if any((i, j) in self.ocupado
                       for j in range(jy + a - 2, jy + a) for i in range(jx, jx + l)): continue
                p = pecas[int(h(jx, jy, s + 2) * len(pecas)) % len(pecas)]
                for j in range(jy + a - 2, jy + a):
                    for i in range(jx, jx + l): self.ocupado.add((i, j))
                self.obj.append((jx, jy, p))

    def bosquinho(self, pecas, chance=0.55, s=31):
        """árvore pequena para fechar o vão embaixo dos troncos"""
        for y in range(self.A - 1):
            for x in range(self.L - 1):
                if h(x, y, s) > chance: continue
                if any(self.g[j][i] != '#' or (i, j) in self.ocupado
                       for j in (y, y + 1) for i in (x, x + 1)): continue
                self.ocupado.add((x, y + 1)); self.ocupado.add((x + 1, y + 1))
                self.obj.append((x, y, pecas[int(h(x, y, s + 1) * len(pecas)) % len(pecas)]))

    def chaoDaMata(self, pecas, chance=0.5, s=23):
        """mato rasteiro na faixa de borda, para o pé das árvores não
        ficar plantado em grama pelada"""
        for y in range(self.A):
            for x in range(self.L):
                if self.g[y][x] != '#' or (x, y) in self.ocupado: continue
                if h(x, y, s) > chance: continue
                p = pecas[int(h(x, y, s + 1) * len(pecas)) % len(pecas)]
                self.obj.append((x, y, p))

    def espalha(self, pecas, chance, onde='.,', s=17):
        for y in range(self.mc, self.A - self.mb):
            for x in range(self.mo, self.L - self.md):
                if self.g[y][x] not in onde: continue
                if (x, y) in self.ocupado: continue
                if h(x, y, s) > chance: continue
                p = pecas[int(h(x, y, s + 1) * len(pecas)) % len(pecas)]
                self.obj.append((x, y, p))

    def cerca(self, x, y, l, a, porta=None):
        for i in range(x, x + l):
            for j in (y, y + a - 1):
                if porta and (i, j) == porta: continue
                self.poe(i, j, 'cercaH')
        for j in range(y + 1, y + a - 1):
            for i in (x, x + l - 1):
                if porta and (i, j) == porta: continue
                self.poe(i, j, 'cercaV')

    def checa(self, x0, y0):
        """anda o mapa de verdade a partir da entrada e reclama do que
        ficou murado: saída fechada, NPC sem lado livre, ilha sem acesso"""
        duro = [[self.g[y][x] in '#~' for x in range(self.L)] for y in range(self.A)]
        for x, y, p in self.obj:
            if p not in SOLIDOS: continue
            l, _ = tam(p); cy, ca = SOLIDOS[p]
            for j in range(y + cy, y + cy + ca):
                for i in range(x, x + l):
                    if 0 <= j < self.A and 0 <= i < self.L: duro[j][i] = True
        for n in self.npcs: duro[n['y']][n['x']] = True

        visto = [[False] * self.L for _ in range(self.A)]
        pilha = [(x0, y0)]; visto[y0][x0] = True
        if duro[y0][x0]: return ['entrada (%d,%d) está bloqueada' % (x0, y0)]
        while pilha:
            cx, cy = pilha.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < self.L and 0 <= ny < self.A and not visto[ny][nx] and not duro[ny][nx]:
                    visto[ny][nx] = True; pilha.append((nx, ny))
        erros = []
        for x, y, para, _, _ in self.saidas:
            if not visto[y][x]: erros.append('saída para %s em (%d,%d) inalcançável' % (para, x, y))
        for n in self.npcs:
            if not any(0 <= n['y']+dy < self.A and 0 <= n['x']+dx < self.L
                       and visto[n['y']+dy][n['x']+dx]
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                erros.append('%s em (%d,%d) sem lado livre' % (n['id'], n['x'], n['y']))
        return erros

    def ts(self):
        chao = ',\n'.join("      '%s'" % ''.join(l) for l in self.g)
        objs = '\n'.join("      { x: %d, y: %d, peca: '%s' }," % o for o in self.obj)
        def npc(n):
            s = "      {\n        id: '%s', x: %d, y: %d, arte: '%s', olhando: %d,\n" % (
                n['id'], n['x'], n['y'], n['arte'], n['olhando'])
            if n['encontro']: s += "        encontro: '%s',\n" % n['encontro']
            if n['conversa']:
                s += "        conversa: [\n"
                for f in n['conversa']:
                    s += "          %s,\n" % f
                s += "        ],\n"
            return s + "      },"
        npcs = '\n'.join(npc(n) for n in self.npcs)
        sai = '\n'.join(
            "      { x: %d, y: %d, para: '%s', destinoX: %d, destinoY: %d }," % s
            for s in self.saidas)
        return ("  %s: {\n    id: '%s',\n    nome: '%s',\n    chao: [\n%s,\n    ],\n"
                "    objetos: [\n%s\n    ],\n    npcs: [\n%s\n    ],\n"
                "    saidas: [\n%s\n    ],\n  },") % (
            self.id, self.id, self.nome, chao, objs, npcs, sai)



def trilhaV(self, x, y0, y1, larg=2, onda=0.8):
    for y in range(y0, y1 + 1):
        d = round(math.sin(y * 0.31 + x) * onda)
        for i in range(larg):
            cx = x + i + d
            if 0 <= cx < self.L: self.g[y][cx] = 't'
        if onda and h(x, y, 5) < 0.28:
            cx = x + larg + d
            if 0 <= cx < self.L: self.g[y][cx] = 't'
def trilhaH(self, y, x0, x1, larg=2, onda=0.8):
    for x in range(x0, x1 + 1):
        d = round(math.sin(x * 0.27 + y) * onda)
        for i in range(larg):
            cy = y + i + d
            if 0 <= cy < self.A: self.g[cy][x] = 't'
Mapa.trilhaV = trilhaV; Mapa.trilhaH = trilhaH

CAPIM = ['tufo', 'tufo2', 'tufo3', 'capimAlto', 'moitaRasteira']
FLORES = ['florAmarela', 'florLaranja', 'florBranca']
SECO = ['trigoSeco', 'pedrinhas', 'trigoSeco', 'pedras']

# ══ BARRO ALTO ══════════════════════════════════════════
v = Mapa('povoado', 'BARRO ALTO', 30, 34)
v.mato(esc=8, corte=0.58, s=3)
v.trilhaV(13, 9, 33, larg=2, onda=0)
v.trilhaH(13, 8, 21, larg=1, onda=0)
v.trilhaH(20, 8, 21, larg=1, onda=0)
for x in range(12, 17):                       # largo em frente à casa da anciã
    for y in range(9, 12): v.g[y][x] = 't'

v.saida(13, 33, 'trilha', 14, 1)
v.saidas[-1] = (13, 33, 'trilha', 14, 1)
v.npc('anciana', 15, 12, 'anciana', 0, conversa=[
  "'Barro Alto tem cento e onze bocas e uma horta que dá para setenta.'",
  "'Antes do Colapso havia uma estação agrícola trilha abaixo. Diziam que guardavam ' +\n            'semente de tudo num cofre frio, para o caso de um dia faltar.'",
  "'Um dia faltou. Desce a trilha do sul, menino. Fala com quem encontrar no caminho — ' +\n            'quem ficou vivo aprendeu a olhar.'"])
v.npc('nita', 12, 17, 'nita', 3, encontro='poco')
v.npc('vilma', 10, 14, 'vilma', 1, encontro='paiol')
v.npc('doril', 17, 21, 'doril', 1, encontro='horta')

v.poe(6, 5, 'casa', busca=0); v.poe(17, 5, 'casa', busca=0)
v.poe(7, 21, 'casa', busca=0)
v.cerca(16, 22, 7, 7, porta=(18, 22))
for y in range(23, 28):                       # canteiro lavrado dentro da cerca
    for x in range(17, 22): v.g[y][x] = 'h'
for i, x in enumerate(range(17, 22)):
    for j, y in enumerate(range(24, 28)):
        v.poe(x, y, ['cenoura', 'mudaSolo', 'trigo', 'broto'][(i + j) % 4])
v.poe(11, 15, 'poste'); v.poe(15, 23, 'poste')
v.poe(16, 14, 'tocoSeco'); v.poe(18, 14, 'pedras'); v.poe(16, 15, 'bau')
v.poe(11, 19, 'pedreira'); v.poe(20, 17, 'pedreira2'); v.poe(15, 25, 'tora')
v.poe(15, 8, 'placa'); v.poe(19, 12, 'tora'); v.poe(10, 30, 'pedreira3')
v.poe(11, 16, 'galinha'); v.poe(9, 18, 'galinha'); v.poe(20, 19, 'ovelha')
v.poe(8, 15, 'canteiro1'); v.poe(8, 16, 'canteiro2'); v.poe(9, 15, 'canteiro3')
v.poe(21, 13, 'arvoreMedia'); v.poe(7, 17, 'arvorePeq'); v.poe(19, 29, 'arvoreMedia')
v.bosque(['arvore', 'arvoreMata', 'arvore', 'arvoreSeca'], passo=3, s=1)
v.bosquinho(['arvorePeq', 'arvorePeq', 'arvorePeqSeca'])
v.chaoDaMata(['tufo', 'tufo2', 'moitaRasteira', 'capimAlto', 'tufo3'])
v.espalha(CAPIM + FLORES + ['cogumelo', 'pedrinhas'], 0.26)
v.espalha(['pedrinhas', 'pedras'], 0.07, onde='t', s=31)

# ══ TRILHA DO SUL ═══════════════════════════════════════
t = Mapa('trilha', 'TRILHA DO SUL', 30, 40, margem=(6, 6, 5, 5))
t.mato(esc=9, corte=0.63, s=7)
t.trilhaV(14, 0, 21, larg=2, onda=0.8)
t.trilhaH(22, 14, 19, larg=1, onda=0)
t.trilhaV(18, 22, 39, larg=2, onda=0.8)
t.lago(9, 30, 3, 4)
ant = None                                    # o riacho, atravessado pela ponte
for x in range(6, 24):
    d = 24 + round(ruido(x, 0, 5, 4) * 2.4) - 1
    a, b = (d, d) if ant is None else (min(d, ant), max(d, ant))
    for y in range(a, b + 1): t.g[y][x] = '~'
    if h(x, 24, 2) < 0.5: t.g[b + 1][x] = '~'
    ant = d
for y in range(22, 27):
    for x in range(18, 20): t.g[y][x] = 't'
# bocas de passagem: a trilha ondula, mas onde ela sai do mapa tem de
# ficar reta, senão o degrau de entrada cai em cima da mata
for y in range(0, 7):
    t.g[y][14] = 't'; t.g[y][15] = 't'
for y in range(34, 40):
    t.g[y][18] = 't'; t.g[y][19] = 't'

t.saida(14, 0, 'povoado', 13, 32)
t.saidas[-1] = (14, 0, 'povoado', 13, 32)
t.saida(18, 39, 'estacao', 11, 18)
t.saidas[-1] = (18, 39, 'estacao', 11, 18)
t.npc('andarilho', 13, 16, 'andarilho', 3, conversa=[
  "'A estação fica no fim da trilha, do lado da boca de pedra. Você não erra.'",
  "'Já fui lá. Não vou voltar. O que você procura não está lá dentro.'"])
t.npc('teo', 17, 33, 'teo', 3, encontro='clareira')

t.poe(18, 23, 'ponteV', forca=True)
t.poe(10, 8, 'arvoreSeca'); t.poe(19, 9, 'arvoreSeca'); t.poe(9, 13, 'arvoreSeca')
t.poe(20, 15, 'arvoreSeca'); t.poe(8, 19, 'arvoreSeca'); t.poe(20, 30, 'arvoreSeca')
t.poe(9, 6, 'arvoreMediaSeca'); t.poe(21, 20, 'arvoreMediaSeca')
t.poe(11, 34, 'arvorePeq'); t.poe(21, 35, 'arvorePeqSeca')
t.poe(16, 12, 'pedreira'); t.poe(11, 21, 'pedreira2'); t.poe(20, 27, 'pedreira3')
t.poe(12, 11, 'tora'); t.poe(15, 28, 'tora'); t.poe(9, 17, 'tocoSeco')
t.poe(16, 19, 'tocoSeco'); t.poe(13, 30, 'pedras'); t.poe(21, 12, 'cristal')
t.poe(20, 33, 'tocoSeco'); t.poe(19, 34, 'tora')
for x, y in [(14, 31), (16, 31), (13, 33), (15, 34), (12, 32), (16, 35), (14, 35)]:
    t.poe(x, y, 'broto')
t.bosque(['arvoreSeca', 'arvoreMata', 'arvoreSeca', 'arvore'], passo=3, s=11)
t.bosquinho(['arvorePeqSeca', 'arvorePeq', 'arvorePeqSeca'])
t.chaoDaMata(['tufo', 'trigoSeco', 'moitaRasteira', 'capimAlto', 'pedrinhas'])
t.espalha(CAPIM + SECO, 0.24, s=19)
t.espalha(['pedrinhas', 'pedras'], 0.06, onde='t', s=37)

# ══ ESTAÇÃO AGRÍCOLA ════════════════════════════════════
# Não é um prédio: é a laje que sobrou dele. As paredes viraram os montes
# de entulho na beirada, e o mato já está entrando pelas rachaduras — que
# é o ponto da história inteira.
e = Mapa('estacao', 'ESTAÇÃO AGRÍCOLA', 24, 20, margem=(4, 4, 4, 4))
e.piso()
for y in range(16, 20):
    e.g[y][11] = 't'; e.g[y][12] = 't'
e.saida(11, 19, 'trilha', 18, 38)
e.poe(11, 5, 'bau', busca=0)
for x in range(4, 20, 2):                     # o que restou das paredes
    e.poe(x, 4, ['pedreira', 'pedreira2', 'pedreira3'][x % 3])
for y in range(5, 15, 2):
    e.poe(4, y, ['pedreira2', 'pedreira3', 'pedreira'][y % 3])
    e.poe(19, y, ['pedreira3', 'pedreira', 'pedreira2'][y % 3])
for x in range(4, 10, 2): e.poe(x, 15, 'pedreira2')
for x in range(14, 20, 2): e.poe(x, 15, 'pedreira3')
e.poe(7, 6, 'tocoSeco'); e.poe(16, 7, 'pedras'); e.poe(6, 12, 'pedrinhas')
e.poe(15, 12, 'pedras'); e.poe(9, 9, 'pedrinhas')
for x, y in [(8, 7), (13, 8), (7, 10), (14, 10), (10, 12), (12, 6), (16, 13),
             (6, 8), (17, 11), (9, 13), (13, 13), (11, 9)]:
    e.poe(x, y, 'broto')
e.poe(5, 10, 'capimAlto'); e.poe(18, 8, 'tufo'); e.poe(12, 11, 'tufo2')
e.poe(8, 14, 'moitaRasteira'); e.poe(15, 5, 'trigoSeco')
e.bosque(['arvoreSeca', 'arvoreSeca', 'arvoreMata'], passo=3, s=41)
e.bosquinho(['arvorePeqSeca', 'arvorePeq'])
e.chaoDaMata(['tufo', 'trigoSeco', 'moitaRasteira', 'capimAlto', 'pedrinhas'])

blocos = '\n\n'.join(m.ts() for m in (v, t, e))
fonte = open(ALVO, encoding='utf-8').read()
corte = fonte.index('export const MAPAS')
novo = (fonte[:corte]
        + 'export const MAPAS: Record<string, Mapa> = {\n' + blocos + '\n};\n\n'
        + "export const MAPA_INICIAL = 'povoado';\n"
        + 'export const INICIO = { x: 13, y: 20, olhando: 1 as const };\n')
open(ALVO, 'w', encoding='utf-8').write(novo)
ENTRADA = {'povoado': (13, 20), 'trilha': (14, 1), 'estacao': (11, 18)}
ruim = False
for m in (v, t, e):
    print(m.id, m.L, 'x', m.A, '·', len(m.obj), 'objetos')
    if m.falhas: print('   NAO COUBERAM:', m.falhas)
    for erro in m.checa(*ENTRADA[m.id]):
        print('   ERRO:', erro); ruim = True
print('MAPA COM PROBLEMA' if ruim else 'todos os caminhos abertos')

# ── rota de teste: a mesma busca que valida o mapa também sabe dizer as
# teclas que levam da entrada até cada ponto, para o passeio automático
import json
def duro_de(m):
    d = [[m.g[y][x] in '#~' for x in range(m.L)] for y in range(m.A)]
    for x, y, p in m.obj:
        if p not in SOLIDOS: continue
        l, _ = tam(p); cy, ca = SOLIDOS[p]
        for j in range(y + cy, y + cy + ca):
            for i in range(x, x + l):
                if 0 <= j < m.A and 0 <= i < m.L: d[j][i] = True
    for n in m.npcs: d[n['y']][n['x']] = True
    return d

TECLA = {(0, 1): 'ArrowDown', (0, -1): 'ArrowUp', (-1, 0): 'ArrowLeft', (1, 0): 'ArrowRight'}
def rota(m, a, b):
    d = duro_de(m); from collections import deque
    q = deque([a]); veio = {a: None}
    while q:
        c = q.popleft()
        if c == b: break
        for dx, dy in TECLA:
            n = (c[0] + dx, c[1] + dy)
            if 0 <= n[0] < m.L and 0 <= n[1] < m.A and n not in veio and not d[n[1]][n[0]]:
                veio[n] = c; q.append(n)
    if b not in veio: return None
    cam = []; c = b
    while veio[c]: cam.append((c[0] - veio[c][0], c[1] - veio[c][1])); c = veio[c]
    return [TECLA[p] for p in reversed(cam)]

saida = {
  'povoado_saida': rota(v, (13, 20), (13, 33)),
  'trilha_saida': rota(t, (14, 1), (18, 39)),
  'nita': rota(v, (13, 20), (13, 17)),
  'anciana': rota(v, (13, 20), (14, 12)),
  'nita_saida': rota(v, (13, 17), (13, 33)),
  'estacao_cofre': rota(e, (11, 18), (11, 6)),
}
for k, r in saida.items():
    print(k, 'sem rota' if r is None else '%d passos' % len(r))
json.dump(saida, open(os.path.join(AQUI, 'rota.json'), 'w'))
