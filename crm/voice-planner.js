(()=>{
  const wait=()=>{
    const planning=document.querySelector('#planning');
    const addBtn=document.querySelector('#addPlanningEvent');
    if(!planning||!addBtn)return setTimeout(wait,200);

    const style=document.createElement('style');
    style.textContent=`.voice-planner{margin:14px 0;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.voice-planner h2{margin:0 0 5px}.voice-planner p{margin:0 0 12px;color:#666}.voice-row{display:flex;gap:8px;align-items:stretch}.voice-row textarea{flex:1;min-height:92px}.mic-btn{min-width:58px;font-size:24px}.mic-btn.listening{background:#b3131b;animation:pulse 1s infinite}.voice-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.voice-preview{margin-top:12px}.voice-preview .item{margin:7px 0}.voice-status{font-size:13px;margin-top:8px;color:#555}.finish-dictation{display:none;background:#111;color:#fff}.finish-dictation.visible{display:inline-block}@keyframes pulse{50%{opacity:.65}}@media(max-width:600px){.voice-row{flex-direction:column}.mic-btn{width:100%}}`;
    document.head.appendChild(style);

    const box=document.createElement('div');
    box.className='voice-planner';
    box.innerHTML=`<h2>Assistant vocal de journée</h2><p>Dites ou écrivez votre programme. Vous pouvez faire des pauses : la dictée continue jusqu’à ce que vous appuyiez sur « Dictée terminée ».</p><div class="voice-row"><textarea id="dayPrompt" placeholder="Décrivez toute votre journée ici…"></textarea><button type="button" id="voiceMic" class="mic-btn" aria-label="Dicter ma journée">🎙️</button></div><div class="voice-actions"><button type="button" id="finishDictation" class="finish-dictation">Dictée terminée</button><button type="button" id="analyseDay">Préparer ma journée</button><button type="button" id="createDay" class="ghost dark" disabled>Ajouter au planning</button></div><div id="voiceStatus" class="voice-status"></div><div id="voicePreview" class="voice-preview"></div>`;
    addBtn.before(box);

    const prompt=document.querySelector('#dayPrompt'),status=document.querySelector('#voiceStatus'),preview=document.querySelector('#voicePreview'),create=document.querySelector('#createDay');
    let proposals=[];
    const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const companyList=()=>{const all=[];(window.state?.prospects||[]).forEach(p=>all.push({id:p.id,name:p.name,address:p.address||''}));(window.RP||[]).forEach(p=>all.push({id:p.i||p.s,name:p.c,address:p.a||''}));const seen=new Set();return all.filter(p=>p.name&&!seen.has(normalize(p.name))&&seen.add(normalize(p.name)))};
    const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
    function resolveDate(text){const now=new Date(),n=normalize(text);if(n.includes('demain')){now.setDate(now.getDate()+1);return iso(now)}if(n.includes('apresdemain')){now.setDate(now.getDate()+2);return iso(now)}const names=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];const found=names.findIndex(x=>n.includes(x));if(found>=0){let add=(found-now.getDay()+7)%7;if(add===0)add=7;now.setDate(now.getDate()+add);return iso(now)}const m=text.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);if(m){let y=m[3]?Number(m[3]):now.getFullYear();if(y<100)y+=2000;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}return iso(now)}
    function timeFrom(s){const m=s.match(/\b(?:a|à|vers)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)\b/i);if(!m)return null;return `${String(Math.min(23,+m[1])).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`}
    function addMinutes(t,n){let[h,m]=t.split(':').map(Number);m+=n;h=(h+Math.floor(m/60))%24;m%=60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
    function findCompany(segment){const ns=normalize(segment);let best=null,score=0;for(const c of companyList()){const nc=normalize(c.name);if(!nc)continue;let sc=ns.includes(nc)?nc.length:0;const words=c.name.toLowerCase().split(/\s+/).filter(w=>w.length>1);const hits=words.filter(w=>ns.includes(normalize(w))).length;sc=Math.max(sc,hits*4);if(sc>score){score=sc;best=c}}return score>=4?best:null}
    function parse(){const text=prompt.value.trim();if(!text){status.textContent='Décrivez d’abord votre journée.';return}const date=resolveDate(text);let cursor='08:00';const parts=text.split(/(?:,|;|\bpuis\b|\bensuite\b|\baprès\b|\bet après\b)/i).map(x=>x.trim()).filter(Boolean);proposals=parts.map((part,i)=>{const explicit=timeFrom(part);if(explicit)cursor=explicit;const pause=/pause|dejeuner|déjeuner|repas/i.test(part);const company=pause?null:findCompany(part);const duration=pause?60:(/livraison/i.test(part)?30:45);const title=pause?'Pause déjeuner':(/livraison/i.test(part)?'Livraison':(/relance|appeler|appel/i.test(part)?'Relance téléphonique':'Visite commerciale'));const rec={id:'voice-'+Date.now()+'-'+i,companyId:company?.id||'',company:company?.name||'',title,date,start:cursor,end:addMinutes(cursor,duration),address:company?.address||'',notes:part};cursor=addMinutes(rec.end,15);return rec}).filter(x=>x.company||x.title==='Pause déjeuner');preview.innerHTML=proposals.length?proposals.map(x=>`<article class="item"><h3>${x.start}–${x.end} · ${x.title}</h3><p>${x.company||'Pause'}${x.address?'<br>'+x.address:''}</p></article>`).join(''):'<p class="empty">Aucun rendez-vous reconnu. Indiquez au moins une heure ou un nom d’entreprise.</p>';status.textContent=`${proposals.length} élément(s) préparé(s) pour le ${new Date(date+'T12:00').toLocaleDateString('fr-FR')}. Vérifiez avant d’ajouter.`;create.disabled=!proposals.length}
    document.querySelector('#analyseDay').addEventListener('click',parse);
    create.addEventListener('click',()=>{const current=JSON.parse(localStorage.getItem('crmPlanning')||'[]');const keys=new Set(current.map(e=>`${e.date}|${e.start}|${normalize(e.company||e.title)}`));let added=0;for(const p of proposals){const k=`${p.date}|${p.start}|${normalize(p.company||p.title)}`;if(!keys.has(k)){current.push(p);keys.add(k);added++}}localStorage.setItem('crmPlanning',JSON.stringify(current));status.textContent=`${added} rendez-vous ajouté(s). Rechargement du planning…`;setTimeout(()=>location.reload(),700)});

    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const mic=document.querySelector('#voiceMic');
    const finish=document.querySelector('#finishDictation');
    if(!SpeechRecognition){mic.disabled=true;mic.title='La dictée vocale n’est pas disponible dans ce navigateur';status.textContent='La saisie écrite fonctionne. Pour la dictée, utilisez Chrome ou Safari récent et autorisez le microphone.'}
    else{
      const rec=new SpeechRecognition();rec.lang='fr-FR';rec.continuous=true;rec.interimResults=true;
      let shouldListen=false;
      let committed='';
      let starting=false;
      const startRecognition=()=>{if(!shouldListen||starting)return;starting=true;try{rec.start()}catch(e){starting=false}};
      mic.addEventListener('click',()=>{if(shouldListen)return;committed=prompt.value.trim();shouldListen=true;finish.classList.add('visible');status.textContent='Je vous écoute… Faites vos pauses normalement.';startRecognition()});
      finish.addEventListener('click',()=>{shouldListen=false;finish.classList.remove('visible');try{rec.stop()}catch(e){}status.textContent='Dictée terminée. Appuyez sur « Préparer ma journée ».'});
      rec.onstart=()=>{starting=false;mic.classList.add('listening');mic.textContent='🎙️';status.textContent='Je vous écoute… Faites vos pauses normalement.'};
      rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0].transcript.trim();if(e.results[i].isFinal){committed=[committed,text].filter(Boolean).join(' ').trim()}else interim=[interim,text].filter(Boolean).join(' ')}prompt.value=[committed,interim].filter(Boolean).join(' ').trim()};
      rec.onend=()=>{starting=false;mic.classList.remove('listening');if(shouldListen){status.textContent='Pause détectée, la dictée reprend…';setTimeout(startRecognition,250)}else{mic.textContent='🎙️'}};
      rec.onerror=e=>{starting=false;mic.classList.remove('listening');if(e.error==='no-speech'&&shouldListen){setTimeout(startRecognition,300);return}shouldListen=false;finish.classList.remove('visible');mic.textContent='🎙️';status.textContent='Microphone indisponible : '+e.error};
    }
  };wait();
})();