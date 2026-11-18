/**
 * Custom Industrial Stencil Font Generator — Frontend Application Controller
 */

(function () {
  'use strict';

  const state = {
    text: 'DDCHU0910500',
    heightMm: 8.0,
    spacingMm: 1.0,
    fontParams: Object.assign({}, GeometryEngine.DEFAULT_PARAMS),
    previewMode: 'plate', // 'plate' | 'stencil' | 'white' | 'wireframe'
    showGridDims: true,
    showCharBounds: false,
    compareReference: false,
    pdfMode: 'text-only', // 'text-only' (clean default) | 'engineering'
    dxfCharBounds: false,
    dxfAnnotations: true,
    selectedGlyph: 'D',
    viewBox: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    lastLayout: null,
    lastPdfResult: null,
    lastDxfString: '',
    lastValidation: null
  };

  const textInput = document.getElementById('textInput');
  const charCountLabel = document.getElementById('charCountLabel');
  const heightInput = document.getElementById('heightInput');
  const heightReadout = document.getElementById('heightReadout');
  const spacingInput = document.getElementById('spacingInput');
  const spacingReadout = document.getElementById('spacingReadout');
  const strokeMmInput = document.getElementById('strokeMmInput');
  const strokeSlider = document.getElementById('strokeSlider');
  const strokeReadout = document.getElementById('strokeReadout');
  const bridgeMmInput = document.getElementById('bridgeMmInput');
  const bridgeSlider = document.getElementById('bridgeSlider');
  const bridgeReadout = document.getElementById('bridgeReadout');
  const chamferMmInput = document.getElementById('chamferMmInput');
  const chamferSlider = document.getElementById('chamferSlider');
  const chamferReadout = document.getElementById('chamferReadout');
  const widthMmInput = document.getElementById('widthMmInput');
  const widthSlider = document.getElementById('widthSlider');
  const widthReadout = document.getElementById('widthReadout');

  const bridgesEnabledCheck = document.getElementById('bridgesEnabledCheck');
  const fixedWidthCheck = document.getElementById('fixedWidthCheck');
  const dxfCharBoundsCheck = document.getElementById('dxfCharBoundsCheck');
  const dxfAnnotationsCheck = document.getElementById('dxfAnnotationsCheck');
  const pdfModeSelect = document.getElementById('pdfModeSelect');

  const metricDimensions = document.getElementById('metricDimensions');
  const metricPolygons = document.getElementById('metricPolygons');
  const metricVertices = document.getElementById('metricVertices');
  const metricBridges = document.getElementById('metricBridges');

  const svgStage = document.getElementById('svgStage');
  const livePreviewSvg = document.getElementById('livePreviewSvg');
  const cursorReadout = document.getElementById('cursorReadout');
  const showGridDimsCheck = document.getElementById('showGridDimsCheck');
  const showCharBoundsCheck = document.getElementById('showCharBoundsCheck');
  const compareRefCheck = document.getElementById('compareRefCheck');
  const viewportWrapper = document.getElementById('viewportWrapper');
  const refComparisonPane = document.getElementById('refComparisonPane');
  const presetRefSelect = document.getElementById('presetRefSelect');
  const refPreviewImg = document.getElementById('refPreviewImg');
  const refAnalysisBar = document.getElementById('refAnalysisBar');

  const exportChecksTableBody = document.querySelector('#exportChecksTable tbody');
  const glyphSuiteBadge = document.getElementById('glyphSuiteBadge');
  const exportValidationBadge = document.getElementById('exportValidationBadge');

  const inspectorTitle = document.getElementById('inspectorTitle');
  const inspectorBridgeTag = document.getElementById('inspectorBridgeTag');
  const inspectorSvg = document.getElementById('inspectorSvg');
  const inspDim = document.getElementById('inspDim');
  const inspPolys = document.getElementById('inspPolys');
  const inspVerts = document.getElementById('inspVerts');
  const inspStatus = document.getElementById('inspStatus');
  const inspectorCoordPre = document.getElementById('inspectorCoordPre');
  const glyphMatrix = document.getElementById('glyphMatrix');

  const PIECE_COLORS = ['#fbbf24', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa'];

  function polygonToSvgPath(poly, totalHeightMm) {
    if (!poly || poly.length < 3) return '';
    return (
      poly
        .map(([x, y], idx) => {
          const sx = x.toFixed(4);
          const sy = (totalHeightMm - y).toFixed(4);
          return `${idx === 0 ? 'M' : 'L'}${sx},${sy}`;
        })
        .join(' ') + ' Z'
    );
  }

  function updateReadouts(skipInputs) {
    const h = state.heightMm;
    const strokeMm = state.fontParams.strokeRatio * h;
    const bridgeMm = state.fontParams.gapRatio * h;
    const chamferMm = state.fontParams.chamferRatio * h;
    const widthMm = state.fontParams.widthRatio * h;

    heightReadout.textContent = `${h.toFixed(2)} mm`;
    spacingReadout.textContent = `${state.spacingMm.toFixed(2)} mm`;
    strokeReadout.textContent = `${strokeMm.toFixed(2)} mm (${(
      state.fontParams.strokeRatio * 100
    ).toFixed(1)}%)`;
    bridgeReadout.textContent = `${bridgeMm.toFixed(2)} mm (${(
      state.fontParams.gapRatio * 100
    ).toFixed(1)}%)`;
    chamferReadout.textContent = `${chamferMm.toFixed(2)} mm (${(
      state.fontParams.chamferRatio * 100
    ).toFixed(1)}%)`;
    widthReadout.textContent = `${widthMm.toFixed(2)} mm (${(
      state.fontParams.widthRatio * 100
    ).toFixed(1)}%)`;

    if (skipInputs !== 'mm' && document.activeElement !== strokeMmInput) {
      strokeMmInput.value = Number(strokeMm.toFixed(4));
    }
    if (skipInputs !== 'mm' && document.activeElement !== bridgeMmInput) {
      bridgeMmInput.value = Number(bridgeMm.toFixed(4));
    }
    if (skipInputs !== 'mm' && document.activeElement !== chamferMmInput) {
      chamferMmInput.value = Number(chamferMm.toFixed(4));
    }
    if (skipInputs !== 'mm' && document.activeElement !== widthMmInput) {
      widthMmInput.value = Number(widthMm.toFixed(4));
    }
  }

  function fitViewBox(layout) {
    const marginX = Math.max(5.0, layout.heightMm * 0.7);
    const marginY = Math.max(5.0, layout.heightMm * 0.8);
    const w = Math.max(12, layout.totalWidthMm) + marginX * 2;
    const h = layout.totalHeightMm + marginY * 2;
    state.viewBox = {
      x: -marginX,
      y: -marginY,
      w,
      h
    };
    applyViewBox();
  }

  function applyViewBox() {
    if (!state.viewBox) return;
    const { x, y, w, h } = state.viewBox;
    livePreviewSvg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  function zoomBy(factor) {
    if (!state.viewBox) return;
    const nw = state.viewBox.w * factor;
    const nh = state.viewBox.h * factor;
    state.viewBox.x += (state.viewBox.w - nw) * 0.5;
    state.viewBox.y += (state.viewBox.h - nh) * 0.5;
    state.viewBox.w = nw;
    state.viewBox.h = nh;
    applyViewBox();
  }

  function renderMainPreview(resetCamera = false) {
    updateReadouts();

    const layout = TextLayout.layoutText(state.text, {
      heightMm: state.heightMm,
      spacingMm: state.spacingMm,
      fontParams: state.fontParams
    });
    state.lastLayout = layout;

    charCountLabel.textContent = `${layout.characters.length} CHARS • ${layout.lineCount} LINE${
      layout.lineCount > 1 ? 'S' : ''
    }`;
    metricDimensions.textContent = `${layout.totalWidthMm.toFixed(2)} × ${layout.totalHeightMm.toFixed(
      2
    )} mm`;
    metricPolygons.textContent = `${layout.polygonCount} Loops`;
    metricVertices.textContent = `${layout.vertexCount} Pts`;
    metricBridges.textContent = `${layout.bridgeCount} Bridges`;

    const pdfRes = PdfExport.generatePdf(layout, {
      mode: state.pdfMode,
      title: 'INDUSTRIAL STENCIL VECTOR DRAWING'
    });
    state.lastPdfResult = pdfRes;

    const plateM = Math.max(2.0, layout.heightMm * 0.3);
    const dxfStr = DxfExport.generateDxf(layout, {
      includeCharBounds: state.dxfCharBounds,
      includeAnnotations: state.dxfAnnotations,
      plateMarginMm: plateM
    });
    state.lastDxfString = dxfStr;

    const validation = StencilValidation.validateExportBundle(layout, pdfRes, dxfStr);
    state.lastValidation = validation;
    renderValidationTable(validation);

    if (resetCamera || !state.viewBox) {
      fitViewBox(layout);
    }

    const isWhite = state.previewMode === 'white';
    svgStage.classList.toggle('white-inspection', isWhite);

    const H = layout.totalHeightMm;
    const W = layout.totalWidthMm;
    const sw = Math.max(0.05, layout.heightMm * 0.012);
    const parts = [];

    if (state.showGridDims) {
      const gridPad = Math.max(8, layout.heightMm * 1.2);
      const gx0 = Math.floor(-gridPad);
      const gx1 = Math.ceil(W + gridPad);
      const gy0 = Math.floor(-gridPad);
      const gy1 = Math.ceil(H + gridPad);
      const majorCol = isWhite ? '#cbd5e1' : '#334155';
      const minorCol = isWhite ? '#f1f5f9' : '#1e293b';

      parts.push(`<g opacity="${isWhite ? '0.85' : '0.30'}">`);
      for (let gx = gx0; gx <= gx1; gx += 1) {
        const isMajor = gx % 5 === 0;
        parts.push(
          `<line x1="${gx}" y1="${gy0}" x2="${gx}" y2="${gy1}" stroke="${
            isMajor ? majorCol : minorCol
          }" stroke-width="${isMajor ? sw * 0.9 : sw * 0.45}" />`
        );
      }
      for (let gy = gy0; gy <= gy1; gy += 1) {
        const isMajor = gy % 5 === 0;
        parts.push(
          `<line x1="${gx0}" y1="${gy}" x2="${gx1}" y2="${gy}" stroke="${
            isMajor ? majorCol : minorCol
          }" stroke-width="${isMajor ? sw * 0.9 : sw * 0.45}" />`
        );
      }
      parts.push(`</g>`);
    }

    if (state.showCharBounds) {
      const boundCol = isWhite ? '#64748b' : '#38bdf8';
      parts.push(
        `<g fill="none" stroke="${boundCol}" stroke-opacity="${
          isWhite ? '0.55' : '0.32'
        }" stroke-width="${sw * 0.75}" stroke-dasharray="${sw * 2.5},${sw * 2}">`
      );
      layout.characters.forEach((ch) => {
        const cySvg = H - ch.yOffsetMm - ch.heightMm;
        parts.push(
          `<rect x="${ch.xOffsetMm}" y="${cySvg}" width="${ch.widthMm}" height="${ch.heightMm}" />`
        );
      });
      parts.push(`</g>`);
    }

    if (state.previewMode === 'plate') {
      const platePath = `M${-plateM},${-plateM} L${W + plateM},${-plateM} L${W + plateM},${
        H + plateM
      } L${-plateM},${H + plateM} Z`;
      const cutoutPaths = layout.polygons.map((poly) => polygonToSvgPath(poly, H)).join(' ');
      parts.push(
        `<path d="${platePath} ${cutoutPaths}" fill="#334155" stroke="#64748b" stroke-width="${
          sw * 1.3
        }" fill-rule="evenodd" />`
      );
      for (const poly of layout.polygons) {
        parts.push(
          `<path d="${polygonToSvgPath(poly, H)}" fill="#070a0f" stroke="#38bdf8" stroke-width="${
            sw * 0.9
          }" />`
        );
      }
    } else if (state.previewMode === 'stencil') {
      if (state.dxfAnnotations && W > 0) {
        parts.push(
          `<rect x="${-plateM}" y="${-plateM}" width="${W + plateM * 2}" height="${
            H + plateM * 2
          }" fill="none" stroke="#38bdf8" stroke-dasharray="${sw * 4},${
            sw * 3
          }" stroke-width="${sw}" />`
        );
      }
      for (const poly of layout.polygons) {
        parts.push(
          `<path d="${polygonToSvgPath(poly, H)}" fill="#fbbf24" stroke="#fde68a" stroke-width="${
            sw * 0.6
          }" stroke-linejoin="miter" />`
        );
      }
    } else if (state.previewMode === 'white') {
      if (state.dxfAnnotations && W > 0) {
        parts.push(
          `<rect x="${-plateM}" y="${-plateM}" width="${W + plateM * 2}" height="${
            H + plateM * 2
          }" fill="none" stroke="#0f172a" stroke-width="${sw * 1.1}" />`
        );
      }
      for (const poly of layout.polygons) {
        parts.push(
          `<path d="${polygonToSvgPath(poly, H)}" fill="#000000" stroke="#000000" stroke-width="${
            sw * 0.4
          }" />`
        );
      }
    } else if (state.previewMode === 'wireframe') {
      if (state.dxfAnnotations && W > 0) {
        parts.push(
          `<rect x="${-plateM}" y="${-plateM}" width="${W + plateM * 2}" height="${
            H + plateM * 2
          }" fill="none" stroke="#3b82f6" stroke-width="${sw * 1.1}" />`
        );
      }
      layout.characters.forEach((chItem) => {
        chItem.polygons.forEach((poly, pIdx) => {
          const color = PIECE_COLORS[pIdx % PIECE_COLORS.length];
          parts.push(
            `<path d="${polygonToSvgPath(
              poly,
              H
            )}" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-width="${
              sw * 1.25
            }" />`
          );
          for (const [vx, vy] of poly) {
            parts.push(
              `<circle cx="${vx.toFixed(4)}" cy="${(H - vy).toFixed(4)}" r="${
                sw * 1.9
              }" fill="#f8fafc" stroke="${color}" stroke-width="${sw * 0.8}" />`
            );
          }
        });
      });
    }

    if (state.showGridDims && layout.characters.length > 0) {
      const dimCol = isWhite ? '#0369a1' : '#38bdf8';
      const gapCol = isWhite ? '#15803d' : '#4ade80';
      const fontSize = Math.max(0.85, layout.heightMm * 0.14);

      const dxLeft = -Math.max(1.8, layout.heightMm * 0.28);
      parts.push(`<g fill="${dimCol}" stroke="${dimCol}" stroke-width="${sw}">`);
      parts.push(`<line x1="0" y1="0" x2="${dxLeft - 0.5}" y2="0" stroke-opacity="0.5" />`);
      parts.push(`<line x1="0" y1="${H}" x2="${dxLeft - 0.5}" y2="${H}" stroke-opacity="0.5" />`);
      parts.push(`<line x1="${dxLeft}" y1="0" x2="${dxLeft}" y2="${H}" />`);
      parts.push(
        `<text x="${dxLeft - 0.6}" y="${
          H * 0.5
        }" stroke="none" font-family="monospace" font-size="${fontSize}" text-anchor="end" dominant-baseline="middle">${H.toFixed(
          2
        )} mm</text>`
      );

      const dyTop = -Math.max(1.8, layout.heightMm * 0.26);
      parts.push(`<line x1="0" y1="0" x2="0" y2="${dyTop - 0.5}" stroke-opacity="0.5" />`);
      parts.push(`<line x1="${W}" y1="0" x2="${W}" y2="${dyTop - 0.5}" stroke-opacity="0.5" />`);
      parts.push(`<line x1="0" y1="${dyTop}" x2="${W}" y2="${dyTop}" />`);
      parts.push(
        `<text x="${W * 0.5}" y="${
          dyTop - 0.5
        }" stroke="none" font-family="monospace" font-size="${fontSize}" text-anchor="middle">${W.toFixed(
          2
        )} mm (${layout.characters.length} chars)</text>`
      );

      if (layout.characters.length >= 2 && state.spacingMm > 0) {
        const c0 = layout.characters[0];
        const c1 = layout.characters[1];
        if (c0.lineIndex === c1.lineIndex) {
          const sx1 = c0.xOffsetMm + c0.widthMm;
          const sx2 = c1.xOffsetMm;
          const dyBot = H + Math.max(1.6, layout.heightMm * 0.22);
          parts.push(
            `<line x1="${sx1}" y1="${H}" x2="${sx1}" y2="${
              dyBot + 0.4
            }" stroke="${gapCol}" stroke-opacity="0.6" />`
          );
          parts.push(
            `<line x1="${sx2}" y1="${H}" x2="${sx2}" y2="${
              dyBot + 0.4
            }" stroke="${gapCol}" stroke-opacity="0.6" />`
          );
          parts.push(`<line x1="${sx1}" y1="${dyBot}" x2="${sx2}" y2="${dyBot}" stroke="${gapCol}" />`);
          parts.push(
            `<text x="${(sx1 + sx2) * 0.5}" y="${
              dyBot + fontSize * 1.15
            }" fill="${gapCol}" stroke="none" font-family="monospace" font-size="${
              fontSize * 0.9
            }" text-anchor="middle">Gap: ${state.spacingMm.toFixed(2)} mm</text>`
          );
        }
      }
      parts.push(`</g>`);
    }

    livePreviewSvg.innerHTML = parts.join('');
  }

  function renderValidationTable(validation) {
    if (!validation) return;
    exportValidationBadge.innerHTML = `<span class="dot"></span><span>${
      validation.checks.filter((c) => c.passed).length
    }/${validation.checks.length} EXPORT CHECKS VERIFIED (1:1 MM)</span>`;

    exportChecksTableBody.innerHTML = validation.checks
      .map(
        (c) => `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td style="color:${c.passed ? '#4ade80' : '#ef4444'}; font-weight:700;">${
          c.passed ? 'PASS' : 'WARN'
        }</td>
        <td style="color:var(--text-secondary);">${c.detail}</td>
      </tr>
    `
      )
      .join('');
  }

  function renderSingleGlyphInspector() {
    const ch = state.selectedGlyph;
    const singleVal = StencilValidation.validateSingleGlyph(ch, state.fontParams);
    const singleLayout = TextLayout.layoutText(ch, {
      heightMm: state.heightMm,
      spacingMm: state.spacingMm,
      fontParams: state.fontParams
    });

    inspectorTitle.textContent = `Individual Glyph Geometry Inspector: '${ch}'`;
    inspectorBridgeTag.textContent = `${singleVal.bridgeCount} Bridges • 0 Islands`;

    const wMm = singleLayout.totalWidthMm;
    const hMm = singleLayout.totalHeightMm;

    inspDim.textContent = `${wMm.toFixed(2)} × ${hMm.toFixed(2)} mm`;
    inspPolys.textContent = `${singleVal.polygonCount} Closed Loops`;
    inspVerts.textContent = `${singleVal.vertexCount} Vertices`;
    inspStatus.textContent = singleVal.valid ? 'BRIDGED (PASS)' : 'CHECK';
    inspStatus.style.color = singleVal.valid ? '#4ade80' : '#ef4444';

    const pad = Math.max(1.2, hMm * 0.18);
    inspectorSvg.setAttribute('viewBox', `${-pad} ${-pad} ${wMm + pad * 2} ${hMm + pad * 2}`);

    const sw = hMm * 0.015;
    const svgParts = [
      `<rect x="0" y="0" width="${wMm}" height="${hMm}" fill="none" stroke="#1e293b" stroke-width="${sw}" stroke-dasharray="${
        sw * 3
      },${sw * 2}" />`
    ];

    singleLayout.polygons.forEach((poly, idx) => {
      const color = PIECE_COLORS[idx % PIECE_COLORS.length];
      svgParts.push(
        `<path d="${polygonToSvgPath(
          poly,
          hMm
        )}" fill="${color}" fill-opacity="0.28" stroke="${color}" stroke-width="${sw * 1.4}" />`
      );
      for (const [vx, vy] of poly) {
        svgParts.push(
          `<circle cx="${vx}" cy="${hMm - vy}" r="${sw * 2.1}" fill="#ffffff" stroke="${color}" stroke-width="${sw}" />`
        );
      }
    });
    inspectorSvg.innerHTML = svgParts.join('');

    const coordLines = [
      `GLYPH '${ch}' VECTOR METADATA (Height: ${hMm.toFixed(2)} mm, Width: ${wMm.toFixed(2)} mm)`,
      `Bridges: ${
        singleVal.glyph.bridgeConnections.map((b) => `${b.id} (${b.type})`).join(', ') || 'None'
      }`
    ];
    singleLayout.polygons.forEach((poly, idx) => {
      coordLines.push(`\nPolygon #${idx + 1} (${poly.length} CCW Vertices):`);
      poly.forEach(([vx, vy], vIdx) => {
        coordLines.push(`  V${vIdx + 1}: (${vx.toFixed(4)} mm, ${vy.toFixed(4)} mm)`);
      });
    });
    inspectorCoordPre.textContent = coordLines.join('\n');
  }

  function renderGlyphMatrix() {
    const suite = StencilValidation.runFullCharacterTestSuite(state.fontParams);
    glyphSuiteBadge.innerHTML = `<span class="dot"></span><span>GLYPH SUITE: ${suite.passedCharacters}/${suite.totalCharacters} PASS (A–Z, 0–9)</span>`;

    const symbolChars = ['-', '.', '/', '_', ':', '+', '#'];
    const symbolResults = symbolChars.map((ch) =>
      StencilValidation.validateSingleGlyph(ch, state.fontParams)
    );
    const allResults = [...suite.glyphResults, ...symbolResults];

    glyphMatrix.innerHTML = '';
    allResults.forEach((res) => {
      const tile = document.createElement('div');
      tile.className = `g-tile${res.char === state.selectedGlyph ? ' selected' : ''}`;
      const g = res.glyph;
      const pad = 0.12;
      const paths = g.polygons
        .map((poly) => polygonToSvgPath(poly, 1.0))
        .map((d) => `<path d="${d}" fill="#fbbf24" stroke="#fde68a" stroke-width="0.012" />`)
        .join('');

      const widthMm = (g.width * state.heightMm).toFixed(2);
      tile.innerHTML = `
        <div class="g-tile-top">
          <span class="g-char">${res.char}</span>
          <span class="g-pass">${res.valid ? 'PASS' : 'WARN'}</span>
        </div>
        <div class="g-svg-box">
          <svg width="58" height="58" viewBox="${-pad} ${-pad} ${g.width + pad * 2} ${1 + pad * 2}">
            ${paths}
          </svg>
        </div>
        <div class="g-tile-bot">
          <span>${res.polygonCount}P/${res.vertexCount}V</span>
          <span>${widthMm}mm</span>
        </div>
      `;

      tile.addEventListener('click', () => {
        state.selectedGlyph = res.char;
        renderSingleGlyphInspector();
        renderGlyphMatrix();
      });

      glyphMatrix.appendChild(tile);
    });
  }

  function downloadBinaryFile(filename, content, mimeType) {
    const bytes = new Uint8Array(content.length);
    for (let i = 0; i < content.length; i++) {
      bytes[i] = content.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  async function saveVerifiedExportOnServer() {
    try {
      await fetch('/api/export/verify-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: state.text,
          heightMm: state.heightMm,
          spacingMm: state.spacingMm,
          fontParams: state.fontParams,
          pdfMode: state.pdfMode,
          includeCharBounds: state.dxfCharBounds,
          includeAnnotations: state.dxfAnnotations
        })
      });
    } catch (_) {}
  }

  textInput.addEventListener('input', () => {
    state.text = textInput.value.toUpperCase();
    renderMainPreview(true);
  });

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.text = btn.getAttribute('data-preset');
      textInput.value = state.text;
      renderMainPreview(true);
    });
  });

  heightInput.addEventListener('input', () => {
    const v = parseFloat(heightInput.value);
    if (Number.isFinite(v) && v >= 0) {
      state.heightMm = v;
      renderMainPreview(true);
      renderSingleGlyphInspector();
      renderGlyphMatrix();
    }
  });

  spacingInput.addEventListener('input', () => {
    const v = parseFloat(spacingInput.value);
    if (Number.isFinite(v) && v >= 0) {
      state.spacingMm = v;
      renderMainPreview(true);
    }
  });

  strokeSlider.addEventListener('input', () => {
    state.fontParams.strokeRatio = Math.max(0, parseFloat(strokeSlider.value) || 0);
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  strokeMmInput.addEventListener('input', () => {
    const mm = parseFloat(strokeMmInput.value);
    if (Number.isFinite(mm) && mm >= 0) {
      const h = state.heightMm > 0 ? state.heightMm : 8.0;
      const ratio = mm / h;
      state.fontParams.strokeRatio = ratio;
      if (ratio > parseFloat(strokeSlider.max)) strokeSlider.max = String(Math.ceil(ratio * 2));
      strokeSlider.value = String(ratio);
      renderMainPreview(false);
      renderSingleGlyphInspector();
      renderGlyphMatrix();
    }
  });

  bridgeSlider.addEventListener('input', () => {
    state.fontParams.gapRatio = Math.max(0, parseFloat(bridgeSlider.value) || 0);
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  bridgeMmInput.addEventListener('input', () => {
    const mm = parseFloat(bridgeMmInput.value);
    if (Number.isFinite(mm) && mm >= 0) {
      const h = state.heightMm > 0 ? state.heightMm : 8.0;
      const ratio = mm / h;
      state.fontParams.gapRatio = ratio;
      if (ratio > parseFloat(bridgeSlider.max)) bridgeSlider.max = String(Math.ceil(ratio * 2));
      bridgeSlider.value = String(ratio);
      renderMainPreview(false);
      renderSingleGlyphInspector();
      renderGlyphMatrix();
    }
  });

  chamferSlider.addEventListener('input', () => {
    state.fontParams.chamferRatio = Math.max(0, parseFloat(chamferSlider.value) || 0);
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  chamferMmInput.addEventListener('input', () => {
    const mm = parseFloat(chamferMmInput.value);
    if (Number.isFinite(mm) && mm >= 0) {
      const h = state.heightMm > 0 ? state.heightMm : 8.0;
      const ratio = mm / h;
      state.fontParams.chamferRatio = ratio;
      if (ratio > parseFloat(chamferSlider.max)) chamferSlider.max = String(Math.ceil(ratio * 2));
      chamferSlider.value = String(ratio);
      renderMainPreview(false);
      renderSingleGlyphInspector();
      renderGlyphMatrix();
    }
  });

  widthSlider.addEventListener('input', () => {
    state.fontParams.widthRatio = Math.max(0, parseFloat(widthSlider.value) || 0);
    renderMainPreview(true);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  widthMmInput.addEventListener('input', () => {
    const mm = parseFloat(widthMmInput.value);
    if (Number.isFinite(mm) && mm >= 0) {
      const h = state.heightMm > 0 ? state.heightMm : 8.0;
      const ratio = mm / h;
      state.fontParams.widthRatio = ratio;
      if (ratio > parseFloat(widthSlider.max)) widthSlider.max = String(Math.ceil(ratio * 2));
      widthSlider.value = String(ratio);
      renderMainPreview(true);
      renderSingleGlyphInspector();
      renderGlyphMatrix();
    }
  });

  bridgesEnabledCheck.addEventListener('change', () => {
    state.fontParams.bridgesEnabled = bridgesEnabledCheck.checked;
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  fixedWidthCheck.addEventListener('change', () => {
    state.fontParams.fixedWidth = fixedWidthCheck.checked;
    renderMainPreview(true);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  dxfCharBoundsCheck.addEventListener('change', () => {
    state.dxfCharBounds = dxfCharBoundsCheck.checked;
    renderMainPreview(false);
  });

  dxfAnnotationsCheck.addEventListener('change', () => {
    state.dxfAnnotations = dxfAnnotationsCheck.checked;
    renderMainPreview(false);
  });

  pdfModeSelect.addEventListener('change', () => {
    state.pdfMode = pdfModeSelect.value;
    renderMainPreview(false);
  });

  document.getElementById('resetDefaultsBtn').addEventListener('click', () => {
    state.text = 'DDCHU0910500';
    state.heightMm = 8.0;
    state.spacingMm = 1.0;
    state.fontParams = Object.assign({}, GeometryEngine.DEFAULT_PARAMS);

    textInput.value = state.text;
    heightInput.value = '8';
    spacingInput.value = '1';
    strokeSlider.value = String(state.fontParams.strokeRatio);
    bridgeSlider.value = String(state.fontParams.gapRatio);
    chamferSlider.value = String(state.fontParams.chamferRatio);
    widthSlider.value = String(state.fontParams.widthRatio);
    bridgesEnabledCheck.checked = true;
    fixedWidthCheck.checked = false;

    renderMainPreview(true);
    renderSingleGlyphInspector();
    renderGlyphMatrix();
  });

  document.querySelectorAll('#previewModeTabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#previewModeTabs .tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.previewMode = btn.getAttribute('data-mode');
      renderMainPreview(false);
    });
  });

  showGridDimsCheck.addEventListener('change', () => {
    state.showGridDims = showGridDimsCheck.checked;
    renderMainPreview(false);
  });

  showCharBoundsCheck.addEventListener('change', () => {
    state.showCharBounds = showCharBoundsCheck.checked;
    renderMainPreview(false);
  });

  compareRefCheck.addEventListener('change', () => {
    state.compareReference = compareRefCheck.checked;
    refComparisonPane.style.display = state.compareReference ? 'flex' : 'none';
    viewportWrapper.classList.toggle('split-compare', state.compareReference);
  });

  presetRefSelect.addEventListener('change', () => {
    refPreviewImg.src = presetRefSelect.value;
  });

  function handleReferenceFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      refPreviewImg.src = dataUrl;
      compareRefCheck.checked = true;
      state.compareReference = true;
      refComparisonPane.style.display = 'flex';
      viewportWrapper.classList.add('split-compare');

      try {
        const res = await fetch('/api/reference/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, dataUrl })
        });
        const report = await res.json();
        if (report && report.analysis) {
          refAnalysisBar.textContent = `Uploaded ${report.filename} (${report.format} ${report.imageWidthPx}×${report.imageHeightPx}px): ${report.analysis.characterConstruction} • ${report.analysis.cornerStyle}`;
        }
      } catch (_) {
        refAnalysisBar.textContent = `Loaded Reference: ${file.name} • Square/Rectangular Industrial • 45° Chamfered`;
      }
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('refUploadInput').addEventListener('change', (ev) => {
    handleReferenceFileUpload(ev.target.files[0]);
  });
  document.getElementById('refUploadInput2').addEventListener('change', (ev) => {
    handleReferenceFileUpload(ev.target.files[0]);
  });

  document.getElementById('zoomInBtn').addEventListener('click', () => zoomBy(0.82));
  document.getElementById('zoomOutBtn').addEventListener('click', () => zoomBy(1.22));
  document.getElementById('fitViewBtn').addEventListener('click', () => {
    if (state.lastLayout) fitViewBox(state.lastLayout);
  });

  document.getElementById('exportPdfBtn').addEventListener('click', async () => {
    renderMainPreview(false);
    if (!state.lastValidation || !state.lastValidation.allPassed) {
      alert('Export validation failed. Check the validation table.');
      return;
    }
    await saveVerifiedExportOnServer();
    const safeName =
      (state.text || 'STENCIL').trim().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/gi, '') ||
      'STENCIL';
    const filename = `${safeName}_${state.heightMm}mm_${state.pdfMode}.pdf`;
    downloadBinaryFile(filename, state.lastPdfResult.pdfString, 'application/pdf');
  });

  document.getElementById('previewPdfTabBtn').addEventListener('click', async () => {
    renderMainPreview(false);
    await saveVerifiedExportOnServer();
    const bytes = new Uint8Array(state.lastPdfResult.pdfString.length);
    for (let i = 0; i < state.lastPdfResult.pdfString.length; i++) {
      bytes[i] = state.lastPdfResult.pdfString.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  });

  document.getElementById('exportDxfBtn').addEventListener('click', async () => {
    renderMainPreview(false);
    if (!state.lastValidation || !state.lastValidation.allPassed) {
      alert('Export validation failed. Check the validation table.');
      return;
    }
    await saveVerifiedExportOnServer();
    const safeName =
      (state.text || 'STENCIL').trim().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/gi, '') ||
      'STENCIL';
    const filename = `${safeName}_${state.heightMm}mm.dxf`;
    downloadBinaryFile(filename, state.lastDxfString, 'application/octet-stream');
  });

  livePreviewSvg.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    if (!state.viewBox) return;
    const zoomFactor = ev.deltaY < 0 ? 0.86 : 1.16;
    const rect = livePreviewSvg.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) / rect.width;
    const my = (ev.clientY - rect.top) / rect.height;

    const nw = state.viewBox.w * zoomFactor;
    const nh = state.viewBox.h * zoomFactor;
    state.viewBox.x += (state.viewBox.w - nw) * mx;
    state.viewBox.y += (state.viewBox.h - nh) * my;
    state.viewBox.w = nw;
    state.viewBox.h = nh;
    applyViewBox();
  });

  livePreviewSvg.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0) return;
    state.isPanning = true;
    state.panStart = { x: ev.clientX, y: ev.clientY };
  });

  window.addEventListener('mousemove', (ev) => {
    if (!state.viewBox) return;
    const rect = livePreviewSvg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const cadX = state.viewBox.x + ((ev.clientX - rect.left) / rect.width) * state.viewBox.w;
      const cadY =
        (state.lastLayout ? state.lastLayout.totalHeightMm : state.heightMm) -
        (state.viewBox.y + ((ev.clientY - rect.top) / rect.height) * state.viewBox.h);
      if (
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom
      ) {
        cursorReadout.textContent = `X: ${cadX.toFixed(2)} mm, Y: ${cadY.toFixed(2)} mm`;
      }
    }

    if (!state.isPanning) return;
    const dx = ((ev.clientX - state.panStart.x) / rect.width) * state.viewBox.w;
    const dy = ((ev.clientY - state.panStart.y) / rect.height) * state.viewBox.h;
    state.viewBox.x -= dx;
    state.viewBox.y -= dy;
    state.panStart = { x: ev.clientX, y: ev.clientY };
    applyViewBox();
  });

  window.addEventListener('mouseup', () => {
    state.isPanning = false;
  });

  renderMainPreview(true);
  renderSingleGlyphInspector();
  renderGlyphMatrix();
})();
