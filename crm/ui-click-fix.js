(()=>{
  const style=document.createElement('style');
  style.textContent=`
    button:not(:disabled),
    a[href],
    [role="button"],
    summary,
    select,
    input[type="checkbox"],
    input[type="radio"],
    label[for],
    .clickable,
    .apply-time,
    .hours-link,
    nav button:not(:disabled){cursor:pointer!important}
    button:disabled,[aria-disabled="true"]{cursor:not-allowed!important}
    #analyseDay.is-working{cursor:wait!important;opacity:.78}
    button:not(:disabled):hover,a[href]:hover{filter:brightness(.96)}
  `;
  document.head.appendChild(style);

  const install=()=>{
    const button=document.querySelector('#analyseDay');
    const status=document.querySelector('#voiceStatus');
    const preview=document.querySelector('#voicePreview');
    if(!button||!status||!preview)return setTimeout(install,250);
    if(button.dataset.clickFix==='1')return;
    button.dataset.clickFix='1';

    let timer=null;
    let startedAt=0;
    const finish=()=>{
      clearTimeout(timer);
      button.classList.remove('is-working');
      button.disabled=false;
      button.textContent='Préparer intelligemment';
    };

    button.addEventListener('click',()=>{
      startedAt=Date.now();
      button.classList.add('is-working');
      button.textContent='Calcul en cours…';
      status.textContent='Analyse de votre demande, des rendez-vous et des temps de trajet…';
      clearTimeout(timer);
      timer=setTimeout(()=>{
        const changed=preview.children.length>0||/préparé|trajet|planning|conflit|compatible/i.test(status.textContent);
        if(!changed){
          status.textContent='Le calcul ne s’est pas lancé correctement. Faites Ctrl + F5 puis réessayez. Aucun rendez-vous n’a été ajouté.';
        }
        finish();
      },15000);
    },true);

    const observer=new MutationObserver(()=>{
      if(!startedAt||Date.now()-startedAt<250)return;
      if(preview.children.length>0||/préparé|conflit|compatible|réalisable/i.test(status.textContent))finish();
    });
    observer.observe(preview,{childList:true,subtree:true});
    observer.observe(status,{childList:true,subtree:true,characterData:true});

    window.addEventListener('error',event=>{
      if(!button.classList.contains('is-working'))return;
      status.textContent='Erreur pendant la préparation : '+(event.message||'erreur inconnue')+'. Rechargez la page avec Ctrl + F5.';
      finish();
    });
    window.addEventListener('unhandledrejection',()=>{
      if(!button.classList.contains('is-working'))return;
      status.textContent='Le service de calcul des trajets ne répond pas. Réessayez dans quelques secondes.';
      finish();
    });
  };
  install();
})();
