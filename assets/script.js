let SITE = {};
let PORTFOLIO = [];
let REGIOES = [];
let GRUPO_REGIAO_ATIVO = "";

const ITENS_POR_PAGINA = 9;

let PAGINA_ATUAL_PORTFOLIO = 1;
let ULTIMA_LISTA_PORTFOLIO = [];


/* =========================================================
   SELETORES
========================================================= */

const $ = seletor =>
  document.querySelector(seletor);

const $$ = seletor =>
  document.querySelectorAll(seletor);


/* =========================================================
   SEGURANÇA
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
   NORMALIZAÇÃO
========================================================= */

function normalizarTexto(valor) {

  return String(valor || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


function normalizarLocal(valor) {

  return normalizarTexto(valor)
    .replace(
      /^(?:condomin\S*|cond\.|bairro)\s+/,
      ""
    )
    .replace(
      /\s+/g,
      " "
    );
}


/* =========================================================
   PREÇOS
========================================================= */

function numeroPreco(valor) {

  if (
    typeof valor === "number"
  ) {

    return (
      Number.isFinite(valor) &&
      valor > 0
    )
      ? valor
      : 0;
  }


  let texto =
    String(valor ?? "").trim();


  if (
    !texto ||
    /consulte|sob consulta|a combinar/i
      .test(texto)
  ) {

    return 0;
  }


  texto =
    texto.replace(
      /[^\d.,]/g,
      ""
    );


  if (!texto) {
    return 0;
  }


  const ultimoPonto =
    texto.lastIndexOf(".");


  const ultimaVirgula =
    texto.lastIndexOf(",");


  const separador =
    Math.max(
      ultimoPonto,
      ultimaVirgula
    );


  if (
    separador >= 0 &&
    texto.length -
      separador -
      1 <= 2
  ) {

    texto =
      texto
        .slice(0, separador)
        .replace(
          /[.,]/g,
          ""
        ) +
      "." +
      texto.slice(
        separador + 1
      );

  } else {

    texto =
      texto.replace(
        /[.,]/g,
        ""
      );
  }


  const numero =
    Number(texto);


  return (
    Number.isFinite(numero) &&
    numero > 0
  )
    ? numero
    : 0;
}


function modalidades(item) {

  const negocio =
    normalizarTexto(
      item.negocio ||
      item.finalidade
    );


  if (
    negocio.includes("venda") &&
    (
      negocio.includes("loca") ||
      negocio.includes("alug")
    )
  ) {

    return [
      "Venda",
      "Locação"
    ];
  }


  if (
    negocio.includes("loca") ||
    negocio.includes("alug")
  ) {

    return [
      "Locação"
    ];
  }


  if (
    negocio.includes("venda")
  ) {

    return [
      "Venda"
    ];
  }


  if (
    numeroPreco(
      item.precoVenda ||
      item.precoVendaTexto
    ) &&
    numeroPreco(
      item.precoLocacaoTexto ||
      item.precoLocacao
    )
  ) {

    return [
      "Venda",
      "Locação"
    ];
  }


  return [
    "Venda"
  ];
}


function precoModalidade(
  item,
  modalidade
) {

  const venda =
    modalidade === "Venda";


  const novo =
    numeroPreco(
      venda
        ? (
            item.precoVenda ||
            item.precoVendaTexto
          )
        : (
            item.precoLocacaoTexto ||
            item.precoLocacao
          )
    );


  if (novo) {
    return novo;
  }


  return (
    modalidades(item).length === 1 &&
    modalidades(item)[0] === modalidade
  )
    ? numeroPreco(
        item.preco ||
        item.precoTexto
      )
    : 0;
}


function textoPreco(item) {

  const formatar =
    (
      tipo,
      numero,
      texto
    ) => {

      if (numero) {

        return `${
          tipo
        }: ${
          numero.toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 2
            }
          )
        }${
          tipo === "Locação"
            ? "/mês"
            : ""
        }`;
      }


      return (
        texto &&
        /consulte/i.test(texto)
      )
        ? `${tipo}: Consulte`
        : "";
    };


  const modos =
    modalidades(item);


  if (
    modos.length === 1 &&
    !item.precoVenda &&
    !item.precoLocacao &&
    !item.precoVendaTexto &&
    !item.precoLocacaoTexto
  ) {

    return (
      item.precoTexto ||
      (
        precoModalidade(
          item,
          modos[0]
        )
          ? formatar(
              modos[0],
              precoModalidade(
                item,
                modos[0]
              ),
              ""
            )
              .replace(
                `${modos[0]}: `,
                ""
              )
          : "Consulte"
      )
    );
  }


  const linhas =
    modos
      .map(
        tipo =>
          formatar(
            tipo,
            precoModalidade(
              item,
              tipo
            ),
            tipo === "Venda"
              ? item.precoVendaTexto
              : item.precoLocacaoTexto
          )
      )
      .filter(Boolean);


  return (
    linhas.join(" • ") ||
    item.precoTexto ||
    "Consulte"
  );
}


function htmlPrecoCard(item) {

  const texto =
    textoPreco(item);


  const linhas =
    modalidades(item).length > 1
      ? texto.split(" • ")
      : [texto];


  return linhas
    .map(
      linha =>
        `<span class="price-line">${esc(linha)}</span>`
    )
    .join("");
}


/* =========================================================
   LOCAL DO CADASTRO
========================================================= */

function localDoCadastro(item) {

  const regiao =
    String(
      item.regiao || ""
    ).trim();


  const normalizada =
    normalizarTexto(regiao);


  const condominio =
    /^(?:condomin\S*|cond\.)\s+/i
      .test(normalizada);


  const bairro =
    /^bairro\s+/i
      .test(normalizada);


  if (
    condominio ||
    bairro
  ) {

    const nome =
      regiao
        .replace(
          /^\S+\s+/,
          ""
        )
        .trim();


    return {
      tipo:
        condominio
          ? "condominio"
          : "bairro",

      nome
    };
  }


  return {
    tipo: "",
    nome: regiao
  };
}


function condominioImovel(item) {

  const local =
    localDoCadastro(item);


  if (
    local.tipo ===
    "condominio"
  ) {

    return local.nome;
  }


  if (
    local.tipo ===
    "bairro"
  ) {

    return "";
  }


  return String(
    item.condominio || ""
  ).trim();
}


function bairroImovel(item) {

  const local =
    localDoCadastro(item);


  if (
    local.tipo ===
    "bairro"
  ) {

    return local.nome;
  }


  if (
    local.tipo ===
    "condominio"
  ) {

    return "";
  }


  const bairro =
    String(
      item.bairro || ""
    ).trim();


  if (
    /^(?:condomin\S*|cond\.)\s+/i
      .test(
        normalizarTexto(
          bairro
        )
      )
  ) {

    return "";
  }


  return bairro;
}


/* =========================================================
   PÁGINA ATUAL
========================================================= */

function paginaAtual() {

  const caminho =
    window.location.pathname
      .toLowerCase()
      .replace(
        /\/+$/,
        ""
      );


  if (
    caminho.endsWith(
      "/imoveis"
    ) ||
    caminho.endsWith(
      "/imoveis.html"
    )
  ) {

    return "imoveis";
  }


  if (
    caminho.endsWith(
      "/areas"
    ) ||
    caminho.endsWith(
      "/areas.html"
    )
  ) {

    return "areas";
  }


  if (
    caminho === "" ||
    caminho === "/" ||
    caminho.endsWith(
      "/index"
    ) ||
    caminho.endsWith(
      "/index.html"
    )
  ) {

    return "home";
  }


  return "outra";
}


/* =========================================================
   DISPONIBILIDADE
========================================================= */

function estaDisponivel(item) {

  return ![
    "vendido",
    "indisponivel"
  ].includes(
    normalizarTexto(
      item.status
    )
  );
}


/* =========================================================
   OPÇÕES ÚNICAS
========================================================= */

function opcoesUnicas(
  campo,
  valores,
  titulo,
  chave = normalizarTexto
) {

  if (
    !campo ||
    campo.tagName !==
      "SELECT"
  ) {

    return;
  }


  const selecionado =
    campo.value;


  const mapa =
    new Map();


  valores.forEach(
    valor => {

      const exibicao =
        String(
          valor || ""
        )
          .trim()
          .replace(
            /\s+/g,
            " "
          );


      const id =
        chave(exibicao);


      if (
        id &&
        !mapa.has(id)
      ) {

        mapa.set(
          id,
          exibicao
        );
      }
    }
  );


  campo.innerHTML =
    "";


  campo.add(
    new Option(
      titulo,
      ""
    )
  );


  [
    ...mapa.values()
  ]
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
    )
    .forEach(
      valor => {

        campo.add(
          new Option(
            valor,
            valor
          )
        );
      }
    );


  const atual =
    [
      ...campo.options
    ]
      .find(
        opcao =>
          chave(
            opcao.value
          ) ===
          chave(
            selecionado
          )
      );


  if (atual) {

    campo.value =
      atual.value;
  }


  atualizarDropdownPesquisavel(
    campo
  );
}


/* =========================================================
   CONDOMÍNIOS POR CIDADE
========================================================= */

function atualizarCondominiosPorCidade() {

  const campo =
    $("#fCondominio");


  if (
    !campo ||
    campo.tagName !==
      "SELECT"
  ) {

    return;
  }


  const cidade =
    normalizarTexto(
      $("#fCidadeMunicipio")
        ?.value || ""
    );


  const pagina =
    paginaAtual();


  const lista =
    PORTFOLIO.filter(
      item => {

        if (
          !estaDisponivel(item)
        ) {

          return false;
        }


        if (
          pagina === "imoveis" &&
          normalizarTexto(
            item.categoria
          ) !== "imovel"
        ) {

          return false;
        }


        if (
          pagina === "areas" &&
          normalizarTexto(
            item.categoria
          ) !== "area"
        ) {

          return false;
        }


        return (
          !cidade ||
          normalizarTexto(
            item.cidade
          ) === cidade
        );
      }
    );


  opcoesUnicas(
    campo,
    lista.map(
      condominioImovel
    ),
    "Todos os condomínios",
    normalizarLocal
  );


  opcoesUnicas(
    $("#fBairro"),
    lista.map(
      bairroImovel
    ),
    "Todos os bairros"
  );
}


/* =========================================================
   CONDOMÍNIOS / BAIRROS PESQUISÁVEIS
========================================================= */

function atualizarDropdownPesquisavel(
  campo
) {

  if (!campo) {
    return;
  }


  const wrapper =
    campo.closest(
      ".filtro-pesquisavel"
    );


  if (!wrapper) {
    return;
  }


  const detalhes =
    wrapper.querySelector(
      "details"
    );


  const resumo =
    wrapper.querySelector(
      "summary"
    );


  const pesquisa =
    wrapper.querySelector(
      'input[type="search"]'
    );


  const resultados =
    wrapper.querySelector(
      ".filtro-resultados"
    );


  if (
    !detalhes ||
    !resumo ||
    !pesquisa ||
    !resultados
  ) {

    return;
  }


  /*
    Na barra premium queremos manter
    Condomínios/Bairros quando nada
    tiver sido selecionado.
  */

  if (campo.value) {

    resumo.textContent =
      campo
        .selectedOptions[0]
        ?.textContent ||
      "Selecionar";

  } else {

    resumo.textContent =
      campo.id === "fCondominio"
        ? "Condomínios"
        : campo.id === "fBairro"
          ? "Bairros"
          : (
              campo.options[0]
                ?.textContent ||
              "Selecionar"
            );
  }


  const termo =
    normalizarTexto(
      pesquisa.value
    );


  resultados.replaceChildren();


  let quantidade = 0;


  [
    ...campo.options
  ]
    .forEach(
      opcao => {

        /*
          Não mostramos a opção
          "Todos os..." no menu premium.
        */

        if (!opcao.value) {
          return;
        }


        if (
          termo &&
          !normalizarTexto(
            opcao.textContent
          ).includes(
            termo
          )
        ) {

          return;
        }


        const botao =
          document.createElement(
            "button"
          );


        botao.type =
          "button";


        botao.className =
          "filtro-opcao";


        botao.textContent =
          opcao.textContent;


        botao.setAttribute(
          "aria-pressed",
          String(
            campo.value ===
            opcao.value
          )
        );


        botao.addEventListener(
          "click",
          () => {

            campo.value =
              opcao.value;


            detalhes.open =
              false;


            pesquisa.value =
              "";


            campo.dispatchEvent(
              new Event(
                "change",
                {
                  bubbles: true
                }
              )
            );


            atualizarDropdownPesquisavel(
              campo
            );
          }
        );


        resultados.append(
          botao
        );


        quantidade++;
      }
    );


  if (!quantidade) {

    const vazio =
      document.createElement(
        "p"
      );


    vazio.className =
      "filtro-sem-resultado";


    vazio.textContent =
      "Nenhuma opção encontrada";


    resultados.append(
      vazio
    );
  }
}


function ativarDropdownsPesquisaveis() {

  document
    .querySelectorAll(
      ".filtro-pesquisavel"
    )
    .forEach(
      wrapper => {

        const campo =
          wrapper.querySelector(
            "select"
          );


        const detalhes =
          wrapper.querySelector(
            "details"
          );


        const pesquisa =
          wrapper.querySelector(
            'input[type="search"]'
          );


        if (
          !campo ||
          !detalhes ||
          !pesquisa
        ) {

          return;
        }


        pesquisa.addEventListener(
          "input",
          () =>
            atualizarDropdownPesquisavel(
              campo
            )
        );


        pesquisa.addEventListener(
          "keydown",
          evento => {

            if (
              evento.key ===
              "Escape"
            ) {

              detalhes.open =
                false;


              detalhes
                .querySelector(
                  "summary"
                )
                ?.focus();
            }


            if (
              evento.key ===
              "Enter"
            ) {

              evento.preventDefault();


              wrapper
                .querySelector(
                  ".filtro-resultados button"
                )
                ?.click();
            }
          }
        );


        detalhes.addEventListener(
          "toggle",
          () => {

            if (
              detalhes.open
            ) {

              document
                .querySelectorAll(
                  ".filtro-dropdown"
                )
                .forEach(
                  outro => {

                    if (
                      outro !==
                      detalhes
                    ) {

                      outro.open =
                        false;
                    }
                  }
                );


              pesquisa.focus();


              atualizarDropdownPesquisavel(
                campo
              );

            } else {

              pesquisa.value =
                "";


              atualizarDropdownPesquisavel(
                campo
              );
            }
          }
        );


        campo.addEventListener(
          "change",
          () =>
            atualizarDropdownPesquisavel(
              campo
            )
        );


        atualizarDropdownPesquisavel(
          campo
        );
      }
    );


  document.addEventListener(
    "click",
    evento => {

      document
        .querySelectorAll(
          ".filtro-dropdown[open]"
        )
        .forEach(
          detalhes => {

            if (
              !detalhes.contains(
                evento.target
              )
            ) {

              detalhes.open =
                false;
            }
          }
        );
    }
  );
}


/* =========================================================
   REGIÃO OU CIDADE — NOVA BARRA
========================================================= */

function atualizarResumoLocalizacao() {

  const detalhes =
    $("#localizacaoDropdown");


  const resumo =
    detalhes
      ?.querySelector(
        "summary"
      );


  if (!resumo) {
    return;
  }


  const regiao =
    $("#fCidade")
      ?.value || "";


  const cidade =
    $("#fCidadeMunicipio")
      ?.value || "";


  resumo.textContent =
    cidade ||
    regiao ||
    "Região ou cidade";
}


function criarBotaoLocalizacao(
  texto,
  tipo
) {

  const botao =
    document.createElement(
      "button"
    );


  botao.type =
    "button";


  botao.className =
    "filtro-opcao";


  botao.textContent =
    texto;


  const selecionado =
    tipo === "regiao"
      ? $("#fCidade")?.value
      : $("#fCidadeMunicipio")
          ?.value;


  botao.setAttribute(
    "aria-pressed",
    String(
      normalizarTexto(
        selecionado
      ) ===
      normalizarTexto(
        texto
      )
    )
  );


  botao.addEventListener(
    "click",
    () => {

      const campoRegiao =
        $("#fCidade");


      const campoCidade =
        $("#fCidadeMunicipio");


      if (
        tipo === "regiao" &&
        campoRegiao
      ) {

        campoRegiao.value =
          texto;


        if (campoCidade) {

          campoCidade.value =
            "";
        }


        GRUPO_REGIAO_ATIVO =
          "";


        campoRegiao.dispatchEvent(
          new Event(
            "change",
            {
              bubbles: true
            }
          )
        );
      }


      if (
        tipo === "cidade" &&
        campoCidade
      ) {

        campoCidade.value =
          texto;


        if (campoRegiao) {

          campoRegiao.value =
            "";
        }


        GRUPO_REGIAO_ATIVO =
          "";


        campoCidade.dispatchEvent(
          new Event(
            "change",
            {
              bubbles: true
            }
          )
        );
      }


      const detalhes =
        $("#localizacaoDropdown");


      if (detalhes) {

        detalhes.open =
          false;
      }


      const busca =
        $("#localizacaoBusca");


      if (busca) {

        busca.value =
          "";
      }


      atualizarResumoLocalizacao();

      atualizarDropdownLocalizacao();
    }
  );


  return botao;
}


function atualizarDropdownLocalizacao() {

  const regioesBox =
    $("#fRegiaoResultados");


  const cidadesBox =
    $("#fCidadeResultados");


  if (
    !regioesBox ||
    !cidadesBox
  ) {

    return;
  }


  const campoRegiao =
    $("#fCidade");


  const campoCidade =
    $("#fCidadeMunicipio");


  const regioes =
    campoRegiao
      ? [
          ...campoRegiao.options
        ]
          .map(
            opcao =>
              opcao.value
          )
          .filter(Boolean)
      : [];


  const cidades =
    campoCidade
      ? [
          ...campoCidade.options
        ]
          .map(
            opcao =>
              opcao.value
          )
          .filter(Boolean)
      : [];


  const termo =
    normalizarTexto(
      $("#localizacaoBusca")
        ?.value || ""
    );


  regioesBox.replaceChildren();

  cidadesBox.replaceChildren();


  let totalRegioes = 0;


  regioes.forEach(
    valor => {

      if (
        termo &&
        !normalizarTexto(
          valor
        ).includes(
          termo
        )
      ) {

        return;
      }


      regioesBox.appendChild(
        criarBotaoLocalizacao(
          valor,
          "regiao"
        )
      );


      totalRegioes++;
    }
  );


  if (!totalRegioes) {

    const vazio =
      document.createElement(
        "p"
      );


    vazio.className =
      "filtro-sem-resultado";


    vazio.textContent =
      "Nenhuma região encontrada";


    regioesBox.appendChild(
      vazio
    );
  }


  let totalCidades = 0;


  cidades.forEach(
    valor => {

      if (
        termo &&
        !normalizarTexto(
          valor
        ).includes(
          termo
        )
      ) {

        return;
      }


      cidadesBox.appendChild(
        criarBotaoLocalizacao(
          valor,
          "cidade"
        )
      );


      totalCidades++;
    }
  );


  if (!totalCidades) {

    const vazio =
      document.createElement(
        "p"
      );


    vazio.className =
      "filtro-sem-resultado";


    vazio.textContent =
      "Nenhuma cidade encontrada";


    cidadesBox.appendChild(
      vazio
    );
  }


  atualizarResumoLocalizacao();
}


function ativarDropdownLocalizacao() {

  const detalhes =
    $("#localizacaoDropdown");


  const busca =
    $("#localizacaoBusca");


  if (
    !detalhes ||
    !busca
  ) {

    return;
  }


  busca.addEventListener(
    "input",
    atualizarDropdownLocalizacao
  );


  busca.addEventListener(
    "keydown",
    evento => {

      if (
        evento.key ===
        "Escape"
      ) {

        detalhes.open =
          false;


        detalhes
          .querySelector(
            "summary"
          )
          ?.focus();
      }


      if (
        evento.key ===
        "Enter"
      ) {

        evento.preventDefault();


        detalhes
          .querySelector(
            ".filtro-opcao"
          )
          ?.click();
      }
    }
  );


  detalhes.addEventListener(
    "toggle",
    () => {

      if (
        detalhes.open
      ) {

        document
          .querySelectorAll(
            ".filtro-dropdown"
          )
          .forEach(
            outro => {

              if (
                outro !==
                detalhes
              ) {

                outro.open =
                  false;
              }
            }
          );


        atualizarDropdownLocalizacao();


        setTimeout(
          () =>
            busca.focus(),
          0
        );

      } else {

        busca.value =
          "";


        atualizarDropdownLocalizacao();
      }
    }
  );


  atualizarDropdownLocalizacao();
}


/* =========================================================
   CARREGAR DADOS
========================================================= */

async function carregar() {

  try {

    const [
      siteResp,
      portfolioResp,
      regioesResp
    ] =
      await Promise.all([

        fetch(
          "/data/site.json",
          {
            cache:
              "no-store"
          }
        ),

        fetch(
          "/data/portfolio.json",
          {
            cache:
              "no-store"
          }
        ),

        fetch(
          "/data/regioes.json",
          {
            cache:
              "no-store"
          }
        )

      ]);


    if (
      siteResp.ok
    ) {

      SITE =
        await siteResp.json();
    }


    if (
      portfolioResp.ok
    ) {

      const dados =
        await portfolioResp
          .json();


      PORTFOLIO =
        Array.isArray(
          dados.itens
        )
          ? dados.itens
          : [];

    } else {

      console.error(
        "Erro ao carregar portfolio.json:",
        portfolioResp.status
      );
    }


    if (
      regioesResp.ok
    ) {

      const dadosRegioes =
        await regioesResp
          .json();


      REGIOES =
        Array.isArray(
          dadosRegioes.itens
        )
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
   DADOS DO SITE
========================================================= */

function aplicarSite() {

  const tituloHome =
    $("#tituloHome");


  if (tituloHome) {

    /*
      MUITO IMPORTANTE:
      não usamos textContent na Home premium,
      pois isso apagaria o dourado de
      "visão estratégica."
    */

    if (
      tituloHome
        .classList
        .contains(
          "hero-title-premium"
        )
    ) {

      tituloHome.innerHTML = `
        Imóveis, áreas e<br>
        oportunidades com
        <span class="hero-title-gold">
          visão estratégica.
        </span>
      `;

    } else {

      tituloHome.textContent =
        SITE.tituloHome ||
        "Imóveis, áreas e oportunidades com visão estratégica.";
    }
  }


  const subtituloHome =
    $("#subtituloHome");


  if (subtituloHome) {

    subtituloHome.textContent =
      SITE.subtituloHome ||
      "Curadoria imobiliária de alto padrão para compradores, proprietários, investidores e parceiros.";
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
        String(
          SITE.whatsapp
        )
          .replace(
            /\D/g,
            ""
          );


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
            String(
              SITE.whatsapp
            )
              .replace(
                /\D/g,
                ""
              );


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
      .replace(
        /\D/g,
        ""
      );


  const link =
    document.createElement(
      "a"
    );


  link.className =
    "whatsapp-float";


  const mensagem =
    "Olá! Vim pelo site da Piemonte Brokers e gostaria de mais informações.";


  link.href =
    `https://wa.me/${numero}?text=${
      encodeURIComponent(
        mensagem
      )
    }`;


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
    typeof item.codigo ===
      "string" &&
    item.codigo.trim()
  ) {

    return item.codigo.trim();
  }


  const indice =
    PORTFOLIO.findIndex(
      registro =>
        String(
          registro.id
        ) ===
        String(
          item?.id
        )
    );


  const numero =
    indice >= 0
      ? indice + 1
      : 0;


  return `PB ${
    String(numero)
      .padStart(
        4,
        "0"
      )
  }`;
}


/* =========================================================
   REGIÕES HOME
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
        item.destaque !==
        false
    );


  box.innerHTML =
    "";


  lista.forEach(
    item => {

      const link =
        document.createElement(
          "a"
        );


      const regiaoFiltro =
        item.nome ||
        item.cidadeFiltro ||
        "";


      const destino =
        normalizarTexto(
          item.id
        ).includes(
          "areas"
        ) ||
        normalizarTexto(
          regiaoFiltro
        ).includes(
          "areas & oportunidades"
        )
          ? "/areas.html"
          : "/imoveis.html";


      link.href =
        regiaoFiltro
          ? `${
              destino
            }?regiao=${
              encodeURIComponent(
                regiaoFiltro
              )
            }`
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
   NÚMEROS / SPECS
========================================================= */

function formatarNumero(valor) {

  const numero =
    Number(valor);


  if (
    Number.isNaN(
      numero
    )
  ) {

    return valor;
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits:
        2
    }
  );
}


function specs(item) {

  const dados = [];


  if (item.suites) {

    dados.push(
      `${
        item.suites
      } ${
        Number(
          item.suites
        ) === 1
          ? "suíte"
          : "suítes"
      }`
    );

  } else if (
    item.quartos
  ) {

    dados.push(
      `${
        item.quartos
      } ${
        Number(
          item.quartos
        ) === 1
          ? "dormitório"
          : "dormitórios"
      }`
    );
  }


  if (
    item.areaConstruida
  ) {

    dados.push(
      `${
        formatarNumero(
          item.areaConstruida
        )
      } m² construídos`
    );
  }


  if (
    item.areaTerreno
  ) {

    dados.push(
      `${
        formatarNumero(
          item.areaTerreno
        )
      } m² de terreno`
    );
  }


  return dados.join(
    " • "
  );
}


/* =========================================================
   ADICIONAR OPÇÃO
========================================================= */

function adicionarOpcao(
  campo,
  valor
) {

  if (
    !campo ||
    campo.tagName !==
      "SELECT" ||
    !valor
  ) {

    return;
  }


  const existe =
    [
      ...campo.options
    ].some(
      opcao =>
        opcao.value ===
        valor
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
    pagina ===
    "imoveis"
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
    pagina ===
    "areas"
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
    $("#fCategoria");


  const negocio =
    $("#fNegocio");


  const regiao =
    $("#fCidade");


  const tipo =
    $("#fTipo");


  if (
    categoria &&
    categoria.tagName ===
      "SELECT"
  ) {

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


  if (
    negocio &&
    negocio.tagName ===
      "SELECT"
  ) {

    negocio.innerHTML = `
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


  lista =
    lista.filter(
      estaDisponivel
    );


  /*
    REGIÕES MACRO DEFINITIVAS
  */

  opcoesUnicas(
    regiao,
    [
      "Itu, Porto Feliz e Região",
      "Granja Viana & Alphaville",
      "São Paulo",
      "Salto e Indaiatuba"
    ],
    "Todas as regiões"
  );


  /*
    CIDADES SÃO EXTRAÍDAS
    DOS IMÓVEIS CADASTRADOS
  */

  opcoesUnicas(
    $("#fCidadeMunicipio"),
    lista.map(
      item =>
        item.cidade
    ),
    "Todas as cidades"
  );


  atualizarCondominiosPorCidade();


  /*
    TIPO
  */

  if (
    tipo &&
    tipo.tagName ===
      "SELECT"
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
          String(a)
            .localeCompare(
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


  atualizarDropdownLocalizacao();
}


/* =========================================================
   FILTROS DA URL
========================================================= */

function selecionarValor(
  seletor,
  valor
) {

  if (!valor) {
    return false;
  }


  const campo =
    $(seletor);


  if (
    !campo ||
    campo.tagName !==
      "SELECT"
  ) {

    return false;
  }


  const normalizado =
    normalizarTexto(
      valor
    );


  const opcao =
    [
      ...campo.options
    ]
      .find(
        item =>
          normalizarTexto(
            item.value
          ) ===
          normalizado
      );


  if (!opcao) {

    return false;
  }


  campo.value =
    opcao.value;


  atualizarDropdownPesquisavel(
    campo
  );


  return true;
}


function aplicarFiltroDaURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const regiao =
    params.get(
      "regiao"
    );


  const cidade =
    params.get(
      "cidade"
    );


  const negocio =
    params.get(
      "negocio"
    );


  const grupoRegiao =
    params.get(
      "grupoRegiao"
    );


  const categoria =
    params.get(
      "categoria"
    );


  const condominio =
    params.get(
      "condominio"
    );


  const bairro =
    params.get(
      "bairro"
    );


  const tipo =
    params.get(
      "tipo"
    );


  const preco =
    params.get(
      "preco"
    );


  let aplicouFiltro =
    false;


  if (grupoRegiao) {

    GRUPO_REGIAO_ATIVO =
      normalizarTexto(
        grupoRegiao
      );


    aplicouFiltro =
      true;
  }


  if (regiao) {

    const campoRegiao =
      $("#fCidade");


    if (
      campoRegiao &&
      campoRegiao.tagName ===
        "SELECT"
    ) {

      const encontrado =
        [
          ...campoRegiao.options
        ]
          .find(
            item =>
              normalizarTexto(
                item.value
              ) ===
              normalizarTexto(
                regiao
              )
          );


      if (encontrado) {

        campoRegiao.value =
          encontrado.value;

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


  if (
    cidade &&
    !regiao
  ) {

    if (
      selecionarValor(
        "#fCidadeMunicipio",
        cidade
      )
    ) {

      atualizarCondominiosPorCidade();


      aplicouFiltro =
        true;
    }
  }


  if (negocio) {

    const campoNegocio =
      $("#fNegocio");


    if (campoNegocio) {

      let valor =
        normalizarTexto(
          negocio
        );


      if (
        valor === "alugar" ||
        valor === "aluguel" ||
        valor === "locacao"
      ) {

        valor =
          "locacao";
      }


      const opcao =
        [
          ...campoNegocio.options
        ]
          .find(
            item =>
              normalizarTexto(
                item.value
              ) === valor
          );


      if (opcao) {

        campoNegocio.value =
          opcao.value;


        aplicouFiltro =
          true;
      }
    }
  }


  if (
    selecionarValor(
      "#fCategoria",
      categoria
    )
  ) {

    aplicouFiltro =
      true;
  }


  if (
    selecionarValor(
      "#fCondominio",
      condominio
    )
  ) {

    aplicouFiltro =
      true;
  }


  if (
    selecionarValor(
      "#fBairro",
      bairro
    )
  ) {

    aplicouFiltro =
      true;
  }


  if (
    selecionarValor(
      "#fTipo",
      tipo
    )
  ) {

    aplicouFiltro =
      true;
  }


  if (
    selecionarValor(
      "#fPreco",
      preco
    )
  ) {

    aplicouFiltro =
      true;
  }


  atualizarResumoLocalizacao();

  atualizarDropdownLocalizacao();


  if (
    aplicouFiltro
  ) {

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
        estaDisponivel(
          item
        )
    );


  const pagina =
    paginaAtual();


  if (
    pagina ===
    "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) ===
          "imovel"
      );
  }


  if (
    pagina ===
    "areas"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) ===
          "area"
      );
  }


  if (
    pagina ===
    "home"
  ) {

    const destaques =
      lista
        .filter(
          item =>
            item.destaque ===
            true
        )
        .map(
          (
            item,
            indiceOriginal
          ) => {

            const ordem =
              Number(
                item.ordemDestaque
              );


            return {

              item,

              indiceOriginal,

              ordem:
                Number.isFinite(
                  ordem
                ) &&
                ordem > 0
                  ? ordem
                  : 9999
            };
          }
        )
        .sort(
          (a, b) => {

            if (
              a.ordem !==
              b.ordem
            ) {

              return (
                a.ordem -
                b.ordem
              );
            }


            return (
              a.indiceOriginal -
              b.indiceOriginal
            );
          }
        )
        .map(
          registro =>
            registro.item
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
   PAGINAÇÃO
========================================================= */

function renderPaginacao(
  totalItens
) {

  let paginacao =
    $("#paginacaoPortfolio");


  const cards =
    $("#cards");


  if (!cards) {
    return;
  }


  if (!paginacao) {

    paginacao =
      document.createElement(
        "nav"
      );


    paginacao.id =
      "paginacaoPortfolio";


    paginacao.setAttribute(
      "aria-label",
      "Paginação de imóveis"
    );


    paginacao.style.display =
      "flex";


    paginacao.style.flexWrap =
      "wrap";


    paginacao.style.justifyContent =
      "center";


    paginacao.style.alignItems =
      "center";


    paginacao.style.gap =
      "8px";


    paginacao.style.marginTop =
      "32px";


    cards.insertAdjacentElement(
      "afterend",
      paginacao
    );
  }


  if (
    paginaAtual() !==
      "imoveis" ||
    totalItens <=
      ITENS_POR_PAGINA
  ) {

    paginacao.innerHTML =
      "";


    paginacao.style.display =
      "none";


    return;
  }


  paginacao.style.display =
    "flex";


  const totalPaginas =
    Math.ceil(
      totalItens /
      ITENS_POR_PAGINA
    );


  PAGINA_ATUAL_PORTFOLIO =
    Math.min(
      Math.max(
        PAGINA_ATUAL_PORTFOLIO,
        1
      ),
      totalPaginas
    );


  paginacao.innerHTML =
    "";


  function criarBotao(
    texto,
    pagina,
    ativo = false,
    desabilitado = false
  ) {

    const botao =
      document.createElement(
        "button"
      );


    botao.type =
      "button";


    botao.textContent =
      texto;


    botao.disabled =
      desabilitado;


    botao.style.minWidth =
      "42px";


    botao.style.height =
      "42px";


    botao.style.padding =
      "0 12px";


    botao.style.border =
      ativo
        ? "1px solid #17372f"
        : "1px solid #c8c8c8";


    botao.style.background =
      ativo
        ? "#17372f"
        : "#ffffff";


    botao.style.color =
      ativo
        ? "#ffffff"
        : "#17372f";


    botao.style.cursor =
      desabilitado
        ? "default"
        : "pointer";


    botao.style.opacity =
      desabilitado
        ? ".45"
        : "1";


    botao.style.borderRadius =
      "2px";


    if (
      !desabilitado
    ) {

      botao.addEventListener(
        "click",
        () => {

          PAGINA_ATUAL_PORTFOLIO =
            pagina;


          render(
            ULTIMA_LISTA_PORTFOLIO
          );


          $("#cards")
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start"
            });
        }
      );
    }


    return botao;
  }


  paginacao.appendChild(
    criarBotao(
      "Anterior",
      PAGINA_ATUAL_PORTFOLIO - 1,
      false,
      PAGINA_ATUAL_PORTFOLIO ===
        1
    )
  );


  for (
    let numero = 1;
    numero <=
      totalPaginas;
    numero++
  ) {

    paginacao.appendChild(
      criarBotao(
        String(numero),
        numero,
        numero ===
          PAGINA_ATUAL_PORTFOLIO
      )
    );
  }


  paginacao.appendChild(
    criarBotao(
      "Próxima",
      PAGINA_ATUAL_PORTFOLIO + 1,
      false,
      PAGINA_ATUAL_PORTFOLIO ===
        totalPaginas
    )
  );
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


  let listaParaExibir =
    lista;


  if (
    paginaAtual() ===
    "imoveis"
  ) {

    ULTIMA_LISTA_PORTFOLIO =
      [...lista];


    const totalPaginas =
      Math.max(
        1,
        Math.ceil(
          lista.length /
          ITENS_POR_PAGINA
        )
      );


    PAGINA_ATUAL_PORTFOLIO =
      Math.min(
        Math.max(
          PAGINA_ATUAL_PORTFOLIO,
          1
        ),
        totalPaginas
      );


    const inicio =
      (
        PAGINA_ATUAL_PORTFOLIO -
        1
      ) *
      ITENS_POR_PAGINA;


    listaParaExibir =
      lista.slice(
        inicio,
        inicio +
          ITENS_POR_PAGINA
      );
  }


  listaParaExibir
    .forEach(
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
          [
            ...new Set(
              localCard
            )
          ];


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
                codigoPiemonte(
                  item
                )
              )}
            </div>

            <div class="meta">
              ${esc(
                localUnico.join(
                  " • "
                )
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
              ${htmlPrecoCard(item)}
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
              evento.key ===
                "Enter" ||
              evento.key ===
                " "
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


  renderPaginacao(
    lista.length
  );
}


/* =========================================================
   ABRIR IMÓVEL
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


  window.location.href =
    `/propriedade.html?id=${
      encodeURIComponent(
        item.id
      )
    }`;
}


function abrir(item) {

  abrirPropriedade(
    item
  );
}


/* =========================================================
   PREÇO
========================================================= */

function atendePrecoNumero(
  valor,
  faixa
) {

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
        valor >
          1000000 &&
        valor <=
          3000000
      );


    case "3m-5m":

      return (
        valor >
          3000000 &&
        valor <=
          5000000
      );


    case "5m-10m":

      return (
        valor >
          5000000 &&
        valor <=
          10000000
      );


    case "10m-30m":

      return (
        valor >
          10000000 &&
        valor <=
          30000000
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


function atendeFaixaPreco(
  item,
  faixa,
  negocio = ""
) {

  if (!faixa) {
    return true;
  }


  const modos =
    negocio
      ? [negocio]
      : modalidades(item);


  return modos.some(
    modo =>
      atendePrecoNumero(
        precoModalidade(
          item,
          modo
        ),
        faixa
      )
  );
}


/* =========================================================
   FILTRAGEM
========================================================= */

function filtrar() {

  let lista =
    [...PORTFOLIO];


  lista =
    lista.filter(
      estaDisponivel
    );


  const pagina =
    paginaAtual();


  if (
    pagina ===
    "imoveis"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) ===
          "imovel"
      );
  }


  if (
    pagina ===
    "areas"
  ) {

    lista =
      lista.filter(
        item =>
          normalizarTexto(
            item.categoria
          ) ===
          "area"
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


  const municipio =
    $("#fCidadeMunicipio")
      ?.value || "";


  const condominio =
    $("#fCondominio")
      ?.value || "";


  const bairro =
    $("#fBairro")
      ?.value || "";


  const tipo =
    $("#fTipo")
      ?.value || "";


  const preco =
    $("#fPreco")
      ?.value || "";


  const grupoRegiao =
    GRUPO_REGIAO_ATIVO;


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
          modalidades(item)
            .map(
              normalizarTexto
            );


        const regiaoPrincipalItem =
          normalizarTexto(
            item.regiaoPrincipal
          );


        const cidadeItem =
          normalizarTexto(
            item.cidade
          );


        const tipoItem =
          normalizarTexto(
            item.tipo
          );


        let atendeGrupoRegiao =
          true;


        if (
          grupoRegiao ===
          "itu-porto-feliz"
        ) {

          atendeGrupoRegiao =
            (
              regiaoPrincipalItem ===
                "itu, porto feliz e regiao" ||

              regiaoPrincipalItem ===
                "itu & regiao" ||

              regiaoPrincipalItem ===
                "porto feliz & regiao"
            ) &&

            cidadeItem !==
              "salto" &&

            cidadeItem !==
              "indaiatuba";
        }


        if (
          grupoRegiao ===
          "salto-indaiatuba"
        ) {

          atendeGrupoRegiao =
            regiaoPrincipalItem ===
              "salto e indaiatuba" ||

            cidadeItem ===
              "salto" ||

            cidadeItem ===
              "indaiatuba";
        }


        return (

          (
            !categoriaNormalizada ||

            categoriaItem ===
              categoriaNormalizada
          )

          &&

          (
            !negocioNormalizado ||

            negocioItem.includes(
              negocioNormalizado
            )
          )

          &&

          atendeGrupoRegiao

          &&

          (
            grupoRegiao ||

            !regiaoNormalizada ||

            regiaoPrincipalItem ===
              regiaoNormalizada ||

            cidadeItem ===
              regiaoNormalizada
          )

          &&

          (
            !municipio ||

            cidadeItem ===
              normalizarTexto(
                municipio
              )
          )

          &&

          (
            !condominio ||

            normalizarLocal(
              condominioImovel(
                item
              )
            ) ===
            normalizarLocal(
              condominio
            )
          )

          &&

          (
            !bairro ||

            normalizarLocal(
              bairroImovel(
                item
              )
            ) ===
            normalizarLocal(
              bairro
            )
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
            preco,

            negocioNormalizado ===
              "locacao"
              ? "Locação"
              : negocioNormalizado ===
                "venda"
                  ? "Venda"
                  : ""
          )
        );
      }
    );


  PAGINA_ATUAL_PORTFOLIO =
    1;


  render(
    lista
  );
}


/* =========================================================
   PARÂMETROS DA HOME
========================================================= */

function criarParametrosBusca() {

  const params =
    new URLSearchParams();


  const campos = [
    [
      "categoria",
      "#fCategoria"
    ],

    [
      "negocio",
      "#fNegocio"
    ],

    [
      "regiao",
      "#fCidade"
    ],

    [
      "cidade",
      "#fCidadeMunicipio"
    ],

    [
      "condominio",
      "#fCondominio"
    ],

    [
      "bairro",
      "#fBairro"
    ],

    [
      "tipo",
      "#fTipo"
    ],

    [
      "preco",
      "#fPreco"
    ]
  ];


  campos.forEach(
    (
      [
        parametro,
        seletor
      ]
    ) => {

      const valor =
        $(seletor)
          ?.value || "";


      if (valor) {

        params.set(
          parametro,
          valor
        );
      }
    }
  );


  return params;
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
    filtros.tagName ===
    "FORM"
  ) {

    filtros.addEventListener(
      "submit",
      evento => {

        evento.preventDefault();


        GRUPO_REGIAO_ATIVO =
          "";


        /*
          HOME:
          envia os filtros escolhidos
          para /imoveis.html
        */

        if (
          paginaAtual() ===
          "home"
        ) {

          const params =
            criarParametrosBusca();


          const query =
            params.toString();


          window.location.href =
            "/imoveis.html" +
            (
              query
                ? `?${query}`
                : ""
            );


          return;
        }


        /*
          IMÓVEIS / ÁREAS:
          filtra na própria página
        */

        filtrar();
      }
    );
  }


  [
    "#fCategoria",
    "#fNegocio",
    "#fCidade",
    "#fCidadeMunicipio",
    "#fCondominio",
    "#fBairro",
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
          () => {

            GRUPO_REGIAO_ATIVO =
              "";


            if (
              seletor ===
              "#fCidadeMunicipio"
            ) {

              atualizarCondominiosPorCidade();
            }


            atualizarResumoLocalizacao();


            /*
              Na Home NÃO filtramos
              automaticamente os cards.
              O usuário escolhe e depois
              clica em Buscar.
            */

            if (
              paginaAtual() !==
              "home"
            ) {

              filtrar();
            }
          }
        );
      }
    );


  ativarDropdownsPesquisaveis();

  ativarDropdownLocalizacao();
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


function ativarModal() {

  $("#modalClose")
    ?.addEventListener(
      "click",
      fechar
    );


  $("#fecharModal")
    ?.addEventListener(
      "click",
      fechar
    );


  $(".modal-overlay")
    ?.addEventListener(
      "click",
      fechar
    );


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
    .querySelectorAll(
      "a"
    )
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
   AVALIAÇÃO NO MENU
========================================================= */

function garantirAvaliacaoNoMenu() {

  const menu =
    $("#menu");


  if (!menu) {
    return;
  }


  const links =
    [
      ...menu.querySelectorAll(
        "a"
      )
    ];


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
            url.pathname ===
              "/avaliacao.html" ||

            url.pathname ===
              "/avaliacao"
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
    document.createElement(
      "a"
    );


  novoLink.href =
    "/avaliacao.html";


  novoLink.textContent =
    "Avaliação";


  const contato =
    links.find(
      link => {

        try {

          const url =
            new URL(
              link.href,
              window.location.origin
            );


          return (
            url.pathname ===
              "/contato.html" ||

            url.pathname ===
              "/contato"
          );

        } catch {

          return false;
        }
      }
    );


  if (contato) {

    menu.insertBefore(
      novoLink,
      contato
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
