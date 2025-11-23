const PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_TEST_MODEL = 'llama-3.1-8b-instant';

function buildSystemPrompt(config) {
  const name = config?.identity?.botName || 'Henriktron Assistant';
  const company = config?.identity?.company || 'ein Unternehmen aus Mitteldeutschland';
  const tone = config?.tone || {};
  const voice = tone.voice || 'neutral';
  const greeting = tone.greeting || 'Hallo, ich bin Henrik. Wie kann ich dir helfen?';
  const brandVoice = tone.brandVoicePrompt || '';
  const faq = (config?.faq || []).slice(0, 10).map((f, i) => `${i + 1}. Q: ${f.q} / A: ${f.a}`).join('\n');

  const rules = [];
  if (tone.noCompetitors !== false) {
    rules.push('- Keine Konkurrenz erwähnen.');
  }
  if (tone.onlyKnowledgeBase) {
    rules.push('- Nutze nur Inhalte aus dem bereitgestellten Wissen.');
  }
  if (tone.henrikFromMitteldeutschland !== false) {
    rules.push('- Du antwortest als „Henrik“ aus Mitteldeutschland (ohne Nachnamen, ohne genaue Stadt).');
  }
  if (tone.restrictions) {
    rules.push(`- Zusätzliche Einschränkungen: ${tone.restrictions}`);
  }

  const parts = [
    `Du bist ${name}, ein professioneller Q&A-Assistent für ${company}.`,
    `Du antwortest knapp, klar und freundlich im Stil: ${voice}.`,
    `Begrüßung: ${greeting}.`,
    brandVoice ? `Brand-Voice: ${brandVoice}.` : '',
    rules.length ? 'Regeln:' : '',
    ...rules,
    faq ? 'Relevante FAQ:\n' + faq : ''
  ];

  return parts.filter(Boolean).join('\n');
}

async function callChatModel(systemPrompt, userContent, config, { maxTokens = 250 } = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  const llmKey = config?.llm?.apiKey?.trim() || '';

  if (PROVIDER === 'openai' && (OPENAI_API_KEY || llmKey)) {
    const payload = {
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens
    };
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmKey || OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error((await resp.text()) || 'OpenAI request failed');
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Keine Antwort verfügbar';
  }

  if (PROVIDER === 'groq' && (GROQ_API_KEY || llmKey)) {
    const payload = {
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens
    };
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmKey || GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error((await resp.text()) || 'Groq request failed');
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Keine Antwort verfügbar';
  }

  if (PROVIDER === 'together' && (TOGETHER_API_KEY || llmKey)) {
    const payload = {
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      messages,
      max_tokens: maxTokens
    };
    const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmKey || TOGETHER_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error((await resp.text()) || 'Together request failed');
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Keine Antwort verfügbar';
  }

  // Fallback stub (kein key konfiguriert)
  return `(${config?.identity?.botName || 'Henrik'}) Antwort: ${userContent.substring(0, 160)} ...`;
}

export async function generateAnswer(question, config) {
  const systemPrompt = buildSystemPrompt(config);
  return callChatModel(systemPrompt, question, config);
}

function buildAssistantPrompt(config) {
  const name = config?.identity?.botName || 'Henriktron Config Assistent';
  const company = config?.identity?.company || 'ein Unternehmen aus Mitteldeutschland';

  return [
    `Du bist ${name}, ein Assistent für das \"Henriktron Config Studio\" eines Entwicklers von ${company}.`,
    'Deine Aufgabe ist, bei der Konfiguration eines Q&A-Systems zu helfen.',
    'Du hilfst konkret bei:',
    '- Formulierung von System-Prompts / Brand-Voice.',
    '- Verbesserung von FAQ-Fragen und Antworten.',
    '- Vorschlägen für Tonfall und Begrüßungstexte.',
    '',
    'Wichtige Regeln:',
    '- Sprich NICHT über Konkurrenz-Produkte oder andere Anbieter.',
    '- Bleibe beim Thema Konfiguration dieses Q&A-Systems.',
    '- Antworte kurz, klar und mit konkreten Vorschlägen.',
    '- Duzen den Nutzer in der Antwort.',
  ].join('\n');
}

export async function generateAssistantAnswer(question, config) {
  const systemPrompt = buildAssistantPrompt(config);
  return callChatModel(systemPrompt, question, config, { maxTokens: 400 });
}

async function callTestModel(provider, apiKey, systemPrompt, userContent, { maxTokens = 250 } = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  let url = '';
  let model = '';
  const p = (provider || PROVIDER || 'groq').toLowerCase();

  if (p === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    model = 'gpt-4o-mini';
  } else if (p === 'together') {
    url = 'https://api.together.xyz/v1/chat/completions';
    model = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
  } else {
    url = 'https://api.groq.com/openai/v1/chat/completions';
    model = GROQ_TEST_MODEL;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens })
  });

  if (!resp.ok) {
    throw new Error((await resp.text()) || 'Test model request failed');
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Keine Antwort verfügbar';
}

export async function generateTestAnswer(question, provider, apiKey, config) {
  const systemPrompt = buildSystemPrompt(config);
  return callTestModel(provider, apiKey, systemPrompt, question, { maxTokens: 250 });
}
