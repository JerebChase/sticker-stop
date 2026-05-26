import nodemailer from 'nodemailer';

export async function sendOrderEmail(order, settings) {
  if (!settings.smtp_host) return;

  const transporter = nodemailer.createTransport({
    host:   settings.smtp_host,
    port:   parseInt(settings.smtp_port || '587', 10),
    secure: parseInt(settings.smtp_port || '587', 10) === 465,
    auth: { user: settings.smtp_user, pass: settings.smtp_pass },
  });

  const itemList = order.items
    .map(i => `  • ${i.name}  ×${i.qty}  $${(i.price * i.qty).toFixed(2)}`)
    .join('\n');

  const notifBody = `
New Order at Sticker Stop! (#${order.id})
────────────────────────────
Customer: ${order.customer_name}
Email:    ${order.customer_email || '(not provided)'}
Address:  ${order.customer_address}
Date:     ${new Date().toLocaleString()}

Items:
${itemList}
────────────────────────────
Subtotal: $${Number(order.subtotal ?? order.total).toFixed(2)}
Shipping: $${Number(order.shipping ?? 0).toFixed(2)}
Total:    $${Number(order.total).toFixed(2)}
${order.customer_notes ? `\nNotes: ${order.customer_notes}` : ''}
  `.trim();

  const recipients = (settings.notification_emails || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  const from = settings.smtp_from || settings.smtp_user;

  if (recipients.length) {
    await transporter.sendMail({
      from,
      to:      recipients.join(', '),
      subject: `New Sticker Stop Order #${order.id} — ${order.customer_name}`,
      text:    notifBody,
    });
  }

  if (order.customer_email) {
    await transporter.sendMail({
      from,
      to:      order.customer_email,
      subject: 'Your Sticker Stop Order is Confirmed!',
      text:    `Hi ${order.customer_name}!\n\nThanks so much for your order! We're so excited to get your stickers to you.\n\nOrder Summary:\n${itemList}\n\nTotal: $${Number(order.total).toFixed(2)}\n\nWe'll be in touch soon!\n\n— The Sticker Stop Team`,
    });
  }
}
