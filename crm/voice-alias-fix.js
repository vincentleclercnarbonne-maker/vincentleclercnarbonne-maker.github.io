(()=>{
  const replacements=[
    {re:/\b(?:m\s*\.?\s*c\s*\.?\s*)?(?:mc\s*)?project\b/gi,value:'M C PROJEC'},
    {re:/\b(?:m\s*\.?\s*c\s*\.?\s*)?(?:mc\s*)?projet\b/gi,value:'M C PROJEC'},
    {re:/\b(?:m\s*\.?\s*c\s*\.?\s*)?(?:mc\s*)?projec\b/gi,value:'M C PROJEC'},
    {re:/\bentreprise\s+peinture\s+(?:et\s+)?enduits?\b/gi,value:'ENTREPRISE PEINTURE ET ENDUITS'},
    {re:/\be\s*\.?\s*p\s*\.?\s*e\b/gi,value:'ENTREPRISE PEINTURE ET ENDUITS'},
    {re:/\bb\s*\.?\s*s\s*\.?\s*a\b/gi,value:'BSA OCCITANIE'},
    {re:/\be\s*\.?\s*t\s*\.?\s*r\b/gi,value:'ENTREPRISE DE TRAVAUX ET DE RAVALEMENT'}
  ];

  function normalizePrompt(){
    const input=document.querySelector('#dayPrompt');
    if(!input)return;
    let text=input.value;
    for(const item of replacements)text=text.replace(item.re,item.value);
    input.value=text.replace(/\s{2,}/g,' ').trim();
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#analyseDay'))normalizePrompt();
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&e.target?.id==='dayPrompt'&&(e.ctrlKey||e.metaKey))normalizePrompt();
  },true);
})();
