import { initTestMode } from './src/test-mode.js';

const API_BASE =
  localStorage.getItem('henriktron_admin_api_base') || 'https://backend-studio-kv67.onrender.com';
const CONFIG_ID = 'default';

let adminToken = sessionStorage.getItem('henriktron_admin_token') || '';
let currentConfig = null;
let toastTimeout;

function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (adminToken) headers['authorization'] = `Bearer ${adminToken}`;
  return headers;
}

function readTokenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    performLogin(token);
    const url = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, url);
  }
}

function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = 'toast show';
  if (type === 'error') {
    el.classList.add('toast-error');
  }
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.className = 'toast';
    el.textContent = '';
  }, 3200);
}

function applyStoredTheme() {
  const root = document.getElementById('appRoot');
  if (!root) return;
  const stored = localStorage.getItem('henriktron_theme');
  if (stored === 'light' || stored === 'dark') {
    root.dataset.theme = stored;
  }
  updateThemeToggleIcon();
}

function toggleTheme() {
  const root = document.getElementById('appRoot');
  if (!root) return;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  localStorage.setItem('henriktron_theme', next);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const btn = document.getElementById('themeToggle');
  const root = document.getElementById('appRoot');
  if (!btn || !root) return;
  btn.textContent = root.dataset.theme === 'light' ? '☀' : '☾';
}

function setActiveTab(id) {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === id);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tab !== id);
  });
  localStorage.setItem('henriktron_admin_active_tab', id);
}

function restoreActiveTab() {
  const saved = localStorage.getItem('henriktron_admin_active_tab');
  if (saved) {
    setActiveTab(saved);
  }
}

function updateProjectName(cfg) {
  const el = document.getElementById('projectName');
  if (!el) return;
  const name = cfg?.identity?.botName || 'Standard-Bot';
  el.textContent = name;
}

function getBaseConfig() {
  return (
    currentConfig || {
      id: CONFIG_ID,
      internalOnly: false,
      identity: {},
      branding: {},
      tone: {},
      widget: {},
      llm: {},
      faq: [],
      export: {}
    }
  );
}

function readConfigFromUI() {
  const base = getBaseConfig();

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function checked(id) {
    const el = document.getElementById(id);
    return el ? !!el.checked : false;
  }

  const faq = Array.from(document.querySelectorAll('#faqList .faq-item')).map((item) => {
    const q = item.querySelector('.faq-question')?.value?.trim() || '';
    const a = item.querySelector('.faq-answer')?.value?.trim() || '';
    if (!q && !a) return null;
    return { q, a };
  }).filter(Boolean);

  const logoPreview = document.getElementById('logoPreview');
  const logoData = logoPreview?.dataset?.dataUrl || logoPreview?.src || base.branding.logo || '';

  const llmApiKeyInput = val('llmApiKey').trim();
  const llm = { ...(base.llm || {}) };
  if (llmApiKeyInput) {
    llm.apiKey = llmApiKeyInput;
  }

  const radiusValue = Number(val('radius')) || 0;
  const shape = val('shapeSelect') || base.branding.shape || 'soft';
  const sizeValue = val('sizeSelect') || base.branding.size || 'm';
  const borderWeightValue = Number(val('borderWeight')) || base.branding.borderWeight || 1;
  const maxLengthValue = Number(val('maxMessageLength')) || (base.widget?.maxMessageLength || 0);
  const autoOpenDelayValue = Number(val('autoOpenDelay')) || (base.widget?.autoOpenDelaySeconds || 0);

  // Shape-Preset steuert Radius, falls Nutzer Pill/eckig auswählt
  let shapeRadius = radiusValue;
  if (shape === 'pill') shapeRadius = 24;
  if (shape === 'square') shapeRadius = 4;

  return {
    ...base,
    internalOnly: checked('internalOnly'),
    identity: {
      ...base.identity,
      botName: val('botName'),
      company: val('company'),
      industry: val('industry'),
      language: val('language')
    },
    branding: {
      ...base.branding,
      primary: document.getElementById('primaryColor')?.value || base.branding.primary,
      surface: document.getElementById('bgColor')?.value || base.branding.surface,
      text: document.getElementById('textColor')?.value || base.branding.text,
      buttonText: val('buttonText') || base.branding.buttonText,
      position: val('position') || base.branding.position,
      logo: logoData,
      buttonColor: document.getElementById('buttonColor')?.value || base.branding.buttonColor || document.getElementById('primaryColor')?.value || base.branding.primary,
      radius: shapeRadius,
      shape,
      size: sizeValue,
      borderWeight: borderWeightValue,
      shadow: checked('shadow'),
      mode: val('mode') || base.branding.mode || 'dark'
    },
    tone: {
      ...base.tone,
      voice: val('toneSelect') || base.tone.voice,
      greeting: val('greeting') || base.tone.greeting,
      brandVoicePrompt: document.getElementById('brandVoice')?.value || base.tone.brandVoicePrompt,
      restrictions: document.getElementById('restrictions')?.value || base.tone.restrictions,
      noCompetitors: checked('noCompetitors'),
      onlyKnowledgeBase: checked('onlyKnowledgeBase'),
      henrikFromMitteldeutschland: checked('henrikFromMitteldeutschland')
    },
    widget: {
      ...(base.widget || {}),
      title: val('chatTitle') || base.widget?.title,
      introMessage: document.getElementById('introMessage')?.value || base.widget?.introMessage,
      maxMessageLength: maxLengthValue || 500,
      autoOpenDelaySeconds: autoOpenDelayValue >= 0 ? autoOpenDelayValue : 0
    },
    faq,
    llm,
    export: {
      ...base.export,
      backendUrl: base.export.backendUrl || API_BASE,
      widgetUrl: base.export.widgetUrl || 'https://cdn.henriktron.dev/widget.js'
    }
  };
}

function applyConfigToUI(cfg) {
  currentConfig = cfg;

  const identity = cfg.identity || {};
  const branding = cfg.branding || {};
  const tone = cfg.tone || {};
  const widget = cfg.widget || {};

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = value;
    }
  };

  const setChecked = (id, flag) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!flag;
  };

  set('botName', identity.botName || '');
  set('company', identity.company || '');
  set('industry', identity.industry || 'Dienstleistung');
  set('language', identity.language || 'de');
  set('toneSelect', tone.voice || 'neutral');
  setChecked('internalOnly', !!cfg.internalOnly);

  set('primaryColor', branding.primary || '#3B82F6');
  set('bgColor', branding.surface || '#020617');
  set('textColor', branding.text || '#E5E7EB');
  set('buttonText', branding.buttonText || 'Frage stellen');
  set('position', branding.position || 'bottom-right');
  set('buttonColor', branding.buttonColor || branding.primary || '#3B82F6');
  set('radius', String(branding.radius ?? 18));
  set('shapeSelect', branding.shape || 'soft');
  set('sizeSelect', branding.size || 'm');
  set('borderWeight', String(branding.borderWeight ?? 1));
  set('mode', branding.mode || 'dark');
  setChecked('shadow', branding.shadow !== false);

  const logoPreview = document.getElementById('logoPreview');
  if (logoPreview) {
    if (branding.logo) {
      logoPreview.src = branding.logo;
      logoPreview.dataset.dataUrl = branding.logo;
    } else {
      logoPreview.removeAttribute('src');
      logoPreview.dataset.dataUrl = '';
    }
  }

  set('greeting', tone.greeting || '');
  const brandVoice = tone.brandVoicePrompt || '';
  set('brandVoice', brandVoice);
  set('restrictions', tone.restrictions || '');
  setChecked('noCompetitors', tone.noCompetitors !== false);
  setChecked('onlyKnowledgeBase', !!tone.onlyKnowledgeBase);
  setChecked('henrikFromMitteldeutschland', tone.henrikFromMitteldeutschland !== false);

  set('chatTitle', widget.title || 'Frag unseren KI-Assistenten');
  const introField = document.getElementById('introMessage');
  if (introField) {
    introField.value = widget.introMessage || 'Ich helfe dir bei Fragen zu Produkten, Preisen und Abläufen.';
  }
  set('maxMessageLength', String(widget.maxMessageLength ?? 500));
  set('autoOpenDelay', String(widget.autoOpenDelaySeconds ?? 0));

  const llmHint = document.getElementById('llmApiKeyHint');
  if (llmHint) {
    if (cfg.llm?.hasApiKey) {
      llmHint.textContent = 'LLM-API-Key ist hinterlegt (wird nur serverseitig genutzt).';
    } else {
      llmHint.textContent = 'Optional: Eigener LLM-API-Key, wird nur serverseitig genutzt.';
    }
  }

  const faqList = document.getElementById('faqList');
  if (faqList) {
    faqList.innerHTML = '';
    (cfg.faq || []).forEach((item) => addFaqItem(item.q, item.a));
  }

  updateProjectName(cfg);
  renderPreview(cfg);
}

function addFaqItem(question = '', answer = '') {
  const faqList = document.getElementById('faqList');
  if (!faqList) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'faq-item list-item';
  wrapper.innerHTML = `
    <div class="faq-header">
      <span class="muted">FAQ</span>
      <div class="faq-actions">
        <button type="button" class="btn ghost btn-faq-up">↑</button>
        <button type="button" class="btn ghost btn-faq-down">↓</button>
        <button type="button" class="btn ghost btn-faq-remove">Entfernen</button>
      </div>
    </div>
    <label>Frage
      <input type="text" class="faq-question" />
    </label>
    <label>Antwort
      <textarea class="faq-answer"></textarea>
    </label>
  `;

  wrapper.querySelector('.faq-question').value = question || '';
  wrapper.querySelector('.faq-answer').value = answer || '';

  wrapper.querySelector('.btn-faq-remove').addEventListener('click', () => wrapper.remove());
  wrapper.querySelector('.btn-faq-up').addEventListener('click', () => {
    const prev = wrapper.previousElementSibling;
    if (prev) {
      faqList.insertBefore(wrapper, prev);
    }
  });
  wrapper.querySelector('.btn-faq-down').addEventListener('click', () => {
    const next = wrapper.nextElementSibling;
    if (next) {
      faqList.insertBefore(next, wrapper);
    }
  });

  faqList.appendChild(wrapper);
}

async function requestAi(task, payload = {}) {
  const body = { task, ...payload };
  const res = await fetch(`${API_BASE}/api/ai`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    throw new Error('AI request failed');
  }
  const data = await res.json();
  return data.result;
}

function renderPreview(cfg) {
  const box = document.getElementById('preview-box');
  if (!box) return;

  box.innerHTML = '';

  const branding = cfg.branding || {};
  const tone = cfg.tone || {};
  const identity = cfg.identity || {};
  const widget = cfg.widget || {};
  const size = branding.size || 'm';
  const borderWeight = typeof branding.borderWeight === 'number' ? branding.borderWeight : 1;

  const bubble = document.createElement('div');
  bubble.className = 'widget-bubble';
  const radius = typeof branding.radius === 'number' ? branding.radius : 18;
  bubble.style.borderRadius = `${radius}px`;
  bubble.style.background = branding.surface || (branding.mode === 'light' ? '#FFFFFF' : '#0f172a');
  bubble.style.color = branding.text || '#E5E7EB';
  bubble.style.border = borderWeight ? `${borderWeight}px solid rgba(255,255,255,0.07)` : 'none';
  bubble.textContent = widget.introMessage || tone.greeting || 'Hallo, ich bin Henrik. Wie kann ich dir helfen?';

  const btn = document.createElement('button');
  btn.className = 'widget-button';
  btn.textContent = branding.buttonText || identity.botName || widget.title || 'Frage stellen';
  btn.style.background = branding.buttonColor || branding.primary || '#3B82F6';
  btn.style.boxShadow = branding.shadow === false ? 'none' : '';
  btn.style.border = borderWeight ? `${borderWeight}px solid rgba(255,255,255,0.06)` : 'none';
  btn.style.borderRadius = radius >= 24 || (branding.shape === 'pill') ? '999px' : `${Math.max(radius - 2, 4)}px`;

  if (branding.logo) {
    const img = document.createElement('img');
    img.src = branding.logo;
    img.alt = 'Logo';
    img.style.width = '36px';
    img.style.height = '36px';
    img.style.borderRadius = '10px';
    img.style.marginBottom = '8px';
    bubble.prepend(img);
  }

  const position = branding.position || 'bottom-right';
  if (position === 'bottom-left') {
    box.style.alignItems = 'flex-end';
    box.style.justifyContent = 'flex-start';
  } else {
    box.style.alignItems = 'flex-end';
    box.style.justifyContent = 'flex-end';
  }

  const scaleMap = { s: 0.85, m: 1, l: 1.1 };
  const scale = scaleMap[size] || 1;
  bubble.style.transform = `scale(${scale})`;
  btn.style.transform = `scale(${scale})`;

  bubble.style.boxShadow = branding.shadow === false ? 'none' : '0 18px 40px rgba(0,0,0,0.18)';

  box.appendChild(bubble);
  box.appendChild(btn);
}

function showLoginOverlay(message) {
  const overlay = document.getElementById('loginOverlay');
  const errorEl = document.getElementById('loginError');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  if (errorEl) errorEl.textContent = message || '';
}

function hideLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  const errorEl = document.getElementById('loginError');
  if (!overlay) return;
  overlay.classList.add('hidden');
  if (errorEl) errorEl.textContent = '';
}

async function performLogin(token) {
  adminToken = token;
  sessionStorage.setItem('henriktron_admin_token', token);
}

async function requestAuth(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.error || 'Login fehlgeschlagen');
    } catch {
      throw new Error(text || 'Login fehlgeschlagen');
    }
  }
  return res.json();
}

async function loginWithPassword(email, password) {
  const data = await requestAuth('/api/auth/login', { email, password });
  if (!data?.token) throw new Error('Kein Token erhalten.');
  await performLogin(data.token);
}

async function signupWithPassword(email, password) {
  const data = await requestAuth('/api/auth/signup', { email, password });
  if (!data?.token) throw new Error('Kein Token erhalten.');
  await performLogin(data.token);
}

async function loadConfig() {
  const res = await fetch(`${API_BASE}/api/config/${CONFIG_ID}`, {
    headers: authHeaders()
  });

  if (res.status === 401) {
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    throw new Error('Konfiguration konnte nicht geladen werden.');
  }

  const cfg = await res.json();
  applyConfigToUI(cfg);
}

async function saveConfig() {
  try {
    const cfg = readConfigFromUI();
    const res = await fetch(`${API_BASE}/api/config/${CONFIG_ID}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(cfg)
    });
    if (res.status === 401) throw new Error('unauthorized');
    if (!res.ok) throw new Error('Speichern fehlgeschlagen');
    const data = await res.json();
    currentConfig = data.config || cfg;
    showToast('Änderungen gespeichert', 'success');
  } catch (err) {
    if (err.message === 'unauthorized') {
      sessionStorage.removeItem('henriktron_admin_token');
      adminToken = '';
      showLoginOverlay('Bitte erneut einloggen.');
    } else {
      console.error(err);
      showToast('Konnte Konfiguration nicht speichern.', 'error');
    }
  }
}

async function generateSnippet() {
  try {
    const res = await fetch(`${API_BASE}/api/export-snippet/${CONFIG_ID}`, {
      headers: authHeaders()
    });
    if (res.status === 401) throw new Error('unauthorized');
    if (!res.ok) throw new Error('Export fehlgeschlagen');
    const text = await res.text();
    const el = document.getElementById('snippet');
    if (el) {
      el.value = text;
    }
    showToast('Einbau-Code aktualisiert', 'success');
  } catch (err) {
    if (err.message === 'unauthorized') {
      sessionStorage.removeItem('henriktron_admin_token');
      adminToken = '';
      showLoginOverlay('Bitte erneut einloggen.');
    } else {
      console.error(err);
      showToast('Snippet konnte nicht generiert werden.', 'error');
    }
  }
}

async function downloadZip() {
  try {
    const res = await fetch(`${API_BASE}/api/export-zip/${CONFIG_ID}`, {
      headers: authHeaders()
    });
    if (res.status === 401) throw new Error('unauthorized');
    if (!res.ok) throw new Error('ZIP-Export fehlgeschlagen');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `henriktron-${CONFIG_ID}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('ZIP-Export gestartet', 'success');
  } catch (err) {
    if (err.message === 'unauthorized') {
      sessionStorage.removeItem('henriktron_admin_token');
      adminToken = '';
      showLoginOverlay('Bitte erneut einloggen.');
    } else {
      console.error(err);
      showToast('ZIP-Export fehlgeschlagen.', 'error');
    }
  }
}

async function copySnippet() {
  const el = document.getElementById('snippet');
  if (!el || !el.value) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(el.value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = el.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    showToast('Code kopiert', 'success');
  } catch (err) {
    console.error(err);
    showToast('Konnte Code nicht kopieren.', 'error');
  }
}

// --- KI-Assistent im Admin-Studio ---

const assistantMessages = [];
let assistantLoading = false;

function renderAssistantChat() {
  const list = document.getElementById('assistantMessages');
  const input = document.getElementById('assistantInput');
  const sendBtn = document.getElementById('assistantSend');
  if (!list) return;

  list.innerHTML = '';

  assistantMessages.forEach((msg) => {
    const row = document.createElement('div');
    row.className = `assistant-message assistant-${msg.role}`;
    row.textContent = msg.text;
    list.appendChild(row);
  });

  if (assistantLoading) {
    const loader = document.createElement('div');
    loader.className = 'assistant-message assistant-loading';
    loader.textContent = 'Henrik denkt nach …';
    list.appendChild(loader);
  }

  list.scrollTop = list.scrollHeight;

  if (input) input.disabled = assistantLoading;
  if (sendBtn) sendBtn.disabled = assistantLoading;
}

async function sendAssistantMessage(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || assistantLoading) return;

  assistantMessages.push({ role: 'user', text: trimmed });
  assistantLoading = true;
  renderAssistantChat();

  try {
    const configSnapshot = readConfigFromUI();
    const res = await fetch(`${API_BASE}/api/assistant`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ question: trimmed, configId: CONFIG_ID, config: configSnapshot })
    });
    if (res.status === 401) {
      throw new Error('unauthorized');
    }
    if (!res.ok) {
      throw new Error('Assistant failed');
    }
    const data = await res.json();
    const answer = data.answer || 'Keine Antwort verfügbar.';
    assistantMessages.push({ role: 'assistant', text: answer });
    applyAssistantAnswerToTarget(answer);
    showToast('Assistent geantwortet', 'success');
  } catch (err) {
    if (err.message === 'unauthorized') {
      sessionStorage.removeItem('henriktron_admin_token');
      adminToken = '';
      showLoginOverlay('Bitte erneut einloggen, um den Assistenten zu nutzen.');
    } else {
      console.error(err);
      showToast('Assistent-Anfrage fehlgeschlagen.', 'error');
    }
  } finally {
    assistantLoading = false;
    renderAssistantChat();
  }
}

function applyAssistantAnswerToTarget(answerText) {
  const targetEl = document.getElementById('assistantTarget');
  const target = targetEl ? targetEl.value : 'none';
  if (!answerText || !target || target === 'none') return;

  if (target === 'greeting') {
    const el = document.getElementById('greeting');
    if (el) el.value = answerText;
  } else if (target === 'brandVoice') {
    const el = document.getElementById('brandVoice');
    if (el) el.value = answerText;
  } else if (target === 'restrictions') {
    const el = document.getElementById('restrictions');
    if (el) el.value = answerText;
  } else if (target === 'faqAnswer') {
    const faqAnswers = document.querySelectorAll('.faq-answer');
    const last = faqAnswers[faqAnswers.length - 1];
    if (last) {
      last.value = answerText;
    }
  }
}

function bindTabs() {
  const tabsEl = document.getElementById('tabs');
  if (!tabsEl) return;
  tabsEl.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.classList.contains('tab')) {
      setActiveTab(target.dataset.tab);
    }
  });
}

function bindTopbarActions() {
  const saveBtn = document.getElementById('btn-save');
  if (saveBtn) saveBtn.addEventListener('click', () => saveConfig());

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('henriktron_admin_token');
      adminToken = '';
      showLoginOverlay('');
    });
  }

  const openSiteBtn = document.getElementById('btn-open-site');
  if (openSiteBtn) {
    openSiteBtn.addEventListener('click', () => {
      window.open('https://henriktronlab.pages.dev', '_blank', 'noopener');
    });
  }

  const docsBtn = document.getElementById('btn-docs');
  if (docsBtn) {
    docsBtn.addEventListener('click', () => {
      window.open('https://example.com/docs', '_blank', 'noopener');
    });
  }

  const testModeBtn = document.getElementById('btn-test-mode');
  if (testModeBtn) {
    testModeBtn.addEventListener('click', () => {
      const card = document.getElementById('testModeCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
}

function bindFormActions() {
  const addFaqBtn = document.getElementById('btn-add-faq');
  if (addFaqBtn) addFaqBtn.addEventListener('click', () => addFaqItem());

  const genSnippetBtn = document.getElementById('btn-generate-snippet');
  if (genSnippetBtn) genSnippetBtn.addEventListener('click', () => generateSnippet());

  const zipBtn = document.getElementById('btn-download-zip');
  if (zipBtn) zipBtn.addEventListener('click', () => downloadZip());

  const copyBtn = document.getElementById('btn-copy-snippet');
  if (copyBtn) copyBtn.addEventListener('click', () => copySnippet());

  const logoFile = document.getElementById('logoFile');
  const logoPreview = document.getElementById('logoPreview');
  if (logoFile && logoPreview) {
    logoFile.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        logoPreview.src = reader.result;
        logoPreview.dataset.dataUrl = reader.result;
        renderPreview(readConfigFromUI());
      };
      reader.readAsDataURL(file);
    });
  }

  document.querySelectorAll('.panel input, .panel select, .panel textarea').forEach((el) => {
    el.addEventListener('input', () => {
      const cfg = readConfigFromUI();
      renderPreview(cfg);
    });
  });

  const shapeSelect = document.getElementById('shapeSelect');
  const radiusInput = document.getElementById('radius');
  if (shapeSelect && radiusInput) {
    shapeSelect.addEventListener('change', () => {
      if (shapeSelect.value === 'pill') radiusInput.value = '24';
      else if (shapeSelect.value === 'square') radiusInput.value = '4';
      else radiusInput.value = '14';
      renderPreview(readConfigFromUI());
    });
  }

  // KI-Helfer für Verhalten / Branding
  const btnGreetingAi = document.getElementById('btn-ai-greeting');
  if (btnGreetingAi) {
    btnGreetingAi.addEventListener('click', async () => {
      try {
        const result = await requestAi('greeting');
        const el = document.getElementById('greeting');
        if (el) el.value = result;
        renderPreview(readConfigFromUI());
        showToast('Begrüßung von KI aktualisiert', 'success');
      } catch (err) {
        if (err.message === 'unauthorized') {
          sessionStorage.removeItem('henriktron_admin_token');
          adminToken = '';
          showLoginOverlay('Bitte erneut einloggen, um die KI zu nutzen.');
        } else {
          console.error(err);
          showToast('Konnte Begrüßung nicht generieren.', 'error');
        }
      }
    });
  }

  const btnBrandVoiceAi = document.getElementById('btn-ai-brandvoice');
  if (btnBrandVoiceAi) {
    btnBrandVoiceAi.addEventListener('click', async () => {
      try {
        const result = await requestAi('branding');
        const el = document.getElementById('brandVoice');
        if (el) el.value = result;
        showToast('Brand-Voice Vorschlag eingefügt', 'success');
      } catch (err) {
        if (err.message === 'unauthorized') {
          sessionStorage.removeItem('henriktron_admin_token');
          adminToken = '';
          showLoginOverlay('Bitte erneut einloggen, um die KI zu nutzen.');
        } else {
          console.error(err);
          showToast('Konnte Brand-Voice nicht generieren.', 'error');
        }
      }
    });
  }

  const btnRestrictionsAi = document.getElementById('btn-ai-restrictions');
  if (btnRestrictionsAi) {
    btnRestrictionsAi.addEventListener('click', async () => {
      const field = document.getElementById('restrictions');
      const input = field?.value || '';
      try {
        const result = await requestAi('improve-text', { input });
        if (field) field.value = result;
        showToast('Restriktionen optimiert', 'success');
      } catch (err) {
        if (err.message === 'unauthorized') {
          sessionStorage.removeItem('henriktron_admin_token');
          adminToken = '';
          showLoginOverlay('Bitte erneut einloggen, um die KI zu nutzen.');
        } else {
          console.error(err);
          showToast('Konnte Text nicht verbessern.', 'error');
        }
      }
    });
  }

  const btnPaletteAi = document.getElementById('btn-ai-palette');
  if (btnPaletteAi) {
    btnPaletteAi.addEventListener('click', async () => {
      try {
        const result = await requestAi('palette');
        const colors = (result.match(/#[0-9A-Fa-f]{3,6}/g) || []).slice(0, 3);
        if (colors[0]) {
          const el = document.getElementById('primaryColor');
          if (el) el.value = colors[0];
        }
        if (colors[1]) {
          const elBg = document.getElementById('bgColor');
          if (elBg) elBg.value = colors[1];
        }
        if (colors[2]) {
          const elText = document.getElementById('textColor');
          if (elText) elText.value = colors[2];
        }
        renderPreview(readConfigFromUI());
        showToast('Farbpalette aktualisiert', 'success');
      } catch (err) {
        if (err.message === 'unauthorized') {
          sessionStorage.removeItem('henriktron_admin_token');
          adminToken = '';
          showLoginOverlay('Bitte erneut einloggen, um die KI zu nutzen.');
        } else {
          console.error(err);
          showToast('Konnte Farbpalette nicht generieren.', 'error');
        }
      }
    });
  }

  const assistantInput = document.getElementById('assistantInput');
  const assistantSend = document.getElementById('assistantSend');
  if (assistantSend && assistantInput) {
    assistantSend.addEventListener('click', () => sendAssistantMessage(assistantInput.value));
    assistantInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAssistantMessage(assistantInput.value);
        assistantInput.value = '';
      }
    });
  }
}

function bindLoginUI() {
  const submitBtn = document.getElementById('loginSubmit');
  const toggleBtn = document.getElementById('loginToggle');
  const closeBtn = document.getElementById('loginClose');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const subtitle = document.getElementById('loginSubtitle');
  let mode = 'login';

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const email = emailInput?.value?.trim() || '';
      const pw = passwordInput?.value || '';
      if (!email || !pw) {
        showLoginOverlay('Bitte E-Mail und Passwort eingeben.');
        return;
      }
      try {
        if (mode === 'signup') {
          await signupWithPassword(email, pw);
        } else {
          await loginWithPassword(email, pw);
        }
        hideLoginOverlay();
        await loadConfig();
        restoreActiveTab();
      } catch (err) {
        console.error(err);
        showLoginOverlay(err?.message || 'Login fehlgeschlagen.');
      }
    });
  }

  if (emailInput && passwordInput) {
    const handler = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitBtn?.click();
      }
    };
    emailInput.addEventListener('keydown', handler);
    passwordInput.addEventListener('keydown', handler);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      mode = mode === 'login' ? 'signup' : 'login';
      toggleBtn.textContent = mode === 'login' ? 'Konto erstellen' : 'Schon Account? Anmelden';
      if (subtitle) {
        subtitle.textContent =
          mode === 'login'
            ? 'Melde dich mit E-Mail & Passwort an.'
            : 'Erstelle ein Konto, um das Studio zu nutzen.';
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideLoginOverlay();
    });
  }
}

async function bootstrap() {
  readTokenFromQuery();
  bindTabs();
  bindTopbarActions();
  bindFormActions();
  bindLoginUI();
  initTestMode(
    () => readConfigFromUI(),
    () => ({ baseUrl: API_BASE, headers: authHeaders() })
  );
  applyStoredTheme();

  try {
    await loadConfig();
    restoreActiveTab();
    hideLoginOverlay();
  } catch (err) {
    console.error(err);
    showLoginOverlay('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((err) => {
    console.error(err);
    showToast('Initialisierung fehlgeschlagen.', 'error');
  });
});
