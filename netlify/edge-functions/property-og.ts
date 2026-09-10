export default async (request: Request, context: any) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    const response = await context.next();

    if (!id) {
      return response;
    }

    const portfolioUrl = new URL(
      "/data/portfolio.json",
      request.url
    );

    const portfolioResponse = await fetch(portfolioUrl);

    if (!portfolioResponse.ok) {
      return response;
    }

    const dados = await portfolioResponse.json();

    const portfolio = Array.isArray(dados)
      ? dados
      : Array.isArray(dados.itens)
        ? dados.itens
        : Array.isArray(dados.portfolio)
          ? dados.portfolio
          : [];

    const normalizar = (valor: any) => {
      return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    };

    const idBuscado = normalizar(id);

    const propriedade = portfolio.find((item: any) => {
      const candidatos = [
        item.id,
        item.codigo,
        item.titulo,
        item.nome
      ];

      return candidatos.some(
        valor => normalizar(valor) === idBuscado
      );
    });

    if (!propriedade) {
      console.log(
        "Imóvel não encontrado para compartilhamento:",
        id
      );

      return response;
    }

    const limparTexto = (valor: any) => {
      if (
        valor === null ||
        valor === undefined
      ) {
        return "";
      }

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
      if (!caminho) {
        return "";
      }

      try {
        return new URL(
          caminho,
          url.origin
        ).href;
      } catch {
        return "";
      }
    };

    const titulo =
      propriedade.titulo ||
      propriedade.nome ||
      propriedade.condominio ||
      "Imóvel selecionado";

    const tituloSocial =
      `${limparTexto(titulo)} | Piemonte Brokers`;

    const partesLocalizacao = [
      propriedade.condominio,
      propriedade.regiao,
      propriedade.cidade
    ]
      .filter(Boolean)
      .map(limparTexto);

    const localizacao =
      [...new Set(partesLocalizacao)]
        .join(" • ");

    let preco = "";

    if (propriedade.precoTexto) {
      preco = limparTexto(
        propriedade.precoTexto
      );
    } else if (
      propriedade.preco !== undefined &&
      propriedade.preco !== null &&
      propriedade.preco !== ""
    ) {
      const valorNumerico =
        Number(propriedade.preco);

      if (!isNaN(valorNumerico)) {
        preco =
          valorNumerico.toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0
            }
          );
      }
    }

    let descricao =
      propriedade.descricao ||
      propriedade.descricaoLonga ||
      "";

    descricao = limparTexto(descricao);

    if (descricao.length > 180) {
      descricao =
        descricao
          .substring(0, 177)
          .trim() + "...";
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

    let imagem = "";

    if (
      typeof propriedade.imagemCapa === "string"
    ) {
      imagem =
        propriedade.imagemCapa;
    }

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

    if (
      !imagem &&
      Array.isArray(propriedade.galeria) &&
      propriedade.galeria.length
    ) {
      const primeira =
        propriedade.galeria[0];

      if (
        typeof primeira === "string"
      ) {
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

    if (!imagem) {
      imagem =
        "/assets/logo-piemonte.png";
    }

    const imagemAbsoluta =
      tornarAbsoluta(imagem);

    const urlSocial =
      url.href;

    const metaTags = `

<!-- ==================================================
     COMPARTILHAMENTO SOCIAL - PIEMONTE BROKERS
=================================================== -->

<meta property="og:type" content="website">

<meta property="og:site_name" content="Piemonte Brokers">

<meta property="og:locale" content="pt_BR">

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

    const html =
      await response.text();

    let htmlFinal =
      html;

    htmlFinal =
      htmlFinal.replace(
        /<meta[^>]+property=["']og:[^>]+>/gi,
        ""
      );

    htmlFinal =
      htmlFinal.replace(
        /<meta[^>]+name=["']twitter:[^>]+>/gi,
        ""
      );

    htmlFinal =
      htmlFinal.replace(
        /<link[^>]+rel=["']canonical["'][^>]*>/gi,
        ""
      );

    if (
      htmlFinal.includes("</head>")
    ) {
      htmlFinal =
        htmlFinal.replace(
          "</head>",
          `${metaTags}</head>`
        );
    }

    const headers =
      new Headers(
        response.headers
      );

    headers.set(
      "content-type",
      "text/html; charset=utf-8"
    );

    headers.set(
      "cache-control",
      "public, max-age=0, must-revalidate"
    );

    return new Response(
      htmlFinal,
      {
        status:
          response.status,

        statusText:
          response.statusText,

        headers
      }
    );

  } catch (erro) {

    console.error(
      "Erro na Edge Function property-og:",
      erro
    );

    return context.next();

  }
};