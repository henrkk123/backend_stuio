import crypto from 'crypto';

const ALG = 'HS256';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload, secret) {
  const header = { alg: ALG, typ: 'JWT' };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signature}`;
}

function verify(token, secret) {
  if (!token || token.split('.').length !== 3) return null;
  const [encHeader, encPayload, signature] = token.split('.');
  const data = `${encHeader}.${encPayload}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encPayload, 'base64').toString('utf8'));
    return payload;
  } catch {
    return null;
  }
}

export { sign, verify };
