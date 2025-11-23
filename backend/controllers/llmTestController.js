import { loadConfig } from '../services/storageService.js';
import { generateTestAnswer } from '../services/aiService.js';

// Test-Endpunkt für den Sofort-Testmodus im Admin.
// Nimmt einen API-Key entgegen, nutzt ihn nur für diese eine Anfrage
// und speichert ihn weder in Config, Log noch Datenbank.
export async function handleLlmTest(req, res) {
  try {
    const { question, provider = 'groq', apiKey, configId = 'default', config } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question required' });
    }
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey required' });
    }

    const baseConfig =
      config && typeof config === 'object' ? config : loadConfig(configId);

    const answer = await generateTestAnswer(question, provider, apiKey, baseConfig);
    res.json({ answer });
  } catch (err) {
    const message = err?.message || String(err) || 'LLM test failed';
    console.error('llm-test failed', message);
    res.status(500).json({ error: message });
  }
}
