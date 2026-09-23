// Piemonte Brokers → Chaves na Mão. Netlify Function: URL pública
// https://www.piemontebrokers.com.br/.netlify/functions/chaves-na-mao
const BASE = 'https://www.piemontebrokers.com.br';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const tag = (name, value) => `<${name}>${esc(value)}</${name}>`;
function money(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value.toFixed(2) : '';
  let s = String(value ?? '').replace(/[^0-9.,-]/g, '').trim();
  if (!s) return '';
  const dot = s.lastIndexOf('.'), comma = s.lastIndexOf(',');
  if (dot >= 0 && comma >= 0) s = dot > comma ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
  else if (comma >= 0) s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (dot >= 0 && /\.\d{3}(?:\.\d{3})*$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s); return Number.isFinite(n) && n > 0 ? n.toFixed(2) : '';
}
const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? '' : String(Number(v));
const url = v => { if (!v) return ''; const s = String(v).trim(); if (/^https?:\/\//i.test(s)) return s; return BASE + '/' + s.replace(/^\/+/, ''); };
function location(p) {
  // Não assumir que um condomínio é bairro nem que "Granja Viana" é município.
  const city = String(p.cidade || '').trim();
  if (!city || /[,/]/.test(city) || /^granja viana$/i.test(city)) return null;
  const uf = String(p.uf || p.estado || 'SP').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return null;
  const bairro = String(p.bairro || '').trim();
  if (!bairro) return null; // O portal exige bairro: cadastro precisa ser completado antes da importação.
  return { city, uf, bairro };
}
function typeOf(p) {
  const t = String(p.tipo || '').trim().toLowerCase();
  if (['casa','sobrado'].includes(t)) return ['RE','Casa'];
  if (t === 'apartamento') return ['RE','Apartamento'];
  if (t === 'terreno') return ['RE','Terreno'];
  if (['sítio','sitio','fazenda','haras'].includes(t)) return ['RU', 'Sítio'];
  return null;
}
function prices(p) {
  const mode = String(p.negocio || '').toLowerCase();
  const isBoth = mode.includes('venda') && (mode.includes('loca') || mode.includes('alug'));
  const isRent = !mode.includes('venda') && (mode.includes('loca') || mode.includes('alug'));
  const fallback = money(p.preco) || money(p.precoTexto);
  const sale = money(p.precoVenda) || (!isRent ? fallback : '');
  const rent = money(p.precoLocacao) || (isRent ? fallback : '');
  if (isBoth && sale && rent) return {main:'V',secondary:'L',price:sale,rent};
  if (!isRent && sale) return {main:'V',secondary:'',price:sale,rent:''};
  if (isRent && rent) return {main:'L',secondary:'',price:rent,rent:''};
  return null;
}
const FIELDS = ['referencia','codigo_cliente','link_cliente','titulo','transacao','transacao2','finalidade','finalidade2','destaque','tipo','tipo2','valor','valor_locacao','valor_iptu','valor_condominio','area_total','area_util','conservacao','quartos','suites','garagem','banheiro','closet','salas','despensa','bar','cozinha','quarto_empregada','escritorio','area_servico','lareira','varanda','lavanderia','estado','cidade','bairro','cep','endereco','numero','complemento','descritivo'];
function entry(p) {
  const loc = location(p), kind = typeOf(p), price = prices(p);
  const id = String(p.codigo || p.id || '').trim();
  const desc = String(p.descricaoLonga || p.descricao || '').trim().slice(0,3000);
  if (!loc || !kind || !price || !id || !desc) return null;
  const values = {
    referencia:id, codigo_cliente:id,
    link_cliente: `${BASE}/propriedade.html?id=${encodeURIComponent(p.id || id)}`,
    titulo:p.titulo || '', transacao:price.main, transacao2:price.secondary,
    finalidade:kind[0], finalidade2:'', destaque:p.destaque ? '1':'0', tipo:kind[1], tipo2:'',
    valor:price.price, valor_locacao:price.rent, valor_iptu:money(p.iptu), valor_condominio:money(p.valorCondominio),
    area_total:num(p.areaTerreno), area_util:num(p.areaConstruida),
    quartos:num(p.quartos), suites:num(p.suites), garagem:num(p.vagas), banheiro:num(p.banheiros),
    escritorio:p.escritorio ? '1' : '', estado:loc.uf, cidade:loc.city, bairro:loc.bairro,
    // Não compartilhar endereço exato se não tiver sido aprovado para divulgação.
    endereco:'', numero:'', cep:'', complemento:'', descritivo:desc
  };
  const imgs = [...new Set([p.imagemCapa, ...(Array.isArray(p.galeria) ? p.galeria : [])].filter(Boolean))];
  const photos = `<fotos_imovel>${imgs.map(v=>`<foto>${tag('url',url(v))}${tag('data_atualizacao','')}</foto>`).join('')}</fotos_imovel>`;
  const trailing = ['data_atualizacao','latitude','longitude','video'].map(k=>tag(k,p[k] || '')).join('') + '<area_comum></area_comum><area_privativa></area_privativa>' + tag('aceita_troca','0') + tag('periodo_locacao', price.main === 'L' || price.secondary === 'L' ? '1' : '') + tag('esconder_endereco_imovel','1');
  return `<imovel>${FIELDS.map(k=>tag(k,values[k] ?? '')).join('')}${photos}${trailing}</imovel>`;
}
function buildXml(items) {
  const seen = new Set();
  const entries = [];
  for (const p of items) {
    if (!/dispon[ií]vel/i.test(String(p.status || '')) || p.publicado === false) continue;
    const key=String(p.codigo || p.id || '').trim();
    if (!key || seen.has(key)) continue;
    const xml=entry(p);
    if (xml) {seen.add(key);entries.push(xml);}
  }
  return `<?xml version="1.0" encoding="utf-8"?><Document><imoveis>${entries.join('')}</imoveis></Document>`;
}
exports.handler = async () => {
  try {
    const response = await fetch(`${BASE}/data/portfolio.json`, {headers:{'Accept':'application/json'}});
    if (!response.ok) throw new Error(`portfolio.json HTTP ${response.status}`);
    const data=await response.json();
    if (!Array.isArray(data.itens)) throw new Error('Formato da carteira inesperado');
    return { statusCode:200,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'},body:buildXml(data.itens) };
  } catch (e) {
    return {statusCode:503,headers:{'Content-Type':'text/plain; charset=utf-8'},body:'Não foi possível gerar o XML. Verifique a publicação de data/portfolio.json.'};
  }
};
exports._test = {buildXml,entry,money,location,prices};
