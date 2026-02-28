/* ═══════════════════════════════════════════════════════════════════════════
   Prayer Journal 2026 — Client Application
   ═══════════════════════════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────────────────────────────
let currentPerson = null;

// Persist the user's name between visits
const AUTHOR_KEY = 'pj2026_author';
let savedName = localStorage.getItem(AUTHOR_KEY) || '';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const viewHome    = document.getElementById('view-home');
const viewPerson  = document.getElementById('view-person');
const peopleGrid  = document.getElementById('people-grid');
const navPeople   = document.getElementById('nav-people');
const backBtn     = document.getElementById('back-btn');
const prayerForm  = document.getElementById('prayer-form');
const authorInput = document.getElementById('author-name');
const contentTa   = document.getElementById('prayer-content');
const charCount   = document.getElementById('char-count');
const submitBtn   = document.getElementById('submit-btn');

// ── Boot ─────────────────────────────────────────────────────────────────────
async function init() {
  buildStarfield();

  if (savedName) authorInput.value = savedName;

  // Character counter
  contentTa.addEventListener('input', () => {
    charCount.textContent = `${contentTa.value.length} / 3000`;
  });

  await loadHome();

  // Fade out splash
  const splash = document.getElementById('splash');
  splash.classList.add('fade-out');
  setTimeout(() => splash.remove(), 520);
}

// ── Starfield ─────────────────────────────────────────────────────────────────
function buildStarfield() {
  const sf = document.getElementById('starfield');
  for (let i = 0; i < 160; i++) {
    const s  = document.createElement('div');
    const sz = Math.random() * 2.4 + 0.4;
    s.className = 'star';
    s.style.cssText = [
      `left:${Math.random()*100}%`,
      `top:${Math.random()*100}%`,
      `width:${sz}px`,
      `height:${sz}px`,
      `--dur:${(Math.random()*4+2).toFixed(1)}s`,
      `--op:${(Math.random()*0.55+0.08).toFixed(2)}`,
      `animation-delay:${(Math.random()*6).toFixed(1)}s`,
    ].join(';');
    sf.appendChild(s);
  }
}

// ── Load Home ─────────────────────────────────────────────────────────────────
async function loadHome() {
  peopleGrid.innerHTML = '<p style="color:var(--text-dim);font-family:\'EB Garamond\',serif;font-style:italic;text-align:center;padding:3rem;animation:fade-pulse 1.5s infinite">Loading prayer family…</p>';

  const people = await api('/api/people');

  // Build nav quick-links
  navPeople.innerHTML = people
    .map(p => `<button class="nav-btn" onclick="openPerson('${esc(p.name)}')">${esc(p.name)}</button>`)
    .join('');

  // Build cards
  peopleGrid.innerHTML = people.map((p, i) => `
    <div class="person-card"
         style="animation-delay:${(i * 0.045).toFixed(2)}s"
         onclick="openPerson('${esc(p.name)}')"
         role="button"
         tabindex="0"
         aria-label="View prayers for ${esc(p.name)}">
      <div class="card-ref">${esc(p.reference)}</div>
      <div class="card-name">${esc(p.name)}</div>
      <p class="card-scripture">${esc(p.scripture)}</p>
      <div class="card-footer">
        <span class="prayer-count">
          <span class="pc-cross" aria-hidden="true">✝</span>
          ${p.prayerCount} ${p.prayerCount === 1 ? 'prayer' : 'prayers'}
        </span>
        <button
          class="view-btn"
          onclick="event.stopPropagation();openPerson('${esc(p.name)}')"
          aria-label="View prayers for ${esc(p.name)}">
          View Prayers →
        </button>
      </div>
    </div>
  `).join('');

  // Keyboard nav for cards
  document.querySelectorAll('.person-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') card.click();
    });
  });
}

// ── Open Person ───────────────────────────────────────────────────────────────
async function openPerson(name) {
  currentPerson = name;

  const people = await api('/api/people');
  const person = people.find(p => p.name === name);
  if (!person) return;

  // Populate detail header
  document.getElementById('detail-name').textContent      = name;
  document.getElementById('detail-scripture').textContent = person.scripture;
  document.getElementById('detail-ref').textContent       = '— ' + person.reference;
  contentTa.placeholder = `Write your prayer for ${name}…`;

  // Switch view
  viewHome.classList.remove('active');
  viewPerson.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });

  await loadPrayers(name);
}

// ── Load Prayers ──────────────────────────────────────────────────────────────
async function loadPrayers(name) {
  const list = document.getElementById('prayers-list');
  list.innerHTML = '<p style="color:var(--text-dim);font-family:\'EB Garamond\',serif;font-style:italic;text-align:center;padding:2rem;animation:fade-pulse 1.5s infinite">Loading prayers…</p>';

  const prayers = await api(`/api/prayers/${encodeURIComponent(name)}`);

  if (prayers.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-cross" aria-hidden="true">✝</span>
        Be the first to lift up ${esc(name)} in prayer…
      </div>`;
    return;
  }

  list.innerHTML = prayers.map(renderPrayer).join('');
}

// ── Render Prayer Card ────────────────────────────────────────────────────────
function renderPrayer(p) {
  const initials = p.author_name
    .split(/\s+/)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isLeader = p.author_name.trim().toLowerCase() === 'avery';

  const date = new Date(p.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return `
    <div class="prayer-card">
      <div class="prayer-author-row">
        <div class="author-avatar${isLeader ? ' leader' : ''}" aria-hidden="true">${initials}</div>
        <div class="author-meta">
          <div class="author-name-row">
            <span class="author-name">${esc(p.author_name)}</span>
            ${isLeader ? '<span class="leader-badge">✝ Prayer Leader</span>' : ''}
          </div>
          <div class="prayer-date">${date}</div>
        </div>
      </div>
      <p class="prayer-text">${escNl(p.content)}</p>
    </div>`;
}

// ── Submit Prayer ─────────────────────────────────────────────────────────────
prayerForm.addEventListener('submit', async e => {
  e.preventDefault();

  const author  = authorInput.value.trim();
  const content = contentTa.value.trim();
  if (!author || !content) return;

  // Persist author name
  localStorage.setItem(AUTHOR_KEY, author);
  savedName = author;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-cross" aria-hidden="true">✝</span> Posting…';

  try {
    const newPrayer = await api(`/api/prayers/${encodeURIComponent(currentPerson)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: author, content })
    });

    contentTa.value = '';
    charCount.textContent = '0 / 3000';

    const list = document.getElementById('prayers-list');
    // Remove empty state if present
    const empty = list.querySelector('.empty-state');
    if (empty) empty.remove();

    // Append new card
    list.insertAdjacentHTML('beforeend', renderPrayer(newPrayer));
    list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    toast('✝  Prayer posted — may it rise before the Lord.');
  } catch {
    toast('Something went wrong. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-cross" aria-hidden="true">✝</span> Post Prayer';
  }
});

// ── Navigation ────────────────────────────────────────────────────────────────
function goHome() {
  viewPerson.classList.remove('active');
  viewHome.classList.add('active');
  currentPerson = null;
  window.scrollTo({ top: 0, behavior: 'instant' });
  loadHome(); // refresh counts
}

backBtn.addEventListener('click', goHome);
document.getElementById('nav-brand-btn').addEventListener('click', goHome);

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = msg;
  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 3200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function api(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Escape for HTML attribute strings and text nodes
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Escape + preserve newlines for body text
function escNl(str) {
  return esc(str).replace(/\n/g, '<br>');
}

// ── Go ─────────────────────────────────────────────────────────────────────────
init();
