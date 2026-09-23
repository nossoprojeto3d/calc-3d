# Nosso Projeto 3D — Calculadora

Calculadora gratuita de preço para impressão 3D (filamento): material, energia,
desgaste da máquina, mão de obra, embalagem, taxas da Shopee e do Mercado Livre,
frete, impostos e lucro. Gera o orçamento pronto para o WhatsApp e em PDF.

Publicada em **https://nossoprojeto3d.github.io/calc-3d/**, com a mesma identidade
visual do [site](https://nossoprojeto3d.github.io/site/) e do
[catálogo](https://nossoprojeto3d.github.io/catalogo/).

HTML + CSS + JavaScript puro: sem build, sem dependências e sem servidor.

---

## Estrutura

```
calc-3d/
├── index.html          → estrutura da página e modais
├── style.css           → identidade visual (tokens de cor, tipografia, componentes)
├── script.js           → dados, cálculo, histórico, WhatsApp/PDF e interações
├── manifest.json       → app instalável (PWA)
├── service-worker.js   → cache offline (rede primeiro para os arquivos do app)
└── assets/             → logo, favicon e ícones do app
```

### Onde editar os dados

No topo do `script.js`:

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

## O que fica salvo no aparelho (localStorage)

Nada é enviado para servidor nenhum. Ficam salvos no navegador de quem usa:
os orçamentos em "Meus orçamentos", as Configurações da loja, o tema, o modo
(Básico/Profissional) e a potência da "Outra impressora". Cada vez que a página
é aberta, a calculadora começa com um cálculo novo.

## Segurança

- Content Security Policy no `index.html`: só roda script do próprio site, do
  cdnjs (gerador de PDF) e das estatísticas da Cloudflare.
- O jsPDF é carregado só no primeiro clique em "PDF", com verificação de
  integridade (SRI). **Ao trocar a versão do jsPDF, atualize `JSPDF_SRI`** no
  `script.js` (o hash oficial está em cdnjs.com).
- Todo texto digitado que aparece na tela ou no histórico passa por escape.

## Publicar uma atualização

Basta enviar as alterações para a branch `main`: o GitHub Pages publica sozinho
em 1 ou 2 minutos. O service worker busca os arquivos do app na rede primeiro,
então quem já usa recebe a versão nova sem precisar limpar o cache. Ao mudar
ícones ou imagens, troque o `CACHE_NAME` no `service-worker.js`.

## Versões salvas (tags do Git)

- `estavel-2026-09-23`: V1, paleta violeta/ciano original
- `backup-tons-dourados`: V2, preto e dourado
