# Custom Industrial Stencil Font Generator
**Exact Reference-Based Vector Typography | 1:1 Vector PDF + AutoCAD DXF Export**

A browser- and Node.js-compatible industrial stencil lettering generator that builds real closed 2D vector geometry (`A–Z`, `0–9`, and engineering symbols) with 45° angular chamfered corners and integrated stencil bridges connecting all internal islands.

Works **100% client-side on GitHub Pages** (so any user can open the public link and export `.PDF` and `.DXF` files directly in their browser) as well as locally via Node.js.

---

## Key Features
- **Dedicated Vector Stencil Glyph Library (`A–Z`, `0–9`, Symbols)**: Built from true closed counter-clockwise polygons with zero floating islands.
- **Unbounded Millimetre Dimension Controls (`0` → `∞` mm)**:
  - Character Height (`8.00 mm` default)
  - Character Spacing (`1.00 mm` default)
  - Stroke Thickness (`1.30 mm` default)
  - Bridge Width / Stencil Gap (`0.58 mm` default)
  - 45° Corner Chamfer Size (`1.20 mm` default)
  - Character Width (`5.12 mm` default)
- **Live Engineering Preview**:
  - *Metal Stencil Plate Cutout*
  - *Solid Stencil Preview*
  - *White Background Engineering Inspection*
  - *CAD Cut Paths + Vertices*
- **1:1 True Millimetre Exports**:
  - **Vector PDF (`.PDF`)**: Native PDF 1.4 vector geometry (`1 mm = 2.83464567 pt`) in *Text-Only* or *Complete Engineering Drawing* mode.
  - **AutoCAD DXF (`.DXF`)**: Universal AutoCAD R12 (`AC1009`) closed `POLYLINE` geometry with separate layers (`STENCIL_CUTOUTS`, `CHAR_OUTLINES`, `ANNOTATIONS`) and `$INSUNITS = 4` (Millimetres).

---

## How to Publish on GitHub (So Everyone Can Use It Online)

### 1. Create a New Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new)
2. Enter a repository name (for example: `industrial-stencil-generator`)
3. Set visibility to **Public** and click **Create repository**.

### 2. Push This Project to GitHub
Run these commands in the terminal inside `f:\combany 2`:
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/industrial-stencil-generator.git
git branch -M main
git push -u origin main
```

### 3. Enable Live Public Web App (GitHub Pages)
1. On your GitHub repository page, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions** (or **Deploy from a branch → `main` / `/ (root)`**).
3. Your live app will be published at:
   `https://<YOUR-USERNAME>.github.io/industrial-stencil-generator/`
   Anyone with that link can generate stencil lettering and download `.PDF` and `.DXF` files directly in their browser!

---

## Running Locally
```bash
# Start local server at http://localhost:3000
npm start

# Run automated 36-glyph & PDF/DXF validation tests
npm test
```
