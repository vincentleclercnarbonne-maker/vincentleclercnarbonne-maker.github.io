(()=>{
  const profiles={
    vincent:{name:'Vincent',hash:'d454cdf141da97fa4ca9ac371cbedd22874e29c874ca437f49193bf70c4ef4d4'},
    zavier:{name:'Zavier',hash:'5ad5da765d62be2a032d9934c5670400ecc4406b3bd6d9d6599542531b0a3061'},
    cedric:{name:'Cédric',hash:'903dac132908898ccea5be8b82f32ff0db4fe1fcd47b9334616f7d8e53bc58c9'}
  };
  const selected=sessionStorage.getItem('crmUser');
  const unlocked=sessionStorage.getItem('crmUnlocked')==='1'&&profiles[selected];
  window.CRM_USER=unlocked?selected:'locked';
  window.CRM_USER_NAME=unlocked?profiles[selected].name:'';
  window.CRM_STORAGE_KEY=`crmTechnimat:${window.CRM_USER}`;
  window.CRM_PLANNING_KEY=`crmPlanning:${window.CRM_USER}`;
  window.CRM_PLANNING_DATE_KEY=`crmPlanningOpenDate:${window.CRM_USER}`;
  const css=`
  #crmLock{position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#111,#2b2b2b);display:flex;align-items:center;justify-content:center;padding:20px}
  #crmLock .lock-card{width:min(420px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 25px 70px #0008;text-align:center}
  #crmLock img{width:150px;max-height:70px;object-fit:contain;margin-bottom:12px}
  #crmLock h1{font-size:24px;margin:4px 0 8px}#crmLock p{color:#666;margin:0 0 18px;line-height:1.4}
  #crmLock select,#crmLock input{width:100%;box-sizing:border-box;padding:14px;border:1px solid #ccc;border-radius:12px;margin-bottom:10px;background:#fff}
  #crmLock input{font-size:22px;text-align:center;letter-spacing:7px}
  #crmLock button{width:100%;padding:14px;border:0;border-radius:12px;background:#b3131b;color:#fff;font-weight:800;font-size:16px}
  #crmLock .lock-error{color:#b3131b;min-height:20px;margin-top:10px;font-size:13px}
  #crmUserBar{display:flex;align-items:center;gap:7px;font-size:12px}#crmUserBar button{padding:8px 10px;background:#333}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const enc=new TextEncoder();
  async function hash(user,code){const b=await crypto.subtle.digest('SHA-256',enc.encode(`TECHNIMAT-CRM|${user}|${code}`));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  function addUserBar(){const header=document.querySelector('header');if(!header||document.querySelector('#crmUserBar'))return;const bar=document.createElement('div');bar.id='crmUserBar';bar.innerHTML=`<span>${profiles[selected].name}</span><button type="button">Changer</button>`;bar.querySelector('button').onclick=()=>{if(!confirm('Changer d’utilisateur ? Les données enregistrées seront conservées.'))return;sessionStorage.removeItem('crmUnlocked');sessionStorage.removeItem('crmUser');location.reload()};header.appendChild(bar)}
  if(unlocked){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addUserBar);else addUserBar();return}
  const lock=document.createElement('div');lock.id='crmLock';
  lock.innerHTML=`<div class="lock-card"><img src="logo-technimat.svg?v=35" alt="Technimat"><h1>Connexion au CRM</h1><p>Choisissez votre espace personnel puis saisissez votre code.</p><form id="lockForm"><select id="lockUser" required><option value="">Choisir un utilisateur</option><option value="vincent">Vincent</option><option value="zavier">Zavier</option><option value="cedric">Cédric</option></select><input id="lockCode" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" placeholder="••••" required><button>Se connecter</button><div class="lock-error" id="lockError"></div></form></div>`;
  document.body.appendChild(lock);document.body.style.overflow='hidden';
  const form=lock.querySelector('#lockForm'),user=lock.querySelector('#lockUser'),input=lock.querySelector('#lockCode'),err=lock.querySelector('#lockError');
  form.addEventListener('submit',async e=>{e.preventDefault();const id=user.value,code=input.value.trim();if(!profiles[id]||!/^\d{4}$/.test(code)){err.textContent='Choisissez un utilisateur et saisissez un code à 4 chiffres.';return}if(await hash(id,code)!==profiles[id].hash){err.textContent='Utilisateur ou code incorrect.';input.value='';input.focus();return}sessionStorage.setItem('crmUser',id);sessionStorage.setItem('crmUnlocked','1');location.reload()});
})();
