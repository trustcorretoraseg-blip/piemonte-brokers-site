let SITE={}, PORTFOLIO=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
async function carregar(){
  try{
    [SITE,PORTFOLIO]=await Promise.all([
      fetch("/data/site.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("/data/portfolio.json",{cache:"no-store"}).then(r=>r.json()).then(x=>x.itens||[])
    ]);
    aplicarSite(); prepararFiltros(); render(PORTFOLIO);
  }catch(e){
    $("#cards").innerHTML="<p>Não foi possível carregar o portfólio.</p>";
  }
}
function aplicarSite(){
  document.title=SITE.nome||"Piemonte Brokers";
  $("#tituloHome").textContent=SITE.tituloHome||"Piemonte Brokers";
  $("#subtituloHome").textContent=SITE.subtituloHome||"";
  $("#textoSobre").textContent=SITE.textoSobre||"";
  if(SITE.imagemHome) $(".hero").style.backgroundImage=`url("${SITE.imagemHome}")`;
  const links=[];
  if(SITE.whatsapp) links.push(`<a class="btn gold" href="https://wa.me/${esc(SITE.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if(SITE.email) links.push(`<a class="text-link light" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`);
  $("#contatoLinks").innerHTML=links.join(" ");
  const foot=[];
  if(SITE.whatsapp) foot.push(`<a href="https://wa.me/${esc(SITE.whatsapp)}">WhatsApp</a>`);
  if(SITE.email) foot.push(`<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`);
  if(SITE.instagram) foot.push(`<a href="${esc(SITE.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  if(SITE.cidadeBase) foot.push(`<span>${esc(SITE.cidadeBase)}</span>`);
  $("#footerContato").innerHTML=foot.join("");
}
function prepararFiltros(){
  const tipos=[...new Set(PORTFOLIO.map(x=>x.tipo).filter(Boolean))].sort();
  const sel=$("#fTipo"); tipos.forEach(t=>{const o=document.createElement("option");o.value=t;o.textContent=t;sel.appendChild(o)});
}
function specs(x){
  const a=[];
  if(x.suites) a.push(`${x.suites} suítes`);
  else if(x.quartos) a.push(`${x.quartos} dormitórios`);
  if(x.areaConstruida) a.push(`${Number(x.areaConstruida).toLocaleString("pt-BR")} m² construídos`);
  if(x.areaTerreno) a.push(`${Number(x.areaTerreno).toLocaleString("pt-BR",{maximumFractionDigits:2})} m² de área`);
  return a.join(" • ");
}
function render(lista){
  const box=$("#cards"); box.innerHTML="";
  lista.forEach(x=>{
    const el=document.createElement("article"); el.className="card"; el.tabIndex=0;
    el.innerHTML=`<div class="card-img"><img src="${esc(x.imagemCapa)}" alt="${esc(x.titulo)}"><span class="badge">${esc(x.categoria)}</span></div><div class="card-body"><div class="meta">${esc(x.cidade)}${x.regiao?" • "+esc(x.regiao):""}</div><h3>${esc(x.titulo)}</h3><p>${esc(specs(x)||x.descricao)}</p><strong class="price">${esc(x.precoTexto||"Consulte")}</strong></div>`;
    el.addEventListener("click",()=>abrir(x)); el.addEventListener("keydown",e=>{if(e.key==="Enter")abrir(x)});
    box.appendChild(el);
  });
  $("#contador").textContent=`${lista.length} ${lista.length===1?"oportunidade":"oportunidades"}`;
  $("#vazio").hidden=lista.length!==0;
}
function filtrar(){
  const c=$("#fCategoria").value,n=$("#fNegocio").value,ci=$("#fCidade").value.trim().toLowerCase(),t=$("#fTipo").value,p=Number($("#fPreco").value||0);
  render(PORTFOLIO.filter(x=>(!c||x.categoria===c)&&(!n||x.negocio===n)&&(!ci||`${x.cidade||""} ${x.regiao||""}`.toLowerCase().includes(ci))&&(!t||x.tipo===t)&&(!p||Number(x.preco||0)<=p)));
}
$("#filtros").addEventListener("submit",e=>{e.preventDefault();filtrar();$("#portfolio").scrollIntoView({behavior:"smooth"})});
["#fCategoria","#fNegocio","#fTipo","#fPreco"].forEach(s=>$(s).addEventListener("change",filtrar));
function abrir(x){
  $("#modalImg").src=x.imagemCapa||""; $("#modalImg").alt=x.titulo||"";
  $("#modalMeta").textContent=`${x.categoria||""} • ${x.cidade||""} • ${x.negocio||""}`;
  $("#modalTitulo").textContent=x.titulo||""; $("#modalDesc").textContent=x.descricao||"";
  $("#modalPreco").textContent=x.precoTexto||"Consulte";
  const s=$("#modalSpecs"); s.innerHTML="";
  const vals=[];
  if(x.suites) vals.push(`${x.suites} suítes`);
  if(x.banheiros) vals.push(`${x.banheiros} banheiros`);
  if(x.vagas) vals.push(`${x.vagas} vagas`);
  if(x.areaConstruida) vals.push(`${x.areaConstruida} m² construídos`);
  if(x.areaTerreno) vals.push(`${x.areaTerreno} m² de área`);
  vals.forEach(v=>{const sp=document.createElement("span");sp.textContent=v;s.appendChild(sp)});
  const g=$("#modalGaleria"); g.innerHTML="";
  (x.galeria||[]).forEach(src=>{const im=document.createElement("img");im.src=src;im.alt=x.titulo||"";g.appendChild(im)});
  $("#modal").hidden=false; document.body.style.overflow="hidden";
}
function fechar(){ $("#modal").hidden=true; document.body.style.overflow=""; }
$("#fecharModal").addEventListener("click",fechar); $("#modal").addEventListener("click",e=>{if(e.target.id==="modal")fechar()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)fechar()});
const menuBtn=$("#menuBtn"),menu=$("#menu"); menuBtn.addEventListener("click",()=>menu.classList.toggle("open"));
carregar();