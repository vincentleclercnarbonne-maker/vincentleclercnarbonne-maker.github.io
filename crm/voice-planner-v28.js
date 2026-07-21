(()=>{
  const wait=()=>{
    const planning=document.querySelector('#planning');
    const addBtn=document.querySelector('#addPlanningEvent');
    if(!planning||!addBtn)return setTimeout(wait,200);

    const css=document.createElement('style');
    css.textContent=`button,a,[role="button"],select,.clickable{cursor:pointer!important}button:disabled{cursor:not-allowed!important}.voice-planner{margin:14px 0;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.voice-row{display:flex;gap:8px}.voice-row textarea{flex:1;min-height:110px}.voice-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.voice-preview .item{margin:8px 0;padding:11px;border:1px solid #e5e7eb;border-radius:12px}.route-step{background:#f7f7f7;border-style:dashed!important}.route-line{font-size:12px;margin-top:6px}.note{font-size:12px;padding:8px;border-radius:8px;margin-top:7px}.ok{background:#eaf7ee;color:#155724}.warn{background:#fff1db;color:#7a3d00}.bad{background:#ffe7e7;color:#8a1010}.finish{display:none}.finish.show{display:inline-block}@media(max-width:600px){.voice-row{flex-direction:column}}`;
    document.head.appendChild(css);

    const box=document.createElement('section');
    box.className='voice-planner';
    box.innerHTML=`<h2>Assistant intelligent de journée</h2><p>Les rendez-vous demandés sont prioritaires. Les prospects ne sont ajoutés que s’ils respectent votre heure de retour.</p><div class="voice-row"><textarea id="dayPrompt" placeholder="Exemple : BSA à 9 h, puis MC Projec à 9 h 25, ajoute des prospects et retour Technimat vers 16 h"></textarea><button type="button" id="voiceMic">🎙️</button></div><div class="voice-actions"><button type="button" id="finishDictation" class="finish">Dictée terminée</button><button type="button" id="analyseDay">Préparer intelligemment</button><button type="button" id="createDay" disabled>Ajouter au planning</button></div><div id="voiceStatus"></div><div id="voicePreview" class="voice-preview"></div>`;
    addBtn.before(box);

    const prompt=box.querySelector('#dayPrompt'),status=box.querySelector('#voiceStatus'),preview=box.querySelector('#voicePreview'),analyse=box.querySelector('#analyseDay'),create=box.querySelector('#createDay');
    const TECH={name:'TECHNIMAT',address:'2 rue Émile Levassor, 11100 Narbonne',lat:43.1843,lon:3.0031};
    let proposals=[],summary={};
    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const mins=t=>{const[h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
    const fmt=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const plus=(t,n)=>fmt(mins(t)+n);
    const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};

    function companies(){
      const all=[];
      (window.state?.prospects||[]).forEach(p=>all.push({id:p.id,name:p.name,address:p.address||'',dept:String(p.dept||''),status:p.status||p.type||''}));
      (window.RP||[]).forEach(p=>all.push({id:p.i||p.s,name:p.c,address:p.a||'',dept:String(p.d||''),status:p.t||''}));
      all.push({id:'mc-projec-fixed',name:'M C PROJEC',address:'34 impasse Saint-Jacques, 31120 Portet-sur-Garonne',dept:'31',status:'Prospect'});
      const seen=new Map();all.forEach(c=>{if(!c.name)return;const k=norm(c.name);const old=seen.get(k);if(!old||(!old.address&&c.address))seen.set(k,{...old,...c})});
      return [...seen.values()];
    }

    function aliasCompany(segment){
      const n=norm(segment), list=companies();
      const target=n.includes('bsa')?'bsaoccitanie':(/mcproje[ctu]|mcproject|mcprojet|mcprojec/.test(n)?'mcprojec':n.includes('epe')?'entreprisepeintureetenduits':n.includes('etr')?'entreprisedetravauxetderavalement':'');
      if(target){const found=list.find(c=>norm(c.name).includes(target)||target.includes(norm(c.name)));if(found)return found}
      const exact=list.filter(c=>norm(c.name).length>=5&&n.includes(norm(c.name))).sort((a,b)=>norm(b.name).length-norm(a.name).length)[0];
      return exact||null;
    }

    function dateFrom(text){const d=new Date(),n=norm(text);if(n.includes('demain'))d.setDate(d.getDate()+1);else{const days=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];const i=days.findIndex(x=>n.includes(x));if(i>=0){let add=(i-d.getDay()+7)%7;if(!add)add=7;d.setDate(d.getDate()+add)}}return iso(d)}
    function timeFrom(s){const m=s.match(/(?:à|a|vers)?\s*(\d{1,2})(?:\s*(?:h|:|heure(?:s)?)\s*(\d{1,2})?)?/i);return m?`${String(+m[1]).padStart(2,'0')}:${String(m[2]||0).padStart(2,'0')}`:null}
    function returnTarget(text){const n=text.match(/(?:retour|rentrer|etre|être|arriver)[^,;.]{0,50}?(?:technimat|narbonne|magasin)[^,;.]{0,25}?(?:vers|à|a|avant)\s*(\d{1,2})(?:\s*(?:h|:)?\s*(\d{1,2})?)?/i)||text.match(/(?:vers|à|a|avant)\s*(\d{1,2})(?:\s*(?:h|:)?\s*(\d{1,2})?)?[^,;.]{0,25}?(?:technimat|narbonne|magasin)/i);return n?`${String(+n[1]).padStart(2,'0')}:${String(n[2]||0).padStart(2,'0')}`:null}

    const coords={narbonne:[43.1843,3.0031],toulouse:[43.6047,1.4442],portetsurgaronne:[43.5239,1.406],plaisancedutouch:[43.5657,1.296],muret:[43.46,1.325],auterive:[43.3517,1.4747],carcassonne:[43.213,2.3491],deyme:[43.4719,1.526]};
    function point(address){const n=norm(address);if(n.includes('2rueemilelevassor'))return{lat:TECH.lat,lon:TECH.lon};for(const[k,v]of Object.entries(coords))if(n.includes(k))return{lat:v[0],lon:v[1]};const cp=(String(address).match(/\b(11|31|34|66)\d{3}\b/)||[])[0];if(cp?.startsWith('31'))return{lat:43.6047,lon:1.4442};if(cp?.startsWith('11'))return{lat:43.213,lon:2.3491};if(cp?.startsWith('34'))return{lat:43.6108,lon:3.8767};if(cp?.startsWith('66'))return{lat:42.6887,lon:2.8948};return null}
    function route(a,b){const p=point(a),q=point(b);if(!p||!q)return{minutes:30,km:25,estimated:true};const R=6371,r=x=>x*Math.PI/180,dLat=r(q.lat-p.lat),dLon=r(q.lon-p.lon),h=Math.sin(dLat/2)**2+Math.cos(r(p.lat))*Math.cos(r(q.lat))*Math.sin(dLon/2)**2;const straight=2*R*Math.asin(Math.sqrt(h)),km=Math.max(2,straight*1.25),speed=km>80?82:km>25?65:42;return{minutes:Math.ceil(km/speed*60),km:Math.round(km*10)/10,estimated:true}}

    function requestedParts(text){
      const cleaned=text.replace(/\b(?:retour|rentrer|etre|être|arriver)[^,;.]*?(?:technimat|narbonne|magasin)[^,;.]*/gi,'');
      return cleaned.split(/,|;|\bpuis\b|\bensuite\b|\bet après\b|\bet apres\b/i).map(x=>x.trim()).filter(Boolean);
    }

    function make(c,date,start,requested=true,title='Visite commerciale'){return{id:'smart-'+Date.now()+Math.random(),companyId:c.id,company:c.name,address:c.address,title,date,start,end:plus(start,45),requested,travelMinutes:0,distanceKm:0,fromName:'',feasible:true,note:''}}

    function prospectList(excluded,dept){return companies().filter(c=>c.address&&!excluded.has(norm(c.name))&&(!dept||!c.dept||c.dept===dept)&&(/prospect|nonvisite/.test(norm(c.status)))).slice(0,60)}

    function build(){
      const text=prompt.value.trim();if(!text){status.textContent='Décrivez votre journée.';return}
      analyse.disabled=true;analyse.textContent='Calcul en cours…';create.disabled=true;proposals=[];
      try{
        const date=dateFrom(text), target=returnTarget(text), excluded=new Set();let cursor='08:00';
        for(const part of requestedParts(text)){
          if(/prospect|complete|complète|continue|remplis|remplir/i.test(part)&&!aliasCompany(part))continue;
          const c=aliasCompany(part);if(!c)continue;
          const requestedTime=timeFrom(part)||cursor;
          const previous=proposals.at(-1);
          let start=requestedTime;
          if(previous){const r=route(previous.address,c.address), earliest=mins(previous.end)+r.minutes+10;if(earliest>mins(start))start=fmt(earliest)}
          const p=make(c,date,start,true);proposals.push(p);excluded.add(norm(c.name));cursor=plus(p.end,15);
        }
        if(!proposals.length)throw new Error('Aucune entreprise clairement reconnue.');

        const wantsProspects=/prospect|complete|complète|continue|remplis|remplir/i.test(text);
        if(wantsProspects){
          let current=proposals.at(-1), candidates=prospectList(excluded,companies().find(c=>String(c.id)===String(current.companyId))?.dept||'');
          const latest=target?mins(target)+15:17*60+30;
          for(let added=0;added<5;added++){
            let best=null;
            for(const c of candidates){const out=route(current.address,c.address),start=Math.max(mins(current.end)+out.minutes+10,13*60+30),end=start+45,back=route(c.address,TECH.address),arrival=end+back.minutes+10;if(arrival<=latest){const score=out.minutes+Math.abs(latest-arrival)/10;if(!best||score<best.score)best={c,start,score}}}
            if(!best)break;const p=make(best.c,date,fmt(best.start),false,'Prospection');proposals.push(p);excluded.add(norm(best.c.name));candidates=candidates.filter(c=>norm(c.name)!==norm(best.c.name));current=p;
          }
        }

        let prev={company:TECH.name,address:TECH.address,end:'07:00'};
        for(const p of proposals){const r=route(prev.address,p.address);p.travelMinutes=r.minutes;p.distanceKm=r.km;p.fromName=prev.company;const earliest=mins(prev.end)+r.minutes+10;if(earliest>mins(p.start)){p.start=fmt(earliest);p.end=plus(p.start,45)}p.note='Créneau adapté automatiquement aux temps de trajet.';prev=p}
        const back=route(prev.address,TECH.address),arrival=mins(prev.end)+back.minutes+10;
        summary={target,back,arrival,firstRoute:route(TECH.address,proposals[0].address)};
        render();status.textContent=`${proposals.length} étape(s) préparée(s). Aucun rendez-vous inventé.`;create.disabled=false;
      }catch(e){preview.innerHTML='';status.textContent='Erreur : '+e.message}
      finally{analyse.disabled=false;analyse.textContent='Préparer intelligemment'}
    }

    function render(){
      const first=proposals[0];let html=`<article class="item route-step"><h3>🚐 Départ de TECHNIMAT</h3><p>${TECH.address}</p><div class="route-line">Départ conseillé : ${fmt(mins(first.start)-summary.firstRoute.minutes-10)} · ${summary.firstRoute.minutes} min · ${summary.firstRoute.km} km</div></article>`;
      html+=proposals.map(p=>`<article class="item"><h3>${p.start}–${p.end} · ${p.title}${p.requested?' · demandé':''}</h3><p><strong>${p.company}</strong><br>${p.address}</p><div class="route-line">🚗 Depuis ${p.fromName} : ${p.travelMinutes} min · ${p.distanceKm} km</div><div class="note ok">${p.note}</div></article>`).join('');
      const arr=fmt(summary.arrival),target=summary.target,diff=target?summary.arrival-mins(target):0,ok=!target||Math.abs(diff)<=15;
      html+=`<article class="item route-step"><h3>🏁 Retour à TECHNIMAT</h3><p>Départ de ${proposals.at(-1).company} à ${proposals.at(-1).end}</p><div class="route-line">🚗 ${summary.back.minutes} min · arrivée estimée ${arr}</div><div class="note ${ok?'ok':'warn'}">${target?(ok?`Retour conforme à votre objectif autour de ${target}.`:`Retour estimé à ${arr}, soit ${Math.abs(diff)} min ${diff>0?'après':'avant'} l’objectif ${target}.`):`Retour estimé à ${arr}.`}</div></article>`;
      preview.innerHTML=html;
    }

    analyse.addEventListener('click',build);
    create.addEventListener('click',()=>{const current=JSON.parse(localStorage.getItem('crmPlanning')||'[]'),keys=new Set(current.map(e=>`${e.date}|${e.start}|${norm(e.company)}`));let added=0;for(const p of proposals){const k=`${p.date}|${p.start}|${norm(p.company)}`;if(!keys.has(k)){current.push(p);keys.add(k);added++}}localStorage.setItem('crmPlanning',JSON.stringify(current));status.textContent=`${added} rendez-vous ajouté(s).`;setTimeout(()=>location.reload(),500)});

    const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=box.querySelector('#voiceMic'),finish=box.querySelector('#finishDictation');
    if(SR){const rec=new SR();rec.lang='fr-FR';rec.continuous=true;rec.interimResults=true;let active=false,committed='';mic.addEventListener('click',()=>{if(active)return;active=true;committed=prompt.value.trim();finish.classList.add('show');rec.start()});finish.addEventListener('click',()=>{active=false;finish.classList.remove('show');try{rec.stop()}catch(e){}});rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript.trim();if(e.results[i].isFinal)committed=(committed+' '+t).trim();else interim=t}prompt.value=(committed+' '+interim).trim()};rec.onend=()=>{if(active)setTimeout(()=>{try{rec.start()}catch(e){}},200)}}else mic.disabled=true;
  };
  wait();
})();