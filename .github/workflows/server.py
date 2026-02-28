#!/usr/bin/env python3
"""Prayer Journal 2026 — Python Server
  Local dev : uses SQLite (no setup needed)
  Production: uses PostgreSQL via DATABASE_URL env var (Render)
"""

import http.server
import json
import os
import urllib.parse
from datetime import timezone
from pathlib import Path

PORT         = int(os.environ.get("PORT", 3000))
DATABASE_URL = os.environ.get("DATABASE_URL")   # set automatically by Render
BASE_DIR     = Path(__file__).parent
PUBLIC       = BASE_DIR / "public"

# ── Database abstraction ───────────────────────────────────────────────────────
#  All DB logic is isolated here so the rest of the code is database-agnostic.

if DATABASE_URL:
    # ── PostgreSQL (Render production) ────────────────────────────────────────
    import psycopg2
    import psycopg2.extras

    def _pg():
        return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

    def init_db():
        with _pg() as conn:
            with conn.cursor() as c:
                c.execute("""
                    CREATE TABLE IF NOT EXISTS prayers (
                        id          SERIAL PRIMARY KEY,
                        person_name TEXT        NOT NULL,
                        author_name TEXT        NOT NULL,
                        content     TEXT        NOT NULL,
                        created_at  TIMESTAMPTZ DEFAULT NOW()
                    )
                """)

    def _fmt(row):
        """Convert a PG row to a plain dict with ISO-8601 created_at string."""
        d = dict(row)
        if "created_at" in d and hasattr(d["created_at"], "isoformat"):
            d["created_at"] = d["created_at"].astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        return d

    def db_query_prayers_count():
        with _pg() as conn:
            with conn.cursor() as c:
                c.execute("SELECT person_name, COUNT(*) AS count FROM prayers GROUP BY person_name")
                return {r["person_name"]: r["count"] for r in c.fetchall()}

    def db_get_prayers(person_name):
        with _pg() as conn:
            with conn.cursor() as c:
                c.execute(
                    "SELECT id, person_name, author_name, content, created_at "
                    "FROM prayers WHERE person_name = %s ORDER BY created_at ASC",
                    (person_name,)
                )
                return [_fmt(r) for r in c.fetchall()]

    def db_insert_prayer(person_name, author_name, content):
        with _pg() as conn:
            with conn.cursor() as c:
                c.execute(
                    "INSERT INTO prayers (person_name, author_name, content) "
                    "VALUES (%s, %s, %s) RETURNING *",
                    (person_name, author_name, content)
                )
                return _fmt(c.fetchone())

else:
    # ── SQLite (local development) ────────────────────────────────────────────
    import sqlite3
    import threading

    _local  = threading.local()
    DB_PATH = BASE_DIR / "prayers.db"

    def _sq():
        if not hasattr(_local, "conn"):
            conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
            conn.row_factory = sqlite3.Row
            _local.conn = conn
        return _local.conn

    def init_db():
        conn = _sq()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS prayers (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                person_name TEXT NOT NULL,
                author_name TEXT NOT NULL,
                content     TEXT NOT NULL,
                created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
            )
        """)
        conn.commit()

    def db_query_prayers_count():
        conn = _sq()
        rows = conn.execute(
            "SELECT person_name, COUNT(*) AS count FROM prayers GROUP BY person_name"
        ).fetchall()
        return {r["person_name"]: r["count"] for r in rows}

    def db_get_prayers(person_name):
        conn = _sq()
        rows = conn.execute(
            "SELECT id, person_name, author_name, content, created_at "
            "FROM prayers WHERE person_name = ? ORDER BY created_at ASC",
            (person_name,)
        ).fetchall()
        return [dict(r) for r in rows]

    def db_insert_prayer(person_name, author_name, content):
        conn = _sq()
        cur = conn.execute(
            "INSERT INTO prayers (person_name, author_name, content) VALUES (?, ?, ?)",
            (person_name, author_name, content)
        )
        conn.commit()
        return dict(conn.execute("SELECT * FROM prayers WHERE id = ?", (cur.lastrowid,)).fetchone())


# ── Scripture Data ─────────────────────────────────────────────────────────────
PEOPLE = [
    {
        "name": "Grant",
        "scripture": "Because the one who sows to his flesh will reap destruction from the flesh but the one who sows to the Spirit will reap eternal life from the Spirit.",
        "reference": "Galatians 6:8"
    },
    {
        "name": "Kaitlin",
        "scripture": "Now if any of you lacks wisdom, he should ask God\u2014who gives to all generously and ungrudgingly\u2014and it will be given to him.",
        "reference": "James 1:5"
    },
    {
        "name": "Ricky",
        "scripture": "After these events, the word of the LORD came to Abram in a vision: \u2018Do not be afraid, Abram. I am your shield; your reward will be very great.\u2019 But Abram said, \u2018Lord GOD, what can you give me, since I am childless and the heir of my house is Eliezer of Damascus?\u2019 Abram continued, \u2018Look, you have given me no offspring, so a slave born in my house will be my heir.\u2019 Now the word of the LORD came to him: \u2018This one will not be your heir; instead, one who comes from your own body will be your heir.\u2019 He took him outside and said, \u2018Look at the sky and count the stars, if you are able to count them.\u2019 Then he said to him, \u2018Your offspring will be that numerous.\u2019 Abram believed the LORD, and he credited it to him as righteousness.",
        "reference": "Genesis 15:1-6"
    },
    {
        "name": "Katie",
        "scripture": "For through faith you are all sons of God in Christ Jesus.",
        "reference": "Galatians 3:26"
    },
    {
        "name": "Forrest",
        "scripture": "The point is this: The person who sows sparingly will also reap sparingly, and the person who sows generously will also reap generously. Each person should do as he has decided in his heart \u2014 not reluctantly or out of compulsion, since God loves a cheerful giver.",
        "reference": "2 Corinthians 9:6-7"
    },
    {
        "name": "Carissa",
        "scripture": "Trust in the LORD with all your heart, and do not rely on your own understanding; in all your ways know him, and he will make your paths straight.",
        "reference": "Proverbs 3:5-6"
    },
    {
        "name": "Savanna",
        "scripture": "\u2018Do not remember the past events; pay no attention to things of old. Look, I am about to do something new; even now it is coming. Do you not see it? Indeed, I will make a way in the wilderness, rivers in the desert.\u2019",
        "reference": "Isaiah 43:18-19"
    },
    {
        "name": "Greg",
        "scripture": "\u2018Take my yoke upon you and learn from me, because I am lowly and humble in heart, and you will find rest for your souls.\u2019",
        "reference": "Matthew 11:29"
    },
    {
        "name": "Avery",
        "scripture": "Send your light and your truth; let them lead me. Let them bring me to your holy mountain, to your dwelling place. Then I will come to the altar of God, to God, my greatest joy. I will praise you with the lyre, God, my God.",
        "reference": "Psalm 43:3-4"
    },
    {
        "name": "Mary",
        "scripture": "\u2018Peace I leave with you. My peace I give to you. I do not give to you as the world gives. Don\u2019t let your hearts be troubled or fearful.\u2019",
        "reference": "John 14:27"
    },
    {
        "name": "Maya",
        "scripture": "Humble yourselves, therefore, under the mighty hand of God, so that he may exalt you at the proper time, casting all your cares on him, because he cares about you.",
        "reference": "1 Peter 5:6-7"
    },
    {
        "name": "Hunter",
        "scripture": "For this very reason, make every effort to supplement your faith with goodness, goodness with knowledge, knowledge with self-control, self-control with endurance, endurance with godliness, godliness with brotherly affection, and brotherly affection with love.",
        "reference": "2 Peter 1:5-7"
    }
]

PERSON_NAMES = {p["name"] for p in PEOPLE}

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".ico":  "image/x-icon",
    ".png":  "image/png",
}


# ── HTTP Request Handler ───────────────────────────────────────────────────────
class Handler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass  # use our own logging below

    # ── Helpers ────────────────────────────────────────────────────────────────
    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type",   "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    # ── Routing ────────────────────────────────────────────────────────────────
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/people":
            self._get_people()
        elif path.startswith("/api/prayers/"):
            name = urllib.parse.unquote(path[len("/api/prayers/"):])
            self._get_prayers(name)
        else:
            self._serve_static(path)

    def do_POST(self):
        path = self.path.split("?")[0]
        if path.startswith("/api/prayers/"):
            name = urllib.parse.unquote(path[len("/api/prayers/"):])
            self._post_prayer(name)
        else:
            self.send_json({"error": "Not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ── API ────────────────────────────────────────────────────────────────────
    def _get_people(self):
        counts = db_query_prayers_count()
        result = [{**p, "prayerCount": counts.get(p["name"], 0)} for p in PEOPLE]
        self.send_json(result)
        print(f"  GET /api/people")

    def _get_prayers(self, name):
        prayers = db_get_prayers(name)
        self.send_json(prayers)
        print(f"  GET  prayers/{name}  ({len(prayers)} found)")

    def _post_prayer(self, name):
        body    = self.read_json_body()
        author  = body.get("author_name", "").strip()
        content = body.get("content",     "").strip()

        if not author or not content:
            self.send_json({"error": "author_name and content are required"}, 400)
            return
        if name not in PERSON_NAMES:
            self.send_json({"error": "Person not found"}, 404)
            return

        prayer = db_insert_prayer(name, author, content)
        self.send_json(prayer, 201)
        print(f"  POST prayer/{name}  by {author}")

    # ── Static Files ───────────────────────────────────────────────────────────
    def _serve_static(self, path):
        if path == "/":
            path = "/index.html"
        try:
            file_path = (PUBLIC / path.lstrip("/")).resolve()
            file_path.relative_to(PUBLIC.resolve())
        except Exception:
            self.send_json({"error": "Forbidden"}, 403)
            return

        if not file_path.exists() or not file_path.is_file():
            self.send_response(404)
            self.end_headers()
            return

        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type",   MIME.get(file_path.suffix.lower(), "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


# ── Start ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()

    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    db_label = "PostgreSQL" if DATABASE_URL else f"SQLite ({BASE_DIR / 'prayers.db'})"

    print(f"\n  Prayer Journal 2026")
    print(f"  Database : {db_label}")
    print(f"  Running  : http://localhost:{PORT}\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.server_close()
