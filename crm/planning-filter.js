(()=>{
  const search=document.querySelector('#planningCompanySearch');
  const results=document.querySelector('#planningCompanyResults');
  if(!search||!results)return;

  const label=search.closest('label');
  const deptWrap=document.createElement('div');
  deptWrap.innerHTML='<label style="margin-top:10px">Département<select id="planningDeptFilter"><option value="">Tous les départements</option></select></label>';
  label.after(deptWrap);

  const deptFilter=document.querySelector('#planningDeptFilter');
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const saved=JSON.parse(localStorage.getItem('crmTechnimat')||'{}');
  const history=[...(window.CRM_SEED?.history||[]),...(Array.isArray(saved.history)?saved.history:[])];
  const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  const deptFromAddress=a=>{const m=String(a||'').match(/\b(\d{2})\d{3}\b/);return m?m[1]:''};

  const historyCompanies=history.filter(v=>v.company||v.companyName).map((v,i)=>({
    id:v.companyId||v.siret||('history-company-'+i),
    name:v.companyName||v.company,
    address:v.address||'',
    dept:String(v.dept||deptFromAddress(v.address)||'').trim()
  }));

  const getCompanies=()=>{
    const ps=[...(window.state?.prospects||window.RP||[]),...(saved.customProspects||[])];
    const all=ps.map(p=>({
      id:p.id||p.i||p.s||'',
      name:p.name||p.c||'Entreprise',
      address:p.address||p.a||'',
      dept:String(p.dept||p.d||deptFromAddress(p.address||p.a)||'').trim()
    })).concat(historyCompanies);
    const seen=new Map();
    all.forEach(p=>{const k=norm(p.name);if(!k)return;const old=seen.get(k);if(!old||(!old.address&&p.address))seen.set(k,p)});
    return [...seen.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  };

  function importCompletedVisits(){
    let events=JSON.parse(localStorage.getItem('crmPlanning')||'[]');
    let added=0;
    history.forEach((v,i)=>{
      const company=v.companyName||v.company;
      const date=v.date;
      if(!company||!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return;
      const id='history-'+String(v.id||v.siret||i)+'-'+date;
      if(events.some(e=>String(e.id)===id))return;
      const companyInfo=getCompanies().find(p=>norm(p.name)===norm(company));
      events.push({
        id,
        companyId:v.companyId||v.siret||companyInfo?.id||'',
        company,
        title:'Visite réalisée',
        date,
        start:v.start||v.time||'09:00',
        end:v.end||'09:30',
        address:v.address||companyInfo?.address||'',
        notes:v.summary||v.notes||'',
        completed:true
      });
      added++;
    });
    if(added){
      localStorage.setItem('crmPlanning',JSON.stringify(events));
      if(!sessionStorage.getItem('crmPlanningImported')){
        sessionStorage.setItem('crmPlanningImported','1');
        location.reload();
      }
    }
  }

  function fillDepartments(){
    const deps=[...new Set(getCompanies().map(p=>p.dept).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
    deptFilter.innerHTML='<option value="">Tous les départements</option>'+deps.map(d=>`<option value="${esc(d)}">Département ${esc(d)}</option>`).join('');
  }

  function choose(p){
    document.querySelector('#planningCompanyId').value=p.id;
    search.value=p.name;
    document.querySelector('#planningCompanySelected').textContent='Entreprise sélectionnée : '+p.name;
    document.querySelector('#planningAddress').value=p.address||'';
    results.style.display='none';
  }

  function renderResults(){
    const term=search.value.toLowerCase().trim();
    const dept=deptFilter.value;
    const list=getCompanies().filter(p=>(!dept||p.dept===dept)&&(!term||p.name.toLowerCase().includes(term))).slice(0,40);
    results.innerHTML=list.length?list.map(p=>`<button type="button"><strong>${esc(p.name)}</strong>${p.dept?` <small>(${esc(p.dept)})</small>`:''}${p.address?`<br><small>${esc(p.address)}</small>`:''}</button>`).join(''):'<p class="mini" style="padding:10px">Aucune entreprise trouvée.</p>';
    results.style.display='block';
    results.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>choose(list[i])));
  }

  search.addEventListener('input',e=>{e.stopImmediatePropagation();document.querySelector('#planningCompanyId').value='';document.querySelector('#planningCompanySelected').textContent='';renderResults()},true);
  search.addEventListener('focus',e=>{e.stopImmediatePropagation();renderResults()},true);
  deptFilter.addEventListener('change',renderResults);

  const addBtn=document.querySelector('#addPlanningEvent');
  addBtn?.addEventListener('click',()=>setTimeout(()=>{fillDepartments();deptFilter.value=''},0));
  fillDepartments();
  importCompletedVisits();
})();