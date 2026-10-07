# Calculadora 3D (calc-3d)

Calculadora de preço para impressão 3D, publicada no GitHub Pages: https://nossoprojeto3d.github.io/calc-3d/
Todo push na `main` vai direto pro ar. Hoje é HTML, CSS e JS puros, sem build e sem dependências; libs e frameworks gratuitos podem entrar. Instalável como PWA.

O README.md explica a fórmula de preço e onde ficam os dados. Leia-o antes de mexer no cálculo.

## Arquivos

- `index.html`: estrutura e modais. A Content Security Policy está aqui.
- `style.css`: identidade visual (tokens de cor, tipografia, componentes).
- `script.js` (~3000 linhas): dados no topo (`PRINTERS`, `MATERIALS`, `PRO_COSTS`, `SHOPEE_DEFAULT_TIERS`, `MELI_DEFAULT_SETTINGS`), cálculo, histórico, WhatsApp e PDF.
- `service-worker.js`: cache offline, com a rede primeiro para os arquivos do app.
- `medicao.js`: Google Analytics 4 com aviso de cookies. É o mesmo arquivo em todos os projetos; se mudar aqui, avisar que precisa copiar pros outros.

## Regras

- Nada vai para servidor: orçamentos, configurações, tema e modo ficam no `localStorage`. Cada abertura começa com um cálculo novo.
- Imposto e taxas de marketplace incidem sobre o **preço final**: `preço = (custos + lucro + taxa fixa) ÷ (1 − comissão − imposto)`. Não mude a fórmula sem o usuário pedir.
- As taxas da Shopee e do Mercado Livre mudam com o tempo. Antes de alterar, confirme as regras atuais no site oficial e cite a fonte.
- O jsPDF é carregado do cdnjs só no primeiro clique em "PDF", com SRI. Ao trocar a versão, atualize `JSPDF_SRI` no `script.js`.
- Se adicionar um script ou domínio externo, atualize a CSP no `index.html`.
- Todo texto digitado que aparece na tela passa por escape. Mantenha isso.
- Os campos precisam ter fonte de pelo menos 16px, para o iPhone não dar zoom automático.
- Emojis na mensagem do WhatsApp já quebraram. Teste a codificação do texto ao mexer nela.

## Imagens

- Ficam em `assets/`: `logo.png`, `favicon.png` e os ícones do app `icon-192.png` e `icon-512.png` (PNG, quadrados).
- **Ao mudar ícones ou imagens, troque o `CACHE_NAME` no `service-worker.js`** (hoje `np3d-calc-v3.2`), senão quem já usa continua vendo a antiga.

## Versões salvas

As tags `estavel-2026-09-23` (V1, violeta/ciano) e `backup-tons-dourados` (V2, preto e dourado) são versões históricas. Não apague sem perguntar.

## Roteiro de teste

Usado pelo `/conferir-site`, no celular e no desktop:

1. A página abre sem erros no console e sem violações de CSP.
2. Modo Básico: escolher impressora e filamento, preencher gramas e horas. O preço aparece e confere com a fórmula do README (refaça a conta).
3. Modo Profissional: ligar desgaste, mão de obra e embalagem. O preço sobe de acordo.
4. Shopee e Mercado Livre: o preço final cobre a comissão (preço × (1 − comissão − imposto) ≈ custos + lucro + taxa fixa).
5. Arredondamento para ",99" funciona.
6. "Meus orçamentos": salvar um, apagar com o lixinho e usar "Limpar tudo".
7. WhatsApp: confira o `href` e os emojis no texto com `evaluate_script`, sem clicar.
8. PDF: clicar gera o arquivo, ou seja, o jsPDF carrega sem erro de SRI.
9. Em 375px, nenhum campo dá zoom e não há rolagem horizontal.
