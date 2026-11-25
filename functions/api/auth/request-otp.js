/**
 * Cloudflare Pages Function
 * Endpoint: POST /api/auth/request-otp
 * Generates a 6-digit OTP, signs an HMAC-SHA256 challenge token (10-min TTL),
 * and delivers the OTP via Resend API (RESEND_API_KEY) or Brevo API (BREVO_API_KEY).
 */

const ipWindowMap = new Map();
const emailCooldownMap = new Map();

function checkRateLimit(ip, email) {
  const now = Date.now();
  const ipHits = (ipWindowMap.get(ip) || []).filter((t) => now - t < 600000);
  if (ipHits.length >= 8) return { ok: false, reason: 'TOO_MANY_REQUESTS' };
  ipHits.push(now);
  ipWindowMap.set(ip, ipHits);

  const lastSent = emailCooldownMap.get(email) || 0;
  if (now - lastSent < 45000) {
    return { ok: false, reason: 'COOLDOWN_ACTIVE', retryAfterSec: Math.ceil((45000 - (now - lastSent)) / 1000) };
  }
  emailCooldownMap.set(email, now);
  return { ok: true };
}

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function signChallenge(payloadObj, secret) {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

function generateSixDigitOtp() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

function buildOtpEmailHtml(otp) {
  const digits = String(otp || '000000').split('');
  const digitCells = digits
    .map(
      (d) =>
        `<td style="padding:0 4px;">
          <div style="width:44px; height:58px; line-height:58px; background:linear-gradient(180deg,#0E2832 0%,#06131A 100%); border:2px solid #24C8B8; border-radius:14px; font-size:27px; font-weight:800; color:#FFFFFF; font-family:'Segoe UI',Tahoma,Arial,sans-serif; text-align:center; box-shadow:0 0 14px rgba(36,200,184,0.22), inset 0 1px 0 rgba(207,210,157,0.4);">${d}</div>
        </td>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#030A0F; font-family:'Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#030A0F; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#06121A; border-radius:24px; overflow:hidden; border:1.5px solid #1E3E44; box-shadow:0 24px 64px rgba(0,0,0,0.72);">
          <!-- 3D Smart Medical Capsule Hero -->
          <tr>
            <td style="padding:0; background:#040B10;">
              <img src="https://dawaya.pages.dev/otp-capsule-hero.jpg" alt="DAWAYA Smart Capsule Security" width="560" style="display:block; width:100%; height:auto; border:0;" />
            </td>
          </tr>

          <!-- Luminous Brand Ribbon -->
          <tr>
            <td style="background:linear-gradient(90deg,#071C24 0%,#0E3F39 50%,#071C24 100%); border-top:2px solid #24C8B8; border-bottom:1px solid rgba(207,210,157,0.2); padding:15px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:right; vertical-align:middle;">
                    <div style="font-size:20px; font-weight:800; color:#FFFFFF;">دوايا <span style="color:#CFD29D;">| DAWAYA</span></div>
                    <div style="font-size:11.5px; color:#8FDAC3; margin-top:2px;">كبسولة الأمان الطبي المشفّرة</div>
                  </td>
                  <td style="text-align:left; vertical-align:middle;">
                    <span style="display:inline-block; background:rgba(36,200,184,0.14); border:1px solid #24C8B8; color:#5EEAD4; font-size:11px; font-weight:800; padding:5px 13px; border-radius:999px;">CAPSULE KEY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:28px 26px 24px 26px; text-align:right; color:#E2E8F0;">
              <h1 style="margin:0 0 10px 0; font-size:21px; font-weight:800; color:#FFFFFF;">تم فتح كبسولة التحقق الخاصة بك</h1>
              <p style="margin:0 0 22px 0; font-size:14px; line-height:1.8; color:#9FB4C4;">
                أدخل الشفرة المكوّنة من 6 أرقام داخل تطبيق <strong style="color:#CFD29D;">دوايا</strong> لتفعيل الكبسولة وإعادة تعيين كلمة المرور بأمان فوري:
              </p>

              <!-- 6 Luminous Crystal Tiles -->
              <div style="background:linear-gradient(160deg,#0A1F2A 0%,#051017 100%); border:1.5px solid rgba(36,200,184,0.38); border-radius:18px; padding:22px 10px; text-align:center; margin-bottom:22px;">
                <div style="font-size:11.5px; font-weight:700; color:#CFD29D; letter-spacing:0.6px; margin-bottom:14px;">شفرة كبسولة الأمان (صالحة لمدة 10 دقائق)</div>
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" dir="ltr" style="margin:0 auto;">
                  <tr>${digitCells}</tr>
                </table>
                <div style="font-size:11.5px; color:#5EEAD4; margin-top:14px;">
                  تشفير HMAC-SHA256 • للاستخدام مرة واحدة فقط
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background:rgba(207,210,157,0.07); border-right:3.5px solid #CFD29D; border-radius:10px; padding:12px 15px; font-size:12.5px; line-height:1.7; color:#CBD5E1;">
                <strong style="color:#CFD29D;">تنبيه أمان:</strong> لا تشارك هذه الشفرة مع أي شخص. إذا لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة وسيبقى حسابك محمياً بالكامل.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#040C12; border-top:1px solid rgba(255,255,255,0.08); padding:15px 26px; text-align:center;">
              <div style="font-size:11.5px; color:#64748B;">
                منظومة الرعاية الصحية الذكية • <strong style="color:#24C8B8;">دوايا (DAWAYA)</strong> • <span dir="ltr">dawaya.pages.dev</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const env = context.env || {};
  const hasGasWebhook = Boolean(String(env.GAS_EMAIL_WEBHOOK_URL || '').trim());
  const hasResendKey = Boolean(String(env.RESEND_API_KEY || '').trim());
  const hasBrevoKey = Boolean(String(env.BREVO_API_KEY || '').trim());
  const hasFromEmail = Boolean(String(env.OTP_FROM_EMAIL || '').trim());
  const hasFirebaseJson = Boolean(String(env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim());
  return new Response(
    JSON.stringify({
      ok: true,
      configured: (hasGasWebhook || hasResendKey || hasBrevoKey) && hasFirebaseJson,
      provider: hasGasWebhook ? 'google_apps_script_inbox' : hasResendKey ? 'resend' : hasBrevoKey ? 'brevo' : 'none',
      hasGasWebhook,
      hasBrevoKey,
      hasFromEmail,
      hasFirebaseJson,
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}

export async function onRequestPost(context) {
  const headers = CORS_HEADERS;
  try {
    const body = await context.request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: 'INVALID_EMAIL' }), { status: 400, headers });
    }

    const env = context.env || {};
    const gasWebhookUrl = String(env.GAS_EMAIL_WEBHOOK_URL || '').trim();
    const gasSecret = String(env.GAS_EMAIL_SECRET || 'dawaya-otp-gas').trim();
    const resendKey = String(env.RESEND_API_KEY || '').trim();
    const brevoKey = String(env.BREVO_API_KEY || '').trim();
    const serviceAccJson = String(env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
    const signingSecret = String(env.OTP_SIGNING_SECRET || serviceAccJson || resendKey || brevoKey || gasWebhookUrl || '').trim();

    if ((!gasWebhookUrl && !resendKey && !brevoKey) || !serviceAccJson || !signingSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'OTP_SERVICE_NOT_CONFIGURED' }), { status: 503, headers });
    }

    const clientIp = context.request.headers.get('cf-connecting-ip') || 'unknown';
    const rl = checkRateLimit(clientIp, email);
    if (!rl.ok) {
      return new Response(JSON.stringify({ ok: false, error: rl.reason, retryAfterSec: rl.retryAfterSec || 60 }), {
        status: 429,
        headers,
      });
    }

    const otp = generateSixDigitOtp();
    const otpHash = await sha256Hex(`${email}:${otp}`);
    const exp = Date.now() + 10 * 60 * 1000;
    const challengeToken = await signChallenge({ email, otpHash, exp }, signingSecret);

    const fromEmail = String(env.OTP_FROM_EMAIL || 'DAWAYA <onboarding@resend.dev>').trim();
    const subject = 'كود استعادة كلمة المرور - دوايا | DAWAYA OTP';
    const html = buildOtpEmailHtml(otp);

    let sent = false;
    let providerStatus = 0;
    let providerError = '';
    if (gasWebhookUrl) {
      try {
        const resp = await fetch(gasWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: gasSecret, to: email, subject, html }),
        });
        providerStatus = resp.status;
        if (resp.ok) {
          const txt = await resp.text().catch(() => '');
          if (!txt || txt.includes('"ok":true') || txt.includes('OK')) {
            sent = true;
          } else {
            providerError = txt.slice(0, 180);
          }
        }
      } catch (e) {
        providerError = String(e || '').slice(0, 120);
      }
    }
    if (!sent && resendKey) {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
      });
      sent = resp.ok;
      providerStatus = resp.status;
      if (!resp.ok) providerError = (await resp.text().catch(() => '')).slice(0, 180);
    }
    if (!sent && brevoKey) {
      const senderEmail = String(env.OTP_FROM_EMAIL || 'no-reply@dawaya.pages.dev').replace(/.*<|>|$/g, '').trim();
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'DAWAYA', email: senderEmail },
          to: [{ email }],
          subject,
          htmlContent: html,
        }),
      });
      sent = resp.ok;
      providerStatus = resp.status;
      if (!resp.ok) providerError = (await resp.text().catch(() => '')).slice(0, 180);
    }

    if (!sent) {
      return new Response(JSON.stringify({ ok: false, error: 'EMAIL_DELIVERY_FAILED', providerStatus, providerError }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true, challengeToken, expiresInSec: 600 }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'INTERNAL_ERROR' }), { status: 500, headers });
  }
}
