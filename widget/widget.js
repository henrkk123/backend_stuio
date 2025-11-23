(function() {
  const script = document.currentScript;
  const cfg = window.HenriktronConfig || {};

  const backendUrl =
    cfg.backendUrl ||
    (script && script.getAttribute('data-backend')) ||
    window.location.origin;
  const apiKey = cfg.apiKey || (script && script.getAttribute('data-api')) || '';
  const projectId = cfg.botId || (script && script.getAttribute('data-project')) || 'default';

  if (!backendUrl) {
    console.warn('Henriktron: data-backend fehlt am Script-Tag');
    return;
  }

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  if (script && script.getAttribute('data-css')) {
    style.href = script.getAttribute('data-css');
  } else if (script && script.src) {
    style.href = new URL('./widget.css', script.src).toString();
  } else {
    style.href = '/widget/widget.css';
  }
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'henriktron-btn';
  btn.textContent = cfg.buttonText || 'Fragen?';

  const panel = document.createElement('div');
  panel.id = 'henriktron-panel';

  const header = document.createElement('header');
  const body = document.createElement('div');
  body.className = 'body';
  const footer = document.createElement('footer');
  const input = document.createElement('input');
  input.id = 'henriktron-input';
  input.placeholder = 'Frage eingeben...';
  footer.appendChild(input);
  panel.append(header, body, footer);

  btn.addEventListener('click', () => {
    const visible = panel.style.display === 'block';
    panel.style.display = visible ? 'none' : 'block';
    panel.style.opacity = visible ? '0' : '1';
    panel.style.transform = visible ? 'translateY(8px) scale(0.98)' : 'translateY(0) scale(1)';
  });

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const confMaxLen = Number(body.dataset.maxLength || '');
      let q = input.value.trim();
      if (confMaxLen && q.length > confMaxLen) {
        q = q.slice(0, confMaxLen);
      }
      input.value = '';
      const bubble = document.createElement('div');
      bubble.textContent = q;
      bubble.style.margin = '6px 0';
      body.appendChild(bubble);
      body.scrollTop = body.scrollHeight;
      try {
        const res = await fetch(`${backendUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
          body: JSON.stringify({ question: q, configId: projectId })
        });
        const data = await res.json();
        const ans = document.createElement('div');
        ans.textContent = data.answer || '...';
        ans.style.margin = '6px 0';
        ans.style.color = '#0F172A';
        body.appendChild(ans);
        body.scrollTop = body.scrollHeight;
      } catch (err) {
        console.error('Henriktron generate failed', err);
      }
    }
  });

  async function hydrateFromConfig() {
    try {
      const res = await fetch(`${backendUrl}/api/config/${projectId}`, {
        headers: { 'x-api-key': apiKey }
      });
      if (!res.ok) throw new Error(await res.text());
      const conf = await res.json();
      const primary = conf.branding?.primary || cfg.primaryColor || '#3B82F6';
      const darkMode = (conf.branding?.mode || 'dark') === 'dark';
      document.documentElement.style.setProperty('--h-brand', primary);
      btn.textContent = conf.branding?.buttonText || conf.identity?.botName || cfg.buttonText || 'Frage stellen';
      const widget = conf.widget || {};
      const title = widget.title || conf.identity?.company || 'Henriktron';
      const intro = widget.introMessage || conf.tone?.greeting || 'Hallo, ich bin Henrik. Wie kann ich dir helfen?';
      header.textContent = title;
      body.innerHTML = `<div style="margin-bottom:8px;font-weight:700;">${intro}</div>`;
      const maxLen = widget.maxMessageLength || 0;
      if (maxLen) {
        body.dataset.maxLength = String(maxLen);
      }
      const radius = typeof conf.branding?.radius === 'number' ? conf.branding.radius : 16;
      panel.style.borderRadius = `${radius}px`;
      if (darkMode) {
        panel.classList.add('henriktron-dark');
      }
      const delay = widget.autoOpenDelaySeconds || 0;
      if (delay > 0) {
        setTimeout(() => {
          btn.click();
        }, delay * 1000);
      }
    } catch (err) {
      console.warn('Henriktron config load failed', err);
      header.textContent = 'Henrik';
      body.innerHTML = '<div style="margin-bottom:8px;font-weight:700;">Hi! Wie kann ich helfen?</div>';
    }
  }

  if ((cfg.position || 'bottom-right') === 'bottom-left') {
    btn.style.right = 'auto';
    btn.style.left = '20px';
    panel.style.right = 'auto';
    panel.style.left = '20px';
  }

  document.body.append(btn, panel);
  hydrateFromConfig();
})();
