const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf-8');
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');

// Replace <link rel="stylesheet" href="styles.css"> with <style>...</style>
let standalone = indexHtml.replace(
  '<link rel="stylesheet" href="styles.css">',
  `<style>\n${stylesCss}\n</style>`
);

// Replace <script src="app.js"></script> with <script>...</script>
standalone = standalone.replace(
  '<script src="app.js"></script>',
  `<script>\n${appJs}\n</script>`
);

fs.writeFileSync(path.join(__dirname, 'calculator-standalone.html'), standalone, 'utf-8');
console.log('Successfully built calculator-standalone.html, size:', standalone.length);
