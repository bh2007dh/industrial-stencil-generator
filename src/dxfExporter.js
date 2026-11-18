/**
 * Accurate Industrial Stencil DXF Exporter & Round-Trip Verifier
 *
 * Exports the exact closed vector polygon geometry from StencilFont.layoutText()
 * into standard CAD DXF format (millimeter units, $INSUNITS = 4).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DxfExporter = factory();
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
        mode: 'LWPOLYLINE',
        layerName: 'STENCIL_CUT',
        includePlateBorder: false,
        plateMarginMm: 2.0
      },
      options || {}
    );

    const polygons = layout && Array.isArray(layout.polygons) ? layout.polygons : [];
    const minX = 0;
    const minY = 0;
    const maxX = layout ? layout.totalWidthMm : 0;
    const maxY = layout ? layout.totalHeightMm : 8;

    const lines = [];
    const push = (code, val) => {
      lines.push(String(code).trim());
      lines.push(String(val));
    };

    const isR12 = opts.mode === 'R12_POLYLINE' || opts.mode === 'R12_LINES';

    push(0, 'SECTION');
    push(2, 'HEADER');
    push(9, '$ACADVER');
    push(1, isR12 ? 'AC1009' : 'AC1015');
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
    push(70, 0);
    push(3, 'Solid line');
    push(72, 65);
    push(73, 0);
    push(40, '0.0');
    push(0, 'ENDTAB');

    push(0, 'TABLE');
    push(2, 'LAYER');
    push(70, 2);
    push(0, 'LAYER');
    push(2, '0');
    push(70, 0);
    push(62, 7);
    push(6, 'CONTINUOUS');
    push(0, 'LAYER');
    push(2, opts.layerName);
    push(70, 0);
    push(62, 7);
    push(6, 'CONTINUOUS');
    if (opts.includePlateBorder) {
      push(0, 'LAYER');
      push(2, 'STENCIL_PLATE');
      push(70, 0);
      push(62, 5);
      push(6, 'CONTINUOUS');
    }
    push(0, 'ENDTAB');
    push(0, 'ENDSEC');

    push(0, 'SECTION');
    push(2, 'ENTITIES');

    let handleCounter = 100;

    function emitPolygon(poly, layer) {
      if (!poly || poly.length < 3) return;

      if (opts.mode === 'LWPOLYLINE') {
        push(0, 'LWPOLYLINE');
        push(5, (handleCounter++).toString(16).toUpperCase());
        push(100, 'AcDbEntity');
        push(8, layer);
        push(100, 'AcDbPolyline');
        push(90, poly.length);
        push(70, 1);
        push(43, '0.0');
        for (let i = 0; i < poly.length; i++) {
          push(10, fmtFixed(poly[i][0]));
          push(20, fmtFixed(poly[i][1]));
        }
      } else if (opts.mode === 'R12_POLYLINE') {
        push(0, 'POLYLINE');
        push(8, layer);
        push(66, 1);
        push(70, 1);
        push(10, '0.0');
        push(20, '0.0');
        push(30, '0.0');
        for (let i = 0; i < poly.length; i++) {
          push(0, 'VERTEX');
          push(8, layer);
          push(10, fmtFixed(poly[i][0]));
          push(20, fmtFixed(poly[i][1]));
          push(30, '0.0');
        }
        push(0, 'SEQEND');
        push(8, layer);
      } else {
        for (let i = 0; i < poly.length; i++) {
          const a = poly[i];
          const b = poly[(i + 1) % poly.length];
          push(0, 'LINE');
          push(8, layer);
          push(10, fmtFixed(a[0]));
          push(20, fmtFixed(a[1]));
          push(30, '0.0');
          push(11, fmtFixed(b[0]));
          push(21, fmtFixed(b[1]));
          push(31, '0.0');
        }
      }
    }

    if (opts.includePlateBorder && maxX > 0) {
      const m = Number(opts.plateMarginMm) || 2.0;
      const platePoly = [
        [-m, -m],
        [maxX + m, -m],
        [maxX + m, maxY + m],
        [-m, maxY + m]
      ];
      emitPolygon(platePoly, 'STENCIL_PLATE');
    }

    for (let i = 0; i < polygons.length; i++) {
      emitPolygon(polygons[i], opts.layerName);
    }

    push(0, 'ENDSEC');
    push(0, 'EOF');

    return lines.join('\r\n') + '\r\n';
  }

  function parseDxfPolygons(dxfString, targetLayer = 'STENCIL_CUT') {
    const rawLines = String(dxfString || '').replace(/\r\n/g, '\n').split('\n');
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

      if (inEntities && code === 0 && val === 'LWPOLYLINE') {
        i++;
        let layer = '0';
        let closed = false;
        const pts = [];
        let pendingX = null;

        while (i < pairs.length && pairs[i][0] !== 0) {
          const [c, v] = pairs[i];
          if (c === 8) layer = v;
          if (c === 70) closed = (parseInt(v, 10) & 1) === 1;
          if (c === 10) pendingX = parseFloat(v);
          if (c === 20 && pendingX !== null) {
            pts.push([pendingX, parseFloat(v)]);
            pendingX = null;
          }
          i++;
        }
        if (!targetLayer || layer === targetLayer) {
          extracted.push({ type: 'LWPOLYLINE', layer, closed, vertices: pts });
        }
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

  function verifyDxfMatch(layout, dxfString) {
    const parsed = parseDxfPolygons(dxfString, 'STENCIL_CUT');
    const previewPolys = layout.polygons || [];
    const errors = [];

    if (parsed.length !== previewPolys.length) {
      errors.push(
        `Polygon count mismatch: preview has ${previewPolys.length}, DXF has ${parsed.length}`
      );
    }

    let maxDeviationMm = 0;
    const count = Math.min(parsed.length, previewPolys.length);
    for (let i = 0; i < count; i++) {
      const pPoly = previewPolys[i];
      const dPoly = parsed[i];
      if (!dPoly.closed) {
        errors.push(`DXF polygon ${i} is not marked closed (flag 70 != 1)`);
      }
      if (pPoly.length !== dPoly.vertices.length) {
        errors.push(
          `Polygon ${i} vertex count mismatch: preview=${pPoly.length}, DXF=${dPoly.vertices.length}`
        );
        continue;
      }
      for (let v = 0; v < pPoly.length; v++) {
        const dx = Math.abs(pPoly[v][0] - dPoly.vertices[v][0]);
        const dy = Math.abs(pPoly[v][1] - dPoly.vertices[v][1]);
        const dist = Math.hypot(dx, dy);
        if (dist > maxDeviationMm) maxDeviationMm = dist;
        if (dist > 1e-4) {
          errors.push(
            `Polygon ${i} vertex ${v} deviation ${dist.toFixed(6)} mm exceeds tolerance`
          );
        }
      }
    }

    return {
      matched: errors.length === 0,
      previewPolygonCount: previewPolys.length,
      dxfPolygonCount: parsed.length,
      maxDeviationMm,
      errors
    };
  }

  return {
    generateDxf,
    parseDxfPolygons,
    verifyDxfMatch
  };
});
