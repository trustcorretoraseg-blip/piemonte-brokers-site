let SITE = {};
let PORTFOLIO = [];
let REGIOES = [];

const $ = seletor => document.querySelector(seletor);
const $$ = seletor => document.querySelectorAll(seletor);


/* =========================================================
   SEGURANÇA DE TEXTO
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


/* =========================================================
   NORMALIZAÇÃO DE TEXTO
========================================================= */

function normalizarTexto(valor) {

  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

}


/* =========================================================
   PÁGINA ATUAL
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
   CARREGAMENTO DOS DADOS
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
        {
          cache: "no-store"
        }
      ),

      fetch(
        "/data/portfolio.json",
        {
          cache: "no-store"
        }
      ),

      fetch(
        "/data/regioes.json",
        {
          cache: "no-store"
        }
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

      const dadosRegioes =
        await regioesResp.json();

      REGIOES =
        Array.isArray(dadosRegioes.itens)
          ? dadosRegioes.itens
          : [];

    }


    aplicarSite();

    prepararFiltros();

    renderInicial();

    aplicarFiltroDaURL();

    renderRegioes();


  } catch (erro) {

    console.error(
      "Erro ao carregar o site:",
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
   DADOS GERAIS DO SITE
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


  if (contatoLinks) {

    const links = [];


    if (SITE.whatsapp) {

      const numero =
        String(SITE.whatsapp)
          .replace(/\D/g, "");


      links.push(`

        <a
          class="btn gold"
          href="https://wa.me/${esc(numero)}"
          target="_blank"
          rel="noopener"
        >
          WhatsApp
        </a>

      `);

    }


    contatoLinks.innerHTML =
      links.join(" ");

  }


  $$("#footerContato")
    .forEach(
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

  const numeroWhatsApp =
    String(
      SITE.whatsapp ||
      "5511933602204"
    )
      .replace(/\D/g, "");


  if (
    document.querySelector(
      ".whatsapp-float"
    )
  ) {
    return;
  }


  const link =
    document.createElement("a");


  link.className =
    "whatsapp-float";


  const mensagem =
    "Olá! Vim pelo site da Piemonte Brokers e gostaria de mais informações.";


  link.href =
    `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;


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

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
      >

        <path
          fill="currentColor"
          d="
            M19.11 17.21
            c-.27-.14-1.61-.79-1.86-.88
            -.25-.09-.43-.14-.61.14
            -.18.27-.7.88-.86 1.06
            -.16.18-.32.2-.59.07
            -.27-.14-1.15-.42-2.19-1.34
            -.81-.72-1.36-1.61-1.52-1.88
            -.16-.27-.02-.42.12-.55
            .12-.12.27-.32.41-.48
            .14-.16.18-.27.27-.45
            .09-.18.05-.34-.02-.48
            -.07-.14-.61-1.47-.84-2.01
            -.22-.53-.45-.46-.61-.47
            -.16-.01-.34-.01-.52-.01
            -.18 0-.48.07-.73.34
            -.25.27-.95.93-.95 2.26
            0 1.33.97 2.62 1.1 2.8
            .14.18 1.91 2.92 4.63 4.09
            .65.28 1.15.45 1.55.58
            .65.21 1.24.18 1.71.11
            .52-.08 1.61-.66 1.84-1.3
            .23-.64.23-1.19.16-1.3
            -.07-.11-.25-.18-.52-.32
            z
          "
        />

        <path
          fill="currentColor"
          d="
            M16.02 3
            C8.85 3 3 8.84 3 16
            c0 2.53.74 4.99 2.14 7.1
            L3 29
            l6.08-2.01
            A12.94 12.94 0 0 0 16.02 29
            C23.18 29 29 23.16 29 16
            S23.18 3 16.02 3
            z

            M16.02 26.64
            c-2.03 0-4.01-.55-5.73-1.59
            l-.41-.25-3.61 1.2
            1.19-3.52-.27-.43
            A10.56 10.56 0 0 1 5.37 16
            c0-5.87 4.78-10.64 10.65-10.64
            S26.65 10.13 26.65 16
            21.88 26.64 16.02 26.64
            z
          "
        />

      </svg>

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
   CÓDIGO PIEMONTE
========================================================= */

function codigoPiemonte(item) {

  if (
    item &&
    typeof item.codigo === "string" &&
    item.codigo.trim()
  ) {
    return item.codigo.trim();
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
   REGIÕES DA HOME
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


      const regiaoFiltro =
        item.nome ||
        item.cidadeFiltro ||
        "";


      const destino =
        normalizarTexto(
          item.id
        ).includes("areas") ||
        normalizarTexto(
          regiaoFiltro
        ).includes("areas & oportunidades")
          ? "/areas.html"
          : "/imoveis.html";


      link.href =
        regiaoFiltro
          ? `${destino}?regiao=${encodeURIComponent(regiaoFiltro)}`
          : "/regioes.html";


      link.className =
        "regiao-home-card";


      const imagem =
        item.imagem ||
        "/assets/home-principal.jpeg";


      link.innerHTML = `

        <div class="regiao-home-img">

          <img
            src="${esc(imagem)}"
            alt="${esc(item.nome || "Piemonte Brokers")}"
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


  if (item.suites) {

    dados.push(
      `${item.suites} ${
        Number(item.suites) === 1
          ? "suíte"
          : "suítes"
      }`
    );

  } else if (item.quartos) {

    dados.push(
      `${item.quartos} ${
        Number(item.quartos) === 1
          ? "dormitório"
          : "dormitórios"
      }`
    );

  }


  if (item.areaConstruida) {

    dados.push(
      `${formatarNumero(
        item.areaConstruida
      )} m² construídos`
    );

  }


  if (item.areaTerreno) {

    dados.push(
      `${formatarNumero(
        item.areaTerreno
      )} m² de terreno`
    );

  }


  return dados.join(" • ");

}


/* =========================================================
   OPÇÕES DOS FILTROS
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
          opcao.value === valor
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

  let lista = [...PORTFOLIO];

  const pagina = paginaAtual();


  if (pagina === "imoveis") {

    lista = lista.filter(
      item =>
        normalizarTexto(
          item.categoria
        ) === "imovel"
    );

  }


  if (pagina === "areas") {

    lista = lista.filter(
      item =>
        normalizarTexto(
          item.categoria
        ) === "area"
    );

  }


  const categoria =
    $("#fCategoria");

  const negocio =
    $("#fNegocio");

  const regiao =
    $("#fCidade");

  const tipo =
    $("#fTipo");


  /* =====================================================
     CATEGORIA
     MESMO CAMPO DO ADMIN
  ===================================================== */

  if (
    categoria &&
    categoria.tagName === "SELECT"
  ) {

    categoria.innerHTML =
      '<option value="">Categoria</option>';


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
      .sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR"
          )
      )
      .forEach(
        valor =>
          adicionarOpcao(
            categoria,
            valor
          )
      );

  }


  /* =====================================================
     FINALIDADE
     MESMO CAMPO NEGÓCIO DO ADMIN
  ===================================================== */

  if (
    negocio &&
    negocio.tagName === "SELECT"
  ) {

    negocio.innerHTML =
      '<option value="">Finalidade</option>';


    [
      ...new Set(
        lista
          .map(
            item =>
              item.negocio ||
              item.finalidade
          )
          .filter(Boolean)
      )
    ]
      .sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR"
          )
      )
      .forEach(
        valor =>
          adicionarOpcao(
            negocio,
            valor
          )
      );

  }


  /* =====================================================
     REGIÃO PRINCIPAL
     NÃO MISTURA CIDADE OU CONDOMÍNIO
  ===================================================== */

  if (
    regiao &&
    regiao.tagName === "SELECT"
  ) {

    regiao.innerHTML =
      '<option value="">Região</option>';


    let regioesPrincipais = [];


    if (
      Array.isArray(REGIOES) &&
      REGIOES.length
    ) {

      regioesPrincipais =
        REGIOES
          .map(
            item =>
              item.nome ||
              item.cidadeFiltro
          )
          .filter(Boolean)
          .filter(
            valor => {

              if (
                pagina !== "imoveis"
              ) {
                return true;
              }


              return !normalizarTexto(
                valor
              ).includes(
                "areas & oportunidades"
              );

            }
          );

    }


    const regioesDoPortfolio =
      lista
        .map(
          item =>
            item.regiaoPrincipal
        )
        .filter(Boolean);


    const unicas = [];


    [
      ...regioesPrincipais,
      ...regioesDoPortfolio
    ]
      .forEach(
        valor => {

          const existe =
            unicas.some(
              item =>
                normalizarTexto(item) ===
                normalizarTexto(valor)
            );


          if (!existe) {

            unicas.push(
              valor
            );

          }

        }
      );


    unicas.forEach(
      valor =>
        adicionarOpcao(
          regiao,
          valor
        )
    );

  }


  /* =====================================================
     TIPO
  ===================================================== */

  if (
    tipo &&
    tipo.tagName === "SELECT"
  ) {

    tipo.innerHTML =
      '<option value="">Tipo</option>';


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
      .sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR"
          )
      )
      .forEach(
        valor =>
          adicionarOpcao(
            tipo,
            valor
          )
      );

  }

}


/* =========================================================
   FILTRO RECEBIDO PELA URL
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

  const negocio =
    params.get("negocio");


  let aplicouFiltro =
    false;


  /* =====================================================
     FILTRO POR REGIÃO PRINCIPAL
  ===================================================== */

  if (regiao) {

    const campoRegiao =
      $("#fCidade");


    if (
      campoRegiao &&
      campoRegiao.tagName === "SELECT"
    ) {

      const regiaoNormalizada =
        normalizarTexto(
          regiao
        );


      const opcaoRegiao =
        [...campoRegiao.options]
          .find(
            item =>
              normalizarTexto(
                item.value
              ) ===
              regiaoNormalizada
          );


      if (opcaoRegiao) {

        campoRegiao.value =
          opcaoRegiao.value;

      } else {

        adicionarOpcao(
          campoRegiao,
          regiao
        );


        campoRegiao.value =
          regiao;

      }


      aplicouFiltro =
        true;

    }

  }


  /* =====================================================
     COMPATIBILIDADE COM LINKS ANTIGOS ?cidade=
  ===================================================== */

  if (
    cidade &&
    !regiao
  ) {

    const campoRegiao =
      $("#fCidade");


    if (
      campoRegiao &&
      campoRegiao.tagName === "SELECT"
    ) {

      const cidadeNormalizada =
        normalizarTexto(
          cidade
        );


      const opcaoCidade =
        [...campoRegiao.options]
          .find(
            item =>
              normalizarTexto(
                item.value
              ) ===
              cidadeNormalizada
          );


      if (opcaoCidade) {

        campoRegiao.value =
          opcaoCidade.value;

        aplicouFiltro =
          true;

      }

    }

  }


  /* =====================================================
     FILTRO POR FINALIDADE
  ===================================================== */

  if (negocio) {

    const campoNegocio =
      $("#fNegocio");


    if (
      campoNegocio &&
      campoNegocio.tagName === "SELECT"
    ) {

      let negocioNormalizado =
        normalizarTexto(
          negocio
        );


      /*
        Aceita links como:
        ?negocio=alugar
        ?negocio=aluguel
        ?negocio=locacao
      */

      if (
        negocioNormalizado === "alugar" ||
        negocioNormalizado === "aluguel" ||
        negocioNormalizado === "locacao"
      ) {

        negocioNormalizado =
          "locacao";

      }


      const opcaoNegocio =
        [...campoNegocio.options]
          .find(
            item =>
              normalizarTexto(
                item.value
              ) ===
              negocioNormalizado
          );


      if (opcaoNegocio) {

        campoNegocio.value =
          opcaoNegocio.value;

        aplicouFiltro =
          true;

      }

    }

  }


  if (aplicouFiltro) {

    filtrar();

  }

}


/* =========================================================
   RENDER INICIAL
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


  if (
    pagina === "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) === "imovel"
      );

  }


  if (
    pagina === "areas"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) === "area"
      );

  }


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
        ? destaques.slice(
            0,
            6
          )
        : lista.slice(
            0,
            6
          );

  }


  render(lista);

}


/* =========================================================
   CARDS
========================================================= */

function render(lista) {

  const box =
    $("#cards");


  if (!box) {
    return;
  }


  box.innerHTML =
    "";


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
   ABRIR PÁGINA INDIVIDUAL
========================================================= */

function abrirPropriedade(
  item
) {

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


  const id =
    encodeURIComponent(
      item.id
    );


  window.location.href =
    `/propriedade.html?id=${id}`;

}


/* =========================================================
   COMPATIBILIDADE COM CÓDIGO ANTIGO
========================================================= */

function abrir(
  item
) {

  abrirPropriedade(
    item
  );

}


/* =========================================================
   FAIXAS DE PREÇO
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

      return (
        valor <=
        1000000
      );


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

      return (
        valor >
        10000000
      );


    case "acima-30m":

      return (
        valor >
        30000000
      );


    default:

      return true;

  }

}


/* =========================================================
   FILTRAGEM
========================================================= */

function filtrar() {

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


  if (
    pagina === "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) === "imovel"
      );

  }


  if (
    pagina === "areas"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) === "area"
      );

  }


  const categoria =
    $("#fCategoria")
      ?.value || "";


  const negocio =
    $("#fNegocio")
      ?.value || "";


  const regiao =
    $("#fCidade")
      ?.value || "";


  const tipo =
    $("#fTipo")
      ?.value || "";


  const preco =
    $("#fPreco")
      ?.value || "";


  const categoriaNormalizada =
    normalizarTexto(
      categoria
    );


  const negocioNormalizado =
    normalizarTexto(
      negocio
    );


  const regiaoNormalizada =
    normalizarTexto(
      regiao
    );


  const tipoNormalizado =
    normalizarTexto(
      tipo
    );


  lista =
    lista.filter(
      item => {

        const categoriaItem =
          normalizarTexto(
            item.categoria
          );


        const negocioItem =
          normalizarTexto(
            item.negocio ||
            item.finalidade
          );


        /*
          REGIÃO considera somente
          regiaoPrincipal do Admin.
        */

       const regiaoPrincipalItem =
  normalizarTexto(
    item.regiaoPrincipal
  );

const cidadeItem =
  normalizarTexto(
    item.cidade
  );

        return (

          (
            !categoriaNormalizada ||
            categoriaItem ===
              categoriaNormalizada
          )

          &&

          (
            !negocioNormalizado ||
            negocioItem ===
              negocioNormalizado
          )

          &&

          (
            !regiaoNormalizada ||
            regiaoItem ===
              regiaoNormalizada
          )

          &&

          (
            !tipoNormalizado ||
            tipoItem ===
              tipoNormalizado
          )

          &&

          atendeFaixaPreco(
            item,
            preco
          )

        );

      }
    );


  render(
    lista
  );

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
        evento.key ===
        "Escape"
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
   GARANTIR AVALIAÇÃO NO MENU
========================================================= */

function garantirAvaliacaoNoMenu() {

  const menu =
    $("#menu");


  if (!menu) {
    return;
  }


  const links =
    [...menu.querySelectorAll("a")];


  const jaExiste =
    links.some(
      link => {

        try {

          const url =
            new URL(
              link.href,
              window.location.origin
            );


          return (
            url.pathname === "/avaliacao.html" ||
            url.pathname === "/avaliacao"
          );

        } catch {

          return false;

        }

      }
    );


  if (jaExiste) {
    return;
  }


  const novoLink =
    document.createElement("a");


  novoLink.href =
    "/avaliacao.html";


  novoLink.textContent =
    "Avaliação";


  const linkContato =
    links.find(
      link => {

        try {

          const url =
            new URL(
              link.href,
              window.location.origin
            );


          return (
            url.pathname === "/contato.html" ||
            url.pathname === "/contato"
          );

        } catch {

          return false;

        }

      }
    );


  if (linkContato) {

    menu.insertBefore(
      novoLink,
      linkContato
    );

  } else {

    menu.appendChild(
      novoLink
    );

  }

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    garantirAvaliacaoNoMenu();

    ativarMenu();

    ativarFiltros();

    ativarModal();

    carregar();


    setTimeout(
      criarWhatsAppFlutuante,
      500
    );

  }
);

/* =========================================================
   CORREÇÃO DOS FILTROS - CATEGORIA E FINALIDADE
========================================================= */

function corrigirFiltrosPrincipais() {

  const categoria =
    document.querySelector("#fCategoria");

  const finalidade =
    document.querySelector("#fNegocio");


  /* CATEGORIA */

  if (categoria) {

    categoria.innerHTML = `
      <option value="">
        Categoria
      </option>

      <option value="Imóvel">
        Imóvel
      </option>

      <option value="Área">
        Área
      </option>
    `;

  }


  /* FINALIDADE */

  if (finalidade) {

    finalidade.innerHTML = `
      <option value="">
        Finalidade
      </option>

      <option value="Venda">
        Venda
      </option>

      <option value="Locação">
        Locação
      </option>
    `;

  }

}


/*
  Executa depois que o portfólio
  terminar de carregar.
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      corrigirFiltrosPrincipais,
      1000
    );

  }
);

/* =========================================================
   REGIÕES / CIDADES DINÂMICAS
========================================================= */

function atualizarRegioesCidades() {

  const campo =
    document.querySelector("#fCidade");

  if (!campo) return;


  campo.innerHTML = `
    <option value="">
      Regiões / Cidades
    </option>
  `;


  const locais = [];


  PORTFOLIO.forEach(
    item => {

      /*
        Região principal
      */

      if (
        item.regiaoPrincipal &&
        !locais.includes(
          item.regiaoPrincipal
        )
      ) {

        locais.push(
          item.regiaoPrincipal
        );

      }


      /*
        Cidade
      */

      if (
        item.cidade &&
        !locais.includes(
          item.cidade
        )
      ) {

        locais.push(
          item.cidade
        );

      }

    }
  );


  locais
    .sort(
      (a, b) =>
        String(a).localeCompare(
          String(b),
          "pt-BR"
        )
    )
    .forEach(
      local => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          local;

        option.textContent =
          local;

        campo.appendChild(
          option
        );

      }
    );

}


/*
  Aguarda o portfolio.json ser carregado
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      atualizarRegioesCidades,
      1200
    );

  }
);


