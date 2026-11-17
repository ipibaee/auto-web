require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// aaPanel / Nginx reverse proxy support
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'autoweb-secret-key-prod-9831',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Helper to render HTML files with token replacements
function renderView(viewName, variables = {}) {
  const filePath = path.join(__dirname, 'views', viewName);
  let content = fs.readFileSync(filePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value ?? '');
  }
  return content;
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Sesi berakhir atau belum login.' });
  }
  return res.redirect('/admin/login');
}

// ==========================================
// 1. PUBLIC GATEWAY ROUTE (THE MAIN LINK)
// ==========================================
app.get('/', (req, res) => {
  const data = db.getData();
  const settings = data.settings;

  // Real IP behind aaPanel / Nginx proxy
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientIp = rawIp.split(',')[0].trim() || 'Unknown';
  const referrer = req.get('referrer') || req.get('referer') || 'Direct';
  const userAgent = req.get('user-agent') || 'Unknown';

  const metaVars = {
    metaTitle: settings.metaTitle || 'Portal Pencarian Aman',
    metaDescription: settings.metaDescription || 'Pencarian web privat dan aman.',
    metaFavicon: settings.metaFavicon || 'https://duckduckgo.com/favicon.ico'
  };

  // If redirect disabled OR mode is camouflage -> show search engine
  if (!settings.enabled || settings.mode === 'camouflage') {
    db.recordVisit({
      ip: clientIp,
      referrer,
      userAgent,
      redirected: false,
      mode: 'camouflage'
    });
    const html = renderView('camouflage.html', metaVars);
    return res.send(html);
  }

  // Target destination
  const targetUrl = settings.targetUrl || 'https://duckduckgo.com';
  const delaySec = Math.max(0, parseInt(settings.delaySeconds, 10) || 0);

  // MODE A: DuckDuckGo Hop (Direct Jump with DDG as referrer)
  if (settings.mode === 'ddg_hop') {
    db.recordVisit({
      ip: clientIp,
      referrer,
      userAgent,
      redirected: true,
      mode: 'ddg_hop'
    });

    const ddgHopUrl = `https://duckduckgo.com/?q=\\${encodeURIComponent(targetUrl)}`;

    if (delaySec === 0) {
      // Instant redirect via DDG Feeling Lucky
      return res.redirect(302, ddgHopUrl);
    } else {
      // Smooth meta-refresh jump
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="referrer" content="origin">
          <meta http-equiv="refresh" content="${delaySec};url=${ddgHopUrl}">
          <title>${metaVars.metaTitle}</title>
          <link rel="icon" href="${metaVars.metaFavicon}">
          <style>
            body { background: #1c1d22; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          </style>
        </head>
        <body>
          <div style="text-align: center;">
            <p>Mengalihkan secara aman ke DuckDuckGo...</p>
            <script>
              setTimeout(function() {
                window.location.replace(${JSON.stringify(ddgHopUrl)});
              }, ${delaySec * 1000});
            </script>
          </div>
        </body>
        </html>
      `);
    }
  }

  // MODE B: Full-Screen URL Masking (URL stays on your domain)
  if (settings.mode === 'masking') {
    db.recordVisit({
      ip: clientIp,
      referrer,
      userAgent,
      redirected: true,
      mode: 'masking'
    });

    const html = renderView('masking.html', {
      ...metaVars,
      targetUrl: targetUrl
    });
    return res.send(html);
  }

  // MODE C: DuckDuckGo Visual Bridge (Transition screen)
  if (settings.mode === 'ddg_bridge') {
    db.recordVisit({
      ip: clientIp,
      referrer,
      userAgent,
      redirected: true,
      mode: 'ddg_bridge'
    });

    const html = renderView('bridge.html', {
      ...metaVars,
      targetUrlJson: JSON.stringify(targetUrl),
      delaySeconds: delaySec || 1.5
    });
    return res.send(html);
  }

  // Default fallback to camouflage
  const html = renderView('camouflage.html', metaVars);
  return res.send(html);
});

// ==========================================
// 2. ADMIN PAGES
// ==========================================
app.get('/admin', requireAuth, (req, res) => {
  const html = renderView('admin-dashboard.html');
  res.send(html);
});

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/admin');
  }
  const html = renderView('admin-login.html');
  res.send(html);
});

// ==========================================
// 3. ADMIN API ENDPOINTS
// ==========================================
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const data = db.getData();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  if (username.trim() === data.auth.username && db.verifyPassword(password.trim())) {
    req.session.authenticated = true;
    req.session.username = data.auth.username;
    return res.json({ success: true, message: 'Login berhasil.' });
  }

  return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Berhasil logout.' });
  });
});

app.get('/api/admin/data', requireAuth, (req, res) => {
  const data = db.getData();
  res.json({
    settings: data.settings,
    stats: data.stats,
    auth: { username: data.auth.username }
  });
});

app.post('/api/admin/settings', requireAuth, (req, res) => {
  const { enabled, targetUrl, mode, delaySeconds, metaTitle, metaDescription } = req.body;

  if (targetUrl) {
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Format Target URL tidak valid. Sertakan http:// atau https://' });
    }
  }

  const validModes = ['ddg_hop', 'masking', 'ddg_bridge', 'camouflage'];
  const finalMode = validModes.includes(mode) ? mode : 'ddg_hop';

  const updated = db.updateSettings({
    enabled: Boolean(enabled),
    targetUrl: targetUrl ? targetUrl.trim() : 'https://duckduckgo.com',
    mode: finalMode,
    delaySeconds: parseInt(delaySeconds, 10) || 0,
    metaTitle: metaTitle ? metaTitle.trim() : 'Portal Pencarian Aman',
    metaDescription: metaDescription ? metaDescription.trim() : ''
  });

  res.json({ success: true, settings: updated });
});

app.post('/api/admin/auth', requireAuth, (req, res) => {
  const { username, password } = req.body;

  if (password && password.trim().length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  const result = db.updateAuth(username, password);
  if (username) {
    req.session.username = result.username;
  }

  res.json({ success: true, message: 'Akun berhasil diperbarui.' });
});

app.post('/api/admin/stats/reset', requireAuth, (req, res) => {
  const cleared = db.resetStats();
  res.json({ success: true, stats: cleared });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 Auto Web App berjalan di port ${PORT}`);
  console.log(`🌐 Link Utama: http://localhost:${PORT}/`);
  console.log(`🔐 Panel Admin: http://localhost:${PORT}/admin`);
  console.log(`===============================================`);
});
