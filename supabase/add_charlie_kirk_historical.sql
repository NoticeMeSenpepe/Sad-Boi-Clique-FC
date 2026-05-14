-- =====================================================================
-- Add Charlie Kirk to the squad as a historical / departed player.
-- =====================================================================
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
--
-- Charlie Kirk was NoticeMeSenpepe's previous character on the club —
-- the record top scorer in Sad Boi Clique FC history until his contract
-- was cancelled with immediate effect, an event known internally as
-- "The Shambles". He's added here purely as a historical entry: no EA
-- gamertag, no live stats merge, just frozen career numbers, lore and
-- timeline so his profile graphic and lore stay browsable on the squad
-- page alongside Panikova.
--
-- Idempotent — INSERT … ON CONFLICT updates the existing row in place
-- if the script is re-run.
-- =====================================================================

insert into public.players
  (id, name, short_name, number, ea_user, image,
   position, rating, rarity, nationality, stats,
   mock_goals, mock_apps, mock_assists, mock_clean_sheets,
   tags, accent_color, glow_color, archetype, lore, timeline,
   sort_order, visible)
values
  ('charliekirk', 'Charlie Kirk', 'C. KIRK', 69, null,
   '/uploads/charlie-kirk.png',
   'ST', 91, 'icon', 'US',
   '{"PAC":93,"SHO":94,"PAS":70,"DRI":85,"DEF":65,"PHY":78}'::jsonb,
   362, 247, 88, null,
   array['LEFT CLUB','Record Top Scorer','Near-Post Specialist','Defensive Shift','The Shambles'],
   '#c43e2a', 'rgba(196,62,42,0.45)',
   'The Record Holder',
   'The most prolific goalscorer in Sad Boi Clique history. Pacy, devastating, and almost exclusively near-post — the bottom corner was a postcode he lived in. Always put a defensive shift in too, which made it doubly inconvenient when his contract was cancelled with immediate effect. He left for a "broader calling" — namely a podcast, a merch line, and a series of speaking engagements at venues that have asked not to be named. The number 69 shirt has not been reissued.',
   '[
     {"era":"The Awakening","note":"Arrived unannounced. Scored on debut. Then scored again. And again."},
     {"era":"The Near-Post Era","note":"362 goals. An estimated 340 of them in the bottom corner of the near post. Goalkeepers issued a joint open letter requesting variety. He did not vary."},
     {"era":"The Shift","note":"Despite being the team''s top scorer, made it back to track the runner every time. The data is unbelievable. Nobody believes the data."},
     {"era":"The Shambles","note":"Contract cancelled with immediate effect. The dressing room went silent. The training cones, mercifully, were still present. The squad did not recover for some time."},
     {"era":"The Pivot","note":"Now hosts a podcast nobody asked for, sells commemorative tote bags out of a barn in Arizona, and offers ''strategic consultancy'' to a rotating cast of Silicon Valley founders. The Clique has issued no statement."}
   ]'::jsonb,
   210, true)
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
