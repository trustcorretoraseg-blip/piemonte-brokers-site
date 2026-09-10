export default async (request: Request, context: any) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    // Deixa o Netlify carregar normalmente o propriedade.html
    const response = await context.next();

    // Se não houver ID, devolve a página normalmente
    if (!id) {
      return response;
    }

    // Carrega o cadastro dos imóveis
    const portfolioUrl = new URL("/data/portfolio.json", request.url);

    const portfolioResponse = await fetch(portfolioUrl);

    if (!portfolioResponse.ok) {
      return response;
    }

    const dados = await portfolioResponse.json();

    // Aceita portfolio.json tanto como array quanto dentro de "itens"
    const portfolio = Array.isArray(dados)
      ? dados
      : Array.isArray(dados.itens)
        ? dados.itens
        : Array.isArray(dados.portfolio)
          ? dados.portfolio
          : [];

    // Procura o imóvel pelo ID
    const propriedade = portfolio.find((item: any) => {
      return (
        String(item.id || "") === String(id) ||
        String(item.codigo || "") === String(id)
      );
    });

    if (!propriedade) {
      return response;
    }

    /*
    =====================================================
    FUNÇÕES AUXILIARES
    =====================================================
    */

    const limparTexto = (valor: any) => {
      if (valor === null || valor === undefined) return "";

      return String(valor)
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const escaparHtml = (valor: any) => {
      return limparTexto(valor)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const tornarAbsoluta = (caminho: string) => {
      if (!caminho) return "";

      try {
        return new URL(caminho, url.origin).href;
      } catch {
        return "";
      }
    };

    /*
    =====================================================
    TÍTULO
    =====================================================
    */

    const titulo =
      propriedade.titulo ||
      propriedade.condominio ||
      "Imóvel selecionado";

    const tituloSocial =
      `${limparTexto(titulo)} | Piemonte Brokers`;

    /*
    =====================================================
    LOCALIZAÇÃO
    =====================================================
    */

    const partesLocalizacao = [
      propriedade.condominio,
      propriedade.regiao,
      propriedade.cidade
    ]
      .filter(Boolean)
      .map(limparTexto);

    const localizacao =
      [...new Set(partesLocalizacao)].join(" • ");

    /*
    =====================================================
    PREÇO
    =====================================================
    */

    let preco = "";

    if (propriedade.precoTexto) {
      preco = limparTexto(propriedade.precoTexto);
    }

    /*
    =====================================================
    DESCRIÇÃO
    =====================================================
    */

    let descricao =
      propriedade.descricao ||
      propriedade.descricaoLonga ||
      "";

    descricao = limparTexto(descricao);

    // Evita descrições gigantes nas redes sociais
    if (descricao.length > 180) {
      descricao =
        descricao.substring(0, 177).trim() + "...";
    }

    let descricaoSocial = "";

    if (localizacao) {
      descricaoSocial += localizacao;
    }

    if (preco) {
      descricaoSocial +=
        `${descricaoSocial ? " | " : ""}${preco}`;
    }

    if (descricao) {
      descricaoSocial +=
        `${descricaoSocial ? " — " : ""}${descricao}`;
    }

    if (!descricaoSocial) {
      descricaoSocial =
        "Conheça esta oportunidade selecionada pela Piemonte Brokers.";
    }

    /*
    =====================================================
    FOTO DE CAPA
    =====================================================
    */

    let imagem = "";

    if (typeof propriedade.imagemCapa === "string") {
      imagem = propriedade.imagemCapa;
    }

    // Caso imagemCapa seja um objeto
    if (
      propriedade.imagemCapa &&
      typeof propriedade.imagemCapa === "object"
    ) {
      imagem =
        propriedade.imagemCapa.foto ||
        propriedade.imagemCapa.imagem ||
        propriedade.imagemCapa.image ||
        propriedade.imagemCapa.src ||
        propriedade.imagemCapa.path ||
        "";
    }

    // Caso não tenha capa, tenta usar a primeira da galeria
    if (
      !imagem &&
      Array.isArray(propriedade.galeria) &&
      propriedade.galeria.length
    ) {
      const primeira = propriedade.galeria[0];

      if (typeof primeira === "string") {
        imagem = primeira;
      } else if (primeira) {
        imagem =
          primeira.foto ||
          primeira.imagem ||
          primeira.image ||
          primeira.src ||
          primeira.path ||
          "";
      }
    }

    // Fallback para o logo Piemonte
    if (!imagem) {
      imagem = "/assets/logo-piemonte.png";
    }

    const imagemAbsoluta =
      tornarAbsoluta(imagem);

    /*
    =====================================================
    URL CANÔNICA
    =====================================================
    */

    const urlSocial = url.href;

    /*
    =====================================================
    META TAGS
    =====================================================
    */

    const metaTags = `

<!-- ==================================================
     COMPARTILHAMENTO SOCIAL - PIEMONTE BROKERS
=================================================== -->

<meta property="og:type" content="website">

<meta property="og:site_name" content="Piemonte Brokers">

<meta property="og:title"
content="${escaparHtml(tituloSocial)}">

<meta property="og:description"
content="${escaparHtml(descricaoSocial)}">

<meta property="og:url"
content="${escaparHtml(urlSocial)}">

<meta property="og:image"
content="${escaparHtml(imagemAbsoluta)}">

<meta property="og:image:secure_url"
content="${escaparHtml(imagemAbsoluta)}">

<meta property="og:image:alt"
content="${escaparHtml(titulo)}">

<meta name="twitter:card"
content="summary_large_image">

<meta name="twitter:title"
content="${escaparHtml(tituloSocial)}">

<meta name="twitter:description"
content="${escaparHtml(descricaoSocial)}">

<meta name="twitter:image"
content="${escaparHtml(imagemAbsoluta)}">

<link rel="canonical"
href="${escaparHtml(urlSocial)}">

`;

    /*
    =====================================================
    ALTERA O HTML ANTES DE ENTREGAR PARA A REDE SOCIAL
    =====================================================
    */

    const html = await response.text();

    let htmlFinal = html;

    if (html.includes("</head>")) {
      htmlFinal = html.replace(
        "</head>",
        `${metaTags}</head>`
      );
    }

    const headers =
      new Headers(response.headers);

    headers.set(
      "content-type",
      "text/html; charset=utf-8"
    );

    return new Response(
      htmlFinal,
      {
        status: response.status,
        statusText: response.statusText,
        headers
      }
    );

  } catch (erro) {

    console.error(
      "Erro na função property-og:",
      erro
    );

    // Se ocorrer qualquer erro,
    // mantém o site funcionando normalmente
    return context.next();
  }
};