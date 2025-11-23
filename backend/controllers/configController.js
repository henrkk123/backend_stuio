import { loadConfig, saveConfig as persistConfig, getDefaultConfig } from '../services/storageService.js';
import { buildZip } from '../utils/zip.js';

export function getConfig(req, res) {
  const { id } = req.params;
  const config = loadConfig(id);

  // LLM-API-Key wird nie im Frontend ausgespielt – nur Flag, ob einer gesetzt ist.
  const { llm, ...rest } = config;
  const safeConfig = {
    ...rest,
    llm: {
      ...(llm || {}),
      apiKey: undefined,
      hasApiKey: !!(llm && llm.apiKey)
    }
  };

  res.json(safeConfig);
}

export function saveConfigController(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  // Start from existing config so Teilupdates nicht alles auf Default zurücksetzen.
  const current = loadConfig(id);
  const merged = {
    ...current,
    ...body,
    id,
    identity: { ...current.identity, ...(body.identity || {}) },
    branding: { ...current.branding, ...(body.branding || {}) },
    tone: { ...current.tone, ...(body.tone || {}) },
    widget: { ...current.widget, ...(body.widget || {}) },
    llm: (() => {
      const base = { ...(current.llm || {}) };
      const incoming = body.llm || {};
      // Nur dann überschreiben, wenn ein neuer Key übermittelt wird.
      if (typeof incoming.apiKey === 'string' && incoming.apiKey.trim()) {
        return { ...base, ...incoming, apiKey: incoming.apiKey.trim() };
      }
      // Kein neuer Key → vorhandenen behalten.
      return { ...base, ...incoming, apiKey: base.apiKey || '' };
    })()
  };

  persistConfig(id, merged);
  res.json({ ok: true, config: merged });
}

export async function exportSnippet(req, res) {
  const { id } = req.params;
  const config = loadConfig(id);
  const snippet = buildSnippet(config);
  res.type('text/plain').send(snippet);
}

export async function exportZip(req, res) {
  const { id } = req.params;
  const config = loadConfig(id);
  const zipBuffer = await buildZip(config);
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="henriktron-${id}.zip"`
  });
  res.send(zipBuffer);
}

export const saveConfig = saveConfigController;

function buildSnippet(config) {
  const backendUrl = config.export?.backendUrl || '';
  const widgetUrl = config.export?.widgetUrl || 'https://cdn.henriktron.dev/widget.js';
  const botId = config.id || 'default';
  const safeBackendUrl = backendUrl || 'https://DEIN-BACKEND-URL';

  const testSnippet = `<!-- A) Testmodus – nur zu Testzwecken, ohne Backend -->
<!--
  Dieses Snippet ruft den LLM direkt aus dem Browser auf.
  Hinterlege deinen API-Key NUR hier im Test – nicht im Produktivbetrieb.
-->
<script>
  const HENRIKTRON_TEST_PROVIDER = 'groq'; // 'groq' | 'openai' | 'together'
  const HENRIKTRON_TEST_API_KEY = 'DEIN_LLM_API_KEY_HIER';

  async function henriktronTestAsk(question) {
    const messages = [
      { role: 'system', content: 'Du bist ein Test-Q&A-Assistent für ein Firmen-FAQ.' },
      { role: 'user', content: question }
    ];
    let url = '';
    let model = '';
    if (HENRIKTRON_TEST_PROVIDER === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-4o-mini';
    } else if (HENRIKTRON_TEST_PROVIDER === 'together') {
      url = 'https://api.together.xyz/v1/chat/completions';
      model = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
    } else {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      model = 'llama-3.1-70b-versatile';
    }
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + HENRIKTRON_TEST_API_KEY
      },
      body: JSON.stringify({ model, messages, max_tokens: 250 })
    });
    if (!resp.ok) throw new Error('Testmodus fehlgeschlagen');
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
</script>

<!-- Beispiel: Button, der den Test aufruft -->
<button onclick="henriktronTestAsk('Was kann der Bot?').then(alert)">Bot im Testmodus fragen</button>`;

  const prodSnippet = `<!-- B) Produktionsmodus – Self-Host Widget -->
<!--
  Dieses Snippet nutzt dein eigenes Backend. Den LLM-API-Key
  trägst du ausschließlich in der .env deines Backends ein.
-->
<script>
  window.HenriktronConfig = {
    backendUrl: "${safeBackendUrl}",
    botId: "${botId}"
  };
</script>
<script src="${widgetUrl}"></script>
<!-- Ende Henriktron Widget -->`;

  return `${testSnippet}\n\n${prodSnippet}`;
}
