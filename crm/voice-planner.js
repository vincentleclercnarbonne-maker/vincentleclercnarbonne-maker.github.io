(()=>{
  const wait=()=>{
    const planning=document.querySelector('#planning');
    const addBtn=document.querySelector('#addPlanningEvent');
    if(!planning||!addBtn)return setTimeout(wait,200);

    const style=document.createElement('style');
    style.textContent=`.voice-planner{margin:14px 0;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.voice-planner h2{margin:0 0 5px}.voice-planner p{margin:0 0 12px;color:#666}.voice-row{display:flex;gap:8px;align-items:stretch}.voice-row textarea{flex:1;min-height:110px}.mic-btn{min-width:58px;font-size:24px}.mic-btn.listening{background:#b3131b;animation:pulse 1s infinite}.voice-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.voice-preview{margin-top:12px}.voice-preview .item{margin:7px 0;padding:10px;border:1px solid #eee;border-radius:12px}.voice-status{font-size:13px;margin-top:8px;color:#555}.finish-dictation{display:none;background:#111;color:#fff}.finish-dictation.visible{display:inline-block}.smart-note{font-size:12px;color:#7a5b00;background:#fff8d8;padding:8px;border-radius:9px;margin-top:7px}.hours-link{display:inline-block;margin-top:5px;font-size:12px}@keyframes pulse{50%{opacity:.65}}@media(max-width:600px){.voice-row{flex-direction:column}.mic-btn{width:100%}}`;
    document.head.appendChild(style);

    const box=document.createElement('div');
    box.className='voice-planner';
    box.innerHTML=`<h2>Assistant intelligent de journée</h2><p>Parlez naturellement : « demain EPE à 9 h, puis complète ma journée avec des prospects du secteur et mes relances prioritaires ».</p><div class="voice-row"><textarea id="dayPrompt" placeholder="Décrivez votre journée, demandez des prospects, des relances ou de remplir les créneaux libres…"></textarea><button type="button" id="voiceMic" class="mic-btn" aria-label="Dicter ma journée">🎙️</button></div><div class="voice-actions"><button type="button" id="finishDictation" class="finish-dictation">Dictée terminée</button><button type="button" id="analyseDay">Préparer intelligemment</button><button type="button" id="createDay" class="ghost dark" disabled>Ajouter au planning</button></div><div id="voiceStatus" class="voice-status"></div><div id="voicePreview" class="voice-preview"></div>`;
    addBtn.before(box);

    const prompt=document.querySelector('#dayPrompt'),status=document.querySelector('#voiceStatus'),preview=document.querySelector('#voicePreview'),create=document.querySelector('#createDay');
    let proposals=[];
    const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const aliases={
      epe:'entreprise peinture et enduits',
      entreprisepeintureenduit:'entreprise peinture et enduits',
      mcprojet:'m c projec',mcprojec:'m c projec',
      bsa:'bsa occitanie',
      etr:'entreprise de travaux et de ravalement',
      ite:'i.t.e sud-ouest',
      mpf:'midi pyrenees facades'
    };
    const companyList=()=>{
      const all=[];
      (window.state?.prospects||[]).forEach(p=>all.push({id:p.id,name:p.name,address:p.address||'',dept:String(p.dept||''),status:p.status||p.type||'',phone:p.phone||'',email:p.email||''}));
      (window.RP||[]).forEach(p=>all.push({id:p.i||p.s,name:p.c,address:p.a||'',dept:String(p.d||''),status:p.t||'',phone:p.p||'',email:p.e||''}));
      const seen=new Map();
      all.forEach(p=>{const k=normalize(p.id||p.name);if(!seen.has(k))seen.set(k,p);else seen.set(k,{...seen.get(k),...Object.fromEntries(Object.entries(p).filter(([,v])=>v))})});
      return [...seen.values()].filter(p=>p.name);
    };
    const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
    function resolveDate(text){const now=new Date(),n=normalize(text);if(n.includes('demain')){now.setDate(now.getDate()+1);return iso(now)}if(n.includes('apresdemain')){now.setDate(now.getDate()+2);return iso(now)}const names=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];const found=names.findIndex(x=>n.includes(x));if(found>=0){let add=(found-now.getDay()+7)%7;if(add===0)add=7;now.setDate(now.getDate()+add);return iso(now)}const m=text.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);if(m){let y=m[3]?Number(m[3]):now.getFullYear();if(y<100)y+=2000;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}return iso(now)}
    function timeFrom(s){const m=s.match(/\b(?:a|à|vers)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)\b/i);if(!m)return null;return `${String(Math.min(23,+m[1])).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`}
    function addMinutes(t,n){let[h,m]=t.split(':').map(Number);m+=n;h=(h+Math.floor(m/60))%24;m%=60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
    function mins(t){const[h,m]=t.split(':').map(Number);return h*60+m}
    function findCompany(segment){
      let ns=normalize(segment);for(const[a,b]of Object.entries(aliases))if(ns.includes(a))ns+=' '+normalize(b);
      let best=null,score=0;
      for(const c of companyList()){
        const nc=normalize(c.name);if(!nc)continue;
        let sc=ns.includes(nc)?100+nc.length:0;
        for(const[a,b]of Object.entries(aliases))if(ns.includes(a)&&nc.includes(normalize(b)))sc=Math.max(sc,150);
        const words=c.name.toLowerCase().split(/\s+/).map(normalize).filter(w=>w.length>1);const hits=words.filter(w=>ns.includes(w)).length;sc=Math.max(sc,hits*12);
        if(sc>score){score=sc;best=c}
      }
      return score>=12?best:null;
    }
    const plannedFor=date=>JSON.parse(localStorage.getItem('crmPlanning')||'[]').filter(e=>e.date===date);
    function pickSuggestions(date,kind,dept,exclude){
      const existingNames=new Set([...plannedFor(date),...proposals].map(e=>normalize(e.company||'')));
      const visits=window.state?.visits||[];const visitedIds=new Set(visits.map(v=>String(v.companyId||'')));
      return companyList().filter(c=>{
        if(existingNames.has(normalize(c.name))||exclude.has(normalize(c.name)))return false;
        if(dept&&c.dept&&c.dept!==dept)return false;
        const st=normalize(c.status);
        if(kind==='relance')return /relancer|suivre|devis|attente/.test(st);
        return /nonvisite|prospect/.test(st)||(!visitedIds.has(String(c.id))&&!/relancer/.test(st));
      }).sort((a,b)=>{
        const ar=/relancer|suivre/.test(normalize(a.status))?0:1,br=/relancer|suivre/.test(normalize(b.status))?0:1;
        return ar-br||a.name.localeCompare(b.name,'fr');
      });
    }
    function freeSlots(date){
      const busy=[...plannedFor(date),...proposals].map(e=>[mins(e.start),mins(e.end)]).sort((a,b)=>a[0]-b[0]);
      const windows=[[8*60,12*60],[13*60+30,17*60+30]],slots=[];
      for(const[wStart,wEnd]of windows){let cur=wStart;for(const[s,e]of busy){if(e<=wStart||s>=wEnd)continue;if(s-cur>=60)slots.push(cur);cur=Math.max(cur,e+15)}while(wEnd-cur>=45){slots.push(cur);cur+=60}}
      return slots.map(m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
    }
    function recFrom(company,date,start,title,notes){return{id:'smart-'+Date.now()+'-'+Math.random().toString(36).slice(2),companyId:company?.id||'',company:company?.name||'',title,date,start,end:addMinutes(start,title==='Pause déjeuner'?60:45),address:company?.address||'',notes,hoursStatus:'À vérifier avant départ'}}
    function parse(){
      const text=prompt.value.trim();if(!text){status.textContent='Décrivez d’abord votre journée.';return}
      const date=resolveDate(text);let cursor='08:00';proposals=[];const excluded=new Set();
      const parts=text.split(/(?:,|;|\bpuis\b|\bensuite\b|\baprès\b|\bet après\b)/i).map(x=>x.trim()).filter(Boolean);
      for(const part of parts){
        const explicit=timeFrom(part);if(explicit)cursor=explicit;
        const pause=/pause|dejeuner|déjeuner|repas/i.test(part);
        const askProspects=/ajoute|propose|complete|complète|remplis|remplir/.test(normalize(part))&&/prospect|journee|journée|creneau|créneau/.test(normalize(part));
        const askRelances=/ajoute|propose|complete|complète|remplis|remplir/.test(normalize(part))&&/relance/.test(normalize(part));
        if(askProspects||askRelances)continue;
        const company=pause?null:findCompany(part);
        if(company)excluded.add(normalize(company.name));
        if(pause)proposals.push(recFrom(null,date,cursor,'Pause déjeuner',part));
        else if(company){const title=/livraison/i.test(part)?'Livraison':(/relance|appeler|appel/i.test(part)?'Relance téléphonique':'Visite commerciale');proposals.push(recFrom(company,date,cursor,title,part))}
        cursor=addMinutes(proposals.at(-1)?.end||cursor,15);
      }
      const n=normalize(text);const wantsProspects=/prospect|complete.*journee|journee.*pas.*pleine|remplis.*journee/.test(n);const wantsRelances=/relance/.test(n)&&/ajoute|propose|complete|remplis|prioritaire/.test(n);
      if(wantsProspects||wantsRelances){
        const dept=(proposals.find(p=>p.companyId)&&companyList().find(c=>String(c.id)===String(proposals.find(p=>p.companyId).companyId))?.dept)||'';
        let slots=freeSlots(date);const kinds=wantsRelances&&wantsProspects?['relance','prospect']:wantsRelances?['relance']:['prospect'];let ki=0;
        while(slots.length&&ki<kinds.length+8){const kind=kinds[ki%kinds.length];const candidates=pickSuggestions(date,kind,dept,excluded);if(!candidates.length){ki++;if(ki>kinds.length*2)break;continue}const c=candidates[0];excluded.add(normalize(c.name));proposals.push(recFrom(c,date,slots.shift(),kind==='relance'?'Relance commerciale':'Prospection',`Suggestion intelligente : ${kind}${dept?' dans le département '+dept:''}`));ki++}
      }
      proposals.sort((a,b)=>a.start.localeCompare(b.start));
      preview.innerHTML=proposals.length?proposals.map(x=>`<article class="item"><h3>${x.start}–${x.end} · ${x.title}</h3><p><strong>${x.company||'Pause'}</strong>${x.address?'<br>'+x.address:''}</p>${x.company?`<div class="smart-note">Horaires en direct non encore connectés : vérifiez avant le départ.</div><a class="hours-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((x.company||'')+' '+(x.address||''))}">Vérifier les horaires sur Google Maps</a>`:''}</article>`).join(''):'<p class="empty">Aucun rendez-vous reconnu. Essayez : « demain EPE à 9 h puis complète ma journée avec des prospects et des relances ».</p>';
      status.textContent=`${proposals.length} élément(s) préparé(s) pour le ${new Date(date+'T12:00').toLocaleDateString('fr-FR')}. Les surnoms d’entreprises et les créneaux libres ont été analysés.`;create.disabled=!proposals.length;
    }
    document.querySelector('#analyseDay').addEventListener('click',parse);
    create.addEventListener('click',()=>{const current=JSON.parse(localStorage.getItem('crmPlanning')||'[]');const keys=new Set(current.map(e=>`${e.date}|${e.start}|${normalize(e.company||e.title)}`));let added=0;for(const p of proposals){const k=`${p.date}|${p.start}|${normalize(p.company||p.title)}`;if(!keys.has(k)){current.push(p);keys.add(k);added++}}localStorage.setItem('crmPlanning',JSON.stringify(current));status.textContent=`${added} rendez-vous ajouté(s). Rechargement du planning…`;setTimeout(()=>location.reload(),700)});

    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;const mic=document.querySelector('#voiceMic'),finish=document.querySelector('#finishDictation');
    if(!SpeechRecognition){mic.disabled=true;status.textContent='La saisie écrite fonctionne. Pour la dictée, utilisez Chrome ou Safari récent.'}
    else{const rec=new SpeechRecognition();rec.lang='fr-FR';rec.continuous=true;rec.interimResults=true;let shouldListen=false,committed='',starting=false;const startRecognition=()=>{if(!shouldListen||starting)return;starting=true;try{rec.start()}catch(e){starting=false}};mic.addEventListener('click',()=>{if(shouldListen)return;committed=prompt.value.trim();shouldListen=true;finish.classList.add('visible');status.textContent='Je vous écoute… Faites vos pauses normalement.';startRecognition()});finish.addEventListener('click',()=>{shouldListen=false;finish.classList.remove('visible');try{rec.stop()}catch(e){}status.textContent='Dictée terminée. Appuyez sur « Préparer intelligemment ».'});rec.onstart=()=>{starting=false;mic.classList.add('listening')};rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0].transcript.trim();if(e.results[i].isFinal)committed=[committed,text].filter(Boolean).join(' ').trim();else interim=[interim,text].filter(Boolean).join(' ')}prompt.value=[committed,interim].filter(Boolean).join(' ').trim()};rec.onend=()=>{starting=false;mic.classList.remove('listening');if(shouldListen)setTimeout(startRecognition,250)};rec.onerror=e=>{starting=false;mic.classList.remove('listening');if(e.error==='no-speech'&&shouldListen){setTimeout(startRecognition,300);return}shouldListen=false;finish.classList.remove('visible');status.textContent='Microphone indisponible : '+e.error}}
  };wait();
})();