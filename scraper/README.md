# SBCFC scraper

Scheduled job that loads the EA Sports FC Pro Clubs page for Sad Boi Clique FC in a real
headless Chrome, captures the JSON the page itself fetches, and writes it to Supabase.

In production this runs on **GitHub Actions** every 10 minutes (free).
Locally you can run it directly to test.

## Local test (one-time setup)

```bash
cd scraper
npm install
npm run install-browser            # downloads a headless Chrome (~150 MB)
cp .env.example .env
# Edit .env and paste the SERVICE-ROLE key from Supabase Dashboard → Settings → API
# (NOT the anon key — the service-role key bypasses RLS so the scraper can write).
npm run scrape
```

You should see log lines for each endpoint and a final `Done in … ms — ok=true` with
non-zero `rowsWritten` for at least one of `club`, `members`, `matches`.

## Why we need a headless browser at all

EA's `proclubs.ea.com/api/fc/...` endpoints reject direct server-to-server requests with
`403 Forbidden`. They're only reachable from a session that has loaded the public
`ea.com/games/ea-sports-fc/clubs/...` page first. By driving Chrome through Playwright we
look indistinguishable from a real visitor, the WAF lets the request through, and we can
read the JSON the page is already pulling.

## What lives in the database

See `../supabase/schema.sql` for the full schema. Three tables, all upsert-style:

| Table | Key | Source |
|-------|-----|--------|
| `club_state` | `(club_id, platform)` | `clubs/info` + `clubs/overallStats` |
| `member_state` | `(club_id, platform, name)` | `members/stats` + `members/career/stats` |
| `match_state` | `match_id` | `clubs/matches?matchType=leagueMatch` and `playoffMatch` |

Plus `scrape_log` (audit trail of each run, success/fail/duration).
