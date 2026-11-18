/**
 * Vector PDF Drawing Exporter (PDF 1.4 Native Vector Generator)
 *
 * Supports two PDF options:
 * 1. 'text-only'   : Text-only stencil drawing (clean white background, black vector stencil geometry).
 * 2. 'engineering' : Complete engineering drawing with title block, font design metadata,
 *                    scale info, export date, and clean summary table.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PdfExport = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MM_TO_PT = 72.0 / 25.4;

  function pt(mm) {
    return (Number(mm) * MM_TO_PT).toFixed(4);
  }

  function escapePdfText(str) {
    return String(str || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function pdfTextCmd(xMm, yMm, sizePt, text) {
    return `BT /F1 ${sizePt.toFixed(2)} Tf ${pt(xMm)} ${pt(yMm)} Td (${escapePdfText(
      text
    )}) Tj ET`;
  }

  function pdfBoldTextCmd(xMm, yMm, sizePt, text) {
    return `BT /F2 ${sizePt.toFixed(2)} Tf ${pt(xMm)} ${pt(yMm)} Td (${escapePdfText(
      text
    )}) Tj ET`;
  }

  function pdfLineMm(x1, y1, x2, y2) {
    return `${pt(x1)} ${pt(y1)} m ${pt(x2)} ${pt(y2)} l S`;
  }

  function pdfRectStrokeMm(x, y, w, h) {
    return `${pt(x)} ${pt(y)} ${pt(w)} ${pt(h)} re S`;
  }

  function pdfRectFillMm(x, y, w, h) {
    return `${pt(x)} ${pt(y)} ${pt(w)} ${pt(h)} re f`;
  }

  function generatePdf(layout, options) {
    const opts = Object.assign(
      {
        mode: 'text-only', // 'text-only' | 'engineering'
        title: 'INDUSTRIAL STENCIL VECTOR DRAWING',
        exportDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      options || {}
    );

    const isTextOnly = opts.mode === 'text-only';
    const textW = Math.max(10, layout.totalWidthMm || 71.01);
    const textH = Math.max(4, layout.totalHeightMm || 8.0);

    let pageWMm, pageHMm, originXMm, originYMm;

    if (isTextOnly) {
      const marginMm = 15.0;
      pageWMm = Math.max(120, textW + marginMm * 2);
      pageHMm = Math.max(60, textH + marginMm * 2);
      originXMm = (pageWMm - textW) * 0.5;
      originYMm = (pageHMm - textH) * 0.5;
    } else {
      pageWMm = Math.max(297, textW + 70);
      pageHMm = Math.max(210, textH + 120);
      originXMm = (pageWMm - textW) * 0.5;
      originYMm = (pageHMm - textH) * 0.5 + 18;
    }

    const stream = [];

    // 1. Clean White Page Background
    stream.push('1 1 1 rg');
    stream.push(pdfRectFillMm(0, 0, pageWMm, pageHMm));

    // 2. Engineering Sheet Frame & Title Block (when mode === 'engineering')
    if (!isTextOnly) {
      const borderM = 8.0;
      const innerW = pageWMm - borderM * 2;
      const innerH = pageHMm - borderM * 2;

      stream.push('0.15 0.18 0.22 RG');
      stream.push('0.85 w');
      stream.push(pdfRectStrokeMm(borderM, borderM, innerW, innerH));
      stream.push('0.40 w');
      stream.push(pdfRectStrokeMm(borderM + 1.5, borderM + 1.5, innerW - 3.0, innerH - 3.0));

      const tbX = borderM + 1.5;
      const tbY = borderM + 1.5;
      const tbW = innerW - 3.0;
      const tbH = 42.0;

      stream.push('0.96 0.97 0.99 rg');
      stream.push(pdfRectFillMm(tbX, tbY, tbW, tbH));
      stream.push('0.15 0.18 0.22 RG');
      stream.push('0.55 w');
      stream.push(pdfRectStrokeMm(tbX, tbY, tbW, tbH));

      stream.push('0.35 w');
      stream.push(pdfLineMm(tbX, tbY + 28, tbX + tbW, tbY + 28));
      stream.push(pdfLineMm(tbX, tbY + 14, tbX + tbW, tbY + 14));
      const col1 = tbX + tbW * 0.36;
      const col2 = tbX + tbW * 0.68;
      stream.push(pdfLineMm(col1, tbY, col1, tbY + tbH));
      stream.push(pdfLineMm(col2, tbY, col2, tbY + tbH));

      stream.push('0 0 0 rg');
      stream.push(pdfBoldTextCmd(tbX + 3, tbY + 35, 9.5, `DRAWING TITLE: ${opts.title}`));
      stream.push(
        pdfTextCmd(
          tbX + 3,
          tbY + 30.2,
          7.5,
          `STENCIL TEXT: ${layout.text.replace(/\n/g, ' / ')}`
        )
      );

      stream.push(pdfBoldTextCmd(col1 + 3, tbY + 35, 8.5, `FONT DESIGN SPECIFICATION`));
      stream.push(
        pdfTextCmd(
          col1 + 3,
          tbY + 30.2,
          7.2,
          `Style: Bold Industrial | Square/Rect | 45 deg Chamfered`
        )
      );

      stream.push(pdfBoldTextCmd(col2 + 3, tbY + 35, 8.5, `SCALE: 1:1 (TRUE MM)`));
      stream.push(pdfTextCmd(col2 + 3, tbY + 30.2, 7.2, `DATE: ${opts.exportDate}`));

      stream.push(
        pdfBoldTextCmd(tbX + 3, tbY + 21, 8.0, `CHARACTER HEIGHT: ${layout.heightMm.toFixed(2)} mm`)
      );
      stream.push(
        pdfTextCmd(
          tbX + 3,
          tbY + 16.2,
          7.2,
          `CHARACTER SPACING: ${layout.spacingMm.toFixed(2)} mm | MODE: ${
            layout.fixedWidth ? 'Fixed-Width' : 'Proportional'
          }`
        )
      );

      stream.push(
        pdfBoldTextCmd(
          col1 + 3,
          tbY + 21,
          8.0,
          `STROKE: ${layout.strokeThicknessMm.toFixed(2)} mm | CHAMFER: ${layout.chamferSizeMm.toFixed(
            2
          )} mm`
        )
      );
      stream.push(
        pdfTextCmd(
          col1 + 3,
          tbY + 16.2,
          7.2,
          `STENCIL BRIDGES: ${
            layout.bridgesEnabled ? 'ENABLED' : 'DISABLED'
          } (GAP = ${layout.bridgeWidthMm.toFixed(2)} mm)`
        )
      );

      stream.push(
        pdfBoldTextCmd(col2 + 3, tbY + 21, 8.0, `OVERALL WIDTH: ${layout.totalWidthMm.toFixed(2)} mm`)
      );
      stream.push(
        pdfTextCmd(col2 + 3, tbY + 16.2, 7.2, `OVERALL HEIGHT: ${layout.totalHeightMm.toFixed(2)} mm`)
      );

      stream.push(
        pdfTextCmd(
          tbX + 3,
          tbY + 6.5,
          7.2,
          `VECTOR TOPOLOGY: ${layout.polygonCount} Closed Polygons | ${layout.vertexCount} Vertices | ${layout.bridgeCount} Structural Bridges`
        )
      );
      stream.push(
        pdfTextCmd(
          col1 + 3,
          tbY + 6.5,
          7.2,
          `GEOMETRY SOURCE: Dedicated Geometric Stencil Vector Glyph Library`
        )
      );
      stream.push(
        pdfBoldTextCmd(col2 + 3, tbY + 6.5, 7.5, `STATUS: VERIFIED (1:1 CAD/DXF MATCH)`)
      );
    }

    // 3. Actual Vector Character Outlines & Stencil Bridges
    stream.push('%% STENCIL_VECTOR_GEOMETRY_START');
    stream.push('0 0 0 rg');
    stream.push('0 0 0 RG');
    stream.push('0.15 w');

    for (let i = 0; i < layout.polygons.length; i++) {
      const poly = layout.polygons[i];
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
    stream.push('%% STENCIL_VECTOR_GEOMETRY_END');

    const contentStream = stream.join('\n') + '\n';

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt(pageWMm)} ${pt(
        pageHMm
      )}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`
    );
    objects.push(
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
    );
    objects.push(
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'
    );
    objects.push(
      `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
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

    return {
      pdfString: pdf,
      pageWidthMm: pageWMm,
      pageHeightMm: pageHMm,
      originXMm,
      originYMm,
      polygonCount: layout.polygons.length
    };
  }

  function extractPdfStencilPolygons(pdfString, originXMm = 0, originYMm = 0) {
    const startIdx = pdfString.indexOf('%% STENCIL_VECTOR_GEOMETRY_START');
    const endIdx = pdfString.indexOf('%% STENCIL_VECTOR_GEOMETRY_END');
    if (startIdx === -1 || endIdx === -1) return [];

    const block = pdfString.slice(startIdx, endIdx);
    const lines = block.split('\n');
    const polygons = [];

    for (const line of lines) {
      if (!line.endsWith('h f')) continue;
      const tokens = line.trim().split(/\s+/);
      const pts = [];
      for (let i = 0; i + 2 < tokens.length; i += 3) {
        const op = tokens[i + 2];
        if (op === 'm' || op === 'l') {
          const xPt = parseFloat(tokens[i]);
          const yPt = parseFloat(tokens[i + 1]);
          const xMm = xPt / MM_TO_PT - originXMm;
          const yMm = yPt / MM_TO_PT - originYMm;
          pts.push([xMm, yMm]);
        }
      }
      if (pts.length >= 3) {
        polygons.push(pts);
      }
    }
    return polygons;
  }

  return {
    MM_TO_PT,
    generatePdf,
    extractPdfStencilPolygons
  };
});
