# Sad Boi Clique FC — Website

A parody fan-site for **Sad Boi Clique FC**, a fictional football club created by the project owner and friends inside EA Sports FC 26's *Pro Clubs* mode. The site is for entertainment: it mimics a real English football club's website (news, transfers, fixtures, squad, store, account) but the "club" exists only in the video game.

The live in-game stats of the club and its players will eventually be pulled from EA's own pages and shown on the site, alongside the made-up storylines, sketches and parody news the group invents while playing.

---

## Status (as of 2026-05-10)

This repository currently contains the **design prototype** that came out of Claude Design — a single-page website, fully styled, populated with placeholder content, and runnable in a browser. It is not yet a real production website. It has:

- No backend (no server doing anything behind the scenes).
- No database (nothing is saved between visits).
- No build step (the code is compiled in your browser every time you open the page, which is fine for previews but too slow and fragile for a real website).
- Hard-coded sample players, news, fixtures and store items.
- A "Tweaks" panel in the bottom-right of the page that lets you change the accent colour, glow intensity, theme (dark/light) and background image. This is a Claude Design feature; it will be removed before launch.

In short: **what you see is the look-and-feel locked in, with fake data inside it.** Steps 2–6 of the roadmap below are about replacing the fakery with the real thing.

---

## How to view it locally

Because the prototype loads its components from separate `.jsx` files, you can't just double-click `index.html` — modern browsers block that for security reasons. You need to serve the folder over a tiny local web server. From this folder, open a terminal and run:

```
npx serve .
```

(`npx` ships with Node.js. If you don't have Node, install it from nodejs.org.)

It will print a URL (usually `http://localhost:3000`). Open it in a browser.

---

## What's in this folder

```
sad-boi-clique-fc/
├── README.md                      ← this file
├── index.html                     ← the website's main page (entry point)
├── landing.html                   ← a separate "landing" splash page
├── sbcfc-all.jsx                  ← all the pages bundled (used by index.html)
├── sbcfc-components.jsx           ← shared building blocks (nav bar, ticker, etc.)
├── sbcfc-pages.jsx                ← individual page components
├── assets/                        ← store product photography
│   └── store/
├── uploads/                       ← all other images (logos, players, backgrounds, news pics)
└── docs/
    ├── original-design-chat.md    ← full conversation with Claude Design (~4,900 lines)
    └── handoff-bundle-readme.md   ← the "for coding agents" notes that came with the design
```

`.jsx` is just JavaScript with HTML mixed in — the format the React framework uses to describe UI. You don't need to understand it to use the site, but it's why the site needs a small local server to view (above).

---

## Original design history

The site's look, structure and content were designed across one long conversation with Claude Design. The full transcript is preserved at `docs/original-design-chat.md`. It is large (~4,900 lines / ~75,000 words), so future sessions should treat it as a reference to dip into rather than read top to bottom.

If a question comes up like *"why was the Chaos Feed ticker added?"* or *"what was the rationale for the custom red cursor?"* — the answer will usually be somewhere in that transcript.

---

## Project objectives — agreed roadmap

The owner has laid out six numbered steps. They are listed below verbatim, with honest notes about what each one really involves. These notes are written to inform decisions later — they are not pushing back on the goals, just naming the work.

### 1. ✅ This README / project schema

You are reading it. Done as the first step so any future helper (Claude or a person) can pick up the project from cold without re-deriving everything from the design transcript.

### 2. ⏳ Pull live EA Pro Clubs stats into the site

**Source pages (provided by owner):**
- Club overview — `ea.com/games/ea-sports-fc/clubs/overview?clubId=477926&platform=common-gen5`
- Member list — `ea.com/games/ea-sports-fc/clubs/member-list?clubId=477926&platform=common-gen5`
- Match history — `ea.com/games/ea-sports-fc/clubs/match-history?clubId=477926&platform=common-gen5`

**Honest notes for when we get to this step:**
- EA does not publish a documented way for outside websites to read these stats. The pages are intended for humans, not other websites.
- We will likely have to either (a) reverse-engineer the internal data feed EA's own page uses behind the scenes, or (b) read the visible HTML of each page and pick out the numbers. Both are fragile — EA can change the page at any time and our code will break until we update it.
- A browser security rule (called *CORS* — Cross-Origin Resource Sharing — it stops one website from reading another's data without permission) means the website itself can't fetch from EA directly. We will need a small piece of code running on a server we control that fetches from EA on the website's behalf. This server piece is sometimes called a "backend" or "API proxy".
- This is the step where the project crosses from "static design" to "real working web app". After step 2, going back is hard.

### 3. ⏳ User account system

Real accounts where people can sign up, log in, and do things only logged-in users can do. This needs:
- A database to store users.
- A backend to handle sign-up, log-in, password resets.
- Secure password storage (hashing — never storing the actual password text).
- Probably email verification.

**Honest notes:**
- Doing this safely is non-trivial. The standard advice for non-coders is to use an established "auth" service (e.g. Clerk, Supabase Auth, Auth0) rather than build it from scratch — they handle the security pitfalls (password hashing, session management, brute-force protection) for you. We can compare options when we get there.
- Free tiers exist for small user counts; costs are usually a few dollars per month if it scales.

### 4. ⏳ Admin / developer accounts that can edit content

A logged-in admin should be able to add/remove/edit:
- Players (name, photo, in-game position, club role, lore/storyline text).
- News articles.
- Store items.

**Honest notes:**
- This is just step 3 plus: (a) a "role" flag on accounts so we know who's an admin, (b) admin-only edit screens for each kind of content, (c) a place to store the content (database again).
- Cleanest way to think about it: one database table for `players`, one for `news_articles`, one for `store_items`, and an admin web page that can read/write them.

### 5. ⏳ Discord integration

The owner wants live updates between the website and the Discord server.

**Honest notes — this needs a clarifying conversation when we reach it.**  Two very different things both get called "Discord integration":
- **Push from website to Discord:** when something happens on the site (e.g. a new news article posted, or "we're playing a match in 30 minutes"), a message appears in a Discord channel. This is straightforward via a Discord *webhook* — a special URL Discord gives you that you can post messages to.
- **Pull from Discord to website:** Discord messages appear live on the site (e.g. a chat box, or live-match commentary). This needs a Discord *bot* — a small program that sits in the server and forwards messages out. More work and more moving parts.
- The mention of "live discord updates for when we are playing/plan for the future to play" sounds like the first one (push from site to Discord) plus maybe a "next match" status the bot keeps in sync. We'll confirm before building.

### 6. ⏳ Deploy as a real, live website

Get the site onto the public internet at a real address (e.g. `sadboicliquefc.com`) so anyone can visit.

**Honest notes:**
- This step is mostly straightforward once 1–5 are done. The choice of host depends on what we built: a static-only site can live free on Cloudflare Pages, GitHub Pages or Netlify; a site with a backend + database typically lives on Vercel, Render, Fly.io, or similar. Free tiers cover small audiences.
- Domain name (e.g. `sadboicliquefc.com`) costs ~£10–15/year.
- We should also think about: privacy policy, cookie banner (legally required in the UK/EU), terms of service. The store especially needs these.

---

## Open questions to resolve before step 2

**These need answering before we go any further than step 1.** Calling them out now so the decisions are conscious rather than accidental.

1. **Architecture re-platforming.** The current prototype was built to look right, not run as a real website. Steps 2–6 all need a proper "build setup" (a tool that turns the design source into a fast, optimised website) and a backend. We will need to rebuild the same look on a real toolchain — most likely **Vite + React** (Vite is a build tool; React is the UI framework the design already uses). The end result should look identical to the prototype. **Confirm before we do this.**

2. **Backend hosting + database.** Pick one stack and stick to it. My current recommendation, optimised for "non-coder, low cost, gentle learning curve":
   - **Frontend host:** Vercel or Cloudflare Pages (both free at our scale).
   - **Backend + database + auth:** Supabase (free tier; gives us database, login, file storage in one place).
   - We can change later, but switching has a cost. **Confirm before we commit.**

3. **The store — actually selling, or fake?** The owner's brief says both "mock store" and "genuinely purchase merchandise." These are very different projects: a real store needs a payment processor (Stripe), a way to fulfil orders (print-on-demand service like Printful?), tax registration, return-refund policy. A mock store needs none of that and is essentially complete already.

4. **Whose data is on display?** The site shows in-game stats and lore for real friends (players in your Pro Clubs squad). Do they all consent to being on a public website? Do you want to mask real Gamertags? This is worth checking before launch.

5. **Tweaks panel.** The Tweaks panel (bottom-right gear icon — change accent colour / theme / background) is a design-time tool, not a real-user feature. Plan: keep it during development, remove before public launch. (Or keep a stripped-down version that only toggles dark/light? Owner's call.)

---

## Notes for future sessions (Claude or otherwise)

- Anything that changes the look, structure, or user flow of the site needs to be **briefed and approved before being implemented** — see `feedback_communication.md` in memory.
- Owner has no coding background. Avoid jargon or define it inline when unavoidable.
- Don't read `docs/original-design-chat.md` whole (it's ~75k tokens). Read in offset/limit chunks or grep for keywords.
- File-size cap convention from the prototype: aim to keep individual code files under ~300 lines — split when they grow beyond that, since it makes them easier for the owner (and Claude) to follow.

---

## Glossary (plain-English versions of terms used above)

- **Backend** — code that runs on a server (a computer somewhere on the internet, not the visitor's browser). Handles things the visitor's browser shouldn't, like talking to a database or holding secrets.
- **Frontend** — what runs in the visitor's browser. The HTML, CSS and JavaScript that draws the page.
- **Database** — organised storage. Think of it as a set of spreadsheets the website can read and write very quickly.
- **API** — a defined way for two pieces of software to talk to each other. EA's own page has an internal API that fetches the stats; we'd ideally use the same one.
- **CORS** — a browser security rule that stops a website on one address from secretly reading data from another. It's why we usually need a backend "proxy" in the middle when pulling stats from EA.
- **React** — the framework the design is built in. Lets us describe the UI as components (NavBar, ChaosTicker, etc.) that snap together.
- **JSX** — the file format React uses. JavaScript with HTML mixed in.
- **Vite** — a modern build tool. Takes the React/JSX source files and turns them into fast, optimised website files for production.
- **Webhook** — a special URL someone gives you that you can send messages to. The receiving service (e.g. Discord) treats messages posted to that URL as official updates.
- **Auth** — short for authentication. The "is this person logged in, and who are they?" part of a website.
- **Hashing (passwords)** — a one-way maths trick that turns a password into gibberish. The website only ever stores the gibberish, never the real password — so even if the database is stolen, the passwords aren't readable.
