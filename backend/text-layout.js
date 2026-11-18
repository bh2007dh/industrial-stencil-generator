/**
 * Unified Stencil Text Layout Engine
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const GeometryEngine = require('./geometry-engine.js');
    module.exports = factory(GeometryEngine);
  } else {
    root.TextLayout = factory(root.GeometryEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (GeometryEngine) {
  'use strict';

  const { roundCoord, DEFAULT_PARAMS, getGlyph } = GeometryEngine;

  function layoutText(text, options) {
    const opts = Object.assign(
      {
        heightMm: 8.0,
        spacingMm: 1.0,
        lineSpacingMm: 3.0,
        fontParams: DEFAULT_PARAMS
      },
      options || {}
    );

    const fontParams = Object.assign({}, DEFAULT_PARAMS, opts.fontParams || {});
    const rawH = Number(opts.heightMm);
    const scale = Number.isFinite(rawH) && rawH >= 0 ? rawH : 8.0;
    const rawS = Number(opts.spacingMm);
    const spacing = Number.isFinite(rawS) && rawS >= 0 ? rawS : 1.0;
    const lineGap = Number.isFinite(Number(opts.lineSpacingMm))
      ? Number(opts.lineSpacingMm)
      : roundCoord(scale * 0.35);

    const rawText = String(text !== undefined && text !== null ? text : 'DDCHU0910500');
    const lines = rawText.toUpperCase().split(/\r?\n/);
    const numLines = lines.length;

    const charItems = [];
    const allPolygons = [];
    let totalVertices = 0;
    let totalBridges = 0;
    let maxLineWidthMm = 0;

    for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
      const chars = lines[lineIdx].split('');
      const yOffsetMm = roundCoord((numLines - 1 - lineIdx) * (scale + lineGap));
      let cursorX = 0;

      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const glyph = getGlyph(ch, fontParams);
        const glyphWidthMm = roundCoord(glyph.width * scale);

        const scaledPolygons = glyph.polygons.map((poly) =>
          poly.map(([x, y]) => {
            totalVertices++;
            return [
              roundCoord(cursorX + x * scale),
              roundCoord(yOffsetMm + y * scale)
            ];
          })
        );

        for (const sp of scaledPolygons) {
          allPolygons.push(sp);
        }

        totalBridges += glyph.bridgeConnections.length;

        charItems.push({
          lineIndex: lineIdx,
          charIndex: i,
          char: glyph.char,
          supported: glyph.supported,
          xOffsetMm: roundCoord(cursorX),
          yOffsetMm: roundCoord(yOffsetMm),
          widthMm: glyphWidthMm,
          heightMm: roundCoord(scale),
          advanceWidthMm: roundCoord(glyphWidthMm + (i < chars.length - 1 ? spacing : 0)),
          spacingAfterMm: i < chars.length - 1 ? roundCoord(spacing) : 0,
          polygonCount: scaledPolygons.length,
          bridgeConnections: glyph.bridgeConnections,
          hasInternalIsland: glyph.hasInternalIsland,
          polygons: scaledPolygons
        });

        cursorX = roundCoord(cursorX + glyphWidthMm + (i < chars.length - 1 ? spacing : 0));
      }

      if (cursorX > maxLineWidthMm) {
        maxLineWidthMm = cursorX;
      }
    }

    const totalWidthMm = roundCoord(Math.max(0, maxLineWidthMm));
    const totalHeightMm = roundCoord(
      numLines * scale + Math.max(0, numLines - 1) * lineGap
    );

    return {
      text: lines.join('\n'),
      lineCount: numLines,
      heightMm: roundCoord(scale),
      spacingMm: roundCoord(spacing),
      lineSpacingMm: roundCoord(lineGap),
      strokeThicknessMm: roundCoord(fontParams.strokeRatio * scale),
      chamferSizeMm: roundCoord(fontParams.chamferRatio * scale),
      bridgeWidthMm: roundCoord(fontParams.gapRatio * scale),
      charWidthDefaultMm: roundCoord(fontParams.widthRatio * scale),
      bridgesEnabled: Boolean(fontParams.bridgesEnabled),
      fixedWidth: Boolean(fontParams.fixedWidth),
      fontParams,
      totalWidthMm,
      totalHeightMm,
      characters: charItems,
      polygons: allPolygons,
      polygonCount: allPolygons.length,
      vertexCount: totalVertices,
      bridgeCount: totalBridges
    };
  }

  return {
    layoutText
  };
});
