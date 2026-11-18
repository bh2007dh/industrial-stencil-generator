/**
 * Dedicated Vector Stencil Geometry Engine
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const { ALPHABET_SPECS } = require('../glyph-library/alphabet.js');
    const { NUMERAL_SPECS } = require('../glyph-library/numerals.js');
    const { SYMBOL_SPECS } = require('../glyph-library/symbols.js');
    module.exports = factory(ALPHABET_SPECS, NUMERAL_SPECS, SYMBOL_SPECS);
  } else {
    root.GeometryEngine = factory(
      root.GlyphLibraryAlphabet.ALPHABET_SPECS,
      root.GlyphLibraryNumerals.NUMERAL_SPECS,
      root.GlyphLibrarySymbols.SYMBOL_SPECS
    );
  }
})(typeof self !== 'undefined' ? self : this, function (
  ALPHABET_SPECS,
  NUMERAL_SPECS,
  SYMBOL_SPECS
) {
  'use strict';

  const DEFAULT_PARAMS = {
    widthRatio: 0.640,
    strokeRatio: 0.162,
    chamferRatio: 0.150,
    gapRatio: 0.072,
    bridgesEnabled: true,
    fixedWidth: false
  };

  const ALL_SPECS = Object.assign({}, ALPHABET_SPECS, NUMERAL_SPECS, SYMBOL_SPECS);
  const SUPPORTED_CHARS = Object.keys(ALL_SPECS);

  function roundCoord(val) {
    return Math.round(val * 1e6) / 1e6;
  }

  function signedArea(poly) {
    let area = 0;
    for (let i = 0, n = poly.length; i < n; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % n];
      area += x1 * y2 - x2 * y1;
    }
    return area * 0.5;
  }

  function normalizePolygon(pts) {
    if (!pts || pts.length < 3) return [];
    const eps = 1e-6;

    const dedup = [];
    for (let i = 0; i < pts.length; i++) {
      const p = [roundCoord(pts[i][0]), roundCoord(pts[i][1])];
      if (dedup.length === 0) {
        dedup.push(p);
      } else {
        const prev = dedup[dedup.length - 1];
        if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) > eps) {
          dedup.push(p);
        }
      }
    }
    if (
      dedup.length > 1 &&
      Math.hypot(
        dedup[0][0] - dedup[dedup.length - 1][0],
        dedup[0][1] - dedup[dedup.length - 1][1]
      ) <= eps
    ) {
      dedup.pop();
    }
    if (dedup.length < 3) return [];

    const cleaned = [];
    const n = dedup.length;
    for (let i = 0; i < n; i++) {
      const prev = dedup[(i - 1 + n) % n];
      const curr = dedup[i];
      const next = dedup[(i + 1) % n];
      const vx1 = curr[0] - prev[0];
      const vy1 = curr[1] - prev[1];
      const vx2 = next[0] - curr[0];
      const vy2 = next[1] - curr[1];
      const cross = Math.abs(vx1 * vy2 - vy1 * vx2);
      const len1 = Math.hypot(vx1, vy1);
      const len2 = Math.hypot(vx2, vy2);
      if (len1 > eps && len2 > eps && cross / (len1 * len2) > 1e-4) {
        cleaned.push(curr);
      }
    }

    if (cleaned.length < 3) return [];
    if (signedArea(cleaned) < 0) {
      cleaned.reverse();
    }
    return cleaned;
  }

  function getGlyph(char, customParams) {
    const rawP = Object.assign({}, DEFAULT_PARAMS, customParams || {});
    const safeW = Math.max(0.01, Number.isFinite(Number(rawP.widthRatio)) ? Number(rawP.widthRatio) : DEFAULT_PARAMS.widthRatio);
    const safeT = Math.max(0.002, Math.min(Number.isFinite(Number(rawP.strokeRatio)) ? Number(rawP.strokeRatio) : DEFAULT_PARAMS.strokeRatio, safeW * 0.46, 0.46));
    const safeC = Math.max(0, Math.min(Number.isFinite(Number(rawP.chamferRatio)) ? Number(rawP.chamferRatio) : DEFAULT_PARAMS.chamferRatio, safeW * 0.48, 0.48));
    const safeG = Math.max(0, Math.min(Number.isFinite(Number(rawP.gapRatio)) ? Number(rawP.gapRatio) : DEFAULT_PARAMS.gapRatio, safeW * 0.42, 0.42));
    const p = Object.assign({}, rawP, {
      widthRatio: safeW,
      strokeRatio: safeT,
      chamferRatio: safeC,
      gapRatio: safeG
    });
    const upper = String(char || '').toUpperCase();
    const spec = ALL_SPECS[upper];

    if (!spec) {
      const fallbackW = roundCoord(p.widthRatio * 0.6);
      return {
        char: upper,
        supported: false,
        width: fallbackW,
        height: 1.0,
        advanceWidth: fallbackW,
        outerContour: [],
        innerContour: [],
        stencilCutouts: [],
        polygons: [],
        bridgeConnections: [],
        hasInternalIsland: false,
        spacingMetadata: {
          leftBearing: 0,
          rightBearing: 0,
          defaultSpacingRatio: 0.125
        }
      };
    }

    const raw = spec.build(p);
    const w = roundCoord(p.fixedWidth ? p.widthRatio : raw.width);
    const scaleX = p.fixedWidth && raw.width > 0 ? p.widthRatio / raw.width : 1.0;

    const cleanedPolygons = raw.polygons
      .map((poly) =>
        normalizePolygon(poly.map(([x, y]) => [x * scaleX, y]))
      )
      .filter((poly) => poly.length >= 3);

    const outerEnvelope = [
      [0, 0],
      [w, 0],
      [w, 1.0],
      [0, 1.0]
    ];

    const innerEnvelope = spec.hasInternalIsland
      ? [
          [roundCoord(p.strokeRatio), roundCoord(p.strokeRatio)],
          [roundCoord(w - p.strokeRatio), roundCoord(p.strokeRatio)],
          [roundCoord(w - p.strokeRatio), roundCoord(1.0 - p.strokeRatio)],
          [roundCoord(p.strokeRatio), roundCoord(1.0 - p.strokeRatio)]
        ]
      : [];

    return {
      char: upper,
      supported: true,
      width: w,
      height: 1.0,
      advanceWidth: w,
      outerContour: outerEnvelope,
      innerContour: innerEnvelope,
      stencilCutouts: cleanedPolygons,
      polygons: cleanedPolygons,
      bridgeConnections: spec.bridgeConnections || [],
      hasInternalIsland: Boolean(spec.hasInternalIsland),
      spacingMetadata: {
        leftBearing: 0,
        rightBearing: 0,
        defaultSpacingRatio: 0.125
      }
    };
  }

  return {
    DEFAULT_PARAMS,
    SUPPORTED_CHARS,
    ALL_SPECS,
    roundCoord,
    signedArea,
    normalizePolygon,
    getGlyph
  };
});
