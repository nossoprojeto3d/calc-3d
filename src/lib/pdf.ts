/* =========================================================
   PDF DO ORÇAMENTO
   O jsPDF agora vem junto com o app (pacote npm), carregado só no primeiro
   clique em "PDF". Funciona offline e não depende mais de CDN.
   Mesmo conteúdo da V3, com as cores da identidade nova.
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

export async function exportPdf(r: CalcResult, settings: StoreSettings) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  let y: number;

  // faixa grafite no topo, com o logo e um fio verde
  doc.setFillColor(12, 14, 17);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setFillColor(47, 211, 154);
  doc.rect(0, 30, pageWidth, 1.2, "F");

  try {
    const logo = await loadImageAsDataURL(`${import.meta.env.BASE_URL}assets/logo.png`);
    doc.addImage(logo, "PNG", marginX, 7, 16, 16);
  } catch { /* segue sem o logo */ }

  doc.setTextColor(236, 238, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Nosso Projeto 3D", marginX + 20, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(163, 170, 180);
  doc.text("Orçamento de impressão 3D", marginX + 20, 21);

  y = 44;
  doc.setTextColor(18, 21, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(r.jobName, pageWidth - marginX * 2);
  doc.text(titleLines, marginX, y);

  y += 7 * titleLines.length;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 125);
  const dateLabel = r.calculatedAt.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  doc.text(`Gerado em ${dateLabel}`, marginX, y);
  y += 10;

  const drawSectionTitle = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(10, 122, 85);
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.5;
    doc.setDrawColor(226, 229, 234);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  };

  const drawRow = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(75, 82, 93);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(18, 21, 26);
    doc.text(String(value), pageWidth - marginX, y, { align: "right" });
    y += 6.5;
  };

  drawSectionTitle("Impressora e material");
  drawRow("Impressora", r.printerName);
  drawRow("Material", r.materialName);
  y += 4;

  drawSectionTitle("Tempo e peso");
  drawRow("Tempo de impressão", `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`);
  drawRow("Peso do filamento", `${r.grams.toLocaleString("pt-BR")} g`);
  y += 4;

  drawSectionTitle("Breakdown de custos");
  drawRow("Filamento", brl(r.filamentCost));
  drawRow("Energia", brl(r.energyCost));
  if (r.proMode) {
    r.proCosts.forEach((c) => {
      const label = c.id === "meli" ? `${c.label} (${c.adType === "classico" ? "Clássico" : "Premium"})` : c.label;
      drawRow(label, brl(c.value));
    });
  }
  drawRow("Custo total", brl(r.totalCost));
  drawRow("Lucro", brl(r.profit));
  y += 4;

  // preço final em destaque
  doc.setFillColor(228, 249, 240);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 20, 3, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(107, 114, 125);
  doc.text("Preço final sugerido", marginX + 6, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(10, 122, 85);
  doc.text(brl(r.finalPrice), marginX + 6, y + 16);
  y += 30;

  const signature = buildStoreSignatureLine(settings).replace(/^🏪\s*/, "");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(140, 146, 156);
  if (signature) {
    doc.text(signature, marginX, y);
    y += 6;
  }
  doc.text("Orçamento gerado com a calculadora Nosso Projeto 3D, gratuita e feita para a comunidade 3D.", marginX, y, { maxWidth: pageWidth - marginX * 2 });

  doc.save(`${exportFileBaseName(r)}.pdf`);
}

// ---------------------------------------------------------
// PDF PARA O CLIENTE
// Só o que interessa pra quem compra, com a marca da loja (logo, nome e
// contatos). Visual neutro (cinzas), pra combinar com qualquer marca.
// Sem custos, lucro nem taxas.
// ---------------------------------------------------------
function imageSize(dataUrl: string) {
  return new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Logo inválido."));
    img.src = dataUrl;
  });
}

export async function exportClientPdf(r: CalcResult, d: ClientDetails, settings: StoreSettings, logo: string | null) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 20;
  const contentW = pageWidth - marginX * 2;
  let y = 22;

  // cabeçalho da loja: logo + nome + contatos (o que estiver preenchido)
  const storeName = settings.storeName.trim();
  const contacts = [settings.city, settings.whatsapp, settings.instagram].map((x) => (x || "").trim()).filter(Boolean).join("  ·  ");
  let textX = marginX;
  let headerH = 0;
  if (logo) {
    try {
      const { w, h } = await imageSize(logo);
      const maxH = 22;
      const maxW = 44;
      const scale = Math.min(maxH / h, maxW / w);
      doc.addImage(logo, "PNG", marginX, y - 6, w * scale, h * scale, undefined, "FAST");
      textX = marginX + w * scale + 6;
      headerH = h * scale;
    } catch { /* segue sem o logo */ }
  }
  if (storeName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 21, 26);
    doc.text(storeName, textX, y + (logo ? 2 : 0));
  }
  if (contacts) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(107, 114, 125);
    doc.text(contacts, textX, y + (storeName ? 8 : 0) + (logo ? 2 : 0), { maxWidth: pageWidth - marginX - textX });
  }
  if (logo || storeName || contacts) {
    y += Math.max(headerH, storeName && contacts ? 12 : 6) + 4;
    doc.setDrawColor(226, 229, 234);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 12;
  }

  // título
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 125);
  doc.text("ORÇAMENTO", marginX, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(18, 21, 26);
  const title = doc.splitTextToSize(r.jobName, contentW);
  doc.text(title, marginX, y);
  y += 8 * title.length + 4;

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(107, 114, 125);
    doc.text(label, marginX, y);
    doc.setTextColor(18, 21, 26);
    const lines = doc.splitTextToSize(value, contentW - 45);
    doc.text(lines, marginX + 45, y);
    y += 7 * lines.length;
  };
  if (d.clientName) row("Para", d.clientName);
  row("Data", formatDate(r.calculatedAt));
  row("Material", r.materialName);
  if (d.deliveryTime) row("Prazo de entrega", d.deliveryTime);
  y += 6;

  // valor em destaque
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(marginX, y, contentW, 26, 3, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(107, 114, 125);
  doc.text("Valor", marginX + 7, y + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(18, 21, 26);
  doc.text(brl(r.finalPrice), marginX + 7, y + 20);
  if (d.validUntil) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 125);
    doc.text(`Válido até ${formatDate(d.validUntil)}`, pageWidth - marginX - 7, y + 20, { align: "right" });
  }
  y += 36;

  if (d.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(18, 21, 26);
    doc.text("Observações", marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 82, 93);
    doc.text(doc.splitTextToSize(d.notes, contentW), marginX, y);
  }

  const who = d.clientName ? `-${slugify(d.clientName)}` : "";
  doc.save(`orcamento-${slugify(r.jobName)}${who}-${r.calculatedAt.toISOString().slice(0, 10)}.pdf`);
}
