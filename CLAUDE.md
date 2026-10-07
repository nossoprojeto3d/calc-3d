# Calculadora 3D (calc-3d)

Calculadora de preço para impressão 3D, publicada no GitHub Pages: https://nossoprojeto3d.github.io/calc-3d/
Todo push na `main` vai direto pro ar: o GitHub Actions (`.github/workflows/publicar.yml`) roda os testes do cálculo, gera o build e publica. Instalável como PWA.

Stack (V4): Vite + React + TypeScript + Tailwind v4, Motion (animações), Vaul (gavetas), Radix (diálogo e interruptor), Phosphor (ícones), jsPDF (npm). Libs e frameworks gratuitos podem entrar.

O README.md explica a fórmula de preço e onde ficam os dados. Leia-o antes de mexer no cálculo.

## Comandos

- `npm run dev`: servidor local com recarga ao vivo (também abre no celular pela rede).
- `npm run build` e `npm run preview`: build de produção, com a CSP ligada, em http://localhost:4173/calc-3d/.
- `npm test`: testes do cálculo (`tests/unit`).
- `npm run test:e2e`: roteiro de teste no iPhone (Safari/WebKit), Android (Chrome) e desktop. Precisa do `preview` rodando.
- `npm run paridade`: compara o motor com a V3 original em 2.000 cenários. Precisa da V3 servida em http://localhost:8765 (ver README).

## Arquivos

- `src/lib/data.ts`: dados (`PRINTERS`, `MATERIALS`, `PRO_COSTS`, `SHOPEE_DEFAULT_TIERS`, `MELI_DEFAULT_SETTINGS`).
- `src/lib/calc.ts`: motor de cálculo, sem tela (fórmulas, validação, texto do WhatsApp).
- `src/lib/cliente.ts`: orçamento para o cliente (texto do WhatsApp sem custos/lucro, com os dados da loja).
- `src/lib/form.ts`: comportamentos automáticos do formulário (preço/kg do material, desgaste, faixas da Shopee/ML).
- `src/lib/useCalculator.ts`: liga o formulário, as configurações, o resultado e "Meus orçamentos".
- `src/lib/storage.ts`: localStorage (mesmas chaves da V3) e eventos de medição.
- `src/lib/pdf.ts`: PDFs do orçamento (completo e para o cliente, com o logo da loja).
- `src/App.tsx` e `src/components/`: telas. `src/styles.css`: identidade visual (tokens de cor, tipografia, componentes).
- `index.html`: casca da página. A Content Security Policy está em `vite.config.ts` e entra só no build.
- `public/`: arquivos copiados sem mudança (`assets/`, `medicao.js`, `tema.js`, `sw-limpeza.js`).
- `public/medicao.js`: Google Analytics 4 com aviso de cookies. É o mesmo arquivo em todos os projetos; se mudar aqui, avisar que precisa copiar pros outros.

## Regras

- Nada vai para servidor: orçamentos, configurações, tema e modo ficam no `localStorage`, com as mesmas chaves da V3. Cada abertura começa com um cálculo novo.
- Imposto e taxas de marketplace incidem sobre o **preço final**: `preço = (custos + lucro + taxa fixa) ÷ (1 − comissão − imposto)`. Não mude a fórmula sem o usuário pedir.
- Ao mexer em `src/lib/calc.ts` ou `src/lib/form.ts`, rode `npm test` e `npm run paridade`: os resultados precisam continuar iguais aos da V3.
- As taxas da Shopee e do Mercado Livre mudam com o tempo. Antes de alterar, confirme as regras atuais no site oficial e cite a fonte.
- O jsPDF vem do npm e só carrega no primeiro clique em "PDF" (import dinâmico).
- Se adicionar um script ou domínio externo, atualize a CSP em `vite.config.ts`.
- O orçamento para o cliente nunca pode mostrar custos, lucro, taxas ou valor-hora (o teste e2e 10 confere).
- Texto digitado sempre entra como texto no React (nunca `dangerouslySetInnerHTML`). Mantenha isso.
- Os campos precisam ter fonte de pelo menos 16px, para o iPhone não dar zoom automático.
- Emojis na mensagem do WhatsApp já quebraram. Teste a codificação do texto ao mexer nela (o teste e2e "WhatsApp" confere).
- Identidade V4 "Grafite e Esmeralda": neutros grafite + um único acento verde esmeralda (`--accent`, #2FD39A). Geist no texto e nos números, Geist Mono só em detalhes técnicos. Laranja é a cor do Ajuste 3MF e dourado a do site/catálogo: não use aqui.
- O logo, o favicon e os ícones do app foram recoloridos em verde (`node scripts/recolorir-logo.mjs`, a partir dos originais em `scripts/logo-dourado/`). As cores do aviso de cookies são trocadas em `src/styles.css`, sem mexer no `medicao.js` compartilhado.

## Imagens

- Ficam em `public/assets/`: `logo.png`, `favicon.png` e os ícones do app `icon-192.png` e `icon-512.png` (PNG, quadrados).
- O service worker é gerado no build (vite-plugin-pwa) e reconhece arquivos novos sozinho; não há `CACHE_NAME` pra trocar à mão.

## Versões salvas

As tags `estavel-2026-09-23` (V1, violeta/ciano), `backup-tons-dourados` (V2, preto e dourado) e `backup-pre-redesign-20261007` (V3, HTML/CSS/JS puros, antes da V4) são versões históricas. Não apague sem perguntar.

## Roteiro de teste

Usado pelo `/conferir-site`, no celular e no desktop (automatizado em `tests/e2e/roteiro.spec.ts`):

1. A página abre sem erros no console e sem violações de CSP.
2. Modo Básico: escolher impressora e filamento, preencher gramas e horas. O preço aparece e confere com a fórmula do README (refaça a conta).
3. Modo Profissional: ligar desgaste, mão de obra e embalagem. O preço sobe de acordo.
4. Shopee e Mercado Livre: o preço final cobre a comissão (preço × (1 − comissão − imposto) ≈ custos + lucro + taxa fixa).
5. Arredondamento para ",99" funciona.
6. "Meus orçamentos": salvar um, apagar com o lixinho e usar "Limpar tudo". Orçamentos salvos pela V3 continuam abrindo.
7. WhatsApp: confira o `href` e os emojis no texto com `evaluate_script`, sem clicar.
8. PDF: clicar gera o arquivo.
9. Em 375px, nenhum campo dá zoom e não há rolagem horizontal.
10. "Compartilhar orçamento para: Cliente" (padrão) não mostra custos, lucro nem taxas; leva nome do cliente, prazo, validade, observações e os dados/logo da loja. "Mim (completo)" é igual à V3.
