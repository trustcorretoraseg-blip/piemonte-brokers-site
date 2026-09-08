let SITE = {};
let PORTFOLIO = [];
let REGIOES = [];

const $ = seletor => document.querySelector(seletor);
const $$ = seletor => document.querySelectorAll(seletor);


/* =========================================================
   SEGURANÇA / TEXTO
========================================================= */

const esc = valor =>
  String(valor ?? "").replace(
    /[&<>"']/g,
    caractere =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[caractere])
  );


function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


/* =========================================================
   IDENTIFICAR PÁGINA
========================================================= */

function paginaAtual() {

  const caminho = window.location.pathname
    .toLowerCase()
    .replace(/\/+$/, "");


  if (
    caminho.endsWith("/imoveis") ||
    caminho.endsWith("/imoveis.html")
  ) {
    return "imoveis";
  }


  if (
    caminho.endsWith("/areas") ||
    caminho.endsWith("/areas.html")
  ) {
    return "areas";
  }


  if (
    caminho.endsWith("/regioes") ||
    caminho.endsWith("/regioes.html")
  ) {
    return "regioes";
  }


  if (
    caminho === "" ||
    caminho === "/" ||
    caminho.endsWith("/index") ||
    caminho.endsWith("/index.html")
  ) {
    return "home";
  }


  return "outra";
}


/* =========================================================
   CARREGAMENTO DOS ARQUIVOS JSON
========================================================= */

async function carregar() {

  try {

    const [
      siteResp,
      portfolioResp,
      regioesResp
    ] = await Promise.all([

      fetch(
        "/data/site.json",
        { cache: "no-store" }
      ),

      fetch(
        "/data/portfolio.json",
        { cache: "no-store" }
      ),

      fetch(
        "/data/regioes.json",
        { cache: "no-store" }
      )

    ]);


    if (siteResp.ok) {
      SITE = await siteResp.json();
    }


    if (portfolioResp.ok) {

      const dados =
        await portfolioResp.json();

      PORTFOLIO =
        Array.isArray(dados.itens)
          ? dados.itens
          : [];

    } else {

      console.error(
        "Erro ao carregar portfolio.json:",
        portfolioResp.status
      );

    }


    if (regioesResp.ok) {

      const dados =
        await regioesResp.json();

      REGIOES =
        Array.isArray(dados.itens)
          ? dados.itens
          : [];

    } else {

      console.error(
        "Erro ao carregar regioes.json:",
        regioesResp.status
      );

    }


    aplicarSite();

    prepararFiltros();

    renderInicial();

    aplicarFiltroDaURL();

    renderRegioes();

    criarWhatsAppFlutuante();


  } catch (erro) {

    console.error(
      "Erro geral ao carregar site:",
      erro
    );


    const contador =
      $("#contador");


    if (contador) {
      contador.textContent =
        "Não foi possível carregar o portfólio.";
    }

  }

}


/* =========================================================
   CONFIGURAÇÕES GERAIS
========================================================= */

function aplicarSite() {

  const tituloHome =
    $("#tituloHome");


  if (tituloHome) {

    tituloHome.textContent =
      SITE.tituloHome ||
      "Imóveis, áreas e oportunidades com visão estratégica.";

  }


  const subtituloHome =
    $("#subtituloHome");


  if (subtituloHome) {

    subtituloHome.textContent =
      SITE.subtituloHome ||
      "Curadoria imobiliária de alto padrão.";

  }


  const textoSobre =
    $("#textoSobre");


  if (textoSobre) {

    textoSobre.textContent =
      SITE.textoSobre || "";

  }


  const hero =
    $(".hero");


  if (
    hero &&
    SITE.imagemHome
  ) {

    hero.style.backgroundImage =
      `url("${SITE.imagemHome}")`;

  }


  montarContato();

}


/* =========================================================
   CONTATOS
========================================================= */

function montarContato() {

  const contatoLinks =
    $("#contatoLinks");


  if (
    contatoLinks &&
    SITE.whatsapp
  ) {

    const numero =
      String(SITE.whatsapp)
        .replace(/\D/g, "");


    contatoLinks.innerHTML = `
      <a
        class="btn gold"
        href="https://wa.me/${esc(numero)}"
        target="_blank"
        rel="noopener"
      >
        WhatsApp
      </a>
    `;

  }


  $$("#footerContato").forEach(
    footer => {

      const itens = [];


      if (SITE.whatsapp) {

        const numero =
          String(SITE.whatsapp)
            .replace(/\D/g, "");


        itens.push(`
          <a
            href="https://wa.me/${esc(numero)}"
            target="_blank"
            rel="noopener"
          >
            WhatsApp
          </a>
        `);

      }


      if (SITE.email) {

        itens.push(`
          <a href="mailto:${esc(SITE.email)}">
            ${esc(SITE.email)}
          </a>
        `);

      }


      if (SITE.instagram) {

        itens.push(`
          <a
            href="${esc(SITE.instagram)}"
            target="_blank"
            rel="noopener"
          >
            Instagram
          </a>
        `);

      }


      if (SITE.cidadeBase) {

        itens.push(`
          <span>
            ${esc(SITE.cidadeBase)}
          </span>
        `);

      }


      footer.innerHTML =
        itens.join("");

    }
  );

}


/* =========================================================
   WHATSAPP FLUTUANTE
========================================================= */

function criarWhatsAppFlutuante() {

  if (
    document.querySelector(
      ".whatsapp-float"
    )
  ) {
    return;
  }


  const numero =
    String(
      SITE.whatsapp ||
      "5511933602204"
    )
      .replace(/\D/g, "");


  const mensagem =
    "Olá! Vim pelo site da Piemonte Brokers e gostaria de mais informações.";


  const link =
    document.createElement("a");


  link.className =
    "whatsapp-float";


  link.href =
    `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;


  link.target =
    "_blank";


  link.rel =
    "noopener noreferrer";


  link.setAttribute(
    "aria-label",
    "Falar com a Piemonte Brokers pelo WhatsApp"
  );


  link.innerHTML = `
    <span class="whatsapp-float-icon">
      ☎
    </span>

    <span class="whatsapp-float-text">
      Fale com a Piemonte
    </span>
  `;


  document.body.appendChild(
    link
  );

}


/* =========================================================
   CÓDIGO PB
========================================================= */

function codigoPiemonte(item) {

  if (
    item &&
    typeof item.codigo === "string" &&
    item.codigo.trim()
  ) {

    let codigo =
      item.codigo
        .trim()
        .toUpperCase();


    if (
      codigo.startsWith("PB")
    ) {
      return codigo;
    }


    return `PB ${codigo}`;

  }


  const indice =
    PORTFOLIO.findIndex(
      registro =>
        String(registro.id) ===
        String(item?.id)
    );


  const numero =
    indice >= 0
      ? indice + 1
      : 0;


  return `PB ${String(numero).padStart(4, "0")}`;
}


/* =========================================================
   FORMATAR NÚMEROS
========================================================= */

function formatarNumero(valor) {

  const numero =
    Number(valor);


  if (
    Number.isNaN(numero)
  ) {
    return valor;
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 2
    }
  );

}


/* =========================================================
   ESPECIFICAÇÕES
========================================================= */

function specs(item) {

  const dados = [];


  if (
    Number(item.suites) > 0
  ) {

    dados.push(
      `${item.suites} ${
        Number(item.suites) === 1
          ? "suíte"
          : "suítes"
      }`
    );

  }

  else if (
    Number(item.quartos) > 0
  ) {

    dados.push(
      `${item.quartos} ${
        Number(item.quartos) === 1
          ? "dormitório"
          : "dormitórios"
      }`
    );

  }


  if (
    Number(item.areaConstruida) > 0
  ) {

    dados.push(
      `${formatarNumero(
        item.areaConstruida
      )} m² construídos`
    );

  }


  if (
    Number(item.areaTerreno) > 0
  ) {

    dados.push(
      `${formatarNumero(
        item.areaTerreno
      )} m² de terreno`
    );

  }


  return dados.join(" • ");

}


/* =========================================================
   OPÇÃO DE SELECT
========================================================= */

function adicionarOpcao(
  campo,
  valor
) {

  if (
    !campo ||
    campo.tagName !== "SELECT" ||
    !valor
  ) {
    return;
  }


  const existe =
    [...campo.options]
      .some(
        opcao =>
          normalizarTexto(
            opcao.value
          ) ===
          normalizarTexto(valor)
      );


  if (existe) {
    return;
  }


  const option =
    document.createElement(
      "option"
    );


  option.value =
    valor;


  option.textContent =
    valor;


  campo.appendChild(
    option
  );

}


/* =========================================================
   PREPARAR FILTROS
========================================================= */

function prepararFiltros() {

  let lista =
    [...PORTFOLIO];


  const pagina =
    paginaAtual();


  if (
    pagina === "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          item.categoria === "Imóvel"
      );

  }


  if (
    pagina === "areas"
  ) {

    lista =
      lista.filter(
        item =>
          item.categoria === "Área"
      );

  }


  const categoria =
    $("#fCategoria");


  const tipo =
    $("#fTipo");


  const cidade =
    $("#fCidade");


  if (categoria) {

    [
      ...new Set(
        lista
          .map(
            item =>
              item.categoria
          )
          .filter(Boolean)
      )
    ]
      .sort()
      .forEach(
        valor =>
          adicionarOpcao(
            categoria,
            valor
          )
      );

  }


  if (tipo) {

    [
      ...new Set(
        lista
          .map(
            item =>
              item.tipo
          )
          .filter(Boolean)
      )
    ]
      .sort()
      .forEach(
        valor =>
          adicionarOpcao(
            tipo,
            valor
          )
      );

  }


  if (
    cidade &&
    cidade.tagName === "SELECT"
  ) {

    const locais =
      [
        ...new Set(
          lista
            .flatMap(
              item => [
                item.regiaoPrincipal,
                item.cidade,
                item.regiao,
                item.condominio
              ]
            )
            .filter(Boolean)
        )
      ]
        .sort(
          (a, b) =>
            String(a)
              .localeCompare(
                String(b),
                "pt-BR"
              )
        );


    locais.forEach(
      valor =>
        adicionarOpcao(
          cidade,
          valor
        )
    );

  }

}


/* =========================================================
   REGIÕES
========================================================= */

function renderRegioes() {

  const box =
    $("#regioesCards");


  if (!box) {
    return;
  }


  const lista =
    REGIOES.filter(
      item =>
        item.destaque !== false
    );


  box.innerHTML = "";


  lista.forEach(
    item => {

      const link =
        document.createElement("a");


      link.className =
        "regiao-home-card";


      /*
        IMPORTANTE:

        O filtro de região usa exatamente o nome
        que também deve existir em "regiaoPrincipal"
        no cadastro do imóvel.
      */

      const regiaoFiltro =
        item.nome ||
        item.cidadeFiltro ||
        "";


      const idNormalizado =
        normalizarTexto(
          item.id
        );


      const nomeNormalizado =
        normalizarTexto(
          regiaoFiltro
        );


      const ehArea =
        idNormalizado.includes("area") ||
        nomeNormalizado.includes(
          "areas & oportunidades"
        ) ||
        nomeNormalizado.includes(
          "areas para"
        );


      const destino =
        ehArea
          ? "/areas.html"
          : "/imoveis.html";


      link.href =
        regiaoFiltro
          ? `${destino}?regiao=${encodeURIComponent(regiaoFiltro)}`
          : destino;


      const imagem =
        item.imagem ||
        "/assets/home-principal.jpeg";


      link.innerHTML = `

        <div class="regiao-home-img">

          <img
            src="${esc(imagem)}"
            alt="${esc(
              item.nome ||
              "Piemonte Brokers"
            )}"
            loading="lazy"
          >

        </div>


        <div class="regiao-home-body">

          <h3>
            ${esc(item.nome || "")}
          </h3>

          <p>
            ${esc(item.descricao || "")}
          </p>

        </div>

      `;


      box.appendChild(
        link
      );

    }
  );

}


/* =========================================================
   FILTRO POR URL
========================================================= */

function aplicarFiltroDaURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const regiao =
    params.get("regiao");


  const cidade =
    params.get("cidade");


  /*
    REGIÃO

    Quando o clique vem dos cards de região,
    filtramos EXCLUSIVAMENTE por regiaoPrincipal.

    Exemplo:
    regiaoPrincipal = "Granja Viana"

    Assim uma casa de Itu nunca aparece
    quando o cliente clicar em Granja Viana.
  */

  if (regiao) {

    const regiaoNormalizada =
      normalizarTexto(regiao);


    let lista =
      PORTFOLIO.filter(
        item =>
          item.status !== "Vendido" &&
          item.status !== "Indisponível"
      );


    if (
      paginaAtual() === "imoveis"
    ) {

      lista =
        lista.filter(
          item =>
            item.categoria === "Imóvel"
        );

    }


    if (
      paginaAtual() === "areas"
    ) {

      lista =
        lista.filter(
          item =>
            item.categoria === "Área"
        );

    }


    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.regiaoPrincipal
          ) ===
          regiaoNormalizada
      );


    const campo =
      $("#fCidade");


    if (
      campo &&
      campo.tagName === "SELECT"
    ) {

      adicionarOpcao(
        campo,
        regiao
      );


      const opcao =
        [...campo.options]
          .find(
            item =>
              normalizarTexto(
                item.value
              ) ===
              regiaoNormalizada
          );


      if (opcao) {
        campo.value =
          opcao.value;
      }

    }


    render(lista);

    return;

  }


  /*
    COMPATIBILIDADE COM LINKS ANTIGOS ?cidade=
  */

  if (!cidade) {
    return;
  }


  const campo =
    $("#fCidade");


  if (
    campo &&
    campo.tagName === "SELECT"
  ) {

    adicionarOpcao(
      campo,
      cidade
    );


    const cidadeNormalizada =
      normalizarTexto(cidade);


    const opcao =
      [...campo.options]
        .find(
          item =>
            normalizarTexto(
              item.value
            ) ===
            cidadeNormalizada
        );


    if (opcao) {
      campo.value =
        opcao.value;
    }


    filtrar();

  }

}


/* =========================================================
   LISTAGEM INICIAL
========================================================= */

function renderInicial() {

  if (
    !$("#cards")
  ) {
    return;
  }


  let lista =
    [...PORTFOLIO];


  lista =
    lista.filter(
      item =>
        item.status !== "Vendido" &&
        item.status !== "Indisponível"
    );


  const pagina =
    paginaAtual();


  /*
    PÁGINA IMÓVEIS

    Nunca mostra itens cadastrados como Área.
  */

  if (
    pagina === "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          item.categoria === "Imóvel"
      );

  }


  /*
    PÁGINA ÁREAS

    Nunca mostra imóveis residenciais.
  */

  if (
    pagina === "areas"
  ) {

    lista =
      lista.filter(
        item =>
          item.categoria === "Área"
      );

  }


  /*
    HOME

    Exibe somente imóveis/áreas marcados
    como destaque.
  */

  if (
    pagina === "home"
  ) {

    const destaques =
      lista
        .filter(
          item =>
            item.destaque === true
        )
        .sort(
          (a, b) =>
            Number(
              a.ordemDestaque ?? 99
            )
            -
            Number(
              b.ordemDestaque ?? 99
            )
        );


    lista =
      destaques.length
        ? destaques.slice(0, 6)
        : lista.slice(0, 6);

  }


  render(lista);

}


/* =========================================================
   RENDERIZAR CARDS
========================================================= */

function render(lista) {

  const box =
    $("#cards");


  if (!box) {
    return;
  }


  box.innerHTML = "";


  lista.forEach(
    item => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card";


      card.tabIndex =
        0;


      card.setAttribute(
        "role",
        "link"
      );


      const imagem =
        item.imagemCapa ||
        "/assets/logo-piemonte.png";


      const localCard =
        [
          item.regiaoPrincipal,
          item.cidade,
          item.regiao
        ]
          .filter(Boolean);


      const localUnico =
        [...new Set(localCard)];


      card.innerHTML = `

        <div class="card-img">

          <img
            src="${esc(imagem)}"
            alt="${esc(
              item.titulo ||
              "Piemonte Brokers"
            )}"
            loading="lazy"
          >

          ${
            item.categoria
              ? `
                <span class="badge">
                  ${esc(item.categoria)}
                </span>
              `
              : ""
          }

        </div>


        <div class="card-body">

          <div class="property-code-card">
            ${esc(
              codigoPiemonte(item)
            )}
          </div>


          <div class="meta">
            ${esc(
              localUnico.join(" • ")
            )}
          </div>


          <h3>
            ${esc(
              item.titulo ||
              "Oportunidade Piemonte"
            )}
          </h3>


          <p>
            ${esc(
              specs(item) ||
              item.descricao ||
              ""
            )}
          </p>


          <strong class="price">
            ${esc(
              item.precoTexto ||
              "Consulte"
            )}
          </strong>

        </div>

      `;


      card.addEventListener(
        "click",
        () =>
          abrirPropriedade(
            item
          )
      );


      card.addEventListener(
        "keydown",
        evento => {

          if (
            evento.key === "Enter" ||
            evento.key === " "
          ) {

            evento.preventDefault();

            abrirPropriedade(
              item
            );

          }

        }
      );


      box.appendChild(
        card
      );

    }
  );


  const contador =
    $("#contador");


  if (contador) {

    contador.textContent =
      `${lista.length} ${
        lista.length === 1
          ? "oportunidade"
          : "oportunidades"
      }`;

  }


  const vazio =
    $("#vazio");


  if (vazio) {

    const semResultados =
      lista.length === 0;


    vazio.hidden =
      !semResultados;


    vazio.style.display =
      semResultados
        ? "block"
        : "none";

  }

}


/* =========================================================
   ABRIR IMÓVEL
========================================================= */

function abrirPropriedade(item) {

  if (
    !item ||
    !item.id
  ) {

    console.warn(
      "Imóvel sem ID:",
      item
    );

    return;

  }


  window.location.href =
    `/propriedade.html?id=${encodeURIComponent(item.id)}`;

}


/*
  Compatibilidade com versões antigas.
*/

function abrir(item) {
  abrirPropriedade(item);
}


/* =========================================================
   FAIXA DE PREÇO
========================================================= */

function atendeFaixaPreco(
  item,
  faixa
) {

  if (!faixa) {
    return true;
  }


  const valor =
    Number(
      item.preco || 0
    );


  if (!valor) {
    return false;
  }


  switch (faixa) {

    case "ate-1m":

      return valor <= 1000000;


    case "1m-3m":

      return (
        valor > 1000000 &&
        valor <= 3000000
      );


    case "3m-5m":

      return (
        valor > 3000000 &&
        valor <= 5000000
      );


    case "5m-10m":

      return (
        valor > 5000000 &&
        valor <= 10000000
      );


    case "10m-30m":

      return (
        valor > 10000000 &&
        valor <= 30000000
      );


    case "acima-10m":

      return valor > 10000000;


    case "acima-30m":

      return valor > 30000000;


    default:

      return true;

  }

}


/* =========================================================
   FILTROS MANUAIS
========================================================= */

function filtrar() {

  let lista =
    [...PORTFOLIO];


  /*
    Remove propriedades que não devem
    aparecer publicamente.
  */

  lista =
    lista.filter(
      item =>
        item.status !== "Vendido" &&
        item.status !== "Indisponível"
    );


  const pagina =
    paginaAtual();


  if (
    pagina === "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          item.categoria === "Imóvel"
      );

  }


  if (
    pagina === "areas"
  ) {

    lista =
      lista.filter(
        item =>
          item.categoria === "Área"
      );

  }


  const categoria =
    $("#fCategoria")
      ?.value || "";


  const negocio =
    $("#fNegocio")
      ?.value || "";


  const local =
    $("#fCidade")
      ?.value || "";


  const tipo =
    $("#fTipo")
      ?.value || "";


  const preco =
    $("#fPreco")
      ?.value || "";


  const localNormalizado =
    normalizarTexto(local);


  lista =
    lista.filter(
      item => {

        const regiaoPrincipal =
          normalizarTexto(
            item.regiaoPrincipal
          );


        const cidadeItem =
          normalizarTexto(
            item.cidade
          );


        const regiaoItem =
          normalizarTexto(
            item.regiao
          );


        const condominio =
          normalizarTexto(
            item.condominio
          );


        /*
          No filtro manual o usuário pode escolher
          região macro, cidade, bairro ou condomínio.
        */

        const localCorresponde =
          !localNormalizado ||

          regiaoPrincipal ===
            localNormalizado ||

          cidadeItem ===
            localNormalizado ||

          regiaoItem ===
            localNormalizado ||

          condominio ===
            localNormalizado;


        const categoriaCorresponde =
          !categoria ||
          item.categoria === categoria;


        const negocioCorresponde =
          !negocio ||
          item.negocio === negocio ||
          item.finalidade === negocio;


        const tipoCorresponde =
          !tipo ||
          item.tipo === tipo;


        const precoCorresponde =
          atendeFaixaPreco(
            item,
            preco
          );


        return (
          categoriaCorresponde &&
          negocioCorresponde &&
          localCorresponde &&
          tipoCorresponde &&
          precoCorresponde
        );

      }
    );


  render(lista);

}


/* =========================================================
   EVENTOS DOS FILTROS
========================================================= */

function ativarFiltros() {

  const filtros =
    $("#filtros");


  if (!filtros) {
    return;
  }


  if (
    filtros.tagName === "FORM"
  ) {

    filtros.addEventListener(
      "submit",
      evento => {

        evento.preventDefault();

        filtrar();

      }
    );

  }


  [
    "#fCategoria",
    "#fNegocio",
    "#fCidade",
    "#fTipo",
    "#fPreco"
  ]
    .forEach(
      seletor => {

        const elemento =
          $(seletor);


        if (elemento) {

          elemento.addEventListener(
            "change",
            filtrar
          );

        }

      }
    );

}


/* =========================================================
   MODAL ANTIGO
========================================================= */

function fechar() {

  const modal =
    $("#modal");


  if (!modal) {
    return;
  }


  modal.hidden =
    true;


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  modal.style.display =
    "none";


  document.body.style.overflow =
    "";

}


/* =========================================================
   EVENTOS DO MODAL
========================================================= */

function ativarModal() {

  const botaoNovo =
    $("#modalClose");


  const botaoAntigo =
    $("#fecharModal");


  if (botaoNovo) {

    botaoNovo.addEventListener(
      "click",
      fechar
    );

  }


  if (botaoAntigo) {

    botaoAntigo.addEventListener(
      "click",
      fechar
    );

  }


  const overlay =
    $(".modal-overlay");


  if (overlay) {

    overlay.addEventListener(
      "click",
      fechar
    );

  }


  document.addEventListener(
    "keydown",
    evento => {

      if (
        evento.key === "Escape"
      ) {

        fechar();

      }

    }
  );

}


/* =========================================================
   MENU MOBILE
========================================================= */

function ativarMenu() {

  const menuBtn =
    $("#menuBtn");


  const menu =
    $("#menu");


  if (
    !menuBtn ||
    !menu
  ) {
    return;
  }


  menuBtn.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "open"
      );

    }
  );


  menu
    .querySelectorAll("a")
    .forEach(
      link => {

        link.addEventListener(
          "click",
          () => {

            menu.classList.remove(
              "open"
            );

          }
        );

      }
    );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    ativarMenu();

    ativarFiltros();

    ativarModal();

    carregar();

  }
);