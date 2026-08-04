(()=>{
'use strict';

const routes=[['dashboard','Tableau de bord'],['proposals','Propositions'],['calendar','Calendrier'],['profile','Profil'],['stats','Statistiques'],['history','Historique']];
const LINKEDIN_COMPOSER='https://www.linkedin.com/feed/?shareActive=true';
const PHOTO_PREFIX='vincent-linkedin-photo-v1-';
let data=null,route='dashboard',current=null;

const $=q=>document.querySelector(q);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const badge=s=>`<span class="badge ${s==='Active'||s==='Validé'?'green':s==='Proposition'?'blue':'orange'}">${esc(s)}</span>`;
const postText=p=>`${p.hook}\n\n${p.body}\n\n${p.cta}\n\n${p.hashtags.join(' ')}`;
const photoKey=p=>PHOTO_PREFIX+p.id;
const photoData=p=>localStorage.getItem(photoKey(p))||p.image||'';

function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),3000)}
function slug(v){return String(v||'publication-linkedin').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)}

function visualHtml(p,large=false){
  const src=photoData(p);
  if(src)return `<figure class="visual-frame ${large?'large':''}"><img src="${src}" alt="${esc(p.imageAlt||('Visuel LinkedIn : '+p.title))}"><figcaption>${localStorage.getItem(photoKey(p))?'Photo personnelle ajoutée sur cet appareil':'Visuel créé pour cette proposition'}</figcaption></figure>`;
  return `<div class="photo-placeholder ${large?'large':''}"><div class="photo-icon">📷</div><strong>Ajoute ta photo réelle</strong><p>${esc(p.visual||'Choisis une photo naturelle en rapport avec la publication.')}</p><button class="btn light" data-photo="${p.id}">Ajouter ma photo</button></div>`;
}

async function fileToLinkedInPhoto(file){
  if(!file||!file.type.startsWith('image/'))throw new Error('Fichier non reconnu');
  const url=URL.createObjectURL(file),img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Image illisible'));img.src=url});
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=627;
  const ctx=canvas.getContext('2d');
  const scale=Math.max(canvas.width/img.width,canvas.height/img.height);
  const w=img.width*scale,h=img.height*scale,x=(canvas.width-w)/2,y=(canvas.height-h)/2;
  ctx.drawImage(img,x,y,w,h);URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg',.84);
}

async function choosePhoto(p){
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;const photo=await fileToLinkedInPhoto(file);localStorage.setItem(photoKey(p),photo);render();if(current?.id===p.id&&$('#postDialog').open)populateDialog(p);toast('Photo ajoutée et recadrée au format LinkedIn')}catch(e){toast(e?.name==='QuotaExceededError'?'Photo trop lourde pour être conservée sur cet appareil':'Impossible d’ajouter cette photo')}};
  input.click();
}

async function photoBlob(p){const src=photoData(p);if(!src)throw new Error('Aucune photo');const r=await fetch(src);return await r.blob()}
async function copyPost(p){try{await navigator.clipboard.writeText(postText(p));toast('Texte LinkedIn copié')}catch{toast('Copie impossible : sélectionne le texte manuellement')}}
async function downloadPhoto(p){try{const blob=await photoBlob(p),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`${slug(p.title)}-linkedin.jpg`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Photo téléchargée')}catch{toast('Ajoute d’abord ta photo réelle')}}
async function sharePost(p){
  const src=photoData(p);
  try{
    if(src){const blob=await photoBlob(p),file=new File([blob],`${slug(p.title)}-linkedin.jpg`,{type:'image/jpeg'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:p.title,text:postText(p),files:[file]});return}}
    if(navigator.share){await navigator.share({title:p.title,text:postText(p)});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  await prepareLinkedIn(p);
}
async function prepareLinkedIn(p){
  window.open(LINKEDIN_COMPOSER,'_blank','noopener,noreferrer');
  await copyPost(p);
  if(photoData(p))await downloadPhoto(p);
  p.status='Validé';render();
  toast(photoData(p)?'LinkedIn ouvert : colle le texte et ajoute la photo téléchargée.':'LinkedIn ouvert : colle le texte puis ajoute ta photo.');
}

async function load(){try{const r=await fetch('data.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error();data=await r.json();render();const d=new Date(data.lastSync);$('#lastSync').textContent='Dernière mise à jour : '+d.toLocaleString('fr-FR')}catch{$('#app').innerHTML='<div class="card">Impossible de charger les données. Réessaie dans quelques instants.</div>'}}
function nav(){const buttons=routes.map(([r,l])=>`<button class="nav-btn ${route===r?'active':''}" data-route="${r}">${l}</button>`).join('');$('#nav').innerHTML=buttons;$('#bottomNav').innerHTML=routes.slice(0,5).map(([r,l])=>`<button class="${route===r?'active':''}" data-route="${r}">${l}</button>`).join('')}
function metric(label,value,foot){return `<article class="card metric"><label>${label}</label><strong>${value}</strong><span>${foot}</span></article>`}
function postCard(p){const hasPhoto=!!photoData(p);return `<article class="card post-card">${visualHtml(p)}<div class="status">${badge(p.status)}<span class="badge">${p.date} · ${p.time}</span></div><h3>${esc(p.title)}</h3><div class="hook">${esc(p.hook)}</div><div class="excerpt">${esc(p.body)}</div><div class="reason"><strong>Photo conseillée</strong><br>${esc(p.visual)}</div><div class="actions"><button class="btn primary" data-open="${p.id}">Ouvrir</button><button class="btn light" data-photo="${p.id}">${hasPhoto?'Changer la photo':'Ajouter ma photo'}</button><button class="btn success" data-share="${p.id}">Partager</button></div></article>`}
function dashboard(){const verified=data.stats.verified;return `<section class="hero"><div><span class="badge blue">8 H 15 → CHATGPT · 8 H 30 → APPLICATION</span><h2>Trois posts et trois visuels prêts.</h2><p>ChatGPT prépare le texte et l’image de chaque proposition. Tu peux télécharger le visuel fourni ou le remplacer par ta propre photo avant d’ouvrir LinkedIn.</p><button class="btn primary" data-route="proposals">Voir les propositions du jour</button></div><div class="hero-stat"><strong>${data.posts.length}</strong><span>posts prêts</span></div></section><div class="section"><div><h2>Vue d’ensemble</h2><p>Données synchronisées depuis ChatGPT.</p></div></div><section class="grid g4">${metric('Propositions',data.posts.length,'Textes complets')}${metric('Visuels',data.posts.filter(p=>p.image).length,'Images prêtes')}${metric('Impressions',verified?data.stats.weeklyImpressions.toLocaleString('fr-FR'):'—','Non connecté à LinkedIn')}${metric('Engagement',verified?data.stats.engagement+' %':'—','Non connecté à LinkedIn')}</section><div class="section"><div><h2>Propositions du moment</h2></div></div><section class="grid g3">${data.posts.slice(0,3).map(postCard).join('')}</section><div class="section"><div><h2>Automatisations ChatGPT</h2></div></div><div class="card">${data.tasks.map(t=>`<div class="list-row"><div><strong>${esc(t.title)}</strong><span>${esc(t.schedule)}</span></div>${badge(t.status)}</div>`).join('')}</div>`}
function proposals(){return `<div class="section"><div><h2>Propositions préparées par ChatGPT</h2><p>Télécharge le visuel fourni ou remplace-le par ta photo, puis ouvre LinkedIn.</p></div></div><section class="grid g3">${data.posts.map(postCard).join('')}</section>`}
function calendar(){const days=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];return `<div class="section"><div><h2>Calendrier éditorial</h2><p>Planning conseillé à partir des publications du jour.</p></div></div><section class="calendar">${days.map((d,i)=>{const p=data.posts[i]||null;return `<div class="day"><h3>${d}</h3>${p?`<div class="cal-item" data-open="${p.id}">${badge(p.status)}<strong>${esc(p.title)}</strong><span>${p.time} · ${esc(p.type)}</span></div>`:'<span class="badge">Libre</span>'}</div>`}).join('')}</section>`}
function profile(){return `<div class="section"><div><h2>Profil LinkedIn</h2><p>Lien exact confirmé par Vincent.</p></div><a class="btn primary" href="${esc(data.profile.url)}" target="_blank" rel="noopener noreferrer">Ouvrir mon profil LinkedIn</a></div><section class="grid g2"><article class="card"><span class="badge green">Profil identifié</span><h2 class="profile-title">${esc(data.profile.title)}</h2><div class="progress"><i style="width:${data.profile.score}%"></i></div><div class="section"><div><h2>Compétences</h2></div></div><div class="chips">${data.profile.skills.map(s=>`<span class="badge">${esc(s)}</span>`).join('')}</div></article><article class="card"><h2>Résumé</h2><p class="summary">${esc(data.profile.summary)}</p></article></section>`}
function stats(){if(!data.stats.verified)return `<div class="section"><div><h2>Statistiques LinkedIn</h2><p>Le lien du profil est confirmé, mais le plugin ChatGPT ne donne pas accès aux statistiques personnelles.</p></div></div><article class="card"><span class="badge orange">Données non disponibles</span><h2 style="margin-top:14px">Aucun chiffre réel affiché</h2><p class="summary">${esc(data.stats.source)} Envoie des captures de l’onglet Statistiques LinkedIn et elles seront intégrées sans inventer de valeurs.</p><a class="btn primary" href="${esc(data.profile.url)}" target="_blank" rel="noopener noreferrer">Ouvrir mon profil</a></article>`;return `<div class="section"><div><h2>Statistiques enregistrées</h2><p>Données réelles synchronisées.</p></div></div><section class="grid g4">${metric('Abonnés',data.stats.followers,'Valeur réelle')}${metric('Visites du profil',data.stats.profileViews,'Période suivie')}${metric('Impressions',data.stats.weeklyImpressions.toLocaleString('fr-FR'),'Semaine')}${metric('Engagement',data.stats.engagement+' %','Calcul enregistré')}</section>`}
function history(){return `<div class="section"><div><h2>Historique ChatGPT</h2><p>Dernières synchronisations et décisions.</p></div></div><article class="card">${data.history.map(h=>`<div class="list-row"><div><strong>${esc(h[1])}</strong><span>${esc(h[0])} · ${esc(h[2])}</span></div></div>`).join('')}</article>`}
function render(){if(!data)return;nav();const map={dashboard,proposals,calendar,profile,stats,history};$('#pageTitle').textContent=routes.find(r=>r[0]===route)?.[1]||'Tableau de bord';$('#app').innerHTML=map[route]()}
function populateDialog(p){$('#dialogTitle').textContent=p.title;$('#dialogBody').innerHTML=`${visualHtml(p,true)}<div class="post-details"><span class="badge blue">${esc(p.type)}</span><span class="badge">${esc(p.angle)}</span><h3>Publication prête</h3><div class="full-post"><strong>${esc(p.hook)}</strong>\n\n${esc(p.body)}\n\n${esc(p.cta)}\n\n${p.hashtags.map(esc).join(' ')}</div><div class="reason"><strong>Objectif :</strong> ${esc(p.objective)}<br><strong>Photo conseillée :</strong> ${esc(p.visual)}</div></div>`}
function openPost(id){current=data.posts.find(p=>p.id===id);if(!current)return;populateDialog(current);$('#postDialog').showModal()}
function findPost(el,key){return data.posts.find(p=>p.id===el.dataset[key])}

document.addEventListener('click',e=>{const r=e.target.closest('[data-route]');if(r){route=r.dataset.route;render();return}const o=e.target.closest('[data-open]');if(o){openPost(o.dataset.open);return}const ph=e.target.closest('[data-photo]');if(ph){choosePhoto(findPost(ph,'photo'));return}const s=e.target.closest('[data-share]');if(s){sharePost(findPost(s,'share'));return}});
$('#refreshBtn').onclick=load;
$('#closeDialog').onclick=()=>$('#postDialog').close();
$('#copyPost').onclick=()=>current&&copyPost(current);
$('#uploadPhoto').onclick=()=>current&&choosePhoto(current);
$('#downloadVisual').onclick=()=>current&&downloadPhoto(current);
$('#sharePost').onclick=()=>current&&sharePost(current);
$('#validatePost').onclick=()=>{if(!current)return;current.status='Validé';$('#postDialog').close();render();toast('Proposition validée dans l’application')};
$('#publishPost').onclick=()=>current&&prepareLinkedIn(current);
load();
})();
