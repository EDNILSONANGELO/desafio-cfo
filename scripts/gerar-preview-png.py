# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1100, 430

BG      = (6,  16,  30)
CARD_BG = (10, 22,  40)
NAVY    = (13, 31,  53)
BLUE    = (77, 142, 240)
BLUE_B  = (59, 130, 246)
GOLD    = (201,165, 32)
WHITE   = (255,255,255)
LIGHT   = (232,237,245)
GRAY    = (100,116,139)
GRAY2   = (148,163,184)
INPUT_BG= (15, 30,  53)
INPUT_BD= (30, 55,  90)

def font(size, bold=False):
    for p in (["C:/Windows/Fonts/calibrib.ttf","C:/Windows/Fonts/arialbd.ttf"]
              if bold else
              ["C:/Windows/Fonts/calibri.ttf","C:/Windows/Fonts/arial.ttf"]):
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except: pass
    return ImageFont.load_default()

def rr(draw, x1,y1,x2,y2, r, fill=None, outline=None, ow=1):
    draw.rounded_rectangle([x1,y1,x2,y2], radius=r, fill=fill, outline=outline, width=ow)

def cx(draw, txt, fnt, x1, x2, y, col):
    tw = int(draw.textlength(txt, font=fnt))
    draw.text(((x1+x2-tw)//2, y), txt, font=fnt, fill=col)

img  = Image.new("RGB", (W,H), BG)
draw = ImageDraw.Draw(img)

# glow sutil
for (gx,gy,gr,gc) in [(820,60,280,BLUE),(80,580,220,(124,58,237))]:
    g = Image.new("RGBA",(W,H),(0,0,0,0))
    ImageDraw.Draw(g).ellipse([gx-gr,gy-gr,gx+gr,gy+gr], fill=(*gc,18))
    base = img.convert("RGBA")
    img  = Image.alpha_composite(base, g).convert("RGB")
    draw = ImageDraw.Draw(img)

# barra topo
draw.rectangle([0,0,W,5], fill=BLUE)

# ── ESQUERDA ──────────────────────────────────────────────────────────────
# Logo
rr(draw, 36,28, 72,64, 8, fill=BLUE)
draw.rectangle([48,38, 60,42], fill=WHITE)
draw.rectangle([48,50, 60,54], fill=WHITE)
draw.ellipse(  [52,44, 56,48], fill=WHITE)
draw.text((80,30), "Arena Contábil",           font=font(15,True), fill=WHITE)
draw.text((80,49), "Business Accounting Simulator", font=font(9),  fill=GRAY2)

# separador + badge UniFECAF
draw.rectangle([240,31,242,61], fill=GRAY)
rr(draw, 250,24, 370,68, 8, fill=WHITE)
draw.text((262,34), "UniFECAF", font=font(14,True), fill=(10,22,40))
draw.rectangle([262,55, 360,57], fill=GOLD)

# Headline
f44 = font(44,True); f42 = font(42,True)
draw.text((36,100), "Aprenda contabilidade", font=f44, fill=WHITE)
draw.text((36,153), "competindo",            font=f44, fill=BLUE)

# Descrição
f13 = font(13)
draw.text((36,215), "Gerencie uma empresa de garrafas sustentáveis, tome",     font=f13, fill=GRAY2)
draw.text((36,234), "decisões financeiras e contábeis estratégicas e supere",  font=f13, fill=GRAY2)
draw.text((36,253), "seus concorrentes no mercado.",                           font=f13, fill=GRAY2)

# Badges
badges = [("🏆","Ranking automático"),("🏢","Empresas por região"),
          ("🔄","Rodadas online"),    ("🔒","Segurança por grupo")]
f12b = font(12,True)
for i,(ico,lbl) in enumerate(badges):
    bx = 36 + (i%2)*220
    by = 285 + (i//2)*46
    rr(draw, bx, by, bx+210, by+36, 18, fill=NAVY, outline=INPUT_BD)
    draw.text((bx+12, by+9),  ico, font=font(13),  fill=WHITE)
    draw.text((bx+36, by+10), lbl, font=f12b,      fill=LIGHT)

# ── DIREITA — Card login ──────────────────────────────────────────────────
RX1=480; RX2=W-24; RY1=22; RY2=H-22
rr(draw, RX1,RY1,RX2,RY2, 16, fill=CARD_BG, outline=(77,142,240), ow=1)

# Abas
tab_w = (RX2-RX1-36)//3 - 3
tx=RX1+14; TY=56
for lbl,active in [("Professor",True),("Aluno (RA)",False),("Master",False)]:
    if active:
        rr(draw, tx, TY, tx+tab_w, TY+34, 17, fill=BLUE_B)
        cx(draw, lbl, font(12,True), tx, tx+tab_w, TY+10, WHITE)
    else:
        rr(draw, tx, TY, tx+tab_w, TY+34, 17, fill=NAVY, outline=INPUT_BD)
        # Master com ícone escudo
        prefix = "⊙ " if lbl=="Master" else ""
        cx(draw, prefix+lbl, font(12), tx, tx+tab_w, TY+11, GRAY2)
    tx += tab_w+5

# Campo email
FX1=RX1+22; FX2=RX2-22
EY=110
draw.text((FX1,EY), "E-mail", font=font(11,True), fill=LIGHT)
rr(draw, FX1,EY+18, FX2,EY+50, 9, fill=INPUT_BG, outline=INPUT_BD)
draw.text((FX1+12,EY+30), "professor@arenacontabil.com", font=font(11), fill=GRAY)

# Campo senha
PY=EY+72
draw.text((FX1,PY), "Senha", font=font(11,True), fill=LIGHT)
rr(draw, FX1,PY+18, FX2,PY+50, 9, fill=INPUT_BG, outline=INPUT_BD)
draw.text((FX1+12,PY+29), "•••••••", font=font(15), fill=GRAY)
draw.text((FX2-26,PY+29), "👁",      font=font(13), fill=GRAY)

# Botão
BY=PY+70
rr(draw, FX1,BY, FX2,BY+46, 11, fill=BLUE_B)
cx(draw, "Entrar na plataforma", font(13,True), FX1, FX2, BY+14, WHITE)

# Rodapé do card
draw.text((FX1,BY+56),
    "EcoBottle Ind. de Garrafas Sustentáveis · Simulação acadêmica",
    font=font(9), fill=GRAY)

# ── Rodapé geral ──────────────────────────────────────────────────────────
draw.rectangle([0,H-32,W,H], fill=(3,11,22))
tw_f = int(draw.textlength("Sistema idealizado e desenvolvido por Prof. Ednilson Angelo  |  UniFECAF", font=font(9)))
draw.text(((W-tw_f)//2, H-20),
    "Sistema idealizado e desenvolvido por Prof. Ednilson Angelo  |  UniFECAF",
    font=font(9), fill=(71,85,105))

# ── Salvar ────────────────────────────────────────────────────────────────
out = "C:/Users/ednil/desafio-cfo/arena-contabil-preview.png"
img.save(out, "PNG", dpi=(150,150))
print(f"Salvo: {out}  ({W}x{H}px)")
