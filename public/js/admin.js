// Admin Dashboard Client Script

const mainUrlText = document.getElementById('mainUrlText');
const btnCopyMainUrl = document.getElementById('btnCopyMainUrl');
const btnLogout = document.getElementById('btnLogout');
const toast = document.getElementById('toast');

const badgeActiveStatus = document.getElementById('badgeActiveStatus');
const badgeCurrentMode = document.getElementById('badgeCurrentMode');

const statTotalVisits = document.getElementById('statTotalVisits');
const statTotalRedirects = document.getElementById('statTotalRedirects');
const statActiveModeName = document.getElementById('statActiveModeName');
const statLastVisited = document.getElementById('statLastVisited');

const settingsForm = document.getElementById('settingsForm');
const fieldEnabled = document.getElementById('fieldEnabled');
const labelToggleStatus = document.getElementById('labelToggleStatus');
const fieldTargetUrl = document.getElementById('fieldTargetUrl');
const fieldDelaySeconds = document.getElementById('fieldDelaySeconds');
const fieldMetaTitle = document.getElementById('fieldMetaTitle');
const fieldMetaDescription = document.getElementById('fieldMetaDescription');
const btnSaveSettings = document.getElementById('btnSaveSettings');

const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const btnUpdateAuth = document.getElementById('btnUpdateAuth');

const logsTableBody = document.getElementById('logsTableBody');
const btnResetStats = document.getElementById('btnResetStats');

const MODE_LABELS = {
  ddg_hop: '🦆 DuckDuckGo Hop',
  masking: '🛡️ URL Masking (Stealth)',
  ddg_bridge: '⏳ DDG Bridge (Visual)',
  camouflage: '🎭 Camouflage (Penyamaran)'
};

function showToast(message, type = 'success') {
  toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 transition-all duration-300 ' +
    (type === 'success' 
      ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
      : 'bg-rose-500 text-white shadow-rose-500/20');
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// Copy main link to clipboard
btnCopyMainUrl.addEventListener('click', () => {
  const url = window.location.origin + '/';
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link utama berhasil disalin ke clipboard!');
  }).catch(() => {
    showToast('Gagal menyalin link.', 'error');
  });
});

// Update toggle label & mode cards styling
fieldEnabled.addEventListener('change', () => {
  labelToggleStatus.textContent = fieldEnabled.checked ? 'Aktif' : 'Nonaktif';
  labelToggleStatus.className = fieldEnabled.checked 
    ? 'ml-2.5 text-xs font-bold text-emerald-400' 
    : 'ml-2.5 text-xs font-bold text-slate-500';
});

// Fetch all dashboard data
async function loadData() {
  try {
    const res = await fetch('/api/admin/data');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    renderDashboard(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    showToast('Gagal memuat data dari server.', 'error');
  }
}

function renderDashboard(data) {
  const { settings, stats, auth } = data;

  // Set Main URL Display
  mainUrlText.textContent = window.location.origin + '/';

  // Stats
  statTotalVisits.textContent = stats.totalVisits.toLocaleString();
  statTotalRedirects.textContent = stats.totalRedirects.toLocaleString();
  statActiveModeName.textContent = MODE_LABELS[settings.mode] || settings.mode;

  if (stats.lastVisited) {
    const d = new Date(stats.lastVisited);
    statLastVisited.textContent = d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  } else {
    statLastVisited.textContent = 'Belum ada kunjungan';
  }

  // Badges
  if (settings.enabled) {
    badgeActiveStatus.className = 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    badgeActiveStatus.textContent = '● Redirect Aktif';
  } else {
    badgeActiveStatus.className = 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700';
    badgeActiveStatus.textContent = '○ Redirect Nonaktif';
  }

  badgeCurrentMode.textContent = 'Mode: ' + (MODE_LABELS[settings.mode] || settings.mode);

  // Form Fields
  fieldEnabled.checked = Boolean(settings.enabled);
  labelToggleStatus.textContent = settings.enabled ? 'Aktif' : 'Nonaktif';
  labelToggleStatus.className = settings.enabled 
    ? 'ml-2.5 text-xs font-bold text-emerald-400' 
    : 'ml-2.5 text-xs font-bold text-slate-500';

  fieldTargetUrl.value = settings.targetUrl || '';
  fieldDelaySeconds.value = String(settings.delaySeconds || 0);
  fieldMetaTitle.value = settings.metaTitle || '';
  fieldMetaDescription.value = settings.metaDescription || '';

  // Radio button for mode
  const modeRadios = document.querySelectorAll('input[name="redirectMode"]');
  modeRadios.forEach(radio => {
    radio.checked = (radio.value === settings.mode);
    const card = radio.closest('.mode-card');
    if (radio.checked && card) {
      card.classList.add('border-orange-500', 'bg-orange-500/5');
      card.classList.remove('border-slate-800');
    } else if (card) {
      card.classList.remove('border-orange-500', 'bg-orange-500/5');
      card.classList.add('border-slate-800');
    }

    radio.addEventListener('change', () => {
      document.querySelectorAll('.mode-card').forEach(c => {
        c.classList.remove('border-orange-500', 'bg-orange-500/5');
        c.classList.add('border-slate-800');
      });
      if (radio.checked && card) {
        card.classList.add('border-orange-500', 'bg-orange-500/5');
        card.classList.remove('border-slate-800');
      }
    });
  });

  // Render logs
  renderLogs(stats.recentLogs || []);
}

function renderLogs(logs) {
  if (!logs || logs.length === 0) {
    logsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-6 text-center text-slate-500">
          Belum ada riwayat kunjungan pengunjung. Bagikan link utama Anda untuk mulai mengarahkan.
        </td>
      </tr>
    `;
    return;
  }

  logsTableBody.innerHTML = logs.map(log => {
    const date = new Date(log.timestamp);
    const dateStr = date.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' });
    const statusBadge = log.redirected
      ? `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Redirect Sukses</span>`
      : `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Camouflage / Off</span>`;

    return `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">${dateStr}</td>
        <td class="py-3 px-4 font-mono text-slate-300">${escapeHtml(log.ip)}</td>
        <td class="py-3 px-4 text-slate-400 max-w-[180px] truncate" title="${escapeHtml(log.referrer)}">${escapeHtml(log.referrer)}</td>
        <td class="py-3 px-4 text-slate-300 font-semibold">${MODE_LABELS[log.mode] || log.mode}</td>
        <td class="py-3 px-4">${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Handle Save Settings
settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnSaveSettings.disabled = true;
  btnSaveSettings.innerHTML = 'Menyimpan...';

  const selectedMode = document.querySelector('input[name="redirectMode"]:checked')?.value || 'ddg_hop';

  const payload = {
    enabled: fieldEnabled.checked,
    targetUrl: fieldTargetUrl.value.trim(),
    mode: selectedMode,
    delaySeconds: parseInt(fieldDelaySeconds.value, 10) || 0,
    metaTitle: fieldMetaTitle.value.trim(),
    metaDescription: fieldMetaDescription.value.trim()
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Konfigurasi berhasil disimpan & aktif seketika!');
      loadData();
    } else {
      showToast(data.error || 'Gagal menyimpan konfigurasi.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan koneksi server.', 'error');
  } finally {
    btnSaveSettings.disabled = false;
    btnSaveSettings.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Simpan Perubahan</span>
    `;
  }
});

// Handle Auth Form
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnUpdateAuth.disabled = true;
  btnUpdateAuth.textContent = 'Mengupdate...';

  const newUsername = authUsername.value.trim();
  const newPassword = authPassword.value.trim();

  if (!newUsername && !newPassword) {
    showToast('Isi username atau password baru.', 'error');
    btnUpdateAuth.disabled = false;
    btnUpdateAuth.textContent = 'Update Akun';
    return;
  }

  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Akun berhasil diupdate! Harap ingat kredensial baru Anda.');
      authPassword.value = '';
    } else {
      showToast(data.error || 'Gagal update akun.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan server.', 'error');
  } finally {
    btnUpdateAuth.disabled = false;
    btnUpdateAuth.textContent = 'Update Akun';
  }
});

// Handle Reset Stats
btnResetStats.addEventListener('click', async () => {
  if (!confirm('Yakin ingin mereset seluruh hitungan statistik dan riwayat kunjungan?')) {
    return;
  }

  try {
    const res = await fetch('/api/admin/stats/reset', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Statistik kunjungan telah direset ke 0.');
      loadData();
    }
  } catch (err) {
    showToast('Gagal mereset statistik.', 'error');
  }
});

// Handle Logout
btnLogout.addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  } catch (err) {
    window.location.href = '/admin/login';
  }
});

// Initial Load & Auto refresh stats every 30s
loadData();
setInterval(loadData, 30000);
