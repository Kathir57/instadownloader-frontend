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

/* ── Render Result ── */
function displayResult(data) {
  const resultSection = $('#result-section');
  if (!resultSection) return;

  // Build download buttons per media item
  const formats = data.formats || [];
  const title = data.title || 'Instagram Media';
  const thumb = data.thumbnail || '';

  let buttonsHTML = '';
  if (formats.length > 0) {
    buttonsHTML = formats.map((f, i) => {
      return `<a class="dl-btn" href="${f.url}" target="_blank" download>
              ⬇ Download ${f.quality || (i + 1)} ${f.ext ? f.ext.toUpperCase() : 'MP4'}
            </a>`;
    }).join('');
  } else if (data.url) {
    buttonsHTML = `<a class="dl-btn" href="${data.url}" target="_blank" download>⬇ Download</a>`;
  }

  resultSection.innerHTML = `
    <div class="result-card floating-card">
      <div class="result-header">
        ${thumb ? `<img class="result-thumb" src="${thumb}" alt="Thumbnail" onerror="this.style.display='none'">` : ''}
        <div class="result-meta">
          <p class="result-title">${title}</p>
          <button class="copy-btn" onclick="copyURL()">📋 Copy URL</button>
        </div>
      </div>
      <div class="result-downloads">
        <p class="dl-label">Select format to download:</p>
        <div class="dl-buttons">${buttonsHTML || '<p class="no-media">No downloadable media found.</p>'}</div>
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
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleDownload();
    });
  }
});
