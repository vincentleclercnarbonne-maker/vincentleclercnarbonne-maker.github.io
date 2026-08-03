(()=>{
  const css=`.planning-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0;flex-wrap:wrap}.week-scroll{overflow-x:auto;background:#fff;border-radius:18px;border:1px solid #e5e7eb}.week-grid{display:grid;grid-template-columns:64px repeat(5,minmax(145px,1fr));min-width:790px}.week-head{position:sticky;top:0;z-index:3;background:#fff;padding:12px 6px;text-align:center;font-weight:800;border-bottom:1px solid #ddd}.time-cell{height:48px;padding:4px 8px;text-align:right;font-size:12px;color:#777;border-top:1px solid #eee}.day-cell{height:48px;border-top:1px solid #eee;border-left:1px solid #eee;position:relative}.plan-event{position:absolute;left:4px;right:4px;top:3px;z-index:2;background:#b3131b;color:#fff;border-radius:9px;padding:5px;font-size:11px;line-height:1.2;overflow:hidden;cursor:pointer}.plan-event.flexible{background:#e67e22}.plan-event.tour-prospect{background:#1769d2}.plan-event.completed{background:#18733c}.plan-event b{display:block}.floating-label{height:auto;min-height:48px;padding-top:8px}.floating-cell{height:auto;min-height:48px;padding:3px}.floating-event{position:relative;left:auto;right:auto;top:auto;min-height:36px;margin-bottom:4px}.planning-time-row{align-items:flex-end;flex-wrap:wrap}.planning-time-row label{flex:1;min-width:105px}.flex-time-btn{margin:12px 0 6px;background:#ececef;color:#202024;white-space:nowrap}.flex-time-btn[aria-pressed="true"]{background:#e67e22;color:#fff}.done-wide{width:100%;margin-top:9px;background:#18733c}.danger-wide{width:100%;margin-top:9px;background:#333}.planning-toolbar strong{flex:1;text-align:center;min-width:180px}.company-search-wrap{position:relative}.company-results{position:absolute;left:0;right:0;z-index:20;border:1px solid #d8d8dc;border-radius:12px;background:#fff;max-height:220px;overflow:auto;margin-top:5px;display:none;box-shadow:0 8px 24px #0002}.company-results button{display:block;width:100%;text-align:left;background:#fff;color:#222;border:0;border-bottom:1px solid #eee;border-radius:0;padding:11px}.company-results small{color:#777}.company-selected{font-size:12px;color:#18733c;margin-top:5px;min-height:16px}@media(max-width:600px){.planning-toolbar button{flex:1}.planning-toolbar strong{order:-1;flex-basis:100%}.flex-time-btn{flex-basis:100%}}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const main=document.querySelector('main'),hist=document.querySelector('#historique');
  const sec=document.createElement('section');sec.id='planning';sec.className='page';sec.innerHTML='<div class="page-head"><h1>Planning semaine</h1><p>Votre semaine avec les horaires sur le côté.</p></div><div class="planning-toolbar"><button id="prevWeek" class="ghost dark">← Précédente</button><strong id="weekLabel"></strong><button id="nextWeek" class="ghost dark">Suivante →</button></div><button id="addPlanningEvent" class="primary-wide">Ajouter un rendez-vous</button><div id="weekCalendar"></div>';main.insertBefore(sec,hist);
  const nav=document.querySelector('.bottom'),hb=nav.querySelector('[data-page="historique"]'),nb=document.createElement('button');nb.dataset.page='planning';nb.innerHTML='▦<span>Planning</span>';nav.insertBefore(nb,hb);
  const dg=document.createElement('dialog');dg.id='planningDialog';dg.innerHTML='<form method="dialog" id="planningForm"><div class="dialog-head"><h2>Nouveau rendez-vous</h2><button type="button" id="cancelPlanning" aria-label="Fermer sans enregistrer">×</button></div><input type="hidden" id="planningId"><input type="hidden" id="planningCompanyId"><label>Entreprise<div class="company-search-wrap"><input id="planningCompanySearch" autocomplete="off" placeholder="Rechercher par nom d’entreprise…"><div id="planningCompanyResults" class="company-results"></div></div><div id="planningCompanySelected" class="company-selected"></div></label><label>Objet<input id="planningTitle" placeholder="Visite, livraison, relance…"></label><label>Date<input type="date" id="planningDate" required></label><div class="row planning-time-row"><label>Début<input type="time" id="planningStart" value="09:00" required></label><label>Fin<input type="time" id="planningEnd" value="09:30" required></label><button type="button" id="planningNoFixedTime" class="flex-time-btn" aria-pressed="false">Pas d’horaire fixe</button></div><label>Département<input id="planningDepartment" maxlength="3" inputmode="numeric" placeholder="Ex. 11, 31, 34…"></label><label>Adresse<input id="planningAddress"></label><label>Notes<textarea id="planningNotes" rows="3"></textarea></label><button type="submit" id="savePlanning" class="primary-wide">Enregistrer</button><button type="button" id="completePlanning" class="done-wide">Rendez-vous fait — saisir le compte rendu</button><button type="button" id="deletePlanning" class="danger-wide">Supprimer</button></form>';document.body.appendChild(dg);

  const localIso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parseLocal=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
  const getMonday=d=>{d=new Date(d);const day=d.getDay()||7;d.setDate(d.getDate()-day+1);d.setHours(0,0,0,0);return d};
  const planningKey=window.CRM_PLANNING_KEY,planningDateKey=window.CRM_PLANNING_DATE_KEY;
  if(window.CRM_USER==='vincent'&&!localStorage.getItem(planningKey)&&localStorage.getItem('crmPlanning'))localStorage.setItem(planningKey,localStorage.getItem('crmPlanning'));
  const openDate=localStorage.getItem(planningDateKey);
  let monday=getMonday(openDate?parseLocal(openDate):new Date());
  localStorage.removeItem(planningDateKey);
  let events=JSON.parse(localStorage.getItem(planningKey)||'[]'),companies=[];
  const saveP=()=>localStorage.setItem(planningKey,JSON.stringify(events));
  const fmt=d=>d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
  const mins=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return a*60+b};
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function eventCard(e,floating=false){
    const label=e.flexibleTime?'Sans horaire fixe':e.start;
    const top=floating?0:3+(mins(e.start)%60)*.8;
    const height=e.tourProspect?Math.max(18,(mins(e.end)-mins(e.start))*.8):Math.max(36,(mins(e.end)-mins(e.start))*.8);
    const style=floating?'':` style="top:${top}px;height:${height}px"`;
    return `<div class="plan-event${e.flexibleTime?' flexible':''}${e.tourProspect?' tour-prospect':''}${floating?' floating-event':''}${e.completed?' completed':''}" data-id="${esc(e.id)}"${style}><b>${e.completed?'✓ Fait — ':''}${e.tourProspect?'Prospect — ':''}${esc(label)} ${esc(e.title)}</b>${esc(e.company||'')}</div>`;
  }

  function render(){
    events=JSON.parse(localStorage.getItem(planningKey)||'[]');
    const days=[0,1,2,3,4].map(i=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d});
    weekLabel.textContent=`Semaine du ${fmt(days[0])} au ${fmt(days[4])}`;
    let h='<div class="week-scroll"><div class="week-grid"><div class="week-head">Heure</div>'+days.map(d=>`<div class="week-head">${d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})}</div>`).join('');
    for(let hour=7;hour<20;hour++){
      h+=`<div class="time-cell">${String(hour).padStart(2,'0')}:00</div>`;
      for(const d of days){const date=localIso(d),es=events.filter(e=>e.date===date&&!e.flexibleTime&&Math.floor(mins(e.start)/60)===hour);h+=`<div class="day-cell">${es.map(e=>eventCard(e)).join('')}</div>`}
    }
    h+='<div class="time-cell floating-label">Sans heure fixe</div>';
    for(const d of days){const date=localIso(d),es=events.filter(e=>e.date===date&&e.flexibleTime);h+=`<div class="day-cell floating-cell">${es.map(e=>eventCard(e,true)).join('')}</div>`}
    h+='</div></div>';weekCalendar.innerHTML=h;weekCalendar.querySelectorAll('.plan-event').forEach(x=>x.addEventListener('click',()=>openEvent(x.dataset.id)));
  }
  function loadCompanies(){const ps=(window.CRM_PROSPECTS||[]);companies=ps.map(p=>({id:p.id||p.i||p.s,name:p.name||p.c||'Entreprise',address:p.address||p.a||'',dept:p.dept||p.d||''})).sort((a,b)=>a.name.localeCompare(b.name,'fr'))}
  function showCompanyResults(q=''){const term=q.toLowerCase().trim(),list=companies.filter(p=>term&&p.name.toLowerCase().includes(term)).slice(0,20);planningCompanyResults.innerHTML=list.length?list.map(p=>`<button type="button" data-id="${esc(p.id)}"><strong>${esc(p.name)}</strong>${p.address?`<br><small>${esc(p.address)}</small>`:''}</button>`).join(''):(term?'<p class="mini" style="padding:10px">Aucune entreprise trouvée.</p>':'');planningCompanyResults.style.display=term?'block':'none';planningCompanyResults.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectCompany(b.dataset.id)))}
  function selectCompany(id){const p=companies.find(x=>String(x.id)===String(id));if(!p)return;planningCompanyId.value=p.id;planningCompanySearch.value=p.name;planningCompanySelected.textContent='Entreprise sélectionnée : '+p.name;planningDepartment.value=p.dept||'';planningAddress.value=p.address||'';planningCompanyResults.style.display='none'}
  function setFlexibleTime(enabled){
    planningNoFixedTime.setAttribute('aria-pressed',String(enabled));
    planningNoFixedTime.textContent=enabled?'✓ Pas d’horaire fixe':'Pas d’horaire fixe';
    planningStart.disabled=enabled;planningEnd.disabled=enabled;
    planningStart.required=!enabled;planningEnd.required=!enabled;
  }
  function openEvent(id=''){loadCompanies();events=JSON.parse(localStorage.getItem(planningKey)||'[]');const e=events.find(x=>String(x.id)===String(id));planningId.value=e?.id||'';planningCompanyId.value=e?.companyId||'';planningCompanySearch.value=e?.company||'';planningCompanySelected.textContent=e?.company?'Entreprise sélectionnée : '+e.company:'';planningTitle.value=e?.title||'';planningDate.value=e?.date||localIso(new Date());planningStart.value=e?.start||'09:00';planningEnd.value=e?.end||'09:30';setFlexibleTime(Boolean(e?.flexibleTime));const selectedCompany=companies.find(x=>String(x.id)===String(e?.companyId));planningDepartment.value=e?.dept||selectedCompany?.dept||'';planningAddress.value=e?.address||'';planningNotes.value=e?.notes||'';completePlanning.style.display=e&&!e.completed?'block':'none';deletePlanning.style.display=e?'block':'none';planningCompanyResults.style.display='none';dg.showModal()}

  planningNoFixedTime.addEventListener('click',()=>setFlexibleTime(planningNoFixedTime.getAttribute('aria-pressed')!=='true'));
  planningStart.addEventListener('input',()=>{
    if(planningStart.disabled||!planningStart.value)return;
    const [hours,minutes]=planningStart.value.split(':').map(Number);
    const endMinutes=(hours*60+minutes+30)%(24*60);
    planningEnd.value=`${String(Math.floor(endMinutes/60)).padStart(2,'0')}:${String(endMinutes%60).padStart(2,'0')}`;
  });

  planningCompanySearch.addEventListener('input',e=>{planningCompanyId.value='';planningCompanySelected.textContent='';planningDepartment.value='';showCompanyResults(e.target.value)});
  planningCompanySearch.addEventListener('focus',e=>showCompanyResults(e.target.value));
  document.addEventListener('click',e=>{if(!e.target.closest('.company-search-wrap'))planningCompanyResults.style.display='none'});
  cancelPlanning.addEventListener('click',()=>dg.close());
  planningForm.addEventListener('submit',e=>{e.preventDefault();if(e.submitter?.id!=='savePlanning')return;const id=planningId.value||Date.now().toString(),old=events.find(x=>String(x.id)===String(id)),flexibleTime=planningNoFixedTime.getAttribute('aria-pressed')==='true',rec={id,companyId:planningCompanyId.value,company:planningCompanySearch.value.trim(),title:planningTitle.value||'Rendez-vous',date:planningDate.value,start:flexibleTime?'':planningStart.value,end:flexibleTime?'':planningEnd.value,flexibleTime,dept:planningDepartment.value.trim(),address:planningAddress.value,notes:planningNotes.value,completed:old?.completed||false};events=events.filter(x=>String(x.id)!==String(id));events.push(rec);saveP();monday=getMonday(parseLocal(rec.date));dg.close();render()});
  completePlanning.onclick=()=>{const id=planningId.value,e=events.find(x=>String(x.id)===String(id));if(!e)return;if(!confirm('Marquer ce rendez-vous comme fait et ouvrir le compte rendu ?'))return;const company=companies.find(x=>String(x.id)===String(e.companyId))||companies.find(x=>x.name.toLowerCase()===String(e.company||'').toLowerCase());e.completed=true;saveP();dg.close();render();if(typeof window.openVisitFromPlanning==='function')window.openVisitFromPlanning(company?.id||e.companyId||'',e.date)};
  deletePlanning.onclick=()=>{const id=planningId.value;if(confirm('Supprimer ce rendez-vous ?')){events=events.filter(x=>String(x.id)!==String(id));saveP();dg.close();render()}};
  addPlanningEvent.onclick=()=>openEvent();prevWeek.onclick=()=>{monday.setDate(monday.getDate()-7);render()};nextWeek.onclick=()=>{monday.setDate(monday.getDate()+7);render()};
  nb.onclick=()=>{document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='planning'));document.querySelectorAll('.bottom button').forEach(x=>x.classList.toggle('active',x.dataset.page==='planning'));window.scrollTo(0,0);render()};
  window.refreshCRMPlanning=render;
  render();
})();
