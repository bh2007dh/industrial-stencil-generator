/**
 * AutoCAD-Compatible Stencil DXF Exporter & Round-Trip Parser
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DxfExport = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function fmtFixed(num, decimals = 6) {
    const val = Math.abs(num) < 1e-9 ? 0 : Number(num);
    return val.toFixed(decimals);
  }

  function generateDxf(layout, options) {
    const opts = Object.assign(
      {
        includeCharBounds: false,
        includeAnnotations: false,
        plateMarginMm: 2.4
      },
      options || {}
    );

    const polygons = layout && Array.isArray(layout.polygons) ? layout.polygons : [];
    const W = layout && layout.totalWidthMm > 0 ? layout.totalWidthMm : 10;
    const H = layout && layout.totalHeightMm > 0 ? layout.totalHeightMm : 8;
    const m = opts.includeAnnotations ? Number(opts.plateMarginMm) || 2.4 : 0;

    const minX = opts.includeAnnotations ? -m : 0;
    const minY = opts.includeAnnotations ? -m : 0;
    const maxX = opts.includeAnnotations ? W + m : W;
    const maxY = opts.includeAnnotations ? H + m : H;

    const lines = [];
    const push = (code, val) => {
      lines.push(String(code).trim());
      lines.push(String(val));
    };

    push(0, 'SECTION');
    push(2, 'HEADER');
    push(9, '$ACADVER');
    push(1, 'AC1009');
    push(9, '$INSUNITS');
    push(70, 4);
    push(9, '$MEASUREMENT');
    push(70, 1);
    push(9, '$EXTMIN');
    push(10, fmtFixed(minX));
    push(20, fmtFixed(minY));
    push(30, fmtFixed(0));
    push(9, '$EXTMAX');
    push(10, fmtFixed(maxX));
    push(20, fmtFixed(maxY));
    push(30, fmtFixed(0));
    push(0, 'ENDSEC');

    push(0, 'SECTION');
    push(2, 'TABLES');

    push(0, 'TABLE');
    push(2, 'LTYPE');
    push(70, 1);
    push(0, 'LTYPE');
    push(2, 'CONTINUOUS');
    push(70, 64);
    push(3, 'Solid line');
    push(72, 65);
    push(73, 0);
    push(40, '0.0');
    push(0, 'ENDTAB');

    push(0, 'TABLE');
    push(2, 'LAYER');
    push(70, 4);

    push(0, 'LAYER');
    push(2, '0');
    push(70, 64);
    push(62, 7);
    push(6, 'CONTINUOUS');

    push(0, 'LAYER');
    push(2, 'STENCIL_CUTOUTS');
    push(70, 64);
    push(62, 7);
    push(6, 'CONTINUOUS');

    push(0, 'LAYER');
    push(2, 'CHAR_OUTLINES');
    push(70, 64);
    push(62, 5);
    push(6, 'CONTINUOUS');

    push(0, 'LAYER');
    push(2, 'ANNOTATIONS');
    push(70, 64);
    push(62, 3);
    push(6, 'CONTINUOUS');

    push(0, 'ENDTAB');
    push(0, 'ENDSEC');

    push(0, 'SECTION');
    push(2, 'BLOCKS');
    push(0, 'ENDSEC');

    push(0, 'SECTION');
    push(2, 'ENTITIES');

    function emitClosedPolyline(poly, layerName) {
      if (!poly || poly.length < 3) return;
      push(0, 'POLYLINE');
      push(8, layerName);
      push(66, 1);
      push(70, 1);
      push(10, '0.0');
      push(20, '0.0');
      push(30, '0.0');
      for (let v = 0; v < poly.length; v++) {
        push(0, 'VERTEX');
        push(8, layerName);
        push(10, fmtFixed(poly[v][0]));
        push(20, fmtFixed(poly[v][1]));
        push(30, '0.0');
      }
      push(0, 'SEQEND');
      push(8, layerName);
    }

    for (let i = 0; i < polygons.length; i++) {
      emitClosedPolyline(polygons[i], 'STENCIL_CUTOUTS');
    }

    if (opts.includeCharBounds && layout && Array.isArray(layout.characters)) {
      layout.characters.forEach((ch) => {
        if (ch.widthMm > 0 && ch.polygons.length > 0) {
          const x0 = ch.xOffsetMm;
          const y0 = ch.yOffsetMm;
          const x1 = x0 + ch.widthMm;
          const y1 = y0 + ch.heightMm;
          emitClosedPolyline(
            [
              [x0, y0],
              [x1, y0],
              [x1, y1],
              [x0, y1]
            ],
            'CHAR_OUTLINES'
          );
        }
      });
    }

    if (opts.includeAnnotations && W > 0) {
      emitClosedPolyline(
        [
          [-m, -m],
          [W + m, -m],
          [W + m, H + m],
          [-m, H + m]
        ],
        'ANNOTATIONS'
      );
    }

    push(0, 'ENDSEC');
    push(0, 'EOF');

    return lines.join('\r\n') + '\r\n';
  }

  function extractDxfStencilPolygons(dxfString, targetLayer = 'STENCIL_CUTOUTS') {
    const rawLines = String(dxfString || '')
      .replace(/\r\n/g, '\n')
      .split('\n');
    const pairs = [];
    for (let i = 0; i + 1 < rawLines.length; i += 2) {
      const code = parseInt(rawLines[i].trim(), 10);
      const val = rawLines[i + 1].trim();
      if (!Number.isNaN(code)) {
        pairs.push([code, val]);
      }
    }

    const extracted = [];
    let inEntities = false;
    let i = 0;

    while (i < pairs.length) {
      const [code, val] = pairs[i];
      if (code === 0 && val === 'SECTION') {
        if (i + 1 < pairs.length && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'ENTITIES') {
          inEntities = true;
          i += 2;
          continue;
        }
      }
      if (code === 0 && val === 'ENDSEC' && inEntities) {
        inEntities = false;
        i++;
        continue;
      }

      if (inEntities && code === 0 && val === 'POLYLINE') {
        i++;
        let layer = '0';
        let closed = false;
        const pts = [];
        while (i < pairs.length && pairs[i][0] !== 0) {
          const [c, v] = pairs[i];
          if (c === 8) layer = v;
          if (c === 70) closed = (parseInt(v, 10) & 1) === 1;
          i++;
        }
        while (i < pairs.length) {
          const [c0, v0] = pairs[i];
          if (c0 === 0 && v0 === 'VERTEX') {
            i++;
            let vx = 0,
              vy = 0;
            while (i < pairs.length && pairs[i][0] !== 0) {
              if (pairs[i][0] === 10) vx = parseFloat(pairs[i][1]);
              if (pairs[i][0] === 20) vy = parseFloat(pairs[i][1]);
              i++;
            }
            pts.push([vx, vy]);
          } else if (c0 === 0 && v0 === 'SEQEND') {
            i++;
            while (i < pairs.length && pairs[i][0] !== 0) i++;
            break;
          } else {
            break;
          }
        }
        if (!targetLayer || layer === targetLayer) {
          extracted.push({ type: 'POLYLINE', layer, closed, vertices: pts });
        }
        continue;
      }
      i++;
    }

    return extracted;
  }

  return {
    generateDxf,
    extractDxfStencilPolygons
  };
});
