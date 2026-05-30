/* =========================================
   MAIN.JS — InstaGet Core Logic
   Pure vanilla JS, no jQuery, no frameworks
   ========================================= */

const API = 'https://instadownloader-proxy.godofgamer678.workers.dev/api/info';

/* ── Utility ── */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* ── URL Validation ── */
function validateInstagramURL(url) {
  return /instagram\.com\/(p|reel|reels|stories|tv|s)\//i.test(url) ||
    /instagram\.com\/[a-zA-Z0-9._]+\/?$/.test(url);
}

/* ── Loading State ── */
function showLoading() {
  const spinner = $('#loading-spinner');
  if (spinner) spinner.classList.remove('hidden');
  const btn = $('#download-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Fetching…'; }
}

function hideLoading() {
  const spinner = $('#loading-spinner');
  if (spinner) spinner.classList.add('hidden');
  const btn = $('#download-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Download'; }
}

/* ── Toast Notifications ── */
function showError(msg) {
  showToast(msg, 'error');
}

function showSuccess(msg) {
  showToast(msg, 'success');
}

function showToast(msg, type = 'error') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'error' ? '⚠️' : '✅'}</span><span>${msg}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function createToastContainer() {
  const el = document.createElement('div');
  el.id = 'toast-container';
  document.body.appendChild(el);
  return el;
}

/* ── API Fetch ── */
async function fetchMediaInfo(url) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

/* ── Direct File Download ── */
async function downloadFile(url, filename, btnEl) {
  const btn = btnEl || document.querySelector('.dl-btn-main');
  const origText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '⏳ Saving…'; btn.disabled = true; }

  try {
    // Try blob fetch for true same-tab save
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('cors');
    const blob = await res.blob();
    const ext = blob.type.includes('video') ? 'mp4'
               : blob.type.includes('jpeg') ? 'jpg'
               : blob.type.includes('png')  ? 'png' : 'mp4';
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename || `instaget.${ext}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    showSuccess('✅ Download saved!');
  } catch {
    // Fallback: direct anchor — browser will download or prompt save
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'instaget_download.mp4';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showSuccess('⬇ Download started!');
  } finally {
    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
  }
}

/* ── Render Result ── */
function displayResult(data) {
  const resultSection = $('#result-section');
  if (!resultSection) return;

  const formats     = data.formats || [];
  const title       = data.title || 'Instagram Media';
  const thumb       = data.thumbnail || '';
  const contentType = data.contentType || 'media';
  const uploader    = data.uploader || '';

  // Group by type
  const videos = formats.filter(f => f.type === 'video');
  const audios = formats.filter(f => f.type === 'audio');
  const images = formats.filter(f => f.type === 'image');

  let buttonsHTML = '';

  if (videos.length > 0) {
    buttonsHTML += `<p class="dl-label">🎬 Video</p>`;
    buttonsHTML += videos.map(f =>
      `<a class="dl-btn" href="${f.url}" target="_blank" download>
        ⬇ Download ${f.quality} MP4
      </a>`
    ).join('');
  }

  if (audios.length > 0) {
    buttonsHTML += `<p class="dl-label">🎵 Audio Only</p>`;
    buttonsHTML += audios.map(f =>
      `<a class="dl-btn dl-btn--audio" href="${f.url}" target="_blank" download>
        ⬇ Download Audio ${f.quality}
      </a>`
    ).join('');
  }

  if (images.length > 0) {
    buttonsHTML += `<p class="dl-label">🖼️ Images</p>`;
    buttonsHTML += images.map((f, i) =>
      `<a class="dl-btn dl-btn--image" href="${f.url}" target="_blank" download>
        ⬇ Download Image ${i + 1} (${f.quality})
      </a>`
    ).join('');
  }

  // Fallback: no typed formats — use raw formats or data.url
  if (!buttonsHTML) {
    if (formats.length > 0) {
      buttonsHTML += `<p class="dl-label">⬇ Download</p>`;
      buttonsHTML += formats.map((f, i) =>
        `<a class="dl-btn" href="${f.url}" target="_blank" download>
          ⬇ Download ${f.quality || (i + 1)} ${f.ext ? f.ext.toUpperCase() : 'MP4'}
        </a>`
      ).join('');
    } else if (data.url) {
      buttonsHTML = `<a class="dl-btn" href="${data.url}" target="_blank" download>⬇ Download</a>`;
    } else {
      buttonsHTML = '<p class="no-media">No downloadable media found.</p>';
    }
  }

  const typeLabels = {
    reel:  '🎬 Reel',
    post:  '📸 Post',
    story: '⏱ Story',
    igtv:  '📺 IGTV',
    media: '📱 Media'
  };

  resultSection.innerHTML = `
    <div class="result-card">
      ${thumb ? `<img class="result-thumb" src="${thumb}" alt="Thumbnail" onerror="this.style.display='none'">` : ''}
      <div class="result-meta">
        <span class="content-type-badge">${typeLabels[contentType] || contentType}</span>
        <p class="result-title">${title}</p>
        ${uploader ? `<p class="result-uploader">by @${uploader}</p>` : ''}
        <button class="copy-btn" onclick="copyURL()">📋 Copy URL</button>
      </div>
      <div class="result-downloads">
        <div class="dl-buttons">${buttonsHTML}</div>
      </div>
    </div>`;

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ── Copy URL ── */
function copyURL() {
  const urlInput = $('#url-input');
  if (!urlInput) return;
  navigator.clipboard.writeText(urlInput.value)
    .then(() => showSuccess('URL copied!'))
    .catch(() => showError('Could not copy URL.'));
}

/* ── Main Download Handler ── */
async function handleDownload() {
  const urlInput = $('#url-input');
  if (!urlInput) return;
  const url = urlInput.value.trim();

  if (!url) { showError('Please paste an Instagram URL.'); return; }
  if (!validateInstagramURL(url)) { showError('Invalid URL. Must contain instagram.com'); return; }

  const resultSection = $('#result-section');
  if (resultSection) resultSection.classList.add('hidden');

  showLoading();
  try {
    const data = await fetchMediaInfo(url);
    displayResult(data);
  } catch (err) {
    showError(err.message || 'Failed to fetch media. Try again.');
  } finally {
    hideLoading();
  }
}

/* ── Tab Switching ── */
function initTabs() {
  const tabs = $$('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const urlInput = $('#url-input');
      if (urlInput) {
        const placeholders = {
          reels: 'Paste Instagram Reel URL…',
          posts: 'Paste Instagram Post URL…',
          stories: 'Paste Instagram Story URL…',
          profile: 'Paste Instagram Profile URL…',
        };
        urlInput.placeholder = placeholders[tab.dataset.tab] || 'Paste Instagram URL…';
      }
    });
  });
}

/* ── Scroll Float-In ── */
function initScrollReveal() {
  const els = $$('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

/* ── Mobile Nav ── */
function initMobileNav() {
  const toggle = $('#nav-toggle');
  const menu = $('#nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    toggle.classList.toggle('open');
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initScrollReveal();
  initMobileNav();

  const btn = $('#download-btn');
  if (btn) btn.addEventListener('click', handleDownload);

  const urlInput = $('#url-input');
  if (urlInput) {
    // Auto-fetch when Enter pressed
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleDownload();
    });

    // Auto-fetch immediately on paste — no button click needed
    urlInput.addEventListener('paste', e => {
      // Let the paste populate the field first
      setTimeout(() => {
        const pasted = urlInput.value.trim();
        if (pasted && validateInstagramURL(pasted)) {
          handleDownload();
        }
      }, 80);
    });

    // Also auto-fetch if user types/fills a full valid URL (e.g. from browser autofill)
    urlInput.addEventListener('input', () => {
      clearTimeout(urlInput._autoTimer);
      urlInput._autoTimer = setTimeout(() => {
        const val = urlInput.value.trim();
        if (val.length > 20 && validateInstagramURL(val)) {
          handleDownload();
        }
      }, 900);
    });
  }
});
