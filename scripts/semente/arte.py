# -*- coding: utf-8 -*-
"""
Recorta e repinta o pacote Cute Fantasy para public/assets/semente/cf.

O pacote gratuito não pode ser redistribuído como pacote, mas pode ser
usado e alterado em projeto sem fins comerciais — que é o caso. Por isso
o zip original NÃO fica no repositório: aponte PACOTE para onde você o
descompactou e rode

    python3 scripts/semente/arte.py ~/Downloads/Cute_Fantasy_Free

O que este script faz, além de copiar:

  · apaga o verde chapado do fundo das folhas de transição, para trilha e
    água virarem decalque que pode ser posto sobre qualquer chão em vez
    de retângulo que apaga o que está embaixo;
  · deriva o mato alto e o concreto da estação da MESMA silhueta da
    trilha, só repintando — assim herdam as bordas recortadas e os
    cantos côncavos que o pacote só desenhou uma vez;
  · deriva a árvore seca e a mata fechada do carvalho, trocando a paleta
    da copa;
  · gera os moradores do povoado a partir da folha do protagonista,
    trocando cabelo, roupa e tom de pele.

Sem PIL: o leitor e o escritor de PNG estão aqui mesmo, em zlib puro.
"""
import os, shutil, struct, sys, zlib

import zlib, struct
def lerpng(p):
    d=open(p,'rb').read(); i=8; dados=b''; larg=alt=0; cor=0
    while i < len(d):
        n=struct.unpack('>I',d[i:i+4])[0]; t=d[i+4:i+8]
        if t==b'IHDR': larg,alt,prof,cor=struct.unpack('>IIBB',d[i+8:i+18])
        if t==b'IDAT': dados+=d[i+8:i+8+n]
        i+=12+n
    raw=zlib.decompress(dados); ca={0:1,2:3,3:1,4:2,6:4}[cor]
    passo=larg*ca; out=bytearray(); ant=bytearray(passo); j=0
    for y in range(alt):
        f=raw[j]; j+=1; lin=bytearray(raw[j:j+passo]); j+=passo
        for x in range(passo):
            a=lin[x-ca] if x>=ca else 0; b=ant[x]; c=ant[x-ca] if x>=ca else 0
            if f==1: lin[x]=(lin[x]+a)&255
            elif f==2: lin[x]=(lin[x]+b)&255
            elif f==3: lin[x]=(lin[x]+(a+b)//2)&255
            elif f==4:
                p2=a+b-c; pa=abs(p2-a); pb=abs(p2-b); pc=abs(p2-c)
                pr=a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                lin[x]=(lin[x]+pr)&255
        out+=lin; ant=lin
    return larg,alt,ca,out
def png(nome, L, A, rgb):
    linhas=bytearray()
    for y in range(A):
        linhas.append(0); linhas += rgb[y*L*3:(y+1)*L*3]
    def bl(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I', zlib.crc32(t+d)&0xffffffff)
    open(nome,'wb').write(b'\x89PNG\r\n\x1a\n'+bl(b'IHDR',struct.pack('>IIBBBBB',L,A,8,2,0,0,0))
        +bl(b'IDAT',zlib.compress(bytes(linhas),6))+bl(b'IEND',b''))


B = sys.argv[1] if len(sys.argv) > 1 else 'Cute_Fantasy_Free'
AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(AQUI, '..', '..', 'public', 'assets', 'semente', 'cf')
os.makedirs(DEST, exist_ok=True)

def png_rgba(nome, L, A, rgba):
    linhas = bytearray()
    for y in range(A):
        linhas.append(0); linhas += rgba[y*L*4:(y+1)*L*4]
    def bl(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    open(nome, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + bl(b'IHDR', struct.pack('>IIBBBBB', L, A, 8, 6, 0, 0, 0))
        + bl(b'IDAT', zlib.compress(bytes(linhas), 9))
        + bl(b'IEND', b''))

def recolore(origem, destino, mapa):
    L, A, ca, px = lerpng(origem)
    assert ca == 4, origem
    out = bytearray(px)
    trocas = 0
    for i in range(0, len(out), 4):
        c = tuple(out[i:i+3])
        if out[i+3] < 8: continue
        if c in mapa:
            novo = mapa[c]
            trocas += 1
            if novo is None: out[i+3] = 0
            else: out[i:i+3] = bytes(novo)
    png_rgba(destino, L, A, out)
    print(f'{os.path.basename(destino):14s} {L}x{A}  {trocas} pixels trocados')

GRAMA   = (62, 137, 72)    # fundo de grama chapada
FRANJA  = (38, 92, 66)     # franja verde escura do lado da grama
RISCO   = (25, 60, 62)     # contorno
BEIRA   = (184, 111, 80)   # sombra da beirada da trilha
MIOLO   = (228, 166, 114)  # miolo da trilha

# 1. trilha e água: só tirar a grama chapada, para o desenho poder ser
#    sobreposto a qualquer chão em vez de apagá-lo
recolore(f'{B}/Tiles/Path_Tile.png',  f'{DEST}/trilha.png', {GRAMA: None})
recolore(f'{B}/Tiles/Water_Tile.png', f'{DEST}/agua.png',   {GRAMA: None})

# 2. grama escura: a MESMA silhueta da trilha, repintada de verde. Assim a
#    mancha de mato alto ganha de graça as bordas recortadas e os cantos
#    côncavos que o pacote só desenhou para a trilha.
recolore(f'{B}/Tiles/Path_Tile.png', f'{DEST}/escura.png', {
    GRAMA: None, RISCO: (30, 74, 54), BEIRA: (40, 98, 58), MIOLO: (50, 118, 64),
})

# 3. piso de concreto da estação, pela mesma silhueta
recolore(f'{B}/Tiles/Path_Tile.png', f'{DEST}/piso.png', {
    GRAMA: None, FRANJA: (44, 74, 58), RISCO: (28, 32, 36),
    BEIRA: (86, 90, 84), MIOLO: (116, 120, 112),
})

# Grass_Middle não entra: é uma cor chapada só, e o motor pinta o fundo
# inteiro com ela de uma vez em vez de repetir trezentos drawImage.
COPIA = [
    ('Tiles/FarmLand_Tile.png', 'horta.png'),
    ('Outdoor decoration/Outdoor_Decor_Free.png', 'decor.png'),
    ('Outdoor decoration/Oak_Tree.png', 'arvore.png'),
    ('Outdoor decoration/Oak_Tree_Small.png', 'arvore2.png'),
    ('Outdoor decoration/House_1_Wood_Base_Blue.png', 'casa.png'),
    ('Outdoor decoration/Fences.png', 'cerca.png'),
    ('Outdoor decoration/Bridge_Wood.png', 'ponte.png'),
    ('Outdoor decoration/Chest.png', 'bau.png'),
    ('Player/Player.png', 'heroi.png'),
    ('Animals/Chicken/Chicken.png', 'galinha.png'),
    ('Animals/Cow/Cow.png', 'vaca.png'),
    ('Animals/Sheep/Sheep.png', 'ovelha.png'),
    ('Animals/Pig/Pig.png', 'porco.png'),
]
for src, dst in COPIA:
    shutil.copy(f'{B}/{src}', f'{DEST}/{dst}')
print('copiados', len(COPIA))


ASCII = {n: n for n in ('nita', 'doril', 'vilma', 'anciana', 'teo', 'andarilho')}

def repinta(origem, destino, mapa, recorte=None):
    L, A, ca, px = lerpng(origem)
    assert ca == 4
    if recorte:
        x0, y0, l, a = recorte
        novo = bytearray()
        for y in range(y0, y0+a):
            novo += px[(y*L+x0)*4:(y*L+x0+l)*4]
        px = novo; L, A = l, a
    out = bytearray(px)
    for i in range(0, len(out), 4):
        if out[i+3] < 8: continue
        c = tuple(out[i:i+3])
        if c in mapa: out[i:i+3] = bytes(mapa[c])
    png_rgba(destino, L, A, out)
    return L, A

# ── árvores: o pacote traz um carvalho só. Repintando a copa saem a
# árvore seca do mundo depois do Colapso e uma mata mais fechada, sem
# misturar desenho de outro autor no meio.
FOLHA = [(90,197,79), (51,152,75), (30,111,80), (19,76,76)]
SECA  = [(168,138,92), (132,104,72), (96,76,58), (66,52,44)]
MATA  = [(58,150,72), (36,116,66), (22,86,64), (14,58,58)]
for orig, alvo, nome in [('Oak_Tree.png', SECA, 'arvoreSeca.png'),
                         ('Oak_Tree.png', MATA, 'arvoreMata.png'),
                         ('Oak_Tree_Small.png', SECA, 'arvore2Seca.png')]:
    print(nome, repinta(f'{B}/Outdoor decoration/{orig}', f'{DEST}/{nome}',
                        dict(zip(FOLHA, alvo))))

# ── gente do povoado: mesma folha do protagonista com outra paleta.
# Só as três linhas paradas (baixo, lado, cima) — NPC não anda.
CABELO = [(112,70,67), (93,44,40)]
CAMISA = [(51,152,75), (30,111,80), (19,76,76)]
CALCA  = [(0,152,220), (0,105,170)]
PELE   = [(246,202,159), (210,159,112)]
GENTE = {
  'nita':      ([(60,40,52),(38,26,36)],      [(214,80,72),(168,54,58),(112,36,44)],   [(92,76,96),(60,50,68)],   None),
  'doril':     ([(176,168,160),(124,118,112)],[(214,160,74),(168,118,50),(112,76,36)], [(110,78,58),(74,52,40)],  [(222,176,132),(178,130,92)]),
  'vilma':     ([(36,32,44),(22,20,30)],      [(150,96,180),(108,66,140),(70,42,96)],  [(58,64,88),(38,42,60)],   [(198,146,104),(150,104,72)]),
  'anciana':     ([(232,228,220),(176,172,166)],[(92,96,160),(64,66,120),(42,42,82)],    [(70,64,74),(48,44,52)],   None),
  'teo':       ([(196,152,80),(150,108,52)],  [(240,196,84),(198,146,52),(140,96,36)], [(78,96,110),(52,66,80)],  None),
  'andarilho': ([(72,60,54),(48,38,34)],      [(104,110,78),(74,80,56),(48,52,38)],    [(62,58,54),(42,40,38)],   [(208,164,126),(160,116,82)]),
}
for nome, (cab, cam, cal, pel) in GENTE.items():
    m = dict(zip(CABELO, cab)) | dict(zip(CAMISA, cam)) | dict(zip(CALCA, cal))
    if pel: m |= dict(zip(PELE, pel))
    arq = f'{DEST}/g-{ASCII[nome]}.png'
    print(nome, repinta(f'{B}/Player/Player.png', arq, m, (0, 0, 192, 96)))

print('pronto')
