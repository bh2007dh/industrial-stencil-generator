/**
 * Geometric Industrial Stencil Vector Glyph Library (A-Z, 0-9)
 *
 * Visual & Geometric Design Principles:
 * 1. Square and rectangular character construction.
 * 2. Bold industrial lettering with uniform stroke thickness.
 * 3. Angular 45-degree cut corners (chamfered outer and inner edges).
 * 4. Built-in stencil gaps & proper bridges connecting all internal islands.
 * 5. Zero floating islands: every glyph consists of disjoint, closed, hole-free
 *    2D vector polygons shared identically between the Live Preview and DXF Exporter.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StencilFont = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_PARAMS = {
    widthRatio: 0.640,   // 5.12 mm wide at 8.00 mm height
    strokeRatio: 0.162,  // 1.30 mm bold industrial stroke at 8.00 mm height
    chamferRatio: 0.150, // 1.20 mm 45-deg outer corner chamfer at 8.00 mm height
    gapRatio: 0.072      // 0.58 mm stencil bridge gap at 8.00 mm height
  };

  const SUPPORTED_CHARS = [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
    '-', '_', '.', '/'
  ];

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

  function buildRawGlyph(char, p) {
    const H = 1.0;
    const W = p.widthRatio;
    const T = p.strokeRatio;
    const C = p.chamferRatio;
    const Ci = Math.max(0.035, C - T * 0.585786);
    const G = p.gapRatio;

    const midX = W * 0.5;
    const midY = H * 0.5;
    const gapL = midX - G * 0.5;
    const gapR = midX + G * 0.5;
    const stemGapX = T + G;

    switch (char) {
      case '0': {
        return {
          width: W,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gapL, gapL),
            rightChamferBracket(W, 0, H, T, C, Ci, gapR, gapR)
          ]
        };
      }

      case '1': {
        const w1 = W * 0.72;
        const stemR = w1 - 0.04;
        const stemL = stemR - T * 1.08;
        const flagR = stemL - G * 0.85;
        const flagL = 0.02;
        const splitY = midY - 0.04;
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

      case '2': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        const cMid = C * 0.8;
        const ciMid = Ci * 0.8;
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

      case '3': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        const notch = C * 0.65;
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
              [W, midY - notch],
              [W - notch, midY],
              [W, midY + notch],
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

      case '4': {
        const stemL = W - T;
        const stemR = W;
        const barLow = 0.28;
        const barHigh = barLow + T;
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

      case '5': {
        const mLow = midY - T * 0.42;
        const mHigh = mLow + T;
        const cMid = C * 0.85;
        const ciMid = Ci * 0.85;
        return {
          width: W,
          polygons: [
            [
              [stemGapX, H - T],
              [W, H - T],
              [W, H],
              [stemGapX, H]
            ],
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

      case '6': {
        const mHigh = midY + T * 0.45;
        const mLow = mHigh - T;
        const cMid = C * 0.85;
        const ciMid = Ci * 0.85;
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

      case '7': {
        const diagBotL = 0.08;
        const diagBotR = diagBotL + T * 1.08;
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

      case '8': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        const notch = C * 0.65;
        return {
          width: W,
          polygons: [
            [
              [gapL, H],
              [C, H],
              [0, H - C],
              [0, midY + notch],
              [notch, midY],
              [0, midY - notch],
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
              [W, midY - notch],
              [W - notch, midY],
              [W, midY + notch],
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

      case '9': {
        const mLow = midY - T * 0.45;
        const mHigh = mLow + T;
        const cMid = C * 0.85;
        const ciMid = Ci * 0.85;
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

      case 'A': {
        const kneeY = 0.62;
        const barLow = 0.28;
        const barHigh = barLow + T * 0.92;
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

      case 'B': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        const notch = C * 0.65;
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

      case 'C': {
        return {
          width: W,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gapL, gapL),
            topRightHook(W, H, T, C, Ci, gapR, H - 0.28),
            botRightHook(W, 0, T, C, Ci, gapR, 0.28)
          ]
        };
      }

      case 'D': {
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rightChamferBracket(W, 0, H, T, C, Ci, stemGapX, stemGapX)
          ]
        };
      }

      case 'E': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
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

      case 'F': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(stemGapX, H - T, W, H),
            rect(stemGapX, mLow, W - 0.06, mHigh)
          ]
        };
      }

      case 'G': {
        const spurTop = midY + T * 0.35;
        const spurBot = spurTop - T;
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

      case 'H': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        const barGap = G * 0.68;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(W - T, 0, W, H),
            rect(T + barGap, mLow, W - T - barGap, mHigh)
          ]
        };
      }

      case 'I': {
        const stemL = midX - T * 0.5;
        const stemR = midX + T * 0.5;
        const wingL = stemL - G;
        const wingR = stemR + G;
        return {
          width: W,
          polygons: [
            rect(stemL, 0, stemR, H),
            rect(0, H - T, wingL, H),
            rect(wingR, H - T, W, H),
            rect(0, 0, wingL, T),
            rect(wingR, 0, W, T)
          ]
        };
      }

      case 'J': {
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

      case 'K': {
        const armX0 = stemGapX;
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

      case 'L': {
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rect(stemGapX, 0, W, T)
          ]
        };
      }

      case 'M': {
        const wM = W * 1.18;
        const mMid = wM * 0.5;
        const gL = mMid - G * 0.42;
        const gR = mMid + G * 0.42;
        const stemTopY = 0.60;
        const vBotY = 0.18;
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

      case 'N': {
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

      case 'O': {
        const wO = W * 1.04;
        const gLO = wO * 0.5 - G * 0.5;
        const gRO = wO * 0.5 + G * 0.5;
        return {
          width: wO,
          polygons: [
            leftChamferBracket(0, 0, H, T, C, Ci, gLO, gLO),
            rightChamferBracket(wO, 0, H, T, C, Ci, gRO, gRO)
          ]
        };
      }

      case 'P': {
        const bowlBot = midY - T * 0.35;
        const cBowl = C * 0.85;
        const ciBowl = Ci * 0.85;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rightChamferBracket(W, bowlBot, H, T, cBowl, ciBowl, stemGapX, stemGapX)
          ]
        };
      }

      case 'Q': {
        const wQ = W * 1.04;
        const gLQ = wQ * 0.5 - G * 0.5;
        const gRQ = wQ * 0.5 + G * 0.5;
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

      case 'R': {
        const bowlBot = midY - T * 0.25;
        const cBowl = C * 0.85;
        const ciBowl = Ci * 0.85;
        const legTop = bowlBot - G * 0.85;
        return {
          width: W,
          polygons: [
            rect(0, 0, T, H),
            rightChamferBracket(W, bowlBot, H, T, cBowl, ciBowl, stemGapX, stemGapX),
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

      case 'S': {
        const mLow = midY - T * 0.5;
        const mHigh = midY + T * 0.5;
        const cMid = C * 0.8;
        const ciMid = Ci * 0.8;
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

      case 'T': {
        const stemL = midX - T * 0.5;
        const stemR = midX + T * 0.5;
        return {
          width: W,
          polygons: [
            rect(stemL, 0, stemR, H),
            rect(0, H - T, stemL - G, H),
            rect(stemR + G, H - T, W, H)
          ]
        };
      }

      case 'U': {
        return {
          width: W,
          polygons: [
            botLeftHook(0, 0, T, C, Ci, gapL, H),
            botRightHook(W, 0, T, C, Ci, gapR, H)
          ]
        };
      }

      case 'V': {
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

      case 'W': {
        const wW = W * 1.18;
        const mMid = wW * 0.5;
        const gL = mMid - G * 0.42;
        const gR = mMid + G * 0.42;
        const stemBotY = 0.40;
        const vTopY = 0.82;
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

      case 'X': {
        const span = W - T;
        const dx = G * 1.25;
        const y1 = 0.5 - dx / (2 * span);
        const x1 = span * y1;
        const y2 = 0.5 - (T + dx) / (2 * span);
        const x2 = T + span * y2;
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

      case 'Y': {
        const stemL = midX - T * 0.5;
        const stemR = midX + T * 0.5;
        const splitY = midY - 0.02;
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

      case 'Z': {
        const xDiagTopL = W - T * 1.08;
        const yDiagBotL = T * 0.88;
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

      case '-': {
        const mLow = midY - T * 0.45;
        const mHigh = midY + T * 0.45;
        return {
          width: W * 0.75,
          polygons: [rect(0.04, mLow, W * 0.75 - 0.04, mHigh)]
        };
      }

      case '_': {
        return {
          width: W * 0.85,
          polygons: [rect(0, 0, W * 0.85, T)]
        };
      }

      case '.': {
        return {
          width: T * 1.3,
          polygons: [rect(0.02, 0, T * 1.1, T * 1.1)]
        };
      }

      case '/': {
        return {
          width: W * 0.75,
          polygons: [
            [
              [0, 0],
              [T * 0.95, 0],
              [W * 0.75, H],
              [W * 0.75 - T * 0.95, H]
            ]
          ]
        };
      }

      default:
        return {
          width: W * 0.6,
          polygons: []
        };
    }
  }

  function getGlyphPolygons(char, customParams) {
    const p = Object.assign({}, DEFAULT_PARAMS, customParams || {});
    const upper = String(char || '').toUpperCase();
    const raw = buildRawGlyph(upper, p);
    const cleanedPolygons = raw.polygons
      .map(normalizePolygon)
      .filter((poly) => poly.length >= 3);

    return {
      char: upper,
      width: roundCoord(raw.width),
      height: 1.0,
      polygons: cleanedPolygons
    };
  }

  function layoutText(text, options) {
    const opts = Object.assign(
      {
        heightMm: 8.0,
        spacingMm: 1.0,
        fontParams: DEFAULT_PARAMS
      },
      options || {}
    );

    const scale = Number(opts.heightMm) > 0 ? Number(opts.heightMm) : 8.0;
    const spacing = Number.isFinite(Number(opts.spacingMm)) ? Number(opts.spacingMm) : 1.0;
    const chars = String(text || '').toUpperCase().split('');

    let cursorX = 0;
    const charItems = [];
    const allPolygons = [];
    let totalVertices = 0;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === ' ') {
        const spaceWidthMm = roundCoord(DEFAULT_PARAMS.widthRatio * 0.65 * scale);
        charItems.push({
          index: i,
          char: ' ',
          xOffsetMm: roundCoord(cursorX),
          widthMm: spaceWidthMm,
          heightMm: roundCoord(scale),
          polygons: []
        });
        cursorX += spaceWidthMm + (i < chars.length - 1 ? spacing : 0);
        continue;
      }

      const glyph = getGlyphPolygons(ch, opts.fontParams);
      const glyphWidthMm = roundCoord(glyph.width * scale);
      const scaledPolys = glyph.polygons.map((poly) =>
        poly.map(([x, y]) => {
          totalVertices++;
          return [roundCoord(cursorX + x * scale), roundCoord(y * scale)];
        })
      );

      for (const sp of scaledPolys) {
        allPolygons.push(sp);
      }

      charItems.push({
        index: i,
        char: glyph.char,
        xOffsetMm: roundCoord(cursorX),
        widthMm: glyphWidthMm,
        heightMm: roundCoord(scale),
        polygons: scaledPolys
      });

      cursorX += glyphWidthMm + (i < chars.length - 1 ? spacing : 0);
    }

    const totalWidthMm = roundCoord(Math.max(0, cursorX));
    const totalHeightMm = roundCoord(scale);

    return {
      text: chars.join(''),
      heightMm: totalHeightMm,
      spacingMm: roundCoord(spacing),
      totalWidthMm,
      totalHeightMm,
      characters: charItems,
      polygons: allPolygons,
      polygonCount: allPolygons.length,
      vertexCount: totalVertices
    };
  }

  function segmentsProperlyIntersect(a, b, c, d) {
    const eps = 1e-7;
    function ccw(p1, p2, p3) {
      return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    }
    const d1 = ccw(a, b, c);
    const d2 = ccw(a, b, d);
    const d3 = ccw(c, d, a);
    const d4 = ccw(c, d, b);

    if (
      ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) &&
      ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))
    ) {
      return true;
    }
    return false;
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

  function validateGlyph(char, customParams) {
    const glyph = getGlyphPolygons(char, customParams);
    const issues = [];

    if (glyph.polygons.length === 0) {
      issues.push('No polygons generated');
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    let totalVertices = 0;

    glyph.polygons.forEach((poly, pIdx) => {
      totalVertices += poly.length;
      if (poly.length < 3) {
        issues.push(`Polygon ${pIdx} has fewer than 3 vertices`);
      }
      const area = signedArea(poly);
      if (area <= 1e-5) {
        issues.push(`Polygon ${pIdx} has non-positive area (${area.toFixed(6)})`);
      }

      const n = poly.length;
      for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];
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
              issues.push(`Polygon ${i} and Polygon ${j} edges intersect`);
            }
          }
        }
        if (pointInPolygon(p1[0], p2) || pointInPolygon(p2[0], p1)) {
          issues.push(`Polygon ${i} and Polygon ${j} have nested containment (unbridged island)`);
        }
      }
    }

    if (minY < -1e-4 || maxY > 1.0001) {
      issues.push(`Vertical bounds [${minY.toFixed(4)}, ${maxY.toFixed(4)}] exceed [0, 1]`);
    }

    return {
      char: glyph.char,
      valid: issues.length === 0,
      issues,
      polygonCount: glyph.polygons.length,
      vertexCount: totalVertices,
      bounds: {
        minX: roundCoord(minX),
        maxX: roundCoord(maxX),
        minY: roundCoord(minY),
        maxY: roundCoord(maxY)
      },
      glyph
    };
  }

  function validateGlyphLibrary(customParams) {
    const coreChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    const results = coreChars.map((ch) => validateGlyph(ch, customParams));
    const allValid = results.every((r) => r.valid);
    return {
      allValid,
      totalCharacters: results.length,
      passedCharacters: results.filter((r) => r.valid).length,
      results
    };
  }

  return {
    DEFAULT_PARAMS,
    SUPPORTED_CHARS,
    getGlyphPolygons,
    layoutText,
    validateGlyph,
    validateGlyphLibrary
  };
});
