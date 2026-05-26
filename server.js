require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── JSON File Database ───────────────────────────────────────────────────────
// Simple, zero-setup database stored as a JSON file. Perfect for a small shop.

const DB_PATH = path.join(__dirname, 'data.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      orders: [],
      nextOrderId: 1,
      settings: {
        notification_emails: process.env.NOTIFICATION_EMAILS || 'chase208@4jlt.com',
        admin_password:      process.env.ADMIN_PASSWORD      || 'stickerstop2024',
        smtp_host:           process.env.SMTP_HOST            || '',
        smtp_port:           process.env.SMTP_PORT            || '587',
        smtp_user:           process.env.SMTP_USER            || '',
        smtp_pass:           process.env.SMTP_PASS            || '',
        smtp_from:           process.env.SMTP_FROM            || '',
      },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── Product Catalogue ─────────────────────────────────────────────────────────
const products = [
  {
    id: 'space',
    name: 'Space Exploration',
    emoji: '🚀',
    tagline: 'Blast off with NASA & SpaceX!',
    description: 'Two sheets packed with rockets, astronauts, planets, the ISS, Mars rovers, SpaceX & Blue Origin! Perfect for any little astronaut.',
    color: '#1a237e',
    accent: '#ffd54f',
    sheets: [
      {
        id: 'space-a',
        name: 'Sheet A – NASA Classics',
        description: 'Space Shuttle, ISS, astronauts, Earth view from space, Hubble telescope, and more.',
        image: 'images/space-sheet-a.jpg',
        price: 2,
      },
      {
        id: 'space-b',
        name: 'Sheet B – Modern Space',
        description: 'SpaceX Starship, Blue Origin, James Webb telescope, Mars rovers, and cutting-edge missions.',
        image: 'images/space-sheet-b.jpg',
        price: 2,
      },
    ],
    setPrice: 3,
  },
  {
    id: 'cookie-mouse',
    name: 'If You Give a Mouse a Cookie',
    emoji: '🍪',
    tagline: "Everyone's favourite hungry mouse!",
    description: "Featuring the beloved characters from Laura Numeroff's classic stories! Mice, cats, dogs, cookies, cupcakes, donuts, and more tasty treats.",
    color: '#2e7d32',
    accent: '#ffcc80',
    sheets: [
      {
        id: 'cookie-mouse-a',
        name: 'Sheet A – Cozy Kitchen',
        description: 'Mouse, black cat, white dog, moose, cookies, cupcakes, donuts, and pancakes.',
        image: 'images/cookie-mouse-sheet-a.jpg',
        price: 2,
      },
      {
        id: 'cookie-mouse-b',
        name: 'Sheet B – More Adventures',
        description: 'More beloved characters in action — karate, hiking, crafts, and lots more cookies!',
        image: 'images/cookie-mouse-sheet-b.jpg',
        price: 2,
      },
    ],
    setPrice: 3,
  },
  {
    id: 'cute-animals',
    name: 'Cute Animals & Flowers',
    emoji: '🦝',
    tagline: 'Adorable clay-style critters!',
    description: '3D clay-style animals and gorgeous flowers — snow leopards, red pandas, raccoons, flamingos, axolotls, horses, and beautiful blooms.',
    color: '#6a1b9a',
    accent: '#f8bbd0',
    sheets: [
      {
        id: 'cute-animals-a',
        name: 'Sheet A – Forest Friends',
        description: 'Snow leopard, owl, red panda, raccoon, robin, skunk, horse, and sunflower bouquets.',
        image: 'images/cute-animals-sheet-a.jpg',
        price: 2,
      },
      {
        id: 'cute-animals-b',
        name: 'Sheet B – Beach Buddies',
        description: 'Flamingo, chickadee, axolotl, puppy, penguin, cat with yarn, lion cub, and flower arrangements.',
        image: 'images/cute-animals-sheet-b.jpg',
        price: 2,
      },
    ],
    setPrice: 3,
  },
  {
    id: 'alien-adventure',
    name: 'Alien Adventure',
    emoji: '👾',
    tagline: 'Out-of-this-world characters!',
    description: 'Wild alien creatures, robots, bizarre sheep, UFOs, cosmic weapons, and mysterious artefacts — straight from another dimension!',
    color: '#1b5e20',
    accent: '#b2dfdb',
    sheets: [
      {
        id: 'alien-adventure-a',
        name: 'Sheet A – First Contact',
        description: 'Classic aliens, tin robots, fluffy alien sheep, crop circles, and mysterious tech.',
        image: 'images/alien-adventure-sheet-a.jpg',
        price: 2,
      },
      {
        id: 'alien-adventure-b',
        name: 'Sheet B – Invasion!',
        description: 'Super aliens with powers, black sheep, lobster creatures, ice weapons, and more chaos.',
        image: 'images/alien-adventure-sheet-b.jpg',
        price: 2,
      },
    ],
    setPrice: 3,
  },
  {
    id: 'kingdom-quest',
    name: 'Kingdom Quest',
    emoji: '🏰',
    tagline: 'Kings, queens & brave knights!',
    description: 'Two kingdoms collide! Colourful heroes face off against the dark villain court in this epic medieval sticker adventure.',
    color: '#4a148c',
    accent: '#ffe082',
    sheets: [
      {
        id: 'kingdom-quest-a',
        name: 'Sheet A – Heroes of Light',
        description: 'Bright kingdom characters — kings, queens, knights, and wizards in colourful armour.',
        image: 'images/kingdom-quest-sheet-a.jpg',
        price: 2,
      },
      {
        id: 'kingdom-quest-b',
        name: 'Sheet B – Shadow Court',
        description: 'The mysterious villain court in dramatic dark colours — still just as epic!',
        image: 'images/kingdom-quest-sheet-b.jpg',
        price: 2,
      },
    ],
    setPrice: 3,
  },
];

// ─── Helper: send order email ─────────────────────────────────────────────────
async function sendOrderEmail(order) {
  const db = readDB();
  const s  = db.settings;
  if (!s.smtp_host) return; // Email not configured — skip silently

  const transporter = nodemailer.createTransport({
    host:   s.smtp_host,
    port:   parseInt(s.smtp_port || '587', 10),
    secure: parseInt(s.smtp_port || '587', 10) === 465,
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  });

  const itemList = order.items
    .map(i => `  • ${i.name}  ×${i.qty}  $${(i.price * i.qty).toFixed(2)}`)
    .join('\n');

  const notifBody = `
🎉 New Order at Sticker Stop! (#${order.id})
━━━━━━━━━━━━━━━━━━━━━━━━
Customer:  ${order.customerName}
Email:     ${order.customerEmail || '(not provided)'}
Address:   ${order.customer_address || order.customerAddress || ''}
Date:      ${new Date().toLocaleString()}

Items:
${itemList}
━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: $${(order.subtotal ?? order.total).toFixed(2)}
Shipping: $${(order.shipping ?? 0).toFixed(2)}
Total:    $${order.total.toFixed(2)}
${order.customer_notes ? `\nNotes: ${order.customer_notes}` : ''}
Manage orders: http://localhost:${process.env.PORT || 3000}/admin.html
  `.trim();

  const recipients = (s.notification_emails || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  const fromAddr = s.smtp_from || s.smtp_user;

  // Notify shop owner(s)
  if (recipients.length) {
    await transporter.sendMail({
      from:    fromAddr,
      to:      recipients.join(', '),
      subject: `🌟 New Sticker Stop Order #${order.id} — ${order.customerName}`,
      text:    notifBody,
    });
  }

  // Confirm to customer (only if email was provided)
  if (order.customerEmail) {
    await transporter.sendMail({
      from:    fromAddr,
      to:      order.customerEmail,
      subject: '🎉 Your Sticker Stop Order is Confirmed!',
      text:    `Hi ${order.customerName}!\n\nThanks so much for your order! We're so excited to get your stickers to you.\n\nOrder Summary:\n${itemList}\n\nTotal: $${order.total.toFixed(2)}\n\nWe'll be in touch soon!\n\n— The Sticker Stop Team`,
    });
  }
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
function requireAdmin(req, res) {
  const pw = req.headers['x-admin-password'] || req.query.password;
  const stored = readDB().settings.admin_password;
  if (!pw || pw !== stored) {
    res.status(401).json({ error: 'Unauthorized.' });
    return false;
  }
  return true;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Products
app.get('/api/products', (_req, res) => res.json(products));

// Place an order
app.post('/api/orders', async (req, res) => {
  const { customerName, customerEmail, customerAddress, customerNotes, items, subtotal, shipping, total } = req.body;
  if (!customerName || !customerAddress || !items?.length || total == null) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const db = readDB();
  const order = {
    id:               db.nextOrderId++,
    customer_name:    customerName.trim(),
    customer_email:   customerEmail ? customerEmail.trim() : '',
    customer_address: customerAddress.trim(),
    customer_notes:   customerNotes ? customerNotes.trim() : '',
    items,
    subtotal: subtotal ?? total,
    shipping: shipping ?? 0,
    total,
    status:        'new',
    notes:         '',
    created_at:    new Date().toISOString(),
  };
  db.orders.unshift(order); // newest first
  writeDB(db);

  try {
    await sendOrderEmail({ ...order, customerName, customerEmail });
  } catch (err) {
    console.warn('⚠️  Email send failed (order still saved):', err.message);
  }

  res.json({ success: true, orderId: order.id });
});

// Admin: list orders
app.get('/api/admin/orders', (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(readDB().orders);
});

// Admin: update order status / notes
app.patch('/api/admin/orders/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = readDB();
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Not found.' });
  if (req.body.status !== undefined) order.status = req.body.status;
  if (req.body.notes  !== undefined) order.notes  = req.body.notes;
  writeDB(db);
  res.json({ success: true });
});

// Admin: get settings (passwords redacted)
app.get('/api/admin/settings', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const s = { ...readDB().settings };
  delete s.admin_password;
  delete s.smtp_pass;
  res.json(s);
});

// Admin: update settings
app.put('/api/admin/settings', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const allowed = ['notification_emails','admin_password','smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from'];
  const db = readDB();
  for (const key of allowed) {
    if (req.body[key] !== undefined && req.body[key] !== '') {
      db.settings[key] = req.body[key];
    }
  }
  writeDB(db);
  res.json({ success: true });
});

// Admin: verify password
app.post('/api/admin/auth', (req, res) => {
  const stored = readDB().settings.admin_password;
  res.json({ ok: req.body.password === stored });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌟 Sticker Stop is running!`);
  console.log(`   Shop:  http://localhost:${PORT}`);
  console.log(`   Admin: http://localhost:${PORT}/admin.html`);
  console.log(`   (Default admin password: stickerstop2024)\n`);
});
