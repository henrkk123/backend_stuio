import { paletteTask, improveTextTask, brandingTask, faqToAnswerTask, greetingTask, headlineTask } from '../services/aiToolkit.js';

export async function handleAiTask(req, res) {
  try {
    const { task, input = '', faq = [] } = req.body || {};
    let result = 'OK';
    switch (task) {
      case 'palette': result = paletteTask(); break;
      case 'improve-text': result = improveTextTask(input); break;
      case 'branding': result = brandingTask(); break;
      case 'faq-to-answer': result = faqToAnswerTask(faq, input); break;
      case 'greeting': result = greetingTask(); break;
      case 'headlines': result = headlineTask(); break;
      default: result = 'Task nicht erkannt';
    }
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI task failed' });
  }
}
