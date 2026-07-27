(() => {
  'use strict';
  const API_KEY = 'vincent-linkedin-api-base';
  let status = null;

  const apiBase = () => {
    const stored = localStorage.getItem(API_KEY);
    if (stored) return stored.replace(/\/$/, '');
    if (location.hostname.endsWith('vercel.app') || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return '';
    return null;
  };

  const notify = message => {
    const toast = document.querySelector('#toast');
    if (!toast) return alert(message);
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  async function request(path, options = {}) {
    const base = apiBase();
    if (base === null) throw new Error('Backend Vercel non configuré');
    const response = await fetch(`${base}/api/${path}`, { credentials: 'include', ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Erreur de connexion');
    return data;
  }

  async function loadStatus() {
    try {
      status = await request('connections');
      decorateConnections();
      return status;
    } catch {
      status = null;
      return null;
    }
  }

  function configureBackend() {
    const current = localStorage.getItem(API_KEY) || '';
    const value = prompt('Colle l’adresse de l’application Vercel, par exemple https://vincent-linkedin.vercel.app', current);
    if (value === null) return false;
    try {
      const url = new URL(value);
      localStorage.setItem(API_KEY, url.origin);
      notify('Adresse Vercel enregistrée');
      loadStatus();
      return true;
    } catch {
      notify('Adresse Vercel invalide');
      return false;
    }
  }

  function connect(service) {
    let base = apiBase();
    if (base === null) {
      if (!configureBackend()) return;
      base = apiBase();
    }
    location.href = `${base}/api/connect/${service}`;
  }

  async function testPrestaShop() {
    try {
      const data = await request('prestashop/products');
      const products = data.products || [];
      notify(`${products.length} produit(s) TECHNIMAT récupéré(s)`);
    } catch (error) {
      notify(error.message);
    }
  }

  async function publishLinkedIn() {
    if (!confirm('Publier maintenant ce texte sur ton profil LinkedIn ?')) return;
    const hook = document.querySelector('#editHook')?.value.trim() || '';
    const body = document.querySelector('#editBody')?.value.trim() || '';
    const cta = document.querySelector('#editCta')?.value.trim() || '';
    const tags = document.querySelector('#editTags')?.value.trim() || '';
    const text = [hook, body, cta, tags].filter(Boolean).join('\n\n');
    try {
      const result = await request('linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      notify(result.postId ? 'Publication envoyée sur LinkedIn' : 'Publication envoyée');
    } catch (error) {
      notify(error.message);
    }
  }

  function decorateConnections() {
    document.querySelectorAll('[data-action="connection"]').forEach(button => {
      const service = button.dataset.id;
      if (service === 'li') {
        button.textContent = status?.linkedin?.connected ? 'Reconnecter' : 'Connecter';
        button.dataset.liveService = 'linkedin';
      } else if (service === 'canva') {
        button.textContent = status?.canva?.connected ? 'Reconnecter' : 'Connecter';
        button.dataset.liveService = 'canva';
      } else if (service === 'web') {
        button.textContent = status?.prestashop?.configured ? 'Tester' : 'Configurer';
        button.dataset.liveService = 'prestashop';
      } else if (service === 'crm') {
        button.textContent = 'API ITECK requise';
        button.dataset.liveService = 'crm';
      }
    });
  }

  function addPublishButton() {
    const actions = document.querySelector('#drawerActions');
    if (!actions || !document.querySelector('#editBody') || actions.querySelector('[data-live-publish]')) return;
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.dataset.livePublish = 'true';
    button.textContent = 'Publier sur LinkedIn';
    actions.appendChild(button);
  }

  document.addEventListener('click', event => {
    const connection = event.target.closest('[data-action="connection"]');
    if (connection) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const service = connection.dataset.liveService || ({ li: 'linkedin', canva: 'canva', web: 'prestashop', crm: 'crm' }[connection.dataset.id]);
      if (service === 'linkedin' || service === 'canva') connect(service);
      else if (service === 'prestashop') testPrestaShop();
      else notify('Il faut demander la documentation API à ITECK');
      return;
    }
    if (event.target.closest('[data-live-publish]')) {
      event.preventDefault();
      publishLinkedIn();
    }
  }, true);

  const observer = new MutationObserver(() => {
    decorateConnections();
    addPublishButton();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const params = new URLSearchParams(location.search);
  const connected = params.get('connected');
  if (connected) {
    history.replaceState({}, '', location.pathname);
    setTimeout(() => notify(`${connected === 'linkedin' ? 'LinkedIn' : 'Canva'} connecté avec succès`), 500);
  }
  loadStatus();
})();
