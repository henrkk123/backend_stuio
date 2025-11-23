const forbiddenTerms = ['henrik hellpap', 'microvista', 'openai', 'anthropic', 'google bard'];
function sanitize(text){ let t=text; forbiddenTerms.forEach(term=>{const re=new RegExp(term,'ig'); t=t.replace(re,'Henrik');}); return t; }

export function paletteTask(){ return 'Farbpalette: #3B82F6, #1D4ED8, #0F172A, #F8FAFC'; }
export function improveTextTask(input){ return sanitize(`Optimierter Text: ${input || ''}`); }
export function brandingTask(){ return sanitize('Branding: Klar, modern, blau (#3B82F6) mit weichen Flächen.'); }
export function faqToAnswerTask(faq=[], fallback=''){ const first=Array.isArray(faq)&&faq.length? faq[0].a||faq[0].answer||'' : ''; return sanitize(first || fallback || 'Antwort folgt.'); }
export function greetingTask(){ return 'Hallo, ich bin Henrik. Wie kann ich dir helfen?'; }
export function headlineTask(){ return 'Schnelle Antworten, klar konfiguriert.'; }
