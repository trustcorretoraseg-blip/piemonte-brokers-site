// Piemonte Brokers → Chaves na Mão
// Netlify Function
// URL pública:
// https://www.piemontebrokers.com.br/.netlify/functions/chaves-na-mao

const BASE = 'https://www.piemontebrokers.com.br';


/* =========================================================
   FUNÇÕES BÁSICAS
========================================================= */

const esc = v =>
  String(v ?? '')
    .replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      }[c])
    )
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,
      ''
    );


const tag = (name, value) =>
  `<${name}>${esc(value)}</${name}>`;


/* =========================================================
   VALORES MONETÁRIOS
========================================================= */

function money(value) {

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0
      ? value.toFixed(2)
      : '';
  }

  let s = String(value ?? '')
    .replace(/[^0-9.,-]/g, '')
    .trim();

  if (!s) return '';

  const dot = s.lastIndexOf('.');
  const comma = s.lastIndexOf(',');

  if (dot >= 0 && comma >= 0) {
    s =
      dot > comma
        ? s.replace(/,/g, '')
        : s.replace(/\./g, '').replace(',', '.');
  }

  else if (comma >= 0) {
    s =
      /,\d{1,2}$/.test(s)
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
  }

  else if (
    dot >= 0 &&
    /\.\d{3}(?:\.\d{3})*$/.test(s)
  ) {
    s = s.replace(/\./g, '');
  }

  const n = Number(s);

  return Number.isFinite(n) && n > 0
    ? n.toFixed(2)
    : '';
}


/* =========================================================
   NÚMEROS
========================================================= */

const num = v => {

  if (
    v === null ||
    v === undefined ||
    v === ''
  ) {
    return '';
  }

  const n = Number(v);

  return Number.isFinite(n)
    ? String(n)
    : '';
};


/* =========================================================
   URL ABSOLUTA
========================================================= */

const url = v => {

  if (!v) return '';

  const s = String(v).trim();

  if (/^https?:\/\//i.test(s)) {
    return s;
  }

  return BASE + '/' + s.replace(/^\/+/, '');
};


/* =========================================================
   LOCALIZAÇÃO
========================================================= */

function location(p) {

  /*
    PRIORIDADE:
    1. Campos simples exclusivos do Chaves na Mão
    2. Estrutura antiga chavesEndereco, para compatibilidade
    3. Campos normais do site, como fallback
  */

  const enderecoChaves =
    p.chavesEndereco && typeof p.chavesEndereco === 'object'
      ? p.chavesEndereco
      : {};

  const city =
    String(
      p.chavesCidade ||
      enderecoChaves.cidade ||
      p.cidade ||
      ''
    ).trim();

  if (
    !city ||
    /[,/]/.test(city) ||
    /^granja viana$/i.test(city)
  ) {
    return null;
  }

  const uf =
    String(
      p.chavesUf ||
      enderecoChaves.uf ||
      p.uf ||
      p.estado ||
      'SP'
    )
      .trim()
      .toUpperCase();

  if (!/^[A-Z]{2}$/.test(uf)) {
    return null;
  }

  const bairro =
    String(
      p.chavesBairro ||
      enderecoChaves.bairro ||
      p.bairroChavesNaMao ||
      p.bairro ||
      ''
    ).trim();

  if (!bairro) {
    return null;
  }

  return {
    city,
    uf,
    bairro,
    cep: String(p.chavesCep || enderecoChaves.cep || '').trim(),
    endereco: String(p.chavesLogradouro || enderecoChaves.logradouro || '').trim(),
    numero: String(p.chavesNumero || enderecoChaves.numero || '').trim(),
    complemento: String(p.chavesComplemento || enderecoChaves.complemento || '').trim()
  };
}



/* =========================================================
   TIPO DO IMÓVEL
========================================================= */

function finalidadeDoTipo(tipo) {

  const t =
    String(tipo || '')
      .trim()
      .toLowerCase();


  if (
    [
      'galpão / depósito',
      'conjunto comercial / sala',
      'ponto comercial',
      'prédio',
      'terreno comercial',
      'casa / sobrado comercial'
    ].includes(t)
  ) {
    return 'CO';
  }


  if (
    [
      'fazenda',
      'sítio / chácara'
    ].includes(t)
  ) {
    return 'RU';
  }


  return 'RE';
}


function typeOf(p) {

  /*
    PRIMEIRO:
    campo exclusivo do Chaves na Mão
  */

  const exclusivo =
    String(
      p.tipoChavesNaMao || ''
    ).trim();

  if (exclusivo) {

    return [
      finalidadeDoTipo(exclusivo),
      exclusivo
    ];

  }


  /*
    FALLBACK:
    mantém compatibilidade com imóveis antigos
  */

  const t =
    String(
      p.tipo || ''
    )
      .trim()
      .toLowerCase();


  const condominio =
    String(
      p.condominio ||
      ''
    ).trim();


  const emCondominio =
    Boolean(condominio);


  if (
    [
      'casa',
      'sobrado'
    ].includes(t)
  ) {

    return [
      'RE',
      emCondominio
        ? 'Casa / Sobrado em Condomínio'
        : 'Casa / Sobrado'
    ];

  }


  if (t === 'apartamento') {

    return [
      'RE',
      'Apartamento'
    ];

  }


  if (t === 'cobertura') {

    return [
      'RE',
      'Cobertura'
    ];

  }


  if (
    [
      'terreno',
      'lote'
    ].includes(t)
  ) {

    return [
      'RE',
      emCondominio
        ? 'Terreno em Condomínio'
        : 'Terreno / Lote'
    ];

  }


  if (
    [
      'sítio',
      'sitio',
      'chácara',
      'chacara'
    ].includes(t)
  ) {

    return [
      'RU',
      'Sítio / Chácara'
    ];

  }


  if (
    [
      'fazenda',
      'haras'
    ].includes(t)
  ) {

    return [
      'RU',
      'Fazenda'
    ];

  }


  if (
    [
      'galpão',
      'galpao',
      'depósito',
      'deposito'
    ].includes(t)
  ) {

    return [
      'CO',
      'Galpão / Depósito'
    ];

  }


  if (
    [
      'sala comercial',
      'conjunto comercial'
    ].includes(t)
  ) {

    return [
      'CO',
      'Conjunto Comercial / Sala'
    ];

  }


  if (
    [
      'loja',
      'ponto comercial'
    ].includes(t)
  ) {

    return [
      'CO',
      'Ponto Comercial'
    ];

  }


  if (
    [
      'prédio',
      'predio'
    ].includes(t)
  ) {

    return [
      'CO',
      'Prédio'
    ];

  }


  if (
    [
      'terreno comercial',
      'área comercial',
      'area comercial',
      'área industrial',
      'area industrial'
    ].includes(t)
  ) {

    return [
      'CO',
      'Terreno Comercial'
    ];

  }


  return null;
}


/* =========================================================
   PREÇOS / NEGÓCIO
========================================================= */

function prices(p) {

  const mode =
    String(
      p.negocio || ''
    ).toLowerCase();


  const isBoth =
    mode.includes('venda') &&
    (
      mode.includes('loca') ||
      mode.includes('alug')
    );


  const isRent =
    !mode.includes('venda') &&
    (
      mode.includes('loca') ||
      mode.includes('alug')
    );


  const fallback =
    money(p.preco) ||
    money(p.precoTexto);


  const sale =
    money(p.precoVenda) ||
    (
      !isRent
        ? fallback
        : ''
    );


  const rent =
    money(p.precoLocacaoTexto) ||
    money(p.precoLocacao) ||
    (
      isRent
        ? fallback
        : ''
    );


  if (
    isBoth &&
    sale &&
    rent
  ) {

    return {
      main: 'V',
      secondary: 'L',
      price: sale,
      rent
    };

  }


  if (
    !isRent &&
    sale
  ) {

    return {
      main: 'V',
      secondary: '',
      price: sale,
      rent: ''
    };

  }


  if (
    isRent &&
    rent
  ) {

    return {
      main: 'L',
      secondary: '',
      price: rent,
      rent: ''
    };

  }


  return null;
}


/* =========================================================
   ITENS EXCLUSIVOS DO CHAVES NA MÃO
========================================================= */

function normalizeList(value) {

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(v => {

      if (typeof v === 'string') {
        return v.trim();
      }

      if (v && typeof v === 'object') {
        return String(v.item || v.value || '').trim();
      }

      return '';

    })
    .filter(Boolean);
}


const MAP_PRIVATIVA = {
  'Ar-condicionado': 'Ar Condicionado',
  'Área gourmet': 'Espaço gourmet',
  'Armários planejados': 'Armário(s) planejado(s)',
  'Banheira / Hidromassagem': 'Hidromassagem',
  'Cozinha planejada': 'Cozinha com armário(s)',
  'Dependência de empregada': 'Dependência de empregados',
  'Piscina privativa': 'Piscina',
  'Sacada / Varanda': 'Varanda'
};


const MAP_COMUM = {
  'Churrasqueira': 'Churrasqueira coletiva',
  'Estacionamento para visitantes': 'Vaga(s) para visitantes',
  'Pet place': 'Área para pets',
  'Portaria 24 horas': 'Portaria 24h',
  'Segurança 24 horas': 'Câmeras de segurança'
};


function xmlArea(tagName, selected, extras, map = {}) {

  const items = [
    ...normalizeList(selected),
    ...normalizeList(extras)
  ]
    .map(item => map[item] || item)
    .filter(Boolean);

  const unique = [...new Set(items)];

  return (
    `<${tagName}>` +
    unique.map(item => tag('item', item)).join('') +
    `</${tagName}>`
  );
}


/* =========================================================
   CAMPOS DO XML
========================================================= */

const FIELDS = [

  'referencia',
  'codigo_cliente',
  'link_cliente',

  'titulo',

  'transacao',
  'transacao2',

  'finalidade',
  'finalidade2',

  'destaque',

  'tipo',
  'tipo2',

  'valor',
  'valor_locacao',

  'valor_iptu',
  'valor_condominio',

  'area_total',
  'area_util',

  'conservacao',

  'quartos',
  'suites',
  'garagem',
  'banheiro',

  'closet',
  'salas',
  'despensa',
  'bar',
  'cozinha',

  'quarto_empregada',
  'escritorio',

  'area_servico',
  'lareira',
  'varanda',
  'lavanderia',

  'estado',
  'cidade',
  'bairro',

  'cep',
  'endereco',
  'numero',
  'complemento',

  'descritivo'

];


/* =========================================================
   DESCRIÇÃO PARA CHAVES NA MÃO
========================================================= */

function descricaoChavesNaMao(p) {

  const base =
    String(
      p.descricaoLonga ||
      p.descricao ||
      ''
    ).trim();


  const condominio =
    String(
      p.condominioChavesNaMao ||
      ''
    ).trim();


  if (!condominio) {

    return base.slice(
      0,
      3000
    );

  }


  /*
    O condomínio é reforçado na descrição,
    mas não substitui o bairro.
  */

  const prefixo =
    `Condomínio: ${condominio}. `;


  return (
    prefixo +
    base
  ).slice(
    0,
    3000
  );
}


/* =========================================================
   TÍTULO PARA CHAVES NA MÃO
========================================================= */

function tituloChavesNaMao(p) {

  const exclusivo =
    String(
      p.tituloChavesNaMao ||
      ''
    ).trim();


  if (exclusivo) {
    return exclusivo;
  }


  return String(
    p.titulo ||
    ''
  ).trim();
}


/* =========================================================
   MONTA UM IMÓVEL
========================================================= */

function entry(p) {

  const loc =
    location(p);


  const kind =
    typeOf(p);


  const price =
    prices(p);


  const id =
    String(
      p.codigo ||
      p.id ||
      ''
    ).trim();


  const desc =
    descricaoChavesNaMao(p);


  const titulo =
    tituloChavesNaMao(p);


  if (
    !loc ||
    !kind ||
    !price ||
    !id ||
    !desc ||
    !titulo
  ) {

    return null;

  }


  const values = {

    referencia:
      id,


    codigo_cliente:
      id,


    link_cliente:
      `${BASE}/propriedade.html?id=${encodeURIComponent(
        p.id || id
      )}`,


    titulo:
      titulo,


    transacao:
      price.main,


    transacao2:
      price.secondary,


    finalidade:
      kind[0],


    finalidade2:
      '',


    destaque:
      String(p.chavesDestaque) === '1'
        ? '1'
        : '0',


    tipo:
      kind[1],


    tipo2:
      '',


    valor:
      price.price,


    valor_locacao:
      price.rent,


    valor_iptu:
      money(
        p.iptu
      ),


    valor_condominio:
      money(
        p.valorCondominio
      ),


    area_total:
      num(
        p.areaTerreno
      ),


    area_util:
      num(
        p.areaConstruida
      ),


    conservacao:
      '',


    quartos:
      num(
        p.quartos
      ),


    suites:
      num(
        p.suites
      ),


    garagem:
      num(
        p.vagas
      ),


    banheiro:
      num(
        p.banheiros
      ),


    closet:
      '',


    salas:
      '',


    despensa:
      '',


    bar:
      '',


    cozinha:
      '',


    quarto_empregada:
      '',


    escritorio:
      p.escritorio
        ? '1'
        : '',


    area_servico:
      '',


    lareira:
      '',


    varanda:
      '',


    lavanderia:
      '',


    estado:
      loc.uf,


    cidade:
      loc.city,


    bairro:
      loc.bairro,


    /*
      ENDEREÇO EXCLUSIVO DO CHAVES NA MÃO
      O portal recebe os dados, mas a tag esconder_endereco_imovel
      continua em 1 para não exibir publicamente o endereço completo.
    */

    cep:
      loc.cep,


    endereco:
      loc.endereco,


    numero:
      loc.numero,


    complemento:
      loc.complemento,


    descritivo:
      desc

  };


  /* =====================================================
     FOTOS
  ===================================================== */

  const imgs = [

    ...new Set(

      [

        p.imagemCapa,

        ...(
          Array.isArray(
            p.galeria
          )
            ? p.galeria
            : []
        )

      ].filter(Boolean)

    )

  ];


  const photos =

    `<fotos_imovel>${
      imgs
        .map(
          v =>
            `<foto>${
              tag(
                'url',
                url(v)
              )
            }${
              tag(
                'data_atualizacao',
                ''
              )
            }</foto>`
        )
        .join('')
    }</fotos_imovel>`;


/* =========================================================
   VÍDEO YOUTUBE
========================================================= */

  const video =
    String(
      p.videoYoutubeChavesNaMao ||
      ''
    ).trim();


/* =========================================================
   CAMPOS FINAIS
========================================================= */

  const trailing =

    tag(
      'data_atualizacao',
      ''
    ) +

    tag(
      'latitude',
      p.latitude || ''
    ) +

    tag(
      'longitude',
      p.longitude || ''
    ) +

    tag(
      'video',
      video
    ) +

    xmlArea(
      'area_comum',
      p.chavesItensCondominio,
      p.chavesOutrosItensCondominio,
      MAP_COMUM
    ) +

    xmlArea(
      'area_privativa',
      p.chavesItensImovel,
      p.chavesOutrosItensImovel,
      MAP_PRIVATIVA
    ) +

    tag(
      'aceita_troca',
      '0'
    ) +

    tag(
      'periodo_locacao',
      (
        price.main === 'L' ||
        price.secondary === 'L'
      )
        ? '1'
        : ''
    ) +

    tag(
      'esconder_endereco_imovel',
      '1'
    );


  return (

    '<imovel>' +

    FIELDS
      .map(
        k =>
          tag(
            k,
            values[k] ?? ''
          )
      )
      .join('') +

    photos +

    trailing +

    '</imovel>'

  );
}


/* =========================================================
   GERA XML COMPLETO
========================================================= */

function buildXml(items) {

  const seen =
    new Set();


  const entries =
    [];


  for (const p of items) {


    /*
      SOMENTE IMÓVEIS MARCADOS COMO SIM
    */

    if (
      p.publicarChavesNaMao !== 'Sim'
    ) {
      continue;
    }


    /*
      SOMENTE IMÓVEIS DISPONÍVEIS
    */

    if (
      !/dispon[ií]vel/i.test(
        String(
          p.status || ''
        )
      ) ||
      p.publicado === false
    ) {

      continue;

    }


    const key =
      String(
        p.codigo ||
        p.id ||
        ''
      ).trim();


    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }


    const xml =
      entry(p);


    if (xml) {

      seen.add(key);

      entries.push(xml);

    }

  }


  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<Document>' +
    '<imoveis>' +
    entries.join('') +
    '</imoveis>' +
    '</Document>'
  );
}


/* =========================================================
   NETLIFY HANDLER
========================================================= */

exports.handler =
async () => {

  try {

    const response =
      await fetch(

        `${BASE}/data/portfolio.json`,

        {
          headers: {
            Accept:
              'application/json'
          }
        }

      );


    if (!response.ok) {

      throw new Error(
        `portfolio.json HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !Array.isArray(
        data.itens
      )
    ) {

      throw new Error(
        'Formato da carteira inesperado'
      );

    }


    return {

      statusCode:
        200,


      headers: {

        'Content-Type':
          'application/xml; charset=utf-8',

        'Cache-Control':
          'public, max-age=300'

      },


      body:
        buildXml(
          data.itens
        )

    };

  }


  catch (e) {

    console.error(
      'Erro Chaves na Mão:',
      e
    );


    return {

      statusCode:
        503,


      headers: {

        'Content-Type':
          'text/plain; charset=utf-8'

      },


      body:
        'Não foi possível gerar o XML. Verifique a publicação de data/portfolio.json.'

    };

  }

};


/* =========================================================
   TESTES
========================================================= */

exports._test = {

  buildXml,

  entry,

  money,

  location,

  prices,

  typeOf,

  descricaoChavesNaMao,

  tituloChavesNaMao,

  normalizeList,

  xmlArea

};
