/* =========================================================
   NOSSO PROJETO 3D — medicao.js
   Medição de uso com Google Analytics 4, com aviso de cookies.

   - Só carrega o Google depois que a pessoa clica em "Aceitar".
   - A escolha fica salva no navegador e vale para todos os projetos
     do domínio nossoprojeto3d.github.io (mesma chave do Ajuste 3MF).
   - Quem usa "Não rastrear" no navegador não é medido nem vê o aviso.
   - Nunca enviamos preços, valores de orçamento, nomes de arquivo nem
     endereços completos. Só nomes de eventos e rótulos curtos (a busca
     do catálogo envia o termo pesquisado).

   Como usar em uma página: <script src="medicao.js" defer></script>
   Para medir algo específico, chame np3dTrack("nome_do_evento", { chave: "valor" }).
   Qualquer link com data-evento="nome" também vira evento ao clicar
   (parâmetros extras em data-produto, data-categoria etc.).

   Este arquivo é o mesmo em todos os projetos. Se mudar aqui, copie
   para os outros.
   ========================================================= */
(function () {
  "use strict";

  var GA_ID = "G-PNRZ6JQWLP";
  var KEY = "nossoprojeto3d-medicao";
  var HOST_PROJETOS = "nossoprojeto3d.github.io";

  var ativo = false;
  var naoRastrear = navigator.doNotTrack === "1";

  /* ---------- consentimento ---------- */
  function lerEscolha() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "granted" || v === "denied" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function salvarEscolha(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch (e) {
      /* sem armazenamento: a escolha vale só nesta visita */
    }
  }

  /* ---------- Google Analytics ---------- */
  function iniciarGoogle() {
    if (ativo) return;
    ativo = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
    observarSecoes();
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function limpar(valor) {
    return String(valor == null ? "" : valor).replace(/\s+/g, " ").trim().slice(0, 80);
  }

  window.np3dTrack = function (evento, params) {
    if (!ativo || typeof window.gtag !== "function") return;
    var p = {};
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) {
          var v = params[k];
          p[k] = typeof v === "number" || typeof v === "boolean" ? v : limpar(v);
        }
      }
    }
    window.gtag("event", evento, p);
  };

  /* ---------- seções vistas (só em páginas com data-medir-secoes no body) ---------- */
  function observarSecoes() {
    function iniciar() {
      if (!document.body.hasAttribute("data-medir-secoes") || !("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting) {
              io.unobserve(e.target);
              window.np3dTrack("ver_secao", { secao: e.target.id, pagina: projetoDaPagina() });
            }
          });
        },
        { threshold: 0.4 }
      );
      document.querySelectorAll("section[id]").forEach(function (s) {
        io.observe(s);
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
  }

  /* ---------- cliques em links ---------- */
  function projetoDaPagina() {
    return location.pathname.split("/").filter(Boolean)[0] || "home";
  }

  function classificar(a) {
    var url;
    try {
      url = new URL(a.href, location.href);
    } catch (e) {
      return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    var host = url.hostname.replace(/^www\./, "");

    if (host === "wa.me" || host === "api.whatsapp.com") return { evento: "clique_whatsapp" };
    if (host === "instagram.com") return { evento: "clique_instagram" };
    if (host === "shopee.com.br") return { evento: "clique_shopee" };
    if (host === "drive.google.com") return { evento: "clique_drive" };
    if (host === "github.com") return { evento: "clique_github" };

    if (host === HOST_PROJETOS) {
      var destino = url.pathname.split("/").filter(Boolean)[0] || "home";
      if (destino === projetoDaPagina() && url.pathname === location.pathname) return null;
      return { evento: "clique_projeto", params: { projeto: destino } };
    }
    if (host !== location.hostname) return { evento: "clique_externo", params: { destino: host } };
    return null;
  }

  function aoClicar(ev) {
    if (!ativo) return;
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;

    var nome = a.getAttribute("data-evento");
    var params = {};
    var d = a.dataset || {};

    if (nome) {
      for (var k in d) {
        if (k !== "evento" && k !== "link") params[k] = d[k];
      }
    } else {
      var c = classificar(a);
      if (!c) return;
      nome = c.evento;
      params = c.params || {};
    }

    var secao = a.closest("[id]");
    params.local = d.link || (secao && secao.id) || "pagina";
    params.pagina = projetoDaPagina();
    window.np3dTrack(nome, params);
  }

  /* ---------- aviso de cookies ---------- */
  function mostrarAviso() {
    if (document.getElementById("np3d-cookies")) return;

    var css = document.createElement("style");
    css.textContent =
      "#np3d-cookies{position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;" +
      "max-width:760px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;padding:16px 18px;" +
      "background:#17130d;color:#f4efe3;border:1px solid #3a3226;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.45);" +
      "font:14px/1.5 'Work Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
      "#np3d-cookies p{margin:0;flex:1 1 280px;color:#a69c87}" +
      "#np3d-cookies div{display:flex;gap:8px;flex:0 0 auto}" +
      "#np3d-cookies button{font:inherit;font-weight:600;cursor:pointer;border-radius:10px;padding:9px 18px;min-height:40px;" +
      "border:1px solid #4d4331;background:transparent;color:#f4efe3}" +
      "#np3d-cookies button[data-acao=aceitar]{background:#c9a227;border-color:#c9a227;color:#120e09}" +
      "#np3d-cookies button:hover{filter:brightness(1.1)}" +
      "#np3d-cookies button:focus-visible{outline:3px solid #e7c873;outline-offset:2px}" +
      "@media(max-width:520px){#np3d-cookies div{width:100%}#np3d-cookies button{flex:1}}";
    document.head.appendChild(css);

    var box = document.createElement("div");
    box.id = "np3d-cookies";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Aviso de cookies");
    box.innerHTML =
      "<p>Usamos o Google Analytics para contar quantas pessoas visitam o site e o que elas mais usam. " +
      "Você pode recusar e usar tudo normalmente.</p>" +
      '<div><button type="button" data-acao="recusar">Recusar</button>' +
      '<button type="button" data-acao="aceitar">Aceitar</button></div>';

    box.addEventListener("click", function (ev) {
      var acao = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-acao");
      if (!acao) return;
      salvarEscolha(acao === "aceitar" ? "granted" : "denied");
      if (acao === "aceitar") iniciarGoogle();
      box.remove();
      css.remove();
    });

    document.body.appendChild(box);
  }

  /* ---------- início ---------- */
  if (naoRastrear) return;

  document.addEventListener("click", aoClicar, true);

  var escolha = lerEscolha();
  if (escolha === "granted") {
    iniciarGoogle();
  } else if (escolha === null) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mostrarAviso);
    else mostrarAviso();
  }
})();
