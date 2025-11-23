export const ConfigShape = {
  id: 'string',
  identity: {
    botName: 'string',
    company: 'string',
    language: 'string'
  },
  branding: {
    primary: 'string',
    secondary: 'string',
    surface: 'string',
    palette: 'string[]',
    theme: 'string',
    bubbleStyle: 'string',
    logo: 'string',
    staff: 'string',
    location: 'string'
  },
  tone: {
    voice: 'string',
    greeting: 'string',
    restrictions: 'string'
  },
  faq: 'Array<{q:string,a:string}>',
  export: {
    backendUrl: 'string',
    widgetUrl: 'string'
  }
};
