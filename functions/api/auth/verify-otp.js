/**
 * Cloudflare Pages Function
 * Endpoint: POST /api/auth/verify-otp
 * Verifies the HMAC-SHA256 challengeToken + 6-digit OTP, mints a Google OAuth2
 * access token from FIREBASE_SERVICE_ACCOUNT_JSON using WebCrypto RS256, and
 * updates the user's Firebase Auth password via Identity Toolkit Admin API.
 */

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64UrlToBytes(b64u) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyChallenge(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64UrlToBytes(sigB64),
    new TextEncoder().encode(payloadB64)
  );
  if (!valid) return null;
  const jsonStr = new TextDecoder().decode(fromBase64UrlToBytes(payloadB64));
  return JSON.parse(jsonStr);
}

function pemToArrayBuffer(pem) {
  const cleaned = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, '');
  const bin = atob(cleaned);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getGoogleAdminAccessToken(serviceAccount) {
  const nowSec = Math.floor(Date.now() / 1000);
  const headerB64 = toBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claimB64 = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/identitytoolkit',
        aud: 'https://oauth2.googleapis.com/token',
        iat: nowSec,
        exp: nowSec + 3600,
      })
    )
  );
  const signingInput = `${headerB64}.${claimB64}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(signingInput));
  const assertion = `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(assertion)}`,
  });
  if (!tokenResp.ok) throw new Error('GOOGLE_OAUTH_FAILED');
  const data = await tokenResp.json();
  return data.access_token;
}

export async function onRequestPost(context) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  try {
    const body = await context.request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const otp = String(body.otp || '').trim();
    const newPassword = String(body.newPassword || '');
    const challengeToken = String(body.challengeToken || '');

    if (!email || !/^\d{6}$/.test(otp) || newPassword.length < 6 || !challengeToken) {
      return new Response(JSON.stringify({ ok: false, error: 'INVALID_INPUT' }), { status: 400, headers });
    }

    const env = context.env || {};
    const serviceAccJson = String(env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
    const resendKey = String(env.RESEND_API_KEY || '').trim();
    const brevoKey = String(env.BREVO_API_KEY || '').trim();
    const signingSecret = String(env.OTP_SIGNING_SECRET || serviceAccJson || resendKey || brevoKey || '').trim();

    if (!serviceAccJson || !signingSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'OTP_SERVICE_NOT_CONFIGURED' }), { status: 503, headers });
    }

    const payload = await verifyChallenge(challengeToken, signingSecret);
    if (!payload || payload.email !== email) {
      return new Response(JSON.stringify({ ok: false, error: 'INVALID_OR_TAMPERED_TOKEN' }), { status: 400, headers });
    }
    if (Date.now() > Number(payload.exp || 0)) {
      return new Response(JSON.stringify({ ok: false, error: 'OTP_EXPIRED' }), { status: 400, headers });
    }

    const expectedHash = await sha256Hex(`${email}:${otp}`);
    if (!constantTimeEqual(expectedHash, String(payload.otpHash || ''))) {
      return new Response(JSON.stringify({ ok: false, error: 'INVALID_OTP' }), { status: 400, headers });
    }

    const serviceAccount = JSON.parse(serviceAccJson);
    const accessToken = await getGoogleAdminAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    // 1. Lookup Firebase Auth UID by email
    const lookupResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:lookup`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: [email] }),
      }
    );
    const lookupData = await lookupResp.json().catch(() => ({}));
    const userRecord = Array.isArray(lookupData?.users) ? lookupData.users[0] : null;
    if (!lookupResp.ok || !userRecord?.localId) {
      return new Response(JSON.stringify({ ok: false, error: 'USER_NOT_FOUND' }), { status: 404, headers });
    }

    // 2. Update password via Firebase Identity Toolkit Admin API
    const updateResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:update`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localId: userRecord.localId,
          password: newPassword,
        }),
      }
    );
    if (!updateResp.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'PASSWORD_UPDATE_FAILED' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'INTERNAL_ERROR' }), { status: 500, headers });
  }
}
