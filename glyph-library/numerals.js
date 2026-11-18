/**
 * Custom Geometric Industrial Stencil Vector Glyph Library: Numerals (0-9)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GlyphLibraryNumerals = factory();
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

  function leftChamferBracket(x0, y0, y1, T, C, Ci, xTopEnd, xBotEnd) {
    return [
      [xTopEnd, y1],
      [x0 + C, y1],
      [x0, y1 - C],
      [x0, y0 + C],
      [x0 + C, y0],
      [xBotEnd, y0],
      [xBotEnd, y0 + T],
      [x0 + T + Ci, y0 + T],
      [x0 + T, y0 + T + Ci],
      [x0 + T, y1 - T - Ci],
      [x0 + T + Ci, y1 - T],
      [xTopEnd, y1 - T]
    ];
  }

  function rightChamferBracket(x1, y0, y1, T, C, Ci, xTopStart, xBotStart) {
    return [
      [xBotStart, y0],
      [x1 - C, y0],
      [x1, y0 + C],
      [x1, y1 - C],
      [x1 - C, y1],
      [xTopStart, y1],
      [xTopStart, y1 - T],
      [x1 - T - Ci, y1 - T],
      [x1 - T, y1 - T - Ci],
      [x1 - T, y0 + T + Ci],
      [x1 - T - Ci, y0 + T],
      [xBotStart, y0 + T]
    ];
  }

  function topRightHook(x1, y1, T, C, Ci, xStart, yDropEnd) {
    return [
      [xStart, y1 - T],
      [x1 - T - Ci, y1 - T],
      [x1 - T, y1 - T - Ci],
      [x1 - T, yDropEnd],
      [x1, yDropEnd],
      [x1, y1 - C],
      [x1 - C, y1],
      [xStart, y1]
    ];
  }

  function botLeftHook(x0, y0, T, C, Ci, xEnd, yRiseEnd) {
    return [
      [x0, yRiseEnd],
      [x0, y0 + C],
      [x0 + C, y0],
      [xEnd, y0],
      [xEnd, y0 + T],
      [x0 + T + Ci, y0 + T],
      [x0 + T, y0 + T + Ci],
      [x0 + T, yRiseEnd]
    ];
  }

  function topLeftHook(x0, y1, T, C, Ci, xEnd, yDropEnd) {
    return [
      [x0, yDropEnd],
      [x0 + T, yDropEnd],
      [x0 + T, y1 - T - Ci],
      [x0 + T + Ci, y1 - T],
      [xEnd, y1 - T],
      [xEnd, y1],
      [x0 + C, y1],
      [x0, y1 - C]
    ];
  }

  function safeParams(p) {
    const W = Math.max(0.01, Number(p.widthRatio) || 0);
    const T = Math.max(0.002, Math.min(Number(p.strokeRatio) || 0, W * 0.46, 0.46));
    const C = Math.max(0, Math.min(Number(p.chamferRatio) || 0, W * 0.48, 0.48));
    const Ci = C <= 1e-4 ? 0 : Math.max(0, C - T * 0.585786);
    const rawG = p.bridgesEnabled === false ? 0 : Math.max(0, Number(p.gapRatio) || 0);
    const G = Math.min(rawG, W * 0.42, 0.42);
    return { W, T, C, Ci, G, fixedWidth: p.fixedWidth };
  }

  const NUMERAL_SPECS = {
    '0': {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: '0-top-bridge', type: 'vertical-bridge', position: 'top-center' },
        { id: '0-bot-bridge', type: 'vertical-bridge', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        return {
          width: W,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gapL, gapL),
            rightChamferBracket(W, 0, H, T, C, Ci, gapR, gapR)
          ]
        };
      }
    },

    '1': {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: '1-flag-gap', type: 'vertical-gap', position: 'top-left-nose' },
        { id: '1-stem-split', type: 'horizontal-gap', position: 'mid-stem' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const w1 = p.fixedWidth ? W : W * 0.72;
        const stemR = w1 - 0.04, stemL = stemR - T * 1.08;
        const flagR = stemL - G * 0.85, flagL = 0.02, splitY = 0.46;
        return {
          width: w1,
          polygons: [
            [
              [flagL, H - T * 1.45],
              [flagR, H - T * 1.05],
              [flagR, H],
              [flagL + (flagR - flagL) * 0.55, H],
              [flagL, H - T * 0.65]
            ],
            rect(stemL, splitY + G * 0.5, stemR, H),
            rect(stemL, 0, stemR, splitY - G * 0.5)
          ]
        };
      }
    },

    '2': {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: '2-top-center', type: 'vertical-gap', position: 'top-center' },
        { id: '2-bot-center', type: 'vertical-gap', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5;
        const cMid = C * 0.8, ciMid = Ci * 0.8;
        return {
          width: W,
          polygons: [
            topLeftHook(0, H, T, C, Ci, gapL, H - 0.25),
            [
              [gapR, H - T],
              [W - T - Ci, H - T],
              [W - T, H - T - Ci],
              [W - T, mHigh + ciMid],
              [W - T - ciMid, mHigh],
              [cMid, mHigh],
              [0, mHigh - cMid],
              [0, C * 0.65],
              [C * 0.65, 0],
              [gapL, 0],
              [gapL, T],
              [T + Ci * 0.5, T],
              [T, T + Ci * 0.5],
              [T, mLow - ciMid],
              [T + ciMid, mLow],
              [W - cMid, mLow],
              [W, mLow + cMid],
              [W, H - C],
              [W - C, H],
              [gapR, H]
            ],
            rect(gapR, 0, W, T)
          ]
        };
      }
    },

    '3': {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: '3-top-center', type: 'vertical-gap', position: 'top-center' },
        { id: '3-mid-bar', type: 'vertical-gap', position: 'middle-right' },
        { id: '3-bot-center', type: 'vertical-gap', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5, notch = C * 0.65;
        return {
          width: W,
          polygons: [
            topLeftHook(0, H, T, C, Ci, gapL, H - 0.25),
            botLeftHook(0, 0, T, C, Ci, gapL, 0.25),
            rect(T * 0.85, mLow, W - T - G, mHigh),
            [
              [gapR, 0],
              [W - C, 0],
              [W, C],
              [W, 0.5 - notch],
              [W - notch, 0.5],
              [W, 0.5 + notch],
              [W, H - C],
              [W - C, H],
              [gapR, H],
              [gapR, H - T],
              [W - T - Ci, H - T],
              [W - T, H - T - Ci],
              [W - T, mHigh + Ci * 0.6],
              [W - T - Ci * 0.6, mHigh],
              [W - T - Ci * 0.6, mLow],
              [W - T, mLow - Ci * 0.6],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [gapR, T]
            ]
          ]
        };
      }
    },

    '4': {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: '4-stem-bridge', type: 'vertical-bridge', position: 'right-stem-counter' },
        { id: '4-arm-bridge', type: 'horizontal-bridge', position: 'left-arm-to-bar' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const stemL = W - T, stemR = W, barLow = 0.28, barHigh = barLow + T;
        return {
          width: W,
          polygons: [
            [
              [0, barHigh + G],
              [T, barHigh + G],
              [stemL - G * 0.6, H],
              [stemL - G * 0.6 - T * 0.95, H],
              [0, barHigh + G + 0.16]
            ],
            [
              [C * 0.5, barLow],
              [stemL - G, barLow],
              [stemL - G, barHigh],
              [0, barHigh],
              [0, barLow + C * 0.5]
            ],
            rect(stemL, 0, stemR, H)
          ]
        };
      }
    },

    '5': {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: '5-top-bar', type: 'vertical-gap', position: 'top-left-stem' },
        { id: '5-bot-center', type: 'vertical-gap', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const mLow = 0.5 - T * 0.42, mHigh = mLow + T;
        const cMid = C * 0.85, ciMid = Ci * 0.85;
        return {
          width: W,
          polygons: [
            rect(T + G, H - T, W, H),
            [
              [0, mLow + cMid * 0.6],
              [cMid * 0.6, mLow],
              [W - T - ciMid, mLow],
              [W - T, mLow - ciMid],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [gapR, T],
              [gapR, 0],
              [W - C, 0],
              [W, C],
              [W, mHigh - cMid],
              [W - cMid, mHigh],
              [T, mHigh],
              [T, H],
              [0, H]
            ],
            botLeftHook(0, 0, T, C, Ci, gapL, 0.26)
          ]
        };
      }
    },

    '6': {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: '6-top-center', type: 'vertical-bridge', position: 'top-center' },
        { id: '6-mid-left', type: 'vertical-bridge', position: 'middle-left-counter' },
        { id: '6-bot-center', type: 'vertical-bridge', position: 'bottom-center-counter' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const stemGapX = T + G, mHigh = 0.5 + T * 0.45, mLow = mHigh - T;
        const cMid = C * 0.85, ciMid = Ci * 0.85;
        return {
          width: W,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gapL, gapL),
            topRightHook(W, H, T, C, Ci, gapR, H - 0.25),
            [
              [stemGapX, mLow],
              [W - T - ciMid, mLow],
              [W - T, mLow - ciMid],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [gapR, T],
              [gapR, 0],
              [W - C, 0],
              [W, C],
              [W, mHigh - cMid],
              [W - cMid, mHigh],
              [stemGapX, mHigh]
            ]
          ]
        };
      }
    },

    '7': {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: '7-top-gap', type: 'vertical-gap', position: 'top-right-shoulder' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const diagBotL = 0.08, diagBotR = diagBotL + T * 1.08;
        return {
          width: W,
          polygons: [
            [
              [0, H - 0.24],
              [T, H - 0.24],
              [T, H - T],
              [W - T - G - 0.04, H - T],
              [W - T - G - 0.04, H],
              [0, H]
            ],
            [
              [diagBotL, 0],
              [diagBotR, 0],
              [W, H - T * 0.85],
              [W, H - C * 0.5],
              [W - C * 0.5, H],
              [W - T - 0.02, H],
              [W - T - 0.02, H - T * 0.9]
            ]
          ]
        };
      }
    },

    '8': {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: '8-top-center', type: 'vertical-bridge', position: 'top-center-counter' },
        { id: '8-mid-center', type: 'vertical-bridge', position: 'middle-center-counter' },
        { id: '8-bot-center', type: 'vertical-bridge', position: 'bottom-center-counter' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5, notch = C * 0.65;
        return {
          width: W,
          polygons: [
            [
              [gapL, H],
              [C, H],
              [0, H - C],
              [0, 0.5 + notch],
              [notch, 0.5],
              [0, 0.5 - notch],
              [0, C],
              [C, 0],
              [gapL, 0],
              [gapL, T],
              [T + Ci, T],
              [T, T + Ci],
              [T, mLow - Ci * 0.6],
              [T + Ci * 0.6, mLow],
              [gapL, mLow],
              [gapL, mHigh],
              [T + Ci * 0.6, mHigh],
              [T, mHigh + Ci * 0.6],
              [T, H - T - Ci],
              [T + Ci, H - T],
              [gapL, H - T]
            ],
            [
              [gapR, 0],
              [W - C, 0],
              [W, C],
              [W, 0.5 - notch],
              [W - notch, 0.5],
              [W, 0.5 + notch],
              [W, H - C],
              [W - C, H],
              [gapR, H],
              [gapR, H - T],
              [W - T - Ci, H - T],
              [W - T, H - T - Ci],
              [W - T, mHigh + Ci * 0.6],
              [W - T - Ci * 0.6, mHigh],
              [gapR, mHigh],
              [gapR, mLow],
              [W - T - Ci * 0.6, mLow],
              [W - T, mLow - Ci * 0.6],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [gapR, T]
            ]
          ]
        };
      }
    },

    '9': {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: '9-top-center', type: 'vertical-bridge', position: 'top-center-counter' },
        { id: '9-mid-right', type: 'vertical-bridge', position: 'middle-right-counter' },
        { id: '9-bot-center', type: 'vertical-bridge', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const stemGapX = T + G, mLow = 0.5 - T * 0.45, mHigh = mLow + T;
        const cMid = C * 0.85, ciMid = Ci * 0.85;
        return {
          width: W,
          polygons: [
            rightChamferBracket(W, 0, H, T, C, Ci, gapR, gapR),
            botLeftHook(0, 0, T, C, Ci, gapL, 0.25),
            [
              [gapL, H],
              [C, H],
              [0, H - C],
              [0, mLow + cMid],
              [cMid, mLow],
              [W - stemGapX, mLow],
              [W - stemGapX, mHigh],
              [T + ciMid, mHigh],
              [T, mHigh + ciMid],
              [T, H - T - Ci],
              [T + Ci, H - T],
              [gapL, H - T]
            ]
          ]
        };
      }
    }
  };

  return {
    NUMERAL_SPECS
  };
});
