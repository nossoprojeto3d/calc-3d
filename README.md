# Nosso Projeto 3D — Calculadora

Calculadora gratuita de preço para impressão 3D (filamento): material, energia,
desgaste da máquina, mão de obra, embalagem, taxas da Shopee e do Mercado Livre,
frete, impostos e lucro. Gera o orçamento pronto para o WhatsApp e em PDF.

Publicada em **https://nossoprojeto3d.github.io/calc-3d/**. Funciona sem servidor:
tudo fica no aparelho de quem usa.

V4: Vite + React + TypeScript + Tailwind v4, com identidade própria
("Grafite e Esmeralda") e o logo da Nosso Projeto 3D recolorido em verde.

---

## Rodar no computador

```
npm install
npm run dev        # http://localhost:5173/calc-3d/ (e no celular, pelo IP da rede)
npm run build      # gera a pasta dist/
npm run preview    # serve o dist/ em http://localhost:4173/calc-3d/ (com a CSP ligada)
```

## Estrutura

```
calc-3d/
├── index.html              → casca da página
├── vite.config.ts          → build, CSP e app instalável (PWA)
├── src/
│   ├── lib/data.ts         → impressoras, filamentos, custos PRO e taxas
│   ├── lib/calc.ts         → motor de cálculo (sem tela)
│   ├── lib/form.ts         → comportamentos automáticos do formulário
│   ├── lib/useCalculator.ts→ estado, resultado e "Meus orçamentos"
│   ├── lib/storage.ts      → localStorage
│   ├── lib/pdf.ts          → PDF do orçamento
│   ├── App.tsx, components/→ telas
│   └── styles.css          → identidade visual
├── public/                 → logo, ícones, medicao.js, tema.js
└── tests/                  → testes do cálculo, paridade com a V3 e roteiro e2e
```

### Onde editar os dados

Em `src/lib/data.ts`:

- `PRINTERS`: impressoras agrupadas por marca. `power` é a potência (W) usada no
  cálculo de energia; `avgPurchasePrice` e `avgLifespanHours` alimentam o cálculo
  automático de desgaste. Os valores são médias aproximadas de mercado.
- `MATERIALS`: filamentos agrupados por tipo, com o preço médio por kg (R$).
  O "Outro" fica sempre por último.
- `PRO_COSTS`: custos do modo Profissional (textos de ajuda, atalhos e unidades).
- `SHOPEE_DEFAULT_TIERS` / `MELI_DEFAULT_SETTINGS`: comissões e taxas fixas dos
  marketplaces. Confira as regras atuais de cada um antes de alterar.

## Como o preço é calculado

1. **Filamento** = gramas ÷ 1000 × preço por kg
2. **Energia** = potência (W) ÷ 1000 × horas × valor do kWh
3. **Custos do negócio** (modo Profissional): desgaste, mão de obra, margem de
   falha (% sobre filamento + energia), embalagem e insumos entram na base do lucro.
   O frete é só repassado, sem gerar lucro.
4. **Lucro** = % sobre a base acima, ou um valor fixo
5. **Impostos e taxas de marketplace** incidem sobre o **preço final**:
   `preço = (custos + lucro + taxa fixa) ÷ (1 − comissão − imposto)`
6. **Arredondamento** opcional para o próximo ",99"

Desgaste, Taxa Shopee e Taxa Mercado Livre entram na conta arredondados em
centavos, como na V3.

## Testes

- `npm test`: o motor contra uma amostra de resultados gravados da V3
  (`tests/unit`). Roda também no GitHub Actions antes de publicar.
- `npm run test:e2e`: o roteiro de teste (CLAUDE.md) no iPhone (Safari/WebKit),
  iPhone SE 375px, Android (Chrome), desktop Chrome e desktop Safari. Precisa do
  `npm run preview` rodando.
- `npm run paridade`: compara o motor com a **V3 original** rodando no navegador,
  em 2.000 cenários aleatórios. Antes, sirva a V3 da tag de backup:

  ```
  git worktree add ../calc-3d-v3 backup-pre-redesign-20261007
  cd ../calc-3d-v3 && python3 -m http.server 8765
  ```

## Orçamento completo x orçamento para o cliente

No painel do orçamento, um seletor escolhe o que WhatsApp, Copiar e PDF enviam:

- **Para o cliente** (padrão): só o preço final, com peça, material, prazo de
  entrega, validade, observações e a assinatura da loja (nome, contatos e logo
  no PDF). Nunca mostra custos, lucro ou taxas. Os dados do cliente ficam na
  seção recolhida "Dados para o cliente".
- **Completo**: todos os custos e o lucro, igual à V3.

## O que fica salvo no aparelho (localStorage)

Nada é enviado para servidor nenhum. Ficam salvos no navegador de quem usa:
os orçamentos em "Meus orçamentos", as Configurações da loja (e o logo), o tema, o modo
(Básico/Profissional) e a potência da "Outra impressora". As chaves são as mesmas
da V3, então quem já usava não perde nada. Cada vez que a página é aberta, a
calculadora começa com um cálculo novo.

## Segurança

- Content Security Policy (em `vite.config.ts`, entra no build): só roda script do
  próprio site e das estatísticas (Cloudflare e Google, este só com consentimento).
- O jsPDF vem junto com o app e só carrega no primeiro clique em "PDF".
- Texto digitado é sempre exibido como texto, nunca como HTML.

## Publicar uma atualização

Enviar para a branch `main`: o GitHub Actions roda os testes, gera o build e
publica no GitHub Pages em 1 ou 2 minutos. O service worker é gerado no build e
atualiza sozinho quem já tem o app instalado (a página continua "rede primeiro").

## Versões salvas (tags do Git)

- `estavel-2026-09-23`: V1, paleta violeta/ciano original
- `backup-tons-dourados`: V2, preto e dourado
- `backup-pre-redesign-20261007`: V3, HTML/CSS/JS puros, antes da V4
