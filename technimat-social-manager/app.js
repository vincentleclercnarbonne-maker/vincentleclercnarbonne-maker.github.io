(function () {
  "use strict";

  const STORAGE_KEY = "technimat-social-github-v2";
  const HISTORY_KEY = "technimat-social-history-v2";
  const NAV = [
    ["dashboard", "⌂", "Tableau de bord"],
    ["proposals", "✦", "Propositions"],
    ["calendar", "□", "Calendrier"],
    ["profile", "○", "Profil"],
    ["stats", "↗", "Statistiques"],
    ["history", "↺", "Historique"]
  ];
  const STATUS = {
    proposed: "À valider",
    validated: "Validée",
    refused: "Refusée",
    published: "Publiée"
  };

  let data = null;
  let posts = [];
  let page = "dashboard";
  let localEvents = [];
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
  })[char]);

  function formatDate(value, withTime = false) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(new Date(value));
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveLocal() {
    const saved = {};
    posts.forEach(post => {
      saved[post.id] = {
        hook: post.hook,
        caption: post.caption,
        cta: post.cta,
        hashtags: post.hashtags,
        status: post.status,
        photo: post.photo || ""
      };
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      showToast("Stockage plein : téléchargez votre photo.");
    }
  }

  function addHistory(title, detail) {
    localEvents.unshift({
      id: `local-${Date.now()}`,
      date: new Date().toISOString(),
      title,
      detail,
      type: "status"
    });
    localEvents = localEvents.slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(localEvents));
  }

  function composePost(post) {
    return `${post.hook}\n\n${post.caption}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;
  }

  function statusPill(post) {
    return `<span class="status-pill ${post.status}">${esc(STATUS[post.status])}</span>`;
  }

  function photoPreview(post) {
    if (post.photo) {
      return `<img class="post-photo" src="${post.photo}" alt="Photo ajoutée pour ${esc(post.internalTitle)}">`;
    }
    return `<div class="photo-placeholder">
      <span class="camera-mark">⌁</span>
      <strong>Votre photo réelle ici</strong>
      <small>Recadrage automatique · 1200 × 627 px</small>
    </div>`;
  }

  function pageIntro(eyebrow, title, description, action = "") {
    return `<div class="page-intro"><div>
      <span class="eyebrow">${esc(eyebrow)}</span>
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
    </div>${action}</div>`;
  }

  function metric(value, label, detail, accent = false) {
    return `<article class="metric-card${accent ? " accent" : ""}">
      <span class="metric-value${String(value).length > 10 ? " compact" : ""}">${esc(value)}</span>
      <strong>${esc(label)}</strong><small>${esc(detail)}</small>
    </article>`;
  }

  function dashboard() {
    const validated = posts.filter(post => post.status === "validated").length;
    const active = data.tasks.filter(task => task.state === "active").length;
    const current = posts.find(post => post.status === "proposed") || posts[0];
    return `${pageIntro(
      "Mercredi 29 juillet",
      "Bonjour Vincent.",
      "Vos contenus TECHNIMAT sont prêts à être vérifiés.",
      `<button class="primary-button" data-page="proposals">Voir les 3 propositions</button>`
    )}
    <section class="metric-grid">
      ${metric(posts.length, "Propositions aujourd’hui", "Créées à 8 h 15", true)}
      ${metric(validated, "Contenus validés", "Prêts à publier")}
      ${metric(`${active}/${data.tasks.length}`, "Automatisations actives", active === data.tasks.length ? "Fonctionnement normal" : "Connexion à finaliser")}
      ${metric(formatDate(data.lastSync, true), "Dernière synchronisation", "Données à jour")}
    </section>
    <div class="dashboard-grid">
      <section class="panel featured-panel">
        <div class="panel-heading"><div><span class="eyebrow">À publier maintenant</span><h2>La priorité du jour</h2></div><span class="live-badge">Recommandé</span></div>
        ${current ? `<div class="featured-post">${photoPreview(current)}<div class="featured-copy">
          <div class="tag-row"><span class="format-tag">${esc(current.format)}</span><span>${esc(current.recommendedTime)}</span></div>
          <h3>${esc(current.internalTitle)}</h3><blockquote>${esc(current.hook)}</blockquote>
          <p>${esc(current.caption)}</p>
          <button class="text-button" data-open="${current.id}">Ouvrir la proposition <span>→</span></button>
        </div></div>` : "<p>Aucune proposition disponible.</p>"}
      </section>
      <section class="panel automation-panel">
        <div class="panel-heading"><div><span class="eyebrow">Pilotage</span><h2>Automatisations</h2></div></div>
        <div class="task-list">${data.tasks.map(task => `<div class="task-row">
          <span class="task-state ${task.state}"></span>
          <div><strong>${esc(task.title)}</strong><span>${esc(task.schedule)}</span></div>
          <small>${esc(task.detail)}</small>
        </div>`).join("")}</div>
        <div class="rule-note"><span>✓</span><div><strong>Contrôle anti-répétition actif</strong><p>Angles, accroches, photos, formats et appels à l’action sont comparés à l’historique.</p></div></div>
      </section>
    </div>
    <section class="panel quick-list">
      <div class="panel-heading"><div><span class="eyebrow">Sélection du jour</span><h2>Les 3 propositions</h2></div><button class="text-button" data-page="proposals">Tout afficher →</button></div>
      <div class="quick-posts">${posts.map((post, index) => `<button class="quick-post" data-open="${post.id}">
        <span class="quick-number">0${index + 1}</span><div><small>${esc(post.theme)} · ${esc(post.format)}</small><strong>${esc(post.internalTitle)}</strong></div>
        ${statusPill(post)}<span class="arrow">→</span>
      </button>`).join("")}</div>
    </section>`;
  }

  function proposals() {
    return `${pageIntro("Instagram · Aujourd’hui", "3 angles. Un seul choix à faire.", "Chaque proposition répond à un objectif, un format et un public différents.")}
    <div class="quality-banner"><span>Photo réelle uniquement</span><p>Aucun prix, stock ou événement n’est inventé. Vérifiez les points indiqués avant publication.</p></div>
    <section class="proposal-grid">${posts.map((post, index) => `<article class="proposal-card">
      <div class="card-visual">${photoPreview(post)}<div class="card-number">0${index + 1}</div>${statusPill(post)}</div>
      <div class="proposal-body">
        <div class="tag-row"><span class="format-tag">${esc(post.format)}</span><span>${formatDate(post.recommendedDate)} · ${esc(post.recommendedTime)}</span></div>
        <h2>${esc(post.internalTitle)}</h2><blockquote>${esc(post.hook)}</blockquote><p class="excerpt">${esc(post.caption)}</p>
        <div class="photo-advice"><span>Photo conseillée</span><p>${esc(post.photoRecommendation)}</p></div>
        <div class="card-actions">
          <label class="secondary-button file-button">${post.photo ? "Remplacer la photo" : "Ajouter ma photo"}<input class="photo-file-input" type="file" accept="image/*" data-photo="${post.id}"></label>
          <button class="icon-button" data-copy="${post.id}">Copier</button>
          <button class="primary-button" data-open="${post.id}">Ouvrir</button>
        </div>
      </div>
    </article>`).join("")}</section>`;
  }

  function calendar() {
    const days = [
      ["2026-07-27", "Lun.", "27"], ["2026-07-28", "Mar.", "28"],
      ["2026-07-29", "Mer.", "29"], ["2026-07-30", "Jeu.", "30"],
      ["2026-07-31", "Ven.", "31"], ["2026-08-01", "Sam.", "01"],
      ["2026-08-02", "Dim.", "02"]
    ];
    return `${pageIntro("Semaine 31", "Calendrier éditorial", "Les créneaux sont recommandés selon le format et le public professionnel.")}
    <section class="calendar-panel panel"><div class="calendar-header"><div><strong>27 juillet — 2 août 2026</strong><span>3 propositions · 1 Reel inclus</span></div><div class="calendar-legend"><i></i> Recommandation</div></div>
    <div class="calendar-grid">${days.map(day => {
      const dayPosts = posts.filter(post => post.recommendedDate.startsWith(day[0]));
      return `<article class="calendar-day${day[0] === "2026-07-29" ? " today" : ""}">
        <header><span>${day[1]}</span><strong>${day[2]}</strong></header>
        <div class="calendar-slots">${dayPosts.length ? dayPosts.map(post => `<div class="calendar-post"><small>${esc(post.recommendedTime)} · ${esc(post.format)}</small><strong>${esc(post.internalTitle)}</strong>${statusPill(post)}</div>`).join("") : '<span class="empty-day">Aucun contenu</span>'}</div>
      </article>`;
    }).join("")}</div></section>`;
  }

  function profile() {
    const profile = data.profile;
    return `${pageIntro("Identité du compte", "Profil TECHNIMAT", "Les informations utilisées pour garder des contenus cohérents et exacts.")}
    <div class="profile-layout">
      <section class="panel profile-card"><div class="profile-avatar">T</div><div><span class="eyebrow">Compte Instagram</span><h2>${esc(profile.name)}</h2><strong class="handle">${esc(profile.handle)}</strong><p>${esc(profile.description)}</p><a class="primary-button" href="${esc(profile.instagramUrl)}" target="_blank" rel="noreferrer">Ouvrir le profil</a></div></section>
      <section class="panel profile-details">
        <div class="field-row"><span>Positionnement</span><strong>${esc(profile.title)}</strong></div>
        <div class="field-row"><span>Adresse</span><strong>${esc(profile.address)}</strong></div>
        <div class="field-row"><span>Site Internet</span><strong>${esc(profile.website)}</strong><button data-copy-value="${esc(profile.website)}">Copier</button></div>
        <div class="field-row stacked"><span>Univers éditoriaux</span><div class="skill-list">${profile.skills.map(skill => `<i>${esc(skill)}</i>`).join("")}</div></div>
      </section>
    </div>
    <section class="panel profile-rule"><span class="rule-icon">!</span><div><h3>Règle d’identité</h3><p>Les contenus doivent donner l’impression d’avoir été créés directement par l’équipe TECHNIMAT, à partir de son activité réelle, de ses produits et de son magasin.</p></div></section>`;
  }

  function stats() {
    return `${pageIntro("Performance", "Statistiques", "Une vue honnête, sans chiffre privé ou performance inventée.")}
    <section class="panel stats-empty"><div class="stats-illustration"><span>↗</span><i></i><i></i><i></i></div><span class="eyebrow">Connexion requise</span><h2>Les statistiques Instagram ne sont pas connectées</h2><p>${esc(data.stats.message)}</p><div class="future-metrics"><span>Portée</span><span>Interactions</span><span>Abonnés</span><span>Clics</span></div></section>
    <section class="panel transparent-note"><strong>Pourquoi cette page est vide ?</strong><p>L’application n’invente aucune donnée privée. Les résultats pourront être ajoutés depuis une source fiable ou un export officiel.</p></section>`;
  }

  function history() {
    const items = [...localEvents, ...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `${pageIntro("Traçabilité", "Historique", "Les synchronisations et décisions importantes sont conservées pour éviter les répétitions.")}
    <section class="panel history-list">${items.map(item => `<article class="history-row"><span class="history-icon ${item.type}">${item.type === "sync" ? "↻" : item.type === "content" ? "✦" : "✓"}</span><div><small>${formatDate(item.date, true)}</small><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div></article>`).join("")}</section>`;
  }

  function render() {
    const content = $("#pageContent");
    content.innerHTML = ({ dashboard, proposals, calendar, profile, stats, history })[page]();
    $$("#desktopNav button, #mobileNav button").forEach(button => {
      button.classList.toggle("active", button.dataset.page === page);
    });
    bindDynamic();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildNav() {
    $("#desktopNav").innerHTML = NAV.map(item => `<button class="nav-item" data-page="${item[0]}" type="button"><span class="nav-icon">${item[1]}</span><span>${item[2]}</span>${item[0] === "proposals" ? `<span class="nav-count">${posts.length}</span>` : ""}</button>`).join("");
    $("#mobileNav").innerHTML = NAV.map(item => `<button data-page="${item[0]}" type="button"><span>${item[1]}</span><small>${item[2] === "Tableau de bord" ? "Accueil" : item[2]}</small></button>`).join("");
    $$("#desktopNav button, #mobileNav button").forEach(button => {
      button.onclick = () => { page = button.dataset.page; render(); };
    });
  }

  function updatePost(id, patch) {
    const post = posts.find(item => item.id === id);
    if (!post) return;
    Object.assign(post, patch);
    saveLocal();
  }

  async function copyText(post) {
    await navigator.clipboard.writeText(composePost(post));
    showToast("Texte copié.");
  }

  function downloadPhoto(post) {
    if (!post.photo) return;
    const link = document.createElement("a");
    link.href = post.photo;
    link.download = `technimat-${post.id}.jpg`;
    link.click();
  }

  async function cropImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("Type incorrect");
    const source = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = reject;
        element.src = source;
      });
      const width = 1200;
      const height = 627;
      const ratio = width / height;
      let sx = 0, sy = 0, sw = image.width, sh = image.height;
      if (image.width / image.height > ratio) {
        sw = image.height * ratio;
        sx = (image.width - sw) / 2;
      } else {
        sh = image.width / ratio;
        sy = (image.height - sh) / 2;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.86);
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  async function handlePhoto(input) {
    const post = posts.find(item => item.id === input.dataset.photo);
    const file = input.files && input.files[0];
    input.value = "";
    if (!post || !file) return;
    try {
      post.photo = await cropImage(file);
      saveLocal();
      addHistory(`Photo ajoutée · ${post.internalTitle}`, "Une photo réelle a été recadrée en 1200 × 627 px sur cet appareil.");
      showToast("Photo enregistrée sur cet appareil.");
      render();
    } catch {
      showToast("Cette image n’a pas pu être traitée.");
    }
  }

  function setStatus(post, status) {
    updatePost(post.id, { status });
    addHistory(`${STATUS[status]} · ${post.internalTitle}`, `Statut modifié en « ${STATUS[status]} ».`);
    showToast(`Proposition ${STATUS[status].toLowerCase()}.`);
    closeModal();
    render();
  }

  function openModal(id) {
    const post = posts.find(item => item.id === id);
    if (!post) return;
    $("#modalRoot").innerHTML = `<div class="modal-backdrop"><section class="post-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <header class="modal-header"><div><span class="eyebrow">${esc(post.theme)} · ${esc(post.format)}</span><h2 id="modalTitle">${esc(post.internalTitle)}</h2></div><button class="close-button" data-close type="button" aria-label="Fermer">×</button></header>
      <div class="modal-content"><aside class="modal-side">${photoPreview(post)}
        <label class="primary-button file-button full">${post.photo ? "Remplacer la photo" : "Ajouter ma photo réelle"}<input class="photo-file-input" type="file" accept="image/*" data-photo="${post.id}"></label>
        <div class="photo-instruction"><span>Photo à réaliser</span><p>${esc(post.photoRecommendation)}</p></div>
        <div class="detail-stack"><div><span>Objectif</span><strong>${esc(post.objective)}</strong></div><div><span>Public visé</span><strong>${esc(post.audience)}</strong></div><div><span>Angle</span><strong>${esc(post.angle)}</strong></div><div><span>Publication</span><strong>${formatDate(post.recommendedDate)} à ${esc(post.recommendedTime)}</strong></div></div>
      </aside><div class="modal-main">
        <label class="edit-field"><span>Accroche</span><textarea id="editHook" rows="2">${esc(post.hook)}</textarea></label>
        <label class="edit-field"><span>Texte complet</span><textarea id="editCaption" rows="7">${esc(post.caption)}</textarea></label>
        <label class="edit-field"><span>Appel à l’action</span><textarea id="editCta" rows="2">${esc(post.cta)}</textarea></label>
        <label class="edit-field"><span>Hashtags</span><input id="editHashtags" value="${esc(post.hashtags.join(" "))}"></label>
        ${post.reelPlan ? `<section class="reel-plan"><div><span>Plan du Reel</span><strong>${esc(post.reelPlan.duration)}</strong></div><h3>${esc(post.reelPlan.screenTitle)}</h3><ol>${post.reelPlan.sequences.map(sequence => `<li>${esc(sequence)}</li>`).join("")}</ol><p><strong>Phrase finale :</strong> ${esc(post.reelPlan.finalLine)}</p></section>` : ""}
        <section class="why-block"><span>Pourquoi ce choix ?</span><p>${esc(post.rationale)}</p></section>
        <section class="check-block"><span>À vérifier avant publication</span><ul>${post.checks.map(check => `<li>✓ ${esc(check)}</li>`).join("")}</ul></section>
      </div></div>
      <footer class="modal-footer"><div class="footer-tools"><button data-copy="${post.id}">Copier le texte</button><button data-download="${post.id}" ${post.photo ? "" : "disabled"}>Télécharger la photo</button></div><div class="footer-status"><button class="refuse-button" data-status="refused">Refuser</button><button class="validate-button" data-status="validated">Valider</button><button class="instagram-button" data-instagram="${post.id}">Ouvrir Instagram ↗</button></div></footer>
    </section></div>`;
    document.body.classList.add("modal-open");
    const root = $("#modalRoot");
    $("[data-close]", root).onclick = closeModal;
    $(".modal-backdrop", root).onclick = event => { if (event.target.classList.contains("modal-backdrop")) closeModal(); };
    $$(".edit-field textarea, .edit-field input", root).forEach(field => {
      field.onchange = () => {
        const tags = $("#editHashtags", root).value.trim().split(/\s+/).filter(Boolean);
        updatePost(post.id, {
          hook: $("#editHook", root).value,
          caption: $("#editCaption", root).value,
          cta: $("#editCta", root).value,
          hashtags: tags
        });
      };
    });
    $$("[data-status]", root).forEach(button => { button.onclick = () => setStatus(post, button.dataset.status); });
    $("[data-copy]", root).onclick = () => copyText(post);
    const download = $("[data-download]", root);
    if (!download.disabled) download.onclick = () => downloadPhoto(post);
    $("[data-instagram]", root).onclick = async () => {
      await copyText(post);
      if (post.photo) downloadPhoto(post);
      window.open(data.profile.instagramUrl || "https://www.instagram.com/", "_blank");
    };
    $("[data-photo]", root).onchange = event => handlePhoto(event.target);
  }

  function closeModal() {
    $("#modalRoot").innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  function bindDynamic() {
    $$("[data-page]", $("#pageContent")).forEach(button => { button.onclick = () => { page = button.dataset.page; render(); }; });
    $$("[data-open]").forEach(button => { button.onclick = () => openModal(button.dataset.open); });
    $$("[data-copy]").forEach(button => {
      button.onclick = () => {
        const post = posts.find(item => item.id === button.dataset.copy);
        if (post) copyText(post);
      };
    });
    $$("[data-copy-value]").forEach(button => {
      button.onclick = async () => {
        await navigator.clipboard.writeText(button.dataset.copyValue);
        showToast("Information copiée.");
      };
    });
    $$("[data-photo]").forEach(input => { input.onchange = event => handlePhoto(event.target); });
  }

  async function forceRefresh() {
    const button = $("#forceRefresh");
    button.classList.add("spinning");
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set("refresh", Date.now());
      window.location.replace(url);
    }
  }

  async function init() {
    try {
      const response = await fetch(`./data.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Données indisponibles");
      data = await response.json();
      const saved = loadLocal();
      posts = data.posts.map(post => ({ ...post, ...(saved[post.id] || {}) }));
      try {
        localEvents = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      } catch {
        localEvents = [];
      }
      $("#lastSyncSide").textContent = formatDate(data.lastSync, true);
      buildNav();
      render();
      $$("[data-coming]").forEach(button => { button.onclick = () => showToast(`Le module ${button.dataset.coming} sera alimenté séparément.`); });
      $("#forceRefresh").onclick = forceRefresh;
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
    } catch {
      $("#pageContent").innerHTML = `<div class="loading-state"><strong>Impossible de charger les propositions.</strong><span>Utilisez le bouton d’actualisation en bas à gauche.</span></div>`;
    }
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });
  init();
})();
