// Gera a imagem que aparece ao compartilhar o link (WhatsApp, Instagram etc.):
// 1200x630, no visual da calculadora (grafite + violeta, logo violeta).
// Uso: node scripts/gerar-imagem-compartilhamento.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;
const saida = new URL("../public/assets/compartilhar.jpg", import.meta.url).pathname;

const fundo = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="brilho" cx="78%" cy="0%" r="70%">
      <stop offset="0" stop-color="#A48BFF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#A48BFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0C0E11"/>
  <rect width="100%" height="100%" fill="url(#brilho)"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#A48BFF"/>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <text x="430" y="220" fill="#A3AAB4" font-size="32" font-weight="500">Nosso Projeto 3D</text>
    <text x="430" y="300" fill="#ECEEF1" font-size="64" font-weight="700" letter-spacing="-1.5">Quanto cobrar pela</text>
    <text x="430" y="374" fill="#ECEEF1" font-size="64" font-weight="700" letter-spacing="-1.5">sua peça<tspan fill="#A48BFF">?</tspan></text>
    <text x="430" y="446" fill="#A3AAB4" font-size="30">Calculadora de impressão 3D. Grátis, sem cadastro.</text>
  </g>
</svg>`);

const logo = await sharp(new URL("../public/assets/logo.png", import.meta.url).pathname)
  .resize({ height: 340 })
  .toBuffer();

await sharp(fundo)
  .composite([{ input: logo, left: 90, top: Math.round((H - 340) / 2) - 5 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(saida);

console.log("gerada:", saida);
