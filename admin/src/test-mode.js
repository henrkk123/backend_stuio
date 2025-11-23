// Sofort-Testmodus: direkte Client-Calls zu Groq / OpenAI / Anthropic.
// Keine Speicherung des API-Keys (nur Variablen), kein Backend, kein localStorage.

let currentKey = '';
let currentProvider = 'groq';
let testMessages = [];
let testing = false;
let getConfigSnapshot = null;
let getNetworkConfig = null;

const PROVIDER_ENDPOINTS = {
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.1-70b-versatile' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  anthropic: { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20240620' }
};

function validateKey(key, provider) {
  if (!key || key.length < 12) throw new Error('Bitte einen gültigen API-Key eingeben.');
  const lower = provider.toLowerCase();
  if (lower === 'openai' && !key.startsWith('sk-')) throw new Error('OpenAI-Key sollte mit „sk-“ starten.');
  if (lower === 'groq' && !key.toLowerCase().startsWith('gsk')) throw new Error('Groq-Key erwartet „gsk…“');
  if (lower === 'anthropic' && !key.toLowerCase().startsWith('sk-')) throw new Error('Anthropic-Key erwartet „sk-“');
}

function buildTestPrompt(config) {
  const identity = config.identity || {};
  const tone = config.tone || {};
  const faq = Array.isArray(config.faq) ? config.faq : [];
  const widget = config.widget || {};
  const branding = config.branding || {};

  const name = identity.botName || 'Henriktron Test-Bot';
  const company = identity.company || 'ein Unternehmen';
  const voice = tone.voice || 'neutral';
  const greeting = tone.greeting || 'Hallo, wie kann ich helfen?';
  const brandVoice = tone.brandVoicePrompt || '';

  const faqLines = faq.slice(0, 8)
    .map((f, i) => `${i + 1}. Q: ${f.q} / A: ${f.a}`)
    .join('\n');

  return [
    `Du bist ${name}, ein Test-Q&A-Assistent für ${company}.`,
    `Tonfall: ${voice}.`,
    `Begrüßung: ${greeting}.`,
    brandVoice ? `Brand-Voice: ${brandVoice}.` : '',
    widget.title ? `Widget-Titel: ${widget.title}.` : '',
    widget.introMessage ? `Intro: ${widget.introMessage}.` : '',
    `Farbwelt: Primär ${branding.primary || '#3B82F6'}, Text ${branding.text || '#E5E7EB'}, Modus ${branding.mode || 'dark'}.`,
    '',
    'Regeln:',
    '- Keine Konkurrenz erwähnen.',
    '- Bleibe beim Thema dieses Bots.',
    '- Nutze, wenn möglich, FAQ-Antworten.',
    '- Antworte kurz, klar, freundlich.',
    faqLines ? '\nFAQ-Kontext:\n' + faqLines : ''
  ].filter(Boolean).join('\n');
}

function renderTestChat() {
  const list = document.getElementById('testMessages');
  const input = document.getElementById('testInput');
  const sendBtn = document.getElementById('testSend');
  if (!list) return;

  list.innerHTML = '';
  testMessages.forEach((msg) => {
    const row = document.createElement('div');
    row.className = `assistant-message assistant-${msg.role}`;
    row.textContent = msg.text;
    list.appendChild(row);
  });
  if (testing) {
    const loader = document.createElement('div');
    loader.className = 'assistant-message assistant-loading';
    loader.textContent = 'Test-Modus fragt den LLM …';
    list.appendChild(loader);
  }
  list.scrollTop = list.scrollHeight;
  if (input) input.disabled = testing;
  if (sendBtn) sendBtn.disabled = testing;
}

async function callProvider(question) {
  const cfg = typeof getConfigSnapshot === 'function' ? getConfigSnapshot() : {};
  const systemPrompt = buildTestPrompt(cfg);
  const provider = (currentProvider || 'groq').toLowerCase();
  const endpoint = PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.groq;

  // Nachrichtenaufbau
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ];

  const tryDirect = async () => {
    if (provider === 'anthropic') {
      const resp = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: endpoint.model,
          max_tokens: 250,
          messages: [
            { role: 'user', content: systemPrompt + '\n\n' + question }
          ]
        })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'LLM-Anfrage fehlgeschlagen.');
      }
      const data = await resp.json();
      return data.content?.[0]?.text?.trim() || 'Keine Antwort verfügbar.';
    }

    const resp = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentKey}`
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages,
        max_tokens: 250
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || 'LLM-Anfrage fehlgeschlagen.');
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Keine Antwort verfügbar.';
  };

  const tryFallback = async () => {
    const net = typeof getNetworkConfig === 'function' ? getNetworkConfig() : {};
    if (!net.baseUrl) throw new Error('LLM-Anfrage fehlgeschlagen.');
    const resp = await fetch(`${net.baseUrl}/api/llm-test`, {
      method: 'POST',
      headers: { ...(net.headers || {}), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey: currentKey, question, config: cfg })
    });
    if (!resp.ok) {
      const text = await resp.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || 'LLM-Anfrage fehlgeschlagen.');
      } catch {
        throw new Error(text || 'LLM-Anfrage fehlgeschlagen.');
      }
    }
    const data = await resp.json();
    return data.answer || 'Keine Antwort verfügbar.';
  };

  try {
    return await tryDirect();
  } catch (err) {
    return await tryFallback();
  }
}

async function sendTestMessage(text, onError) {
  const trimmed = (text || '').trim();
  if (!trimmed || testing || !currentKey) return;
  testMessages.push({ role: 'user', text: trimmed });
  testing = true;
  renderTestChat();
  try {
    const answer = await callProvider(trimmed);
    testMessages.push({ role: 'assistant', text: answer });
  } catch (err) {
    if (typeof onError === 'function') onError(err);
  } finally {
    testing = false;
    renderTestChat();
  }
}

export function initTestMode(getConfigFn, getNetworkFn) {
  getConfigSnapshot = getConfigFn;
  getNetworkConfig = getNetworkFn;

  const startBtn = document.getElementById('testStart');
  const apiKeyInput = document.getElementById('testApiKey');
  const providerSelect = document.getElementById('testProvider');
  const chatContainer = document.getElementById('testChat');
  const sendBtn = document.getElementById('testSend');
  const input = document.getElementById('testInput');

  if (!startBtn || !apiKeyInput || !providerSelect || !chatContainer || !sendBtn || !input) return;

  startBtn.addEventListener('click', () => {
    try {
      const rawKey = apiKeyInput.value.trim();
      const provider = providerSelect.value || 'groq';
      validateKey(rawKey, provider);
      currentKey = rawKey;
      currentProvider = provider;
      testMessages = [];
      chatContainer.classList.remove('hidden');
      renderTestChat();
    } catch (err) {
      alert(err.message || 'Ungültiger API-Key.');
    }
  });

  const handleError = (err) => {
    console.error('Testmodus-Fehler', err?.message || err);
    const msg = err?.message || 'Testmodus: Anfrage fehlgeschlagen. Bitte Key und Provider prüfen.';
    alert(msg);
  };

  sendBtn.addEventListener('click', () => {
    const text = input.value;
    input.value = '';
    sendTestMessage(text, handleError);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const text = input.value;
      input.value = '';
      sendTestMessage(text, handleError);
    }
  });
}
