(()=>{
  const ENDPOINT='https://script.google.com/macros/s/AKfycbzl9VdZWwmmojUG_2PMQRjN3oapGfz_ASwNtxPhyIqsf5C1TqGCEFRb-7csq-y60lIqLQ/exec';
  const TOKEN='technimat-crm-2026';
  const ALLOWED_USERS=new Set(['vincent','cedric']);
  const user=window.CRM_USER||'';
  if(!ALLOWED_USERS.has(user))return;

  const userName=window.CRM_USER_NAME||({vincent:'Vincent',cedric:'Cédric'}[user]);
  const cacheKey=`crmSheetsSyncCache:${user}`;
  const planningKey=window.CRM_PLANNING_KEY;
  const storageKey=window.CRM_STORAGE_KEY;
  const originalSetItem=Storage.prototype.setItem;
  let timer=0,running=false,pending=false;

  const text=value=>String(value??'').trim();
  const norm=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
  const bool=value=>Boolean(value);

  function getHistory(){
    if(typeof state!=='undefined'&&Array.isArray(state.history))return state.history;
    const saved=readJson(storageKey,{});
    return Array.isArray(saved.history)?saved.history:[];
  }

  function getPlanning(){
    const events=readJson(planningKey,[]);
    return Array.isArray(events)?events:[];
  }

  function matchingPlanning(visit,events){
    return events.find(event=>event.date===visit.date&&(
      (visit.companyId&&String(event.companyId)===String(visit.companyId))||
      norm(event.company)===norm(visit.companyName)
    ));
  }

  function baseRecord(id,date,type,company){
    return {
      'ID enregistrement':id,
      'Date':text(date),
      'Commercial':userName,
      'Type':type,
      'Entreprise':text(company),
      'Contact':'',
      'Téléphone':'',
      'E-mail':'',
      'Adresse':'',
      'Département':'',
      'Heure début':'',
      'Heure fin':'',
      'Sans horaire fixe':false,
      'Statut':'',
      'Compte rendu':'',
      'Actions à effectuer':'',
      'Échéance':'',
      'ID CRM local':'',
      'Source':'CRM TECHNIMAT v46',
      'Rapport envoyé':false,
      'Observations':''
    };
  }

  function planningRecord(event){
    const record=baseRecord(
      `${user}:planning:${event.id}`,
      event.date,
      event.tourProspect?'Prospect':'Rendez-vous',
      event.company||event.title
    );
    record['Heure début']=text(event.start);
    record['Heure fin']=text(event.end);
    record['Sans horaire fixe']=bool(event.flexibleTime);
    record['Statut']=event.completed?'Réalisé':'Prévu';
    record['ID CRM local']=text(event.id);
    record['Observations']=[text(event.title),text(event.notes)].filter(Boolean).join(' — ');
    return record;
  }

  function historyRecord(visit,events){
    const appointment=matchingPlanning(visit,events)||{};
    const record=baseRecord(
      `${user}:history:${visit.id}`,
      visit.date,
      appointment.tourProspect?'Tournée':'Rendez-vous',
      visit.companyName
    );
    record['Heure début']=text(appointment.start);
    record['Heure fin']=text(appointment.end);
    record['Sans horaire fixe']=bool(appointment.flexibleTime);
    record['Statut']='Réalisé';
    record['Compte rendu']=text(visit.summary);
    record['Actions à effectuer']=text(visit.next);
    record['Échéance']=text(visit.followup);
    record['ID CRM local']=text(visit.id);
    record['Observations']=[
      visit.contactMethod&&`Moyen : ${text(visit.contactMethod)}`,
      visit.needs&&`Besoins : ${text(visit.needs)}`,
      visit.bestTime&&`Meilleur moment : ${text(visit.bestTime)}`,
      visit.role&&`Fonction : ${text(visit.role)}`
    ].filter(Boolean).join(' — ');
    return record;
  }

  function currentRecords(){
    const events=getPlanning();
    return [
      ...events.map(planningRecord),
      ...getHistory().map(visit=>historyRecord(visit,events))
    ].filter(record=>record['ID enregistrement']&&record['Date']);
  }

  function changedRecords(current,previous){
    const oldById=new Map(previous.map(record=>[record['ID enregistrement'],record]));
    const nowById=new Map(current.map(record=>[record['ID enregistrement'],record]));
    const changed=current.filter(record=>JSON.stringify(record)!==JSON.stringify(oldById.get(record['ID enregistrement'])));
    previous.forEach(record=>{
      if(nowById.has(record['ID enregistrement']))return;
      changed.push({
        ...record,
        'Statut':'Annulé',
        'Actions à effectuer':'',
        'Échéance':'',
        'Rapport envoyé':true,
        'Observations':[text(record['Observations']),'Supprimé depuis le CRM'].filter(Boolean).join(' — ')
      });
    });
    return changed;
  }

  function setStatus(message,ok=false){
    let status=document.querySelector('#crmSyncStatus');
    if(!status){
      status=document.createElement('span');
      status.id='crmSyncStatus';
      status.style.cssText='font-size:11px;font-weight:700;white-space:nowrap';
      const bar=document.querySelector('#crmUserBar');
      if(bar)bar.prepend(status);
    }
    if(status){status.textContent=message;status.style.color=ok?'#18733c':'#b3131b'}
  }

  async function post(records){
    for(let index=0;index<records.length;index+=40){
      const payload={
        token:TOKEN,
        records:records.slice(index,index+40).map(record=>({...record,'Date synchronisation':new Date().toISOString()}))
      };
      await fetch(ENDPOINT,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body:JSON.stringify(payload),
        cache:'no-store',
        credentials:'omit'
      });
    }
  }

  async function sync(){
    if(running){pending=true;return}
    running=true;pending=false;
    const current=currentRecords();
    const previous=readJson(cacheKey,[]);
    const changes=changedRecords(current,Array.isArray(previous)?previous:[]);
    if(!changes.length){setStatus('✓ Synchronisé',true);running=false;return}
    setStatus('Synchronisation…');
    try{
      await post(changes);
      originalSetItem.call(localStorage,cacheKey,JSON.stringify(current));
      setStatus('✓ Synchronisé',true);
    }catch(error){
      console.error('Synchronisation Google Sheets impossible',error);
      setStatus('Synchronisation en attente');
    }finally{
      running=false;
      if(pending)schedule(300);
    }
  }

  function schedule(delay=700){clearTimeout(timer);timer=setTimeout(sync,delay)}
  window.CRM_SYNC_NOW=sync;
  Storage.prototype.setItem=function(key,value){
    const result=originalSetItem.call(this,key,value);
    if(this===localStorage&&(key===storageKey||key===planningKey))schedule();
    return result;
  };

  window.addEventListener('online',()=>schedule(100));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(100)});
  setInterval(()=>schedule(100),5*60*1000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(500));
  else schedule(500);
})();
