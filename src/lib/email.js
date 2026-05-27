import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

// ── Helpers ───────────────────────────────────────────────────────────────────

function absoluteUrl(src, origin) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${origin}${src.startsWith('/') ? '' : '/'}${src}`;
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
${order.customer_notes ? `\nNotes: ${order.customer_notes}` : ''}
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
                    <span style="font-family:'Bagel Fat One',cursive;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One',cursive;color:white;font-size:26px;
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
      <h1 style="font-family:'Bagel Fat One',cursive;font-size:44px;
        margin:0 0 8px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        New order from <span style="color:#ff4d8d;">${order.customer_name}</span>!
      </h1>
      <p style="font-family:'Caveat',cursive;font-size:22px;color:#2a2238;opacity:0.85;margin:0;">
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
                    ${order.customer_name}</div>
                </td>
              </tr>
              ${order.customer_email ? `
              <tr>
                <td style="padding:12px 0;border-bottom:2px dashed rgba(42,34,56,0.18);">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Email</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:17px;color:#2a2238;">
                    <a href="mailto:${order.customer_email}" style="color:#2a2238;">${order.customer_email}</a></div>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding-top:12px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">
                    ${isPickup ? 'Delivery' : 'Ship to'}</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:16px;
                    line-height:1.5;color:#2a2238;">
                    ${isPickup ? 'Pickup &mdash; customer will collect in person' : order.customer_address.replace(/\n/g, '<br/>')}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${order.customer_notes ? `
  <!-- Customer note -->
  <tr>
    <td style="padding:6px 28px 4px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 22px;">
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
              text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.6;margin-bottom:6px;">
              Customer note</div>
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:15px;
              color:#2a2238;">${order.customer_notes}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

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
                        <span style="font-family:'Bagel Fat One',cursive;font-size:28px;color:#2a2238;">Total</span>
                      </td>
                      <td align="right" style="padding-top:10px;border-top:2px dashed rgba(42,34,56,0.25);">
                        <span style="font-family:'Bagel Fat One',cursive;font-size:28px;color:#2a2238;">$${total}</span>
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

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;margin-top:22px;">
      <p style="font-family:'Caveat',cursive;font-size:22px;color:#2a2238;margin:0 0 4px;">
        go pack some stickers! &#127881;
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
    if (item.kind === 'pair' || item.side === 'full') {
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
                font-family:'Bagel Fat One',Arial,sans-serif;font-size:12px;
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
            <div style="font-family:'Bagel Fat One',cursive;font-size:22px;
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
  const contact   = settings.apple_pay_contact || '';
  const firstName = order.customer_name.split(' ')[0];
  const isPickup  = order.delivery_method === 'pickup';

  const payBlock = contact ? `
  <tr>
    <td style="padding:0 22px 22px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background:#2a2238;border-radius:22px;padding:28px 24px;
            text-align:center;border:3px solid #2a2238;
            box-shadow:0 8px 0 rgba(42,34,56,0.85);">
            <div style="display:inline-block;background:#ffd23f;color:#2a2238;
              border:3px solid white;border-radius:999px;padding:4px 18px;
              margin-bottom:14px;
              font-family:'Bagel Fat One',cursive;font-size:28px;line-height:1;">$${total} total</div>
            <h3 style="font-family:'Bagel Fat One',cursive;font-size:26px;
              margin:0 0 6px;color:white;letter-spacing:-0.3px;">
              One last thing &mdash; let&rsquo;s get paid!
            </h3>
            <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
              font-size:15px;color:rgba(255,255,255,0.85);margin:0 auto 18px;
              max-width:380px;line-height:1.5;">
              Send payment via Apple Pay to finish your order. As soon as it&rsquo;s paid, ${isPickup ? 'your order will be ready for pickup' : 'your stickers go in the mail'}. Pinky promise.
            </p>
            <div style="display:inline-block;background:white;color:#2a2238;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:19px;
              padding:14px 28px;border-radius:999px;border:3px solid #2a2238;
              box-shadow:0 6px 0 #ff4d8d;letter-spacing:-0.2px;">
              &#xF8FF;&nbsp; Send $${total} &rarr; ${contact}
            </div>
            <div style="margin-top:14px;font-family:'Fredoka',Arial,sans-serif;
              font-weight:500;font-size:13px;color:rgba(255,255,255,0.65);">
              Include order #${order.id} in your payment note so we can match it up!
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : '';

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
                    <span style="font-family:'Bagel Fat One',cursive;
                      color:white;font-size:26px;line-height:1;
                      vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One',cursive;
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
      <h1 style="font-family:'Bagel Fat One',cursive;font-size:52px;
        margin:0 0 8px;line-height:0.95;letter-spacing:-1px;color:#2a2238;">
        <span style="display:inline-block;transform:rotate(-2deg);">Hooray,</span>
        <span style="display:inline-block;transform:rotate(2deg);color:#ff4d8d;">${firstName}</span>
        <span style="display:inline-block;transform:rotate(-1deg);">!</span>
      </h1>
      <p style="font-family:'Caveat',cursive;font-size:24px;
        color:#2a2238;opacity:0.85;margin:0 0 8px;">
        ${isPickup ? 'Your order is ready for pickup whenever you are! &#127881;' : 'Your stickers are picked, packed, and waiting on payment &#10024;'}
      </p>
    </td>
  </tr>

  <!-- Apple Pay block -->
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
              ${!isPickup ? `
              <tr>
                <td style="padding:8px 0 4px;border-bottom:2px dashed rgba(42,34,56,0.18);">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
                        font-size:14px;color:#6ddc8a;padding:3px 0;">&#127775; Bonus sticker</td>
                      <td align="right" style="font-family:'Fredoka',Arial,sans-serif;
                        font-weight:600;font-size:14px;color:#6ddc8a;padding:3px 0;">Free!</td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
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
                        <span style="font-family:'Bagel Fat One',cursive;
                          font-size:28px;color:#2a2238;">Total</span>
                      </td>
                      <td align="right" style="padding-top:10px;
                        border-top:2px dashed rgba(42,34,56,0.25);">
                        <span style="font-family:'Bagel Fat One',cursive;
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
              ${isPickup ? "We'll be in touch to arrange a pickup time!" : order.customer_address.replace(/\n/g, '<br/>')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${order.customer_notes ? `
  <tr>
    <td style="padding:6px 28px 4px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;
              font-size:13px;text-transform:uppercase;letter-spacing:1px;
              color:#2a2238;opacity:0.6;margin-bottom:4px;">Your note</div>
            <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;
              font-size:15px;color:#2a2238;">${order.customer_notes}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

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
                    font-family:'Bagel Fat One',cursive;font-size:20px;color:white;">1</div>
                </td>
                <td valign="top" style="padding-bottom:14px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:16px;color:#2a2238;">
                    ${contact ? `You send payment via Apple Pay &#9757;&#65039;` : `We receive your order &#9757;&#65039;`}
                  </div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">Takes 10 seconds, promise.</div>
                </td>
              </tr>
              <tr>
                <td width="54" valign="top" style="padding-right:14px;padding-bottom:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#ffd23f;border:3px solid #2a2238;text-align:center;line-height:36px;
                    font-family:'Bagel Fat One',cursive;font-size:20px;color:#2a2238;">2</div>
                </td>
                <td valign="top" style="padding-bottom:14px;">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:16px;color:#2a2238;">We pack your stickers (with a tiny doodle, free)</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">Usually within 1&ndash;2 days. Sometimes faster if it&rsquo;s snack time.</div>
                </td>
              </tr>
              <tr>
                <td width="54" valign="top" style="padding-right:14px;">
                  <div style="width:40px;height:40px;border-radius:50%;
                    background:#6ddc8a;border:3px solid #2a2238;text-align:center;line-height:36px;
                    font-family:'Bagel Fat One',cursive;font-size:20px;color:#2a2238;">3</div>
                </td>
                <td valign="top">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:16px;color:#2a2238;">
                    ${isPickup ? 'You come pick them up &middot; then stick them everywhere' : 'USPS shows up &middot; you stick them on everything'}
                  </div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:500;font-size:13px;color:#2a2238;opacity:0.7;margin-top:2px;">Laptops, lunchboxes, foreheads &mdash; we don&rsquo;t judge.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- PS -->
  <tr>
    <td style="padding:20px 32px 8px;text-align:center;">
      <p style="font-family:'Caveat',cursive;font-size:22px;color:#2a2238;opacity:0.85;margin:0;">
        Psst &mdash; questions? Just hit reply. A real human (mostly) will write back.
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat',cursive;font-size:24px;color:#2a2238;margin:0 0 4px;">
        stick &lsquo;em everywhere &#10024;<br/>
        &mdash; the Sticker Stop crew
      </p>
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop &middot; Questions? Reply to this email
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

export async function sendOrderEmail(order, settings, origin = '') {
  if (!RESEND_API_KEY) return;

  const resend = new Resend(RESEND_API_KEY);
  const from = EMAIL_FROM || 'Sticker Stop <orders@stickerstop.com>';

  async function send({ to, subject, text, html }) {
    const result = await resend.emails.send({ from, to, subject, text, html });
    if (result.error) throw new Error(result.error.message);
  }

  // Admin plain-text notification
  const recipients = (settings.notification_emails || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (recipients.length) {
    await send({
      from,
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
      settings.apple_pay_contact
        ? `\nPlease send payment via Apple Pay to: ${settings.apple_pay_contact}\nInclude order #${order.id} in your note.`
        : '',
      ``,
      `— The Sticker Stop Team`,
    ].filter(l => l !== undefined).join('\n');

    await send({
      from,
      to:      order.customer_email,
      subject: `🎉 Order #${order.id} confirmed — let's get those stickers shipped!`,
      text,
      html,
    });
  }
}
