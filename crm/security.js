(()=>{
  const css=`
  #crmLock{position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#111,#2b2b2b);display:flex;align-items:center;justify-content:center;padding:20px}
  #crmLock .lock-card{width:min(420px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 25px 70px #0008;text-align:center}
  #crmLock img{width:150px;max-height:70px;object-fit:contain;margin-bottom:12px}
  #crmLock h1{font-size:24px;margin:4px 0 8px}#crmLock p{color:#666;margin:0 0 18px;line-height:1.4}
  #crmLock input{width:100%;box-sizing:border-box;font-size:22px;text-align:center;letter-spacing:7px;padding:14px;border:1px solid #ccc;border-radius:12px;margin-bottom:10px}
  #crmLock button{width:100%;padding:14px;border:0;border-radius:12px;background:#b3131b;color:#fff;font-weight:800;font-size:16px}
  #crmLock .lock-error{color:#b3131b;min-height:20px;margin-top:10px;font-size:13px}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const enc=new TextEncoder();
  async function hash(v){const b=await crypto.subtle.digest('SHA-256',enc.encode('TECHNIMAT-CRM|'+v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  const saved=localStorage.getItem('crmAccessHash');
  const lock=document.createElement('div');lock.id='crmLock';
  lock.innerHTML=`<div class="lock-card"><img src="logo-technimat.svg?v=34" alt="Technimat"><h1>${saved?'CRM sécurisé':'Créer votre code d’accès'}</h1><p>${saved?'Saisissez votre code pour accéder au CRM.':'Choisissez un code de 4 à 8 chiffres. Il sera demandé à chaque nouvelle ouverture.'}</p><form id="lockForm"><input id="lockCode" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="off" placeholder="••••" required><button>${saved?'Déverrouiller':'Enregistrer le code'}</button><div class="lock-error" id="lockError"></div></form></div>`;
  document.body.appendChild(lock);document.body.style.overflow='hidden';
  const form=lock.querySelector('#lockForm'),input=lock.querySelector('#lockCode'),err=lock.querySelector('#lockError');input.focus();
  form.addEventListener('submit',async e=>{e.preventDefault();const code=input.value.trim();if(!/^\d{4,8}$/.test(code)){err.textContent='Le code doit contenir entre 4 et 8 chiffres.';return}const h=await hash(code);if(!localStorage.getItem('crmAccessHash'))localStorage.setItem('crmAccessHash',h);else if(h!==localStorage.getItem('crmAccessHash')){err.textContent='Code incorrect.';input.value='';input.focus();return}sessionStorage.setItem('crmUnlocked','1');lock.remove();document.body.style.overflow='';});
  if(sessionStorage.getItem('crmUnlocked')==='1'){lock.remove();document.body.style.overflow=''}
})();
