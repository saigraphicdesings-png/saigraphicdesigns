const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
export function emailSettings(env) {
  const sender = String(env.GMAIL_SENDER || '').trim();
  return { sender, configured: Boolean(emailPattern.test(sender) && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) };
}
function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export async function sendProductEmail(request, env, json) {
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const recipient = String(input?.recipient || '').trim();
  const productId = String(input?.productId || '').trim();
  if (recipient.length > 254 || !emailPattern.test(recipient)) return json({ error: 'Enter one valid customer email address.' }, 400);
  if (!/^[A-Za-z0-9_-]+$/.test(productId)) return json({ error: 'Select a product.' }, 400);
  const settings = emailSettings(env);
  if (!settings.configured) return json({ error: 'Connect your Gmail sender before sending product emails.' }, 503);
  const result = await env.DB.prepare('SELECT * FROM products WHERE id = ? AND active = 1').bind(productId).all();
  const product = result.results?.[0];
  if (!product) return json({ error: 'This product is no longer available. Refresh the product list.' }, 404);
  let download;
  try { download = new URL(product.download_url); } catch { return json({ error: 'Add a download URL to this product first.' }, 400); }
  if (download.protocol !== 'https:' || download.username || download.password) return json({ error: 'The product download URL must be a valid HTTPS link.' }, 400);
  const subject = 'Your design from Sai Graphic Designs';
  const body = `Hello,\n\nThank you for choosing Sai Graphic Designs.\n\nYour product: ${product.name}\n\nDownload your design:\n${download.href}\n\nIf you need any help, reply to this email.\n\nThank you,\nSai Graphic Designs`;
  const mime = [
    `From: Sai Graphic Designs <${settings.sender}>`, `To: ${recipient}`,
    `Subject: ${subject}`, 'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
    base64(body).match(/.{1,76}/g).join('\r\n')
  ].join('\r\n');
  let tokenResponse;
  try {
    tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }),
      signal: AbortSignal.timeout(15000)
    });
  } catch { return json({ error: 'Could not connect to Gmail. No email was submitted.' }, 502); }
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token.access_token) return json({ error: 'Gmail authorization failed. Reconnect the sender account.' }, 502);
  let sent;
  try {
    sent = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: base64(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }),
      signal: AbortSignal.timeout(15000)
    });
  } catch { return json({ error: 'Sending status is uncertain. Check Gmail Sent before trying again.' }, 502); }
  const data = await sent.json().catch(() => ({}));
  if (!sent.ok) return json({ error: 'Gmail did not accept the email. Check the sender connection and try again.' }, 502);
  if (!data.id) return json({ error: 'Sending status is uncertain. Check Gmail Sent before trying again.' }, 502);
  return json({ success: true, messageId: data.id, recipient });
}
