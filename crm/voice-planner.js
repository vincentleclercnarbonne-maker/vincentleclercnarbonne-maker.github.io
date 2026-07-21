(()=>{
  const wait=()=>{
    const planning=document.querySelector('#planning');
    const addBtn=document.querySelector('#addPlanningEvent');
    if(!planning||!addBtn)return setTimeout(wait,150);

    const style=document.createElement('style');
    style.textContent=`
      button,a,[role="button"],select,label[for],.clickable{cursor:pointer}
      button:disabled{cursor:not-allowed}
      .voice-planner{margin:14px 0;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:18px}
      .voice-planner h2{margin:0 0 5px}.voice-planner p{margin:0 0 12px;color:#666}
      .voice-row{display:flex;gap:8px;align-items:stretch}.voice-row textarea{flex:1;min-height:110px}
      .mic-btn{min-width:58px;font-size:24px}.mic-btn.listening{background:#b3131b;animation:pulse 1s infinite}
      .voice-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.voice-preview{margin-top:12px}
      .voice-preview .item{margin:7px 0;padding:10px;border:1px solid #eee;border-radius:12px}
      .route-step{background:#f7f7f7;border-style:dashed}.voice-status{font-size:13px;margin-top:8px;color:#555}
      .finish-dictation{display:none;background:#111;color:#fff}.finish-dictation.visible{display:inline-block}
      .smart-note{font-size:12px;padding:8px;border-radius:9px;margin-top:7px}.smart-note.ok{color:#155724;background:#eaf7ee}
      .smart-note.bad{color:#8a1010;background:#ffe7e7}.route-line{font-size:12px;color:#333;margin-top:6px}
      .hours-link{display:inline-block;margin-top:5px;font-size:12px}@keyframes pulse{50%{opacity:.65}}
      @media(max-width:600px){.voice-row{flex-direction:column}.mic-btn{width:100%}}
    `;
    document.head.appendChild(style);

    const box=document.createElement('div');
    box.className='voice-planner';
    box.innerHTML=`<h2>Assistant intelligent de journée</h2><p>Calcul rapide hors trafic en direct. Les rendez-vous demandés restent prioritaires et les prospects sont ajoutés seulement s’ils permettent le retour souhaité.</p><div class="voice-row"><textarea id="dayPrompt" placeholder="Exemple : jeudi BSA à 9 h, MC Projec ensuite, ajoute des prospects proches et retour à Technimat vers 16 h"></textarea><button type="button" id="voiceMic" class="mic-btn">🎙️</button></div><div class="voice-actions"><button type="button" id="finishDictation" class="finish-dictation">Dictée terminée</button><button type="button" id="analyseDay">Préparer intelligemment</button><button type="button" id="createDay" class="ghost dark" disabled>Ajouter au planning</button></div><div id="voiceStatus" class="voice-status"></div><div id="voicePreview" class="voice-preview"></div>`;
    addBtn.before(box);

    const prompt=document.querySelector('#dayPrompt'),status=document.querySelector('#voiceStatus'),preview=document.querySelector('#voicePreview'),create=document.querySelector('#createDay'),analyse=document.querySelector('#analyseDay');
    const TECH={name:'TECHNIMAT',address:'2 rue Émile Levassor, 11100 Narbonne',lat:43.1843,lon:3.0031};
    let proposals=[],summary={return:null,target:null,conflicts:0};
    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const mins=t=>{const[h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
    const fmt=m=>`${String(Math.floor(Math.max(0,m)/60)%24).padStart(2,'0')}:${String(Math.max(0,m)%60).padStart(2,'0')}`;
    const add=(t,n)=>fmt(mins(t)+n);
    const duration=p=>p.title==='Pause déjeuner'?60:45;
    const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};

    function companies(){
      const all=[];
      (window.state?.prospects||[]).forEach(p=>all.push({id:p.id,name:p.name,address:p.address||'',dept:String(p.dept||''),status:p.status||p.type||''}));
      (window.RP||[]).forEach(p=>all.push({id:p.i||p.s,name:p.c,address:p.a||'',dept:String(p.d||''),status:p.t||''}));
      all.push({id:'mc-projec-fixed',name:'M C PROJEC',address:'34 impasse Saint-Jacques, 31120 Portet-sur-Garonne',dept:'31',status:'Prospect'});
      const seen=new Map();for(const c of all){if(!c.name)continue;const k=norm(c.name);if(!seen.has(k)||(!seen.get(k).address&&c.address))seen.set(k,c)}
      return [...seen.values()];
    }
    function findCompany(text){
      const n=norm(text);
      const forced=n.includes('mcprojec')||n.includes('mcproject')||n.includes('mcprojet')||n.includes('mcprojeu')?'mcprojec':n.includes('bsa')?'bsaoccitanie':n.includes('epe')?'entreprisepeintureetenduits':n.includes('etr')?'entreprisedetravauxetderavalement':'';
      if(forced){const hit=companies().find(c=>norm(c.name).includes(forced));if(hit)return hit}
      let best=null,score=0;
      for(const c of companies()){
        const nc=norm(c.name);if(n.includes(nc))return c;
        const words=String(c.name).toLowerCase().split(/\s+/).map(norm).filter(w=>w.length>2);
        const hits=words.filter(w=>n.includes(w)).length;
        if(hits>score){score=hits;best=c}
      }
      return score>=1?best:null;
    }
    function resolveDate(text){const d=new Date(),n=norm(text);if(n.includes('demain'))d.setDate(d.getDate()+1);else{const days=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'],i=days.findIndex(x=>n.includes(x));if(i>=0){let a=(i-d.getDay()+7)%7;if(!a)a=7;d.setDate(d.getDate()+a)}}return iso(d)}
    function timeFrom(s){const m=s.match(/(?:a|à|vers)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)\b/i);return m?`${String(+m[1]).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null}
    function returnTarget(text){const m=text.match(/(?:retour|etre|être|arriver|rentrer)[^,.;]{0,50}?(?:narbonne|technimat|magasin)[^,.;]{0,25}?(?:a|à|vers|avant)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)?/i)||text.match(/(?:narbonne|technimat|magasin)[^,.;]{0,20}?(\d{1,2})\s*h\s*(\d{1,2})?/i);return m?`${String(+m[1]).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null}

    const city={narbonne:[43.1843,3.0031],toulouse:[43.6047,1.4442],carcassonne:[43.213,2.3491],auterive:[43.3517,1.4747],muret:[43.46,1.325],plaisancedutouch:[43.5657,1.296],portetsurgaronne:[43.5239,1.406],deyme:[43.4719,1.526],fontenilles:[43.5539,1.19],ausson:[43.082,0.591],saintbauzilledemontmel:[43.770,3.956]};
    function point(address){const n=norm(address);if(n.includes('2rueemilelevassor'))return{lat:TECH.lat,lon:TECH.lon};for(const[k,v]of Object.entries(city))if(n.includes(k))return{lat:v[0],lon:v[1]};const cp=(String(address).match(/\b(11|31|34|66)\d{3}\b/)||[])[0];if(cp?.startsWith('31'))return{lat:43.55,lon:1.40};if(cp?.startsWith('11'))return{lat:43.21,lon:2.35};if(cp?.startsWith('34'))return{lat:43.61,lon:3.88};if(cp?.startsWith('66'))return{lat:42.69,lon:2.89};return null}
    function route(a,b){const p=point(a),q=point(b);if(!p||!q)return{minutes:35,km:30,estimated:true};const R=6371,toRad=x=>x*Math.PI/180,dLat=toRad(q.lat-p.lat),dLon=toRad(q.lon-p.lon),h=Math.sin(dLat/2)**2+Math.cos(toRad(p.lat))*Math.cos(toRad(q.lat))*Math.sin(dLon/2)**2;const straight=2*R*Math.asin(Math.sqrt(h)),km=Math.max(2,straight*1.28),speed=km>80?82:km>25?65:42;return{minutes:Math.ceil(km/speed*60),km:Math.round(km*10)/10,estimated:true}}
    function rec(c,date,start,title,notes,requested=false){return{id:'smart-'+Date.now()+'-'+Math.random().toString(36).slice(2),companyId:c?.id||'',company:c?.name||'',address:c?.address||'',date,start,end:add(start,title==='Pause déjeuner'?60:45),title,notes,requested,feasible:true}}

    function buildRoutes(text){
      proposals.sort((a,b)=>a.start.localeCompare(b.start));summary={target:returnTarget(text),return:null,conflicts:0};let prev={company:TECH.name,address:TECH.address,end:'07:00'};
      for(const p of proposals){if(!p.address)continue;const r=route(prev.address,p.address);p.fromName=prev.company;p.travelMinutes=r.minutes;p.distanceKm=r.km;const earliest=mins(prev.end)+r.minutes+10;if(earliest>mins(p.start)){p.feasible=false;p.suggestedStart=fmt(earliest);summary.conflicts++}else p.feasible=true;prev=p}
      const last=[...proposals].reverse().find(p=>p.address);if(last){const r=route(last.address,TECH.address),arrival=add(last.end,r.minutes+10);summary.return={...r,from:last.company,depart:last.end,arrival};if(summary.target&&mins(arrival)>mins(summary.target)+15){summary.conflicts++;summary.return.conflict=true}}
    }
    function candidateList(excluded,dept){return companies().filter(c=>!excluded.has(norm(c.name))&&(!dept||!c.dept||c.dept===dept)&&(/prospect|nonvisite/.test(norm(c.status))||!c.status)).slice(0,80)}
    function addProspects(date,text,excluded){
      const target=returnTarget(text),latest=target?mins(target)+15:17*60+30;let current=[...proposals].sort((a,b)=>a.start.localeCompare(b.start)).at(-1);if(!current?.address)return;
      const dept=companies().find(c=>String(c.id)===String(current.companyId))?.dept||'';let candidates=candidateList(excluded,dept);
      for(let count=0;count<6&&candidates.length;count++){
        let best=null;
        for(const c of candidates){const out=route(current.address,c.address),start=Math.max(mins(current.end)+out.minutes+10,13*60+30),end=start+45,back=route(c.address,TECH.address),arrival=end+back.minutes+10;if(arrival<=latest){const score=out.minutes;if(!best||score<best.score)best={c,start,score}}}
        if(!best)break;const p=rec(best.c,date,fmt(best.start),'Prospection','Suggestion rapide compatible avec le retour');proposals.push(p);excluded.add(norm(best.c.name));current=p;candidates=candidates.filter(c=>norm(c.name)!==norm(best.c.name));
      }
    }
    function render(){let html='';if(proposals.length){const first=proposals.find(p=>p.address),r=route(TECH.address,first.address);html+=`<article class="item route-step"><h3>🚐 Départ de TECHNIMAT</h3><p><strong>${TECH.address}</strong></p><div class="route-line">Départ conseillé : ${add(first.start,-r.minutes-10)} · ${r.minutes} min · ${r.km} km</div></article>`}
      html+=proposals.map((p,i)=>`<article class="item"><h3>${p.start}–${p.end} · ${p.title}${p.requested?' · demandé':''}</h3><p><strong>${p.company||'Pause'}</strong>${p.address?'<br>'+p.address:''}</p>${p.address?`<div class="route-line">🚗 Depuis ${p.fromName} : ${p.travelMinutes} min · ${p.distanceKm} km (estimation rapide)</div>`:''}<div class="smart-note ${p.feasible?'ok':'bad'}">${p.feasible?'Créneau réalisable.':`Horaire impossible. Début conseillé : ${p.suggestedStart}.`}</div>${!p.feasible?`<button type="button" class="shift" data-i="${i}">Décaler à ${p.suggestedStart}</button>`:''}</article>`).join('');
      if(summary.return)html+=`<article class="item route-step"><h3>🏁 Retour à TECHNIMAT</h3><p>Départ de ${summary.return.from} à ${summary.return.depart}</p><div class="route-line">🚗 ${summary.return.minutes} min · arrivée estimée ${summary.return.arrival}</div><div class="smart-note ${summary.return.conflict?'bad':'ok'}">${summary.return.conflict?`Retour trop tard pour l’objectif ${summary.target} ±15 min.`:`Retour compatible${summary.target?' avec l’objectif '+summary.target+' ±15 min':''}.`}</div></article>`;
      preview.innerHTML=html||'<p>Aucun rendez-vous reconnu.</p>';preview.querySelectorAll('.shift').forEach(b=>b.addEventListener('click',()=>{const p=proposals[+b.dataset.i];p.start=p.suggestedStart;p.end=add(p.start,duration(p));buildRoutes(prompt.value);render();create.disabled=summary.conflicts>0}))
    }

    analyse.addEventListener('click',()=>{
      const text=prompt.value.trim();if(!text){status.textContent='Décrivez d’abord votre journée.';return}
      analyse.disabled=true;analyse.textContent='Calcul rapide…';status.textContent='Analyse en cours…';create.disabled=true;
      setTimeout(()=>{
        try{
          proposals=[];const date=resolveDate(text),excluded=new Set();let cursor='08:00';const parts=text.split(/(?:,|;|\bpuis\b|\bensuite\b|\bet après\b|\bet apres\b)/i).map(x=>x.trim()).filter(Boolean);
          for(const part of parts){const explicit=timeFrom(part);if(explicit)cursor=explicit;const n=norm(part);if(/prospect|complete|continue|remplis|remplir/.test(n)&&!findCompany(part))continue;const pause=/pause|dejeuner|déjeuner|repas/i.test(part),c=pause?null:findCompany(part);if(pause)proposals.push(rec(null,date,cursor,'Pause déjeuner',part,true));else if(c){excluded.add(norm(c.name));proposals.push(rec(c,date,cursor,/relance|appel/i.test(part)?'Relance téléphonique':'Visite commerciale',part,true))}cursor=add(proposals.at(-1)?.end||cursor,15)}
          if(/prospect|complete|continue|remplis|remplir/.test(norm(text)))addProspects(date,text,excluded);buildRoutes(text);render();status.textContent=`Calcul terminé immédiatement : ${proposals.length} étape(s), ${summary.conflicts} conflit(s).`;create.disabled=!proposals.length||summary.conflicts>0;
        }catch(e){status.textContent='Erreur pendant le calcul : '+e.message}
        analyse.disabled=false;analyse.textContent='Préparer intelligemment';
      },30);
    });
    create.addEventListener('click',()=>{const current=JSON.parse(localStorage.getItem('crmPlanning')||'[]'),keys=new Set(current.map(e=>`${e.date}|${e.start}|${norm(e.company||e.title)}`));let added=0;for(const p of proposals){const k=`${p.date}|${p.start}|${norm(p.company||p.title)}`;if(!keys.has(k)){current.push(p);keys.add(k);added++}}localStorage.setItem('crmPlanning',JSON.stringify(current));status.textContent=`${added} rendez-vous ajouté(s).`;setTimeout(()=>location.reload(),500)});

    const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=document.querySelector('#voiceMic'),finish=document.querySelector('#finishDictation');
    if(SR){const r=new SR();r.lang='fr-FR';r.continuous=true;r.interimResults=true;let listen=false,committed='';const start=()=>{if(listen)try{r.start()}catch(e){}};mic.addEventListener('click',()=>{if(listen)return;listen=true;committed=prompt.value.trim();finish.classList.add('visible');start()});finish.addEventListener('click',()=>{listen=false;finish.classList.remove('visible');try{r.stop()}catch(e){}});r.onresult=e=>{let temp='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript.trim();if(e.results[i].isFinal)committed=[committed,t].filter(Boolean).join(' ');else temp=t}prompt.value=[committed,temp].filter(Boolean).join(' ')};r.onend=()=>{if(listen)setTimeout(start,150)}}else mic.disabled=true;
  };wait();
})();