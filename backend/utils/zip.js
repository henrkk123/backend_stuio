import JSZip from 'jszip';

export async function buildZip(config) {
  const zip = new JSZip();
  const snippet = `<!-- Henriktron Widget -->
<script>
  window.HenriktronConfig = {
    backendUrl: "${config.export?.backendUrl || ''}",
    botId: "${config.id || 'default'}"
  };
</script>
<script src="${config.export?.widgetUrl || 'https://cdn.henriktron.dev/widget.js'}"></script>
<!-- Ende Henriktron Widget -->`;

  const widgetJs = `// Minimal widget loader\n(function(){\n  const cfg = window.HenriktronConfig || {};\n  console.log('Henriktron widget booting', cfg);\n})();`;

  const widgetCss = `#henriktron-button{position:fixed;bottom:24px;right:24px;padding:12px 16px;border-radius:999px;background:${config.branding?.primary || '#3B82F6'};color:#0f172a;font-weight:700;border:none;box-shadow:0 18px 40px rgba(0,0,0,.18);cursor:pointer;}`;

  zip.file('config.json', JSON.stringify(config, null, 2));
  zip.file('snippet.html', snippet);
  zip.file('widget.js', widgetJs);
  zip.file('widget.css', widgetCss);
  zip.file('README.txt', [
    'Henriktron Export',
    '',
    '1) Binde snippet.html in deine Seite ein oder kopiere das Script-Tag.',
    '2) Stelle sicher, dass backendUrl auf dein Backend zeigt.',
    '3) Lade widget.js und widget.css über dein eigenes CDN.',
  ].join('\n'));

  return zip.generateAsync({ type: 'nodebuffer' });
}
