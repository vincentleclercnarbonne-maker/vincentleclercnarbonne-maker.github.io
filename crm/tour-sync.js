(()=>{
  const wait=()=>{
    const suggest=document.querySelector('#suggestTour');
    const clear=document.querySelector('#clearTour');
    const dateInput=document.querySelector('#tourDate');
    if(!suggest||!clear||!dateInput||typeof state==='undefined')return setTimeout(wait,150);

    const update=document.createElement('button');
    update.type='button';
    update.id='syncTourFromPlanning';
    update.textContent='Mettre à jour depuis le planning';
    update.className='ghost dark';
    update.style.width='100%';
    update.style.marginTop='8px';
    clear.closest('.row')?.after(update);

    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');

    function findProspect(event){
      return state.prospects.find(p=>String(p.id)===String(event.companyId))
        ||state.prospects.find(p=>norm(p.name)===norm(event.company))
        ||state.prospects.find(p=>norm(p.name).includes(norm(event.company))||norm(event.company).includes(norm(p.name)));
    }

    function sync(){
      const date=dateInput.value;
      if(!date)return alert('Choisissez d’abord la date de la tournée.');
      const events=JSON.parse(localStorage.getItem(window.CRM_PLANNING_KEY)||'[]')
        .filter(e=>e.date===date&&e.address&&e.company&&!/pause|déjeuner|dejeuner/i.test(`${e.title||''} ${e.company||''}`))
        .sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));

      if(!events.length){
        state.tour=[];
        save();
        renderTour();
        return alert(`Aucun rendez-vous avec adresse trouvé dans le planning du ${date}.`);
      }

      const ids=[];
      const missing=[];
      for(const event of events){
        const p=findProspect(event);
        if(p&&!ids.some(id=>String(id)===String(p.id)))ids.push(p.id);
        else if(!p)missing.push(event.company);
      }
      state.tour=ids;
      save();
      renderTour();

      const message=`Tournée mise à jour : ${ids.length} étape${ids.length>1?'s':''} importée${ids.length>1?'s':''} depuis le planning.`;
      alert(missing.length?`${message}\nNon retrouvées dans la base : ${missing.join(', ')}.`:message);
    }

    update.addEventListener('click',sync);
    dateInput.addEventListener('change',()=>{
      const count=JSON.parse(localStorage.getItem(window.CRM_PLANNING_KEY)||'[]').filter(e=>e.date===dateInput.value&&e.address&&e.company).length;
      update.textContent=count?`Mettre à jour depuis le planning (${count})`:'Mettre à jour depuis le planning';
    });
  };
  wait();
})();
