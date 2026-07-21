(()=>{
  const wait=()=>{
    const planning=document.querySelector('#planning');
    const addBtn=document.querySelector('#addPlanningEvent');
    if(!planning||!addBtn)return setTimeout(wait,200);

    const style=document.createElement('style');
    style.textContent=`
      .voice-planner{margin:14px 0;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:18px}
      .voice-planner h2{margin:0 0 5px}.voice-planner p{margin:0 0 12px;color:#666}
      .voice-row{display:flex;gap:8px;align-items:stretch}.voice-row textarea{flex:1;min-height:110px}
      .mic-btn{min-width:58px;font-size:24px}.mic-btn.listening{background:#b3131b;animation:pulse 1s infinite}
      .voice-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.voice-preview{margin-top:12px}
      .voice-preview .item{margin:7px 0;padding:10px;border:1px solid #eee;border-radius:12px}
      .voice-preview .route-step{background:#f7f7f7;border-style:dashed}.voice-status{font-size:13px;margin-top:8px;color:#555}
      .finish-dictation{display:none;background:#111;color:#fff}.finish-dictation.visible{display:inline-block}
      .smart-note{font-size:12px;padding:8px;border-radius:9px;margin-top:7px}.smart-note.ok{color:#155724;background:#eaf7ee}
      .smart-note.warn{color:#7a3d00;background:#fff1db}.smart-note.bad{color:#8a1010;background:#ffe7e7}
      .route-line{font-size:12px;color:#333;margin-top:6px}.hours-link{display:inline-block;margin-top:5px;font-size:12px}
      .apply-time:disabled{opacity:.6;cursor:wait}@keyframes pulse{50%{opacity:.65}}
      @media(max-width:600px){.voice-row{flex-direction:column}.mic-btn{width:100%}}
    `;
    document.head.appendChild(style);

    const box=document.createElement('div');
    box.className='voice-planner';
    box.innerHTML=`<h2>Assistant intelligent de journée</h2><p>Décrivez votre journée. Les rendez-vous demandés sont prioritaires, puis l’assistant complète avec des prospects compatibles avec votre heure de retour.</p><div class="voice-row"><textarea id="dayPrompt" placeholder="Exemple : jeudi BSA à 9 h, MC Projec à 9 h 25, puis ajoute des prospects et je veux être de retour à Technimat vers 16 h…"></textarea><button type="button" id="voiceMic" class="mic-btn" aria-label="Dicter ma journée">🎙️</button></div><div class="voice-actions"><button type="button" id="finishDictation" class="finish-dictation">Dictée terminée</button><button type="button" id="analyseDay">Préparer intelligemment</button><button type="button" id="createDay" class="ghost dark" disabled>Ajouter au planning</button></div><div id="voiceStatus" class="voice-status"></div><div id="voicePreview" class="voice-preview"></div>`;
    addBtn.before(box);

    const prompt=document.querySelector('#dayPrompt');
    const status=document.querySelector('#voiceStatus');
    const preview=document.querySelector('#voicePreview');
    const create=document.querySelector('#createDay');
    const TECH={name:'TECHNIMAT',address:'2 rue Émile Levassor, 11100 Narbonne',lat:43.1843,lon:3.0031};
    let proposals=[];
    let routeSummary={outbound:null,return:null,conflicts:0,unavailable:0,returnTarget:null};
    let recalculating=false;

    const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const mins=t=>{const[h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
    const time=m=>`${String(Math.floor(Math.max(0,m)/60)%24).padStart(2,'0')}:${String(Math.max(0,m)%60).padStart(2,'0')}`;
    const addMinutes=(t,n)=>time(mins(t)+n);
    const durationOf=p=>p.title==='Pause déjeuner'?60:45;
    const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};

    const specialAliases=[
      {test:n=>/^mcproje[ctu]*$/.test(n)||n.includes('mcprojec')||n.includes('mcproject')||n.includes('mcprojet'),target:'m c projec'},
      {test:n=>n.includes('bsa'),target:'bsa occitanie'},
      {test:n=>n.includes('epe')||n.includes('entreprisepeintureenduit'),target:'entreprise peinture et enduits'},
      {test:n=>n.includes('etr')||n.includes('entreprisedetravauxetderavalement'),target:'entreprise de travaux et de ravalement'}
    ];

    function companyList(){
      const all=[];
      (window.state?.prospects||[]).forEach(p=>all.push({id:p.id,name:p.name,address:p.address||'',dept:String(p.dept||''),status:p.status||p.type||''}));
      (window.RP||[]).forEach(p=>all.push({id:p.i||p.s,name:p.c,address:p.a||'',dept:String(p.d||''),status:p.t||''}));
      all.push({id:'mc-projec-fixed',name:'M C PROJEC',address:'34 impasse Saint-Jacques, 31120 Portet-sur-Garonne',dept:'31',status:'Prospect'});
      const seen=new Map();
      all.forEach(p=>{if(!p.name)return;const k=normalize(p.name);const old=seen.get(k);if(!old||(!old.address&&p.address))seen.set(k,{...old,...p})});
      return [...seen.values()];
    }

    function resolveDate(text){
      const now=new Date(),n=normalize(text);
      if(n.includes('demain')){now.setDate(now.getDate()+1);return iso(now)}
      if(n.includes('apresdemain')){now.setDate(now.getDate()+2);return iso(now)}
      const names=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
      const found=names.findIndex(x=>n.includes(x));
      if(found>=0){let add=(found-now.getDay()+7)%7;if(add===0)add=7;now.setDate(now.getDate()+add);return iso(now)}
      const m=text.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
      if(m){let y=m[3]?Number(m[3]):now.getFullYear();if(y<100)y+=2000;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
      return iso(now);
    }

    function timeFrom(s){
      const m=s.match(/\b(?:a|à|vers)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)\b/i);
      return m?`${String(Math.min(23,+m[1])).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null;
    }

    function returnTarget(text){
      const m=text.match(/(?:retour|etre|être|arriver|rentrer)[^.;,]{0,45}?(?:narbonne|technimat|magasin)[^.;,]{0,25}?(?:a|à|vers|avant)\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)?/i)
        ||text.match(/(?:a|à|vers|avant)\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)?[^.;,]{0,30}?(?:narbonne|technimat|magasin)/i);
      return m?`${String(+m[1]).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null;
    }

    function levenshtein(a,b){
      const m=Array.from({length:b.length+1},(_,i)=>i);
      for(let i=1;i<=a.length;i++){
        let prev=m[0];m[0]=i;
        for(let j=1;j<=b.length;j++){
          const cur=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=cur;
        }
      }
      return m[b.length];
    }

    function findCompany(segment){
      const n=normalize(segment);
      for(const a of specialAliases){
        if(a.test(n)){
          const exact=companyList().find(c=>normalize(c.name)===normalize(a.target)||normalize(c.name).includes(normalize(a.target)));
          if(exact)return exact;
        }
      }
      let best=null,bestScore=Infinity;
      const stop=new Set(['de','du','des','et','la','le','les','a','je','veux','voir','entreprise','societe','apres','ensuite']);
      const words=String(segment).toLowerCase().split(/\s+/).map(normalize).filter(w=>w.length>2&&!stop.has(w));
      for(const c of companyList()){
        const nc=normalize(c.name);
        if(n.includes(nc))return c;
        const compactDistance=levenshtein(n.replace(/(?:jeveuxvoir|voir|a\d+h?\d*)/g,''),nc);
        const hits=words.filter(w=>nc.includes(w)).length;
        const score=Math.min(compactDistance,hits?Math.max(0,12-hits*4):99);
        if(score<bestScore){bestScore=score;best=c}
      }
      return bestScore<=4?best:null;
    }

    const cityCoords={narbonne:[43.1843,3.0031],toulouse:[43.6047,1.4442],carcassonne:[43.2130,2.3491],auterive:[43.3517,1.4747],muret:[43.46,1.325],plaisancedutouch:[43.5657,1.296],portetsurgaronne:[43.5239,1.406],deyme:[43.4719,1.526],fontenilles:[43.5539,1.19]};
    const geoCache=JSON.parse(localStorage.getItem('crmGeoCache')||'{}');
    function fallbackPoint(address){
      const n=normalize(address);
      for(const[c,[lat,lon]]of Object.entries(cityCoords))if(n.includes(c))return{lat,lon};
      const cp=(String(address).match(/\b(11|31|34|66)\d{3}\b/)||[])[0];
      if(cp?.startsWith('31'))return{lat:43.6047,lon:1.4442};
      if(cp?.startsWith('11'))return{lat:43.213,lon:2.3491};
      if(cp?.startsWith('34'))return{lat:43.6108,lon:3.8767};
      if(cp?.startsWith('66'))return{lat:42.6887,lon:2.8948};
      return null;
    }
    async function geocode(address){
      if(!address)return null;
      if(normalize(address).includes('2rueemilelevassor'))return{lat:TECH.lat,lon:TECH.lon};
      const key=normalize(address);if(geoCache[key])return geoCache[key];
      const fallback=fallbackPoint(address);
      try{
        const r=await Promise.race([fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(address)}`),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),3000))]);
        const d=await r.json();if(d?.[0]){const point={lat:+d[0].lat,lon:+d[0].lon};geoCache[key]=point;localStorage.setItem('crmGeoCache',JSON.stringify(geoCache));return point}
      }catch(e){}
      return fallback;
    }
    function haversine(a,b){const R=6371,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon),q=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
    async function routeBetween(a,b){
      const pa=await geocode(a),pb=await geocode(b);if(!pa||!pb)return null;
      try{
        const r=await Promise.race([fetch(`https://router.project-osrm.org/route/v1/driving/${pa.lon},${pa.lat};${pb.lon},${pb.lat}?overview=false`),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),4000))]);
        const d=await r.json(),x=d?.routes?.[0];if(x)return{minutes:Math.ceil(x.duration/60),km:Math.round(x.distance/100)/10,estimated:false};
      }catch(e){}
      const straight=haversine(pa,pb),km=Math.max(2,straight*1.28),speed=km>80?82:km>25?65:42;
      return{minutes:Math.ceil(km/speed*60),km:Math.round(km*10)/10,estimated:true};
    }

    function recFrom(company,date,start,title,notes,requested=false){
      return{id:'smart-'+Date.now()+'-'+Math.random().toString(36).slice(2),companyId:company?.id||'',company:company?.name||'',title,date,start,end:addMinutes(start,title==='Pause déjeuner'?60:45),address:company?.address||'',notes,requested,travelMinutes:null,distanceKm:null,feasible:true,feasibilityText:'',fromName:''};
    }

    function prospectCandidates(excluded,dept){
      const planned=new Set(JSON.parse(localStorage.getItem('crmPlanning')||'[]').map(e=>normalize(e.company||'')));
      const visits=window.state?.visits||[];const visited=new Set(visits.map(v=>String(v.companyId||'')));
      return companyList().filter(c=>{
        if(excluded.has(normalize(c.name))||planned.has(normalize(c.name)))return false;
        if(dept&&c.dept&&c.dept!==dept)return false;
        const st=normalize(c.status);
        return /nonvisite|prospect/.test(st)||!visited.has(String(c.id));
      });
    }

    async function analyseRoutes(text){
      proposals.sort((a,b)=>a.start.localeCompare(b.start));
      routeSummary={outbound:null,return:null,conflicts:0,unavailable:0,returnTarget:returnTarget(text)};
      let previous={company:TECH.name,address:TECH.address,end:'07:00'};
      for(const p of proposals){
        p.travelMinutes=null;p.distanceKm=null;p.feasible=true;p.feasibilityText='';p.suggestedStart=null;
        if(!p.address){previous={...p,address:previous.address,company:p.title};continue}
        const route=await routeBetween(previous.address,p.address);p.fromName=previous.company;
        if(!route){p.feasibilityText=`Trajet depuis ${previous.company} non calculable.`;routeSummary.unavailable++;previous=p;continue}
        p.travelMinutes=route.minutes;p.distanceKm=route.km;p.routeEstimated=route.estimated;
        if(!routeSummary.outbound)routeSummary.outbound={...route,to:p.company};
        const earliest=mins(previous.end)+route.minutes+10,scheduled=mins(p.start);
        if(earliest>scheduled){p.feasible=false;p.suggestedStart=time(earliest);p.feasibilityText=`Impossible à ${p.start} : arrivée réaliste vers ${p.suggestedStart}.`;routeSummary.conflicts++}
        else p.feasibilityText=`Possible : ${route.minutes} min de route + 10 min de marge, soit ${scheduled-earliest} min d’avance.`;
        previous=p;
      }
      const last=[...proposals].reverse().find(p=>p.address);
      if(last){
        const back=await routeBetween(last.address,TECH.address);
        if(back){
          const arrival=addMinutes(last.end,back.minutes+10);
          routeSummary.return={...back,from:last.company,depart:last.end,arrival};
          if(routeSummary.returnTarget&&mins(arrival)>mins(routeSummary.returnTarget)+15){routeSummary.conflicts++;routeSummary.return.conflict=true}
        }else routeSummary.unavailable++;
      }
      return routeSummary;
    }

    async function addCompatibleProspects(date,text,excluded){
      const target=returnTarget(text);const latestReturn=target?mins(target)+15:17*60+30;
      let current=[...proposals].sort((a,b)=>a.start.localeCompare(b.start)).at(-1);
      if(!current?.address)return;
      const dept=companyList().find(c=>String(c.id)===String(current.companyId))?.dept||'';
      let candidates=prospectCandidates(excluded,dept);
      for(let count=0;count<6&&candidates.length;count++){
        let best=null;
        for(const c of candidates.slice(0,30)){
          const out=await routeBetween(current.address,c.address);if(!out)continue;
          const start=Math.max(mins(current.end)+out.minutes+10,13*60+30);
          const end=start+45;
          const back=await routeBetween(c.address,TECH.address);if(!back)continue;
          const arrival=end+back.minutes+10;
          if(arrival<=latestReturn){
            const score=out.minutes+(arrival>latestReturn-30?20:0);
            if(!best||score<best.score)best={c,out,start,end,arrival,score};
          }
        }
        if(!best)break;
        const p=recFrom(best.c,date,time(best.start),'Prospection','Suggestion compatible avec le retour demandé');
        proposals.push(p);excluded.add(normalize(best.c.name));current=p;
        candidates=candidates.filter(c=>normalize(c.name)!==normalize(best.c.name));
      }
    }

    async function shiftAndRecalculate(index){
      if(recalculating)return;recalculating=true;create.disabled=true;
      const target=proposals[index];if(!target?.suggestedStart){recalculating=false;return}
      target.start=target.suggestedStart;target.end=addMinutes(target.start,durationOf(target));
      proposals.sort((a,b)=>a.start.localeCompare(b.start));
      const pos=proposals.indexOf(target);
      for(let i=pos+1;i<proposals.length;i++){
        const prev=proposals[i-1],cur=proposals[i];
        const route=prev.address&&cur.address?await routeBetween(prev.address,cur.address):null;
        const earliest=mins(prev.end)+(route?.minutes||0)+10;
        if(mins(cur.start)<earliest){cur.start=time(earliest);cur.end=addMinutes(cur.start,durationOf(cur))}
      }
      const report=await analyseRoutes(prompt.value.trim());renderPreview();
      status.textContent=`Décalage appliqué. ${report.conflicts?report.conflicts+' conflit(s) restent à corriger.':'Toute la journée est réalisable.'}`;
      create.disabled=!proposals.length||report.conflicts>0;recalculating=false;
    }

    function renderPreview(){
      let html='';
      if(proposals.length){
        const first=proposals.find(p=>p.address);
        html+=`<article class="item route-step"><h3>🚐 Départ de TECHNIMAT</h3><p><strong>${TECH.address}</strong></p>${routeSummary.outbound?`<div class="route-line">Départ conseillé : ${addMinutes(first.start,-routeSummary.outbound.minutes-10)} · ${routeSummary.outbound.minutes} min · ${routeSummary.outbound.km} km jusqu’à ${routeSummary.outbound.to}</div>`:'<div class="smart-note warn">Calcul du premier trajet indisponible.</div>'}</article>`;
      }
      html+=proposals.map((x,i)=>`<article class="item"><h3>${x.start}–${x.end} · ${x.title}${x.requested?' · demandé':''}</h3><p><strong>${x.company||'Pause'}</strong>${x.address?'<br>'+x.address:''}</p>${x.travelMinutes!=null?`<div class="route-line">🚗 Depuis ${x.fromName} : ${x.travelMinutes} min · ${x.distanceKm} km${x.routeEstimated?' (estimation)':''}</div>`:''}<div class="smart-note ${x.feasible===false?'bad':x.travelMinutes==null&&x.address?'warn':'ok'}">${x.feasibilityText||'Créneau préparé.'}</div>${x.feasible===false?`<button type="button" class="apply-time" data-i="${i}">Décaler à ${x.suggestedStart}</button>`:''}${x.company?`<br><a class="hours-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((x.company||'')+' '+(x.address||''))}">Vérifier les horaires sur Google Maps</a>`:''}</article>`).join('');
      if(routeSummary.return){
        const target=routeSummary.returnTarget;
        html+=`<article class="item route-step"><h3>🏁 Retour à TECHNIMAT</h3><p><strong>Départ de ${routeSummary.return.from} à ${routeSummary.return.depart}</strong><br>${TECH.address}</p><div class="route-line">🚗 ${routeSummary.return.minutes} min · ${routeSummary.return.km} km · arrivée estimée ${routeSummary.return.arrival}</div><div class="smart-note ${routeSummary.return.conflict?'bad':'ok'}">${routeSummary.return.conflict?`Retour trop tard : objectif autour de ${target} avec une tolérance jusqu’à ${addMinutes(target,15)}.`:`Retour prévu à ${routeSummary.return.arrival}${target?' pour un objectif autour de '+target+' (tolérance ±15 min)':''}.`}</div></article>`;
      }
      preview.innerHTML=html||'<p class="empty">Aucun rendez-vous reconnu.</p>';
      preview.querySelectorAll('.apply-time').forEach(b=>b.addEventListener('click',()=>shiftAndRecalculate(+b.dataset.i)));
    }

    async function parse(){
      const text=prompt.value.trim();if(!text){status.textContent='Décrivez d’abord votre journée.';return}
      create.disabled=true;proposals=[];const date=resolveDate(text),excluded=new Set();let cursor='08:00';
      const parts=text.split(/(?:,|;|\bpuis\b|\bensuite\b|\bet\s+apres\b|\bet\s+après\b)/i).map(x=>x.trim()).filter(Boolean);
      for(const part of parts){
        const n=normalize(part);const explicit=timeFrom(part);if(explicit)cursor=explicit;
        const asksFill=/(prospect|complete|continue|remplis|remplir)/.test(n)&&!findCompany(part);
        if(asksFill)continue;
        const pause=/pause|dejeuner|déjeuner|repas/i.test(part);
        const company=pause?null:findCompany(part);
        if(pause)proposals.push(recFrom(null,date,cursor,'Pause déjeuner',part,true));
        else if(company){
          excluded.add(normalize(company.name));
          const title=/livraison/i.test(part)?'Livraison':(/relance|appeler|appel/i.test(part)?'Relance téléphonique':'Visite commerciale');
          proposals.push(recFrom(company,date,cursor,title,part,true));
        }
        cursor=addMinutes(proposals.at(-1)?.end||cursor,15);
      }
      const wantsProspects=/prospect|continue|complete|complète|remplis|remplir/.test(normalize(text));
      proposals.sort((a,b)=>a.start.localeCompare(b.start));
      if(wantsProspects)await addCompatibleProspects(date,text,excluded);
      proposals.sort((a,b)=>a.start.localeCompare(b.start));
      const report=await analyseRoutes(text);renderPreview();
      status.textContent=`${proposals.length} élément(s) préparé(s). ${report.conflicts?report.conflicts+' conflit(s) détecté(s).':'Planning compatible avec votre retour.'} Les rendez-vous demandés restent prioritaires.`;
      create.disabled=!proposals.length||report.conflicts>0;
    }

    document.querySelector('#analyseDay').addEventListener('click',parse);
    create.addEventListener('click',()=>{
      const current=JSON.parse(localStorage.getItem('crmPlanning')||'[]');
      const keys=new Set(current.map(e=>`${e.date}|${e.start}|${normalize(e.company||e.title)}`));let added=0;
      for(const p of proposals){const k=`${p.date}|${p.start}|${normalize(p.company||p.title)}`;if(!keys.has(k)){current.push(p);keys.add(k);added++}}
      localStorage.setItem('crmPlanning',JSON.stringify(current));status.textContent=`${added} rendez-vous ajouté(s).`;setTimeout(()=>location.reload(),700);
    });

    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const mic=document.querySelector('#voiceMic'),finish=document.querySelector('#finishDictation');
    if(!SpeechRecognition){mic.disabled=true;status.textContent='La saisie écrite fonctionne. Pour la dictée, utilisez Chrome ou Safari récent.'}
    else{
      const rec=new SpeechRecognition();rec.lang='fr-FR';rec.continuous=true;rec.interimResults=true;
      let shouldListen=false,committed='',starting=false;
      const startRecognition=()=>{if(!shouldListen||starting)return;starting=true;try{rec.start()}catch(e){starting=false}};
      mic.addEventListener('click',()=>{if(shouldListen)return;committed=prompt.value.trim();shouldListen=true;finish.classList.add('visible');status.textContent='Je vous écoute…';startRecognition()});
      finish.addEventListener('click',()=>{shouldListen=false;finish.classList.remove('visible');try{rec.stop()}catch(e){}status.textContent='Dictée terminée. Appuyez sur « Préparer intelligemment ».'});
      rec.onstart=()=>{starting=false;mic.classList.add('listening')};
      rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript.trim();if(e.results[i].isFinal)committed=[committed,t].filter(Boolean).join(' ').trim();else interim=[interim,t].filter(Boolean).join(' ')}prompt.value=[committed,interim].filter(Boolean).join(' ').trim()};
      rec.onend=()=>{starting=false;mic.classList.remove('listening');if(shouldListen)setTimeout(startRecognition,250)};
      rec.onerror=e=>{starting=false;mic.classList.remove('listening');if(e.error==='no-speech'&&shouldListen){setTimeout(startRecognition,300);return}shouldListen=false;finish.classList.remove('visible');status.textContent='Microphone indisponible : '+e.error};
    }
  };
  wait();
})();