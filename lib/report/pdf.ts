// Client-only helpers to turn a rendered report node into a downloadable PDF or
// a print dialog. Kept out of the component so it stays small and reusable.

const MARGIN = 36; // pt, page margin on all sides

/**
 * Render a report node to a multi-page A4 PDF. Each `[data-block]` element is
 * rasterized independently and flowed onto pages so a block is never split
 * across a page boundary (unless a single block is taller than one page, in
 * which case it is sliced). Falls back to whole-node capture if no blocks.
 */
export async function exportPdf(node: HTMLElement, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  const contentH = pageH - MARGIN * 2;

  const blocks = Array.from(node.querySelectorAll<HTMLElement>("[data-block]"));
  const targets = blocks.length ? blocks : [node];

  const render = (el: HTMLElement) =>
    html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });

  let cursorY = MARGIN;
  let firstPage = true;

  for (const el of targets) {
    const canvas = await render(el);
    const imgW = contentW;
    const imgH = (canvas.height * imgW) / canvas.width;

    // A block taller than a full page: slice it across pages on its own.
    if (imgH > contentH) {
      if (!firstPage) pdf.addPage();
      sliceTall(pdf, canvas, imgW, contentH);
      firstPage = false;
      cursorY = pageH; // force the next block onto a fresh page
      continue;
    }

    // Start a new page if this block won't fit in the remaining space.
    if (!firstPage && cursorY + imgH > pageH - MARGIN) {
      pdf.addPage();
      cursorY = MARGIN;
    }

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", MARGIN, cursorY, imgW, imgH);
    cursorY += imgH + 10; // small gap between blocks
    firstPage = false;
  }

  pdf.save(filename);
}

/** Slice one over-tall canvas down a column of full pages. */
function sliceTall(
  pdf: import("jspdf").jsPDF,
  canvas: HTMLCanvasElement,
  imgW: number,
  contentH: number,
): void {
  const pxPerPt = canvas.width / imgW;
  const pageHpx = contentH * pxPerPt;
  let offset = 0;
  let first = true;
  while (offset < canvas.height) {
    const sliceHpx = Math.min(pageHpx, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHpx;
    const ctx = slice.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, offset, canvas.width, sliceHpx, 0, 0, canvas.width, sliceHpx);
    }
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", MARGIN, MARGIN, imgW, sliceHpx / pxPerPt);
    offset += sliceHpx;
    first = false;
  }
}

/**
 * Print a single node by cloning its markup into a hidden iframe and invoking
 * the browser print dialog. Avoids printing the surrounding app chrome.
 */
export function printNode(node: HTMLElement, title: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html><head><title>${title}</title>` +
      `<meta charset="utf-8" />` +
      `<style>` +
      `@page{margin:16mm;}` +
      `body{margin:0;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `[data-block]{break-inside:avoid;page-break-inside:avoid;}` +
      `</style></head><body>${node.outerHTML}</body></html>`,
  );
  doc.close();

  const win = iframe.contentWindow;
  const cleanup = () =>
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);

  // Give the iframe a tick to lay out images before printing.
  window.setTimeout(() => {
    if (!win) {
      cleanup();
      return;
    }
    win.focus();
    win.print();
    cleanup();
  }, 350);
}
