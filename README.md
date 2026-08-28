# Nosso Projeto 3D — Calculadora (V1 Básica)

Calculadora de precificação para impressão 3D, feita para a comunidade **Bambu Lab**.
Essa é a **V1**, com o fluxo básico de orçamento — impressora, material, tempo,
filamento, energia e margem de lucro — pronta para validação antes da versão
completa (histórico, modo profissional, importação de `.3MF`, PDF, dashboard e PWA).

100% HTML + CSS + JavaScript puro. Sem build, sem dependências, sem servidor
— funciona abrindo o `index.html` direto no navegador ou publicado no GitHub Pages.

---

## Estrutura do projeto

```
calc-bambu-v1/
├── index.html          → estrutura da página
├── style.css           → identidade visual (paleta, tipografia, componentes)
├── script.js           → lógica de cálculo, impressoras/materiais e interações
├── manifest.json        → configuração do app instalável (PWA)
├── service-worker.js    → cache offline e habilita o botão "instalar"
├── assets/
│   ├── logo.png          → logo usada no cabeçalho
│   ├── favicon.png       → ícone da aba do navegador
│   ├── icon-192.png      → ícone do app instalado (Android/desktop)
│   └── icon-512.png      → ícone do app instalado (tela cheia/splash)
└── README.md            → este arquivo
```

Os dados de impressoras e materiais Bambu Lab ficam no topo do `script.js`,
nos arrays `PRINTERS` e `MATERIALS` — dá pra editar preços, adicionar ou
remover itens direto ali, sem precisar mexer no resto do código.

---

## Instalar como aplicativo (PWA)

O site tem um botão de instalar no cabeçalho (ícone de seta pra baixo).

- **Android / Chrome / Edge**: o botão aparece sozinho quando o navegador
  detecta que o app pode ser instalado. Basta tocar nele.
- **iPhone / iPad (Safari)**: a Apple não permite instalar direto por um
  botão — ao tocar, aparece um passo a passo explicando como usar o
  "Compartilhar → Adicionar à Tela de Início".

⚠️ **Importante**: isso só funciona quando o site está publicado com HTTPS
(como acontece automaticamente no GitHub Pages). Abrindo o `index.html`
direto do computador (`file://`), o navegador não oferece a opção de
instalar — é só pra isso que existe o passo de publicação abaixo.

---

## Rodando localmente

Não precisa de nada instalado. Basta baixar os 3 arquivos (mantendo eles na
mesma pasta) e dar duplo clique no `index.html`. Ele abre no seu navegador
padrão e funciona offline.

---

## Publicando no GitHub Pages (deixa o link online pra compartilhar)

### 1. Criar o repositório
1. Acesse [github.com](https://github.com) e faça login (ou crie uma conta gratuita).
2. Clique no botão **+** no canto superior direito → **New repository**.
3. Dê um nome, por exemplo `calc-bambu` (pode ser qualquer nome, sem espaços).
4. Deixe como **Public** (obrigatório para o GitHub Pages gratuito funcionar).
5. Clique em **Create repository**.

### 2. Subir os arquivos
1. Na página do repositório recém-criado, clique em **uploading an existing file**
   (ou **Add file → Upload files**).
2. Arraste os arquivos `index.html`, `style.css`, `script.js` e `README.md`
   para a área de upload.
3. Role até o final da página e clique em **Commit changes**.

### 3. Ativar o GitHub Pages
1. No repositório, vá em **Settings** (aba no topo).
2. No menu lateral, clique em **Pages**.
3. Em **Branch**, selecione `main` e a pasta `/ (root)`, depois clique **Save**.
4. Aguarde 1 a 2 minutos — o GitHub vai gerar o link automaticamente.

### 4. Pegar o link e compartilhar
Ainda na tela **Settings → Pages**, vai aparecer uma mensagem verde do tipo:

```
Your site is live at https://SEU-USUARIO.github.io/calc-bambu/
```

Esse é o link final. Copie e compartilhe com quem quiser — qualquer pessoa
que abrir esse endereço vai ver a calculadora funcionando, sem precisar
instalar nada. Toda vez que você subir uma atualização de arquivo no
repositório, o mesmo link já reflete a nova versão automaticamente
(pode levar 1-2 minutos para atualizar).

---

## Roadmap (V2 — ainda não incluído nesta versão)

- Modo profissional (desgaste de máquina, mão de obra, embalagem, impostos etc.)
- Histórico de orçamentos e exportação em CSV
- Importação automática de arquivos `.3MF`
- Geração de PDF do orçamento
- Dashboard financeiro
- Instalação como app (PWA) com funcionamento offline completo
