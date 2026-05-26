# 🌟 Sticker Stop

Your personal sticker shop!

---

## Quick Start

**You'll need Node.js installed.** Download it free from [nodejs.org](https://nodejs.org) if you don't have it.

### 1. Install dependencies

Open a terminal in this folder and run:
```
npm install
```

### 2. Configure (optional but recommended)

Copy `.env.example` to `.env`:
```
cp .env.example .env
```
Then open `.env` and:
- Change `ADMIN_PASSWORD` to something only you know
- Add your email settings if you want order email notifications

### 3. Add your sticker images

Drop your sticker sheet images into `public/images/` following the naming guide in `public/images/README.txt`.

### 4. Start the shop

```
npm start
```

Then open your browser to **http://localhost:3000** 🎉

---

## Pages

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Customer shop |
| `http://localhost:3000/admin.html` | Admin order dashboard |

**Default admin password:** `stickerstop2024` — change it in Settings once you log in!

---

## Email Setup (Gmail)

1. Enable 2-Step Verification on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and create an App Password
3. In the Admin panel → Settings, enter:
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - Username: your Gmail address
   - Password: the App Password from step 2
   - From: `Sticker Stop <you@gmail.com>`
4. Save — orders will now trigger emails to all your notification addresses!

---

## Making it public

To let customers access the shop from the internet, you can:

- **Ngrok** (easiest): Run `npx ngrok http 3000` to get a public URL in seconds
- **Railway / Render**: Free hosting — just push the folder to GitHub and deploy
- **VPS**: Upload the folder and run with a process manager like `pm2`

---

## File Structure

```
sticker-stop/
  server.js          ← Backend (Express + SQLite + email)
  package.json
  .env.example       ← Copy to .env and fill in
  orders.db          ← Created automatically when first order is placed
  public/
    index.html       ← The customer shop
    admin.html       ← Order management dashboard
    images/          ← Put your sticker sheet images here
      README.txt     ← Image naming guide
```
