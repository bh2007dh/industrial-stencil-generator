const fs = require('fs');
const path = require('path');

const TextLayout = require('./text-layout.js');
const PdfExport = require('./pdf-export.js');
const DxfExport = require('./dxf-export.js');
const StencilValidation = require('./validation.js');

const EXPORTS_DIR = path.resolve(__dirname, '..', 'exports');
fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const suite = StencilValidation.runFullCharacterTestSuite();
console.log(`Glyph Validation: ${suite.passedCharacters}/${suite.totalCharacters} Passed`);
if (!suite.allValid) process.exit(1);

const defaultLayout = TextLayout.layoutText('DDCHU0910500', { heightMm: 8.0, spacingMm: 1.0 });
const pdfTextOnly = PdfExport.generatePdf(defaultLayout, { mode: 'text-only' });
const pdfEngineering = PdfExport.generatePdf(defaultLayout, { mode: 'engineering' });
const dxfContent = DxfExport.generateDxf(defaultLayout, { includeCharBounds: true, includeAnnotations: true });

const check = StencilValidation.validateExportBundle(defaultLayout, pdfTextOnly, dxfContent);
if (!check.allPassed) process.exit(1);

fs.writeFileSync(path.join(EXPORTS_DIR, 'DDCHU0910500_8mm_text-only.pdf'), pdfTextOnly.pdfString, 'binary');
fs.writeFileSync(path.join(EXPORTS_DIR, 'DDCHU0910500_8mm_engineering.pdf'), pdfEngineering.pdfString, 'binary');
fs.writeFileSync(path.join(EXPORTS_DIR, 'DDCHU0910500_8mm.dxf'), dxfContent, 'utf8');
console.log('All tests and exports passed.');
