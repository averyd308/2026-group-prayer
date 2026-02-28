const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

// ── Database ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'prayers.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS prayers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    person_name  TEXT    NOT NULL,
    author_name  TEXT    NOT NULL,
    content      TEXT    NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Scripture Data ───────────────────────────────────────────────────────────
const PEOPLE = [
  {
    name: "Grant",
    scripture: "Because the one who sows to his flesh will reap destruction from the flesh but the one who sows to the Spirit will reap eternal life from the Spirit.",
    reference: "Galatians 6:8"
  },
  {
    name: "Kaitlin",
    scripture: "Now if any of you lacks wisdom, he should ask God—who gives to all generously and ungrudgingly—and it will be given to him.",
    reference: "James 1:5"
  },
  {
    name: "Ricky",
    scripture: "After these events, the word of the LORD came to Abram in a vision: 'Do not be afraid, Abram. I am your shield; your reward will be very great.' But Abram said, 'Lord GOD, what can you give me, since I am childless and the heir of my house is Eliezer of Damascus?' Abram continued, 'Look, you have given me no offspring, so a slave born in my house will be my heir.' Now the word of the LORD came to him: 'This one will not be your heir; instead, one who comes from your own body will be your heir.' He took him outside and said, 'Look at the sky and count the stars, if you are able to count them.' Then he said to him, 'Your offspring will be that numerous.' Abram believed the LORD, and he credited it to him as righteousness.",
    reference: "Genesis 15:1-6"
  },
  {
    name: "Katie",
    scripture: "For through faith you are all sons of God in Christ Jesus.",
    reference: "Galatians 3:26"
  },
  {
    name: "Forrest",
    scripture: "The point is this: The person who sows sparingly will also reap sparingly, and the person who sows generously will also reap generously. Each person should do as he has decided in his heart — not reluctantly or out of compulsion, since God loves a cheerful giver.",
    reference: "2 Corinthians 9:6-7"
  },
  {
    name: "Carissa",
    scripture: "Trust in the LORD with all your heart, and do not rely on your own understanding; in all your ways know him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6"
  },
  {
    name: "Savanna",
    scripture: "'Do not remember the past events; pay no attention to things of old. Look, I am about to do something new; even now it is coming. Do you not see it? Indeed, I will make a way in the wilderness, rivers in the desert.'",
    reference: "Isaiah 43:18-19"
  },
  {
    name: "Greg",
    scripture: "'Take my yoke upon you and learn from me, because I am lowly and humble in heart, and you will find rest for your souls.'",
    reference: "Matthew 11:29"
  },
  {
    name: "Avery",
    scripture: "Send your light and your truth; let them lead me. Let them bring me to your holy mountain, to your dwelling place. Then I will come to the altar of God, to God, my greatest joy. I will praise you with the lyre, God, my God.",
    reference: "Psalm 43:3-4"
  },
  {
    name: "Mary",
    scripture: "'Peace I leave with you. My peace I give to you. I do not give to you as the world gives. Don't let your hearts be troubled or fearful.'",
    reference: "John 14:27"
  },
  {
    name: "Maya",
    scripture: "Humble yourselves, therefore, under the mighty hand of God, so that he may exalt you at the proper time, casting all your cares on him, because he cares about you.",
    reference: "1 Peter 5:6-7"
  },
  {
    name: "Hunter",
    scripture: "For this very reason, make every effort to supplement your faith with goodness, goodness with knowledge, knowledge with self-control, self-control with endurance, endurance with godliness, godliness with brotherly affection, and brotherly affection with love.",
    reference: "2 Peter 1:5-7"
  }
];

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ───────────────────────────────────────────────────────────────

// GET  /api/people  → all people + prayer counts
app.get('/api/people', (req, res) => {
  const counts = db.prepare(
    'SELECT person_name, COUNT(*) as count FROM prayers GROUP BY person_name'
  ).all();
  const countMap = {};
  counts.forEach(r => (countMap[r.person_name] = r.count));

  res.json(PEOPLE.map(p => ({ ...p, prayerCount: countMap[p.name] || 0 })));
});

// GET  /api/prayers/:name  → all prayers for a person
app.get('/api/prayers/:name', (req, res) => {
  const prayers = db.prepare(
    'SELECT * FROM prayers WHERE person_name = ? ORDER BY created_at ASC'
  ).all(req.params.name);
  res.json(prayers);
});

// POST /api/prayers/:name  → add a prayer
app.post('/api/prayers/:name', (req, res) => {
  const { author_name, content } = req.body;

  if (!author_name || !content) {
    return res.status(400).json({ error: 'author_name and content are required' });
  }
  const personExists = PEOPLE.find(p => p.name === req.params.name);
  if (!personExists) {
    return res.status(404).json({ error: 'Person not found' });
  }

  const result = db.prepare(
    'INSERT INTO prayers (person_name, author_name, content) VALUES (?, ?, ?)'
  ).run(req.params.name, author_name.trim(), content.trim());

  const newPrayer = db.prepare('SELECT * FROM prayers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newPrayer);
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  ✝  Prayer Journal 2026');
  console.log(`  → http://localhost:${PORT}\n`);
});
