import { loadConfig } from '../services/storageService.js';
import { generateAssistantAnswer } from '../services/aiService.js';

export async function handleAssistantQuestion(req, res) {
  try {
    const { question, configId = 'default', config: overrideConfig } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });

    const baseConfig = overrideConfig && typeof overrideConfig === 'object'
      ? overrideConfig
      : loadConfig(configId);

    const answer = await generateAssistantAnswer(question, baseConfig);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Assistant generation failed' });
  }
}

