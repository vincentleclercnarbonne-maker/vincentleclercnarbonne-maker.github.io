(()=>{
  const wait=()=>{
    const suggest=document.querySelector('#suggestTour');
    const clear=document.querySelector('#clearTour');
    const dateInput=document.querySelector('#tourDate');
    const startInput=document.querySelector('#startAddress');
    if(!suggest||!clear||!dateInput||!startInput||typeof state==='undefined')return setTimeout(wait,150);
    if(window.CRM_TOUR_SYNC_READY)return;
    window.CRM_TOUR_SYNC_READY=true;

    const user=window.CRM_USER||'locked';
    const proposalKey=`crmTourProposal:${user}`;
    const update=document.createElement('button');
    update.type='button';
    update.id='syncTourFromPlanning';
    update.textContent='Mettre à jour depuis le planning';
    update.className='ghost dark';
    update.style.width='100%';
    update.style.marginTop='8px';

    const validate=document.createElement('button');
    validate.type='button';
    validate.id='validateTourInPlanning';
    validate.textContent='Valider les prospects dans le planning';
    validate.style.width='100%';
    validate.style.marginTop='8px';
    validate.style.background='#1769d2';

    const info=document.createElement('p');
    info.id='tourProposalInfo';
    info.className='mini';
    info.style.margin='10px 2px 0';

    clear.closest('.row')?.after(update,validate,info);

    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const mins=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return a*60+b};
    const hhmm=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
    const ceil15=n=>Math.ceil(n/15)*15;
    const postal=a=>{
      const text=String(a||'');
      const match=text.match(/\b(\d{5})\b/);
      if(match)return match[1];
      if(/technimat|narbonne/i.test(text))return '11100';
      return '';
    };
    const deptFromAddress=a=>postal(a).slice(0,2);
    const travelMinutes=(a,b)=>{
      if(!a||!b)return 35;
      if(norm(a)===norm(b))return 0;
      const pa=postal(a),pb=postal(b);
      if(pa&&pb){
        if(pa===pb)return 8;
        if(pa.slice(0,3)===pb.slice(0,3))return 15;
        if(pa.slice(0,2)===pb.slice(0,2))return 28+Math.min(22,Math.round(Math.abs(Number(pa.slice(2))-Number(pb.slice(2)))/20));
        return 90;
      }
      return 40;
    };
    const planningEvents=()=>JSON.parse(localStorage.getItem(window.CRM_PLANNING_KEY)||'[]');
    const findProspect=event=>state.prospects.find(p=>String(p.id)===String(event.companyId))
      ||state.prospects.find(p=>norm(p.name)===norm(event.company))
      ||state.prospects.find(p=>norm(p.name).includes(norm(event.company))||norm(event.company).includes(norm(p.name)));

    const availableCandidates=(events,anchors)=>{
      const usedIds=new Set(events.map(e=>String(e.companyId||'')));
      const usedNames=new Set(events.map(e=>norm(e.company)));
      let list=state.prospects.filter(p=>p.address&&!usedIds.has(String(p.id))&&!usedNames.has(norm(p.name))
        &&!/client|supprimer/i.test(String(p.status||'')));
      if(anchors.length){
        list.sort((a,b)=>{
          const da=Math.min(...anchors.map(e=>travelMinutes(a.address,e.address)));
          const db=Math.min(...anchors.map(e=>travelMinutes(b.address,e.address)));
          return da-db||String(a.name).localeCompare(String(b.name),'fr');
        });
      }else{
        const selectedDept=document.querySelector('#deptFilter')?.value||'31';
        const sameDept=list.filter(p=>String(p.dept||deptFromAddress(p.address))===String(selectedDept));
        if(sameDept.length)list=sameDept;
        list.sort((a,b)=>String(a.name).localeCompare(String(b.name),'fr'));
      }
      return list;
    };

    function buildPlan(candidates,blockers,startAddress){
      const selected=[];
      const remaining=[...candidates];
      const ordered=[...blockers].sort((a,b)=>mins(a.start)-mins(b.start));
      let currentTime=8*60,currentAddress=startAddress;
      const chooseForGap=(gapEnd,nextAddress)=>{
        while(selected.length<6&&remaining.length){
          const ranked=remaining.map((p,index)=>({
            p,index,
            cost:travelMinutes(currentAddress,p.address)+travelMinutes(p.address,nextAddress||currentAddress)
          })).sort((a,b)=>a.cost-b.cost);
          let placed=false;
          for(const choice of ranked){
            const arrival=ceil15(currentTime+travelMinutes(currentAddress,choice.p.address));
            const end=arrival+10;
            const onward=nextAddress?travelMinutes(choice.p.address,nextAddress):travelMinutes(choice.p.address,startAddress);
            if(end+onward<=gapEnd){
              selected.push({id:choice.p.id,start:hhmm(arrival),end:hhmm(end),travel:Math.max(0,arrival-currentTime)});
              remaining.splice(choice.index,1);
              currentTime=end;
              currentAddress=choice.p.address;
              placed=true;
              break;
            }
          }
          if(!placed)break;
        }
      };
      for(let i=0;i<ordered.length&&selected.length<6;i++){
        const fixed=ordered[i];
        chooseForGap(mins(fixed.start),fixed.address||ordered.slice(i+1).find(x=>x.address)?.address||currentAddress);
        currentTime=Math.max(currentTime,mins(fixed.end));
        if(fixed.address)currentAddress=fixed.address;
      }
      chooseForGap(18*60,startAddress);
      return selected;
    }

    function decorateTour(){
      const proposal=JSON.parse(localStorage.getItem(proposalKey)||'null');
      const articles=[...document.querySelectorAll('#tourList .item')];
      const ids=state.tour.map(String);
      articles.forEach((article,index)=>{
        const id=ids[index];
        const fixed=proposal?.appointmentIds?.map(String).includes(id);
        const planned=proposal?.plan?.find(x=>String(x.id)===id);
        const badge=document.createElement('div');
        badge.className='badges';
        badge.innerHTML=fixed?'<span class="badge red">Rendez-vous fixé — prioritaire</span>'
          :planned?`<span class="badge" style="background:#e3efff;color:#1559a7">Prospect proposé — ${planned.start} · 10 min sur place</span>`:'';
        if(badge.innerHTML)article.appendChild(badge);
      });
      if(!proposal||proposal.date!==dateInput.value){
        validate.disabled=true;
        info.textContent='Proposez d’abord une tournée pour cette date.';
        return;
      }
      validate.disabled=Boolean(proposal.validated);
      validate.textContent=proposal.validated?'✓ Prospects ajoutés au planning':'Valider les prospects dans le planning';
      info.textContent=proposal.fixedCount
        ?`${proposal.fixedCount} rendez-vous prioritaire(s) détecté(s). ${proposal.plan.length} prospect(s) proposé(s) à proximité, avec 10 minutes de visite et trajets estimés.`
        :`${proposal.plan.length} prospect(s) proposé(s), avec 10 minutes de visite et trajets estimés.`;
    }

    const baseRenderTour=renderTour;
    window.renderTour=renderTour=function(){baseRenderTour();decorateTour()};

    function propose(){
      const date=dateInput.value;
      if(!date)return alert('Choisissez d’abord la date de la tournée.');
      const all=planningEvents().filter(e=>e.date===date&&!e.tourProspect);
      const blockers=all.filter(e=>e.start&&e.end&&!e.flexibleTime&&!e.completed);
      const anchors=blockers.filter(e=>e.address&&e.company&&!/pause|déjeuner|dejeuner/i.test(`${e.title||''} ${e.company||''}`));
      const candidates=availableCandidates(all,anchors);
      const plan=buildPlan(candidates,blockers,startInput.value||'TECHNIMAT, Narbonne');
      const appointmentIds=[];
      anchors.forEach(e=>{
        const p=findProspect(e);
        if(p&&!appointmentIds.some(id=>String(id)===String(p.id)))appointmentIds.push(p.id);
      });
      const timedIds=new Map(plan.map(x=>[String(x.id),x.start]));
      const ordered=[
        ...anchors.map(e=>({id:findProspect(e)?.id,time:e.start})).filter(x=>x.id),
        ...plan.map(x=>({id:x.id,time:x.start}))
      ].sort((a,b)=>String(a.time).localeCompare(String(b.time))).map(x=>x.id);
      state.tour=[...new Set(ordered.map(String))].map(id=>state.prospects.find(p=>String(p.id)===id)?.id).filter(Boolean);
      const proposal={date,appointmentIds,plan,fixedCount:anchors.length,validated:false,createdAt:new Date().toISOString()};
      localStorage.setItem(proposalKey,JSON.stringify(proposal));
      save();
      renderTour();
      if(!plan.length)alert('Aucun prospect ne peut être ajouté dans les créneaux disponibles avec les temps de trajet estimés.');
    }

    function validatePlanning(){
      const proposal=JSON.parse(localStorage.getItem(proposalKey)||'null');
      const date=dateInput.value;
      if(!proposal||proposal.date!==date)return alert('Proposez d’abord une tournée pour cette date.');
      const selectedIds=new Set(state.tour.map(String));
      const plans=proposal.plan.filter(x=>selectedIds.has(String(x.id)));
      if(!plans.length)return alert('Aucun prospect proposé à valider.');
      let events=planningEvents();
      const planIds=new Set(plans.map(x=>`tour-${date}-${x.id}`));
      events=events.filter(e=>!planIds.has(String(e.id)));
      plans.forEach(x=>{
        const p=state.prospects.find(item=>String(item.id)===String(x.id));
        if(!p)return;
        events.push({
          id:`tour-${date}-${p.id}`,
          companyId:p.id,
          company:p.name,
          title:'Prospection tournée',
          date,
          start:x.start,
          end:x.end,
          flexibleTime:false,
          dept:p.dept||deptFromAddress(p.address),
          address:p.address,
          notes:'Prospect proposé depuis la tournée — visite prévue 10 minutes hors trajet.',
          completed:false,
          tourProspect:true
        });
      });
      localStorage.setItem(window.CRM_PLANNING_KEY,JSON.stringify(events));
      proposal.validated=true;
      localStorage.setItem(proposalKey,JSON.stringify(proposal));
      if(typeof window.refreshCRMPlanning==='function')window.refreshCRMPlanning();
      decorateTour();
      alert(`${plans.length} prospect(s) ajouté(s) en bleu dans le planning.`);
    }

    function sync(){
      const date=dateInput.value;
      if(!date)return alert('Choisissez d’abord la date de la tournée.');
      const events=planningEvents()
        .filter(e=>e.date===date&&e.address&&e.company&&!e.tourProspect&&!/pause|déjeuner|dejeuner/i.test(`${e.title||''} ${e.company||''}`))
        .sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));
      if(!events.length){
        state.tour=[];
        save();
        renderTour();
        return alert(`Aucun rendez-vous avec adresse trouvé dans le planning du ${date}.`);
      }
      const ids=[],missing=[];
      events.forEach(event=>{
        const p=findProspect(event);
        if(p&&!ids.some(id=>String(id)===String(p.id)))ids.push(p.id);
        else if(!p)missing.push(event.company);
      });
      state.tour=ids;
      save();
      localStorage.removeItem(proposalKey);
      renderTour();
      const message=`Tournée mise à jour : ${ids.length} étape${ids.length>1?'s':''} importée${ids.length>1?'s':''} depuis le planning.`;
      alert(missing.length?`${message}\nNon retrouvées dans la base : ${missing.join(', ')}.`:message);
    }

    suggest.onclick=propose;
    validate.addEventListener('click',validatePlanning);
    update.addEventListener('click',sync);
    clear.onclick=()=>{
      state.tour=[];
      localStorage.removeItem(proposalKey);
      save();
      renderTour();
    };
    dateInput.addEventListener('change',()=>{
      const count=planningEvents().filter(e=>e.date===dateInput.value&&e.address&&e.company&&!e.tourProspect).length;
      update.textContent=count?`Mettre à jour depuis le planning (${count})`:'Mettre à jour depuis le planning';
      renderTour();
    });
    renderTour();
  };
  wait();
})();
