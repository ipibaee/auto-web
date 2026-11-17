const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'settings.json');

// Default initial database structure
const DEFAULT_DATA = {
  auth: {
    username: 'admin',
    passwordHash: '$2b$10$Z2YyrxNNv6X/fh6dvNW7Hup6mm7YKFY9dvIq6.9MDUb0PQcvAUAHu' // "admin123"
  },
  settings: {
    enabled: true,
    mode: 'ddg_hop', // 'ddg_hop' | 'masking' | 'ddg_bridge' | 'camouflage'
    targetUrl: 'https://duckduckgo.com',
    delaySeconds: 0,
    metaTitle: 'Portal Pencarian Aman',
    metaDescription: 'Layanan pencarian cepat, privat, dan aman tanpa pelacakan.',
    metaFavicon: 'https://duckduckgo.com/favicon.ico'
  },
  stats: {
    totalVisits: 0,
    totalRedirects: 0,
    lastVisited: null,
    recentLogs: []
  }
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  }
}

function getData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      auth: { ...DEFAULT_DATA.auth, ...(parsed.auth || {}) },
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
      stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) }
    };
  } catch (err) {
    console.error('Error reading settings.json, recreating defaults:', err);
    saveData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  ensureDataFile();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

function updateSettings(newSettings) {
  const data = getData();
  data.settings = {
    ...data.settings,
    ...newSettings
  };
  // Ensure delaySeconds is a valid integer
  data.settings.delaySeconds = parseInt(data.settings.delaySeconds, 10) || 0;
  saveData(data);
  return data.settings;
}

function updateAuth(newUsername, newPassword) {
  const data = getData();
  if (newUsername && newUsername.trim()) {
    data.auth.username = newUsername.trim();
  }
  if (newPassword && newPassword.trim()) {
    data.auth.passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
  }
  saveData(data);
  return { username: data.auth.username };
}

function verifyPassword(password) {
  const data = getData();
  if (!data.auth || !data.auth.passwordHash) return false;
  return bcrypt.compareSync(password, data.auth.passwordHash);
}

function recordVisit({ ip, referrer, userAgent, redirected, mode }) {
  const data = getData();
  const now = new Date().toISOString();
  
  data.stats.totalVisits += 1;
  if (redirected) {
    data.stats.totalRedirects += 1;
  }
  data.stats.lastVisited = now;

  const logEntry = {
    timestamp: now,
    ip: ip || 'Unknown',
    referrer: referrer || 'Direct / None',
    userAgent: userAgent ? userAgent.substring(0, 100) : 'Unknown',
    redirected: Boolean(redirected),
    mode: mode || data.settings.mode
  };

  // Keep latest 25 logs
  data.stats.recentLogs = [logEntry, ...(data.stats.recentLogs || [])].slice(0, 25);
  saveData(data);
}

function resetStats() {
  const data = getData();
  data.stats = {
    totalVisits: 0,
    totalRedirects: 0,
    lastVisited: null,
    recentLogs: []
  };
  saveData(data);
  return data.stats;
}

module.exports = {
  getData,
  updateSettings,
  updateAuth,
  verifyPassword,
  recordVisit,
  resetStats
};
