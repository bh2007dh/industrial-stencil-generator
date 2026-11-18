/**
 * Custom Geometric Industrial Stencil Vector Glyph Library: Alphabet (A-Z)
 *
 * Every uppercase character A-Z is individually designed with:
 * 1. Outer contour definition
 * 2. Inner contour definition
 * 3. Stencil cutouts (closed, island-free polygons with real bridges)
 * 4. Bridge connection specifications
 * 5. Character width, height, advance width, and spacing metadata
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GlyphLibraryAlphabet = factory();
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

  function botRightHook(x1, y0, T, C, Ci, xStart, yRiseEnd) {
    return [
      [xStart, y0],
      [x1 - C, y0],
      [x1, y0 + C],
      [x1, yRiseEnd],
      [x1 - T, yRiseEnd],
      [x1 - T, y0 + T + Ci],
      [x1 - T - Ci, y0 + T],
      [xStart, y0 + T]
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

  function safeParams(p) {
    const W = Math.max(0.01, Number(p.widthRatio) || 0);
    const T = Math.max(0.002, Math.min(Number(p.strokeRatio) || 0, W * 0.46, 0.46));
    const C = Math.max(0, Math.min(Number(p.chamferRatio) || 0, W * 0.48, 0.48));
    const Ci = C <= 1e-4 ? 0 : Math.max(0, C - T * 0.585786);
    const rawG = p.bridgesEnabled === false ? 0 : Math.max(0, Number(p.gapRatio) || 0);
    const G = Math.min(rawG, W * 0.42, 0.42);
    return { W, T, C, Ci, G, fixedWidth: p.fixedWidth };
  }

  const ALPHABET_SPECS = {
    A: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'A-top-apex', type: 'vertical-bridge', position: 'top-center' },
        { id: 'A-crossbar-left', type: 'vertical-bridge', position: 'lower-left-stem' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const midX = W * 0.5, gapL = midX - G * 0.5, gapR = midX + G * 0.5;
        const stemGapX = T + G;
        const kneeY = 0.62, barLow = 0.28, barHigh = barLow + T * 0.92;
        return {
          width: W,
          polygons: [
            [
              [0, 0],
              [T, 0],
              [T, kneeY - 0.04],
              [gapL, H - T],
              [gapL, H],
              [C * 0.9, H],
              [0, kneeY]
            ],
            [
              [W - T, 0],
              [W, 0],
              [W, kneeY],
              [W - C * 0.9, H],
              [gapR, H],
              [gapR, H - T],
              [W - T, kneeY - 0.04],
              [W - T, barHigh],
              [stemGapX, barHigh],
              [stemGapX, barLow],
              [W - T, barLow]
            ]
          ]
        };
      }
    },

    B: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'B-stem-upper', type: 'vertical-bridge', position: 'upper-left-counter' },
        { id: 'B-stem-lower', type: 'vertical-bridge', position: 'lower-left-counter' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const midY = 0.5, mLow = midY - T * 0.5, mHigh = midY + T * 0.5;
        const notch = C * 0.65, stemGapX = T + G;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            [
              [stemGapX, 0],
              [W - C, 0],
              [W, C],
              [W, midY - notch],
              [W - notch, midY],
              [W, midY + notch],
              [W, H - C],
              [W - C, H],
              [stemGapX, H],
              [stemGapX, H - T],
              [W - T - Ci, H - T],
              [W - T, H - T - Ci],
              [W - T, mHigh + Ci * 0.6],
              [W - T - Ci * 0.6, mHigh],
              [stemGapX, mHigh],
              [stemGapX, mLow],
              [W - T - Ci * 0.6, mLow],
              [W - T, mLow - Ci * 0.6],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [stemGapX, T]
            ]
          ]
        };
      }
    },

    C: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'C-top-center', type: 'vertical-gap', position: 'top-center' },
        { id: 'C-bot-center', type: 'vertical-gap', position: 'bottom-center' }
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
            topRightHook(W, H, T, C, Ci, gapR, H - 0.28),
            botRightHook(W, 0, T, C, Ci, gapR, 0.28)
          ]
        };
      }
    },

    D: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'D-top-stem', type: 'vertical-bridge', position: 'top-left-counter' },
        { id: 'D-bot-stem', type: 'vertical-bridge', position: 'bottom-left-counter' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const stemGapX = T + G;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rightChamferBracket(W, 0, H, T, C, Ci, stemGapX, stemGapX)
          ]
        };
      }
    },

    E: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'E-bars-bridge', type: 'vertical-gap', position: 'left-stem-junction' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const stemGapX = T + G, mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(stemGapX, H - T, W, H),
            rect(stemGapX, mLow, W - 0.06, mHigh),
            rect(stemGapX, 0, W, T)
          ]
        };
      }
    },

    F: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'F-bars-bridge', type: 'vertical-gap', position: 'left-stem-junction' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const stemGapX = T + G, mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(stemGapX, H - T, W, H),
            rect(stemGapX, mLow, W - 0.06, mHigh)
          ]
        };
      }
    },

    G: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'G-top-center', type: 'vertical-gap', position: 'top-center' },
        { id: 'G-bot-center', type: 'vertical-gap', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const midX = W * 0.5, gapL = midX - G * 0.5, gapR = midX + G * 0.5;
        const spurTop = 0.5 + T * 0.35, spurBot = spurTop - T;
        return {
          width: W,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gapL, gapL),
            topRightHook(W, H, T, C, Ci, gapR, H - 0.26),
            [
              [gapR, 0],
              [W - C, 0],
              [W, C],
              [W, spurTop],
              [midX - 0.02, spurTop],
              [midX - 0.02, spurBot],
              [W - T, spurBot],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [gapR, T]
            ]
          ]
        };
      }
    },

    H: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'H-crossbar-left', type: 'vertical-gap', position: 'left-stem' },
        { id: 'H-crossbar-right', type: 'vertical-gap', position: 'right-stem' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const barGap = G * 0.68, mLow = 0.5 - T * 0.5, mHigh = 0.5 + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(W - T, 0, W, H),
            rect(T + barGap, mLow, W - T - barGap, mHigh)
          ]
        };
      }
    },

    I: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'I-serif-gaps', type: 'vertical-gap', position: 'top-and-bottom-caps' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const midX = W * 0.5, stemL = midX - T * 0.5, stemR = midX + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(stemL, 0, stemR, H),
            rect(0, H - T, stemL - G, H),
            rect(stemR + G, H - T, W, H),
            rect(0, 0, stemL - G, T),
            rect(stemR + G, 0, W, T)
          ]
        };
      }
    },

    J: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'J-bot-center', type: 'vertical-gap', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        return {
          width: W,
          polygons: [
            botLeftHook(0, 0, T, C, Ci, gapL, 0.32),
            [
              [gapR, 0],
              [W - C, 0],
              [W, C],
              [W, H],
              [W - T, H],
              [W - T, T + Ci],
              [W - T - Ci, T],
              [gapR, T]
            ]
          ]
        };
      }
    },

    K: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'K-arm-gap', type: 'vertical-gap', position: 'left-stem-to-arms' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const armX0 = T + G, midY = 0.5;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            [
              [armX0, midY - T * 0.2],
              [armX0, midY + T * 0.75],
              [W - T * 0.95, H],
              [W, H],
              [W, H - T * 0.85]
            ],
            [
              [armX0 + T * 0.55, midY - T * 0.35],
              [armX0 + T * 1.45, midY + T * 0.2],
              [W, T * 0.85],
              [W, 0],
              [W - T * 0.95, 0]
            ]
          ]
        };
      }
    },

    L: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'L-base-gap', type: 'vertical-gap', position: 'bottom-left-corner' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(T + G, 0, W, T)
          ]
        };
      }
    },

    M: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'M-shoulder-gaps', type: 'horizontal-gap', position: 'left-and-right-stems' },
        { id: 'M-center-apex', type: 'vertical-gap', position: 'center-v-apex' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const wM = p.fixedWidth ? W : W * 1.18;
        const mMid = wM * 0.5, gL = mMid - G * 0.42, gR = mMid + G * 0.42;
        const stemTopY = 0.60, vBotY = 0.18;
        return {
          width: wM,
          polygons: [
            rect(0, 0, T, stemTopY),
            rect(wM - T, 0, wM, stemTopY),
            [
              [0, stemTopY + G],
              [T, stemTopY + G],
              [gL, vBotY],
              [gL, vBotY + T * 1.25],
              [T * 0.85, H],
              [C * 0.5, H],
              [0, H - C * 0.5]
            ],
            [
              [gR, vBotY],
              [wM - T, stemTopY + G],
              [wM, stemTopY + G],
              [wM, H - C * 0.5],
              [wM - C * 0.5, H],
              [wM - T * 0.85, H],
              [gR, vBotY + T * 1.25]
            ]
          ]
        };
      }
    },

    N: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'N-diagonal-slots', type: 'angled-gap', position: 'left-and-right-stems' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const yTopL = 0.74;
        const slopeDrop = yTopL * (T / (W - T));
        const dy = G * 1.25;
        const yL0 = yTopL - dy;
        const yL1 = yTopL - slopeDrop - dy;
        return {
          width: W,
          polygons: [
            [
              [0, 0],
              [T, 0],
              [T, yL1],
              [0, yL0]
            ],
            [
              [W - T, H - yL1],
              [W, H - yL0],
              [W, H],
              [W - T, H]
            ],
            [
              [0, yTopL],
              [0, H],
              [T, H],
              [W, H - yTopL],
              [W, 0],
              [W - T, 0]
            ]
          ]
        };
      }
    },

    O: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'O-top-bridge', type: 'vertical-bridge', position: 'top-center' },
        { id: 'O-bot-bridge', type: 'vertical-bridge', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const wO = p.fixedWidth ? W : W * 1.04;
        const gLO = wO * 0.5 - G * 0.5, gRO = wO * 0.5 + G * 0.5;
        return {
          width: wO,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gLO, gLO),
            rightChamferBracket(wO, 0, H, T, C, Ci, gRO, gRO)
          ]
        };
      }
    },

    P: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'P-bowl-top', type: 'vertical-bridge', position: 'top-left-counter' },
        { id: 'P-bowl-bot', type: 'vertical-bridge', position: 'middle-left-counter' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const bowlBot = 0.5 - T * 0.35;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rightChamferBracket(W, bowlBot, H, T, C * 0.85, Ci * 0.85, T + G, T + G)
          ]
        };
      }
    },

    Q: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'Q-top-bridge', type: 'vertical-bridge', position: 'top-center' },
        { id: 'Q-bot-bridge', type: 'vertical-bridge', position: 'bottom-center' },
        { id: 'Q-tail-gap', type: 'angled-bridge', position: 'bottom-right' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const wQ = p.fixedWidth ? W : W * 1.04;
        const gLQ = wQ * 0.5 - G * 0.5, gRQ = wQ * 0.5 + G * 0.5;
        return {
          width: wQ,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gLQ, gLQ),
            topRightHook(wQ, H, T, C, Ci, gRQ, 0.30),
            [
              [gRQ, 0.22],
              [gRQ + T * 0.85, 0.28],
              [wQ, T * 0.8],
              [wQ, 0],
              [wQ - T * 0.9, 0]
            ]
          ]
        };
      }
    },

    R: {
      hasInternalIsland: true,
      bridgeConnections: [
        { id: 'R-bowl-bridge', type: 'vertical-bridge', position: 'left-stem-to-bowl' },
        { id: 'R-leg-bridge', type: 'horizontal-gap', position: 'bowl-to-leg' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const bowlBot = 0.5 - T * 0.25;
        const legTop = bowlBot - G * 0.85;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rightChamferBracket(W, bowlBot, H, T, C * 0.85, Ci * 0.85, T + G, T + G),
            [
              [W - T * 1.9, legTop],
              [W - T * 0.75, legTop],
              [W, T * 0.9],
              [W, 0],
              [W - T, 0],
              [W - T, T * 0.65]
            ]
          ]
        };
      }
    },

    S: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'S-top-center', type: 'vertical-gap', position: 'top-center' },
        { id: 'S-bot-center', type: 'vertical-gap', position: 'bottom-center' }
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
            topRightHook(W, H, T, C, Ci, gapR, H - 0.25),
            botLeftHook(0, 0, T, C, Ci, gapL, 0.25),
            [
              [gapL, H],
              [C, H],
              [0, H - C],
              [0, mLow + cMid],
              [cMid, mLow],
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
              [T + ciMid, mHigh],
              [T, mHigh + ciMid],
              [T, H - T - Ci],
              [T + Ci, H - T],
              [gapL, H - T]
            ]
          ]
        };
      }
    },

    T: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'T-wing-gaps', type: 'vertical-gap', position: 'top-left-and-right-wings' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const stemL = W * 0.5 - T * 0.5, stemR = W * 0.5 + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(stemL, 0, stemR, H),
            rect(0, H - T, stemL - G, H),
            rect(stemR + G, H - T, W, H)
          ]
        };
      }
    },

    U: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'U-bot-center', type: 'vertical-gap', position: 'bottom-center' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        return {
          width: W,
          polygons: [
            botLeftHook(0, 0, T, C, Ci, gapL, H),
            botRightHook(W, 0, T, C, Ci, gapR, H)
          ]
        };
      }
    },

    V: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'V-bot-apex', type: 'vertical-gap', position: 'bottom-center-apex' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const gapL = W * 0.5 - G * 0.5, gapR = W * 0.5 + G * 0.5;
        const kneeY = 0.26;
        return {
          width: W,
          polygons: [
            [
              [0, kneeY],
              [0, H],
              [T, H],
              [T, kneeY + 0.04],
              [gapL, T],
              [gapL, 0],
              [C * 0.9, 0]
            ],
            [
              [gapR, 0],
              [gapR, T],
              [W - T, kneeY + 0.04],
              [W - T, H],
              [W, H],
              [W, kneeY],
              [W - C * 0.9, 0]
            ]
          ]
        };
      }
    },

    W: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'W-stem-gaps', type: 'horizontal-gap', position: 'left-and-right-stems' },
        { id: 'W-center-apex', type: 'vertical-gap', position: 'center-apex' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const wW = p.fixedWidth ? W : W * 1.18;
        const mMid = wW * 0.5, gL = mMid - G * 0.42, gR = mMid + G * 0.42;
        const stemBotY = 0.40, vTopY = 0.82;
        return {
          width: wW,
          polygons: [
            rect(0, stemBotY, T, H),
            rect(wW - T, stemBotY, wW, H),
            [
              [0, C * 0.5],
              [C * 0.5, 0],
              [T * 0.85, 0],
              [gL, vTopY - T * 1.25],
              [gL, vTopY],
              [T, stemBotY - G],
              [0, stemBotY - G]
            ],
            [
              [gR, vTopY - T * 1.25],
              [wW - T * 0.85, 0],
              [wW - C * 0.5, 0],
              [wW, C * 0.5],
              [wW, stemBotY - G],
              [wW - T, stemBotY - G],
              [gR, vTopY]
            ]
          ]
        };
      }
    },

    X: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'X-diagonal-gaps', type: 'angled-gap', position: 'center-crossing' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const span = W - T, dx = G * 1.25;
        const y1 = 0.5 - dx / (2 * span), x1 = span * y1;
        const y2 = 0.5 - (T + dx) / (2 * span), x2 = T + span * y2;
        return {
          width: W,
          polygons: [
            [
              [0, H],
              [T, H],
              [W, 0],
              [W - T, 0]
            ],
            [
              [W - x2, H - y2],
              [W - x1, H - y1],
              [W, H],
              [W - T, H]
            ],
            [
              [0, 0],
              [T, 0],
              [x2, y2],
              [x1, y1]
            ]
          ]
        };
      }
    },

    Y: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'Y-junction-gaps', type: 'vertical-and-horizontal-gap', position: 'center-y-junction' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio, C = p.chamferRatio;
        const Ci = Math.max(0.035, C - T * 0.585786);
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const midX = W * 0.5, gapL = midX - G * 0.5, gapR = midX + G * 0.5;
        const stemL = midX - T * 0.5, stemR = midX + T * 0.5, splitY = 0.48;
        return {
          width: W,
          polygons: [
            [
              [0, splitY + C * 0.8 + G],
              [0, H],
              [T, H],
              [T, splitY + G + T + Ci * 0.6],
              [T + Ci * 0.6, splitY + G + T],
              [gapL, splitY + G + T],
              [gapL, splitY + G],
              [C * 0.8, splitY + G]
            ],
            [
              [gapR, splitY + G],
              [gapR, splitY + G + T],
              [W - T - Ci * 0.6, splitY + G + T],
              [W - T, splitY + G + T + Ci * 0.6],
              [W - T, H],
              [W, H],
              [W, splitY + C * 0.8 + G],
              [W - C * 0.8, splitY + G]
            ],
            rect(stemL, 0, stemR, splitY)
          ]
        };
      }
    },

    Z: {
      hasInternalIsland: false,
      bridgeConnections: [
        { id: 'Z-bar-gaps', type: 'angled-gap', position: 'top-and-bottom-bars' }
      ],
      build(p) {
        const H = 1.0, W = p.widthRatio, T = p.strokeRatio;
        const G = p.bridgesEnabled === false ? 0.002 : p.gapRatio;
        const xDiagTopL = W - T * 1.08, yDiagBotL = T * 0.88;
        const xAtTopBarBot = xDiagTopL * ((H - T - yDiagBotL) / (H - yDiagBotL));
        const dxGap = G * 1.25;
        return {
          width: W,
          polygons: [
            [
              [0, H - T],
              [xAtTopBarBot - dxGap, H - T],
              [xDiagTopL - dxGap, H],
              [0, H]
            ],
            [
              [0, 0],
              [W - xDiagTopL, 0],
              [W, H - yDiagBotL],
              [W, H],
              [xDiagTopL, H],
              [0, yDiagBotL]
            ],
            [
              [W - xDiagTopL + dxGap, 0],
              [W, 0],
              [W, T],
              [W - xAtTopBarBot + dxGap, T]
            ]
          ]
        };
      }
    }
  };

  return {
    ALPHABET_SPECS
  };
});

