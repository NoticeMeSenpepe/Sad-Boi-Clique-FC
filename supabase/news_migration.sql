-- =====================================================================
-- Sad Boi Clique FC — Migrate prototype news into Supabase
-- =====================================================================
-- Run this AFTER you've run news_schema.sql.
--
-- The block is idempotent: it only inserts the rows if news_articles is
-- currently empty. Safe to run twice; the second run is a no-op.
--
-- After this lands, the ALL_NEWS / SORTED_NEWS arrays in the front-end
-- become inert — every article on the site is read from the database
-- and editable from the admin panel.
-- =====================================================================
-- The outer DO block uses a tagged dollar-quote ($body$) so the inner
-- $$...$$ literal strings don't accidentally close the block early.
do $body$
begin
  if (select count(*) from public.news_articles) = 0 then

    insert into public.news_articles
      (headline, summary, body, tag, tag_color, kicker, image_url, author, hot, published_at)
    values
    ($$RICCIARDO SPOTTED LEAVING RIVAL CLUB GP UNION FC$$,
     $$The Honeybadger photographed exiting GP Union FC reception in full incognito mode. Sources allege a pay-as-you-play side contract. He still hasn't completed a cross.$$,
     $$Multiple paparazzi captured Ricciardo leaving GP Union FC's reception with the body language of a man who knows. A source close to the boardroom claims a pay-as-you-play arrangement has been in place "for some time". Some fans see this as the deepest betrayal in Sad Boi Clique history. Others, more philosophically inclined, view it as the Honeybadger seeking out additional reps so he might one day, finally, complete a cross. The club has issued no statement. Ricciardo has not returned calls. The cross attempt counter remains, as ever, at zero.$$,
     'BREAKING', '#ff2244', 'Exclusive Investigation', '/uploads/news-ricciardo-rival.png', 'Club Insider', true,
     now() - interval '14 minutes'),

    ($$THE BUS, THE DOG, THE BREED — KARAVAVOV vs PANIKOVA$$,
     $$A roadside dog. A disagreement over breed. A two-year silence. The full story of the bus stop that broke a midfield partnership.$$,
     $$Spirits were low. Heating was too high. A 2009 Pitbull playlist was on. Then, at a roadside stop in Moldova, the dog appeared. Karavavov (quietly): "That is clearly a Border Terrier." Panikova (immediately, aggressively): "That is not a Border Terrier. That is a philosophical mutt." Karavavov produced a blurry phone image. Panikova refused to look, stating "Images are lies." The driver paused the bus to "let the situation breathe." Panikova rose in the aisle: "You see breeds. I see essence." Karavavov: "It has the face of a Border Terrier." Panikova: "It has the soul of something unregistered." Panikova attempted to disembark to consult the dog directly. Intervention was required. They have not spoken since. Panikova privately refers to Karavavov as "Kennel Mind". Karavavov refers to Panikova as "Unverifiable" and, more recently, "methodologically unsound". A club psychologist was brought in. The first session ended after Panikova asked whether the psychologist was "licensed, or just emotionally confident". This morning, a coach used a dog metaphor to demonstrate pressing shape. Both players refused to participate. The session collapsed. A senior source: "We tried to show them a picture of the dog again. It made things worse." Situation ongoing. Dressing room divided — not by tactics, but by the dog.$$,
     'LORE', '#f4a261', 'The Moldova Incident, 2023', '/uploads/news-bus-dog.png', 'Long Reads', true,
     now() - interval '6 hours'),

    ($$PANIKOVA: The Panic Returns?$$,
     $$Sources close to the striker report "unusual energy" ahead of Saturday's fixture. Aura stability readings are at a season-low.$$,
     $$Multiple staff have reported Panikova circling the cone drill at unprecedented speeds. The medical team have escalated the situation to the highest tier. Nanna Tate has issued no statement.$$,
     'INVESTIGATION', '#ff2244', 'Investigation', '/uploads/news-panikova.png', 'Club Insider', false,
     now() - interval '2 hours'),

    ($$GYMSKIN ACTIVATES AURA PULSE IN 4-2 THRILLER$$,
     $$The midfielder's coffee was reportedly at exactly 95 degrees. The correlation is undeniable. Science has confirmed it.$$,
     $$A second-half explosion saw three goals in 21 minutes after Gymskin entered what teammates call "the calibrated zone". The temperature reading remains classified.$$,
     'MATCH REPORT', '#9b5de5', 'Match Report', '/uploads/news-aurapulse.png', 'Tactical Desk', false,
     now() - interval '1 day'),

    ($$DONNY P MISSES SITTER, CLAIMS "WIND RESISTANCE"$$,
     $$Wind speed at time of shot: 0mph. Our analysts have reviewed the footage 47 times. There was no wind. We checked.$$,
     $$Stadium meteorological data shows still air at the moment of impact. Donny P has stood by his testimony. The matter is closed.$$,
     'ANALYSIS', '#e9c46a', 'Investigation', '/uploads/news-donnyp.png', 'Stats Desk', false,
     now() - interval '2 days'),

    ($$RICCIARDO STILL HASN'T COMPLETED A CROSS$$,
     $$Week 23 of our ongoing investigation. Cross attempt count: 1,247. Successful crosses: 0. The mystery deepens.$$,
     $$Despite extensive coaching and a 30% wage increase pegged to crossing accuracy, the Honeybadger remains on a streak that has now eclipsed all known records.$$,
     'ONGOING', '#00c8ff', 'Ongoing Saga', '/uploads/news-ricciardo.png', 'Long Reads', true,
     now() - interval '3 days'),

    ($$PANIKOVA CLAIMS HE SAW SIGNS IN A FERN AGAIN$$,
     $$The striker spotted what he describes as "a clear tactical formation" in the foliage outside the training ground. Worrying.$$,
     $$A botanist was consulted. They confirmed it was, in fact, a fern. Panikova is unconvinced and has scheduled a follow-up.$$,
     'EXCLUSIVE', '#ff2244', 'Exclusive', '/uploads/news-panikova.png', 'Club Insider', false,
     now() - interval '4 days'),

    ($$GYMSKIN REFUSES TO PLAY BEFORE COFFEE CALIBRATION$$,
     $$Kick-off delayed 4 minutes as thermometer was misplaced. Once located and confirmed at 95°, performance was transcendent.$$,
     $$The thermometer in question is now kept in a locked drawer with a single backup. The protocol is non-negotiable.$$,
     'CULTURE', '#9b5de5', 'Inside the Clique', '/uploads/news-coffee.png', 'Inside the Clique', false,
     now() - interval '5 days'),

    ($$KARAVAVOV: "THE RISKY PASS WAS THE RIGHT PASS"$$,
     $$It wasn't. He lost possession 14 times. He scored twice from the resulting chaos. Karavavov remains undefeated in arguments.$$,
     $$Post-match analysis is colourful. Karavavov refused all questions and instead performed a no-look pass into the press microphone.$$,
     'POST-MATCH', '#f4a261', 'Post-Match', '/uploads/news-karavavov.png', 'Press Box', false,
     now() - interval '6 days'),

    ($$TRANSFER SPECIAL: HERE WE GO — CLUB ANNOUNCES NEW DEAL$$,
     $$Multiple sources confirm agreement in principle. Personal terms agreed. Medical scheduled. Nanna Tate approved.$$,
     $$The signature is imminent. The hashtag is locked and loaded. The graphic is ready. Here. We. Go.$$,
     'TRANSFER', '#2a9d8f', 'Transfer Window', '/uploads/pasted-1777417166292-0.png', 'Transfer Desk', false,
     now() - interval '7 days'),

    -- ── Older / archive stories ──
    ($$THE ONE WHERE NANNA TATE BENCHED THE ENTIRE FRONT THREE$$,
     $$A Tuesday training session, three coffees of incorrect temperature, and a decision that defined an era.$$,
     $$It was 9:14am. The coffees were wrong. Nanna Tate stood at the touchline, blew the whistle once, and benched the entire front three before the warm-up had finished. The reasons given, in order: vibes, posture, and "general lack of mood". The session continued in eerie silence. The team won 5-0 that weekend. The front three returned. Nothing was ever explained.$$,
     'LEGACY', '#9b5de5', 'From The Archive', '/uploads/news-coffee.png', 'Long Reads', false,
     now() - interval '60 days'),

    ($$GYMSKIN'S COFFEE SUPPLIER REVEALED — IT'S HIS NAN$$,
     $$After two years of speculation, the source of the 95° beans is finally identified. She lives above a post office.$$,
     $$Sources confirm the supplier is Gymskin's nan, who reportedly roasts in small batches "by feel" and refuses to discuss the temperature on the record. She has, however, agreed to a sponsorship deal that primarily involves more cardigans.$$,
     'LORE', '#f4a261', 'Long Read', '/uploads/news-coffee.png', 'Inside the Clique', false,
     now() - interval '90 days'),

    ($$PANIKOVA: "THE FERN UNDERSTANDS ME"$$,
     $$A 4,000-word interview about a fern. We have published it in full. We do not understand most of it.$$,
     $$Conducted at dawn in the changing-room corridor. Topics covered: foliage, formations, the soul of pre-season, why the away kit "smells of permission". A foundational text for any Sad Boi scholar.$$,
     'EXCLUSIVE', '#ff2244', 'Long-Form Interview', '/uploads/news-panikova.png', 'Press Box', false,
     now() - interval '120 days'),

    ($$RICCIARDO ATTEMPTS A CROSS — PLAYBACK ANALYSIS WEEK 19$$,
     $$Frame-by-frame breakdown of attempt 1,128. Conclusion: it was, technically, a backwards header.$$,
     $$Our analysts re-watched the play 31 times in slow motion. The ball travelled 4.2 metres. Direction: backwards and slightly upward. The attempt has been logged as "ambitious".$$,
     'ANALYSIS', '#e9c46a', 'Cross Watch', '/uploads/news-ricciardo.png', 'Stats Desk', false,
     now() - interval '150 days'),

    ($$KARAVAVOV REFUSES TO ATTEND MEETING ABOUT MEETINGS$$,
     $$The midfielder cited "philosophical concerns about recursion". He sent a paragraph. It was applauded.$$,
     $$The boardroom received a single email. Three sentences. The third sentence was just the word "no" repeated four times in declining font sizes. The meeting was cancelled. Productivity reportedly increased.$$,
     'CULTURE', '#9b5de5', 'Inside the Clique', '/uploads/news-karavavov.png', 'Inside the Clique', false,
     now() - interval '180 days'),

    ($$THE MOLDOVA INCIDENT — ORIGINAL DASHCAM RELEASED$$,
     $$Twelve seconds of footage. One roadside dog. The breed debate that broke a midfield. Now in 4K.$$,
     $$After two years of FOI requests the dashcam footage has been released. The dog is, frustratingly, only visible from behind. Both Karavavov and Panikova claim vindication. The bus driver continues to refuse all interviews.$$,
     'LORE', '#f4a261', 'The Tape', '/uploads/news-bus-dog.png', 'Long Reads', true,
     now() - interval '210 days'),

    ($$DONNY P MISSED A SITTER (AGAIN) — A HISTORICAL TIMELINE$$,
     $$Every recorded sitter since 2022. Reasons given. Wind speeds at time of shot. We have charted them.$$,
     $$Total recorded sitters: 47. Reasons cited: wind (12), sun (8), "the moment was off" (6), boots (5), unspecified vibes (16). Average wind speed at time of incident: 1.1 mph. The data does not support the testimony.$$,
     'ANALYSIS', '#e9c46a', 'Stats Desk', '/uploads/news-donnyp.png', 'Stats Desk', false,
     now() - interval '240 days'),

    ($$OLD RELIABLE: THE GOAL THAT STARTED A RELIGION$$,
     $$A scuffed shot from 8 yards in February. A new fanbase formed before the ball crossed the line.$$,
     $$It was a Tuesday. The shot was, charitably, a mishit. It bounced twice and went in. By Wednesday morning there was a dedicated forum, a tribute scarf, and a sub-section of the Sad Boi support that now exclusively follow Old Reliable. They call themselves The Reliables. They are extremely loud.$$,
     'LEGACY', '#9b5de5', 'Origin Story', '/uploads/pasted-1777417166292-0.png', 'Long Reads', false,
     now() - interval '270 days'),

    ($$THE SCARF ECONOMY — HOW PANIKOVA MERCH DEFIED PHYSICS$$,
     $$The Panikova scarf has appreciated 240% year-on-year. Economists are confused. Fans are scarved.$$,
     $$Resale data shows the Panikova scarf trading hands for figures normally reserved for trading cards. The club has, sensibly, increased production. The aura, regrettably, cannot be cloned.$$,
     'CULTURE', '#9b5de5', 'Market Report', '/uploads/news-panikova.png', 'Market Desk', false,
     now() - interval '300 days'),

    ($$PRE-SEASON IN THE FOG: 8 DAYS, 0 SIGHTINGS, 1 LEGEND$$,
     $$A camp held in such dense fog the players claim they only ever saw each other in flashes. The vibes survived.$$,
     $$Eight days of training. Zero verified sightings of the goalposts. The squad emerged with renewed faith in spatial awareness and a profound mistrust of weather forecasts. Gymskin claims he scored seven, all unconfirmed. Panikova claims he was visited.$$,
     'LORE', '#f4a261', 'Pre-Season Diary', '/uploads/news-aurapulse.png', 'Long Reads', false,
     now() - interval '330 days'),

    ($$THE GREAT KIT DEBATE — WHY THE COLLAR MATTERS$$,
     $$Three weeks of internal discussion. Two prototypes. One collar. We tell the full story of how the home shirt was won.$$,
     $$A polo collar was floated. A polo collar was rejected. A V-neck nearly made the final cut before being stopped at the door by Nanna Tate herself. The eventual collar — restrained, ribbed, briefly contrasting — required 14 mock-ups. We have all of them.$$,
     'CULTURE', '#9b5de5', 'Design Desk', '/uploads/news-bus-dog.png', 'Design Desk', false,
     now() - interval '365 days'),

    ($$THE CALIBRATED ZONE — A SCIENCE PIECE$$,
     $$A peer-reviewed-by-no-one investigation into the 95° threshold. Spoiler: the science is real, the methodology is loose.$$,
     $$We commissioned a thermometer. We commissioned a second thermometer for control purposes. We brewed 28 cups. The data is in. The data is also incomplete. Gymskin declined to participate but did review our findings. He gave them, in his words, "a respectful nod".$$,
     'ANALYSIS', '#e9c46a', 'Long Read', '/uploads/news-coffee.png', 'Stats Desk', false,
     now() - interval '395 days');

  end if;
end $body$;
