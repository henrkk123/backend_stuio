import { loadConfig } from '../services/storageService.js';
import { generateAnswer } from '../services/aiService.js';

export async function handleGenerate(req, res) {
  try {
    const { question, configId = 'default' } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });
    const config = loadConfig(configId);
    const answer = await generateAnswer(question, config);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed' });
  }
}
