// Recolore o logo dourado da Nosso Projeto 3D na cor da identidade da calculadora (violeta).
// Lê os originais de scripts/logo-dourado/ e grava em public/assets/.
// Cada pixel dourado vira a cor nova com o mesmo brilho (mantém o efeito metálico
// e as bordas suaves); o fundo escuro dos ícones vira o grafite do app.
// Uso: node scripts/recolorir-logo.mjs
import sharp from "sharp";

const ARQUIVOS = ["logo.png", "favicon.png", "icon-192.png", "icon-512.png"];

// escala da cor por brilho: sombra, tom principal (#A48BFF) e reflexo.
// Pra trocar a identidade de novo, mude só estas três cores.
const ESCURO = [44, 26, 110];
const MEIO = [164, 139, 255];
const CLARO = [240, 234, 255];
const GRAFITE = [12, 14, 17]; // --bg do tema escuro

const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function corPorBrilho(t) {
  return t < 0.55 ? lerp(ESCURO, MEIO, t / 0.55) : lerp(MEIO, CLARO, (t - 0.55) / 0.45);
}

for (const nome of ARQUIVOS) {
  const { data, info } = await sharp(new URL(`./logo-dourado/${nome}`, import.meta.url).pathname)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // brilho do pixel dourado mais claro: vira o reflexo da cor
  let maxL = 1;
  for (let i = 0; i < data.length; i += 4) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (data[i + 3] > 0 && l > maxL) maxL = l;
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    // quanto do pixel é "dourado" (as bordas suaves sobre o fundo escuro são parciais)
    const peso = Math.min(Math.max((sat - 0.12) / 0.25, 0), 1) * Math.min(Math.max((max - 18) / 40, 0), 1);
    const cor = corPorBrilho(Math.min(l / maxL, 1));
    // fundo escuro: troca o preto quente pelo grafite do app, mantendo a variação
    const fundo = lerp(GRAFITE, [r, g, b], Math.min(max / 255, 1) * 0.6);
    const out = lerp(fundo, cor, peso);
    data[i] = Math.round(out[0]);
    data[i + 1] = Math.round(out[1]);
    data[i + 2] = Math.round(out[2]);
  }

  await sharp(data, { raw: info }).png({ compressionLevel: 9 })
    .toFile(new URL(`../public/assets/${nome}`, import.meta.url).pathname);
  console.log(`recolorido: ${nome} (${info.width}x${info.height})`);
}
