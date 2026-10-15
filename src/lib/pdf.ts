/* =========================================================
   PDF DO ORÇAMENTO
   O jsPDF agora vem junto com o app (pacote npm), carregado só no primeiro
   clique em "PDF". Funciona offline e não depende mais de CDN.
   Dois PDFs com o mesmo estilo: o completo (igual à V3) e o do cliente.
   ========================================================= */

import { brl, buildStoreSignatureLine, formatDuration, formatGrams, piecesLabel, type CalcResult, type StoreSettings } from "./calc";
import { formatDate, type ClientDetails } from "./cliente";

function slugify(text: string) {
  const slug = (text || "")
    .toString()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "orcamento";
}

export function exportFileBaseName(r: CalcResult) {
  return `orcamento-${slugify(r.jobName)}-${r.calculatedAt.toISOString().slice(0, 10)}`;
}

function loadImageAsDataURL(src: string) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem."));
    img.src = src;
  });
}

// ---------------------------------------------------------
// ESTILO COMUM DOS PDFs (completo e do cliente)
// Faixa grafite no topo com fio violeta, seções com título violeta e linha,
// linhas "rótulo ... valor", cartão violeta com o preço e assinatura no fim.
// ---------------------------------------------------------
type Doc = InstanceType<typeof import("jspdf").jsPDF>;

function imageSize(dataUrl: string) {
  return new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Logo inválido."));
    img.src = dataUrl;
  });
}

const MARGIN_X = 18;
const CREDIT = "Orçamento feito com a calculadora Nosso Projeto 3D";
const CREDIT_URL = "https://nossoprojeto3d.github.io/calc-3d/";

async function createPdf(header: { title: string; subtitle: string; logo: string | null; logoOnTile?: boolean }) {
  const { jsPDF } = await import("jspdf");
  const doc: Doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(12, 14, 17);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setFillColor(164, 139, 255);
  doc.rect(0, 30, pageWidth, 1.2, "F");

  let textX = MARGIN_X;
  if (header.logo) {
    try {
      const { w, h } = await imageSize(header.logo);
      if (header.logoOnTile) {
        // logo da loja num quadradinho claro: aparece bem sobre o grafite, seja qual for a cor
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(MARGIN_X, 6, 18, 18, 2.5, 2.5, "F");
        const scale = Math.min(15 / w, 15 / h);
        doc.addImage(header.logo, "PNG", MARGIN_X + 9 - (w * scale) / 2, 15 - (h * scale) / 2, w * scale, h * scale, undefined, "FAST");
        textX = MARGIN_X + 23;
      } else {
        const scale = Math.min(16 / w, 16 / h);
        doc.addImage(header.logo, "PNG", MARGIN_X, 7, w * scale, h * scale, undefined, "FAST");
        textX = MARGIN_X + 20;
      }
    } catch { /* segue sem o logo */ }
  }

  doc.setTextColor(236, 238, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(header.title, textX, 15, { maxWidth: pageWidth - textX - MARGIN_X });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(163, 170, 180);
  doc.text(header.subtitle, textX, 21);

  let y = 44;
  const contentW = pageWidth - MARGIN_X * 2;

  const api = {
    doc,
    get y() { return y; },
    gap(mm: number) { y += mm; },
    /** nome da peça e a data em que o orçamento foi gerado */
    title(jobName: string, at: Date) {
      doc.setTextColor(18, 21, 26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const lines = doc.splitTextToSize(jobName, contentW);
      doc.text(lines, MARGIN_X, y);
      y += 7 * lines.length;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 125);
      doc.text(`Gerado em ${at.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}`, MARGIN_X, y);
      y += 10;
    },
    section(title: string) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(91, 63, 217);
      doc.text(title.toUpperCase(), MARGIN_X, y);
      y += 1.5;
      doc.setDrawColor(226, 229, 234);
      doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);
      y += 6;
    },
    row(label: string, value: string) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(75, 82, 93);
      doc.text(label, MARGIN_X, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(18, 21, 26);
      doc.text(String(value), pageWidth - MARGIN_X, y, { align: "right" });
      y += 6.5;
    },
    paragraph(text: string) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(18, 21, 26);
      const lines = doc.splitTextToSize(text, contentW);
      doc.text(lines, MARGIN_X, y);
      y += 5.2 * lines.length + 1.3;
    },
    /** cartão do preço; "side" (opcional) vai à direita, ex.: o preço por peça ao lado do total */
    priceCard(label: string, value: number, side?: { label: string; value: number }) {
      doc.setFillColor(240, 236, 255);
      doc.roundedRect(MARGIN_X, y, contentW, 20, 3, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(107, 114, 125);
      doc.text(label, MARGIN_X + 6, y + 8);
      if (side) doc.text(side.label, pageWidth - MARGIN_X - 6, y + 8, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(91, 63, 217);
      doc.text(brl(value), MARGIN_X + 6, y + 16);
      if (side) {
        doc.setFontSize(13);
        doc.setTextColor(75, 82, 93);
        doc.text(brl(side.value), pageWidth - MARGIN_X - 6, y + 16, { align: "right" });
      }
      y += 30;
    },
    /** assinatura da loja (se houver) + divulgação da calculadora, com link */
    footer(signature: string) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(140, 146, 156);
      if (signature) {
        doc.text(signature, MARGIN_X, y, { maxWidth: contentW });
        y += 6;
      }
      doc.text(CREDIT, MARGIN_X, y);
      doc.link(MARGIN_X, y - 3.5, doc.getTextWidth(CREDIT), 4.5, { url: CREDIT_URL });
    },
  };
  return api;
}

const storeSignature = (settings: StoreSettings) => buildStoreSignatureLine(settings).replace(/^🏪\s*/, "");

/** PDF completo (pra quem faz o orçamento): todos os custos e o lucro, igual à V3. */
export async function exportPdf(r: CalcResult, settings: StoreSettings) {
  let logo: string | null = null;
  try { logo = await loadImageAsDataURL(`${import.meta.env.BASE_URL}assets/logo.png`); } catch { /* sem logo */ }
  const pdf = await createPdf({ title: "Nosso Projeto 3D", subtitle: "Orçamento de impressão 3D", logo });

  pdf.title(r.jobName, r.calculatedAt);

  pdf.section("Impressora e material");
  pdf.row("Impressora", r.printerName);
  pdf.row("Material", r.materialName);
  pdf.gap(4);

  const plate = r.quantity > 1;
  pdf.section("Tempo e peso");
  if (plate) {
    pdf.row("Peças na mesa", String(r.quantity));
    pdf.row("Tempo da mesa", `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`);
    pdf.row("Peso da mesa", `${formatGrams(r.grams)} g`);
    pdf.row("Por peça", `${formatDuration(r.pieceMinutes)} · ${formatGrams(r.pieceGrams)} g`);
  } else {
    pdf.row("Tempo de impressão", `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`);
    pdf.row("Peso do filamento", `${r.grams.toLocaleString("pt-BR")} g`);
  }
  pdf.gap(4);

  pdf.section(plate ? "Breakdown de custos por peça" : "Breakdown de custos");
  pdf.row("Filamento", brl(r.filamentCost));
  pdf.row("Energia", brl(r.energyCost));
  if (r.proMode) {
    r.proCosts.forEach((c) => {
      const label = c.id === "meli" ? `${c.label} (${c.adType === "classico" ? "Clássico" : "Premium"})`
        : plate && c.id === "labor" ? `${c.label} (preparo da mesa ÷ ${r.quantity})` : c.label;
      pdf.row(label, brl(c.value));
    });
  }
  pdf.row("Custo total", brl(r.totalCost));
  pdf.row("Lucro", brl(r.profit));
  pdf.gap(4);

  if (plate) pdf.priceCard("Preço por peça sugerido", r.finalPrice, { label: `Total (${piecesLabel(r.quantity)})`, value: r.plateTotal });
  else pdf.priceCard("Preço final sugerido", r.finalPrice);
  pdf.footer(storeSignature(settings));

  pdf.doc.save(`${exportFileBaseName(r)}.pdf`);
}

// ---------------------------------------------------------
// PDF PARA O CLIENTE
// Layout próprio, mais limpo que o completo: página branca com a marca da
// loja no topo, a foto da peça em destaque (se houver), os detalhes numa
// grade, o preço num cartão branco com borda violeta e a assinatura da loja no rodapé.
// Só o que interessa pra quem compra: nunca custos, lucro nem taxas.
// ---------------------------------------------------------
const INK: RGB = [18, 21, 26];
const INK_2: RGB = [75, 82, 93];
const INK_3: RGB = [120, 127, 138];
const LINE: RGB = [226, 229, 234];
const VIOLET: RGB = [123, 92, 250];
const VIOLET_DARK: RGB = [91, 63, 217];
const VIOLET_LIGHT: RGB = [164, 139, 255];
type RGB = [number, number, number];

/** A fonte padrão do PDF só tem o alfabeto latino: emojis e símbolos viram lixo, então saem. */
const pdfText = (s: string) =>
  s.replace(/[^\n\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/gu, "")
    .replace(/[ \t]{2,}/g, " ").replace(/ ([,.;:!?])/g, "$1").replace(/[ \t]+$/gm, "").trim();

/**
 * Foto com cantos arredondados e no tamanho certo pro PDF (o jsPDF não
 * recorta imagens): desenha num canvas com fundo branco e devolve JPEG.
 */
async function roundedPhoto(dataUrl: string, wMm: number, hMm: number, radiusMm: number) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Foto inválida."));
    i.src = dataUrl;
  });
  const pxPerMm = Math.min(9, img.naturalWidth / wMm); // ~230 dpi, sem ampliar a foto
  const w = Math.round(wMm * pxPerMm);
  const h = Math.round(hMm * pxPerMm);
  const r = radiusMm * pxPerMm;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function exportClientPdf(r: CalcResult, d: ClientDetails, settings: StoreSettings, logo: string | null, photo: string | null = null) {
  const { jsPDF } = await import("jspdf");
  const doc: Doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = MARGIN_X;
  const contentW = W - M * 2;
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold", size: number, c: RGB) => { doc.setFont("helvetica", style); doc.setFontSize(size); color(c); };
  /** rótulo pequeno em maiúsculas, espaçado */
  const caption = (text: string, x: number, y: number, c: RGB = INK_3) => {
    font("bold", 7.5, c);
    doc.text(text.toUpperCase(), x, y, { charSpace: 0.35 });
  };

  const storeName = pdfText(settings.storeName);
  const clientName = pdfText(d.clientName);
  const notes = pdfText(d.notes);
  const signature = pdfText(storeSignature(settings));
  const plate = r.quantity > 1;

  // ---- faixa violeta fina no topo
  doc.setFillColor(VIOLET[0], VIOLET[1], VIOLET[2]);
  doc.rect(0, 0, W, 2.2, "F");

  // ---- cabeçalho: logo + nome da loja à esquerda, "Orçamento" + data à direita
  let textX = M;
  if (logo) {
    try {
      const { w, h } = await imageSize(logo);
      const scale = Math.min(18 / w, 18 / h);
      doc.addImage(logo, "PNG", M + 9 - (w * scale) / 2, 25 - (h * scale) / 2, w * scale, h * scale, undefined, "FAST");
      textX = M + 23;
    } catch { /* segue sem o logo */ }
  }
  font("bold", 15, INK);
  doc.text(storeName || "Orçamento", textX, 23.5, { maxWidth: W - M - 60 - textX });
  font("normal", 9.5, INK_3);
  doc.text("Impressão 3D sob medida", textX, 29.5);

  const right = W - M;
  font("bold", 7.5, VIOLET_DARK);
  const tag = "ORÇAMENTO";
  doc.text(tag, right - doc.getTextWidth(tag) - 0.35 * (tag.length - 1), 22.5, { charSpace: 0.35 });
  font("normal", 9.5, INK_2);
  doc.text(r.calculatedAt.toLocaleDateString("pt-BR", { dateStyle: "long" }), right, 28.5, { align: "right" });

  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.25);
  doc.line(M, 40, right, 40);

  // ---- cliente e peça: rótulo pequeno + nome em negrito
  let y = 53;
  const field = (label: string, value: string) => {
    caption(label, M, y);
    font("bold", 12, INK);
    const lines: string[] = doc.splitTextToSize(value, contentW).slice(0, 2);
    doc.text(lines, M, y + 6);
    y += 15 + 5 * (lines.length - 1);
  };
  if (clientName) field("Cliente", clientName);
  field("Peça", pdfText(r.jobName) || "Peça personalizada");
  y -= 2; // 7mm do nome da peça até a foto ou a grade

  // ---- grade de detalhes (medida antes, pra saber quanto sobra pra foto)
  const cells: { k: string; v: string }[] = [{ k: "Material", v: pdfText(r.materialName) }];
  if (plate) cells.push({ k: "Quantidade", v: piecesLabel(r.quantity) });
  const delivery = pdfText(d.deliveryTime);
  if (delivery) cells.push({ k: "Prazo de entrega", v: delivery });
  if (d.validUntil) cells.push({ k: "Válido até", v: formatDate(d.validUntil) });
  const cellW = contentW / cells.length;
  font("bold", 11, INK);
  const cellLines = cells.map((c) => (doc.splitTextToSize(c.v, cellW - 10) as string[]).slice(0, 2));
  const gridH = 17 + 5 * (Math.max(...cellLines.map((l) => l.length)) - 1);

  font("normal", 10.5, INK_2);
  const noteLines: string[] = notes ? doc.splitTextToSize(notes, contentW - 6) : [];
  const notesH = notes ? 7 + 5.2 * noteLines.length + 8 : 0;

  const priceH = 30;
  font("normal", 8.5, INK_3);
  const sigLines: string[] = signature ? doc.splitTextToSize(signature, contentW) : [];
  const footerTop = H - 14 - 4.2 * sigLines.length;

  // ---- foto da peça: o maior tamanho que couber, sem cortar
  if (photo) {
    try {
      const { w, h } = await imageSize(photo);
      const available = footerTop - 8 - y - 9 - gridH - 9 - notesH - priceH;
      const maxH = Math.max(45, Math.min(118, available));
      let pw = contentW;
      let ph = (pw * h) / w;
      if (ph > maxH) { ph = maxH; pw = (ph * w) / h; }
      const px = M + (contentW - pw) / 2;
      doc.addImage(await roundedPhoto(photo, pw, ph, 3.5), "JPEG", px, y, pw, ph, undefined, "FAST");
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.roundedRect(px, y, pw, ph, 3.5, 3.5, "S");
      y += ph + 9;
    } catch { /* segue sem a foto */ }
  }

  // ---- detalhes
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(M, y, contentW, gridH, 2.5, 2.5, "S");
  cells.forEach((c, i) => {
    const x = M + cellW * i;
    if (i > 0) doc.line(x, y + 4, x, y + gridH - 4);
    caption(c.k, x + 5, y + 7);
    font("bold", 11, INK);
    doc.text(cellLines[i], x + 5, y + 12.8);
  });
  y += gridH + 9;

  // ---- observações, com fio violeta à esquerda
  if (notes) {
    caption("Observações", M, y, VIOLET_DARK);
    doc.setFillColor(VIOLET_LIGHT[0], VIOLET_LIGHT[1], VIOLET_LIGHT[2]);
    doc.rect(M, y + 3.2, 0.8, 5.2 * noteLines.length + 0.6, "F");
    font("normal", 10.5, INK_2);
    doc.text(noteLines, M + 5, y + 7.4);
    y += notesH;
  }

  // ---- preço: cartão branco com borda violeta
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(VIOLET[0], VIOLET[1], VIOLET[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(M, y, contentW, priceH - 6, 3, 3, "FD");
  doc.setLineWidth(0.25);
  caption(plate ? "Valor total" : "Valor", M + 7, y + 8.5);
  font("bold", 22, VIOLET_DARK);
  doc.text(brl(plate ? r.plateTotal : r.finalPrice), M + 7, y + 18);
  if (plate) {
    font("normal", 9, INK_3);
    doc.text(`Valor por peça (${piecesLabel(r.quantity)})`, right - 7, y + 8.5, { align: "right" });
    font("bold", 13, INK);
    doc.text(brl(r.finalPrice), right - 7, y + 17.5, { align: "right" });
  }

  // ---- rodapé fixo no pé da página
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.line(M, footerTop, right, footerTop);
  let fy = footerTop + 6;
  if (sigLines.length) {
    font("normal", 8.5, INK_2);
    doc.text(sigLines, M, fy);
    fy += 4.2 * sigLines.length + 1;
  }
  font("normal", 7.5, INK_3);
  doc.text(CREDIT, M, fy);
  doc.link(M, fy - 3, doc.getTextWidth(CREDIT), 4, { url: CREDIT_URL });

  const who = d.clientName ? `-${slugify(d.clientName)}` : "";
  doc.save(`orcamento-${slugify(r.jobName)}${who}-${r.calculatedAt.toISOString().slice(0, 10)}.pdf`);
}
