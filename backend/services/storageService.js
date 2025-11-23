import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultConfig = {
  id: 'default',
  internalOnly: false,
  identity: {
    botName: 'Henriktron Assistant',
    company: 'Henriktron Labs',
    industry: 'Dienstleistung',
    language: 'de'
  },
  llm: {
    // Projekt-spezifischer LLM API-Key (optional, überschreibt Provider-Key aus .env)
    apiKey: ''
  },
  branding: {
    primary: '#3B82F6',
    secondary: '#0F172A',
    surface: '#020617',
    text: '#E5E7EB',
    palette: ['#3B82F6', '#0EA5E9', '#0F172A', '#F8FAFC'],
    theme: 'modern',
    bubbleStyle: 'rounded',
    position: 'bottom-right',
    buttonText: 'Frage stellen',
    buttonColor: '#3B82F6',
    radius: 18,
    shadow: true,
    mode: 'dark',
    logo: '',
    staff: '',
    location: ''
  },
  widget: {
    title: 'Frag unseren KI-Assistenten',
    introMessage: 'Ich helfe dir bei Fragen zu Produkten, Preisen und Abläufen.',
    maxMessageLength: 500,
    autoOpenDelaySeconds: 0
  },
  tone: {
    voice: 'neutral',
    greeting: 'Hallo, ich bin Henrik. Wie kann ich dir helfen?',
    restrictions: 'Keine Konkurrenz, nur Henrik erwähnen, Microvista nur bei Nachfrage.',
    brandVoicePrompt: 'Professionell, ruhig, freundlich, aus Mitteldeutschland.',
    noCompetitors: true,
    onlyKnowledgeBase: false,
    henrikFromMitteldeutschland: true
  },
  faq: [
    { q: 'Wie starte ich?', a: 'Klicke auf den Button und stelle deine Frage.' }
  ],
  export: {
    backendUrl: 'http://localhost:4000',
    widgetUrl: 'https://cdn.henriktron.dev/widget.js'
  }
};

function configPath(id) {
  return path.join(DATA_DIR, `config-${id}.json`);
}

export function loadConfig(id = 'default') {
  const file = configPath(id);
  if (!fs.existsSync(file)) {
    saveConfig(id, { ...defaultConfig, id });
  }
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);

    // Merge with defaults so neue Felder automatisch sinnvolle Defaults erhalten.
    const merged = {
      ...defaultConfig,
      ...parsed,
      identity: { ...defaultConfig.identity, ...(parsed.identity || {}) },
      branding: { ...defaultConfig.branding, ...(parsed.branding || {}) },
      tone: { ...defaultConfig.tone, ...(parsed.tone || {}) },
      widget: { ...defaultConfig.widget, ...(parsed.widget || {}) },
      llm: { ...defaultConfig.llm, ...(parsed.llm || {}) }
    };
    return merged;
  } catch (err) {
    console.error('Failed to read config', err);
    return { ...defaultConfig, id };
  }
}

export function saveConfig(id, config) {
  const file = configPath(id);
  fs.writeFileSync(file, JSON.stringify({ ...config, id }, null, 2), 'utf-8');
}

export const getDefaultConfig = () => ({ ...defaultConfig });
