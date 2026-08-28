/* =========================================================
   PIEMONTE BROKERS
   SCRIPT PRINCIPAL DO SITE
   ========================================================= */

let SITE = {};
let PORTFOLIO = [];


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

const $ = seletor =>
  document.querySelector(seletor);


const $$ = seletor =>
  document.querySelectorAll(seletor);


/*
  Proteção para textos vindos do JSON.
*/

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
   CARREGAMENTO DOS ARQUIVOS JSON
========================================================= */

async function carregar() {

  try {

    const [siteResp, portfolioResp] =
      await Promise.all([

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
        )

      ]);


    /*
      Dados institucionais
    */

    if (siteResp.ok) {

      SITE =
        await siteResp.json();

    }


    /*
      Imóveis e áreas
    */

    if (portfolioResp.ok) {

      const dados =
        await portfolioResp.json();

      PORTFOLIO =
        Array.isArray(dados.itens)
          ? dados.itens
          : [];

    }


    aplicarSite();

    prepararFiltros();

    aplicarFiltroDaURL();

    renderInicial();


  } catch (erro) {

    console.error(
      "Erro ao carregar o site:",
      erro
    );


    const cards =
      $("#cards");


    if (cards) {

      cards.innerHTML = `
        <div class="vazio">
          <h3>
            Não foi possível carregar o portfólio
          </h3>

          <p>
            Tente novamente em alguns instantes.
          </p>
        </div>
      `;

    }

  }

}


/* =========================================================
   DADOS GERAIS DO SITE
========================================================= */

function aplicarSite() {

  /*
    Nome da empresa
  */

  if (SITE.nome) {

    const tituloAtual =
      document.title;


    if (
      tituloAtual === "Piemonte Brokers" ||
      !tituloAtual
    ) {

      document.title =
        SITE.nome;

    }

  }


  /*
    Título da Home
  */

  const tituloHome =
    $("#tituloHome");


  if (tituloHome) {

    tituloHome.textContent =
      SITE.tituloHome ||
      "Imóveis, áreas e oportunidades com visão estratégica.";

  }


  /*
    Subtítulo
  */

  const subtituloHome =
    $("#subtituloHome");


  if (subtituloHome) {

    subtituloHome.textContent =
      SITE.subtituloHome ||
      "Curadoria imobiliária de alto padrão para compradores, proprietários, investidores e parceiros.";

  }


  /*
    Sobre
  */

  const textoSobre =
    $("#textoSobre");


  if (textoSobre) {

    textoSobre.textContent =
      SITE.textoSobre || "";

  }


  /*
    Imagem principal da Home
  */

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


    /*
      WhatsApp
    */

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


    /*
      E-mail
    */

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


  /*
    Rodapé
  */

  $$("#footerContato")
    .forEach(footer => {

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
          <a
            href="mailto:${esc(SITE.email)}"
          >
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
   QUAL PÁGINA ESTAMOS?
========================================================= */

function paginaAtual() {

  const caminho =
    window.location.pathname
      .toLowerCase();


  if (
    caminho.includes("areas.html")
  ) {

    return "areas";

  }


  if (
    caminho.includes("imoveis.html")
  ) {

    return "imoveis";

  }


  if (
    caminho === "/" ||
    caminho.endsWith("index.html")
  ) {

    return "home";

  }


  return "outra";

}


/* =========================================================
   FILTROS
========================================================= */

function adicionarOpcao(
  select,
  valor,
  texto
) {

  if (
    !select ||
    !valor
  ) {

    return;

  }


  const existe =
    [...select.options]
      .some(
        opcao =>
          opcao.value === valor
      );


  if (existe) {

    return;

  }


  const option =
    document.createElement("option");


  option.value =
    valor;


  option.textContent =
    texto || valor;


  select.appendChild(option);

}


/* =========================================================
   PREPARAR FILTROS
========================================================= */

function prepararFiltros() {

  const pagina =
    paginaAtual();


  let lista =
    [...PORTFOLIO];


  /*
    Mostra apenas os dados relevantes
    para cada página.
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
    CATEGORIA
  */

  const categoria =
    $("#fCategoria");


  if (categoria) {

    const categorias =
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
        .sort();


    categorias.forEach(
      valor =>
        adicionarOpcao(
          categoria,
          valor
        )
    );

  }


  /*
    TIPO
  */

  const tipo =
    $("#fTipo");


  if (tipo) {

    const tipos =
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
        .sort();


    tipos.forEach(
      valor =>
        adicionarOpcao(
          tipo,
          valor
        )
    );

  }


  /*
    CIDADE / REGIÃO
  */

  const cidade =
    $("#fCidade");


  if (cidade) {

    const locais =
      [
        ...new Set(

          lista
            .map(
              item =>
                item.cidade ||
                item.regiao
            )
            .filter(Boolean)

        )
      ]
        .sort();


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
   FILTRO RECEBIDO PELA URL
========================================================= */

function aplicarFiltroDaURL() {

  const parametros =
    new URLSearchParams(
      window.location.search
    );


  const cidade =
    parametros.get("cidade");


  if (!cidade) {

    return;

  }


  const campo =
    $("#fCidade");


  if (!campo) {

    return;

  }


  /*
    Procura uma opção correspondente.
  */

  const opcao =
    [...campo.options]
      .find(
        item =>
          item.value
            .toLowerCase() ===
          cidade.toLowerCase()
      );


  if (opcao) {

    campo.value =
      opcao.value;

  }

}


/* =========================================================
   ESPECIFICAÇÕES DO IMÓVEL
========================================================= */

function specs(item) {

  const dados = [];


  /*
    Quartos / suítes
  */

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


  /*
    Área construída
  */

  if (item.areaConstruida) {

    dados.push(
      `${formatarNumero(
        item.areaConstruida
      )} m² construídos`
    );

  }


  /*
    Área do terreno
  */

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
   LISTA INICIAL
========================================================= */

function renderInicial() {

  if (!$("#cards")) {

    return;

  }


  let lista =
    [...PORTFOLIO];


  const pagina =
    paginaAtual();


  /*
    Página de imóveis
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
    Página de áreas
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
    Filtro vindo de regiões
  */

  const cidade =
    $("#fCidade")
      ?.value
      ?.trim()
      ?.toLowerCase();


  if (cidade) {

    lista =
      lista.filter(
        item => {

          const local =
            `${
              item.cidade || ""
            } ${
              item.regiao || ""
            }`
              .toLowerCase();


          return local.includes(
            cidade
          );

        }
      );

  }


  /*
    Na Home mostramos no máximo
    seis destaques.
  */

  if (
    pagina === "home"
  ) {

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
   CRIAÇÃO DOS CARDS
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


    /*
      Foto de capa
    */

    const imagem =
      item.imagemCapa ||
      "/assets/logo-piemonte.png";


    /*
      IMPORTANTE:

      A classe card-img recebe a
      marca d'água pelo style.css.

      Assim TODA FOTO cadastrada
      futuramente pelo painel
      receberá automaticamente
      a logo Piemonte.
    */

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

          ${esc(
            item.cidade || ""
          )}

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


    /*
      Abrir detalhes
    */

    card.addEventListener(
      "click",
      () =>
        abrir(item)
    );


    /*
      Acessibilidade via teclado
    */

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


    box.appendChild(
      card
    );

  });


  /*
    Contador
  */

  const contador =
    $("#contador");


  if (contador) {

    const palavra =
      lista.length === 1
        ? "oportunidade"
        : "oportunidades";


    contador.textContent =
      `${lista.length} ${palavra}`;

  }


  /*
    Nenhum resultado
  */

  const vazio =
    $("#vazio");


  if (vazio) {

    const semResultados =
      lista.length === 0;


    /*
      Compatibilidade com os dois
      modelos de HTML.
    */

    vazio.hidden =
      !semResultados;


    vazio.style.display =
      semResultados
        ? ""
        : "none";

  }

}


/* =========================================================
   FAIXA DE PREÇO
========================================================= */

function atendeFaixaPreco(
  item,
  faixa
) {

  /*
    Sem filtro
  */

  if (!faixa) {

    return true;

  }


  const valor =
    Number(
      item.preco || 0
    );


  /*
    Se o imóvel não tiver
    valor numérico cadastrado,
    não mostramos em filtros
    específicos de preço.
  */

  if (
    !valor ||
    Number.isNaN(valor)
  ) {

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

      /*
        Compatibilidade caso exista
        algum filtro antigo com valor
        numérico.
      */

      const limite =
        Number(faixa);


      if (
        !Number.isNaN(limite) &&
        limite > 0
      ) {

        return valor <= limite;

      }


      return true;

  }

}


/* =========================================================
   FILTRAR PORTFÓLIO
========================================================= */

function filtrar() {

  let lista =
    [...PORTFOLIO];


  const pagina =
    paginaAtual();


  /*
    Limita pela página
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


  const cidade =
    $("#fCidade")
      ?.value
      ?.trim()
      ?.toLowerCase() || "";


  const tipo =
    $("#fTipo")
      ?.value || "";


  const preco =
    $("#fPreco")
      ?.value || "";


  lista =
    lista.filter(
      item => {

        const local =
          `${
            item.cidade || ""
          } ${
            item.regiao || ""
          }`
            .toLowerCase();


        return (

          (
            !categoria ||
            item.categoria === categoria
          )

          &&

          (
            !negocio ||
            item.negocio === negocio ||
            item.finalidade === negocio
          )

          &&

          (
            !cidade ||
            local.includes(cidade)
          )

          &&

          (
            !tipo ||
            item.tipo === tipo
          )

          &&

          atendeFaixaPreco(
            item,
            preco
          )

        );

      }
    );


  render(lista);

}


/* =========================================================
   ATIVAR FILTROS
========================================================= */

function ativarFiltros() {

  /*
    Funciona tanto se #filtros for
    um FORM quanto se for uma DIV.
  */

  const filtros =
    $("#filtros");


  if (!filtros) {

    return;

  }


  /*
    Se for formulário
  */

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


  /*
    Todos os selects atualizam
    automaticamente.
  */

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


        if (!elemento) {

          return;

        }


        elemento.addEventListener(
          "change",
          filtrar
        );

      }
    );

}


/* =========================================================
   MODAL - ABRIR
========================================================= */

function abrir(item) {

  const modal =
    $("#modal");


  if (!modal) {

    return;

  }


  /*
    FOTO PRINCIPAL
  */

  const modalImg =
    $("#modalImg");


  if (modalImg) {

    modalImg.src =
      item.imagemCapa || "";


    modalImg.alt =
      item.titulo || "";

  }


  /*
    CATEGORIA
    Novo HTML
  */

  const modalCategoria =
    $("#modalCategoria");


  if (modalCategoria) {

    modalCategoria.textContent =
      item.categoria || "";

  }


  /*
    META
    HTML antigo
  */

  const modalMeta =
    $("#modalMeta");


  if (modalMeta) {

    modalMeta.textContent =
      [
        item.categoria,
        item.cidade,
        item.negocio ||
        item.finalidade
      ]
        .filter(Boolean)
        .join(" • ");

  }


  /*
    TÍTULO
  */

  const modalTitulo =
    $("#modalTitulo");


  if (modalTitulo) {

    modalTitulo.textContent =
      item.titulo || "";

  }


  /*
    LOCALIZAÇÃO
    Novo HTML
  */

  const modalLocal =
    $("#modalLocal");


  if (modalLocal) {

    modalLocal.textContent =
      [
        item.cidade,
        item.regiao
      ]
        .filter(Boolean)
        .join(" • ");

  }


  /*
    DESCRIÇÃO
    Compatibilidade com ambos
    os modelos.
  */

  const modalDescricao =
    $("#modalDescricao");


  if (modalDescricao) {

    modalDescricao.textContent =
      item.descricao || "";

  }


  const modalDesc =
    $("#modalDesc");


  if (modalDesc) {

    modalDesc.textContent =
      item.descricao || "";

  }


  /*
    PREÇO
  */

  const modalPreco =
    $("#modalPreco");


  if (modalPreco) {

    modalPreco.textContent =
      item.precoTexto ||
      "Consulte";

  }


  /*
    CARACTERÍSTICAS
  */

  const modalSpecs =
    $("#modalSpecs");


  if (modalSpecs) {

    modalSpecs.innerHTML =
      "";


    const valores = [];


    if (item.suites) {

      valores.push(
        `${item.suites} ${
          Number(item.suites) === 1
            ? "suíte"
            : "suítes"
        }`
      );

    }


    /*
      Só mostra dormitórios
      separadamente quando for útil.
    */

    if (
      item.quartos &&
      !item.suites
    ) {

      valores.push(
        `${item.quartos} ${
          Number(item.quartos) === 1
            ? "dormitório"
            : "dormitórios"
        }`
      );

    }


    if (item.banheiros) {

      valores.push(
        `${item.banheiros} ${
          Number(item.banheiros) === 1
            ? "banheiro"
            : "banheiros"
        }`
      );

    }


    if (item.vagas) {

      valores.push(
        `${item.vagas} ${
          Number(item.vagas) === 1
            ? "vaga"
            : "vagas"
        }`
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


    valores.forEach(
      valor => {

        const span =
          document.createElement(
            "span"
          );


        span.textContent =
          valor;


        modalSpecs.appendChild(
          span
        );

      }
    );

  }


  /*
    GALERIA

    Cada foto recebe um wrapper
    "piemonte-foto".

    Esse wrapper é exatamente
    o que aplica a marca d'água
    centralizada pelo CSS.
  */

  const modalGaleria =
    $("#modalGaleria");


  if (modalGaleria) {

    modalGaleria.innerHTML =
      "";


    const fotos =
      Array.isArray(item.galeria)
        ? item.galeria
        : [];


    fotos.forEach(
      origem => {

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


        img.src =
          origem;


        img.alt =
          item.titulo ||
          "Piemonte Brokers";


        img.loading =
          "lazy";


        wrapper.appendChild(
          img
        );


        modalGaleria.appendChild(
          wrapper
        );

      }
    );

  }


  /*
    EXIBIR MODAL

    Compatibilidade com HTML antigo
    e com os novos arquivos.
  */

  modal.hidden =
    false;


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  modal.style.display =
    "block";


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   MODAL - FECHAR
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

  /*
    Botão do HTML antigo
  */

  const fecharAntigo =
    $("#fecharModal");


  if (fecharAntigo) {

    fecharAntigo.addEventListener(
      "click",
      fechar
    );

  }


  /*
    Botão dos novos arquivos
  */

  const fecharNovo =
    $("#modalClose");


  if (fecharNovo) {

    fecharNovo.addEventListener(
      "click",
      fechar
    );

  }


  /*
    Overlay novo
  */

  const overlay =
    $(".modal-overlay");


  if (overlay) {

    overlay.addEventListener(
      "click",
      fechar
    );

  }


  /*
    Clique fora no modelo antigo
  */

  const modal =
    $("#modal");


  if (modal) {

    modal.addEventListener(
      "click",
      evento => {

        if (
          evento.target === modal
        ) {

          fechar();

        }

      }
    );

  }


  /*
    Tecla ESC
  */

  document.addEventListener(
    "keydown",
    evento => {

      if (
        evento.key === "Escape"
      ) {

        const atual =
          $("#modal");


        if (atual) {

          fechar();

        }

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


  /*
    Algumas páginas novas ainda
    não possuem botão mobile.

    Portanto simplesmente seguimos
    sem gerar erro.
  */

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
   PROTEÇÃO DE ERRO DE IMAGENS
========================================================= */

function ativarFallbackImagens() {

  document.addEventListener(
    "error",
    evento => {

      const elemento =
        evento.target;


      if (
        elemento.tagName !== "IMG"
      ) {

        return;

      }


      /*
        Evita looping caso até a logo
        esteja indisponível.
      */

      if (
        elemento.dataset.fallback ===
        "true"
      ) {

        return;

      }


      elemento.dataset.fallback =
        "true";


      elemento.src =
        "/assets/logo-piemonte.png";

    },
    true
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

    ativarFallbackImagens();

    carregar();

  }
);