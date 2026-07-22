(()=>{
  const wait=()=>{
    const planning=document.querySelector('#planning');
    const addBtn=document.querySelector('#addPlanningEvent');
    if(!planning||!addBtn)return setTimeout(wait,150);

    const style=document.createElement('style');
    style.textContent=`button,a,[role="button"],select,.clickable{cursor:pointer}button:disabled{cursor:not-allowed}.voice-planner{margin:14px 0;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.voice-row{display:flex;gap:8px;align-items:stretch}.voice-row textarea{flex:1;min-height:120px}.mic-btn{min-width:58px;font-size:24px}.voice-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.voice-status{font-size:13px;margin-top:8px;color:#555}.voice-preview .item{margin:8px 0;padding:11px;border:1px solid #eee;border-radius:12px}.route-step{background:#f7f7f7;border-style:dashed}.route-line{font-size:12px;color:#333;margin-top:6px}.smart-note{font-size:12px;padding:8px;border-radius:9px;margin-top:7px}.smart-note.ok{background:#eaf7ee;color:#155724}.smart-note.warn{background:#fff1db;color:#7a3d00}.smart-note.bad{background:#ffe7e7;color:#8a1010}.finish-dictation{display:none;background:#111;color:#fff}.finish-dictation.visible{display:inline-block}@media(max-width:600px){.voice-row{flex-direction:column}.mic-btn{width:100%}}`;
    document.head.appendChild(style);

    const box=document.createElement('div');
    box.className='voice-planner';
    box.innerHTML=`<h2>Assistant commercial intelligent</h2><p>Les rendez-vous demandés sont verrouillés. L’assistant remplit ensuite les créneaux libres avec les prospects les plus proches, prévoit la pause déjeuner et respecte votre heure de retour.</p><div class="voice-row"><textarea id="dayPrompt" placeholder="Exemple : jeudi EPE à 8 h 30, puis MC Projec vers 9 h 30, ajoute des prospects proches et retour à Technimat vers 16 h"></textarea><button type="button" id="voiceMic" class="mic-btn">🎙️</button></div><div class="voice-actions"><button type="button" id="finishDictation" class="finish-dictation">Dictée terminée</button><button type="button" id="analyseDay">Préparer intelligemment</button><button type="button" id="createDay" class="ghost dark" disabled>Ajouter au planning</button></div><div id="voiceStatus" class="voice-status"></div><div id="voicePreview" class="voice-preview"></div>`;
    addBtn.before(box);

    const prompt=document.querySelector('#dayPrompt'),status=document.querySelector('#voiceStatus'),preview=document.querySelector('#voicePreview'),analyse=document.querySelector('#analyseDay'),create=document.querySelector('#createDay');
    const TECH={name:'TECHNIMAT',address:'2 rue Émile Levassor, 11100 Narbonne',lat:43.1843,lon:3.0031};
    let proposals=[],summary={};
    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const mins=t=>{const[h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
    const fmt=m=>`${String(Math.floor(Math.max(0,m)/60)%24).padStart(2,'0')}:${String(Math.max(0,m)%60).padStart(2,'0')}`;
    const add=(t,n)=>fmt(mins(t)+n);
    const localIso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    function companies(){
      const all=[];
      (window.state?.prospects||[]).forEach(p=>all.push({id:p.id,name:p.name,address:p.address||'',dept:String(p.dept||''),status:p.status||p.type||'',priority:p.priority||0}));
      (window.RP||[]).forEach(p=>all.push({id:p.i||p.s,name:p.c,address:p.a||'',dept:String(p.d||''),status:p.t||'',priority:0}));
      all.push({id:'mc-projec-fixed',name:'M C PROJEC',address:'34 impasse Saint-Jacques, 31120 Portet-sur-Garonne',dept:'31',status:'Prospect'});
      const seen=new Map();
      for(const c of all){if(!c.name)continue;const k=norm(c.name);const old=seen.get(k);if(!old||(!old.address&&c.address))seen.set(k,{...old,...c})}
      return [...seen.values()];
    }
    function findCompany(text){
      const n=norm(text);
      const alias=n.includes('mcprojec')||n.includes('mcproject')||n.includes('mcprojet')||n.includes('mcprojeu')?'mcprojec':n.includes('bsa')?'bsaoccitanie':n.includes('epe')?'entreprisepeintureetenduits':n.includes('etr')?'entreprisedetravauxetderavalement':'';
      if(alias){const c=companies().find(x=>norm(x.name).includes(alias));if(c)return c}
      return companies().find(c=>n.includes(norm(c.name)))||null;
    }
    function resolveDate(text){
      const d=new Date(),n=norm(text),days=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
      if(n.includes('demain'))d.setDate(d.getDate()+1);else{const i=days.findIndex(x=>n.includes(x));if(i>=0){let a=(i-d.getDay()+7)%7;if(!a)a=7;d.setDate(d.getDate()+a)}}
      return localIso(d);
    }
    function extractTime(s){const m=s.match(/\b(?:a|à|vers)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)\b/i);return m?`${String(+m[1]).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null}
    function returnTarget(text){const m=text.match(/(?:retour|etre|être|arriver|rentrer)[^,.;]{0,60}?(?:narbonne|technimat|magasin)[^,.;]{0,25}?(?:a|à|vers|avant)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)?/i)||text.match(/(?:narbonne|technimat|magasin)[^,.;]{0,25}?(\d{1,2})\s*h\s*(\d{1,2})?/i);return m?`${String(+m[1]).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null}

    const city={narbonne:[43.1843,3.0031],toulouse:[43.6047,1.4442],carcassonne:[43.213,2.3491],auterive:[43.3517,1.4747],muret:[43.46,1.325],plaisancedutouch:[43.5657,1.296],portetsurgaronne:[43.5239,1.406],castanettolosan:[43.5156,1.498],deyme:[43.4719,1.526],fontenilles:[43.5539,1.19],ausson:[43.082,0.591],mirepoix:[43.088,1.874],mielan:[43.43,0.307]};
    function point(address){const n=norm(address);if(n.includes('2rueemilelevassor'))return{lat:TECH.lat,lon:TECH.lon};for(const[k,v]of Object.entries(city))if(n.includes(k))return{lat:v[0],lon:v[1]};const cp=(String(address).match(/\b(11|31|34|66)\d{3}\b/)||[])[0];if(cp?.startsWith('31'))return{lat:43.55,lon:1.40};if(cp?.startsWith('11'))return{lat:43.21,lon:2.35};if(cp?.startsWith('34'))return{lat:43.61,lon:3.88};if(cp?.startsWith('66'))return{lat:42.69,lon:2.89};return null}
    function route(a,b){const p=point(a),q=point(b);if(!p||!q)return{minutes:35,km:30};const R=6371,tr=x=>x*Math.PI/180,dlat=tr(q.lat-p.lat),dlon=tr(q.lon-p.lon),h=Math.sin(dlat/2)**2+Math.cos(tr(p.lat))*Math.cos(tr(q.lat))*Math.sin(dlon/2)**2;const straight=2*R*Math.asin(Math.sqrt(h)),km=Math.max(2,straight*1.25),speed=km>80?82:km>25?65:42;return{minutes:Math.ceil(km/speed*60),km:Math.round(km*10)/10}}
    function rec(c,date,start,title,notes,requested=false){return{id:'smart-'+Date.now()+'-'+Math.random().toString(36).slice(2),companyId:c?.id||'',company:c?.name||'',address:c?.address||'',date,start,end:add(start,title==='Pause déjeuner'?60:45),title,notes,requested,reason:'',fromName:'',travelMinutes:0,distanceKm:0}}

    function requestedItems(text){
      const chunks=text.split(/(?:,|;|\bpuis\b|\bensuite\b|\bet après\b|\bet apres\b)/i).map(x=>x.trim()).filter(Boolean),out=[];
      for(const chunk of chunks){const n=norm(chunk);if((n.includes('technimat')||n.includes('narbonne')||n.includes('magasin'))&&returnTarget(chunk))continue;if(/prospect|complete|continue|remplis|remplir|passage/.test(n)&&!findCompany(chunk))continue;const c=findCompany(chunk);if(c)out.push({company:c,time:extractTime(chunk),notes:chunk})}
      return out;
    }
    function scheduleRequested(items,date){
      proposals=[];let prev={company:TECH.name,address:TECH.address,end:null};
      items.forEach((it,i)=>{const r=route(prev.address,it.company.address);let start=it.time||(!i?'08:30':fmt(mins(prev.end)+r.minutes+10));let adapted=false;if(i>0){const earliest=mins(prev.end)+r.minutes+10;if(mins(start)<earliest){start=fmt(earliest);adapted=true}}const p=rec(it.company,date,start,'Visite commerciale',it.notes,true);p.fromName=prev.company;p.travelMinutes=r.minutes;p.distanceKm=r.km;p.reason=adapted?`Horaire ${it.time} impossible après ${prev.company}; premier horaire réaliste ${start}.`:'Rendez-vous demandé et verrouillé.';proposals.push(p);prev=p});
    }
    function eligible(excluded,dept){
      const visits=window.state?.visits||[];const visited=new Set(visits.map(v=>String(v.companyId||'')));
      return companies().filter(c=>c.address&&!excluded.has(norm(c.name))&&(!dept||!c.dept||c.dept===dept)&&(/prospect|nonvisite|relancer/.test(norm(c.status))||!visited.has(String(c.id))));
    }
    function bestForGap(from,until,excluded,dept,returnLimit){
      let cursor=from.end?mins(from.end):until.start,curr=from,bestPlan=[],cands=eligible(excluded,dept);
      while(cands.length){let best=null;for(const c of cands){const r=route(curr.address,c.address),start=cursor+r.minutes+10,end=start+45;if(end>until.end)continue;const back=route(c.address,until.address);if(end+back.minutes+10>until.start)continue;const score=r.minutes+(visitedPenalty(c))+(returnLimit&&end+route(c.address,TECH.address).minutes+10>returnLimit?1000:0);if(!best||score<best.score)best={c,r,start,end,score}}
        if(!best||best.score>=1000)break;const p=rec(best.c,until.date,fmt(best.start),'Prospection','Créneau libre optimisé',false);p.fromName=curr.company;p.travelMinutes=best.r.minutes;p.distanceKm=best.r.km;p.reason=`Choisi car à ${best.r.minutes} min, non planifié et compatible avec l’étape suivante.`;bestPlan.push(p);excluded.add(norm(best.c.name));curr=p;cursor=best.end;cands=cands.filter(c=>norm(c.name)!==norm(best.c.name));}
      return bestPlan;
    }
    function visitedPenalty(c){const st=norm(c.status);return /relancer/.test(st)?-8:/prospect|nonvisite/.test(st)?-5:0}
    function fillGaps(text,date){
      if(!/prospect|complete|continue|remplis|remplir|passage/.test(norm(text))||!proposals.length)return;
      const target=returnTarget(text),returnLimit=target?mins(target)+15:17*60+30,excluded=new Set(proposals.map(p=>norm(p.company))),dept=companies().find(c=>String(c.id)===String(proposals[0].companyId))?.dept||'';
      const fixed=[...proposals].sort((a,b)=>a.start.localeCompare(b.start)),filled=[];
      for(let i=0;i<fixed.length;i++){
        filled.push(fixed[i]);
        const next=fixed[i+1];
        if(next){const gapStart=mins(fixed[i].end),gapEnd=mins(next.start);if(gapEnd-gapStart>=70){filled.push(...bestForGap(fixed[i],{start:gapEnd,end:gapEnd,address:next.address,date,company:next.company},excluded,dept,returnLimit))}}
      }
      let current=filled.at(-1);
      const lunchStart=12*60+15,lunchEnd=13*60+15;
      if(mins(current.end)<lunchStart){const pseudo={start:lunchStart,end:lunchStart,address:current.address,date,company:'Pause déjeuner'};filled.push(...bestForGap(current,pseudo,excluded,dept,returnLimit));current=filled.at(-1)}
      if(mins(current.end)<lunchEnd){const pause=rec(null,date,fmt(Math.max(lunchStart,mins(current.end))),'Pause déjeuner','Pause déjeuner automatique',false);pause.address=current.address;pause.fromName=current.company;pause.reason='Pause prévue avant la tournée de l’après-midi.';filled.push(pause);current=pause}
      while(true){let best=null;for(const c of eligible(excluded,dept)){const out=route(current.address,c.address),start=mins(current.end)+out.minutes+10,end=start+45,back=route(c.address,TECH.address),arrival=end+back.minutes+10;if(arrival>returnLimit)continue;const score=out.minutes+visitedPenalty(c);if(!best||score<best.score)best={c,out,start,score}}if(!best)break;const p=rec(best.c,date,fmt(best.start),'Prospection','Prospect ajouté pour compléter la journée',false);p.fromName=current.company||'Pause déjeuner';p.travelMinutes=best.out.minutes;p.distanceKm=best.out.km;p.reason=`Choisi car à ${best.out.minutes} min et permet un retour avant ${fmt(returnLimit)}.`;filled.push(p);excluded.add(norm(best.c.name));current=p;if(filled.length>10)break}
      proposals=filled.sort((a,b)=>a.start.localeCompare(b.start));
    }
    function computeSummary(text){const last=[...proposals].reverse().find(p=>p.address);const target=returnTarget(text);if(!last){summary={};return}const r=route(last.address,TECH.address),arrival=add(last.end,r.minutes+10);summary={target,return:{...r,from:last.company||last.title,depart:last.end,arrival}}}
    function render(){let html='';if(proposals.length){const first=proposals.find(p=>p.address),r=route(TECH.address,first.address);html+=`<article class="item route-step"><h3>🚐 Départ de TECHNIMAT</h3><p><strong>${TECH.address}</strong></p><div class="route-line">Départ conseillé : ${add(first.start,-r.minutes-10)} · ${r.minutes} min · ${r.km} km</div></article>`}html+=proposals.map(p=>`<article class="item"><h3>${p.start}–${p.end} · ${p.title}${p.requested?' · obligatoire':''}</h3><p><strong>${p.company||'Pause déjeuner'}</strong>${p.address?'<br>'+p.address:''}</p>${p.address?`<div class="route-line">🚗 Depuis ${p.fromName||TECH.name} : ${p.travelMinutes} min · ${p.distanceKm} km</div>`:''}<div class="smart-note ${p.requested?'ok':'warn'}">${p.reason||p.notes}</div></article>`).join('');if(summary.return){const diff=summary.target?mins(summary.return.arrival)-mins(summary.target):0;html+=`<article class="item route-step"><h3>🏁 Retour à TECHNIMAT</h3><p>Départ de ${summary.return.from} à ${summary.return.depart}</p><div class="route-line">🚗 ${summary.return.minutes} min · arrivée estimée ${summary.return.arrival}</div><div class="smart-note ${summary.target&&Math.abs(diff)>15?'warn':'ok'}">${summary.target?`Objectif ${summary.target} ±15 min. Retour estimé ${summary.return.arrival}.`:`Retour estimé ${summary.return.arrival}.`}</div></article>`}preview.innerHTML=html||'<p>Aucun rendez-vous clairement reconnu.</p>'}

    analyse.addEventListener('click',()=>{const text=prompt.value.trim();if(!text){status.textContent='Décrivez d’abord votre journée.';return}analyse.disabled=true;analyse.textContent='Optimisation…';create.disabled=true;try{const date=resolveDate(text),items=requestedItems(text);scheduleRequested(items,date);fillGaps(text,date);computeSummary(text);render();const prospects=proposals.filter(p=>p.title==='Prospection').length;status.textContent=`Journée optimisée : ${items.length} rendez-vous obligatoire(s), ${prospects} prospect(s), retour estimé ${summary.return?.arrival||'non calculé'}.`;create.disabled=!proposals.length}catch(e){status.textContent='Erreur : '+e.message}analyse.disabled=false;analyse.textContent='Préparer intelligemment'});
    create.addEventListener('click',()=>{if(!proposals.length)return;const current=JSON.parse(localStorage.getItem('crmPlanning')||'[]'),keys=new Set(current.map(e=>`${e.date}|${e.start}|${norm(e.company||e.title)}`));let added=0;for(const p of proposals){const k=`${p.date}|${p.start}|${norm(p.company||p.title)}`;if(keys.has(k))continue;current.push({...p});keys.add(k);added++}localStorage.setItem('crmPlanning',JSON.stringify(current));localStorage.setItem('crmPlanningOpenDate',proposals[0].date);status.textContent=`${added} étape(s) ajoutée(s) au planning.`;setTimeout(()=>location.reload(),250)});

    const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=document.querySelector('#voiceMic'),finish=document.querySelector('#finishDictation');
    if(SR){const r=new SR();r.lang='fr-FR';r.continuous=true;r.interimResults=true;let listen=false,committed='';const start=()=>{if(listen)try{r.start()}catch(e){}};mic.addEventListener('click',()=>{if(listen)return;listen=true;committed=prompt.value.trim();finish.classList.add('visible');start()});finish.addEventListener('click',()=>{listen=false;finish.classList.remove('visible');try{r.stop()}catch(e){}});r.onresult=e=>{let temp='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript.trim();if(e.results[i].isFinal)committed=[committed,t].filter(Boolean).join(' ');else temp=t}prompt.value=[committed,temp].filter(Boolean).join(' ')};r.onend=()=>{if(listen)setTimeout(start,150)}}else mic.disabled=true;
  };wait();
})();