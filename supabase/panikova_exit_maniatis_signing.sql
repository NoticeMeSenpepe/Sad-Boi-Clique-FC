-- =====================================================================
-- Sad Boi Clique FC — Panikova exits, Maniatis signs
-- =====================================================================
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
--
-- What this does, in order:
--   1. Update the existing `panikova` player row so he is no longer the
--      EA-live face of `broddleeee1`. He stays in the squad with a
--      "LEFT CLUB" tag and frozen career stats so we can still view his
--      profile, lore and timeline.
--   2. Insert a new `maniatis` player row that adopts the `broddleeee1`
--      EA gamertag — so the live career stats currently keyed to that
--      account flow into Maniatis from now on.
--   3. Insert two news articles (Panikova exit + Maniatis signing).
--   4. Insert an incoming transfer record for Maniatis.
--
-- Re-runnable. Conditional INSERTs guard against duplicate news/transfer
-- rows on a second run. The player updates are idempotent UPSERT-style.
-- =====================================================================

-- 1) PANIKOVA — ex-clique. Drop the EA gamertag link, freeze his career
--    numbers at his last live values, and add a LEFT CLUB tag.
update public.players set
  ea_user      = null,
  rating       = 87,
  rarity       = 'icon',
  mock_goals   = 204,
  mock_apps    = 320,
  mock_assists = 94,
  tags         = array['LEFT CLUB','The Calm (Formerly)','Aura Instability Risk','Vibe Injury Prone','Offside Non-Compliant'],
  archetype    = 'The Departed Icon',
  lore         = 'Once the calmest striker in Pro Clubs history, then the most volatile, then — finally — gone. Departed under murky circumstances after what is now legally referred to as "the 17-second conversation." The training cones have not been recovered.',
  timeline     = '[
    {"era":"The Rise","note":"187 goals. Cold. Clinical. Legendary."},
    {"era":"The Collapse","note":"Missed a penalty against 10 men. Blamed a seagull."},
    {"era":"The Rebirth","note":"Sad Boi era begins. Chaos becomes the method."},
    {"era":"The 17 Seconds","note":"A short conversation with the manager. Neither party can recall what was said. The cones vanish overnight."},
    {"era":"The Departure","note":"Walks out of LNER Stadium with a suitcase. No statement. No forwarding address. No cones."}
  ]'::jsonb,
  sort_order   = 200,
  visible      = true,
  updated_at   = now()
where id = 'panikova';


-- 2) MANIATIS — new signing, inherits the broddleeee1 EA gamertag.
--    `mock_*` numbers are small "just-signed" values; the live merge
--    will paint over them with broddleeee1's real career figures.
insert into public.players
  (id, name, short_name, number, ea_user, image,
   position, rating, rarity, nationality, stats,
   mock_goals, mock_apps, mock_assists, mock_clean_sheets,
   tags, accent_color, glow_color, archetype, lore, timeline,
   sort_order, visible)
values
  ('maniatis', 'Dimitris Maniatis', 'MANIATIS', 14, 'broddleeee1',
   '/uploads/maniatis.png',
   'ST', 85, 'legend', 'GR',
   '{"PAC":70,"SHO":90,"PAS":65,"DRI":72,"DEF":25,"PHY":92}'::jsonb,
   2, 1, 0, null,
   array['The Exile','Target Forward','Power Shot','Aerial Threat','Acrobatic'],
   '#1e4d8c', 'rgba(30,77,140,0.5)',
   'The Exiled Giant',
   'A fallen Greek prince in a Lincolnshire raincoat. Born into a footballing dynasty, walked away from it all after smashing a match ball through a boardroom window mid-signing. Found by the Clique outside a pub in the rain, hitting a ball against a wall like a man trying to be heard. He says everything with his feet.',
   '[
     {"era":"The Prince of Peloponnese","note":"Groomed for greatness from age five. Cracked the stadium clock with a youth-cup volley."},
     {"era":"The Window","note":"Refused a forced transfer live on television. Smashed the match ball through the boardroom window with a signature volley. Walked out."},
     {"era":"The Shed","note":"Random flight to East Midlands. Lived in a converted barn. Worked as a gardener. Hit a ball against a stone wall every night."},
     {"era":"The Sofa","note":"Found by the Clique outside a Lincoln pub. Offered no money, no fame — just a sofa. Said yes with his feet."}
   ]'::jsonb,
   10, true)
on conflict (id) do update set
  name              = excluded.name,
  short_name        = excluded.short_name,
  number            = excluded.number,
  ea_user           = excluded.ea_user,
  image             = excluded.image,
  position          = excluded.position,
  rating            = excluded.rating,
  rarity            = excluded.rarity,
  nationality       = excluded.nationality,
  stats             = excluded.stats,
  mock_goals        = excluded.mock_goals,
  mock_apps         = excluded.mock_apps,
  mock_assists      = excluded.mock_assists,
  mock_clean_sheets = excluded.mock_clean_sheets,
  tags              = excluded.tags,
  accent_color      = excluded.accent_color,
  glow_color        = excluded.glow_color,
  archetype         = excluded.archetype,
  lore              = excluded.lore,
  timeline          = excluded.timeline,
  sort_order        = excluded.sort_order,
  visible           = excluded.visible,
  updated_at        = now();


-- 3) NEWS — Panikova departure (BREAKING) + Maniatis signing (TRANSFER).
--    Each insert is guarded by a "headline already exists?" check so the
--    file is safe to re-run without creating duplicates.
do $body$
begin
  if not exists (select 1 from public.news_articles where headline = 'PANIKOVA WALKS — TALISMANIC STRIKER LEAVES SAD BOI CLIQUE WITH IMMEDIATE EFFECT') then
    insert into public.news_articles
      (published_at, headline, summary, body, tag, tag_color, kicker, image_url, author, hot)
    values
      (now(),
       'PANIKOVA WALKS — TALISMANIC STRIKER LEAVES SAD BOI CLIQUE WITH IMMEDIATE EFFECT',
       'After a 17-second conversation with the manager — the contents of which neither party can recall — Amir Panikova has departed the club. The training cones are also missing.',
       'Sad Boi Clique FC can confirm, with a heavy heart and several missing traffic cones, that Amir Panikova has left the club with immediate effect.

The talismanic striker, whose career here spanned The Rise, The Collapse and The Rebirth, exited LNER Stadium late last night carrying a single Louis Vuitton suitcase and what backroom staff describe as "a slightly distant expression." He did not speak to the press. He did not speak to teammates. He did, briefly, speak to the manager — for exactly 17 seconds, according to the changing-room clock — although both men have since confirmed they have no idea what was said.

"He came in, said something, and left," the manager told an emergency press briefing in the car park. "I think it was about a fern. Or possibly cones. I nodded. Then he was gone. And so were the cones."

The cones, plural, are at the centre of what is being unofficially referred to as The Cone Incident. The club had 47 training cones at lock-up on Tuesday evening. By Wednesday morning, the cones numbered zero. The CCTV footage shows a tall figure in a Louis Vuitton-monogrammed cape exiting the storage shed at 03:14. The figure is, the club legal team have insisted we clarify, "not necessarily Panikova."

Panikova''s representatives released a brief statement reading, in full: "He saw what he saw in the fern. The fern was clear." No further questions were taken.

His final career numbers — 204 goals in 320 appearances — make him, statistically, the most prolific striker in Sad Boi Clique history. They also make him, statistically, the most prolific cone-remover in Sad Boi Clique history.

The club thanks Amir for his service, his goals, his missed sitters, and the unspecified contribution to the wider conversation around shrubbery. His shirt will not be retired, because he took that too.

The search for a replacement is already underway. Sources suggest a deal is "extremely close." The cones, regrettably, are not.',
       'BREAKING', '#ff2244', 'Exclusive · Club Insider',
       '/uploads/panikova-leaves.png',
       'Club Insider', true);
  end if;

  if not exists (select 1 from public.news_articles where headline = 'HERE WE GO — MANIATIS JOINS THE CLIQUE FROM A SHED IN LINCOLNSHIRE') then
    insert into public.news_articles
      (published_at, headline, summary, body, tag, tag_color, kicker, image_url, author, hot)
    values
      (now() + interval '2 minutes',
       'HERE WE GO — MANIATIS JOINS THE CLIQUE FROM A SHED IN LINCOLNSHIRE',
       'Dimitris "The Exile" Maniatis to Sad Boi Clique, here we go! ✅ Free transfer. Personal terms agreed in a pub. Medical passed. Sofa offered. Sofa accepted. Shirt number 14.',
       '🚨 EXCLUSIVE 🚨

Dimitris "The Exile" Maniatis to Sad Boi Clique, HERE WE GO! ✅🇬🇷

Greek target forward signing for the Clique on a free transfer following his self-imposed exile from professional football. Verbal agreement reached outside a pub in central Lincoln. No agents. No fee. No paperwork until Tuesday because the gaffer "forgot the pen."

Personal terms agreed in roughly 11 minutes — a club record. Maniatis was offered: one sofa, one warm meal, one set of training kit (slightly oversized), and a group of friends "who understood what it felt like to be an outsider." He accepted in Greek. Nobody on the negotiating team speaks Greek. They understood anyway.

📋 KEY DETAILS:
→ Position: Target Forward (#14)
→ Height: 6''4" (193cm)
→ Weight: 210lbs (95kg)
→ Playstyle: Power Shot · Aerial Threat · Acrobatic
→ Nationality: 🇬🇷 Greek
→ Background: Former Prince of the Peloponnese turned Lincolnshire gardener

THE STORY: Maniatis was discovered during a club bonding retreat at a Lincoln pub when staff noticed a 6''4" stranger hitting a football against a stone wall in the rain "with such ferocity the sound echoed like a gunshot through the misty night." The captain approached. The conversation lasted 41 seconds, longer than the entire negotiation that followed.

He had been in Lincolnshire for an unspecified period of time, living in a converted barn and working as a gardener, after walking out of a televised signing ceremony in Greece by smashing the match ball through the boardroom window with a signature volley. He has not spoken to his family since. He has, by all accounts, planted excellent hydrangeas.

The club legal team has been informed. The cones, currently still missing, will not be replaced until further notice. Maniatis is expected to be available for the next league fixture. He has been issued cones of his own.

#UpTheClique #HereWeGo',
       'TRANSFER', '#1e4d8c', 'Transfer Window · Here We Go',
       '/uploads/maniatis-square.png',
       'Transfer Desk', true);
  end if;
end $body$;


-- 4) TRANSFERS table — incoming transfer record for Maniatis.
do $body$
begin
  if not exists (select 1 from public.transfers where player = 'Dimitris Maniatis' and status_label = 'HERE WE GO ✓') then
    insert into public.transfers
      (happened_at, player, club, fee, status_label, panel_color, detail, image_url)
    values
      (now(),
       'Dimitris Maniatis',
       'Sad Boi Clique FC',
       'Free Transfer',
       'HERE WE GO ✓',
       '#1e4d8c',
       'Greek target forward "The Exile" signs from self-imposed exile in Lincolnshire. Personal terms agreed in a pub. Sofa offered. Sofa accepted. Shirt #14. The cones will not be replaced until further notice.',
       '/uploads/maniatis.png');
  end if;
end $body$;
