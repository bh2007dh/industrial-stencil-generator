/**
 * Custom Geometric Industrial Stencil Vector Glyph Library: Engineering Symbols
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GlyphLibrarySymbols = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function rect(x1, y1, x2, y2) {
    return [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2]
    ];
  }

  const SYMBOL_SPECS = {
    ' ': {
      hasInternalIsland: false,
      bridgeConnections: [],
      build(p) {
        const W = p.widthRatio;
        return {
          width: p.fixedWidth ? W : W * 0.65,
          polygons: []
        };
      }
    },

    '-': {
      hasInternalIsland: false,
      bridgeConnections: [],
      build(p) {
        const W = p.widthRatio, T = p.strokeRatio;
        const wSym = p.fixedWidth ? W : W * 0.72;
        const mLow = 0.5 - T * 0.45, mHigh = 0.5 + T * 0.45;
        return {
          width: wSym,
          polygons: [rect(0.04, mLow, wSym - 0.04, mHigh)]
        };
      }
    },

    '.': {
      hasInternalIsland: false,
      bridgeConnections: [],
      build(p) {
        const W = p.widthRatio, T = p.strokeRatio;
        const wSym = p.fixedWidth ? W : T * 1.3;
        const x0 = p.fixedWidth ? (W - T * 1.1) * 0.5 : 0.02;
        return {
          width: wSym,
          polygons: [rect(x0, 0, x0 + T * 1.1, T * 1.1)]
        };
      }
    },

    '/': {
      hasInternalIsland: false,
      bridgeConnections: [],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const wSym = p.fixedWidth ? W : W * 0.75;
        return {
          width: wSym,
          polygons: [
            [
              [0, 0],
              [T * 0.95, 0],
              [wSym, H],
              [wSym - T * 0.95, H]
            ]
          ]
        };
      }
    },

    '_': {
      hasInternalIsland: false,
      bridgeConnections: [],
      build(p) {
        const W = p.widthRatio, T = p.strokeRatio;
        const wSym = p.fixedWidth ? W : W * 0.85;
        return {
          width: wSym,
          polygons: [rect(0, 0, wSym, T)]
        };
      }
    },

    ':': {
      hasInternalIsland: false,
      bridgeConnections: [],
      build(p) {
        const W = p.widthRatio, T = p.strokeRatio;
        const wSym = p.fixedWidth ? W : T * 1.3;
        const x0 = p.fixedWidth ? (W - T * 1.1) * 0.5 : 0.02;
        return {
          width: wSym,
          polygons: [
            rect(x0, 0.12, x0 + T * 1.1, 0.12 + T * 1.1),
            rect(x0, 0.62, x0 + T * 1.1, 0.62 + T * 1.1)
          ]
        };
      }
    },

    '+': {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'plus-arms', type: 'vertical-gap', position: 'left-and-right-arms' }
      ],
      build(p) {
        const W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const midX = W * 0.5, stemL = midX - T * 0.5, stemR = midX + T * 0.5;
        const mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(stemL, 0.14, stemR, 0.86),
            rect(0.04, mLow, stemL - G, mHigh),
            rect(stemR + G, mLow, W - 0.04, mHigh)
          ]
        };
      }
    },

    '#': {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'hash-bars', type: 'vertical-bridge', position: 'crossbars' }
      ],
      build(p) {
        const W = p.widthRatio, T = p.strokeRatio * 0.78;
        const G = (p.bridgesEnabled === false ? 0.002 : p.gapRatio) * 0.75;
        const s1L = W * 0.22, s1R = s1L + T;
        const s2L = W * 0.62, s2R = s2L + T;
        return {
          width: W,
          polygons: [
            rect(s1L, 0.08, s1R, 0.92),
            rect(s2L, 0.08, s2R, 0.92),
            rect(0.02, 0.30, s1L - G, 0.30 + T),
            rect(s1R + G, 0.30, s2L - G, 0.30 + T),
            rect(s2R + G, 0.30, W - 0.02, 0.30 + T),
            rect(0.02, 0.60, s1L - G, 0.60 + T),
            rect(s1R + G, 0.60, s2L - G, 0.60 + T),
            rect(s2R + G, 0.60, W - 0.02, 0.60 + T)
          ]
        };
      }
    }
  };

  return {
    SYMBOL_SPECS
  };
});
