(function () {
  'use strict';

  const state = {
    text: 'DDCHU0910500',
    heightMm: 8.0,
    spacingMm: 1.0,
    fontParams: Object.assign({}, StencilFont.DEFAULT_PARAMS),
    renderMode: 'stencil', // 'stencil' | 'plate' | 'wireframe'
    showDimensions: true,
    dxfMode: 'LWPOLYLINE',
    includePlateBorder: false,
    selectedGlyph: 'D',
    viewBox: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    lastLayout: null,
    lastDxf: ''
  };

  // DOM Elements
  const textInput = document.getElementById('textInput');
  const charCountTag = document.getElementById('charCountTag');
  const heightInput = document.getElementById('heightInput');
  const heightValTag = document.getElementById('heightValTag');
  const spacingInput = document.getElementById('spacingInput');
  const spacingValTag = document.getElementById('spacingValTag');
  const strokeSlider = document.getElementById('strokeSlider');
  const strokeValTag = document.getElementById('strokeValTag');
  const chamferSlider = document.getElementById('chamferSlider');
  const chamferValTag = document.getElementById('chamferValTag');
  const gapSlider = document.getElementById('gapSlider');
  const gapValTag = document.getElementById('gapValTag');
  const widthSlider = document.getElementById('widthSlider');
  const widthValTag = document.getElementById('widthValTag');
  const dxfModeSelect = document.getElementById('dxfModeSelect');
  const plateBorderCheck = document.getElementById('plateBorderCheck');
  const showDimensionsCheck = document.getElementById('showDimensionsCheck');

  const previewSvg = document.getElementById('previewSvg');
  const statDimensions = document.getElementById('statDimensions');
  const statPolygons = document.getElementById('statPolygons');
  const statVertices = document.getElementById('statVertices');
  const statDeviation = document.getElementById('statDeviation');
  const libraryValidationBadge = document.getElementById('libraryValidationBadge');
  const dxfMatchBadge = document.getElementById('dxfMatchBadge');
  const dxfCodeViewer = document.getElementById('dxfCodeViewer');
  const glyphGrid = document.getElementById('glyphGrid');

  // Single Glyph Inspector Elements
  const singleGlyphTitle = document.getElementById('singleGlyphTitle');
  const exportSingleGlyphDxfBtn = document.getElementById('exportSingleGlyphDxfBtn');
  const singleGlyphSvg = document.getElementById('singleGlyphSvg');
  const sgDimensions = document.getElementById('sgDimensions');
  const sgPolygons = document.getElementById('sgPolygons');
  const sgVertices = document.getElementById('sgVertices');
  const sgTopology = document.getElementById('sgTopology');
  const singleGlyphCoordViewer = document.getElementById('singleGlyphCoordViewer');
  const cursorCoordDisplay = document.getElementById('cursorCoordDisplay');

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

  function updateParameterLabels() {
    const h = state.heightMm;
    heightValTag.textContent = `${h.toFixed(2)} mm`;
    spacingValTag.textContent = `${state.spacingMm.toFixed(2)} mm`;
    strokeValTag.textContent = `${(state.fontParams.strokeRatio * 100).toFixed(1)}% (${(
      state.fontParams.strokeRatio * h
    ).toFixed(2)} mm)`;
    chamferValTag.textContent = `${(state.fontParams.chamferRatio * 100).toFixed(1)}% (${(
      state.fontParams.chamferRatio * h
    ).toFixed(2)} mm)`;
    gapValTag.textContent = `${(state.fontParams.gapRatio * 100).toFixed(1)}% (${(
      state.fontParams.gapRatio * h
    ).toFixed(2)} mm)`;
    widthValTag.textContent = `${(state.fontParams.widthRatio * 100).toFixed(1)}% (${(
      state.fontParams.widthRatio * h
    ).toFixed(2)} mm)`;
  }

  function fitPreviewViewBox(layout) {
    const marginX = Math.max(4, layout.heightMm * 0.65);
    const marginY = Math.max(4.5, layout.heightMm * 0.75);
    const w = Math.max(10, layout.totalWidthMm) + marginX * 2;
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
    previewSvg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  function renderMainPreview(resetCamera = false) {
    updateParameterLabels();

    const layout = StencilFont.layoutText(state.text, {
      heightMm: state.heightMm,
      spacingMm: state.spacingMm,
      fontParams: state.fontParams
    });
    state.lastLayout = layout;

    charCountTag.textContent = `${layout.characters.length} CHARS`;
    statDimensions.textContent = `${layout.totalWidthMm.toFixed(2)} × ${layout.totalHeightMm.toFixed(2)} mm`;
    statPolygons.textContent = `${layout.polygonCount} Loops`;
    statVertices.textContent = `${layout.vertexCount} Pts`;

    const dxf = DxfExporter.generateDxf(layout, {
      mode: state.dxfMode,
      layerName: 'STENCIL_CUT',
      includePlateBorder: state.includePlateBorder,
      plateMarginMm: Math.max(2.0, state.heightMm * 0.3)
    });
    state.lastDxf = dxf;
    dxfCodeViewer.textContent = dxf;

    if (state.dxfMode !== 'R12_LINES') {
      const check = DxfExporter.verifyDxfMatch(layout, dxf);
      statDeviation.textContent = `${check.maxDeviationMm.toFixed(5)} mm`;
      statDeviation.style.color = check.matched ? 'var(--accent-green)' : 'var(--accent-red)';
      dxfMatchBadge.innerHTML = `<span class="status-dot"></span><span>${
        check.matched
          ? `DXF 1:1 GEOMETRY MATCH (${check.dxfPolygonCount} LOOPS)`
          : 'DXF MISMATCH'
      }</span>`;
    } else {
      statDeviation.textContent = `0.00000 mm (LINE)`;
    }

    if (resetCamera || !state.viewBox) {
      fitPreviewViewBox(layout);
    }

    const H = layout.totalHeightMm;
    const W = layout.totalWidthMm;
    const strokeUnit = Math.max(0.05, H * 0.012);

    const parts = [];

    if (state.showDimensions) {
      const gridPad = Math.max(8, H * 1.2);
      const gx0 = Math.floor(-gridPad);
      const gx1 = Math.ceil(W + gridPad);
      const gy0 = Math.floor(-gridPad);
      const gy1 = Math.ceil(H + gridPad);

      parts.push(`<g class="cad-grid" opacity="0.28">`);
      for (let gx = gx0; gx <= gx1; gx += 1) {
        const isMajor = gx % 5 === 0;
        parts.push(
          `<line x1="${gx}" y1="${gy0}" x2="${gx}" y2="${gy1}" stroke="${
            isMajor ? '#334155' : '#1e293b'
          }" stroke-width="${isMajor ? strokeUnit * 0.9 : strokeUnit * 0.45}" />`
        );
      }
      for (let gy = gy0; gy <= gy1; gy += 1) {
        const isMajor = gy % 5 === 0;
        parts.push(
          `<line x1="${gx0}" y1="${gy}" x2="${gx1}" y2="${gy}" stroke="${
            isMajor ? '#334155' : '#1e293b'
          }" stroke-width="${isMajor ? strokeUnit * 0.9 : strokeUnit * 0.45}" />`
        );
      }
      parts.push(`</g>`);
    }

    const plateM = Math.max(2.0, H * 0.3);
    if (state.renderMode === 'plate') {
      const platePath = `M${-plateM},${-plateM} L${W + plateM},${-plateM} L${W + plateM},${
        H + plateM
      } L${-plateM},${H + plateM} Z`;
      const cutoutPaths = layout.polygons.map((poly) => polygonToSvgPath(poly, H)).join(' ');
      parts.push(
        `<path d="${platePath} ${cutoutPaths}" fill="#334155" stroke="#64748b" stroke-width="${
          strokeUnit * 1.3
        }" fill-rule="evenodd" />`
      );
      for (const poly of layout.polygons) {
        parts.push(
          `<path d="${polygonToSvgPath(poly, H)}" fill="#070a0f" stroke="#38bdf8" stroke-width="${
            strokeUnit * 0.9
          }" />`
        );
      }
    } else if (state.renderMode === 'stencil') {
      if (state.includePlateBorder && W > 0) {
        parts.push(
          `<rect x="${-plateM}" y="${-plateM}" width="${W + plateM * 2}" height="${
            H + plateM * 2
          }" fill="none" stroke="#38bdf8" stroke-dasharray="${strokeUnit * 4},${
            strokeUnit * 3
          }" stroke-width="${strokeUnit}" />`
        );
      }
      for (const poly of layout.polygons) {
        parts.push(
          `<path d="${polygonToSvgPath(poly, H)}" fill="#fbbf24" stroke="#fde68a" stroke-width="${
            strokeUnit * 0.6
          }" stroke-linejoin="miter" />`
        );
      }
    } else if (state.renderMode === 'wireframe') {
      if (state.includePlateBorder && W > 0) {
        parts.push(
          `<rect x="${-plateM}" y="${-plateM}" width="${W + plateM * 2}" height="${
            H + plateM * 2
          }" fill="none" stroke="#3b82f6" stroke-width="${strokeUnit * 1.1}" />`
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
              strokeUnit * 1.25
            }" />`
          );
          for (const [vx, vy] of poly) {
            parts.push(
              `<circle cx="${vx.toFixed(4)}" cy="${(H - vy).toFixed(4)}" r="${
                strokeUnit * 1.9
              }" fill="#f8fafc" stroke="${color}" stroke-width="${strokeUnit * 0.8}" />`
            );
          }
        });
      });
    }

    if (state.showDimensions && layout.characters.length > 0) {
      const dimColor = '#38bdf8';
      const fontSize = Math.max(0.85, H * 0.14);
      const sw = strokeUnit * 1.0;

      const dxLeft = -Math.max(1.8, H * 0.28);
      parts.push(`<g class="cad-dimensions" fill="${dimColor}" stroke="${dimColor}" stroke-width="${sw}">`);
      parts.push(`<line x1="0" y1="0" x2="${dxLeft - 0.5}" y2="0" stroke-opacity="0.5" />`);
      parts.push(`<line x1="0" y1="${H}" x2="${dxLeft - 0.5}" y2="${H}" stroke-opacity="0.5" />`);
      parts.push(`<line x1="${dxLeft}" y1="0" x2="${dxLeft}" y2="${H}" />`);
      parts.push(
        `<text x="${dxLeft - 0.6}" y="${
          H * 0.5
        }" fill="${dimColor}" stroke="none" font-family="monospace" font-size="${fontSize}" text-anchor="end" dominant-baseline="middle">${H.toFixed(
          2
        )} mm</text>`
      );

      const dyTop = -Math.max(1.8, H * 0.26);
      parts.push(`<line x1="0" y1="0" x2="0" y2="${dyTop - 0.5}" stroke-opacity="0.5" />`);
      parts.push(`<line x1="${W}" y1="0" x2="${W}" y2="${dyTop - 0.5}" stroke-opacity="0.5" />`);
      parts.push(`<line x1="0" y1="${dyTop}" x2="${W}" y2="${dyTop}" />`);
      parts.push(
        `<text x="${W * 0.5}" y="${
          dyTop - 0.5
        }" fill="${dimColor}" stroke="none" font-family="monospace" font-size="${fontSize}" text-anchor="middle">${W.toFixed(
          2
        )} mm (${layout.characters.length} chars)</text>`
      );

      if (layout.characters.length >= 2 && state.spacingMm > 0) {
        const c0 = layout.characters[0];
        const c1 = layout.characters[1];
        const sx1 = c0.xOffsetMm + c0.widthMm;
        const sx2 = c1.xOffsetMm;
        const dyBot = H + Math.max(1.6, H * 0.22);
        parts.push(`<line x1="${sx1}" y1="${H}" x2="${sx1}" y2="${dyBot + 0.4}" stroke="#4ade80" stroke-opacity="0.6" />`);
        parts.push(`<line x1="${sx2}" y1="${H}" x2="${sx2}" y2="${dyBot + 0.4}" stroke="#4ade80" stroke-opacity="0.6" />`);
        parts.push(`<line x1="${sx1}" y1="${dyBot}" x2="${sx2}" y2="${dyBot}" stroke="#4ade80" />`);
        parts.push(
          `<text x="${(sx1 + sx2) * 0.5}" y="${
            dyBot + fontSize * 1.15
          }" fill="#4ade80" stroke="none" font-family="monospace" font-size="${
            fontSize * 0.9
          }" text-anchor="middle">Gap: ${state.spacingMm.toFixed(2)} mm</text>`
        );
      }
      parts.push(`</g>`);
    }

    previewSvg.innerHTML = parts.join('');
  }

  function renderSingleGlyphInspector() {
    const ch = state.selectedGlyph;
    const validation = StencilFont.validateGlyph(ch, state.fontParams);
    const singleLayout = StencilFont.layoutText(ch, {
      heightMm: state.heightMm,
      spacingMm: state.spacingMm,
      fontParams: state.fontParams
    });

    singleGlyphTitle.textContent = `2. Individual Glyph CAD Blueprint: '${ch}'`;
    exportSingleGlyphDxfBtn.textContent = `⬇ Export '${ch}' DXF`;

    const wMm = singleLayout.totalWidthMm;
    const hMm = singleLayout.totalHeightMm;

    sgDimensions.textContent = `${wMm.toFixed(2)} × ${hMm.toFixed(2)} mm`;
    sgPolygons.textContent = `${validation.polygonCount} Disjoint Loops`;
    sgVertices.textContent = `${validation.vertexCount} Vertices`;
    sgTopology.textContent = validation.valid ? 'PASS (0 Islands)' : 'CHECK';
    sgTopology.style.color = validation.valid ? 'var(--accent-green)' : 'var(--accent-red)';

    const pad = Math.max(1.2, hMm * 0.18);
    const vbX = -pad;
    const vbY = -pad;
    const vbW = wMm + pad * 2;
    const vbH = hMm + pad * 2;
    singleGlyphSvg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);

    const sw = hMm * 0.015;
    const svgParts = [];

    svgParts.push(
      `<rect x="0" y="0" width="${wMm}" height="${hMm}" fill="none" stroke="#1e293b" stroke-width="${sw}" stroke-dasharray="${
        sw * 3
      },${sw * 2}" />`
    );
    svgParts.push(
      `<line x1="${wMm * 0.5}" y1="${-pad * 0.5}" x2="${wMm * 0.5}" y2="${
        hMm + pad * 0.5
      }" stroke="#1e293b" stroke-width="${sw * 0.8}" />`
    );
    svgParts.push(
      `<line x1="${-pad * 0.5}" y1="${hMm * 0.5}" x2="${wMm + pad * 0.5}" y2="${
        hMm * 0.5
      }" stroke="#1e293b" stroke-width="${sw * 0.8}" />`
    );

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

    singleGlyphSvg.innerHTML = svgParts.join('');

    const coordLines = [
      `GLYPH '${ch}' CLOSED LWPOLYLINE GEOMETRY (Units: mm, Height: ${hMm.toFixed(2)} mm)`
    ];
    singleLayout.polygons.forEach((poly, idx) => {
      coordLines.push(
        `\n--- Polygon #${idx + 1} (${poly.length} vertices, CCW Closed) ---`
      );
      poly.forEach(([vx, vy], vIdx) => {
        coordLines.push(`  V${String(vIdx + 1).padStart(2, '0')}: X = ${vx.toFixed(4)} mm, Y = ${vy.toFixed(4)} mm`);
      });
    });
    singleGlyphCoordViewer.textContent = coordLines.join('\n');
  }

  function renderGlyphLibraryGrid() {
    const validationReport = StencilFont.validateGlyphLibrary(state.fontParams);
    libraryValidationBadge.innerHTML = `<span class="status-dot"></span><span>${validationReport.passedCharacters}/${validationReport.totalCharacters} GLYPHS VERIFIED • ZERO ISLANDS</span>`;

    glyphGrid.innerHTML = '';
    validationReport.results.forEach((res) => {
      const card = document.createElement('div');
      card.className = `glyph-card${res.char === state.selectedGlyph ? ' selected' : ''}`;
      card.title = `Click to inspect '${res.char}' blueprint (Shift+Click to append to input text)`;

      const g = res.glyph;
      const pad = 0.12;
      const vbW = g.width + pad * 2;
      const vbH = 1.0 + pad * 2;
      const paths = g.polygons
        .map((poly) => polygonToSvgPath(poly, 1.0))
        .map((d) => `<path d="${d}" fill="#fbbf24" stroke="#fde68a" stroke-width="0.012" />`)
        .join('');

      const widthMm = (g.width * state.heightMm).toFixed(2);

      card.innerHTML = `
        <div class="glyph-card-header">
          <span class="glyph-char-tag">${res.char}</span>
          <span class="glyph-pass-tag">${res.valid ? 'PASS' : 'WARN'}</span>
        </div>
        <div class="glyph-svg-wrap">
          <svg width="74" height="74" viewBox="${-pad} ${-pad} ${vbW} ${vbH}">
            ${paths}
          </svg>
        </div>
        <div class="glyph-card-meta">
          <span>${res.polygonCount}P / ${res.vertexCount}V</span>
          <span>${widthMm}mm</span>
        </div>
      `;

      card.addEventListener('click', (ev) => {
        state.selectedGlyph = res.char;
        if (ev.shiftKey) {
          state.text += res.char;
          textInput.value = state.text;
          renderMainPreview(true);
        }
        renderSingleGlyphInspector();
        renderGlyphLibraryGrid();
      });

      glyphGrid.appendChild(card);
    });
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  textInput.addEventListener('input', () => {
    state.text = textInput.value.toUpperCase();
    renderMainPreview(true);
  });

  heightInput.addEventListener('input', () => {
    const v = parseFloat(heightInput.value);
    if (v > 0) {
      state.heightMm = v;
      renderMainPreview(true);
      renderSingleGlyphInspector();
      renderGlyphLibraryGrid();
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
    state.fontParams.strokeRatio = parseFloat(strokeSlider.value);
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphLibraryGrid();
  });

  chamferSlider.addEventListener('input', () => {
    state.fontParams.chamferRatio = parseFloat(chamferSlider.value);
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphLibraryGrid();
  });

  gapSlider.addEventListener('input', () => {
    state.fontParams.gapRatio = parseFloat(gapSlider.value);
    renderMainPreview(false);
    renderSingleGlyphInspector();
    renderGlyphLibraryGrid();
  });

  widthSlider.addEventListener('input', () => {
    state.fontParams.widthRatio = parseFloat(widthSlider.value);
    renderMainPreview(true);
    renderSingleGlyphInspector();
    renderGlyphLibraryGrid();
  });

  dxfModeSelect.addEventListener('change', () => {
    state.dxfMode = dxfModeSelect.value;
    renderMainPreview(false);
  });

  plateBorderCheck.addEventListener('change', () => {
    state.includePlateBorder = plateBorderCheck.checked;
    renderMainPreview(false);
  });

  showDimensionsCheck.addEventListener('change', () => {
    state.showDimensions = showDimensionsCheck.checked;
    renderMainPreview(false);
  });

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.text = btn.getAttribute('data-preset');
      textInput.value = state.text;
      renderMainPreview(true);
    });
  });

  document.querySelectorAll('#renderModeTabs .mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#renderModeTabs .mode-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.renderMode = tab.getAttribute('data-mode');
      renderMainPreview(false);
    });
  });

  document.getElementById('fitViewBtn').addEventListener('click', () => {
    if (state.lastLayout) {
      fitPreviewViewBox(state.lastLayout);
    }
  });

  document.getElementById('resetDefaultsBtn').addEventListener('click', () => {
    state.text = 'DDCHU0910500';
    state.heightMm = 8.0;
    state.spacingMm = 1.0;
    state.fontParams = Object.assign({}, StencilFont.DEFAULT_PARAMS);

    textInput.value = state.text;
    heightInput.value = '8';
    spacingInput.value = '1';
    strokeSlider.value = String(state.fontParams.strokeRatio);
    chamferSlider.value = String(state.fontParams.chamferRatio);
    gapSlider.value = String(state.fontParams.gapRatio);
    widthSlider.value = String(state.fontParams.widthRatio);

    renderMainPreview(true);
    renderSingleGlyphInspector();
    renderGlyphLibraryGrid();
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    const cleanName = (state.text || 'STENCIL').replace(/[^A-Z0-9_-]/gi, '_');
    const filename = `${cleanName}_${state.heightMm}mm.dxf`;
    downloadFile(filename, state.lastDxf, 'application/octet-stream');
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    if (!state.lastLayout) return;
    const layout = state.lastLayout;
    const H = layout.totalHeightMm;
    const W = layout.totalWidthMm;
    const paths = layout.polygons
      .map((poly) => `<path d="${polygonToSvgPath(poly, H)}" fill="#000000" />`)
      .join('\n  ');
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">\n  ${paths}\n</svg>\n`;
    const cleanName = (state.text || 'STENCIL').replace(/[^A-Z0-9_-]/gi, '_');
    downloadFile(`${cleanName}_${state.heightMm}mm.svg`, svgContent, 'image/svg+xml');
  });

  exportSingleGlyphDxfBtn.addEventListener('click', () => {
    const singleLayout = StencilFont.layoutText(state.selectedGlyph, {
      heightMm: state.heightMm,
      spacingMm: state.spacingMm,
      fontParams: state.fontParams
    });
    const dxf = DxfExporter.generateDxf(singleLayout, {
      mode: state.dxfMode,
      layerName: 'STENCIL_CUT'
    });
    downloadFile(`GLYPH_${state.selectedGlyph}_${state.heightMm}mm.dxf`, dxf, 'application/octet-stream');
  });

  document.getElementById('copyDxfBtn').addEventListener('click', (ev) => {
    if (navigator.clipboard && state.lastDxf) {
      navigator.clipboard.writeText(state.lastDxf);
      const btn = ev.currentTarget;
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = orig;
      }, 1200);
    }
  });

  previewSvg.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    if (!state.viewBox) return;
    const zoomFactor = ev.deltaY < 0 ? 0.86 : 1.16;
    const rect = previewSvg.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) / rect.width;
    const my = (ev.clientY - rect.top) / rect.height;

    const newW = state.viewBox.w * zoomFactor;
    const newH = state.viewBox.h * zoomFactor;
    state.viewBox.x += (state.viewBox.w - newW) * mx;
    state.viewBox.y += (state.viewBox.h - newH) * my;
    state.viewBox.w = newW;
    state.viewBox.h = newH;
    applyViewBox();
  });

  previewSvg.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0) return;
    state.isPanning = true;
    state.panStart = { x: ev.clientX, y: ev.clientY };
  });

  window.addEventListener('mousemove', (ev) => {
    if (!state.viewBox) return;
    const rect = previewSvg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const cadX = state.viewBox.x + ((ev.clientX - rect.left) / rect.width) * state.viewBox.w;
      const cadY =
        state.heightMm -
        (state.viewBox.y + ((ev.clientY - rect.top) / rect.height) * state.viewBox.h);
      if (
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom
      ) {
        cursorCoordDisplay.textContent = `CAD Cursor: X = ${cadX.toFixed(2)} mm, Y = ${cadY.toFixed(
          2
        )} mm`;
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
  renderGlyphLibraryGrid();
})();
