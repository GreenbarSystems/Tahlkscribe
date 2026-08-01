// Builds the static mockup pages from build/templates/*.template.html,
// inlining the two self-hosted Montserrat woff2 files as data URIs
// (matching the font-loading approach in the Tahlk app itself).
//
// Usage: node build/build.js   (run from the repo root)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const templatesDir = path.join(__dirname, 'templates');
const fontsDir = path.join(__dirname, 'fonts');

const latin = fs.readFileSync(path.join(fontsDir, 'montserrat-latin.woff2')).toString('base64');
const latinExt = fs.readFileSync(path.join(fontsDir, 'montserrat-latin-ext.woff2')).toString('base64');

const pages = {
  'tahlk-home-mockup.template.html': 'index.html',
  'tahlk-security-mockup.template.html': 'security.html',
  'tahlk-compliance-mockup.template.html': 'compliance.html',
  'tahlk-how-it-works-mockup.template.html': 'how-it-works.html',
  'tahlk-get-started-mockup.template.html': 'get-started.html',
  'tahlk-legal-mockup.template.html': 'legal.html',
  'tahlk-about-mockup.template.html': 'about.html',
};

for (const [templateName, outputName] of Object.entries(pages)) {
  const templatePath = path.join(templatesDir, templateName);
  if (!fs.existsSync(templatePath)) continue;
  const template = fs.readFileSync(templatePath, 'utf8');
  const out = template
    .replace('__LATIN_B64__', latin)
    .replace('__LATINEXT_B64__', latinExt);
  fs.writeFileSync(path.join(root, outputName), out);
  console.log('wrote', outputName, out.length, 'bytes');
}
