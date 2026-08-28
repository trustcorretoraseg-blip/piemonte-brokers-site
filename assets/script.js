let SITE = {};
let PORTFOLIO = [];

const $ = seletor => document.querySelector(seletor);
const $$ = seletor => document.querySelectorAll(seletor);

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
   DESCOBRIR PÁGINA ATUAL
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
    const siteResp = await fetch("/data/site.json", {
      cache: "no-store"
    });

    const portfolioResp = await fetch("/data/portfolio.json", {
      cache: "no-store"
    });

    if (!siteResp.ok) {
      throw new Error(
        `Erro ao carregar site.json: ${siteResp.status}`
      );
    }

    if (!portfolioResp.ok) {
      throw new Error(
        `Erro ao carregar portfolio.json: ${portfolioResp.status}`
      );
    }

    SITE = await siteResp.json();

    const dados = await portfolioResp.json();

    PORTFOLIO = Array.isArray(dados.itens)
      ? dados.itens
      : [];

    aplicarSite();
    prepararFiltros();
    aplicarFiltroDaURL();
    renderInicial();

  } catch (erro) {
    console.error("Erro ao carregar o site:", erro);

    const contador = $("#contador");

    if (contador) {
      contador.textContent =
        "Não foi possível carregar o portfólio.";
    }

    const cards = $("#cards");

    if (cards) {
      cards.innerHTML = `
        <div class="vazio">
          <h3>Erro ao carregar</h3>
          <p>
            Não foi possível carregar os imóveis neste momento.
          </p>
        </div>
      `;
    }
  }
}


/* =========================================================
   DADOS DO SITE
========================================================= */

function aplicarSite() {
  const tituloHome = $("#tituloHome");

  if (tituloHome) {
    tituloHome.textContent =
      SITE.tituloHome ||
      "Imóveis, áreas e oportunidades com visão estratégica.";
  }

  const subtituloHome = $("#subtituloHome");

  if (subtituloHome) {
    subtituloHome.textContent =
      SITE.subtituloHome ||
      "Curadoria imobiliária de alto padrão.";
  }

  const textoSobre = $("#textoSobre");

  if (textoSobre) {
    textoSobre.textContent =
      SITE.textoSobre || "";
  }

  const hero = $(".hero");

  if (hero && SITE.imagemHome) {
    hero.style.backgroundImage =
      `url("${SITE.imagemHome}")`;
  }

  montarContato();
}


/* =========================================================
   CONTATO
========================================================= */

function montarContato() {
  const contatoLinks = $("#contatoLinks");

  if (contatoLinks) {
    const links = [];

    if (SITE.whatsapp) {
      const numero =
        String(SITE.whatsapp).replace(/\D/g, "");

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

    if (SITE.email) {
      links.push(`
        <a
          class="text-link"
          href="mailto:${esc(SITE.email)}"
        >
          ${esc(SITE.email)}
        </a>
      `);
    }

    contatoLinks.innerHTML =
      links.join(" ");
  }

  $$("#footerContato").forEach(footer => {
    const itens = [];

    if (SITE.whatsapp) {
      const numero =
        String(SITE.whatsapp).replace(/\D/g, "");

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
  });
}


/* =========================================================
   FORMATAR NÚMERO
========================================================= */

function formatarNumero(valor) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
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
      `${formatarNumero(item.areaConstruida)} m² construídos`
    );
  }

  if (item.areaTerreno) {
    dados.push(
      `${formatarNumero(item.areaTerreno)} m² de terreno`
    );
  }

  return dados.join(" • ");
}


/* =========================================================
   PREPARAR FILTROS
========================================================= */

function adicionarOpcao(select, valor) {
  if (!select || !valor) {
    return;
  }

  const existe =
    [...select.options]
      .some(opcao => opcao.value === valor);

  if (existe) {
    return;
  }

  const option =
    document.createElement("option");

  option.value = valor;
  option.textContent = valor;

  select.appendChild(option);
}


function prepararFiltros() {
  let lista = [...PORTFOLIO];

  const pagina = paginaAtual();

  if (pagina === "imoveis") {
    lista = lista.filter(
      item => item.categoria === "Imóvel"
    );
  }

  if (pagina === "areas") {
    lista = lista.filter(
      item => item.categoria === "Área"
    );
  }

  const categoria = $("#fCategoria");
  const tipo = $("#fTipo");
  const cidade = $("#fCidade");

  [
    ...new Set(
      lista
        .map(item => item.categoria)
        .filter(Boolean)
    )
  ]
    .sort()
    .forEach(valor =>
      adicionarOpcao(
        categoria,
        valor
      )
    );

  [
    ...new Set(
      lista
        .map(item => item.tipo)
        .filter(Boolean)
    )
  ]
    .sort()
    .forEach(valor =>
      adicionarOpcao(
        tipo,
        valor
      )
    );

  [
    ...new Set(
      lista
        .map(item => item.cidade)
        .filter(Boolean)
    )
  ]
    .sort()
    .forEach(valor =>
      adicionarOpcao(
        cidade,
        valor
      )
    );
}


/* =========================================================
   FILTRO DA URL
========================================================= */

function aplicarFiltroDaURL() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const cidade =
    params.get("cidade");

  if (!cidade) {
    return;
  }

  const campo =
    $("#fCidade");

  if (!campo) {
    return;
  }

  const opcao =
    [...campo.options]
      .find(
        item =>
          item.value.toLowerCase() ===
          cidade.toLowerCase()
      );

  if (opcao) {
    campo.value =
      opcao.value;
  }
}


/* =========================================================
   RENDER INICIAL
========================================================= */

function renderInicial() {
  if (!$("#cards")) {
    return;
  }

  let lista =
    [...PORTFOLIO];

  const pagina =
    paginaAtual();

  if (pagina === "imoveis") {
    lista =
      lista.filter(
        item =>
          item.categoria === "Imóvel"
      );
  }

  if (pagina === "areas") {
    lista =
      lista.filter(
        item =>
          item.categoria === "Área"
      );
  }

  if (pagina === "home") {
    const destaques =
      lista.filter(
        item =>
          item.destaque === true
      );

    lista =
      destaques.length
        ? destaques.slice(0, 6)
        : lista.slice(0, 6);
  }

  render(lista);
}


/* =========================================================
   CRIAR CARDS
========================================================= */

function render(lista) {
  const box =
    $("#cards");

  if (!box) {
    return;
  }

  box.innerHTML = "";

  lista.forEach(item => {
    const card =
      document.createElement(
        "article"
      );

    card.className =
      "card";

    card.tabIndex =
      0;

    const imagem =
      item.imagemCapa ||
      "/assets/logo-piemonte.png";

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

        <div class="meta">

          ${esc(item.cidade || "")}

          ${
            item.regiao
              ? " • " +
                esc(item.regiao)
              : ""
          }

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
      () => abrir(item)
    );

    card.addEventListener(
      "keydown",
      evento => {
        if (
          evento.key === "Enter" ||
          evento.key === " "
        ) {
          evento.preventDefault();
          abrir(item);
        }
      }
    );

    box.appendChild(card);
  });


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
   FAIXAS DE PREÇO
========================================================= */

function atendeFaixaPreco(item, faixa) {
  if (!faixa) {
    return true;
  }

  const valor =
    Number(item.preco || 0);

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
   FILTRAGEM
========================================================= */

function filtrar() {
  let lista =
    [...PORTFOLIO];

  const pagina =
    paginaAtual();

  if (pagina === "imoveis") {
    lista =
      lista.filter(
        item =>
          item.categoria === "Imóvel"
      );
  }

  if (pagina === "areas") {
    lista =
      lista.filter(
        item =>
          item.categoria === "Área"
      );
  }

  const categoria =
    $("#fCategoria")?.value || "";

  const negocio =
    $("#fNegocio")?.value || "";

  const cidade =
    $("#fCidade")
      ?.value
      ?.trim()
      ?.toLowerCase() || "";

  const tipo =
    $("#fTipo")?.value || "";

  const preco =
    $("#fPreco")?.value || "";

  lista =
    lista.filter(item => {
      const local =
        `${item.cidade || ""} ${item.regiao || ""}`
          .toLowerCase();

      return (
        (!categoria ||
          item.categoria === categoria)

        &&

        (!negocio ||
          item.negocio === negocio ||
          item.finalidade === negocio)

        &&

        (!cidade ||
          local.includes(cidade))

        &&

        (!tipo ||
          item.tipo === tipo)

        &&

        atendeFaixaPreco(
          item,
          preco
        )
      );
    });

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

  [
    "#fCategoria",
    "#fNegocio",
    "#fCidade",
    "#fTipo",
    "#fPreco"
  ]
    .forEach(seletor => {
      const elemento =
        $(seletor);

      if (elemento) {
        elemento.addEventListener(
          "change",
          filtrar
        );
      }
    });
}


/* =========================================================
   MODAL
========================================================= */

function abrir(item) {
  const modal =
    $("#modal");

  if (!modal) {
    return;
  }

  const imagem =
    $("#modalImg");

  if (imagem) {
    imagem.src =
      item.imagemCapa || "";

    imagem.alt =
      item.titulo || "";
  }


  const categoria =
    $("#modalCategoria");

  if (categoria) {
    categoria.textContent =
      item.categoria || "";
  }


  const titulo =
    $("#modalTitulo");

  if (titulo) {
    titulo.textContent =
      item.titulo || "";
  }


  const local =
    $("#modalLocal");

  if (local) {
    local.textContent =
      [
        item.cidade,
        item.regiao
      ]
        .filter(Boolean)
        .join(" • ");
  }


  const descricao =
    $("#modalDescricao");

  if (descricao) {
    descricao.textContent =
      item.descricao || "";
  }


  const descricaoAntiga =
    $("#modalDesc");

  if (descricaoAntiga) {
    descricaoAntiga.textContent =
      item.descricao || "";
  }


  const preco =
    $("#modalPreco");

  if (preco) {
    preco.textContent =
      item.precoTexto ||
      "Consulte";
  }


  const specsBox =
    $("#modalSpecs");

  if (specsBox) {
    specsBox.innerHTML = "";

    const valores = [];

    if (item.suites) {
      valores.push(
        `${item.suites} suítes`
      );
    }

    if (
      item.quartos &&
      !item.suites
    ) {
      valores.push(
        `${item.quartos} dormitórios`
      );
    }

    if (item.banheiros) {
      valores.push(
        `${item.banheiros} banheiros`
      );
    }

    if (item.vagas) {
      valores.push(
        `${item.vagas} vagas`
      );
    }

    if (item.areaConstruida) {
      valores.push(
        `${formatarNumero(
          item.areaConstruida
        )} m² construídos`
      );
    }

    if (item.areaTerreno) {
      valores.push(
        `${formatarNumero(
          item.areaTerreno
        )} m² de terreno`
      );
    }

    valores.forEach(valor => {
      const span =
        document.createElement(
          "span"
        );

      span.textContent =
        valor;

      specsBox.appendChild(
        span
      );
    });
  }


  const galeria =
    $("#modalGaleria");

  if (galeria) {
    galeria.innerHTML = "";

    const fotos =
      Array.isArray(item.galeria)
        ? item.galeria
        : [];

    fotos.forEach(src => {
      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "piemonte-foto";

      const img =
        document.createElement(
          "img"
        );

      img.src = src;

      img.alt =
        item.titulo ||
        "Piemonte Brokers";

      wrapper.appendChild(img);

      galeria.appendChild(
        wrapper
      );
    });
  }


  modal.hidden = false;

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  modal.style.display =
    "block";

  document.body.style.overflow =
    "hidden";
}


function fechar() {
  const modal =
    $("#modal");

  if (!modal) {
    return;
  }

  modal.hidden = true;

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
      if (evento.key === "Escape") {
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
    .forEach(link => {
      link.addEventListener(
        "click",
        () => {
          menu.classList.remove(
            "open"
          );
        }
      );
    });
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