/* ═══════════════════════════════════════════════════════════════
   TM DISTRI-MAT — script.js
   GSAP 3 + ScrollTrigger — scrollytelling premium
   ═══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ─── helper : isMobile ─── */
const isMobile = () => window.innerWidth <= 768;

/* ─── CANVAS : particules / étoiles de fond ─── */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a, b) { return Math.random() * (b - a) + a; }

  for (let i = 0; i < (isMobile() ? 40 : 100); i++) {
    particles.push({
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      r: rand(.4, 2),
      ox: rand(0, window.innerWidth),
      oy: rand(0, window.innerHeight),
      sp: rand(.0003, .0012),
      angle: rand(0, Math.PI * 2),
      alpha: rand(.2, .8),
      color: Math.random() > .7 ? '#ff6b00' : '#f0f2f5'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.angle += p.sp;
      p.x = p.ox + Math.cos(p.angle) * 40;
      p.y = p.oy + Math.sin(p.angle) * 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * (.4 + .6 * Math.abs(Math.sin(p.angle)));
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ─── NAVBAR ─── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.toggle('open');
      burger.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }
})();

/* ══════════════════════════════════════════════════════════════
   HERO — ScrollTrigger pin + animations
══════════════════════════════════════════════════════════════ */
(function initHero() {
  const heroWrap    = document.querySelector('.hero-wrap');
  const heroPinned  = document.getElementById('heroPinned');
  const heroImg     = document.getElementById('heroImg');
  const heroText1   = document.getElementById('heroText1');
  const heroText2   = document.getElementById('heroText2');
  const fp1 = document.getElementById('fp1');
  const fp2 = document.getElementById('fp2');
  const fp3 = document.getElementById('fp3');
  const scrollInd   = document.getElementById('scrollInd');

  if (!heroWrap || !heroPinned) return;

  /* apparition initiale cornière */
  gsap.fromTo(heroImg,
    { opacity: 0, scale: .65, rotation: -18, filter: 'blur(14px)' },
    { opacity: 1, scale: 1, rotation: 0, filter: 'blur(0px)',
      duration: 1.4, ease: 'power3.out', delay: .3 }
  );

  /* apparition args */
  gsap.from('.hero-eyebrow', { opacity: 0, y: 20, duration: .8, delay: .6 });
  gsap.from('.hero-title', { opacity: 0, y: 40, duration: 1, delay: .7, ease: 'power3.out' });
  gsap.from('.hero-args li', {
    opacity: 0, y: 20, stagger: .15, duration: .7, delay: 1.1, ease: 'power2.out'
  });

  /* produits flottants initiaux */
  if (!isMobile()) {
    gsap.from([fp1, fp2, fp3], {
      opacity: 0, scale: .5, stagger: .2, duration: 1, delay: 1.2, ease: 'back.out(1.4)'
    });
    /* flottement continu */
    gsap.to(fp1, { y: -18, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(fp2, { y: 14, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: .5 });
    gsap.to(fp3, { y: -22, duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
  }

  /* scroll indicator fade out */
  gsap.to(scrollInd, {
    opacity: 0, y: 10, duration: .6,
    scrollTrigger: { trigger: heroWrap, start: 'top top', end: '5% top', scrub: true }
  });

  if (isMobile()) {
    /* mobile : animations légères */
    gsap.to(heroImg, {
      scale: 1.3,
      scrollTrigger: { trigger: heroWrap, start: 'top top', end: 'bottom bottom', scrub: true }
    });
    return;
  }

  /* PIN hero */
  ScrollTrigger.create({
    trigger: heroWrap,
    start: 'top top',
    end: 'bottom bottom',
    pin: heroPinned,
    anticipatePin: 1
  });

  /* timeline hero au scroll */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroWrap,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    }
  });

  /* phase 1 (0 → .35) : zoom cornière */
  tl.to(heroImg, { scale: 2.2, rotation: 8, ease: 'none' }, 0)
    .to(heroText1, { opacity: 0, y: -60, ease: 'none' }, 0)
    .to([fp1, fp2, fp3], { opacity: 0, scale: 1.3, ease: 'none' }, 0);

  /* phase 2 (.35 → .7) : texte TM DISTRI-MAT */
  tl.to(heroImg, { opacity: .2, scale: 3, ease: 'none' }, .35)
    .fromTo(heroText2, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, ease: 'none' }, .35)
    .to(heroText2, { opacity: 1 }, .7);

  /* phase 3 (.7 → 1) : fade out tout */
  tl.to(heroPinned, { opacity: .6, ease: 'none' }, .8);
})();

/* ══════════════════════════════════════════════════════════════
   SERVICE — révélation texte
══════════════════════════════════════════════════════════════ */
(function initService() {
  const section = document.querySelector('.section-service');
  if (!section) return;

  /* produits bg parallax */
  document.querySelectorAll('.sbp').forEach((el, i) => {
    gsap.to(el, {
      y: (i % 2 === 0 ? -80 : 80),
      scrollTrigger: {
        trigger: section, start: 'top bottom', end: 'bottom top', scrub: true
      }
    });
  });

  /* texte principal mot par mot */
  ['#serviceMain', '#serviceSecondary'].forEach((sel, si) => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.from(el, {
      opacity: 0, y: 60,
      scrollTrigger: {
        trigger: el, start: 'top 80%', end: 'top 40%', scrub: .8
      }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   STATS — compteurs
══════════════════════════════════════════════════════════════ */
(function initStats() {
  const cards = document.querySelectorAll('.stat-card');
  cards.forEach((card, i) => {
    gsap.from(card, {
      opacity: 0, y: 60, scale: .95,
      duration: .8, delay: i * .15,
      scrollTrigger: { trigger: card, start: 'top 85%', once: true }
    });

    const counter = card.querySelector('.counter');
    if (!counter) return;
    const target = parseInt(counter.dataset.target);
    ScrollTrigger.create({
      trigger: card, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 2.2, ease: 'power2.out',
          onUpdate: function() {
            counter.textContent = Math.round(this.targets()[0].val);
          }
        });
      }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   CARTE OCCITANIE — réseau de villes
══════════════════════════════════════════════════════════════ */
(function initMap() {
  const mapContainer = document.querySelector('.map-container');
  const mapCities    = document.getElementById('mapCities');
  const mapLines     = document.getElementById('mapLines');
  const mapImg       = document.getElementById('mapImg');
  if (!mapContainer || !mapCities) return;

  const dots = Array.from(mapCities.querySelectorAll('.city-dot'));
  /* Narbonne d'abord, puis les autres */
  const order = [0, 6, 1, 2, 4, 5, 3]; // indices
  const sorted = order.map(i => dots[i]);

  /* dessiner les lignes SVG entre villes consécutives */
  function drawLines() {
    const rect = mapContainer.getBoundingClientRect();
    const cW = mapContainer.offsetWidth;
    const cH = mapContainer.offsetHeight;
    mapLines.setAttribute('viewBox', `0 0 ${cW} ${cH}`);

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const ax = parseFloat(a.style.getPropertyValue('--cx')) / 100 * cW;
      const ay = parseFloat(a.style.getPropertyValue('--cy')) / 100 * cH;
      const bx = parseFloat(b.style.getPropertyValue('--cx')) / 100 * cW;
      const by = parseFloat(b.style.getPropertyValue('--cy')) / 100 * cH;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', ax); line.setAttribute('y1', ay);
      line.setAttribute('x2', bx); line.setAttribute('y2', by);
      line.classList.add('map-line');
      const len = Math.sqrt((bx-ax)**2 + (by-ay)**2);
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.opacity = 0;
      mapLines.appendChild(line);
    }
  }

  ScrollTrigger.create({
    trigger: mapContainer, start: 'top 75%', once: true,
    onEnter: () => {
      drawLines();
      const lines = mapLines.querySelectorAll('.map-line');
      /* image fade in */
      gsap.to(mapImg, { opacity: 1, duration: .8 });
      /* villes + lignes en cascade */
      sorted.forEach((dot, i) => {
        gsap.to(dot, { opacity: 1, duration: .5, delay: i * .3 });
        if (lines[i]) {
          gsap.to(lines[i], {
            strokeDashoffset: 0, opacity: .5, duration: .6, delay: i * .3 + .2
          });
        }
      });
    }
  });

  /* image initialement sombre */
  gsap.set(mapImg, { opacity: .1 });
})();

/* ══════════════════════════════════════════════════════════════
   PRODUITS STICKY — gestion onglets + scroll
══════════════════════════════════════════════════════════════ */
(function initProduits() {
  const section     = document.querySelector('.section-produits');
  const pinned      = document.getElementById('produitsPinned');
  if (!section || !pinned) return;

  const PRODUCTS = [
    {
      num: '01', name: 'Adhésif',
      img: 'images/st390.jpg',
      desc: 'Adhésif chantier renforcé pour une tenue optimale, une protection efficace et une utilisation fiable sur les opérations quotidiennes.',
      cat: 'Consommables chantier'
    },
    {
      num: '02', name: 'Trame',
      img: 'images/trame.png',
      desc: 'Trame de renfort en fibre de verre pour systèmes d\'enduit de façade, avec bonne tenue mécanique et application durable.',
      cat: 'Façade & enduit'
    },
    {
      num: '03', name: 'Polyane',
      img: 'images/polyanne.png',
      desc: 'Film de protection bâtiment pour séparer, protéger et accompagner les phases de chantier.',
      cat: 'Protection chantier'
    },
    {
      num: '04', name: 'Sous-dallage',
      img: 'images/polyanne.png',
      desc: 'Solution de séparation et de protection dédiée aux besoins gros œuvre et dallage, avec une fourniture adaptée au volume.',
      cat: 'Dallage & gros œuvre'
    },
    {
      num: '05', name: 'Joint de dilatation',
      img: 'images/jointdedillatation.png',
      desc: 'Produit technique destiné à accompagner les mouvements des structures et à sécuriser les finitions sur chantier.',
      cat: 'Finition technique'
    },
    {
      num: '06', name: 'Taloche',
      img: 'images/talochemondelin.png',
      desc: 'Outil de finition pour les professionnels, conçu pour l\'application, le lissage et la régularité du travail sur chantier.',
      cat: 'Outillage finition'
    },
    {
      num: '07', name: 'Vis & jaquettes',
      img: 'images/visjaquette$.png',
      desc: 'Pièces adaptées aux machines à projeter, utiles pour maintenir la régularité du travail et limiter les interruptions.',
      cat: 'Machines à projeter'
    }
  ];

  const imgEl    = document.getElementById('prodImg');
  const numEl    = document.getElementById('prodNumber');
  const nameEl   = document.getElementById('prodName');
  const descEl   = document.getElementById('prodDesc');
  const catEl    = document.getElementById('prodCat');
  const barEl    = document.getElementById('prodBar');
  const tabs     = document.querySelectorAll('.ptab');

  let currentIdx = 0;
  let isAnimating = false;

  function switchProduct(idx, fromScroll) {
    if (idx === currentIdx && fromScroll) return;
    if (isAnimating) return;
    isAnimating = true;
    currentIdx = idx;

    const p = PRODUCTS[idx];

    /* barre progression */
    barEl.style.width = ((idx + 1) / PRODUCTS.length * 100) + '%';

    /* onglets */
    tabs.forEach((t, i) => t.classList.toggle('active', i === idx));

    /* animation sortie */
    const tl = gsap.timeline({
      onComplete: () => { isAnimating = false; }
    });
    tl.to(imgEl,  { opacity: 0, y: -40, scale: .9, rotation: -4, duration: .3, ease: 'power2.in' })
      .to(nameEl, { opacity: 0, y: -20, duration: .25, ease: 'power2.in' }, '<')
      .to(descEl, { opacity: 0, y: -15, duration: .2, ease: 'power2.in' }, '<.05')
      .call(() => {
        imgEl.src = p.img;
        imgEl.alt = p.name;
        numEl.textContent = p.num;
        nameEl.textContent = p.name;
        descEl.textContent = p.desc;
        catEl.textContent  = p.cat;
      })
      .fromTo(imgEl,
        { opacity: 0, y: 60, scale: .85, rotation: -8 },
        { opacity: 1, y: 0,  scale: 1,   rotation: 0,
          duration: .7, ease: 'back.out(1.4)' }
      )
      .fromTo(nameEl,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, '-=.4'
      )
      .fromTo(descEl,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: .45, ease: 'power2.out' }, '-=.35'
      );
  }

  /* tabs click */
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => switchProduct(i, false));
  });

  if (isMobile()) {
    /* mobile : pas de pin, scroll simple avec triggers */
    PRODUCTS.forEach((p, i) => {
      /* on simule juste un auto-play au scroll */
    });
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      onEnter: () => switchProduct(0, true)
    });
    return;
  }

  /* PIN */
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    pin: pinned,
    anticipatePin: 1,
    onUpdate: (self) => {
      const idx = Math.min(PRODUCTS.length - 1, Math.floor(self.progress * PRODUCTS.length));
      switchProduct(idx, true);
    }
  });

  /* apparition initiale */
  gsap.from(pinned, {
    opacity: 0, duration: .8,
    scrollTrigger: { trigger: section, start: 'top 80%', once: true }
  });
})();

/* ══════════════════════════════════════════════════════════════
   TRAME ZOOM
══════════════════════════════════════════════════════════════ */
(function initTrame() {
  const section  = document.querySelector('.section-trame');
  const trameImg = document.querySelector('.trame-img');
  const magnify  = document.getElementById('trameMagnify');
  const specs    = document.querySelectorAll('.ts-item');
  const tdots    = document.querySelectorAll('.tdot');

  if (!section) return;

  ScrollTrigger.create({
    trigger: section, start: 'top 70%', once: true,
    onEnter: () => {
      /* image */
      gsap.from(trameImg, { opacity: 0, scale: .8, rotation: -12, duration: 1.2, ease: 'back.out(1.3)' });
      /* loupe */
      gsap.to(magnify, { opacity: 1, duration: .6, delay: .8 });
      gsap.to(magnify, {
        x: 40, y: -30, scale: 1.2,
        duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1
      });
      /* points */
      tdots.forEach((d, i) => {
        gsap.to(d, { opacity: 1, duration: .4, delay: 1 + i * .2 });
        gsap.to(d, { scale: 1.5, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * .3 });
      });
      /* specs */
      specs.forEach((s, i) => {
        gsap.to(s, { opacity: 1, x: 0, duration: .5, delay: 1.2 + i * .15, ease: 'power2.out' });
      });
    }
  });

  /* zoom au scroll */
  gsap.to(trameImg, {
    scale: 1.3,
    scrollTrigger: {
      trigger: section, start: 'top bottom', end: 'bottom top', scrub: true
    }
  });
})();

/* ══════════════════════════════════════════════════════════════
   IDENTITÉ TM — animation mots → TM DISTRI-MAT
══════════════════════════════════════════════════════════════ */
(function initIdent() {
  const section   = document.querySelector('.section-identite');
  const identFinal = document.getElementById('identFinal');
  const words     = [
    document.getElementById('iw1'),
    document.getElementById('iw2'),
    document.getElementById('iw3'),
    document.getElementById('iw4')
  ];
  if (!section) return;

  /* centers */
  const cx = { iw1: '50%', iw2: '50%', iw3: '50%', iw4: '50%' };

  ScrollTrigger.create({
    trigger: section, start: 'top 60%', once: true,
    onEnter: () => {
      /* apparition mots */
      gsap.from(words, { opacity: 0, scale: .8, stagger: .15, duration: .6, ease: 'power2.out' });

      /* après délai : mots convergent + fade out */
      setTimeout(() => {
        const tl = gsap.timeline();
        tl.to(words[0], { x: '35vw', y: '25vh', opacity: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
          .to(words[1], { x: '-35vw', y: '25vh', opacity: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
          .to(words[2], { x: '35vw', y: '-25vh', opacity: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
          .to(words[3], { x: '-35vw', y: '-25vh', opacity: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
          .to(identFinal, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(1.2)' }, .8);
      }, 800);
    }
  });

  gsap.set(identFinal, { scale: .85 });
})();

/* ══════════════════════════════════════════════════════════════
   TARIFS
══════════════════════════════════════════════════════════════ */
(function initTarifs() {
  const cards = document.querySelectorAll('.tarif-card');
  cards.forEach((card, i) => {
    gsap.from(card, {
      opacity: 0, y: 50, scale: .96,
      duration: .7, delay: i * .12,
      scrollTrigger: { trigger: card, start: 'top 85%', once: true }
    });
  });

  gsap.from('.tarif-phrase', {
    opacity: 0, y: 30, duration: .8,
    scrollTrigger: { trigger: '.tarif-phrase', start: 'top 85%', once: true }
  });

  gsap.from('.depot-block', {
    opacity: 0, y: 40, duration: 1,
    scrollTrigger: { trigger: '.depot-block', start: 'top 80%', once: true }
  });
})();

/* ══════════════════════════════════════════════════════════════
   PARTENAIRES
══════════════════════════════════════════════════════════════ */
(function initPartners() {
  const cards = document.querySelectorAll('.partner-card');
  cards.forEach((card, i) => {
    gsap.from(card, {
      opacity: 0, y: 40, scale: .9, filter: 'blur(10px)',
      duration: .7, delay: i * .12,
      scrollTrigger: { trigger: card, start: 'top 88%', once: true }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   DIRIGEANT
══════════════════════════════════════════════════════════════ */
(function initDirigeant() {
  const section = document.querySelector('.section-dirigeant');
  const quote   = document.getElementById('dirigeantQuote');
  const sig     = document.getElementById('dirigeantSig');
  if (!section) return;

  gsap.from(quote, {
    opacity: 0, y: 60, duration: 1.2,
    scrollTrigger: { trigger: section, start: 'top 60%', once: true }
  });

  gsap.to(sig, {
    opacity: 1, y: 0, duration: .8, delay: .6,
    scrollTrigger: { trigger: section, start: 'top 60%', once: true }
  });

  /* parallax fond */
  if (!isMobile()) {
    gsap.to('.dirigeant-bg', {
      backgroundPositionY: '+=80px',
      scrollTrigger: {
        trigger: section, start: 'top bottom', end: 'bottom top', scrub: true
      }
    });
  }
})();

/* ══════════════════════════════════════════════════════════════
   RECONNAISSANCE — mots progressifs
══════════════════════════════════════════════════════════════ */
(function initReco() {
  const el = document.getElementById('recoText');
  if (!el) return;
  gsap.from(el, {
    opacity: 0, y: 80, scale: .95,
    duration: 1.2,
    scrollTrigger: { trigger: el, start: 'top 70%', once: true }
  });
})();

/* ══════════════════════════════════════════════════════════════
   CONTACT — apparition
══════════════════════════════════════════════════════════════ */
(function initContact() {
  const left  = document.getElementById('contactLeft');
  const right = document.getElementById('contactRight');
  if (!left || !right) return;

  gsap.from(left, {
    opacity: 0, x: -80, duration: 1,
    scrollTrigger: { trigger: left, start: 'top 75%', once: true }
  });
  gsap.from(right, {
    opacity: 0, x: 80, duration: 1,
    scrollTrigger: { trigger: right, start: 'top 75%', once: true }
  });

  /* champs formulaire cascade */
  const fields = document.querySelectorAll('.form-field');
  fields.forEach((f, i) => {
    gsap.from(f, {
      opacity: 0, y: 20, duration: .5, delay: i * .07,
      scrollTrigger: { trigger: right, start: 'top 70%', once: true }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   FINALE
══════════════════════════════════════════════════════════════ */
(function initFinale() {
  const section = document.querySelector('.section-finale');
  const halo    = document.getElementById('finaleHalo');
  const words   = document.querySelectorAll('.finale-word');
  if (!section) return;

  ScrollTrigger.create({
    trigger: section, start: 'top 60%', once: true,
    onEnter: () => {
      words.forEach((w, i) => {
        gsap.to(w, { opacity: 1, y: 0, duration: .8, delay: i * .25, ease: 'power3.out' });
      });
      gsap.to(halo, { scale: 2.5, opacity: 1, duration: 1.5, delay: .4, ease: 'power2.out' });
    }
  });

  gsap.set(halo, { opacity: 0 });
})();

/* ══════════════════════════════════════════════════════════════
   GÉNÉRIQUE — reveal au scroll (sections communes)
══════════════════════════════════════════════════════════════ */
(function initGenericReveal() {
  /* section labels & titles */
  document.querySelectorAll('.section-label, .section-title').forEach(el => {
    if (!el.closest('.hero-wrap')) {
      gsap.from(el, {
        opacity: 0, y: 30, duration: .8,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    }
  });
})();

/* ══════════════════════════════════════════════════════════════
   SECTION TARIFS — lignes orange animées
══════════════════════════════════════════════════════════════ */
(function initTarifLines() {
  const section = document.querySelector('.section-tarifs');
  if (!section) return;
  /* lignes CSS pseudo-éléments — pas besoin de JS supplémentaire */
})();

/* ══════════════════════════════════════════════════════════════
   REFRESH ScrollTrigger après chargement images
══════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});

/* ══════════════════════════════════════════════════════════════
   FORMULAIRE — mailto fallback
══════════════════════════════════════════════════════════════ */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  /* le formulaire utilise method="get" enctype="text/plain" → mailto natif */
  /* micro animation bouton au survol déjà en CSS */
  form.addEventListener('submit', (e) => {
    const btn = form.querySelector('.form-submit');
    btn.style.transform = 'scale(.97)';
    setTimeout(() => { btn.style.transform = ''; }, 200);
  });
})();
