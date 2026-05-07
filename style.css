/* ═══════════════════════════════════════════════════════════════
   TM DISTRI-MAT — style.css
   Palette : noir/anthracite · orange lumineux · blanc
   ═══════════════════════════════════════════════════════════════ */

:root {
  --c-black:   #080a0c;
  --c-deep:    #0d0f12;
  --c-card:    #111417;
  --c-border:  rgba(255,255,255,0.07);
  --c-orange:  #ff6b00;
  --c-orange2: #ff8c2a;
  --c-white:   #f0f2f5;
  --c-muted:   rgba(240,242,245,0.45);
  --font-head: 'Barlow Condensed', sans-serif;
  --font-body: 'Barlow', sans-serif;
  --radius:    4px;
  --gutter:    clamp(1.25rem, 4vw, 3rem);
}

/* ─── Reset ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--c-black);
  color: var(--c-white);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  overflow-x: hidden;
  cursor: default;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
ul { list-style: none; }
textarea, input { font-family: var(--font-body); }

.orange { color: var(--c-orange); }
.container { max-width: 1280px; margin: 0 auto; padding: 0 var(--gutter); }

/* ─── Scrollbar ─── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--c-black); }
::-webkit-scrollbar-thumb { background: var(--c-orange); border-radius: 2px; }

/* ══════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════ */
#navbar {
  position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
  z-index: 1000; width: calc(100% - 2rem); max-width: 1280px;
  transition: background .4s, box-shadow .4s, backdrop-filter .4s;
  border-radius: 12px;
  border: 1px solid transparent;
}
#navbar.scrolled {
  background: rgba(8,10,12,0.82);
  backdrop-filter: blur(18px);
  border-color: var(--c-border);
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.nav-inner {
  display: flex; align-items: center; gap: 2rem;
  padding: .75rem 1.5rem;
}
.nav-logo img { height: 38px; width: auto; }
.nav-links {
  display: flex; align-items: center; gap: 1.75rem;
  margin-left: auto;
}
.nav-links li a {
  font-family: var(--font-head);
  font-weight: 600; font-size: .9rem;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--c-muted);
  transition: color .25s;
  position: relative;
}
.nav-links li a::after {
  content: ''; position: absolute; bottom: -3px; left: 0; width: 0; height: 1px;
  background: var(--c-orange); transition: width .3s;
}
.nav-links li a:hover { color: var(--c-white); }
.nav-links li a:hover::after { width: 100%; }
.nav-cta {
  background: var(--c-orange) !important;
  color: #fff !important;
  padding: .55rem 1.25rem !important;
  border-radius: 6px;
  font-weight: 700 !important;
  transition: background .25s, transform .2s, box-shadow .25s !important;
  box-shadow: 0 0 18px rgba(255,107,0,.35);
}
.nav-cta:hover {
  background: var(--c-orange2) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 0 28px rgba(255,107,0,.6) !important;
}
.nav-cta::after { display: none !important; }
.nav-burger {
  display: none; background: none; border: none;
  cursor: pointer; flex-direction: column; gap: 5px; padding: .25rem;
  margin-left: auto;
}
.nav-burger span {
  display: block; width: 24px; height: 2px;
  background: var(--c-white); border-radius: 1px;
  transition: transform .3s, opacity .3s;
}

/* ══════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════ */
.hero-wrap {
  position: relative;
  height: 300vh;
}
.hero-pin {
  position: relative;
  width: 100%; height: 100vh;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--c-black);
}

/* fond technique */
.hero-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,107,0,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,107,0,.05) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}
.hero-halo {
  position: absolute; border-radius: 50%; pointer-events: none;
  filter: blur(80px);
}
.halo-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,107,0,.18) 0%, transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%,-50%);
}
.halo-2 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(255,140,42,.12) 0%, transparent 70%);
  top: 20%; right: 15%;
}
#heroCanvas {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
}

/* produits flottants */
.hero-float {
  position: absolute; z-index: 2; pointer-events: none;
  filter: drop-shadow(0 0 20px rgba(255,107,0,.3));
}
.hero-float img { width: 140px; height: auto; object-fit: contain; border-radius: 8px; }
.fp-1 { top: 20%; left: 8%; }
.fp-2 { bottom: 22%; left: 12%; }
.fp-3 { top: 25%; right: 10%; }

/* produit central */
.hero-product {
  position: relative; z-index: 3;
  display: flex; align-items: center; justify-content: center;
}
.hero-ring {
  position: absolute; width: 420px; height: 420px;
  border: 1px solid rgba(255,107,0,.2);
  border-radius: 50%;
  animation: rotRing 18s linear infinite;
}
.hero-ring::before {
  content: ''; position: absolute;
  top: -4px; left: 50%; transform: translateX(-50%);
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--c-orange);
  box-shadow: 0 0 12px var(--c-orange);
}
@keyframes rotRing { to { transform: rotate(360deg); } }
#heroImg {
  width: clamp(260px, 30vw, 420px);
  height: auto; object-fit: contain;
  filter: drop-shadow(0 20px 60px rgba(255,107,0,.4));
  position: relative; z-index: 2;
}
.hero-product-glow {
  position: absolute; width: 100%; height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.2) 0%, transparent 65%);
  pointer-events: none;
}

/* textes hero */
.hero-text-block {
  position: absolute; z-index: 5;
  left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 900px;
  text-align: center;
  pointer-events: none;
  top: 50%;
}
.hero-text-block { transform: translate(-50%, -50%); }
.hero-eyebrow {
  font-family: var(--font-head);
  font-size: .8rem; font-weight: 600;
  letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-orange); margin-bottom: 1.25rem;
}
.hero-title {
  font-family: var(--font-head);
  font-size: clamp(2.4rem, 6vw, 5.5rem);
  font-weight: 800; line-height: 1.05;
  letter-spacing: -.01em; text-transform: uppercase;
  color: var(--c-white);
}
.hero-args {
  display: flex; justify-content: center; gap: 2rem;
  margin-top: 2rem; flex-wrap: wrap;
}
.hero-args li {
  display: flex; align-items: center; gap: .5rem;
  font-size: .85rem; font-weight: 500;
  color: var(--c-muted); letter-spacing: .06em;
  text-transform: uppercase;
}
.dot {
  display: inline-block; width: 6px; height: 6px;
  border-radius: 50%; background: var(--c-orange);
  box-shadow: 0 0 8px var(--c-orange);
}

/* hero text 2 */
.hero-text-2 { opacity: 0; }
.hero-brand-reveal {
  display: flex; align-items: baseline; justify-content: center;
  gap: .5rem; line-height: 1;
}
.brand-tm {
  font-family: var(--font-head);
  font-size: clamp(4rem, 14vw, 13rem);
  font-weight: 900; letter-spacing: -.03em; color: var(--c-orange);
  text-transform: uppercase;
  text-shadow: 0 0 60px rgba(255,107,0,.5);
}
.brand-distri {
  font-family: var(--font-head);
  font-size: clamp(2rem, 7vw, 6.5rem);
  font-weight: 700; letter-spacing: -.01em; color: var(--c-white);
  text-transform: uppercase;
}
.hero-tagline {
  font-size: clamp(1rem, 2.2vw, 1.6rem);
  color: var(--c-muted); margin-top: .75rem;
  font-weight: 300; letter-spacing: .08em;
  text-transform: uppercase;
}

/* scroll indicator */
.scroll-ind {
  position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: .5rem;
  font-size: .7rem; letter-spacing: .15em; text-transform: uppercase;
  color: var(--c-muted); z-index: 10;
}
.scroll-line {
  width: 1px; height: 50px;
  background: linear-gradient(to bottom, var(--c-orange), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
@keyframes scrollPulse { 0%,100%{ opacity: .4; } 50%{ opacity: 1; } }

/* ══════════════════════════════════════════════════════════════
   SERVICE
══════════════════════════════════════════════════════════════ */
.section-service {
  position: relative; padding: 10rem 0;
  overflow: hidden;
}
.service-bg-products {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
}
.sbp { position: absolute; filter: blur(3px); opacity: .08; }
.sbp img { width: 200px; height: auto; object-fit: contain; }
.sbp1 { top: 5%; left: 3%; }
.sbp2 { top: 15%; right: 5%; }
.sbp3 { bottom: 10%; left: 8%; }
.sbp4 { bottom: 5%; right: 10%; }
.sbp5 { top: 45%; left: 45%; }
.service-text {
  position: relative; z-index: 2;
  max-width: 900px; margin: 0 auto; text-align: center;
}
.service-main {
  font-family: var(--font-head);
  font-size: clamp(1.8rem, 4.5vw, 4rem);
  font-weight: 700; line-height: 1.15;
  color: var(--c-white); margin-bottom: 2.5rem;
  text-transform: uppercase;
}
.service-secondary {
  font-size: clamp(1rem, 1.8vw, 1.3rem);
  color: var(--c-muted); line-height: 1.7;
  font-weight: 300;
}
.service-main em, .service-secondary em { font-style: normal; }

/* ══════════════════════════════════════════════════════════════
   QUI — STATS + CARTE
══════════════════════════════════════════════════════════════ */
.section-qui {
  padding: 8rem 0;
  background: linear-gradient(180deg, var(--c-black) 0%, var(--c-deep) 100%);
}
.section-label {
  font-family: var(--font-head);
  font-size: .75rem; font-weight: 700;
  letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-orange); margin-bottom: 1rem;
}
.section-title {
  font-family: var(--font-head);
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 800; text-transform: uppercase;
  color: var(--c-white); line-height: 1.05;
  margin-bottom: 3.5rem;
}
.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem; margin-bottom: 5rem;
}
.stat-card {
  position: relative; overflow: hidden;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  transition: border-color .3s, transform .3s;
}
.stat-card:hover { border-color: rgba(255,107,0,.4); transform: translateY(-4px); }
.stat-glow {
  position: absolute; inset: -50%; pointer-events: none;
  background: radial-gradient(circle, rgba(255,107,0,.08) 0%, transparent 60%);
}
.stat-num {
  font-family: var(--font-head);
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 900; color: var(--c-orange); line-height: 1;
  margin-bottom: .5rem;
  text-shadow: 0 0 30px rgba(255,107,0,.4);
}
.stat-label {
  font-family: var(--font-head);
  font-size: 1rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--c-white); margin-bottom: 1rem;
}
.stat-desc { font-size: .85rem; color: var(--c-muted); line-height: 1.5; }

/* Carte */
.map-block { margin-top: 4rem; }
.map-container {
  position: relative; display: inline-block; width: 100%;
  max-width: 700px; margin: 0 auto; display: block;
}
.map-img {
  width: 100%; height: auto;
  filter: saturate(.3) brightness(.7);
  border-radius: 12px;
}
.map-cities { position: absolute; inset: 0; }
.city-dot {
  position: absolute;
  left: var(--cx); top: var(--cy);
  transform: translate(-50%, -50%);
  cursor: default; opacity: 0;
}
.city-dot::before {
  content: ''; display: block;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--c-orange);
  box-shadow: 0 0 14px var(--c-orange);
  animation: citypulse 2s ease-in-out infinite;
}
.city-dot::after {
  content: attr(data-name);
  position: absolute; bottom: calc(100% + 6px); left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-head); font-size: .7rem;
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--c-white); white-space: nowrap;
  background: rgba(8,10,12,.8); padding: 2px 6px; border-radius: 3px;
}
@keyframes citypulse { 0%,100%{box-shadow:0 0 14px var(--c-orange);} 50%{box-shadow:0 0 24px var(--c-orange),0 0 40px rgba(255,107,0,.4);} }
.map-lines {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.map-line { stroke: var(--c-orange); stroke-width: 1; fill: none; opacity: .5; }

/* ══════════════════════════════════════════════════════════════
   PRODUITS STICKY
══════════════════════════════════════════════════════════════ */
.section-produits {
  position: relative;
  height: 500vh;
}
.produits-pin {
  position: relative; width: 100%; height: 100vh;
  background: var(--c-black); overflow: hidden;
  display: flex; align-items: center;
}
.prod-bg-glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 50% 60% at 30% 50%, rgba(255,107,0,.08) 0%, transparent 70%);
  pointer-events: none;
}
.prod-layout {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 4rem; width: 100%; max-width: 1280px;
  margin: 0 auto; padding: 0 var(--gutter);
  align-items: center;
}

/* visuel produit */
.prod-visual {
  position: relative; display: flex;
  align-items: center; justify-content: center;
  height: 60vh;
}
.prod-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(255,107,0,.15);
}
.prod-ring-outer { width: 380px; height: 380px; animation: rotRing 20s linear infinite; }
.prod-ring-inner { width: 260px; height: 260px; animation: rotRing 12s linear infinite reverse; }
.prod-halo {
  position: absolute; width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.2) 0%, transparent 70%);
  filter: blur(30px);
}
.prod-img-wrap {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: center;
}
#prodImg {
  max-width: 280px; max-height: 280px;
  width: auto; height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 40px rgba(255,107,0,.4));
  transition: filter .3s;
}
.prod-number {
  position: absolute; bottom: 2rem; right: 1rem;
  font-family: var(--font-head); font-size: 6rem;
  font-weight: 900; color: rgba(255,107,0,.06);
  line-height: 1; pointer-events: none; user-select: none;
}

/* contenu produit */
.prod-content { position: relative; }
.prod-cat {
  font-family: var(--font-head); font-size: .75rem;
  font-weight: 700; letter-spacing: .2em;
  text-transform: uppercase; color: var(--c-orange);
  margin-bottom: 1rem;
}
.prod-name {
  font-family: var(--font-head);
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 900; text-transform: uppercase;
  color: var(--c-white); line-height: 1; margin-bottom: 1.5rem;
}
.prod-desc {
  font-size: 1rem; color: var(--c-muted);
  line-height: 1.7; max-width: 480px;
  margin-bottom: 2rem;
}
.prod-progress {
  width: 100%; height: 2px;
  background: var(--c-border); margin-bottom: 2.5rem; border-radius: 1px;
}
.prod-progress-bar {
  height: 100%; background: var(--c-orange);
  border-radius: 1px; width: 14.28%;
  transition: width .4s ease;
  box-shadow: 0 0 8px var(--c-orange);
}

/* onglets produits */
.prod-tabs {
  display: flex; flex-wrap: wrap; gap: .5rem;
}
.ptab {
  background: none; border: 1px solid var(--c-border);
  color: var(--c-muted); border-radius: 6px;
  padding: .4rem .8rem;
  font-family: var(--font-head); font-size: .75rem;
  font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; cursor: pointer;
  transition: all .25s;
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
}
.ptab span { font-size: .65rem; font-weight: 400; color: var(--c-muted); }
.ptab:hover, .ptab.active {
  border-color: var(--c-orange);
  color: var(--c-orange);
  background: rgba(255,107,0,.08);
}
.ptab.active { box-shadow: 0 0 12px rgba(255,107,0,.2); }

/* ══════════════════════════════════════════════════════════════
   TRAME ZOOM
══════════════════════════════════════════════════════════════ */
.section-trame {
  padding: 8rem 0; overflow: hidden;
  background: linear-gradient(180deg, var(--c-black) 0%, var(--c-deep) 100%);
}
.trame-inner {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 5rem; align-items: center;
}
.trame-visual {
  position: relative; display: flex;
  align-items: center; justify-content: center; height: 50vh;
}
.trame-circle-glow {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.15) 0%, transparent 70%);
  filter: blur(40px);
}
.trame-ring {
  position: absolute; width: 350px; height: 350px; border-radius: 50%;
  border: 1px solid rgba(255,107,0,.2);
}
.trame-ring-rot { animation: rotRing 25s linear infinite; }
.trame-img {
  position: relative; z-index: 2;
  width: 70%; max-width: 280px; height: auto;
  filter: drop-shadow(0 0 30px rgba(255,107,0,.35));
}
.trame-magnify {
  position: absolute; z-index: 3;
  width: 120px; height: 120px; border-radius: 50%;
  border: 2px solid var(--c-orange);
  box-shadow: 0 0 20px rgba(255,107,0,.4);
  opacity: 0;
  background: rgba(255,107,0,.05);
  backdrop-filter: blur(2px);
  pointer-events: none;
}
.trame-dots { position: absolute; inset: 0; pointer-events: none; }
.tdot {
  position: absolute; left: var(--tx); top: var(--ty);
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--c-orange);
  box-shadow: 0 0 10px var(--c-orange);
  opacity: 0;
}
.trame-content { position: relative; }
.trame-title {
  font-family: var(--font-head);
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 800; text-transform: uppercase;
  color: var(--c-white); margin-bottom: 1.5rem;
}
.trame-sub { font-size: 1.05rem; color: var(--c-muted); line-height: 1.7; margin-bottom: 2rem; }
.trame-specs { display: flex; flex-direction: column; gap: .75rem; }
.ts-item {
  display: flex; align-items: center; gap: .75rem;
  font-family: var(--font-head); font-size: .85rem;
  font-weight: 600; text-transform: uppercase; letter-spacing: .1em;
  color: var(--c-white); opacity: 0; transform: translateX(-20px);
}
.ts-icon { color: var(--c-orange); font-size: .6rem; }

/* ══════════════════════════════════════════════════════════════
   IDENTITÉ
══════════════════════════════════════════════════════════════ */
.section-identite {
  min-height: 100vh; position: relative;
  display: flex; align-items: center; justify-content: center;
  background: var(--c-black); overflow: hidden;
}
.ident-wrap {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.ident-word {
  position: absolute;
  font-family: var(--font-head);
  font-size: clamp(2rem, 4.5vw, 4rem);
  font-weight: 700; text-transform: uppercase;
  color: var(--c-muted); letter-spacing: .05em;
}
.iw-1 { top: 15%; left: 10%; }
.iw-2 { top: 15%; right: 10%; }
.iw-3 { bottom: 15%; left: 10%; }
.iw-4 { bottom: 15%; right: 10%; }
.ident-final {
  position: relative; z-index: 2;
  display: flex; align-items: baseline;
  gap: .3em; opacity: 0;
  text-align: center;
}
.ident-tm {
  font-family: var(--font-head);
  font-size: clamp(5rem, 16vw, 14rem);
  font-weight: 900; color: var(--c-orange); line-height: 1;
  text-shadow: 0 0 80px rgba(255,107,0,.6);
}
.ident-distri {
  font-family: var(--font-head);
  font-size: clamp(2.5rem, 8vw, 7rem);
  font-weight: 700; color: var(--c-white); line-height: 1;
}
.ident-halo {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.2) 0%, transparent 70%);
  filter: blur(60px); pointer-events: none;
  left: 50%; top: 50%; transform: translate(-50%,-50%);
}

/* ══════════════════════════════════════════════════════════════
   TARIFS / LIVRAISON
══════════════════════════════════════════════════════════════ */
.section-tarifs {
  padding: 8rem 0;
  background: linear-gradient(180deg, var(--c-deep) 0%, var(--c-black) 100%);
}
.tarif-title { margin-bottom: 1rem !important; }
.tarif-sub { font-size: 1.1rem; color: var(--c-muted); margin-bottom: 3.5rem; }
.tarif-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1rem; margin-bottom: 3rem;
}
.tarif-card {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 12px; padding: 2rem 1.5rem;
  transition: border-color .3s, transform .3s;
  position: relative; overflow: hidden;
}
.tarif-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; background: linear-gradient(90deg, transparent, var(--c-orange), transparent);
  opacity: 0; transition: opacity .3s;
}
.tarif-card:hover { border-color: rgba(255,107,0,.4); transform: translateY(-3px); }
.tarif-card:hover::before { opacity: 1; }
.tc-icon {
  font-size: 1.2rem; color: var(--c-orange);
  margin-bottom: 1rem; letter-spacing: 4px;
}
.tc-tier {
  font-family: var(--font-head); font-size: .9rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--c-muted); margin-bottom: .5rem;
}
.tc-label {
  font-family: var(--font-head); font-size: 1.2rem; font-weight: 700;
  text-transform: uppercase; color: var(--c-white);
}
.tarif-phrase {
  text-align: center; font-size: 1.3rem;
  color: var(--c-white); font-weight: 500; margin-bottom: 4rem;
}
.depot-block {
  position: relative; border-radius: 16px; overflow: hidden;
  max-height: 400px;
}
.depot-img { width: 100%; height: 400px; object-fit: cover; }
.depot-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(8,10,12,.9) 100%);
}
.depot-label {
  position: absolute; bottom: 1.5rem; left: 2rem;
  display: flex; align-items: center; gap: .75rem;
  font-family: var(--font-head); font-size: 1rem;
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--c-white);
}
.depot-icon { width: 32px; height: auto; filter: brightness(0) invert(1); }

/* ══════════════════════════════════════════════════════════════
   PARTENAIRES
══════════════════════════════════════════════════════════════ */
.section-partenaires {
  padding: 8rem 0;
  background: var(--c-black);
}
.partners-grid {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}
.partner-card {
  position: relative; overflow: hidden;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 12px; padding: 2rem 1.5rem;
  text-align: center; cursor: default;
  transition: border-color .3s, transform .3s, box-shadow .3s;
}
.partner-card:hover {
  border-color: rgba(255,107,0,.5);
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(255,107,0,.15);
}
.pc-glow {
  position: absolute; inset: -100%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.12) 0%, transparent 60%);
  opacity: 0; transition: opacity .3s;
}
.partner-card:hover .pc-glow { opacity: 1; }
.pc-name {
  font-family: var(--font-head); font-size: 1rem;
  font-weight: 700; text-transform: uppercase;
  color: var(--c-white); margin-bottom: .5rem;
}
.pc-cat { font-size: .75rem; color: var(--c-muted); }

/* ══════════════════════════════════════════════════════════════
   DIRIGEANT
══════════════════════════════════════════════════════════════ */
.section-dirigeant {
  position: relative; padding: 10rem 0; overflow: hidden;
  min-height: 60vh; display: flex; align-items: center;
}
.dirigeant-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  background-attachment: fixed;
  filter: brightness(.3) saturate(.4);
}
.dirigeant-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(8,10,12,.5) 0%, rgba(8,10,12,.85) 100%);
}
.dirigeant-content { position: relative; z-index: 2; max-width: 800px; }
.quote-mark {
  font-family: var(--font-head); font-size: 8rem; line-height: .8;
  color: var(--c-orange); opacity: .4; margin-bottom: -2rem;
}
.dirigeant-quote {
  font-family: var(--font-head);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 400; line-height: 1.4;
  color: var(--c-white); font-style: italic;
  margin-bottom: 2rem;
}
.dirigeant-sig {
  display: flex; align-items: center; gap: 1.5rem;
  opacity: 0; transform: translateY(20px);
}
.sig-line { width: 40px; height: 1px; background: var(--c-orange); }
.dirigeant-sig span {
  font-size: .85rem; color: var(--c-muted);
  font-style: italic; letter-spacing: .05em;
}

/* ══════════════════════════════════════════════════════════════
   RECONNAISSANCE
══════════════════════════════════════════════════════════════ */
.section-reco {
  padding: 10rem 0; position: relative; overflow: hidden;
  background: var(--c-black);
}
.reco-halo {
  position: absolute; width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.1) 0%, transparent 70%);
  left: 50%; top: 50%; transform: translate(-50%,-50%);
  filter: blur(60px); pointer-events: none;
}
.reco-text {
  font-family: var(--font-head);
  font-size: clamp(1.8rem, 4.5vw, 4rem);
  font-weight: 700; text-align: center; line-height: 1.25;
  text-transform: uppercase; color: var(--c-white); max-width: 900px;
  margin: 0 auto; position: relative; z-index: 2;
}
.reco-text em { font-style: normal; }

/* ══════════════════════════════════════════════════════════════
   CONTACT
══════════════════════════════════════════════════════════════ */
.section-contact {
  padding: 8rem 0;
  background: linear-gradient(180deg, var(--c-deep) 0%, var(--c-black) 100%);
}
.contact-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 6rem; align-items: start;
}
.contact-left .section-title { margin-bottom: 1.5rem; }
.contact-desc { font-size: .95rem; color: var(--c-muted); line-height: 1.75; margin-bottom: 2.5rem; }
.contact-info { display: flex; flex-direction: column; gap: .75rem; }
.ci-item {
  display: flex; align-items: center; gap: .75rem;
  font-size: .9rem; color: var(--c-muted);
  transition: color .25s;
}
.ci-item:hover { color: var(--c-orange); }
.ci-icon { font-size: 1rem; color: var(--c-orange); }

/* formulaire */
.contact-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: .35rem; }
.form-field.full { grid-column: 1/-1; }
.form-field label {
  font-family: var(--font-head); font-size: .7rem;
  font-weight: 700; letter-spacing: .15em;
  text-transform: uppercase; color: var(--c-muted);
}
.form-field input,
.form-field textarea {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 8px; color: var(--c-white);
  padding: .75rem 1rem; font-size: .9rem;
  outline: none;
  transition: border-color .25s, box-shadow .25s;
}
.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--c-orange);
  box-shadow: 0 0 12px rgba(255,107,0,.15);
}
.form-field input::placeholder,
.form-field textarea::placeholder { color: rgba(255,255,255,.2); }
.form-field textarea { resize: vertical; min-height: 120px; }
.form-submit {
  display: flex; align-items: center; justify-content: center; gap: .75rem;
  background: var(--c-orange); border: none; border-radius: 8px;
  color: #fff; padding: 1rem 2rem; cursor: pointer;
  font-family: var(--font-head); font-size: 1rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: .1em;
  transition: background .25s, transform .2s, box-shadow .25s;
  box-shadow: 0 0 20px rgba(255,107,0,.3); margin-top: .5rem;
}
.form-submit:hover {
  background: var(--c-orange2); transform: translateY(-2px);
  box-shadow: 0 0 35px rgba(255,107,0,.5);
}
.btn-arrow { font-size: 1.2rem; transition: transform .25s; }
.form-submit:hover .btn-arrow { transform: translateX(4px); }

/* ══════════════════════════════════════════════════════════════
   FINALE
══════════════════════════════════════════════════════════════ */
.section-finale {
  min-height: 60vh; display: flex; align-items: center;
  justify-content: center; position: relative; overflow: hidden;
  background: var(--c-black);
}
.finale-halo {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,0,.2) 0%, transparent 70%);
  filter: blur(50px); pointer-events: none; transform: scale(0);
}
.finale-text {
  position: relative; z-index: 2;
  display: flex; flex-wrap: wrap; gap: .3em;
  align-items: baseline; justify-content: center;
  text-align: center;
}
.finale-word {
  font-family: var(--font-head);
  font-size: clamp(3.5rem, 10vw, 9rem);
  font-weight: 900; text-transform: uppercase; line-height: .95;
  color: var(--c-white); opacity: 0; transform: translateY(40px);
}
.finale-word.orange { color: var(--c-orange); text-shadow: 0 0 60px rgba(255,107,0,.6); }

/* ══════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════ */
.footer {
  background: var(--c-deep);
  border-top: 1px solid var(--c-border);
  padding: 4rem 0 0;
}
.footer-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 var(--gutter);
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 4rem;
  margin-bottom: 3rem;
}
.footer-logo { height: 40px; width: auto; margin-bottom: 1rem; }
.footer-brand p { font-size: .85rem; color: var(--c-muted); line-height: 1.6; }
.footer-nav-title {
  font-family: var(--font-head); font-size: .7rem;
  font-weight: 700; letter-spacing: .15em; text-transform: uppercase;
  color: var(--c-orange); margin-bottom: 1rem;
}
.footer-nav, .footer-contact { display: flex; flex-direction: column; gap: .5rem; }
.footer-nav a, .footer-contact a {
  font-size: .85rem; color: var(--c-muted);
  transition: color .25s;
}
.footer-nav a:hover, .footer-contact a:hover { color: var(--c-white); }
.footer-bottom {
  border-top: 1px solid var(--c-border);
  padding: 1.5rem var(--gutter);
  text-align: center; font-size: .75rem; color: var(--c-muted);
  max-width: 100%; margin: 0;
}

/* ══════════════════════════════════════════════════════════════
   REVEAL UTILITIES
══════════════════════════════════════════════════════════════ */
.reveal-from-left { opacity: 0; transform: translateX(-60px); }
.reveal-from-right { opacity: 0; transform: translateX(60px); }
.reveal-from-bottom { opacity: 0; transform: translateY(60px); }
.reveal-scale { opacity: 0; transform: scale(.9); }

/* ══════════════════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3,1fr); }
  .tarif-grid { grid-template-columns: repeat(2,1fr); }
  .partners-grid { grid-template-columns: repeat(3,1fr); }
  .prod-layout { gap: 2rem; }
  .prod-ring-outer { width: 280px; height: 280px; }
  .prod-ring-inner { width: 200px; height: 200px; }
}

@media (max-width: 768px) {
  .nav-links {
    display: none; position: fixed; inset: 0;
    background: rgba(8,10,12,.97); backdrop-filter: blur(20px);
    flex-direction: column; justify-content: center;
    gap: 2rem; z-index: 999;
  }
  .nav-links.open { display: flex; }
  .nav-links li a { font-size: 1.4rem; }
  .nav-burger { display: flex; z-index: 1001; }
  .hero-float { display: none; }
  .hero-ring { width: 260px; height: 260px; }
  .hero-text-block { padding: 0 1rem; }
  .prod-layout { grid-template-columns: 1fr; }
  .prod-visual { height: 35vh; }
  .prod-ring-outer { width: 220px; height: 220px; }
  .prod-ring-inner { width: 150px; height: 150px; }
  .stats-grid { grid-template-columns: 1fr; }
  .tarif-grid { grid-template-columns: repeat(2,1fr); }
  .partners-grid { grid-template-columns: repeat(2,1fr); }
  .contact-grid { grid-template-columns: 1fr; gap: 3rem; }
  .trame-inner { grid-template-columns: 1fr; }
  .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
  .ident-word { font-size: clamp(1.2rem, 4vw, 2.5rem); }
  .iw-1 { top: 8%; left: 5%; }
  .iw-2 { top: 8%; right: 5%; }
  .iw-3 { bottom: 8%; left: 5%; }
  .iw-4 { bottom: 8%; right: 5%; }
  .form-row { grid-template-columns: 1fr; }
  .hero-wrap { height: 200vh; }
  .section-produits { height: 400vh; }
  .brand-tm { font-size: clamp(3rem, 20vw, 8rem); }
  .brand-distri { font-size: clamp(1.5rem, 10vw, 4rem); }
  .dirigeant-bg { background-attachment: scroll; }
}

@media (max-width: 480px) {
  .tarif-grid { grid-template-columns: 1fr; }
  .partners-grid { grid-template-columns: 1fr; }
  .prod-tabs { gap: .3rem; }
  .ptab { font-size: .65rem; padding: .3rem .5rem; }
}
