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
  const getCompanies=()=>{
    const ps=(window.state?.prospects||window.RP||[]);
    return ps.map(p=>({
      id:p.id||p.i||p.s||'',
      name:p.name||p.c||'Entreprise',
      address:p.address||p.a||'',
      dept:String(p.dept||p.d||'').trim()
    })).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  };

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
    const list=getCompanies().filter(p=>(!dept||p.dept===dept)&&(!term||p.name.toLowerCase().includes(term))).slice(0,30);
    results.innerHTML=list.length?list.map(p=>`<button type="button" data-id="${esc(p.id)}"><strong>${esc(p.name)}</strong>${p.dept?` <small>(${esc(p.dept)})</small>`:''}${p.address?`<br><small>${esc(p.address)}</small>`:''}</button>`).join(''):'<p class="mini" style="padding:10px">Aucune entreprise trouvée.</p>';
    results.style.display='block';
    results.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>choose(list[i])));
  }

  search.addEventListener('input',e=>{e.stopImmediatePropagation();document.querySelector('#planningCompanyId').value='';document.querySelector('#planningCompanySelected').textContent='';renderResults()},true);
  search.addEventListener('focus',e=>{e.stopImmediatePropagation();renderResults()},true);
  deptFilter.addEventListener('change',renderResults);

  const addBtn=document.querySelector('#addPlanningEvent');
  addBtn?.addEventListener('click',()=>setTimeout(()=>{fillDepartments();deptFilter.value=''},0));
  fillDepartments();
})();