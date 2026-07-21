(()=>{
  const css=`
  #crmLock{position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#111,#2b2b2b);display:flex;align-items:center;justify-content:center;padding:20px}
  #crmLock .lock-card{width:min(420px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 25px 70px #0008;text-align:center}
  #crmLock img{width:150px;max-height:70px;object-fit:contain;margin-bottom:12px}
  #crmLock h1{font-size:24px;margin:4px 0 8px}#crmLock p{color:#666;margin:0 0 18px;line-height:1.4}
  #crmLock input{width:100%;box-sizing:border-box;font-size:22px;text-align:center;letter-spacing:7px;padding:14px;border:1px solid #ccc;border-radius:12px;margin-bottom:10px}
  #crmLock button{width:100%;padding:14px;border:0;border-radius:12px;background:#b3131b;color:#fff;font-weight:800;font-size:16px}
  #crmLock .lock-error{color:#b3131b;min-height:20px;margin-top:10px;font-size:13px}
  #micConsent{border:0;border-radius:22px;padding:0;width:min(450px,calc(100% - 28px));box-shadow:0 22px 70px #0006}
  #micConsent::backdrop{background:#0009}.mic-card{padding:24px}.mic-icon{font-size:42px;text-align:center}.mic-card h2{text-align:center;margin:6px 0}.mic-card p{color:#555;line-height:1.45}.mic-actions{display:grid;gap:9px;margin-top:18px}.mic-actions button{padding:13px;border-radius:12px;border:0;font-weight:800}.mic-allow{background:#b3131b;color:#fff}.mic-deny{background:#ececec;color:#222}.mic-status{font-size:13px;text-align:center;min-height:18px;margin-top:8px}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  const enc=new TextEncoder();
  async function hash(v){const b=await crypto.subtle.digest('SHA-256',enc.encode('TECHNIMAT-CRM|'+v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  const saved=localStorage.getItem('crmAccessHash');
  const lock=document.createElement('div');lock.id='crmLock';
  lock.innerHTML=`<div class="lock-card"><img src="logo-technimat.svg?v=7" alt="Technimat"><h1>${saved?'CRM sécurisé':'Créer votre code d’accès'}</h1><p>${saved?'Saisissez votre code pour accéder au CRM.':'Choisissez un code de 4 à 8 chiffres. Il sera demandé à chaque nouvelle ouverture.'}</p><form id="lockForm"><input id="lockCode" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="off" placeholder="••••" required><button>${saved?'Déverrouiller':'Enregistrer le code'}</button><div class="lock-error" id="lockError"></div></form></div>`;
  document.body.appendChild(lock);
  document.body.style.overflow='hidden';

  const form=lock.querySelector('#lockForm'),input=lock.querySelector('#lockCode'),err=lock.querySelector('#lockError');
  input.focus();
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const code=input.value.trim();
    if(!/^\d{4,8}$/.test(code)){err.textContent='Le code doit contenir entre 4 et 8 chiffres.';return}
    const h=await hash(code);
    if(!localStorage.getItem('crmAccessHash')) localStorage.setItem('crmAccessHash',h);
    else if(h!==localStorage.getItem('crmAccessHash')){err.textContent='Code incorrect.';input.value='';input.focus();return}
    sessionStorage.setItem('crmUnlocked','1');
    lock.remove();document.body.style.overflow='';
    askMicConsent();
  });

  if(sessionStorage.getItem('crmUnlocked')==='1'){
    lock.remove();document.body.style.overflow='';setTimeout(askMicConsent,150);
  }

  function askMicConsent(){
    const old=document.querySelector('#micConsent');
    if(old) old.remove();
    sessionStorage.removeItem('crmMicAllowed');
    const dg=document.createElement('dialog');dg.id='micConsent';dg.innerHTML=`<div class="mic-card"><div class="mic-icon">🎙️</div><h2>Autorisation du microphone</h2><p>Le microphone sert uniquement à dicter votre journée dans le planning. Aucun enregistrement audio n’est conservé par le CRM.</p><div class="mic-actions"><button class="mic-allow" type="button">Autoriser le microphone</button><button class="mic-deny" type="button">Continuer sans microphone</button></div><div class="mic-status"></div></div>`;document.body.appendChild(dg);dg.showModal();
    const status=dg.querySelector('.mic-status');
    dg.querySelector('.mic-allow').onclick=async()=>{
      status.textContent='Demande d’autorisation en cours…';
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        stream.getTracks().forEach(t=>t.stop());
        sessionStorage.setItem('crmMicAllowed','1');
        dg.close();dg.remove();
      }catch(e){
        sessionStorage.setItem('crmMicAllowed','0');
        status.textContent='Microphone refusé ou indisponible. Vérifiez l’autorisation dans le navigateur.';
      }
    };
    dg.querySelector('.mic-deny').onclick=()=>{sessionStorage.setItem('crmMicAllowed','0');dg.close();dg.remove()};
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#micConsent,#crmLock')) return;
    const mic=e.target.closest('[id*="mic" i], [class*="mic" i], [aria-label*="micro" i], [title*="micro" i]');
    if(mic&&sessionStorage.getItem('crmMicAllowed')!=='1'){
      e.preventDefault();e.stopImmediatePropagation();
      askMicConsent();
    }
  },true);
})();