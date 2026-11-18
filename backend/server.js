/**
 * Industrial Stencil Font Generator Backend Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TextLayout = require('./text-layout.js');
const PdfExport = require('./pdf-export.js');
const DxfExport = require('./dxf-export.js');
const StencilValidation = require('./validation.js');
const ReferenceAnalyser = require('./reference-analyser.js');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.dxf': 'application/octet-stream'
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 20 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const str = Buffer.concat(chunks).toString('utf8');
        resolve(str ? JSON.parse(str) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    if (req.method === 'GET' && urlPath === '/api/validate') {
      const suite = StencilValidation.runFullCharacterTestSuite();
      return sendJson(res, 200, suite);
    }

    if (req.method === 'POST' && urlPath === '/api/export/verify-and-save') {
      const body = await readJsonBody(req);
      const layout = TextLayout.layoutText(body.text || 'DDCHU0910500', {
        heightMm: body.heightMm || 8.0,
        spacingMm: body.spacingMm !== undefined ? body.spacingMm : 1.0,
        fontParams: body.fontParams || {}
      });

      const pdfMode = body.pdfMode || 'text-only';
      const pdfRes = PdfExport.generatePdf(layout, {
        mode: pdfMode,
        title: body.title || 'INDUSTRIAL STENCIL VECTOR DRAWING'
      });

      const dxfStr = DxfExport.generateDxf(layout, {
        includeCharBounds: Boolean(body.includeCharBounds),
        includeAnnotations: Boolean(body.includeAnnotations)
      });

      const validation = StencilValidation.validateExportBundle(layout, pdfRes, dxfStr);
      if (!validation.allPassed) {
        return sendJson(res, 400, {
          success: false,
          message: 'Export validation failed',
          validation
        });
      }

      const safeName =
        String(layout.text || 'STENCIL')
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_-]/gi, '')
          .slice(0, 40) || 'STENCIL';

      const pdfFilename = `${safeName}_${layout.heightMm}mm_${pdfMode}.pdf`;
      const dxfFilename = `${safeName}_${layout.heightMm}mm.dxf`;

      fs.writeFileSync(path.join(EXPORTS_DIR, pdfFilename), pdfRes.pdfString, 'binary');
      fs.writeFileSync(path.join(EXPORTS_DIR, dxfFilename), dxfStr, 'utf8');

      return sendJson(res, 200, {
        success: true,
        pdfUrl: `/exports/${pdfFilename}`,
        dxfUrl: `/exports/${dxfFilename}`,
        pdfFilename,
        dxfFilename,
        validation
      });
    }

    if (req.method === 'POST' && urlPath === '/api/reference/upload') {
      const body = await readJsonBody(req);
      const rawName = path.basename(String(body.filename || 'reference.png'));
      const ext = path.extname(rawName).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        return sendJson(res, 400, { error: 'Unsupported format. Use PNG, JPG, or JPEG.' });
      }
      const base64Data = String(body.dataUrl || '').replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(base64Data, 'base64');
      const savedName = `uploaded_${Date.now()}${ext}`;
      const savedPath = path.join(UPLOADS_DIR, savedName);
      fs.writeFileSync(savedPath, buf);

      const report = ReferenceAnalyser.analyseReferenceBuffer(buf, rawName);
      report.imageUrl = `/uploads/${savedName}`;
      return sendJson(res, 200, report);
    }

    let targetPath;
    if (urlPath === '/' || urlPath === '/index.html') {
      targetPath = path.join(FRONTEND_DIR, 'index.html');
    } else if (urlPath === '/style.css' || urlPath === '/app.js') {
      const rootCandidate = path.join(ROOT_DIR, urlPath.slice(1));
      const feCandidate = path.join(FRONTEND_DIR, urlPath.slice(1));
      targetPath = fs.existsSync(feCandidate) ? feCandidate : rootCandidate;
    } else {
      targetPath = path.join(ROOT_DIR, urlPath);
    }

    const resolved = path.resolve(targetPath);
    if (!resolved.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(resolved, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(resolved).toLowerCase();
      const headers = {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
      };
      if (ext === '.dxf') {
        headers['Content-Disposition'] = `attachment; filename="${path.basename(resolved)}"`;
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Industrial Stencil Generator running at http://localhost:${PORT}`);
  });
}

module.exports = server;
