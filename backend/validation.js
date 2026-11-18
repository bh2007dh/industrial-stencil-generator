/**
 * Automated Glyph & Pre-Export Validation System
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const GeometryEngine = require('./geometry-engine.js');
    const TextLayout = require('./text-layout.js');
    const PdfExport = require('./pdf-export.js');
    const DxfExport = require('./dxf-export.js');
    module.exports = factory(GeometryEngine, TextLayout, PdfExport, DxfExport);
  } else {
    root.StencilValidation = factory(
      root.GeometryEngine,
      root.TextLayout,
      root.PdfExport,
      root.DxfExport
    );
  }
})(typeof self !== 'undefined' ? self : this, function (
  GeometryEngine,
  TextLayout,
  PdfExport,
  DxfExport
) {
  'use strict';

  const { signedArea, roundCoord, getGlyph } = GeometryEngine;

  function segmentsProperlyIntersect(a, b, c, d) {
    const eps = 1e-6;
    function ccw(p1, p2, p3) {
      return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    }
    const d1 = ccw(a, b, c);
    const d2 = ccw(a, b, d);
    const d3 = ccw(c, d, a);
    const d4 = ccw(c, d, b);

    return (
      ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) &&
      ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))
    );
  }

  function pointInPolygon(pt, poly) {
    let inside = false;
    const [x, y] = pt;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function validateSingleGlyph(char, customParams) {
    const glyph = getGlyph(char, customParams);
    const issues = [];

    if (!glyph.supported) {
      issues.push(`Missing glyph definition for '${char}'`);
    }
    if (glyph.polygons.length === 0 && char !== ' ') {
      issues.push(`No vector polygons generated for '${char}'`);
    }
    if (glyph.hasInternalIsland && glyph.bridgeConnections.length === 0) {
      issues.push(`Character '${char}' has internal island but zero bridge connections`);
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    let vertexCount = 0;

    glyph.polygons.forEach((poly, pIdx) => {
      vertexCount += poly.length;
      if (poly.length < 3) {
        issues.push(`Polygon ${pIdx} has fewer than 3 vertices (open contour)`);
      }
      const area = signedArea(poly);
      if (area <= 1e-5) {
        issues.push(`Polygon ${pIdx} has non-positive area (${area.toFixed(6)})`);
      }

      const n = poly.length;
      for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];
        if (!Number.isFinite(a[0]) || !Number.isFinite(a[1])) {
          issues.push(`Polygon ${pIdx} vertex ${i} has non-finite coordinates`);
        }
        minX = Math.min(minX, a[0]);
        maxX = Math.max(maxX, a[0]);
        minY = Math.min(minY, a[1]);
        maxY = Math.max(maxY, a[1]);

        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue;
          const c = poly[j];
          const d = poly[(j + 1) % n];
          if (segmentsProperlyIntersect(a, b, c, d)) {
            issues.push(`Polygon ${pIdx} self-intersects between edges ${i} and ${j}`);
          }
        }
      }
    });

    for (let i = 0; i < glyph.polygons.length; i++) {
      for (let j = i + 1; j < glyph.polygons.length; j++) {
        const p1 = glyph.polygons[i];
        const p2 = glyph.polygons[j];
        for (let e1 = 0; e1 < p1.length; e1++) {
          const a = p1[e1];
          const b = p1[(e1 + 1) % p1.length];
          for (let e2 = 0; e2 < p2.length; e2++) {
            const c = p2[e2];
            const d = p2[(e2 + 1) % p2.length];
            if (segmentsProperlyIntersect(a, b, c, d)) {
              issues.push(`Polygon ${i} and Polygon ${j} overlap/intersect`);
            }
          }
        }
        if (pointInPolygon(p1[0], p2) || pointInPolygon(p2[0], p1)) {
          issues.push(`Polygon ${i} and Polygon ${j} have unbridged nested island containment`);
        }
      }
    }

    if (char !== ' ' && char !== '.' && char !== '-' && char !== '_' && char !== ':' && char !== '+' && char !== '#') {
      if (Math.abs(minY - 0) > 1e-4 || Math.abs(maxY - 1.0) > 1e-4) {
        issues.push(
          `Inconsistent character height: Y bounds [${minY.toFixed(4)}, ${maxY.toFixed(
            4
          )}] != [0, 1]`
        );
      }
    }

    return {
      char: glyph.char,
      valid: issues.length === 0,
      issues,
      polygonCount: glyph.polygons.length,
      vertexCount,
      bridgeCount: glyph.bridgeConnections.length,
      hasInternalIsland: glyph.hasInternalIsland,
      width: glyph.width,
      height: glyph.height,
      bounds: {
        minX: roundCoord(minX),
        maxX: roundCoord(maxX),
        minY: roundCoord(minY),
        maxY: roundCoord(maxY)
      },
      glyph
    };
  }

  function runFullCharacterTestSuite(customParams) {
    const alphabetChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numeralChars = '0123456789'.split('');
    const allCore = [...alphabetChars, ...numeralChars];

    const glyphResults = allCore.map((ch) => validateSingleGlyph(ch, customParams));
    const passedCount = glyphResults.filter((r) => r.valid).length;

    const testCases = [
      {
        name: 'ALPHABET (A-Z)',
        text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        layout: TextLayout.layoutText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', {
          heightMm: 8.0,
          spacingMm: 1.0,
          fontParams: customParams
        })
      },
      {
        name: 'NUMERALS (0-9)',
        text: '0123456789',
        layout: TextLayout.layoutText('0123456789', {
          heightMm: 8.0,
          spacingMm: 1.0,
          fontParams: customParams
        })
      },
      {
        name: 'DEFAULT TEST STRING (DDCHU0910500)',
        text: 'DDCHU0910500',
        layout: TextLayout.layoutText('DDCHU0910500', {
          heightMm: 8.0,
          spacingMm: 1.0,
          fontParams: customParams
        })
      }
    ];

    return {
      allValid: passedCount === allCore.length,
      totalCharacters: allCore.length,
      passedCharacters: passedCount,
      alphabetPassed: glyphResults.slice(0, 26).filter((r) => r.valid).length,
      numeralsPassed: glyphResults.slice(26).filter((r) => r.valid).length,
      glyphResults,
      testCases: testCases.map((tc) => ({
        name: tc.name,
        text: tc.text,
        heightMm: tc.layout.heightMm,
        spacingMm: tc.layout.spacingMm,
        totalWidthMm: tc.layout.totalWidthMm,
        totalHeightMm: tc.layout.totalHeightMm,
        polygonCount: tc.layout.polygonCount,
        vertexCount: tc.layout.vertexCount,
        bridgeCount: tc.layout.bridgeCount
      }))
    };
  }

  function validateExportBundle(layout, pdfExportResult, dxfString) {
    const checks = [];

    let allCoordsFinite = true;
    let allClosed = layout.polygons.length > 0;
    for (const poly of layout.polygons) {
      if (!poly || poly.length < 3 || signedArea(poly) <= 1e-5) {
        allClosed = false;
      }
      for (const [x, y] of poly) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          allCoordsFinite = false;
        }
      }
    }
    checks.push({
      id: 1,
      name: 'All Glyph Coordinates Finite & Valid',
      passed: allCoordsFinite,
      detail: `${layout.vertexCount} vertices verified`
    });

    checks.push({
      id: 2,
      name: 'Closed Contours & Valid Cutouts',
      passed: allClosed,
      detail: `${layout.polygonCount} closed CCW polygons`
    });

    let minY = Infinity,
      maxY = -Infinity;
    for (const poly of layout.polygons) {
      for (const [, y] of poly) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    const measuredHeight = maxY - minY;
    const heightValid =
      layout.polygons.length > 0 &&
      Math.abs(measuredHeight - layout.totalHeightMm) < 0.01;
    checks.push({
      id: 3,
      name: `Character Height Verification (${layout.heightMm.toFixed(2)} mm)`,
      passed: heightValid,
      detail: `Measured: ${measuredHeight.toFixed(4)} mm`
    });

    let spacingValid = true;
    for (let i = 0; i + 1 < layout.characters.length; i++) {
      const c0 = layout.characters[i];
      const c1 = layout.characters[i + 1];
      if (c0.lineIndex === c1.lineIndex) {
        const gap = c1.xOffsetMm - (c0.xOffsetMm + c0.widthMm);
        if (Math.abs(gap - layout.spacingMm) > 1e-3) {
          spacingValid = false;
        }
      }
    }
    checks.push({
      id: 4,
      name: `Character Spacing Verification (${layout.spacingMm.toFixed(2)} mm)`,
      passed: spacingValid,
      detail: `Uniform ${layout.spacingMm.toFixed(2)} mm inter-character gap`
    });

    const bridgesValid = layout.bridgeCount > 0 || !layout.bridgesEnabled;
    checks.push({
      id: 5,
      name: 'Stencil Bridge Structural Integrity',
      passed: bridgesValid,
      detail: `${layout.bridgeCount} active bridges (${layout.bridgeWidthMm.toFixed(2)} mm width)`
    });

    const pdfPolys = PdfExport.extractPdfStencilPolygons(
      pdfExportResult.pdfString,
      pdfExportResult.originXMm,
      pdfExportResult.originYMm
    );
    let maxPdfDev = 0;
    let pdfMatched = pdfPolys.length === layout.polygons.length;
    if (pdfMatched) {
      for (let i = 0; i < layout.polygons.length; i++) {
        const pA = layout.polygons[i];
        const pB = pdfPolys[i];
        if (pA.length !== pB.length) {
          pdfMatched = false;
          break;
        }
        for (let v = 0; v < pA.length; v++) {
          const d = Math.hypot(pA[v][0] - pB[v][0], pA[v][1] - pB[v][1]);
          if (d > maxPdfDev) maxPdfDev = d;
        }
      }
    }
    if (maxPdfDev > 0.01) pdfMatched = false;

    checks.push({
      id: 6,
      name: 'PDF Vector Output & 1:1 Geometry Match',
      passed: pdfMatched && pdfExportResult.pdfString.startsWith('%PDF-1.4'),
      detail: `${pdfPolys.length}/${layout.polygons.length} vector loops (max dev ${maxPdfDev.toFixed(
        5
      )} mm)`
    });

    const dxfPolys = DxfExport.extractDxfStencilPolygons(dxfString, 'STENCIL_CUTOUTS');
    let maxDxfDev = 0;
    let dxfMatched = dxfPolys.length === layout.polygons.length;
    if (dxfMatched) {
      for (let i = 0; i < layout.polygons.length; i++) {
        const pA = layout.polygons[i];
        const pB = dxfPolys[i];
        if (!pB.closed || pA.length !== pB.vertices.length) {
          dxfMatched = false;
          break;
        }
        for (let v = 0; v < pA.length; v++) {
          const d = Math.hypot(
            pA[v][0] - pB.vertices[v][0],
            pA[v][1] - pB.vertices[v][1]
          );
          if (d > maxDxfDev) maxDxfDev = d;
        }
      }
    }
    if (maxDxfDev > 1e-4) dxfMatched = false;

    checks.push({
      id: 7,
      name: 'DXF Closed Polyline & 1:1 Geometry Match',
      passed: dxfMatched,
      detail: `${dxfPolys.length}/${layout.polygons.length} closed POLYLINE loops (max dev ${maxDxfDev.toFixed(
        6
      )} mm)`
    });

    const hasMmUnits =
      dxfString.includes('$INSUNITS\r\n70\r\n4') &&
      dxfString.includes('$MEASUREMENT\r\n70\r\n1');
    checks.push({
      id: 8,
      name: 'Millimetre Unit Calibration ($INSUNITS=4, 1mm=2.8346pt)',
      passed: hasMmUnits,
      detail: `Total Bounds: ${layout.totalWidthMm.toFixed(2)} × ${layout.totalHeightMm.toFixed(
        2
      )} mm`
    });

    const allPassed = checks.every((c) => c.passed);

    return {
      allPassed,
      checks,
      maxPdfDeviationMm: roundCoord(maxPdfDev),
      maxDxfDeviationMm: roundCoord(maxDxfDev)
    };
  }

  return {
    validateSingleGlyph,
    runFullCharacterTestSuite,
    validateExportBundle
  };
});
