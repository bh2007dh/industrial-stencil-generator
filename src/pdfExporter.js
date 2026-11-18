/**
 * Clean 1:1 Millimetre Vector PDF Exporter
 *
 * Converts the exact closed stencil polygons from StencilFont.layoutText()
 * into a print-ready PDF 1.4 vector file (1 mm = 72 / 25.4 pt) containing
 * ONLY the stencil geometry (no extra dimension labels or text annotations).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PdfExporter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MM_TO_PT = 72.0 / 25.4;

  function pt(mm) {
    return (Number(mm) * MM_TO_PT).toFixed(4);
  }

  function generatePdf(layout, options) {
    const opts = Object.assign(
      {
        includePlateBorder: false,
        plateMarginMm: 2.4
      },
      options || {}
    );

    const textW = Math.max(10, layout && layout.totalWidthMm ? layout.totalWidthMm : 71.01);
    const textH = Math.max(4, layout && layout.totalHeightMm ? layout.totalHeightMm : 8.0);
    const marginMm = 15.0;

    const pageWMm = Math.max(100, textW + marginMm * 2);
    const pageHMm = Math.max(40, textH + marginMm * 2);
    const originXMm = (pageWMm - textW) * 0.5;
    const originYMm = (pageHMm - textH) * 0.5;

    const stream = [];

    // Clean White Background
    stream.push('1 1 1 rg');
    stream.push(`0 0 ${pt(pageWMm)} ${pt(pageHMm)} re f`);

    // Optional Outer Stencil Plate Border
    if (opts.includePlateBorder && layout && layout.totalWidthMm > 0) {
      const m = Number(opts.plateMarginMm) || 2.4;
      stream.push('0 0 0 RG');
      stream.push('0.50 w');
      stream.push(
        `${pt(originXMm - m)} ${pt(originYMm - m)} ${pt(textW + m * 2)} ${pt(
          textH + m * 2
        )} re S`
      );
    }

    // Stencil Vector Polygons ONLY
    stream.push('0 0 0 rg');
    const polygons = layout && Array.isArray(layout.polygons) ? layout.polygons : [];
    for (let i = 0; i < polygons.length; i++) {
      const poly = polygons[i];
      if (!poly || poly.length < 3) continue;
      const cmds = [];
      for (let v = 0; v < poly.length; v++) {
        const xMm = originXMm + poly[v][0];
        const yMm = originYMm + poly[v][1];
        cmds.push(`${pt(xMm)} ${pt(yMm)} ${v === 0 ? 'm' : 'l'}`);
      }
      cmds.push('h f');
      stream.push(cmds.join(' '));
    }

    const contentStream = stream.join('\n') + '\n';

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt(pageWMm)} ${pt(
        pageHMm
      )}] /Resources << >> /Contents 4 0 R >>\nendobj\n`
    );
    objects.push(
      `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let i = 0; i < objects.length; i++) {
      offsets.push(pdf.length);
      pdf += objects[i];
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return pdf;
  }

  return {
    generatePdf
  };
});
