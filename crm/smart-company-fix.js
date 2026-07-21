(()=>{
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');

  function ensureCompanies(){
    window.RP=Array.isArray(window.RP)?window.RP:[];
    const required=[
      {i:'manual-mc-projec',s:'manual-mc-projec',c:'M C PROJEC',a:'34 IMPASSE SAINT-JACQUES, 31120 PORTET-SUR-GARONNE',d:'31',t:'Prospect'},
      {i:'manual-bsa-occitanie',s:'manual-bsa-occitanie',c:'BSA OCCITANIE',a:'BSA GROUPE, 10 RUE JEAN DAMOYSEL, 31100 TOULOUSE',d:'31',t:'Visité – à suivre'},
      {i:'manual-epe',s:'manual-epe',c:'ENTREPRISE PEINTURE ET ENDUITS',a:'ZI LAVIGNE, 6 VOIE HELIOS, 31190 AUTERIVE',d:'31',t:'Visité – à suivre'},
      {i:'manual-etr',s:'manual-etr',c:'ENTREPRISE DE TRAVAUX ET DE RAVALEMENT',a:'6 IMPASSE ADA LOVELACE, 31830 PLAISANCE-DU-TOUCH',d:'31',t:'À relancer'}
    ];
    const existing=new Set(window.RP.map(x=>norm(x.c||x.name)));
    for(const item of required){
      if(!existing.has(norm(item.c))){window.RP.push(item);existing.add(norm(item.c));}
    }
  }

  function canonicalize(value){
    let s=String(value||'');
    const replacements=[
      [/\b(?:m\s*[.\-]?\s*c|mc)\s*(?:project|projet|projec|projette|projé)\b/gi,'M C PROJEC'],
      [/\bb\s*[.\-]?\s*s\s*[.\-]?\s*a(?:\s+occitanie)?\b/gi,'BSA OCCITANIE'],
      [/\be\s*[.\-]?\s*p\s*[.\-]?\s*e\b/gi,'ENTREPRISE PEINTURE ET ENDUITS'],
      [/\be\s*[.\-]?\s*t\s*[.\-]?\s*r\b/gi,'ENTREPRISE DE TRAVAUX ET DE RAVALEMENT']
    ];
    replacements.forEach(([r,v])=>{s=s.replace(r,v)});
    s=s.replace(/(?:BSA OCCITANIE\s*){2,}/gi,'BSA OCCITANIE ')
       .replace(/(?:M C PROJEC\s*){2,}/gi,'M C PROJEC ')
       .replace(/(?:ENTREPRISE PEINTURE ET ENDUITS\s*){2,}/gi,'ENTREPRISE PEINTURE ET ENDUITS ')
       .replace(/(?:ENTREPRISE DE TRAVAUX ET DE RAVALEMENT\s*){2,}/gi,'ENTREPRISE DE TRAVAUX ET DE RAVALEMENT ')
       .replace(/\s+/g,' ').trim();
    return s;
  }

  ensureCompanies();
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#analyseDay');
    if(!btn)return;
    ensureCompanies();
    const input=document.querySelector('#dayPrompt');
    if(input)input.value=canonicalize(input.value);
  },true);

  document.addEventListener('input',e=>{
    if(e.target?.id==='dayPrompt'){
      clearTimeout(window.__crmAliasTimer);
      window.__crmAliasTimer=setTimeout(()=>{e.target.value=canonicalize(e.target.value)},500);
    }
  });
})();