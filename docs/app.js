// ═══════════════════════════════════════════════════════════════════════════
//  Prayer Journal 2026 — Supabase Edition (GitHub Pages / fully static)
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ── Supabase Configuration ────────────────────────────────────────────────
//  After creating your free Supabase project, replace the two lines below
//  with your Project URL and anon/public key (both found in:
//  Supabase dashboard → Project Settings → API)
// ─────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
// ─────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── People & Scripture Data ───────────────────────────────────────────────
const PEOPLE = [
  {
    name: 'Grant',
    scripture: 'Because the one who sows to his flesh will reap destruction from the flesh but the one who sows to the Spirit will reap eternal life from the Spirit.',
    reference: 'Galatians 6:8'
  },
  {
    name: 'Kaitlin',
    scripture: 'Now if any of you lacks wisdom, he should ask God\u2014who gives to all generously and ungrudgingly\u2014and it will be given to him.',
    reference: 'James 1:5'
  },
  {
    name: 'Ricky',
    scripture: 'After these events, the word of the LORD came to Abram in a vision: \u2018Do not be afraid, Abram. I am your shield; your reward will be very great.\u2019 But Abram said, \u2018Lord GOD, what can you give me, since I am childless and the heir of my house is Eliezer of Damascus?\u2019 Abram continued, \u2018Look, you have given me no offspring, so a slave born in my house will be my heir.\u2019 Now the word of the LORD came to him: \u2018This one will not be your heir; instead, one who comes from your own body will be your heir.\u2019 He took him outside and said, \u2018Look at the sky and count the stars, if you are able to count them.\u2019 Then he said to him, \u2018Your offspring will be that numerous.\u2019 Abram believed the LORD, and he credited it to him as righteousness.',
    reference: 'Genesis 15:1-6'
  },
  {
    name: 'Katie',
    scripture: 'For through faith you are all sons of God in Christ Jesus.',
    reference: 'Galatians 3:26'
  },
  {
    name: 'Forrest',
    scripture: 'The point is this: The person who sows sparingly will also reap sparingly, and the person who sows generously will also reap generously. Each person should do as he has decided in his heart \u2014 not reluctantly or out of compulsion, since God loves a cheerful giver.',
    reference: '2 Corinthians 9:6-7'
  },
  {
    name: 'Carissa',
    scripture: 'Trust in the LORD with all your heart, and do not rely on your own understanding; in all your ways know him, and he will make your paths straight.',
    reference: 'Proverbs 3:5-6'
  },
  {
    name: 'Savanna',
    scripture: '\u2018Do not remember the past events; pay no attention to things of old. Look, I am about to do something new; even now it is coming. Do you not see it? Indeed, I will make a way in the wilderness, rivers in the desert.\u2019',
    reference: 'Isaiah 43:18-19'
  },
  {
    name: 'Greg',
    scripture: '\u2018Take my yoke upon you and learn from me, because I am lowly and humble in heart, and you will find rest for your souls.\u2019',
    reference: 'Matthew 11:29'
  },
  {
    name: 'Avery',
    scripture: 'Send your light and your truth; let them lead me. Let them bring me to your holy mountain, to your dwelling place. Then I will come to the altar of God, to God, my greatest joy. I will praise you with the lyre, God, my God.',
    reference: 'Psalm 43:3-4'
  },
  {
    name: 'Mary',
    scripture: '\u2018Peace I leave with you. My peace I give to you. I do not give to you as the world gives. Don\u2019t let your hearts be troubled or fearful.\u2019',
    reference: 'John 14:27'
  },
  {
    name: 'Maya',
    scripture: 'Humble yourselves, therefore, under the mighty hand of God, so that he may exalt you at the proper time, casting all your cares on him, because he cares about you.',
    reference: '1 Peter 5:6-7'
  },
  {
    name: 'Hunter',
    scripture: 'For this very reason, make every effort to supplement your faith with goodness, goodness with knowledge, knowledge with self-control, self-control with endurance, endurance with godliness, godliness with brotherly affection, and brotherly affection with love.',
    reference: '2 Peter 1:5-7'
  }
];

// ── State ─────────────────────────────────────────────────────────────────
let currentPerson = null;
const AUTHOR_KEY  = 'pj2026_author';
let savedName     = localStorage.getItem(AUTHOR_KEY) || '';

// ── DOM refs ──────────────────────────────────────────────────────────────
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

// ── Boot ──────────────────────────────────────────────────────────────────
async function init() {
  buildStarfield();
  if (savedName) authorInput.value = savedName;
  contentTa.addEventListener('input', () => {
    charCount.textContent = `${contentTa.value.length} / 3000`;
  });

  await loadHome();

  const splash = document.getElementById('splash');
  splash.classList.add('fade-out');
  setTimeout(() => splash.remove(), 520);
}

// ── Starfield ─────────────────────────────────────────────────────────────
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

// ── Load Home ─────────────────────────────────────────────────────────────
async function loadHome() {
  peopleGrid.innerHTML = '<p style="color:var(--text-dim);font-family:\'EB Garamond\',serif;font-style:italic;text-align:center;padding:3rem;animation:fade-pulse 1.5s infinite">Loading prayer family…</p>';

  // Fetch prayer counts from Supabase
  const { data: rows } = await supabase
    .from('prayers')
    .select('person_name');

  const countMap = {};
  rows?.forEach(r => { countMap[r.person_name] = (countMap[r.person_name] || 0) + 1; });

  // Build nav quick-links
  navPeople.innerHTML = PEOPLE
    .map(p => `<button class="nav-btn" onclick="window.openPerson('${esc(p.name)}')">${esc(p.name)}</button>`)
    .join('');

  // Build cards
  peopleGrid.innerHTML = PEOPLE.map((p, i) => `
    <div class="person-card"
         style="animation-delay:${(i * 0.045).toFixed(2)}s"
         onclick="window.openPerson('${esc(p.name)}')"
         role="button"
         tabindex="0"
         aria-label="View prayers for ${esc(p.name)}">
      <div class="card-ref">${esc(p.reference)}</div>
      <div class="card-name">${esc(p.name)}</div>
      <p class="card-scripture">${esc(p.scripture)}</p>
      <div class="card-footer">
        <span class="prayer-count">
          <span class="pc-cross" aria-hidden="true">✝</span>
          ${countMap[p.name] || 0} ${(countMap[p.name] || 0) === 1 ? 'prayer' : 'prayers'}
        </span>
        <button
          class="view-btn"
          onclick="event.stopPropagation();window.openPerson('${esc(p.name)}')"
          aria-label="View prayers for ${esc(p.name)}">
          View Prayers →
        </button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.person-card').forEach(card => {
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
  });
}

// ── Open Person ───────────────────────────────────────────────────────────
window.openPerson = async function(name) {
  currentPerson = name;
  const person  = PEOPLE.find(p => p.name === name);
  if (!person) return;

  document.getElementById('detail-name').textContent      = name;
  document.getElementById('detail-scripture').textContent = person.scripture;
  document.getElementById('detail-ref').textContent       = '— ' + person.reference;
  contentTa.placeholder = `Write your prayer for ${name}…`;

  viewHome.classList.remove('active');
  viewPerson.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });

  await loadPrayers(name);
};

// ── Load Prayers ──────────────────────────────────────────────────────────
async function loadPrayers(name) {
  const list = document.getElementById('prayers-list');
  list.innerHTML = '<p style="color:var(--text-dim);font-family:\'EB Garamond\',serif;font-style:italic;text-align:center;padding:2rem;animation:fade-pulse 1.5s infinite">Loading prayers…</p>';

  const { data: prayers, error } = await supabase
    .from('prayers')
    .select('*')
    .eq('person_name', name)
    .order('created_at', { ascending: true });

  if (error) { list.innerHTML = '<p style="color:red;text-align:center;padding:2rem">Error loading prayers.</p>'; return; }

  if (!prayers || prayers.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-cross" aria-hidden="true">✝</span>
        Be the first to lift up ${esc(name)} in prayer…
      </div>`;
    return;
  }

  list.innerHTML = prayers.map(renderPrayer).join('');
}

// ── Render Prayer Card ────────────────────────────────────────────────────
function renderPrayer(p) {
  const initials  = p.author_name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const isLeader  = p.author_name.trim().toLowerCase() === 'avery';
  const date      = new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

// ── Submit Prayer ─────────────────────────────────────────────────────────
prayerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const author  = authorInput.value.trim();
  const content = contentTa.value.trim();
  if (!author || !content) return;

  localStorage.setItem(AUTHOR_KEY, author);
  savedName = author;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-cross" aria-hidden="true">✝</span> Posting…';

  const { data: newPrayer, error } = await supabase
    .from('prayers')
    .insert([{ person_name: currentPerson, author_name: author, content }])
    .select()
    .single();

  if (error) {
    toast('Something went wrong. Please try again.');
  } else {
    contentTa.value = '';
    charCount.textContent = '0 / 3000';

    const list = document.getElementById('prayers-list');
    const empty = list.querySelector('.empty-state');
    if (empty) empty.remove();

    list.insertAdjacentHTML('beforeend', renderPrayer(newPrayer));
    list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    toast('✝  Prayer posted — may it rise before the Lord.');
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<span class="btn-cross" aria-hidden="true">✝</span> Post Prayer';
});

// ── Navigation ────────────────────────────────────────────────────────────
function goHome() {
  viewPerson.classList.remove('active');
  viewHome.classList.add('active');
  currentPerson = null;
  window.scrollTo({ top: 0, behavior: 'instant' });
  loadHome();
}

backBtn.addEventListener('click', goHome);
document.getElementById('nav-brand-btn').addEventListener('click', goHome);

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escNl(str) { return esc(str).replace(/\n/g, '<br>'); }

// ── Go ────────────────────────────────────────────────────────────────────
init();
