/* =========================================================
   PDF DO ORÇAMENTO
   O jsPDF agora vem junto com o app (pacote npm), carregado só no primeiro
   clique em "PDF". Funciona offline e não depende mais de CDN.
   Dois PDFs com o mesmo estilo: o completo (igual à V3) e o do cliente.
   ========================================================= */

import { brl, buildStoreSignatureLine, type CalcResult, type StoreSettings } from "./calc";
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
    priceCard(label: string, value: number) {
      doc.setFillColor(240, 236, 255);
      doc.roundedRect(MARGIN_X, y, contentW, 20, 3, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(107, 114, 125);
      doc.text(label, MARGIN_X + 6, y + 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(91, 63, 217);
      doc.text(brl(value), MARGIN_X + 6, y + 16);
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

  pdf.section("Tempo e peso");
  pdf.row("Tempo de impressão", `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`);
  pdf.row("Peso do filamento", `${r.grams.toLocaleString("pt-BR")} g`);
  pdf.gap(4);

  pdf.section("Breakdown de custos");
  pdf.row("Filamento", brl(r.filamentCost));
  pdf.row("Energia", brl(r.energyCost));
  if (r.proMode) {
    r.proCosts.forEach((c) => {
      const label = c.id === "meli" ? `${c.label} (${c.adType === "classico" ? "Clássico" : "Premium"})` : c.label;
      pdf.row(label, brl(c.value));
    });
  }
  pdf.row("Custo total", brl(r.totalCost));
  pdf.row("Lucro", brl(r.profit));
  pdf.gap(4);

  pdf.priceCard("Preço final sugerido", r.finalPrice);
  pdf.footer(storeSignature(settings));

  pdf.doc.save(`${exportFileBaseName(r)}.pdf`);
}

/**
 * PDF para o cliente: mesmo estilo do completo, com a marca da loja no topo
 * e só o que interessa pra quem compra. Sem custos, lucro nem taxas.
 */
export async function exportClientPdf(r: CalcResult, d: ClientDetails, settings: StoreSettings, logo: string | null) {
  const storeName = settings.storeName.trim();
  const pdf = await createPdf({
    title: storeName || "Orçamento",
    subtitle: storeName ? "Orçamento de impressão 3D" : "Impressão 3D",
    logo,
    logoOnTile: true,
  });

  pdf.title(r.jobName, r.calculatedAt);

  pdf.section("Detalhes");
  if (d.clientName) pdf.row("Para", d.clientName);
  pdf.row("Material", r.materialName);
  if (d.deliveryTime) pdf.row("Prazo de entrega", d.deliveryTime);
  if (d.validUntil) pdf.row("Validade do orçamento", `até ${formatDate(d.validUntil)}`);
  pdf.gap(4);

  if (d.notes) {
    pdf.section("Observações");
    pdf.paragraph(d.notes);
    pdf.gap(4);
  }

  pdf.priceCard("Preço final", r.finalPrice);
  pdf.footer(storeSignature(settings));

  const who = d.clientName ? `-${slugify(d.clientName)}` : "";
  pdf.doc.save(`orcamento-${slugify(r.jobName)}${who}-${r.calculatedAt.toISOString().slice(0, 10)}.pdf`);
}
