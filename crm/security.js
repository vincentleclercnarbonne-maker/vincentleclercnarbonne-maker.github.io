(()=>{
  const profiles={
    vincent:{name:'Vincent',protected:false},
    cedric:{name:'Cédric',protected:false},
    zavier:{name:'Zavier',protected:false},
    manager:{name:'Manager',protected:true,hash:'1308c6e49df0293673fd10564ee4794098e83b3053db3e0d6ecf4e42bdc6b9e3'}
  };
  const params=new URLSearchParams(location.search);
  const requested=params.get('profil');
  const stored=sessionStorage.getItem('crmUser');
  const selected=profiles[requested]?requested:(profiles[stored]?stored:null);

  if(profiles[requested]){
    const isNewProfile=requested!==stored;
    sessionStorage.setItem('crmUser',requested);
    if(profiles[requested].protected){
      if(isNewProfile)sessionStorage.removeItem('crmUnlocked');
    }else{
      sessionStorage.setItem('crmUnlocked','1');
    }
  }

  const unlocked=Boolean(selected&&sessionStorage.getItem('crmUnlocked')==='1'&&profiles[selected]);
  window.CRM_USER=unlocked?selected:'locked';
  window.CRM_USER_NAME=unlocked?profiles[selected].name:'';
  window.CRM_STORAGE_KEY=`crmTechnimat:${window.CRM_USER}`;
  window.CRM_PLANNING_KEY=`crmPlanning:${window.CRM_USER}`;
  window.CRM_PLANNING_DATE_KEY=`crmPlanningOpenDate:${window.CRM_USER}`;

  const css=`
  #crmLock{position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#111,#2b2b2b);display:flex;align-items:center;justify-content:center;padding:20px}
  #crmLock .lock-card{width:min(440px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 25px 70px #0008;text-align:center}
  #crmLock img{width:150px;max-height:70px;object-fit:contain;margin-bottom:12px}
  #crmLock h1{font-size:24px;margin:4px 0 8px}#crmLock p{color:#666;margin:0 0 18px;line-height:1.4}
  #crmLock input{width:100%;box-sizing:border-box;padding:14px;border:1px solid #ccc;border-radius:12px;margin-bottom:10px;background:#fff;font-size:22px;text-align:center;letter-spacing:7px}
  #crmLock button,.direct-link{width:100%;box-sizing:border-box;padding:14px;border:0;border-radius:12px;background:#b3131b;color:#fff;font-weight:800;font-size:16px;text-decoration:none;display:block}
  #crmLock .direct-access{display:grid;gap:10px;margin-top:16px}
  #crmLock .direct-link{background:#222;text-align:left;display:flex;align-items:center;justify-content:space-between}
  #crmLock .direct-link::after{content:'Ouvrir →';font-size:13px;font-weight:600;color:#ddd}
  #crmLock .manager-link{background:#b3131b;text-align:center;margin-top:16px}
  #crmLock .back-link{display:inline-block;margin-top:15px;color:#555;font-size:14px}
  #crmLock .lock-error{color:#b3131b;min-height:20px;margin-top:10px;font-size:13px}
  #crmUserBar{display:flex;align-items:center;gap:7px;font-size:12px}#crmUserBar button{padding:8px 10px;background:#333}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const enc=new TextEncoder();
  async function hash(user,code){const b=await crypto.subtle.digest('SHA-256',enc.encode(`TECHNIMAT-CRM|${user}|${code}`));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  function profileUrl(id){const url=new URL(location.href);url.searchParams.set('profil',id);url.searchParams.set('v','48');return url.pathname+url.search}
  function landingUrl(){const url=new URL(location.href);url.searchParams.delete('profil');url.searchParams.set('v','48');return url.pathname+url.search}
  function personalize(){
    document.title=`CRM TECHNIMAT — ${profiles[selected].name}`;
    const identity=document.querySelector('.brand small');if(identity)identity.textContent=profiles[selected].name;
    const greeting=document.querySelector('.hero-copy p');if(greeting)greeting.textContent=`Bonjour ${profiles[selected].name}`;
  }
  function addUserBar(){
    const header=document.querySelector('header');if(!header||document.querySelector('#crmUserBar'))return;
    personalize();
    const bar=document.createElement('div');bar.id='crmUserBar';bar.innerHTML=`<span>${profiles[selected].name}</span><button type="button">Changer</button>`;
    bar.querySelector('button').onclick=()=>{
      if(!confirm('Changer d’utilisateur ? Les données enregistrées seront conservées.'))return;
      sessionStorage.removeItem('crmUnlocked');sessionStorage.removeItem('crmUser');
      const url=new URL(location.href);url.searchParams.delete('profil');url.searchParams.set('v','48');location.href=url.pathname+url.search;
    };
    header.appendChild(bar);
  }
  if(unlocked){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addUserBar);else addUserBar();return}

  const lock=document.createElement('div');lock.id='crmLock';
  if(selected==='manager'){
    lock.innerHTML=`<div class="lock-card"><img src="logo-technimat.svg?v=48" alt="Technimat"><h1>Accès Manager</h1><p>Saisissez le code Manager pour ouvrir cet espace.</p><form id="lockForm"><input id="lockCode" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" placeholder="••••" required autofocus><button>Se connecter</button><div class="lock-error" id="lockError"></div></form><a class="back-link" href="${landingUrl()}">← Retour aux accès</a></div>`;
  }else{
    lock.innerHTML=`<div class="lock-card"><img src="logo-technimat.svg?v=48" alt="Technimat"><h1>Accès au CRM</h1><p>Choisissez le lien personnel à ouvrir. Aucun code n’est demandé pour les espaces commerciaux.</p><div class="direct-access"><a class="direct-link" href="${profileUrl('vincent')}">Vincent</a><a class="direct-link" href="${profileUrl('cedric')}">Cédric</a><a class="direct-link" href="${profileUrl('zavier')}">Zavier</a></div><a class="direct-link manager-link" href="${profileUrl('manager')}">Accès Manager avec code</a></div>`;
  }
  document.body.appendChild(lock);document.body.style.overflow='hidden';
  if(selected!=='manager')return;
  const form=lock.querySelector('#lockForm'),input=lock.querySelector('#lockCode'),err=lock.querySelector('#lockError');
  form.addEventListener('submit',async e=>{
    e.preventDefault();const code=input.value.trim();
    if(!/^\d{4}$/.test(code)){err.textContent='Saisissez le code Manager à 4 chiffres.';return}
    if(await hash('manager',code)!==profiles.manager.hash){err.textContent='Code Manager incorrect.';input.value='';input.focus();return}
    sessionStorage.setItem('crmUser','manager');sessionStorage.setItem('crmUnlocked','1');location.reload();
  });
})();
