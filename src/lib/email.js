import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

// ── Helpers ───────────────────────────────────────────────────────────────────

function absoluteUrl(src, origin) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${origin}${src.startsWith('/') ? '' : '/'}${src}`;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Admin plain-text notification ─────────────────────────────────────────────

function buildAdminText(order) {
  const itemList = order.items
    .map(i => `  • ${i.name}  ×${i.qty}  $${(i.price * i.qty).toFixed(2)}`)
    .join('\n');
  const isPickup = order.delivery_method === 'pickup';
  return `
New Order at Sticker Stop! (#${order.id})
────────────────────────────
Customer: ${order.customer_name}
Email:    ${order.customer_email || '(not provided)'}
Delivery: ${isPickup ? 'Pickup' : 'Mail'}
${isPickup ? '' : `Address:  ${order.customer_address}\n`}Date:     ${new Date().toLocaleString()}

Items:
${itemList}
────────────────────────────
Subtotal: $${Number(order.subtotal ?? order.total).toFixed(2)}
Shipping: $${Number(order.shipping ?? 0).toFixed(2)}
Total:    $${Number(order.total).toFixed(2)}
  `.trim();
}

// ── Admin HTML notification ───────────────────────────────────────────────────

function buildAdminHtml(order, origin) {
  const itemRows  = order.items.map(i => buildItemRow(i, origin)).join('');
  const subtotal  = Number(order.subtotal ?? order.total).toFixed(2);
  const shipping  = Number(order.shipping ?? 0).toFixed(2);
  const total     = Number(order.total).toFixed(2);
  const isPickup  = order.delivery_method === 'pickup';
  const orderDate = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Order #${order.id} — Sticker Stop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
  img  { border:0; outline:0; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:#4ec3ff;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:white;font-size:26px;
                    line-height:1;text-shadow:0 2px 0 rgba(42,34,56,0.35);letter-spacing:-0.4px;">
                    Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Order #${order.id}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="width:80px;height:80px;border-radius:50%;
        background:#ffd23f;border:4px solid #2a2238;margin:0 auto 14px;
        box-shadow:0 5px 0 rgba(42,34,56,0.85);">
        <table cellpadding="0" cellspacing="0" border="0" width="80" height="80">
          <tr><td align="center" valign="middle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="#2a2238" stroke-width="2.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </td></tr>
        </table>
      </div>
      <div style="display:inline-block;background:#2a2238;color:white;
        font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:11px;
        letter-spacing:1.5px;padding:5px 12px;border-radius:999px;
        text-transform:uppercase;margin-bottom:14px;">
        New order &middot; ${orderDate}
      </div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:44px;
        margin:0 0 8px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        New order from <span style="color:#ff4d8d;">${escHtml(order.customer_name)}</span>!
      </h1>
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:22px;color:#2a2238;opacity:0.85;margin:0;">
        Order #${order.id} &middot; $${total} total
      </p>
    </td>
  </tr>

  <!-- Customer details -->
  <tr>
    <td style="padding:28px 28px 4px;">
      <div style="display:inline-block;background:#ff4d8d;color:white;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Customer</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom:12px;border-bottom:2px dashed rgba(42,34,56,0.18);">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Name</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:17px;color:#2a2238;">
                    ${escHtml(order.customer_name)}</div>
                </td>
              </tr>
              ${order.customer_email ? `
              <tr>
                <td style="padding:12px 0;border-bottom:2px dashed rgba(42,34,56,0.18);">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Email</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:17px;color:#2a2238;">
                    <a href="mailto:${escHtml(order.customer_email)}" style="color:#2a2238;">${escHtml(order.customer_email)}</a></div>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding-top:12px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">
                    ${isPickup ? 'Delivery' : 'Ship to'}</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:16px;
                    line-height:1.5;color:#2a2238;">
                    ${isPickup ? 'Pickup &mdash; customer will collect in person' : escHtml(order.customer_address).replace(/\n/g, '<br/>')}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Order items -->
  <tr>
    <td style="padding:6px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Order items</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:0 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${itemRows}
              <tr>
                <td style="padding-top:14px;border-top:3px solid #2a2238;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
                        font-size:15px;color:#2a2238;padding:3px 0;">Subtotal</td>
                      <td align="right" style="font-family:'Fredoka',Arial,sans-serif;
                        font-weight:600;font-size:15px;color:#2a2238;padding:3px 0;">$${subtotal}</td>
                    </tr>
                    <tr>
                      <td style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
                        font-size:15px;color:#2a2238;padding:3px 0;">Shipping</td>
                      <td align="right" style="font-family:'Fredoka',Arial,sans-serif;
                        font-weight:600;font-size:15px;color:#2a2238;padding:3px 0;">$${shipping}</td>
                    </tr>
                    <tr>
                      <td style="padding-top:10px;border-top:2px dashed rgba(42,34,56,0.25);">
                        <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:28px;color:#2a2238;">Total</span>
                      </td>
                      <td align="right" style="padding-top:10px;border-top:2px dashed rgba(42,34,56,0.25);">
                        <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:28px;color:#2a2238;">$${total}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Spacer -->
  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;margin-top:22px;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:22px;color:#2a2238;margin:0 0 4px;">
        Time to pack some stickers!
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop &middot; Admin Notification
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Item row builder ──────────────────────────────────────────────────────────

function buildItemRow(item, origin) {
  const imageUrl = absoluteUrl(item.image, origin);
  const lineTotal = (item.price * item.qty).toFixed(2);
  const subLabel = (item.kind === 'set' || item.kind === 'pair')
    ? `Full set &middot; $${item.price.toFixed(2)}`
    : `Single sheet &middot; $${item.price.toFixed(2)}`;

  let thumbContent = '';
  if (imageUrl) {
    if (item.image2 && (item.kind === 'set' || item.kind === 'pair')) {
      const image2Url = absoluteUrl(item.image2, origin);
      if (item.image3) {
        const image3Url = absoluteUrl(item.image3, origin);
        thumbContent = `<table cellpadding="0" cellspacing="0" border="0" width="64" height="64" style="border-collapse:separate;border-spacing:2px;">
          <tr>
            <td style="padding:0;width:20px;">
              <img src="${imageUrl}" width="20" height="64" alt=""
                style="display:block;width:20px;height:64px;object-fit:cover;border-radius:5px;" />
            </td>
            <td style="padding:0;width:20px;">
              <img src="${image2Url}" width="20" height="64" alt=""
                style="display:block;width:20px;height:64px;object-fit:cover;border-radius:5px;" />
            </td>
            <td style="padding:0;width:20px;">
              <img src="${image3Url}" width="20" height="64" alt=""
                style="display:block;width:20px;height:64px;object-fit:cover;border-radius:5px;" />
            </td>
          </tr>
        </table>`;
      } else {
        thumbContent = `<table cellpadding="0" cellspacing="0" border="0" width="64" height="64" style="border-collapse:separate;border-spacing:2px;">
          <tr>
            <td style="padding:0;width:31px;">
              <img src="${imageUrl}" width="31" height="64" alt=""
                style="display:block;width:31px;height:64px;object-fit:cover;border-radius:5px;" />
            </td>
            <td style="padding:0;width:31px;">
              <img src="${image2Url}" width="31" height="64" alt=""
                style="display:block;width:31px;height:64px;object-fit:cover;border-radius:5px;" />
            </td>
          </tr>
        </table>`;
      }
    } else if (item.side === 'full') {
      thumbContent = `<img src="${imageUrl}" width="64" height="64" alt=""
        style="display:block;width:64px;height:64px;object-fit:cover;border-radius:9px;" />`;
    } else if (item.side === 'left') {
      thumbContent = `<div style="width:64px;height:64px;
        background-image:url('${imageUrl}');
        background-position:left center;
        background-size:200% auto;
        background-repeat:no-repeat;"></div>`;
    } else {
      thumbContent = `<div style="width:64px;height:64px;
        background-image:url('${imageUrl}');
        background-position:right center;
        background-size:200% auto;
        background-repeat:no-repeat;"></div>`;
    }
  }

  return `
  <tr>
    <td style="padding:12px 0;border-bottom:2px dashed rgba(42,34,56,0.18);">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="78" valign="middle" style="padding-right:0;">
            <div style="position:relative;display:inline-block;width:64px;height:64px;vertical-align:top;">
              <div style="width:64px;height:64px;border-radius:12px;overflow:hidden;
                background:#fff1cf;border:2.5px solid #2a2238;
                box-shadow:0 3px 0 rgba(42,34,56,0.85);">
                ${thumbContent}
              </div>
              <div style="position:absolute;top:-6px;right:-6px;
                width:22px;height:22px;border-radius:50%;
                background:#ff4d8d;color:white;border:2px solid #2a2238;
                font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:12px;
                text-align:center;line-height:20px;
                box-shadow:0 2px 0 rgba(42,34,56,0.85);">${item.qty}</div>
            </div>
          </td>
          <td valign="middle" style="padding-left:14px;">
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;
              font-size:16px;line-height:1.2;color:#2a2238;">${item.name}</div>
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
              font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">${subLabel}</div>
          </td>
          <td valign="middle" align="right" style="white-space:nowrap;padding-left:10px;">
            <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:22px;
              line-height:1;color:#2a2238;">$${lineTotal}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Customer HTML email ───────────────────────────────────────────────────────

function buildCustomerHtml(order, settings, origin) {
  const itemRows  = order.items.map(i => buildItemRow(i, origin)).join('');
  const subtotal  = Number(order.subtotal ?? order.total).toFixed(2);
  const shipping  = Number(order.shipping ?? 0).toFixed(2);
  const total     = Number(order.total).toFixed(2);
  const orderDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const firstName = order.customer_name.split(' ')[0];
  const isPickup  = order.delivery_method === 'pickup';

  const payBlock = `
  <tr>
    <td style="padding:0 22px 22px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background:#ffd23f;border-radius:22px;padding:24px 22px;
            text-align:center;border:3px solid #2a2238;
            box-shadow:0 6px 0 rgba(42,34,56,0.85);">
            <div style="font-size:28px;margin-bottom:10px;">💸</div>
            <h3 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:26px;
              margin:0 0 10px;color:#2a2238;letter-spacing:-0.3px;">
              One tiny thing!
            </h3>
            <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
              font-size:16px;color:#2a2238;margin:0 auto 0;
              max-width:380px;line-height:1.6;">
              Thanks for buying my stickers! &#127881; We accept
              <strong>Apple Pay or cash</strong> &mdash; you can send your payment
              to my mom or dad. Enjoy!
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your Sticker Stop order is confirmed!</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
  img  { border:0; outline:0; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:#4ec3ff;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;
                    display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;
                      vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                    color:white;font-size:26px;line-height:1;
                    text-shadow:0 2px 0 rgba(42,34,56,0.35);
                    letter-spacing:-0.4px;">Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;
              padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Order #${order.id}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="width:80px;height:80px;border-radius:50%;
        background:#6ddc8a;border:4px solid #2a2238;
        margin:0 auto 14px;
        box-shadow:0 5px 0 rgba(42,34,56,0.85);">
        <table cellpadding="0" cellspacing="0" border="0" width="80" height="80">
          <tr><td align="center" valign="middle">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="#2a2238" stroke-width="3.5"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </td></tr>
        </table>
      </div>
      <div style="display:inline-block;background:#2a2238;color:white;
        font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:11px;
        letter-spacing:1.5px;padding:5px 12px;border-radius:999px;
        text-transform:uppercase;margin-bottom:14px;">
        Order received &middot; ${orderDate}
      </div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:52px;
        margin:0 0 8px;line-height:0.95;letter-spacing:-1px;color:#2a2238;">
        <span style="display:inline-block;transform:rotate(-2deg);">Hooray,</span>
        <span style="display:inline-block;transform:rotate(2deg);color:#ff4d8d;">${escHtml(firstName)}</span>
        <span style="display:inline-block;transform:rotate(-1deg);">!</span>
      </h1>
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;
        color:#2a2238;opacity:0.85;margin:0 0 8px;">
        ${isPickup ? 'Your order will be ready for pickup soon!' : 'Your stickers are picked, packed, and getting ready! &#10024;'}
      </p>
    </td>
  </tr>

  <!-- Payment block -->
  ${payBlock}

  <!-- Receipt -->
  <tr>
    <td style="padding:22px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Your sticker stash</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:0 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${itemRows}
              <tr>
                <td style="padding-top:14px;border-top:3px solid #2a2238;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
                        font-size:15px;color:#2a2238;padding:3px 0;">Subtotal</td>
                      <td align="right" style="font-family:'Fredoka',Arial,sans-serif;
                        font-weight:600;font-size:15px;color:#2a2238;padding:3px 0;">$${subtotal}</td>
                    </tr>
                    <tr>
                      <td style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
                        font-size:15px;color:#2a2238;padding:3px 0;">Shipping</td>
                      <td align="right" style="font-family:'Fredoka',Arial,sans-serif;
                        font-weight:600;font-size:15px;color:#2a2238;padding:3px 0;">$${shipping}</td>
                    </tr>
                    <tr>
                      <td style="padding-top:10px;border-top:2px dashed rgba(42,34,56,0.25);">
                        <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                          font-size:28px;color:#2a2238;">Total</span>
                      </td>
                      <td align="right" style="padding-top:10px;
                        border-top:2px dashed rgba(42,34,56,0.25);">
                        <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                          font-size:28px;color:#2a2238;">$${total}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Shipping / Pickup -->
  <tr>
    <td style="padding:6px 28px 4px;">
      <div style="display:inline-block;background:#4ec3ff;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">${isPickup ? 'Pickup' : 'Shipping to'}</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td width="72" valign="middle" style="padding:18px 0 18px 20px;">
            <div style="width:56px;height:56px;border-radius:50%;
              background:#ff8a3d;border:3px solid #2a2238;text-align:center;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">
              <table cellpadding="0" cellspacing="0" border="0" width="56" height="56">
                <tr><td align="center" valign="middle">
                  ${isPickup ? `
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#2a2238" stroke-width="2.4"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 12V22H4V12"/>
                    <path d="M22 7H2v5h20V7z"/>
                    <path d="M12 22V7"/>
                    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                  </svg>` : `
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#2a2238" stroke-width="2.4"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9h13l3 3v6h-4"/>
                    <circle cx="7.5" cy="18" r="2"/>
                    <circle cx="16.5" cy="18" r="2"/>
                    <path d="M3 9v9h2.5"/>
                  </svg>`}
                </td></tr>
              </table>
            </div>
          </td>
          <td valign="middle" style="padding:18px 20px 18px 16px;">
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;
              font-size:13px;text-transform:uppercase;letter-spacing:1px;
              color:#2a2238;opacity:0.6;margin-bottom:4px;">${isPickup ? 'Pickup' : 'Mailing to'}</div>
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
              font-size:16px;line-height:1.4;color:#2a2238;">
              ${isPickup ? "We'll be in touch to arrange a pickup time!" : escHtml(order.customer_address).replace(/\n/g, '<br/>')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>


  <!-- What happens next -->
  <tr>
    <td style="padding:6px 28px 4px;">
      <div style="display:inline-block;background:#6ddc8a;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">What happens next</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:16px 18px 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="54" valign="top" style="padding-right:14px;padding-bottom:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#ff4d8d;border:3px solid #2a2238;text-align:center;line-height:36px;
                    font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:20px;color:white;">1</div>
                </td>
                <td valign="top" style="padding-bottom:14px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:16px;color:#2a2238;">
                    You send payment (Apple Pay or cash) &#9757;&#65039;
                  </div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">Apple Pay or cash both work great!</div>
                </td>
              </tr>
              <tr>
                <td width="54" valign="top" style="padding-right:14px;padding-bottom:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#ffd23f;border:3px solid #2a2238;text-align:center;line-height:36px;
                    font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:20px;color:#2a2238;">2</div>
                </td>
                <td valign="top" style="padding-bottom:14px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:16px;color:#2a2238;">We pack your stickers${isPickup ? '' : ' (with a tiny bonus, free)'}</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">Usually within 1&ndash;2 days. Sometimes faster if it&rsquo;s snack time.</div>
                </td>
              </tr>
              <tr>
                <td width="54" valign="top" style="padding-right:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#6ddc8a;border:3px solid #2a2238;text-align:center;line-height:36px;
                    font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:20px;color:#2a2238;">3</div>
                </td>
                <td valign="top">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:16px;color:#2a2238;">
                    ${isPickup ? 'You come pick them up &middot; then stick them everywhere' : 'USPS shows up &middot; you stick them on everything'}
                  </div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">Laptops, notebooks, foreheads &mdash; have fun.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Spacer -->
  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;color:#2a2238;margin:0 0 4px;">
        stick &lsquo;em everywhere &#10024;<br/>
        &mdash; the Sticker Stop crew
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

// ── Fulfillment email (ready for pickup / shipped) ────────────────────────────

function buildFulfillmentHtml(order, origin) {
  const isPickup   = order.delivery_method === 'pickup';
  const firstName  = (order.customer_name?.split(' ')[0]) ?? order.customer_name;
  const itemRows   = order.items.map(i => buildItemRow(i, origin)).join('');
  const total      = Number(order.total).toFixed(2);
  const bannerColor = isPickup ? '#6ddc8a' : '#4ec3ff';
  const headline   = isPickup ? 'Ready for pickup!' : 'Your order shipped!';
  const subtext    = isPickup
    ? 'Your stickers are packed and waiting — come grab them!'
    : 'Your stickers are on their way. Keep an eye on the mailbox! &#128231;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${headline} — Sticker Stop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:${bannerColor};border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:#2a2238;
                    font-size:26px;line-height:1;letter-spacing:-0.4px;">Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Order #${order.id}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="font-size:72px;line-height:1;margin-bottom:14px;">
        ${isPickup ? '&#127968;' : '&#128230;'}
      </div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:48px;
        margin:0 0 10px;line-height:1;letter-spacing:-1px;color:#2a2238;">
        <span style="display:inline-block;transform:rotate(-2deg);">Hey,</span>
        <span style="display:inline-block;transform:rotate(2deg);color:#ff4d8d;">${escHtml(firstName)}</span>
        <span style="display:inline-block;transform:rotate(-1deg);">&#8212;</span>
      </h1>
      <h2 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:38px;
        margin:0 0 10px;color:#2a2238;letter-spacing:-0.5px;">
        ${headline}
      </h2>
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;
        color:#2a2238;opacity:0.85;margin:0 0 8px;">
        ${subtext}
      </p>
      ${isPickup && order.customer_address ? `
      <div style="display:inline-block;margin-top:10px;background:white;
        border:2.5px solid #2a2238;border-radius:14px;padding:10px 20px;
        font-family:'Fredoka',Arial,sans-serif;font-size:14px;color:#2a2238;
        box-shadow:0 4px 0 rgba(42,34,56,0.85);">
        &#128205; ${escHtml(order.customer_address)}
      </div>` : ''}
      ${!isPickup && order.customer_address ? `
      <div style="display:inline-block;margin-top:10px;background:white;
        border:2.5px solid #2a2238;border-radius:14px;padding:10px 20px;
        font-family:'Fredoka',Arial,sans-serif;font-size:14px;color:#2a2238;
        box-shadow:0 4px 0 rgba(42,34,56,0.85);">
        Shipping to: ${escHtml(order.customer_address)}
      </div>` : ''}
    </td>
  </tr>

  <!-- Receipt -->
  <tr>
    <td style="padding:22px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Your sticker stash</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:0 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${itemRows}
              <!-- Total -->
              <tr>
                <td style="padding:10px 0 12px;" colspan="3">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:18px;
                        color:#2a2238;padding:3px 0;">Total</td>
                      <td align="right" style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                        font-size:18px;color:#2a2238;padding:3px 0;">$${total}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Spacer -->
  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;color:#2a2238;margin:0 0 4px;">
        stick &lsquo;em everywhere &#10024;<br/>
        &mdash; the Sticker Stop crew
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendFulfillmentEmail(order, origin = '') {
  if (!RESEND_API_KEY) return;
  if (!order.customer_email) return;

  const resend   = new Resend(RESEND_API_KEY);
  const from     = EMAIL_FROM || 'Sticker Stop <orders@sticker-stop.com>';
  const isPickup = order.delivery_method === 'pickup';
  const subject  = isPickup
    ? `&#127968; Your order #${order.id} is ready for pickup!`
    : `&#128230; Your order #${order.id} has shipped!`;
  const text = isPickup
    ? `Hi ${order.customer_name}! Great news — your Sticker Stop order #${order.id} is ready for pickup. Come grab your stickers!`
    : `Hi ${order.customer_name}! Great news — your Sticker Stop order #${order.id} has shipped and is on its way to you!`;

  const result = await resend.emails.send({
    from,
    to: order.customer_email,
    subject,
    html: buildFulfillmentHtml(order, origin),
    text,
  });
  if (result.error) throw new Error(result.error.message);
}

// ── Cancellation email ────────────────────────────────────────────────────────

function buildCancellationHtml(order, origin) {
  const firstName = (order.customer_name?.split(' ')[0]) ?? order.customer_name;
  const itemRows  = order.items.map(i => buildItemRow(i, origin)).join('');
  const total     = Number(order.total).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your order has been canceled — Sticker Stop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:#ff8a3d;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:#2a2238;
                    font-size:26px;line-height:1;letter-spacing:-0.4px;">Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Order #${order.id}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="font-size:72px;line-height:1;margin-bottom:14px;">&#128565;</div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:48px;
        margin:0 0 10px;line-height:1;letter-spacing:-1px;color:#2a2238;">
        <span style="display:inline-block;transform:rotate(-2deg);">Oof,</span>
        <span style="display:inline-block;transform:rotate(2deg);color:#ff4d8d;">${escHtml(firstName)}</span>
        <span style="display:inline-block;transform:rotate(-1deg);">&#8212;</span>
      </h1>
      <h2 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:36px;
        margin:0 0 12px;color:#2a2238;letter-spacing:-0.5px;">
        your order got canceled.
      </h2>
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:22px;
        color:#2a2238;opacity:0.85;margin:0 0 6px;line-height:1.4;">
        We had to cancel this one — sorry about that!<br/>
        Your stickers are still out there waiting to be stuck somewhere great. &#128151;
      </p>
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:18px 28px 0;">
    <div style="border-top:2.5px dashed rgba(42,34,56,0.15);"></div>
  </td></tr>

  <!-- Canceled order recap -->
  <tr>
    <td style="padding:18px 28px 4px;">
      <div style="display:inline-block;background:#ff8a3d;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);color:#2a2238;">The canceled stash</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:0 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${itemRows}
              <tr>
                <td style="padding:10px 0 12px;" colspan="3">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:18px;
                        color:#2a2238;padding:3px 0;">Total</td>
                      <td align="right" style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                        font-size:18px;color:#2a2238;padding:3px 0;">$${total}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:28px 28px 8px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:20px;color:#2a2238;
        opacity:0.85;margin:0 0 16px;line-height:1.4;">
        If you still want these stickers, you're always welcome<br/>to place a new order. We'd love to have you back!
      </p>
      <a href="https://www.sticker-stop.com"
        style="display:inline-block;background:#ff4d8d;color:white;
          border:3px solid #2a2238;border-radius:999px;padding:12px 28px;
          font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:17px;
          box-shadow:0 5px 0 rgba(42,34,56,0.85);text-decoration:none;
          letter-spacing:0.2px;">
        Shop again &#127881;
      </a>
    </td>
  </tr>

  <!-- Spacer -->
  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;color:#2a2238;margin:0 0 4px;">
        stick &lsquo;em everywhere &#10024;<br/>
        &mdash; the Sticker Stop crew
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendCancellationEmail(order, origin = '') {
  if (!RESEND_API_KEY) return;
  if (!order.customer_email) return;

  const resend  = new Resend(RESEND_API_KEY);
  const from    = EMAIL_FROM || 'Sticker Stop <orders@sticker-stop.com>';
  const subject = `Your Sticker Stop order #${order.id} has been canceled`;
  const text    = `Hi ${order.customer_name} — we're sorry to say your Sticker Stop order #${order.id} has been canceled. If you'd still like these stickers, feel free to place a new order at sticker-stop.com. We'd love to have you back!`;

  const result = await resend.emails.send({
    from,
    to: order.customer_email,
    subject,
    html: buildCancellationHtml(order, origin),
    text,
  });
  if (result.error) throw new Error(result.error.message);
}

// ── Payment reminder email ────────────────────────────────────────────────────

function buildPaymentReminderHtml(order, origin) {
  const firstName = (order.customer_name?.split(' ')[0]) ?? order.customer_name;
  const itemRows  = order.items.map(i => buildItemRow(i, origin)).join('');
  const total     = Number(order.total).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Psst… we haven't gotten your payment yet — Sticker Stop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:#ffd23f;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:#2a2238;
                    font-size:26px;line-height:1;letter-spacing:-0.4px;">Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Order #${order.id}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="font-size:72px;line-height:1;margin-bottom:14px;">&#128064;</div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:46px;
        margin:0 0 8px;line-height:1;letter-spacing:-1px;color:#2a2238;">
        <span style="display:inline-block;transform:rotate(-2deg);">Hey,</span>
        <span style="display:inline-block;transform:rotate(2deg);color:#ff4d8d;">${escHtml(firstName)}</span>
        <span style="display:inline-block;transform:rotate(-1deg);">!</span>
      </h1>
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:26px;
        color:#2a2238;opacity:0.9;margin:0 0 12px;line-height:1.3;">
        No biggie, but&hellip; we haven&rsquo;t gotten your payment yet. &#128591;
      </p>
    </td>
  </tr>

  <!-- Message block -->
  <tr>
    <td style="padding:8px 28px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:22px 22px 20px;">
            <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
              font-size:17px;color:#2a2238;margin:0 0 12px;line-height:1.5;">
              Totally my fault for not reminding you sooner &mdash; life gets busy,
              stickers get forgotten, it happens to the best of us. &#128517;
            </p>
            <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
              font-size:15px;color:#2a2238;opacity:0.8;margin:0 0 12px;line-height:1.5;">
              Your order is all set and just waiting on payment before we can pack it up
              and send it your way. Your stickers are literally sitting there, ready, staring
              at the door, wondering when you&rsquo;re coming. &#128293;
            </p>
            <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
              font-size:15px;color:#2a2238;opacity:0.8;margin:0;line-height:1.5;">
              No pressure, no late fees, no glitter bombs &mdash; just a friendly little nudge.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- How to pay -->
  <tr>
    <td style="padding:4px 28px 20px;">
      <div style="display:inline-block;background:#6ddc8a;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">How to pay</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:16px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="50" valign="middle" style="padding-right:14px;padding-bottom:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#2a2238;border:3px solid #2a2238;text-align:center;
                    box-shadow:0 3px 0 rgba(42,34,56,0.85);">
                    <table cellpadding="0" cellspacing="0" border="0" width="40" height="40">
                      <tr><td align="center" valign="middle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                          stroke="white" stroke-width="2.5"
                          stroke-linecap="round" stroke-linejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/>
                          <path d="M2 10h20"/>
                        </svg>
                      </td></tr>
                    </table>
                  </div>
                </td>
                <td valign="middle" style="padding-bottom:14px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;
                    font-size:16px;color:#2a2238;">Apple Pay</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
                    font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">
                    Tap, pay, done. Extremely satisfying.
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50" valign="middle" style="padding-right:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#6ddc8a;border:3px solid #2a2238;text-align:center;
                    box-shadow:0 3px 0 rgba(42,34,56,0.85);">
                    <table cellpadding="0" cellspacing="0" border="0" width="40" height="40">
                      <tr><td align="center" valign="middle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                          stroke="#2a2238" stroke-width="2.5"
                          stroke-linecap="round" stroke-linejoin="round">
                          <rect x="2" y="6" width="20" height="14" rx="1"/>
                          <path d="M2 10h20M6 14h.01M10 14h4"/>
                        </svg>
                      </td></tr>
                    </table>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;
                    font-size:16px;color:#2a2238;">Cash</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
                    font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">
                    Old school. Timeless. We love it.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Order recap -->
  <tr>
    <td style="padding:4px 28px 20px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Your order recap</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:0 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${itemRows}
              <tr>
                <td style="padding:10px 0 12px;" colspan="3">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:18px;
                        color:#2a2238;padding:3px 0;">Total due</td>
                      <td align="right" style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                        font-size:18px;color:#ff4d8d;padding:3px 0;">$${total}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Spacer -->
  <tr><td style="padding:8px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;color:#2a2238;margin:0 0 4px;">
        thanks for your patience &amp; your excellent taste in stickers &#10024;<br/>
        &mdash; the Sticker Stop crew
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendPaymentReminderEmail(order, origin = '') {
  if (!RESEND_API_KEY) return;
  if (!order.customer_email) return;

  const resend  = new Resend(RESEND_API_KEY);
  const from    = EMAIL_FROM || 'Sticker Stop <orders@sticker-stop.com>';
  const subject = `Psst… we haven't gotten your payment yet 👀 (Order #${order.id})`;
  const text    = [
    `Hey ${order.customer_name}!`,
    ``,
    `No biggie — just a friendly reminder that we haven't received payment for your Sticker Stop order #${order.id} yet. Totally our fault for not reminding you sooner!`,
    ``,
    `Your order:`,
    ...order.items.map(i => `  • ${i.name}  ×${i.qty}  $${(i.price * i.qty).toFixed(2)}`),
    ``,
    `Total due: $${Number(order.total).toFixed(2)}`,
    ``,
    `You can pay with Apple Pay or cash — both work great!`,
    ``,
    `No pressure, no late fees, no glitter bombs. Just a nudge. 😄`,
    ``,
    `— The Sticker Stop Crew`,
  ].join('\n');

  const result = await resend.emails.send({
    from,
    to: order.customer_email,
    subject,
    html: buildPaymentReminderHtml(order, origin),
    text,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function sendOrderEmail(order, settings, origin = '') {
  if (!RESEND_API_KEY) return;

  const resend = new Resend(RESEND_API_KEY);
  const from = EMAIL_FROM || 'Sticker Stop <orders@sticker-stop.com>';

  async function send({ to, subject, text, html }) {
    const result = await resend.emails.send({ from, to, subject, text, html });
    if (result.error) throw new Error(result.error.message);
  }

  // Admin plain-text notification
  const recipients = (settings.notification_emails || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (recipients.length) {
    await send({
      to:      recipients,
      subject: `New Sticker Stop Order #${order.id} — ${order.customer_name}`,
      text:    buildAdminText(order),
      html:    buildAdminHtml(order, origin),
    });
  }

  // Customer HTML confirmation
  if (order.customer_email) {
    const html = buildCustomerHtml(order, settings, origin);
    const text = [
      `Hi ${order.customer_name}!`,
      ``,
      `Thanks for your order #${order.id}! We're so excited to get your stickers to you.`,
      ``,
      ...order.items.map(i => `  • ${i.name}  ×${i.qty}  $${(i.price * i.qty).toFixed(2)}`),
      ``,
      `Total: $${Number(order.total).toFixed(2)}`,
      `\nThanks for buying my stickers! We accept Apple Pay or cash — you can send your payment to my mom or dad. Enjoy!`,
      ``,
      `— The Sticker Stop Team`,
    ].filter(l => l !== undefined).join('\n');

    await send({
      to:      order.customer_email,
      subject: `🎉 Your order #${order.id} is confirmed!`,
      text,
      html,
    });
  }
}

// ── Feedback email (admin notification) ──────────────────────────────────────

function buildFeedbackHtml(data) {
  const { mood, moodLabel, topics, name, email, message, anonymous } = data;
  const fromLabel = anonymous ? 'Anonymous' : escHtml(name || 'Someone');
  const topicsText = topics?.length ? topics.map(escHtml).join(', ') : 'General';
  const moodColors = { '😖': '#ff8a3d', '🤔': '#ffd23f', '😊': '#6ddc8a', '🤩': '#4ec3ff', '🥳': '#ff4d8d' };
  const moodBg = moodColors[mood] || '#fff7e3';
  const now = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Feedback — Sticker Stop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:${moodBg};border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#2a2238;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:#2a2238;font-size:26px;
                    line-height:1;letter-spacing:-0.4px;">Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">New Feedback</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Mood hero -->
  <tr>
    <td style="padding:32px 28px 8px;text-align:center;">
      <div style="font-size:64px;line-height:1;margin-bottom:10px;">${mood || '💬'}</div>
      <div style="display:inline-block;background:#2a2238;color:white;
        font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:11px;
        letter-spacing:1.5px;padding:5px 12px;border-radius:999px;
        text-transform:uppercase;margin-bottom:14px;">
        ${now}
      </div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:36px;
        margin:0 0 6px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        Feedback from <span style="color:#ff4d8d;">${fromLabel}</span>
      </h1>
      ${!anonymous && email ? `<p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:20px;color:#2a2238;opacity:0.8;margin:0;">
        <a href="mailto:${escHtml(email)}" style="color:#2a2238;">${escHtml(email)}</a>
      </p>` : ''}
    </td>
  </tr>

  <!-- Details row -->
  <tr>
    <td style="padding:16px 28px 4px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:16px 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:8px 0;border-bottom:2px dashed rgba(42,34,56,0.18);width:50%">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:11px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Mood</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:17px;color:#2a2238;">
                    ${mood} ${escHtml(moodLabel || '')}</div>
                </td>
                <td style="padding:8px 0 8px 16px;border-bottom:2px dashed rgba(42,34,56,0.18);">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:11px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Topics</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:15px;color:#2a2238;">
                    ${topicsText}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Message -->
  <tr>
    <td style="padding:8px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">What they said</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:20px 22px;">
            <div style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:22px;color:#2a2238;line-height:1.6;">
              ${escHtml(message).replace(/\n/g, '<br/>')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr><td style="padding:14px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop &middot; Admin Notification
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendFeedbackEmail(data, recipients) {
  if (!RESEND_API_KEY || !recipients.length) return;
  const resend = new Resend(RESEND_API_KEY);
  const from = 'Sticker Stop <feedback@sticker-stop.com>';
  const { mood, moodLabel, topics, name, email, message, anonymous } = data;
  const fromLabel = anonymous ? 'Anonymous' : (name || 'Someone');

  try {
    await resend.emails.send({
      from,
      ...(!anonymous && email ? { replyTo: email } : {}),
      to: recipients,
      subject: `${mood || '💬'} Feedback from ${fromLabel} — Sticker Stop`,
      html: buildFeedbackHtml(data),
      text: `Feedback from ${fromLabel}\nMood: ${moodLabel || mood}\nTopics: ${topics?.join(', ') || 'General'}\n\n${message}`,
    });
  } catch (err) {
    console.error('Feedback email failed:', err.message);
  }
}

// ── Custom request email (admin notification) ─────────────────────────────────

function buildCustomRequestHtml(data) {
  const { name, email, purpose, theme, description, styles, qty, deadline, budget, fileNames } = data;
  const stylesText = styles?.length ? styles.map(escHtml).join(', ') : '(none selected)';
  const filesText = fileNames?.length ? fileNames.map(escHtml).join(', ') : '(none)';
  const qtyLabels = { '10': '10 sheets — $45', '25': '25 sheets — $95', '50': '50+ sheets — Quote' };
  const qtyText = qtyLabels[qty] || escHtml(qty);
  const now = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Custom Sticker Request from ${escHtml(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:#8b5cf6;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:white;font-size:26px;
                    line-height:1;text-shadow:0 2px 0 rgba(42,34,56,0.35);letter-spacing:-0.4px;">
                    Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Custom Request</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="display:inline-block;background:#2a2238;color:white;
        font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:11px;
        letter-spacing:1.5px;padding:5px 12px;border-radius:999px;
        text-transform:uppercase;margin-bottom:14px;">
        New request &middot; ${now}
      </div>
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:40px;
        margin:0 0 8px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        Custom request from <span style="color:#8b5cf6;">${escHtml(name)}</span>!
      </h1>
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:22px;color:#2a2238;opacity:0.85;margin:0;">
        <a href="mailto:${escHtml(email)}" style="color:#2a2238;">${escHtml(email)}</a>
      </p>
    </td>
  </tr>

  <!-- Details -->
  <tr>
    <td style="padding:28px 28px 4px;">
      <div style="display:inline-block;background:#8b5cf6;color:white;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Request Details</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${[
                ['Purpose',         escHtml(purpose || '—')],
                ['Theme',           escHtml(theme || '—')],
                ['Art Styles',      stylesText],
                ['Quantity',        qtyText],
                ['Budget',          escHtml(budget || '—')],
                ['Deadline',        escHtml(deadline || '—')],
                ['Reference Files', filesText],
              ].map(([label, value], i, arr) => `
              <tr>
                <td style="padding:10px 0;${i < arr.length - 1 ? 'border-bottom:2px dashed rgba(42,34,56,0.18);' : ''}">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">${label}</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:16px;color:#2a2238;">
                    ${value}</div>
                </td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Description -->
  <tr>
    <td style="padding:6px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Their vision</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 22px;">
            <div style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:20px;color:#2a2238;line-height:1.6;">
              ${escHtml(description).replace(/\n/g, '<br/>')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:22px;color:#2a2238;margin:0 0 4px;">
        time to make some magic! &#10024;
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop &middot; Admin Notification
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendCustomRequestEmail(data, recipients) {
  if (!RESEND_API_KEY || !recipients.length) return;
  const resend = new Resend(RESEND_API_KEY);
  const from = EMAIL_FROM || 'Sticker Stop <orders@sticker-stop.com>';
  const { name, description } = data;

  try {
    await resend.emails.send({
      from,
      to: recipients,
      subject: `New Custom Sticker Request from ${name}`,
      html: buildCustomRequestHtml(data),
      text: `New custom sticker request from ${name}\n\nDescription: ${description}`,
    });
  } catch (err) {
    console.error('Custom request email failed:', err.message);
  }
}

// ── Announcement email ────────────────────────────────────────────────────────

function buildAnnouncementHtml(subject, body, imageUrl) {
  const paragraphs = body.split(/\n\n+/).map(p =>
    `<p style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:17px;
      color:#2a2238;line-height:1.65;margin:0 0 14px;text-align:center;">${escHtml(p).replace(/\n/g, '<br/>')}</p>`
  ).join('');

  const imageInCard = imageUrl ? `
            <tr>
              <td style="padding:8px 0 6px;">
                <img src="${escHtml(imageUrl)}" alt="" width="496"
                  style="display:block;width:100%;max-width:496px;height:auto;
                    border-radius:12px;border:2.5px solid #2a2238;
                    box-shadow:0 4px 0 rgba(42,34,56,0.85);" />
              </td>
            </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escHtml(subject)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
  img  { border:0; outline:0; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:#4ec3ff;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;color:white;font-size:26px;
                    line-height:1;text-shadow:0 2px 0 rgba(42,34,56,0.35);letter-spacing:-0.4px;">
                    Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">News ✨</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Heading -->
  <tr>
    <td style="padding:36px 28px 20px;text-align:center;">
      <h1 style="font-family:'Bagel Fat One','Arial Black',Impact,sans-serif;font-size:42px;
        margin:0 0 8px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        ${escHtml(subject)}
      </h1>
    </td>
  </tr>

  <!-- Body + Image card -->
  <tr>
    <td style="padding:0 28px 8px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:22px 24px 16px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr><td>${paragraphs}</td></tr>
              ${imageInCard}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Spacer -->
  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat','Comic Sans MS','Comic Sans',cursive;font-size:24px;color:#2a2238;margin:0 0 4px;">
        stick &lsquo;em everywhere &#10024;<br/>
        &mdash; the Sticker Stop crew
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendAnnouncementEmail({ subject, body, imageUrl }, recipients) {
  if (!RESEND_API_KEY || !recipients.length) return;
  const resend = new Resend(RESEND_API_KEY);
  const from = 'Sticker Stop <info@sticker-stop.com>';

  const results = { sent: 0, failed: 0, errors: [] };
  for (const to of recipients) {
    try {
      const result = await resend.emails.send({
        from,
        to,
        subject,
        html: buildAnnouncementHtml(subject, body, imageUrl),
        text: body,
      });
      if (result.error) {
        results.failed++;
        results.errors.push(`${to}: ${result.error.message}`);
      } else {
        results.sent++;
      }
    } catch (err) {
      results.failed++;
      results.errors.push(`${to}: ${err.message}`);
    }
  }
  return results;
}
